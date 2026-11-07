-- CHIDAOBA update 008: the spring 2027 BJJ and grappling camp at the Ilia Gabliani Sports Complex.
-- Paste into Supabase > SQL Editor and run once. Running it again changes nothing.
-- Dates, prices and coaches are added later in Admin > Camps (Edit this camp).
-- Until it has a package with a price, the camp page shows "Dates and prices coming soon" and an email signup.

insert into public.camps (
  slug, title, discipline, status, featured,
  city, country, venue, venue_key, level,
  summary, description,
  currency, deposit_pct,
  included, coaches, ka
) values (
  'bjj-grappling-spring-2027',
  'BJJ and Grappling Camp, Spring 2027',
  'bjj', 'published', true,
  'Mulakhi, Svaneti', 'Georgia', 'Ilia Gabliani Sports Complex', 'mulakhi', 'All levels',
  'BJJ and no-gi grappling in the mountains of Svaneti, with training, accommodation and meals at the Ilia Gabliani Sports Complex.',
  'Our first BJJ and grappling camp takes place in spring 2027 at the Ilia Gabliani Sports Complex in Mulakhi, Upper Svaneti.

Training is on the tatami in the complex''s 800 m² hall, with accommodation and three meals a day in the same building.

Dates, prices and coaches will be announced here first. Leave your email below to hear as soon as registration opens.',
  'EUR', 0,
  '["Training sessions", "Accommodation at the complex", "Three meals a day"]'::jsonb,
  '[]'::jsonb,
  jsonb_build_object(
    'title', 'BJJ და გრეპლინგის ბანაკი, გაზაფხული 2027',
    'summary', 'BJJ და no-gi გრეპლინგი სვანეთის მთებში, ვარჯიშით, საცხოვრებლითა და კვებით ილია გაბლიანის სახელობის სპორტულ კომპლექსში.',
    'description', 'ჩვენი პირველი BJJ და გრეპლინგის ბანაკი 2027 წლის გაზაფხულზე, ილია გაბლიანის სახელობის სპორტულ კომპლექსში, მულახში (ზემო სვანეთი) გაიმართება.

ვარჯიში ტატამზე, კომპლექსის 800 მ² დარბაზში ჩატარდება. საცხოვრებელი და სამჯერადი კვება იმავე შენობაშია.

თარიღებს, ფასებსა და მწვრთნელებს პირველად აქ გამოვაქვეყნებთ. დატოვეთ ელფოსტა ქვემოთ და შეგატყობინებთ, როგორც კი რეგისტრაცია გაიხსნება.',
    'level', 'ყველა დონე',
    'included', '["სავარჯიშო სესიები", "საცხოვრებელი კომპლექსში", "სამჯერადი კვება"]'::jsonb
  )
)
on conflict (slug) do nothing;
