-- =====================================================================
-- CHIDAOBA CULTURE: camps database (Supabase / PostgreSQL)
-- Paste this whole file into Supabase → SQL Editor → New query → Run.
-- Safe to run again: it only creates what is missing and replaces functions.
-- =====================================================================

-- ---------- admins: who may use /admin ----------
create table if not exists public.admins (
  email text primary key
);
insert into public.admins (email) values ('chidaobaculture@gmail.com')
on conflict do nothing;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins a where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', '')));
$$;

-- ---------- camps ----------
create table if not exists public.camps (
  id                   uuid primary key default gen_random_uuid(),
  slug                 text unique not null check (slug ~ '^[a-z0-9-]{3,80}$'),
  title                text not null,
  discipline           text not null default 'bjj' check (discipline in ('bjj','wrestling','judo','chidaoba','other')),
  status               text not null default 'draft' check (status in ('draft','published','sold_out','cancelled','completed')),
  featured             boolean not null default false,
  start_date           date,
  end_date             date,
  city                 text,
  country              text default 'Georgia',
  venue                text,
  level                text,                      -- e.g. "All levels", "Intermediate+"
  summary              text,                      -- one or two sentences for the card
  description          text,                      -- longer text, paragraphs separated by blank lines
  capacity             integer check (capacity is null or capacity > 0),
  currency             text not null default 'EUR' check (currency in ('EUR','GEL','USD')),
  early_bird_deadline  date,
  registration_deadline date,
  deposit_pct          integer not null default 30 check (deposit_pct between 0 and 100),
  payment_days         integer not null default 7 check (payment_days between 1 and 60),
  group_min            integer check (group_min is null or group_min >= 2),
  group_discount_pct   integer not null default 0 check (group_discount_pct between 0 and 50),
  bank_details         text,                      -- shown to people after they register
  packages             jsonb not null default '[]'::jsonb,  -- [{id,name,description,price,early_price}]
  addons               jsonb not null default '[]'::jsonb,  -- [{id,name,price}]
  schedule             jsonb not null default '[]'::jsonb,  -- [{day, items:[{time,title}]}]
  included             jsonb not null default '[]'::jsonb,  -- ["Training sessions", ...]
  excluded             jsonb not null default '[]'::jsonb,
  coaches              jsonb not null default '[]'::jsonb,  -- [{name, role, bio}]
  faq                  jsonb not null default '[]'::jsonb,  -- [{q, a}]
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- ---------- registrations ----------
create table if not exists public.registrations (
  id            uuid primary key default gen_random_uuid(),
  ref           text unique not null,
  camp_id       uuid not null references public.camps(id) on delete cascade,
  created_at    timestamptz not null default now(),
  status        text not null default 'pending' check (status in ('pending','deposit_paid','paid','cancelled','waitlist')),
  full_name     text not null check (length(full_name) between 2 and 120),
  email         text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone         text,
  country       text,
  age           integer check (age is null or age between 6 and 99),
  experience    text,
  level         text,
  club          text,
  package_id    text,
  package_name  text,
  addons        jsonb not null default '[]'::jsonb,
  people        integer not null default 1 check (people between 1 and 30),
  accommodation text,
  notes         text check (notes is null or length(notes) <= 2000),
  unit_price    numeric(10,2),
  total         numeric(10,2),
  deposit       numeric(10,2),
  pay_by        date,
  admin_note    text
);
create index if not exists registrations_camp_idx on public.registrations(camp_id);

-- ---------- security: row-level policies ----------
alter table public.camps enable row level security;
alter table public.registrations enable row level security;
alter table public.admins enable row level security;

drop policy if exists camps_public_read on public.camps;
create policy camps_public_read on public.camps for select
  using (status in ('published','sold_out','completed') or public.is_admin());
drop policy if exists camps_admin_write on public.camps;
create policy camps_admin_write on public.camps for all
  using (public.is_admin()) with check (public.is_admin());

-- visitors never read or write registrations directly; they use register_for_camp()
drop policy if exists regs_admin_all on public.registrations;
create policy regs_admin_all on public.registrations for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists admins_self on public.admins;
create policy admins_self on public.admins for select using (public.is_admin());

-- ---------- public spot counts (numbers only, no personal data) ----------
create or replace function public.camp_counts()
returns table (camp_id uuid, taken integer, waitlist integer)
language sql stable security definer set search_path = public as $$
  select c.id,
         coalesce(sum(r.people) filter (where r.status in ('pending','deposit_paid','paid')), 0)::int,
         coalesce(sum(r.people) filter (where r.status = 'waitlist'), 0)::int
  from public.camps c left join public.registrations r on r.camp_id = c.id
  where c.status in ('published','sold_out','completed')
  group by c.id;
$$;

-- ---------- registration: prices and spots are decided here, not in the browser ----------
create or replace function public.register_for_camp(p jsonb)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  c        public.camps;
  pkg      jsonb;
  ad       jsonb;
  chosen   jsonb := '[]'::jsonb;
  people   int := greatest(1, least(30, coalesce((p->>'people')::int, 1)));
  taken    int;
  early    boolean;
  unit     numeric := 0;
  extras   numeric := 0;
  disc     numeric := 0;
  total    numeric;
  dep      numeric;
  st       text := 'pending';
  newref   text;
  payby    date;
begin
  if coalesce((p->>'consent')::boolean, false) is not true then
    raise exception 'consent_required';
  end if;
  if coalesce(p->>'website', '') <> '' then      -- honeypot
    raise exception 'rejected';
  end if;

  select * into c from public.camps where slug = p->>'camp' and status = 'published' for update;
  if not found then raise exception 'camp_not_open'; end if;
  if c.registration_deadline is not null and current_date > c.registration_deadline then
    raise exception 'registration_closed';
  end if;

  select pk into pkg from jsonb_array_elements(c.packages) pk where pk->>'id' = p->>'package' limit 1;
  if pkg is null then raise exception 'package_required'; end if;

  early := c.early_bird_deadline is not null and current_date <= c.early_bird_deadline
           and nullif(pkg->>'early_price', '') is not null;
  unit := case when early then (pkg->>'early_price')::numeric else coalesce(nullif(pkg->>'price','')::numeric, 0) end;

  for ad in select a from jsonb_array_elements(c.addons) a
            where a->>'id' in (select jsonb_array_elements_text(coalesce(p->'addons', '[]'::jsonb)))
  loop
    extras := extras + coalesce(nullif(ad->>'price','')::numeric, 0);
    chosen := chosen || jsonb_build_array(jsonb_build_object('id', ad->>'id', 'name', ad->>'name', 'price', ad->>'price'));
  end loop;

  total := (unit + extras) * people;
  if c.group_min is not null and people >= c.group_min and c.group_discount_pct > 0 then
    disc := round(total * c.group_discount_pct / 100.0, 2);
    total := total - disc;
  end if;
  dep := round(total * c.deposit_pct / 100.0, 2);

  if c.capacity is not null then
    select coalesce(sum(r.people), 0) into taken from public.registrations r
      where r.camp_id = c.id and r.status in ('pending','deposit_paid','paid');
    if taken + people > c.capacity then st := 'waitlist'; end if;
  end if;

  payby := current_date + c.payment_days;
  newref := 'CHD-' || upper(substr(md5(gen_random_uuid()::text), 1, 6));

  insert into public.registrations (ref, camp_id, status, full_name, email, phone, country, age, experience, level, club,
      package_id, package_name, addons, people, accommodation, notes, unit_price, total, deposit, pay_by)
  values (newref, c.id, st, trim(p->>'full_name'), lower(trim(p->>'email')), p->>'phone', p->>'country',
      nullif(p->>'age','')::int, p->>'experience', p->>'level', p->>'club',
      pkg->>'id', pkg->>'name', chosen, people, p->>'accommodation', p->>'notes', unit, total, dep,
      case when st = 'waitlist' then null else payby end);

  return jsonb_build_object(
    'ref', newref, 'status', st, 'currency', c.currency, 'unit_price', unit, 'early', early,
    'extras', extras, 'people', people, 'discount', disc, 'total', total, 'deposit', dep,
    'deposit_pct', c.deposit_pct,
    'pay_by', case when st = 'waitlist' then null else payby end,
    'bank_details', case when st = 'waitlist' then null else c.bank_details end,
    'camp_title', c.title);
end;
$$;

-- explicit table access (works whether or not "automatically expose new tables" is on)
grant usage on schema public to anon, authenticated;
grant select on public.camps to anon, authenticated;
grant insert, update, delete on public.camps to authenticated;
grant select, update, delete on public.registrations to authenticated;
grant select on public.admins to authenticated;
revoke all on public.registrations from anon;
revoke all on public.admins from anon;
grant execute on function public.camp_counts() to anon, authenticated;
grant execute on function public.register_for_camp(jsonb) to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;

-- keep updated_at fresh
create or replace function public.touch() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end; $$;
drop trigger if exists camps_touch on public.camps;
create trigger camps_touch before update on public.camps for each row execute function public.touch();

-- =====================================================================
-- Update 002: camp photos, venue details and map
-- =====================================================================
alter table public.camps add column if not exists cover_url  text;
alter table public.camps add column if not exists gallery    jsonb not null default '[]'::jsonb;  -- [{url, alt}]
alter table public.camps add column if not exists address    text;
alter table public.camps add column if not exists map_url    text;
alter table public.camps add column if not exists venue_info text;
alter table public.camps add column if not exists venue_key  text;   -- preset venue, e.g. 'mulakhi'

-- public image bucket: anyone can view, only admins can upload / change / delete
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('camp-images', 'camp-images', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 5242880, allowed_mime_types = array['image/jpeg','image/png','image/webp'];

drop policy if exists camp_images_read on storage.objects;
create policy camp_images_read on storage.objects for select using (bucket_id = 'camp-images');
drop policy if exists camp_images_insert on storage.objects;
create policy camp_images_insert on storage.objects for insert to authenticated with check (bucket_id = 'camp-images' and public.is_admin());
drop policy if exists camp_images_update on storage.objects;
create policy camp_images_update on storage.objects for update to authenticated using (bucket_id = 'camp-images' and public.is_admin());
drop policy if exists camp_images_delete on storage.objects;
create policy camp_images_delete on storage.objects for delete to authenticated using (bucket_id = 'camp-images' and public.is_admin());

-- =====================================================================
-- Update 003: our own admin login (does not use Supabase Auth)
-- The password is stored only as a bcrypt hash. Sessions last 12 hours.
-- =====================================================================
create table if not exists public.admin_users (
  email      text primary key,
  pass_hash  text not null,
  updated_at timestamptz not null default now()
);
create table if not exists public.admin_sessions (
  token      text primary key,
  email      text not null,
  expires_at timestamptz not null
);
create table if not exists public.admin_attempts (
  email text not null,
  at    timestamptz not null default now()
);
create table if not exists public.upload_tickets (
  folder     text primary key,
  expires_at timestamptz not null
);
alter table public.admin_users    enable row level security;
alter table public.admin_sessions enable row level security;
alter table public.admin_attempts enable row level security;
alter table public.upload_tickets enable row level security;
revoke all on public.admin_users, public.admin_sessions, public.admin_attempts, public.upload_tickets from anon, authenticated;

-- set or change the admin password (run in the SQL Editor only, never from the website)
create or replace function public.admin_set_password(p_email text, p_password text) returns text
language plpgsql security definer set search_path = public, extensions as $$
begin
  if p_password is null or length(p_password) < 8 or p_password = 'CHANGE-ME' then
    raise exception 'Pick a password with at least 8 characters.';
  end if;
  insert into public.admins (email) values (lower(trim(p_email))) on conflict do nothing;
  insert into public.admin_users (email, pass_hash, updated_at)
  values (lower(trim(p_email)), extensions.crypt(p_password, extensions.gen_salt('bf', 10)), now())
  on conflict (email) do update set pass_hash = excluded.pass_hash, updated_at = now();
  delete from public.admin_sessions where email = lower(trim(p_email));
  delete from public.admin_attempts where email = lower(trim(p_email));
  return 'Password set for ' || lower(trim(p_email)) || '. You can sign in at chidaoba.com/admin now.';
end; $$;
revoke all on function public.admin_set_password(text, text) from public, anon, authenticated;

create or replace function public.admin_login(p_email text, p_password text) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare v_email text := lower(trim(coalesce(p_email, ''))); v_hash text; v_tok text; v_exp timestamptz;
begin
  delete from public.admin_attempts where at < now() - interval '15 minutes';
  if (select count(*) from public.admin_attempts where email = v_email) >= 8 then
    return jsonb_build_object('error', 'Too many tries. Wait 15 minutes and try again.');
  end if;
  select pass_hash into v_hash from public.admin_users where email = v_email;
  if v_hash is null or extensions.crypt(coalesce(p_password, ''), v_hash) <> v_hash then
    insert into public.admin_attempts (email) values (v_email);
    perform pg_sleep(0.7);
    return jsonb_build_object('error', 'Wrong email or password.');
  end if;
  delete from public.admin_sessions where expires_at < now();
  v_tok := encode(extensions.gen_random_bytes(32), 'hex');
  v_exp := now() + interval '12 hours';
  insert into public.admin_sessions values (v_tok, v_email, v_exp);
  delete from public.admin_attempts where email = v_email;
  return jsonb_build_object('token', v_tok, 'email', v_email, 'expires_at', v_exp);
end; $$;

create or replace function public.admin_check(p_token text) returns text
language plpgsql stable security definer set search_path = public as $$
declare v text;
begin
  select s.email into v from public.admin_sessions s join public.admins a on lower(a.email) = s.email
   where s.token = p_token and s.expires_at > now();
  if v is null then raise exception 'Session expired. Please sign in again.'; end if;
  return v;
end; $$;

create or replace function public.admin_logout(p_token text) returns boolean
language sql security definer set search_path = public as $$
  delete from public.admin_sessions where token = p_token; select true;
$$;

create or replace function public.admin_camps(p_token text) returns setof public.camps
language plpgsql stable security definer set search_path = public as $$
begin
  perform public.admin_check(p_token);
  return query select * from public.camps order by start_date desc nulls first;
end; $$;

create or replace function public.admin_save_camp(p_token text, p jsonb) returns public.camps
language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_cols text; r public.camps;
begin
  perform public.admin_check(p_token);
  p := p - 'created_at' - 'updated_at' - 'taken' - 'waitlist';
  v_id := nullif(p->>'id', '')::uuid;
  if v_id is null or not exists (select 1 from public.camps where id = v_id) then
    insert into public.camps (slug, title) values (p->>'slug', p->>'title') returning id into v_id;
  end if;
  select string_agg(quote_ident(column_name), ', ' order by ordinal_position) into v_cols
    from information_schema.columns
   where table_schema = 'public' and table_name = 'camps' and column_name not in ('id', 'created_at', 'updated_at');
  execute format('update public.camps t set (%s) = (select %s from jsonb_populate_record(t, $1) x) where t.id = $2 returning t.*',
                 v_cols, regexp_replace(v_cols, '("?[a-z_]+"?)', 'x.\1', 'g'))
    into r using (p - 'id'), v_id;
  return r;
end; $$;

create or replace function public.admin_delete_camp(p_token text, p_id uuid) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  perform public.admin_check(p_token);
  delete from public.camps where id = p_id;
  return true;
end; $$;

create or replace function public.admin_regs(p_token text, p_camp uuid default null) returns setof public.registrations
language plpgsql stable security definer set search_path = public as $$
begin
  perform public.admin_check(p_token);
  return query select * from public.registrations where p_camp is null or camp_id = p_camp order by created_at desc;
end; $$;

create or replace function public.admin_update_reg(p_token text, p_id uuid, p jsonb) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  perform public.admin_check(p_token);
  update public.registrations
     set status     = coalesce(p->>'status', status),
         admin_note = case when p ? 'admin_note' then p->>'admin_note' else admin_note end
   where id = p_id;
  return true;
end; $$;

-- photo uploads: the admin gets a one-off folder name that works for 15 minutes
create or replace function public.admin_upload_ticket(p_token text) returns text
language plpgsql security definer set search_path = public, extensions as $$
declare f text := 'u' || encode(extensions.gen_random_bytes(12), 'hex');
begin
  perform public.admin_check(p_token);
  delete from public.upload_tickets where expires_at < now();
  insert into public.upload_tickets values (f, now() + interval '15 minutes');
  return f;
end; $$;

create or replace function public.upload_ok(p_name text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.upload_tickets
                  where folder = split_part(p_name, '/', 1) and expires_at > now());
$$;

drop policy if exists camp_images_ticket_insert on storage.objects;
create policy camp_images_ticket_insert on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'camp-images' and public.upload_ok(name));

grant execute on function public.admin_login(text, text), public.admin_logout(text), public.admin_camps(text),
  public.admin_save_camp(text, jsonb), public.admin_delete_camp(text, uuid), public.admin_regs(text, uuid),
  public.admin_update_reg(text, uuid, jsonb), public.admin_upload_ticket(text), public.upload_ok(text)
  to anon, authenticated;
revoke execute on function public.admin_check(text) from public, anon, authenticated;

-- =====================================================================
-- Update 004: richer camp pages (who it's for, what to bring, reviews,
-- Georgian text). Coach photos, package features and Georgian versions of
-- list items live inside the existing JSON columns.
-- =====================================================================
alter table public.camps add column if not exists intensity    integer check (intensity is null or intensity between 1 and 5);
alter table public.camps add column if not exists age_min      integer check (age_min is null or age_min between 5 and 99);
alter table public.camps add column if not exists age_max      integer check (age_max is null or age_max between 5 and 99);
alter table public.camps add column if not exists fit_for      jsonb not null default '[]'::jsonb;  -- ["Beginners with 6+ months", ...]
alter table public.camps add column if not exists bring        jsonb not null default '[]'::jsonb;  -- [{item, item_ka, shop}]
alter table public.camps add column if not exists reviews      jsonb not null default '[]'::jsonb;  -- [{name, from, text, text_ka, rating}]
alter table public.camps add column if not exists ka           jsonb not null default '{}'::jsonb;  -- Georgian: {title, summary, description, level, venue_info, fit_for, included, excluded}
alter table public.camps add column if not exists show_urgency boolean not null default true;

-- =====================================================================
-- Update 005: email signups, contact messages and shop products
-- Run once in Supabase → SQL Editor → New query → Run. Safe to run again.
-- =====================================================================

-- ---------- email signups (newsletter + "tell me about camps") ----------
create table if not exists public.subscribers (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique,
  name       text,
  interests  text[] not null default '{}',     -- camps, bjj, wrestling, judo, shop, news
  source     text,                              -- which form: footer, home, camps, camp page
  lang       text,
  status     text not null default 'active' check (status in ('active', 'unsubscribed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- contact form messages ----------
create table if not exists public.messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  phone      text,
  topic      text,
  message    text not null,
  lang       text,
  status     text not null default 'new' check (status in ('new', 'replied', 'closed')),
  admin_note text,
  created_at timestamptz not null default now()
);

-- ---------- shop products ----------
create table if not exists public.products (
  id             text primary key,                 -- web address, e.g. bjj-gi
  name           text not null,
  name_ka        text,
  description    text,
  description_ka text,
  sport          text not null,                    -- bjj, wrestling, judo, train, gear, lifestyle
  category       text not null,                    -- gis, belts, rash, shorts, ...
  audience       text not null default 'adult' check (audience in ('men', 'women', 'adult', 'kids', 'all')),
  sizes          text[] not null default '{}',
  colours        text[] not null default '{}',
  size_guide     text,
  drawing        text,
  price          numeric check (price is null or price >= 0),
  currency       text not null default 'GEL',
  photo_url      text,
  status         text not null default 'active' check (status in ('active', 'sold_out', 'hidden')),
  sort           integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

alter table public.subscribers enable row level security;
alter table public.messages    enable row level security;
alter table public.products    enable row level security;

-- visitors can read products that are not hidden; signups and messages are never readable from the website
drop policy if exists products_public_read on public.products;
create policy products_public_read on public.products for select using (status <> 'hidden');
grant select on public.products to anon, authenticated;
revoke all on public.subscribers, public.messages from anon, authenticated;

drop trigger if exists products_touch on public.products;
create trigger products_touch before update on public.products for each row execute function public.touch();
drop trigger if exists subscribers_touch on public.subscribers;
create trigger subscribers_touch before update on public.subscribers for each row execute function public.touch();

-- ---------- public: sign up for emails ----------
create or replace function public.subscribe(p jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_email text := lower(trim(p->>'email'));
        v_int text[];
begin
  if v_email is null or length(v_email) > 200 or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    return jsonb_build_object('error', 'Please enter a valid email address.');
  end if;
  if coalesce(p->>'consent', '') not in ('true', 'yes', '1') then
    return jsonb_build_object('error', 'Please accept the privacy notice.');
  end if;
  select coalesce(array_agg(distinct x), '{}') into v_int
    from jsonb_array_elements_text(coalesce(p->'interests', '[]'::jsonb)) x
   where x in ('camps', 'bjj', 'wrestling', 'judo', 'shop', 'news');
  insert into public.subscribers (email, name, interests, source, lang)
  values (v_email, nullif(left(trim(p->>'name'), 120), ''), v_int, left(p->>'source', 40), left(p->>'lang', 5))
  on conflict (email) do update
     set interests = (select coalesce(array_agg(distinct i), '{}') from unnest(public.subscribers.interests || excluded.interests) i),
         name      = coalesce(excluded.name, public.subscribers.name),
         status    = 'active';
  return jsonb_build_object('ok', true);
end; $$;

-- ---------- public: send a contact message ----------
create or replace function public.send_message(p jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_email text := lower(trim(p->>'email'));
begin
  if coalesce(trim(p->>'name'), '') = '' or coalesce(trim(p->>'message'), '') = '' then
    return jsonb_build_object('error', 'Please fill in your name and message.');
  end if;
  if v_email is null or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    return jsonb_build_object('error', 'Please enter a valid email address.');
  end if;
  if coalesce(p->>'consent', '') not in ('true', 'yes', '1') then
    return jsonb_build_object('error', 'Please accept the privacy notice.');
  end if;
  if (select count(*) from public.messages where email = v_email and created_at > now() - interval '1 hour') >= 5 then
    return jsonb_build_object('error', 'Too many messages. Please try again later or write to us on WhatsApp.');
  end if;
  insert into public.messages (name, email, phone, topic, message, lang)
  values (left(trim(p->>'name'), 120), v_email, left(p->>'phone', 40), left(p->>'topic', 60), left(p->>'message', 5000), left(p->>'lang', 5));
  return jsonb_build_object('ok', true);
end; $$;

-- ---------- admin: signups ----------
create or replace function public.admin_subscribers(p_token text) returns setof public.subscribers
language plpgsql stable security definer set search_path = public as $$
begin perform public.admin_check(p_token); return query select * from public.subscribers order by created_at desc; end; $$;

create or replace function public.admin_update_subscriber(p_token text, p_id uuid, p jsonb) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  perform public.admin_check(p_token);
  if p ? 'delete' then delete from public.subscribers where id = p_id; return true; end if;
  update public.subscribers set status = coalesce(p->>'status', status) where id = p_id;
  return true;
end; $$;

-- ---------- admin: messages ----------
create or replace function public.admin_messages(p_token text) returns setof public.messages
language plpgsql stable security definer set search_path = public as $$
begin perform public.admin_check(p_token); return query select * from public.messages order by created_at desc; end; $$;

create or replace function public.admin_update_message(p_token text, p_id uuid, p jsonb) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  perform public.admin_check(p_token);
  if p ? 'delete' then delete from public.messages where id = p_id; return true; end if;
  update public.messages
     set status     = coalesce(p->>'status', status),
         admin_note = case when p ? 'admin_note' then p->>'admin_note' else admin_note end
   where id = p_id;
  return true;
end; $$;

-- ---------- admin: products ----------
create or replace function public.admin_products(p_token text) returns setof public.products
language plpgsql stable security definer set search_path = public as $$
begin perform public.admin_check(p_token); return query select * from public.products order by sport, category, sort, name; end; $$;

create or replace function public.admin_save_product(p_token text, p jsonb) returns public.products
language plpgsql security definer set search_path = public as $$
declare v_old text := nullif(p->>'old_id', ''); v_id text := p->>'id'; r public.products;
begin
  perform public.admin_check(p_token);
  if v_id is null or v_id !~ '^[a-z0-9-]{2,80}$' then raise exception 'Web address: lowercase letters, numbers and dashes only.'; end if;
  if v_old is not null and v_old <> v_id then
    update public.products set id = v_id where id = v_old;
  end if;
  insert into public.products as t (id, name, name_ka, description, description_ka, sport, category, audience, sizes, colours,
                                    size_guide, drawing, price, currency, photo_url, status, sort)
  values (v_id, p->>'name', nullif(p->>'name_ka', ''), nullif(p->>'description', ''), nullif(p->>'description_ka', ''),
          p->>'sport', p->>'category', coalesce(nullif(p->>'audience', ''), 'adult'),
          coalesce((select array_agg(x) from jsonb_array_elements_text(p->'sizes') x), '{}'),
          coalesce((select array_agg(x) from jsonb_array_elements_text(p->'colours') x), '{}'),
          nullif(p->>'size_guide', ''), nullif(p->>'drawing', ''), nullif(p->>'price', '')::numeric,
          coalesce(nullif(p->>'currency', ''), 'GEL'), nullif(p->>'photo_url', ''), coalesce(nullif(p->>'status', ''), 'active'),
          coalesce(nullif(p->>'sort', '')::int, 0))
  on conflict (id) do update set
    name = excluded.name, name_ka = excluded.name_ka, description = excluded.description, description_ka = excluded.description_ka,
    sport = excluded.sport, category = excluded.category, audience = excluded.audience, sizes = excluded.sizes, colours = excluded.colours,
    size_guide = excluded.size_guide, drawing = excluded.drawing, price = excluded.price, currency = excluded.currency,
    photo_url = excluded.photo_url, status = excluded.status, sort = excluded.sort
  returning t.* into r;
  return r;
end; $$;

create or replace function public.admin_delete_product(p_token text, p_id text) returns boolean
language plpgsql security definer set search_path = public as $$
begin perform public.admin_check(p_token); delete from public.products where id = p_id; return true; end; $$;

grant execute on function public.subscribe(jsonb), public.send_message(jsonb),
  public.admin_subscribers(text), public.admin_update_subscriber(text, uuid, jsonb),
  public.admin_messages(text), public.admin_update_message(text, uuid, jsonb),
  public.admin_products(text), public.admin_save_product(text, jsonb), public.admin_delete_product(text, text)
  to anon, authenticated;

-- ---------- the current shop catalogue (only added if missing, your edits are kept) ----------
insert into public.products (id, name, name_ka, description, description_ka, sport, category, audience, sizes, colours, size_guide, drawing, sort) values
  ('bjj-gi', 'BJJ gi', 'BJJ კიმონო', 'Pearl weave jacket, ripstop pants, reinforced collar. Men''s cut.', 'Pearl weave ქურთუკი, ripstop შარვალი, გამაგრებული საყელო. მამაკაცის თარგი.', 'bjj', 'gis', 'men', array['A0','A1','A2','A3','A4','A5']::text[], array['White','Blue','Black']::text[], 'gi', 'gi', 0),
  ('women-s-bjj-gi', 'Women''s BJJ gi', 'ქალის BJJ კიმონო', 'Cut for women: shorter jacket, tapered sleeves and pants.', 'ქალებისთვის: უფრო მოკლე ქურთუკი, დავიწროებული სახელოები და შარვალი.', 'bjj', 'gis', 'women', array['F1','F2','F3','F4']::text[], array['White','Blue','Black']::text[], 'gi_w', 'gi', 10),
  ('kids-bjj-gi', 'Kids BJJ gi', 'საბავშვო BJJ კიმონო', 'Light, tough gi for kids, easy to wash.', 'მსუბუქი და გამძლე კიმონო ბავშვებისთვის, ადვილად ირეცხება.', 'bjj', 'gis', 'kids', array['M000','M00','M0','M1','M2','M3','M4']::text[], array['White','Blue']::text[], 'gi_k', 'gi', 20),
  ('bjj-belt', 'BJJ belt', 'BJJ ქამარი', 'Cotton rank belt for adults.', 'ბამბის ქამარი ზრდასრულებისთვის.', 'bjj', 'belts', 'adult', array['A1','A2','A3','A4']::text[], array['White','Blue','Purple','Brown','Black']::text[], 'belt', 'belt', 30),
  ('kids-bjj-belt', 'Kids BJJ belt', 'საბავშვო BJJ ქამარი', 'Cotton rank belt in kids'' colours.', 'ბამბის ქამარი საბავშვო ფერებში.', 'bjj', 'belts', 'kids', array['M0','M1','M2','M3','M4']::text[], array['White','Grey','Yellow','Orange','Green']::text[], 'belt_k', 'belt', 40),
  ('rashguard-long-sleeve', 'Rashguard, long sleeve', 'რაშგარდი, გრძელი სახელოთი', 'Tight fit, flatlock seams, print that does not crack.', 'მჭიდრო მორგება, ბრტყელი ნაკერები, ბეჭდვა, რომელიც არ სკდება.', 'train', 'rash', 'men', array['XS','S','M','L','XL','XXL']::text[], array['Black','White','Red']::text[], 'top', 'rash', 50),
  ('rashguard-short-sleeve', 'Rashguard, short sleeve', 'რაშგარდი, მოკლე სახელოთი', 'Same fabric and fit, for warm gyms and summer camps.', 'იგივე ქსოვილი და ჭრილი, თბილი დარბაზებისა და ზაფხულის ბანაკებისთვის.', 'train', 'rash', 'men', array['XS','S','M','L','XL','XXL']::text[], array['Black','White','Red']::text[], 'top', 'rash_ss', 60),
  ('women-s-rashguard', 'Women''s rashguard', 'ქალის რაშგარდი', 'Long sleeve, cut for women, slightly longer body.', 'გრძელი სახელო, ქალებისთვის შეკერილი, ოდნავ გრძელი ტანით.', 'train', 'rash', 'women', array['XS','S','M','L','XL']::text[], array['Black','White','Red']::text[], 'top_w', 'rash', 70),
  ('kids-rashguard', 'Kids rashguard', 'საბავშვო რაშგარდი', 'Long sleeve rashguard sized for kids.', 'გრძელსახელოიანი რაშგარდი ბავშვებისთვის.', 'train', 'rash', 'kids', array['4-5 y','6-7 y','8-9 y','10-11 y','12-13 y']::text[], array['Black','Red']::text[], 'kids', 'rash', 80),
  ('fight-shorts', 'Fight shorts', 'საჭიდაო შორტები', 'Stretch fabric, no pockets, secure waistband with drawcord.', 'ელასტიური ქსოვილი, ჯიბეების გარეშე, მყარი სარტყელი თასმით.', 'train', 'shorts', 'men', array['28','30','32','34','36','38']::text[], array['Black','Red']::text[], 'shorts', 'shorts', 90),
  ('spats', 'Spats', 'სპატსები', 'Full length compression leggings for no-gi, wrestling and MMA.', 'სრული სიგრძის კომპრესიული ლეგინსი no-gi-სთვის, ჭიდაობისა და MMA-სთვის.', 'train', 'compress', 'men', array['XS','S','M','L','XL','XXL']::text[], array['Black']::text[], 'top', 'spats', 100),
  ('compression-shorts', 'Compression shorts', 'კომპრესიული შორტები', 'Base layer shorts worn under fight shorts, singlets or a gi.', 'ქვედა ფენის შორტები, რომლებიც იცმევა შორტების, ტრიკოს ან კიმონოს ქვეშ.', 'train', 'compress', 'adult', array['XS','S','M','L','XL','XXL']::text[], array['Black']::text[], 'top', 'cshorts', 110),
  ('women-s-fight-shorts', 'Women''s fight shorts', 'ქალის შორტები', 'Shorter leg, stretch fabric, wide waistband.', 'მოკლე ტოტი, ელასტიური ქსოვილი, განიერი სარტყელი.', 'train', 'shorts', 'women', array['XS','S','M','L','XL']::text[], array['Black']::text[], 'top_w', 'shorts', 120),
  ('women-s-leggings', 'Women''s leggings', 'ქალის ლეგინსი', 'High waist compression leggings for training.', 'მაღალწელიანი კომპრესიული ლეგინსი ვარჯიშისთვის.', 'train', 'compress', 'women', array['XS','S','M','L','XL']::text[], array['Black']::text[], 'top_w', 'spats', 130),
  ('kids-fight-shorts', 'Kids fight shorts', 'საბავშვო შორტები', 'Stretch shorts with an elastic waist.', 'ელასტიური შორტები რეზინიანი წელით.', 'train', 'shorts', 'kids', array['4-5 y','6-7 y','8-9 y','10-11 y','12-13 y']::text[], array['Black']::text[], 'kids', 'shorts', 140),
  ('wrestling-singlet', 'Wrestling singlet', 'საჭიდაო ტრიკო', 'Competition cut for freestyle and Greco-Roman.', 'საშეჯიბრო ჭრილი თავისუფალი და ბერძნულ-რომაული ჭიდაობისთვის.', 'wrestling', 'singlets', 'adult', array['XS','S','M','L','XL','XXL']::text[], array['Red','Blue','Black']::text[], 'top', 'singlet', 150),
  ('kids-wrestling-singlet', 'Kids wrestling singlet', 'საბავშვო საჭიდაო ტრიკო', 'Competition singlet sized for kids.', 'საშეჯიბრო ტრიკო ბავშვებისთვის.', 'wrestling', 'singlets', 'kids', array['4-5 y','6-7 y','8-9 y','10-11 y','12-13 y']::text[], array['Red','Blue']::text[], 'kids', 'singlet', 160),
  ('wrestling-shoes', 'Wrestling shoes', 'საჭიდაო ფეხსაცმელი', 'Lightweight, split sole, ankle support.', 'მსუბუქი, გაყოფილი ძირით, კოჭის მხარდაჭერით.', 'wrestling', 'shoes', 'adult', array['EU 38','EU 39','EU 40','EU 41','EU 42','EU 43','EU 44','EU 45','EU 46','EU 47']::text[], array['Black','Red']::text[], 'shoes', 'shoe', 170),
  ('kids-wrestling-shoes', 'Kids wrestling shoes', 'საბავშვო საჭიდაო ფეხსაცმელი', 'Light shoes with good grip for young wrestlers.', 'მსუბუქი ფეხსაცმელი კარგი მოჭიდებით ახალგაზრდა მოჭიდავეებისთვის.', 'wrestling', 'shoes', 'kids', array['EU 30','EU 31','EU 32','EU 33','EU 34','EU 35','EU 36','EU 37']::text[], array['Black','Red']::text[], 'shoes', 'shoe', 180),
  ('headgear', 'Headgear', 'ყურის დამცავი', 'Ear guards for wrestling and grappling. Adjustable straps.', 'ყურის დამცავი ჭიდაობისა და გრეპლინგისთვის. რეგულირებადი თასმებით.', 'wrestling', 'protect', 'all', array['Youth','Adult']::text[], array['Black','Red']::text[], null, 'headgear', 190),
  ('knee-pads', 'Knee pads', 'მუხლის დამცავები', 'Low profile pads for shots and scrambles. Sold as a pair.', 'თხელი დამცავები გასვლებისა და ბრძოლისთვის. იყიდება წყვილად.', 'wrestling', 'protect', 'all', array['XS','S','M','L']::text[], array['Black']::text[], null, 'knee', 200),
  ('judogi', 'Judogi', 'ძიუდოს კიმონო', 'Double weave judogi for training and grading.', 'ორმაგი ქსოვის კიმონო ვარჯიშისა და საატესტაციოდ.', 'judo', 'judogi', 'adult', array['160 cm','170 cm','180 cm','190 cm','200 cm']::text[], array['White','Blue']::text[], 'judogi', 'gi', 210),
  ('kids-judogi', 'Kids judogi', 'საბავშვო ძიუდოს კიმონო', 'Single weave judogi for kids, light and durable.', 'ერთმაგი ქსოვის კიმონო ბავშვებისთვის, მსუბუქი და გამძლე.', 'judo', 'judogi', 'kids', array['110 cm','120 cm','130 cm','140 cm','150 cm']::text[], array['White']::text[], 'judogi', 'gi', 220),
  ('judo-belt', 'Judo belt', 'ძიუდოს ქამარი', 'Cotton rank belt for adults.', 'ბამბის ქამარი ზრდასრულებისთვის.', 'judo', 'jbelts', 'adult', array['240 cm','260 cm','280 cm','300 cm']::text[], array['White','Yellow','Orange','Green','Blue','Brown','Black']::text[], 'jbelt', 'belt', 230),
  ('kids-judo-belt', 'Kids judo belt', 'საბავშვო ძიუდოს ქამარი', 'Cotton rank belt for kids.', 'ბამბის ქამარი ბავშვებისთვის.', 'judo', 'jbelts', 'kids', array['180 cm','200 cm','220 cm']::text[], array['White','Yellow','Orange','Green','Blue']::text[], 'jbelt', 'belt', 240),
  ('gear-bag', 'Gear bag', 'სპორტული ჩანთა', 'Large duffel with a separate wet compartment for your gi and shoes.', 'დიდი სპორტული ჩანთა სველი ნივთებისთვის ცალკე განყოფილებით, კიმონოსა და ფეხსაცმლისთვის.', 'gear', 'bags', 'all', array['One size']::text[], array['Black']::text[], null, 'bag', 250),
  ('backpack', 'Backpack', 'ზურგჩანთა', 'Daily training backpack with laptop sleeve and shoe pocket.', 'ყოველდღიური სავარჯიშო ზურგჩანთა ლეპტოპისა და ფეხსაცმლის განყოფილებით.', 'gear', 'bags', 'all', array['One size']::text[], array['Black']::text[], null, 'backpack', 260),
  ('mouthguard', 'Mouthguard', 'კაპა', 'Boil and bite fit, with a ventilated case.', 'ადუღება-მორგების ტიპის, ვენტილირებადი ქეისით.', 'gear', 'protection', 'all', array['Junior','Adult']::text[], array['Black','Clear']::text[], null, 'mouth', 270),
  ('finger-tape', 'Finger tape', 'თითების ტეიპი', 'Cotton tape for fingers and joints. Pack of 4 rolls.', 'ბამბის ტეიპი თითებისა და სახსრებისთვის. 4 რულონი შეკვრაში.', 'gear', 'training', 'all', array['0.8 cm','1.3 cm','2.5 cm']::text[], array['White']::text[], null, 'tape', 280),
  ('gym-towel', 'Gym towel', 'სპორტული პირსახოცი', 'Quick dry microfibre towel.', 'სწრაფად შრობადი მიკროფიბრის პირსახოცი.', 'gear', 'training', 'all', array['One size']::text[], array['Black','Red']::text[], null, 'towel', 290),
  ('slides', 'Slides', 'ჩუსტები', 'For walking off the mat. Keep the mat clean.', 'ხალიჩიდან გასასვლელად. ხალიჩა სუფთა დარჩება.', 'gear', 'training', 'all', array['EU 38-39','EU 40-41','EU 42-43','EU 44-45','EU 46-47']::text[], array['Black']::text[], null, 'slides', 300),
  ('water-bottle', 'Water bottle', 'წყლის ბოთლი', 'Stainless steel, 750 ml, keeps water cold.', 'უჟანგავი ფოლადი, 750 მლ, წყალს ცივად ინახავს.', 'gear', 'training', 'all', array['One size']::text[], array['Black','White']::text[], null, 'bottle', 310),
  ('hoodie', 'Hoodie', 'ჰუდი', 'Heavy cotton, relaxed fit.', 'სქელი ბამბა, თავისუფალი ჭრილი.', 'lifestyle', 'tops', 'adult', array['XS','S','M','L','XL','XXL']::text[], array['Black','White','Red']::text[], 'top', 'hoodie', 320),
  ('t-shirt', 'T-shirt', 'მაისური', 'Heavyweight cotton T-shirt.', 'სქელი ბამბის მაისური.', 'lifestyle', 'tops', 'adult', array['XS','S','M','L','XL','XXL']::text[], array['Black','White','Red']::text[], 'top', 'tshirt', 330),
  ('sweatshirt', 'Sweatshirt', 'სვიტშოტი', 'Crewneck sweatshirt.', 'მრგვალყელიანი სვიტერი.', 'lifestyle', 'tops', 'adult', array['XS','S','M','L','XL','XXL']::text[], array['Black','Grey']::text[], 'top', 'sweat', 340),
  ('women-s-t-shirt', 'Women''s T-shirt', 'ქალის მაისური', 'Fitted cotton T-shirt, cut for women.', 'მორგებული ბამბის მაისური ქალებისთვის.', 'lifestyle', 'tops', 'women', array['XS','S','M','L','XL']::text[], array['Black','White']::text[], 'top_w', 'tshirt', 350),
  ('kids-hoodie', 'Kids hoodie', 'საბავშვო ჰუდი', 'Soft heavy cotton hoodie for kids.', 'რბილი, მძიმე ბამბის ჰუდი ბავშვებისთვის.', 'lifestyle', 'tops', 'kids', array['4-5 y','6-7 y','8-9 y','10-11 y','12-13 y']::text[], array['Black','Red']::text[], 'kids', 'hoodie', 360),
  ('kids-t-shirt', 'Kids T-shirt', 'საბავშვო მაისური', 'Cotton T-shirt with the CHIDAOBA logo.', 'ბამბის მაისური CHIDAOBA-ს ლოგოთი.', 'lifestyle', 'tops', 'kids', array['4-5 y','6-7 y','8-9 y','10-11 y','12-13 y']::text[], array['Black','White']::text[], 'kids', 'tshirt', 370),
  ('track-pants', 'Track pants', 'სპორტული შარვალი', 'Tapered joggers with zip pockets.', 'ვიწროვდება ქვემოთ, ელვაშესაკრავიანი ჯიბეებით.', 'lifestyle', 'bottoms', 'adult', array['XS','S','M','L','XL','XXL']::text[], array['Black','Grey']::text[], 'top', 'pants', 380),
  ('cap', 'Cap', 'კეპი', 'Cotton cap with embroidered logo.', 'ბამბის კეპი ნაქარგი ლოგოთი.', 'lifestyle', 'acc', 'all', array['One size']::text[], array['Black','White']::text[], null, 'cap', 390),
  ('beanie', 'Beanie', 'ქუდი', 'Knitted beanie with embroidered logo.', 'ნაქსოვი ქუდი ნაქარგი ლოგოთი.', 'lifestyle', 'acc', 'all', array['One size']::text[], array['Black','Red']::text[], null, 'beanie', 400),
  ('tote-bag', 'Tote bag', 'ტილოს ჩანთა', 'Heavy canvas tote bag.', 'სქელი ტილოს ჩანთა.', 'lifestyle', 'acc', 'all', array['One size']::text[], array['Natural','Black']::text[], null, 'tote', 410)
on conflict (id) do nothing;

-- =====================================================================
-- Update 006: instant "thank you" email for new email signups
-- Sends through Resend (resend.com). Nothing is sent until you add your
-- Resend key (step at the bottom). Safe to run again.
-- =====================================================================
create extension if not exists pg_net;

-- who the email comes from (change if you like; the domain must be verified in Resend)
create table if not exists public.mail_settings (
  id        int primary key default 1 check (id = 1),
  from_addr text not null default 'CHIDAOBA <hello@chidaoba.com>',
  reply_to  text not null default 'chidaobaculture@gmail.com',
  enabled   boolean not null default true
);
insert into public.mail_settings (id) values (1) on conflict (id) do nothing;
alter table public.mail_settings enable row level security;
revoke all on public.mail_settings from anon, authenticated;

alter table public.subscribers add column if not exists welcomed_at timestamptz;

-- the email text, in English or Georgian
create or replace function public.welcome_email(s public.subscribers) returns jsonb
language plpgsql stable set search_path = public as $$
declare ka boolean := coalesce(s.lang, 'en') = 'ka'; body text;
begin
  if ka then
    body := '<p>გამარჯობა,</p>'
         || '<p>მადლობა გამოწერისთვის. ახალი ბანაკებისა და ახალი პროდუქციის შესახებ პირველი შეიტყობთ.</p>'
         || '<p>კითხვა თუ გაქვთ, უპასუხეთ ამ წერილს.</p>'
         || '<p>CHIDAOBA<br><a href="https://www.instagram.com/chidaobaculture/" style="color:#1e1e1e">@chidaobaculture</a> · <a href="https://chidaoba.com/ka/" style="color:#1e1e1e">chidaoba.com</a></p>'
         || '<p style="color:#8a8a85;font-size:12px">გამოწერის გასაუქმებლად უპასუხეთ სიტყვით „unsubscribe“.</p>';
    return jsonb_build_object('subject', 'მოგესალმებით CHIDAOBA-ში', 'html', '<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:#1e1e1e;max-width:560px">' || body || '</div>');
  end if;
  body := '<p>Hi,</p>'
       || '<p>Thanks for signing up. You will be the first to know about new camps and new products.</p>'
       || '<p>Any questions? Just reply to this email.</p>'
       || '<p>CHIDAOBA<br><a href="https://www.instagram.com/chidaobaculture/" style="color:#1e1e1e">@chidaobaculture</a> · <a href="https://chidaoba.com/" style="color:#1e1e1e">chidaoba.com</a></p>'
       || '<p style="color:#8a8a85;font-size:12px">To unsubscribe, reply with “unsubscribe”.</p>';
  return jsonb_build_object('subject', 'Welcome to CHIDAOBA', 'html', '<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:#1e1e1e;max-width:560px">' || body || '</div>');
end; $$;

-- send it right after a new signup is saved
create or replace function public.send_welcome() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
declare k text; m public.mail_settings; e jsonb;
begin
  select * into m from public.mail_settings where id = 1;
  if m is null or not m.enabled then return new; end if;
  select decrypted_secret into k from vault.decrypted_secrets where name = 'resend_api_key' limit 1;
  if k is null then return new; end if;                       -- no key yet: do nothing
  -- simple protection against abuse: at most 60 welcome emails an hour
  if (select count(*) from public.subscribers where welcomed_at > now() - interval '1 hour') >= 60 then return new; end if;
  e := public.welcome_email(new);
  perform net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object('Authorization', 'Bearer ' || k, 'Content-Type', 'application/json'),
    body := jsonb_build_object('from', m.from_addr, 'to', jsonb_build_array(new.email), 'reply_to', m.reply_to,
                               'subject', e->>'subject', 'html', e->>'html'));
  update public.subscribers set welcomed_at = now() where id = new.id;
  return new;
exception when others then
  return new;                                                  -- never block a signup because of email
end; $$;

drop trigger if exists subscribers_welcome on public.subscribers;
create trigger subscribers_welcome after insert on public.subscribers for each row execute function public.send_welcome();

-- =====================================================================
-- LAST STEP (only once, after you have your Resend key):
-- replace re_XXXX with your key, select just the line below and press Run.
--
--   select vault.create_secret('re_XXXX', 'resend_api_key');
--
-- To turn the email off later:  update public.mail_settings set enabled = false;
-- To change the sender:          update public.mail_settings set from_addr = 'CHIDAOBA <hello@chidaoba.com>';
-- =====================================================================
