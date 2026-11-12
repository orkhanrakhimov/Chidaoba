-- CHIDAOBA update 013: the camp FAQ now says insurance is required to enter Georgia (law in force since 1 Jan 2026).
-- Safe to run more than once.
update public.camps c
   set faq = (
     select jsonb_agg(
       case when item->>'q' = 'Do I need insurance?' then item || jsonb_build_object(
         'a', 'Yes, if you come from abroad. Since 1 January 2026 Georgia requires every foreign visitor to have health and accident insurance for the whole stay, with cover of at least 30,000 GEL. Choose a policy that also covers sports injuries. Medical costs are not included in the camp price.',
         'a_ka', 'დიახ, თუ უცხოეთიდან ჩამოდიხართ. 2026 წლის 1 იანვრიდან საქართველოში შემოსვლისას ყველა უცხოელ ვიზიტორს მოეთხოვება ჯანმრთელობისა და უბედური შემთხვევის დაზღვევა ყოფნის მთელ პერიოდზე, არანაკლებ 30 000 ლარის ლიმიტით. აირჩიეთ პოლისი, რომელიც სპორტულ ტრავმებსაც ფარავს. სამედიცინო ხარჯები ბანაკის ფასში არ შედის.')
       else item end order by ord)
     from jsonb_array_elements(c.faq) with ordinality as t(item, ord))
 where jsonb_typeof(c.faq) = 'array' and c.faq @> '[{"q": "Do I need insurance?"}]';
