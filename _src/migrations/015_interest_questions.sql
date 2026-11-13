-- CHIDAOBA update 015: the "I'm interested" form also asks country, experience, belt, club and why the person wants to come.
-- Safe to run more than once.
create or replace function public.camp_interest(p jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_name  text := left(trim(coalesce(p->>'name', '')), 120);
        v_phone text := left(trim(coalesce(p->>'phone', '')), 40);
        v_email text := lower(trim(coalesce(p->>'email', '')));
        v_camp  text := left(trim(coalesce(p->>'camp', '')), 160);
        v_note  text := left(trim(coalesce(p->>'message', '')), 1500);
        v_ctry  text := left(trim(coalesce(p->>'country', '')), 80);
        v_exp   text := left(trim(coalesce(p->>'experience', '')), 60);
        v_level text := left(trim(coalesce(p->>'level', '')), 60);
        v_club  text := left(trim(coalesce(p->>'club', '')), 120);
        v_msg   text;
begin
  if v_name = '' then
    return jsonb_build_object('error', 'Please fill in your name.');
  end if;
  if length(regexp_replace(v_phone, '[^0-9]', '', 'g')) < 7 then
    return jsonb_build_object('error', 'Please enter your WhatsApp number with the country code.');
  end if;
  if v_email <> '' and v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    return jsonb_build_object('error', 'Please enter a valid email address.');
  end if;
  if coalesce(p->>'consent', '') not in ('true', 'yes', '1') then
    return jsonb_build_object('error', 'Please accept the privacy notice.');
  end if;
  if (select count(*) from public.messages
       where regexp_replace(coalesce(phone, ''), '[^0-9]', '', 'g') = regexp_replace(v_phone, '[^0-9]', '', 'g')
         and created_at > now() - interval '1 hour') >= 5 then
    return jsonb_build_object('error', 'Too many messages. Please try again later or write to us on WhatsApp.');
  end if;
  v_msg := 'Interested in: ' || (case when v_camp = '' then 'Any camp' else v_camp end)
        || (case when v_ctry  = '' then '' else E'\nCountry: ' || v_ctry end)
        || (case when v_exp   = '' then '' else E'\nExperience: ' || v_exp end)
        || (case when v_level = '' then '' else E'\nBelt / level: ' || v_level end)
        || (case when v_club  = '' then '' else E'\nClub: ' || v_club end)
        || (case when v_note  = '' then '' else E'\nWhy: ' || v_note end);
  insert into public.messages (name, email, phone, topic, message, lang)
  values (v_name, v_email, v_phone, 'Camp interest', v_msg, left(p->>'lang', 5));
  return jsonb_build_object('ok', true);
end; $$;
revoke all on function public.camp_interest(jsonb) from public;
grant execute on function public.camp_interest(jsonb) to anon, authenticated;
