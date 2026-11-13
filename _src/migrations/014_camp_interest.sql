-- CHIDAOBA update 014: "I'm interested" form on the camps page, and the camp FAQ on insurance.
-- Safe to run more than once.

-- A short form: name, WhatsApp number, which camp. It lands in Messages in the admin panel.
create or replace function public.camp_interest(p jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_name  text := left(trim(coalesce(p->>'name', '')), 120);
        v_phone text := left(trim(coalesce(p->>'phone', '')), 40);
        v_email text := lower(trim(coalesce(p->>'email', '')));
        v_camp  text := left(trim(coalesce(p->>'camp', '')), 160);
        v_note  text := left(trim(coalesce(p->>'message', '')), 1000);
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
  insert into public.messages (name, email, phone, topic, message, lang)
  values (v_name, v_email, v_phone, 'Camp interest',
          'Interested in: ' || (case when v_camp = '' then 'Any camp' else v_camp end) || (case when v_note = '' then '' else E'\n' || v_note end),
          left(p->>'lang', 5));
  return jsonb_build_object('ok', true);
end; $$;
revoke all on function public.camp_interest(jsonb) from public;
grant execute on function public.camp_interest(jsonb) to anon, authenticated;

-- Camp FAQ: the camp strongly recommends insurance; the entry rules are mentioned as something to check.
update public.camps c
   set faq = (
     select jsonb_agg(
       case when item->>'q' = 'Do I need insurance?' then item || jsonb_build_object(
         'a', 'We strongly recommend travel insurance that covers sports injuries. Medical costs are not included in the camp price. Georgia''s entry rules also call for health and accident cover of at least 30,000 GEL for foreign visitors, so check them before you fly.',
         'a_ka', 'გირჩევთ სამოგზაურო დაზღვევას, რომელიც სპორტულ ტრავმებს ფარავს. სამედიცინო ხარჯები ბანაკის ფასში არ შედის. საქართველოში შემოსვლის წესები უცხოელი ვიზიტორებისგან ასევე ითხოვს ჯანმრთელობისა და უბედური შემთხვევის დაზღვევას არანაკლებ 30 000 ლარის ლიმიტით, ამიტომ გამგზავრებამდე გადაამოწმეთ.')
       else item end order by ord)
     from jsonb_array_elements(c.faq) with ordinality as t(item, ord))
 where jsonb_typeof(c.faq) = 'array' and c.faq @> '[{"q": "Do I need insurance?"}]';

-- Meals: three to four a day (text of the camp, English and Georgian).
update public.camps
   set description = replace(description, 'three meals a day', 'three to four meals a day'),
       included    = replace(included::text, 'Three meals a day', 'Three to four meals a day')::jsonb,
       ka          = replace(ka::text, 'სამჯერადი კვება', 'დღეში 3-4 კვება')::jsonb
 where description like '%three meals a day%' or included::text like '%Three meals a day%' or ka::text like '%სამჯერადი კვება%';
