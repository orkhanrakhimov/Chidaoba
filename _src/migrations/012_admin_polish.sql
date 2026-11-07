-- CHIDAOBA update 012: admin panel and security tidy-up. Safe to run more than once.
-- 1. Admin sessions stay alive while you work (12 hours from the last action, not from sign-in).
-- 2. Change the admin password from the admin panel.
-- 3. Delete a camp request (for privacy requests or spam).
-- 4. Camp photos can no longer be listed by visitors (each photo still opens by its own link).
-- 5. Small hardening: fixed search path on the touch() trigger, no web access to the updates log.

-- 1. sliding sessions. admin_check now writes, so every function that calls it must be volatile.
create or replace function public.admin_check(p_token text) returns text
language plpgsql volatile security definer set search_path = public as $$
declare v text; v_exp timestamptz;
begin
  select s.email, s.expires_at into v, v_exp from public.admin_sessions s join public.admins a on lower(a.email) = s.email
   where s.token = p_token and s.expires_at > now();
  if v is null then raise exception 'Session expired. Please sign in again.'; end if;
  if v_exp < now() + interval '11 hours 50 minutes' then
    update public.admin_sessions set expires_at = now() + interval '12 hours' where token = p_token;
  end if;
  return v;
end; $$;
revoke execute on function public.admin_check(text) from public, anon, authenticated;

alter function public.admin_camps(text) volatile;
alter function public.admin_regs(text, uuid) volatile;
alter function public.admin_subscribers(text) volatile;
alter function public.admin_messages(text) volatile;
alter function public.admin_products(text) volatile;
alter function public.admin_stats(text, int) volatile;

-- 2. change password while signed in (needs the current password)
create or replace function public.admin_change_password(p_token text, p_old text, p_new text) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare v_email text := public.admin_check(p_token); v_hash text;
begin
  select pass_hash into v_hash from public.admin_users where email = v_email;
  if v_hash is null or extensions.crypt(coalesce(p_old, ''), v_hash) <> v_hash then
    perform pg_sleep(0.7);
    return jsonb_build_object('error', 'Your current password is not right.');
  end if;
  if p_new is null or length(p_new) < 10 then
    return jsonb_build_object('error', 'Pick a new password with at least 10 characters.');
  end if;
  if p_new = p_old then
    return jsonb_build_object('error', 'The new password is the same as the current one.');
  end if;
  update public.admin_users set pass_hash = extensions.crypt(p_new, extensions.gen_salt('bf', 10)), updated_at = now() where email = v_email;
  delete from public.admin_sessions where email = v_email and token <> p_token;   -- sign out everywhere else
  return jsonb_build_object('ok', true);
end; $$;
grant execute on function public.admin_change_password(text, text, text) to anon, authenticated;

-- 3. requests: status, note, or delete
create or replace function public.admin_update_reg(p_token text, p_id uuid, p jsonb) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  perform public.admin_check(p_token);
  if p ? 'delete' then delete from public.registrations where id = p_id; return true; end if;
  update public.registrations
     set status     = coalesce(p->>'status', status),
         admin_note = case when p ? 'admin_note' then nullif(p->>'admin_note', '') else admin_note end
   where id = p_id;
  return true;
end; $$;

-- 4. public bucket: files open by their link without a select policy; the policy only allowed listing everything
drop policy if exists camp_images_read on storage.objects;

-- 5. hardening
create or replace function public.touch() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at := now(); return new; end; $$;
do $$ begin
  if to_regclass('public._migrations') is not null then
    revoke all on public._migrations from anon, authenticated;
  end if;
end $$;
