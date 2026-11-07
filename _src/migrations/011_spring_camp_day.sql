-- CHIDAOBA update 011: "A day at camp" for the spring 2027 BJJ camp.
-- Paste into Supabase > SQL Editor and run once, after updates 008 to 010. Running it again gives the same result.
-- Edit it any time in Admin > Camps > Edit > Programme > Schedule (one line per item: "07:30 Title | description").

update public.camps
   set schedule = $json$[
 {
  "day": "A typical day",
  "day_ka": "ტიპური დღე",
  "items": [
   {
    "time": "07:00",
    "title": "Wake up",
    "note": "Morning in a mountain village, with the peaks of Svaneti outside the window.",
    "title_ka": "გაღვიძება",
    "note_ka": "დილა მთის სოფელში, ფანჯრიდან სვანეთის მწვერვალები ჩანს."
   },
   {
    "time": "07:30",
    "title": "Morning run in the mountains",
    "note": "An easy run or brisk walk on the village roads to wake the body up. Everyone goes at their own pace.",
    "title_ka": "დილის სირბილი მთაში",
    "note_ka": "მსუბუქი სირბილი ან სწრაფი სიარული სოფლის გზებზე, რომ სხეული გაიღვიძოს. ყველა საკუთარი ტემპით მიდის."
   },
   {
    "time": "08:30",
    "title": "Breakfast",
    "note": "A full breakfast together in the dining hall.",
    "title_ka": "საუზმე",
    "note_ka": "სრული საუზმე ერთად, სასადილო დარბაზში."
   },
   {
    "time": "10:00",
    "title": "Strength and conditioning",
    "note": "Physical training in the gym or outside: strength, mobility and the conditioning grappling needs.",
    "title_ka": "ძალა და ფიზიკური მომზადება",
    "note_ka": "ფიზიკური ვარჯიში დარბაზში ან გარეთ: ძალა, მოქნილობა და გრეპლინგისთვის საჭირო გამძლეობა."
   },
   {
    "time": "12:00",
    "title": "Rest",
    "note": "Shower, stretch, sleep or sit in the sun with a view of the mountains.",
    "title_ka": "დასვენება",
    "note_ka": "შხაპი, გაწელვა, ძილი ან მზეზე ჯდომა მთების ხედით."
   },
   {
    "time": "13:30",
    "title": "Lunch",
    "note": "Georgian food, made fresh at the complex. Time to eat well and recover.",
    "title_ka": "სადილი",
    "note_ka": "ქართული კერძები, კომპლექსში ახლად მომზადებული. დრო, რომ კარგად ჭამოთ და აღდგეთ."
   },
   {
    "time": "16:00",
    "title": "Main session: BJJ and grappling",
    "note": "The heart of the day on the tatami: technique, drilling and positional sparring with the camp coaches.",
    "title_ka": "მთავარი ვარჯიში: BJJ და გრეპლინგი",
    "note_ka": "დღის მთავარი ნაწილი ტატამზე: ტექნიკა, ილეთების დამუშავება და პოზიციური სპარინგი ბანაკის მწვრთნელებთან."
   },
   {
    "time": "18:00",
    "title": "Open mat or recovery",
    "note": "More rounds for those who want them. Stretching and the pool for those who need a break.",
    "title_ka": "თავისუფალი ტატამი ან აღდგენა",
    "note_ka": "დამატებითი რაუნდები მსურველებისთვის. გაწელვა და აუზი მათთვის, ვისაც დასვენება სჭირდება."
   },
   {
    "time": "19:30",
    "title": "Dinner",
    "note": "Everyone at one table. Stories from the mat, and training partners turning into friends.",
    "title_ka": "ვახშამი",
    "note_ka": "ყველა ერთ მაგიდასთან. ტატამის ამბები და სავარჯიშო პარტნიორები, რომლებიც მეგობრები ხდებიან."
   },
   {
    "time": "21:00",
    "title": "Evening together",
    "note": "Football on the mini stadium, the climbing wall, games, or a walk under the stars.",
    "title_ka": "საღამო ერთად",
    "note_ka": "ფეხბურთი მინი სტადიონზე, საცოცი კედელი, თამაშები ან სეირნობა ვარსკვლავების ქვეშ."
   },
   {
    "time": "23:00",
    "title": "Lights out",
    "note": "Sleep well. Tomorrow starts early.",
    "title_ka": "ძილი",
    "note_ka": "კარგად დაისვენეთ. ხვალ ადრე ვიწყებთ."
   }
  ]
 }
]$json$::jsonb
 where slug = 'bjj-grappling-spring-2027';
