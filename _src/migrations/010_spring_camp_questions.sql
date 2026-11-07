-- CHIDAOBA update 010: questions, "What to bring", age and who it suits, for the spring 2027 BJJ camp.
-- Paste into Supabase > SQL Editor and run once, after updates 008 and 009. Running it again gives the same result.
-- Everything here can be edited later in Admin > Camps > Edit.

update public.camps set
  age_min = 14,
  fit_for = '["Beginners who train regularly", "Experienced BJJ and grappling athletes", "Teenagers from 14, with a parent waiver"]'::jsonb,
  excluded = '["Flights and travel to Svaneti", "Travel and medical insurance"]'::jsonb,
  bring = '[
    {"item": "BJJ gi", "item_ka": "BJJ კიმონო", "shop": "bjj-gi"},
    {"item": "Rashguard", "item_ka": "რაშგარდი", "shop": "rashguard-short-sleeve"},
    {"item": "Fight shorts or spats", "item_ka": "შორტები ან სპატსი", "shop": "fight-shorts"},
    {"item": "Slides for off the mat", "item_ka": "ჩუსტები ტატამის გარეთ", "shop": "slides"},
    {"item": "Water bottle", "item_ka": "წყლის ბოთლი", "shop": "water-bottle"},
    {"item": "Mouthguard", "item_ka": "კბილების დამცავი", "shop": "mouthguard"},
    {"item": "Warm layers and a rain jacket", "item_ka": "თბილი ტანსაცმელი და საწვიმარი"},
    {"item": "Your signed waiver", "item_ka": "ხელმოწერილი ფორმა"},
    {"item": "Any personal medication", "item_ka": "პირადი მედიკამენტები"}
  ]'::jsonb,
  faq = '[
    {"q": "Is this camp for beginners?",
     "a": "Yes, it is open to all levels. Tell us your experience when you request a spot so we can plan groups and training partners.",
     "q_ka": "ეს ბანაკი დამწყებებისთვისაც არის?",
     "a_ka": "დიახ, ბანაკი ყველა დონისთვისაა. ადგილის მოთხოვნისას მიუთითეთ თქვენი გამოცდილება, რომ ჯგუფები და პარტნიორები დავგეგმოთ."},
    {"q": "Is it gi or no-gi?",
     "a": "Both. Bring a gi, and a rashguard with shorts or spats for the no-gi sessions.",
     "q_ka": "კიმონოთი თუ კიმონოს გარეშე?",
     "a_ka": "ორივე. თან იქონიეთ კიმონო, და no-gi ვარჯიშებისთვის რაშგარდი შორტებით ან სპატსით."},
    {"q": "Can teenagers join?",
     "a": "Yes, from 14 years old, with the under 18 waiver signed by a parent or guardian. It includes permission to travel and stay with CHIDAOBA during the camp. Younger children cannot join this camp.",
     "q_ka": "შეუძლიათ მოზარდებს მონაწილეობა?",
     "a_ka": "დიახ, 14 წლიდან, მშობლის ან მეურვის მიერ ხელმოწერილი 18 წლამდე ფორმით. ის მოიცავს ნებართვას, რომ ბანაკის დროს CHIDAOBA-სთან ერთად იმგზავროს და დარჩეს. უმცროსი ასაკის ბავშვები ამ ბანაკში ვერ მიიღებენ მონაწილეობას."},
    {"q": "How do I get to Mulakhi?",
     "a": "Mulakhi is in Upper Svaneti, about half an hour by road from Mestia. You can reach Mestia by a short flight from Tbilisi or by road from Kutaisi or Zugdidi. We send travel details and transfer options to everyone registered.",
     "q_ka": "როგორ ჩავიდე მულახში?",
     "a_ka": "მულახი ზემო სვანეთშია, მესტიიდან დაახლოებით ნახევარი საათის სავალზე. მესტიაში ჩასვლა შეიძლება თბილისიდან მოკლე ფრენით ან გზით ქუთაისიდან ან ზუგდიდიდან. რეგისტრირებულ მონაწილეებს მგზავრობის დეტალებსა და ტრანსფერის ვარიანტებს გავუგზავნით."},
    {"q": "What is the weather like in spring?",
     "a": "Spring in the mountains is cool and can change quickly. Bring warm layers, a rain jacket and good walking shoes.",
     "q_ka": "როგორი ამინდია გაზაფხულზე?",
     "a_ka": "გაზაფხულზე მთაში გრილა და ამინდი სწრაფად იცვლება. თან იქონიეთ თბილი ტანსაცმელი, საწვიმარი და კომფორტული ფეხსაცმელი."},
    {"q": "What if I cancel?",
     "a": "If you cancel 60 days or more before the camp starts, we refund 80% of what you paid. From 59 to 30 days before, we refund 50%. Less than 30 days before, there is no refund. You can give your place to someone else at any time at no cost. If we cancel the camp, you get a full refund.",
     "q_ka": "რა ხდება, თუ გავაუქმებ?",
     "a_ka": "თუ ბანაკის დაწყებამდე 60 ან მეტი დღით ადრე გააუქმებთ, გადახდილი თანხის 80%-ს დაგიბრუნებთ. 59-დან 30 დღემდე ადრე 50%-ს დაგიბრუნებთ. 30 დღეზე ნაკლები დარჩენისას თანხა არ ბრუნდება. ადგილის სხვისთვის გადაცემა ნებისმიერ დროს უფასოა. თუ ბანაკს ჩვენ გავაუქმებთ, თანხას სრულად დაგიბრუნებთ."},
    {"q": "Do I need insurance?",
     "a": "We strongly recommend travel insurance that covers sports injuries. Medical costs are not included in the camp price.",
     "q_ka": "მჭირდება დაზღვევა?",
     "a_ka": "გირჩევთ სამოგზაურო დაზღვევას, რომელიც სპორტულ ტრავმებს ფარავს. სამედიცინო ხარჯები ბანაკის ფასში არ შედის."}
  ]'::jsonb,
  ka = ka || jsonb_build_object(
    'fit_for', '["დამწყებები, რომლებიც რეგულარულად ვარჯიშობენ", "გამოცდილი BJJ და გრეპლინგის სპორტსმენები", "მოზარდები 14 წლიდან, მშობლის ფორმით"]'::jsonb,
    'excluded', '["ფრენა და მგზავრობა სვანეთამდე", "სამოგზაურო და სამედიცინო დაზღვევა"]'::jsonb)
where slug = 'bjj-grappling-spring-2027';
