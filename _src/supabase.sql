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
