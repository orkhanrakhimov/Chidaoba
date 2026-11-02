-- =====================================================================
-- CHIDAOBA CULTURE — camps database (Supabase / PostgreSQL)
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
-- Update 002 — camp photos, venue details and map
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
