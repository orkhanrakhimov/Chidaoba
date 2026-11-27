-- 022: welcome email sending made traceable, and sent to people who signed up before sending was switched on.
--  * welcome_send(id): sends the welcome email once, records the request id or the error.
--  * the signup trigger uses it; subscribe() also uses it when an address that never got the email signs up again.
--  * subscribe() now says whether the address was already on the list, so the site can show it.
-- Safe to run twice.

alter table public.subscribers add column if not exists welcome_req bigint;
alter table public.subscribers add column if not exists welcome_error text;

create or replace function public.welcome_send(p_id uuid) returns void
language plpgsql security definer set search_path = public, extensions as $$
declare k text; m public.mail_settings; e jsonb; s public.subscribers; rid bigint;
begin
  select * into s from public.subscribers where id = p_id;
  if s.id is null or s.status <> 'active' or s.welcomed_at is not null then return; end if;
  select * into m from public.mail_settings where id = 1;
  if m.id is null or not m.enabled then
    update public.subscribers set welcome_error = 'sending switched off' where id = p_id; return;
  end if;
  select decrypted_secret into k from vault.decrypted_secrets where name = 'resend_api_key' limit 1;
  if k is null then
    update public.subscribers set welcome_error = 'no email key' where id = p_id; return;
  end if;
  if (select count(*) from public.subscribers where welcomed_at > now() - interval '1 hour') >= 60 then
    update public.subscribers set welcome_error = 'hourly limit' where id = p_id; return;
  end if;
  e := public.welcome_email(s);
  select net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object('Authorization', 'Bearer ' || k, 'Content-Type', 'application/json'),
    body := jsonb_build_object('from', m.from_addr, 'to', jsonb_build_array(s.email), 'reply_to', m.reply_to,
                               'subject', e->>'subject', 'html', e->>'html',
                               'headers', jsonb_build_object('List-Unsubscribe', '<' || (e->>'unsubscribe') || '>'))) into rid;
  update public.subscribers set welcomed_at = now(), welcome_req = rid, welcome_error = null where id = p_id;
exception when others then
  update public.subscribers set welcome_error = left(sqlerrm, 200) where id = p_id;   -- never block a signup
end; $$;
revoke all on function public.welcome_send(uuid) from public, anon, authenticated;

create or replace function public.send_welcome() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
begin
  perform public.welcome_send(new.id);
  return new;
exception when others then
  return new;
end; $$;
drop trigger if exists subscribers_welcome on public.subscribers;
create trigger subscribers_welcome after insert on public.subscribers for each row execute function public.send_welcome();

create or replace function public.subscribe(p jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_email text := lower(trim(p->>'email'));
        v_int text[];
        v_old public.subscribers;
        v_id uuid;
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
  select * into v_old from public.subscribers where email = v_email;
  insert into public.subscribers (email, name, interests, source, lang)
  values (v_email, nullif(left(trim(p->>'name'), 120), ''), v_int, left(p->>'source', 40), left(p->>'lang', 5))
  on conflict (email) do update
     set interests = (select coalesce(array_agg(distinct i), '{}') from unnest(public.subscribers.interests || excluded.interests) i),
         name      = coalesce(excluded.name, public.subscribers.name),
         status    = 'active'
  returning id into v_id;
  if v_old.id is not null then
    perform public.welcome_send(v_id);   -- only sends if this address never got the welcome email
  end if;
  return jsonb_build_object('ok', true, 'email', v_email,
                            'already', v_old.id is not null and v_old.status = 'active');
end; $$;
