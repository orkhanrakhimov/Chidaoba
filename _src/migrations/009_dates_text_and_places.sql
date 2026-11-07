-- CHIDAOBA update 009: a "dates text" for camps without exact dates yet, and the spring camp's 40 places.
-- Paste into Supabase > SQL Editor and run once. Running it again changes nothing.

alter table public.camps add column if not exists dates_note text;  -- e.g. "Spring 2027", shown until start_date is set

update public.camps
   set dates_note = 'Spring 2027',
       capacity   = 40,
       ka         = ka || jsonb_build_object('dates_note', 'გაზაფხული 2027')
 where slug = 'bjj-grappling-spring-2027';
