# CHIDAOBA camp waivers: one text in English and Georgian, used for the web pages and the printable PDFs.
# Each entry is (English, Georgian). Section kinds: "p" paragraph, "ul" list, "f" fields to fill in, "tick" checkboxes.

COMMON_RISK = (
    ("Brazilian jiu-jitsu, grappling, wrestling and judo are full-contact sports. Training includes throws, takedowns, joint locks and chokes. "
     "Injuries can happen even when everyone follows the rules: bruises, sprains, dislocations, fractures, concussion, skin infections and, in rare cases, serious or permanent injury.",
     "ბრაზილიური ჯიუ-ჯიტსუ, გრეპლინგი, ჭიდაობა და ძიუდო სრულკონტაქტური სპორტია. ვარჯიში მოიცავს ჩაგდებებს, ფეხში შესვლებს, მტკივნეულ და მახრჩობელა ილეთებს. "
     "ტრავმა შეიძლება მოხდეს მაშინაც, როცა ყველა წესს იცავს: დაჟეჟილობა, იოგების დაჭიმვა, ამოვარდნილობა, მოტეხილობა, ტვინის შერყევა, კანის ინფექცია და იშვიათად სერიოზული ან მუდმივი ტრავმა."),
    ("The camp takes place in the mountains, far from large hospitals. Activities outside training, such as hiking, travel and sightseeing, carry their own risks, including weather and road conditions.",
     "ბანაკი მთაში, დიდი საავადმყოფოებისგან მოშორებით ტარდება. ვარჯიშის გარდა სხვა აქტივობებს, როგორიცაა ლაშქრობა, მგზავრობა და დათვალიერება, საკუთარი რისკები აქვს, მათ შორის ამინდისა და გზის პირობები."),
)
RELEASE = (
    "To the extent permitted by the law of Georgia, I release CHIDAOBA, its organisers, coaches, staff and partner venues from any claim for injury, illness, loss or damage arising from {who} participation in the camp, its training and its activities. This release does not cover harm caused intentionally or through gross negligence.",
    "საქართველოს კანონმდებლობით დაშვებულ ფარგლებში, CHIDAOBA-ს, მის ორგანიზატორებს, მწვრთნელებს, პერსონალსა და პარტნიორ ობიექტებს ვათავისუფლებ ნებისმიერი პრეტენზიისგან ტრავმის, ავადმყოფობის, დანაკარგის ან ზიანის გამო, რომელიც {who_ka} ბანაკში, ვარჯიშსა და აქტივობებში მონაწილეობას უკავშირდება. ეს არ ვრცელდება განზრახ ან უხეში გაუფრთხილებლობით მიყენებულ ზიანზე.",
)
CAMP_FIELDS = [("Camp", "ბანაკი"), ("Dates", "თარიღები")]
CONTACT = ("Please print, sign and bring this form to the camp, or send a signed copy before you arrive.",
           "გთხოვთ, ამობეჭდოთ, ხელი მოაწეროთ და ბანაკზე თან იქონიოთ, ან ჩამოსვლამდე ხელმოწერილი ასლი გამოგვიგზავნოთ.")

WAIVERS = {
  "adult": {
    "slug": "adult",
    "title": ("Participant waiver and release", "მონაწილის თანხმობა და პასუხისმგებლობის მოხსნა"),
    "short": ("Adult waiver", "ზრდასრულის ფორმა"),
    "for": ("For participants aged 18 and over.", "18 წლის და უფროსი ასაკის მონაწილეებისთვის."),
    "sections": [
      ("Participant", "მონაწილე", [("f", [("Full name", "სახელი და გვარი"), ("Date of birth", "დაბადების თარიღი"), ("Nationality", "მოქალაქეობა"),
                                          ("Passport or ID number", "პასპორტის ან პირადობის ნომერი"), ("Phone", "ტელეფონი"), ("Email", "ელფოსტა"),
                                          ("Emergency contact: name, relationship, phone", "საგანგებო კონტაქტი: სახელი, კავშირი, ტელეფონი")])]),
      ("Health", "ჯანმრთელობა", [
        ("p", ("I confirm that I am in good health and physically fit to take part in intensive training. I have told CHIDAOBA about any medical condition, injury, allergy or medication that could affect my training or my safety, listed below.",
               "ვადასტურებ, რომ ჯანმრთელი ვარ და ფიზიკურად მზად ვარ ინტენსიური ვარჯიშისთვის. CHIDAOBA-ს ვაცნობე ყველა სამედიცინო მდგომარეობა, ტრავმა, ალერგია ან მედიკამენტი, რომელიც ჩემს ვარჯიშსა და უსაფრთხოებაზე შეიძლება აისახოს. ისინი ქვემოთ არის ჩამოთვლილი.")),
        ("f", [("Medical conditions and past injuries", "სამედიცინო მდგომარეობა და წარსული ტრავმები"), ("Allergies", "ალერგია"),
               ("Medication I take", "მედიკამენტები, რომლებსაც ვიღებ"), ("Dietary needs", "კვების მოთხოვნები")])]),
      ("Risks of training", "ვარჯიშის რისკები", [("p", COMMON_RISK[0]), ("p", COMMON_RISK[1])]),
      ("My responsibility", "ჩემი პასუხისმგებლობა", [("ul", [
        ("I take part of my own free will and I accept the risks described above.", "მონაწილეობას ჩემი ნებით ვიღებ და ზემოთ აღწერილ რისკებს ვიღებ."),
        ("I will follow the instructions of the coaches and staff, train at a level that is safe for me and my partners, and tap or stop when needed.",
         "შევასრულებ მწვრთნელებისა და პერსონალის მითითებებს, ვივარჯიშებ ჩემთვის და პარტნიორებისთვის უსაფრთხო დონეზე და საჭიროებისას დავნებდები ან შევჩერდები."),
        ("I will stop training and tell a coach if I feel unwell or am injured.", "თუ ცუდად ვიგრძნობ თავს ან ტრავმას მივიღებ, ვარჯიშს შევწყვეტ და მწვრთნელს ვაცნობებ."),
        ("I will not train under the influence of alcohol or drugs.", "არ ვივარჯიშებ ალკოჰოლის ან ნარკოტიკის ზემოქმედების ქვეშ."),
        ("I will keep good hygiene: clean training clothes, short nails, and no training with skin infections or open wounds.",
         "დავიცავ ჰიგიენას: სუფთა სავარჯიშო ტანსაცმელი, მოკლე ფრჩხილები, და არ ვივარჯიშებ კანის ინფექციით ან ღია ჭრილობით."),
        ("I am responsible for my own travel and medical insurance. CHIDAOBA strongly recommends insurance that covers sports injuries.",
         "საკუთარ სამოგზაურო და სამედიცინო დაზღვევაზე პასუხისმგებელი მე ვარ. CHIDAOBA გირჩევთ დაზღვევას, რომელიც სპორტულ ტრავმებს ფარავს."),
        ("CHIDAOBA is not responsible for loss of or damage to my personal belongings.", "CHIDAOBA არ არის პასუხისმგებელი ჩემი პირადი ნივთების დაკარგვაზე ან დაზიანებაზე.")])]),
      ("Release of liability", "პასუხისმგებლობის მოხსნა", [("p", (RELEASE[0].format(who="my"), RELEASE[1].format(who_ka="ჩემს")))]),
      ("Medical treatment", "სამედიცინო დახმარება", [("p", (
        "If I am injured or fall ill, I allow CHIDAOBA staff to give first aid, call emergency services and arrange transport to a doctor or hospital. Any medical costs are my responsibility or that of my insurance.",
        "ტრავმის ან ავადმყოფობის შემთხვევაში, CHIDAOBA-ს პერსონალს ვაძლევ უფლებას, აღმომიჩინოს პირველადი დახმარება, გამოიძახოს სასწრაფო და მოაწყოს ტრანსპორტირება ექიმთან ან საავადმყოფოში. სამედიცინო ხარჯები ჩემი ან ჩემი დაზღვევის პასუხისმგებლობაა."))]),
      ("Photos and video", "ფოტო და ვიდეო", [
        ("p", ("Photos and video are taken during the camp for the CHIDAOBA website and social media.", "ბანაკის დროს CHIDAOBA-ს ვებგვერდისა და სოციალური ქსელებისთვის ფოტო და ვიდეო გადაიღება.")),
        ("tick", [("I agree to appear in them", "თანახმა ვარ, მათში გამოვჩნდე"), ("I do not agree", "არ ვარ თანახმა")])]),
      ("Declaration", "განცხადება", [
        ("p", ("I am 18 or older. I have read and understood this waiver, I have had the chance to ask questions, and I sign it voluntarily.",
               "18 წლის ან უფროსი ვარ. წავიკითხე და გავიგე ეს ფორმა, მქონდა შესაძლებლობა, კითხვები დამესვა, და ხელს ნებაყოფლობით ვაწერ.")),
        ("f", [("Signature", "ხელმოწერა"), ("Full name", "სახელი და გვარი"), ("Date", "თარიღი"), ("Place", "ადგილი")])]),
    ],
  },
  "minor": {
    "slug": "minor",
    "title": ("Parent or guardian consent and waiver", "მშობლის ან მეურვის თანხმობა და პასუხისმგებლობის მოხსნა"),
    "short": ("Under 18 waiver", "18 წლამდე ფორმა"),
    "for": ("For participants under 18. A parent or legal guardian completes and signs it.", "18 წლამდე მონაწილეებისთვის. ავსებს და ხელს აწერს მშობელი ან კანონიერი მეურვე."),
    "sections": [
      ("Child", "ბავშვი", [("f", [("Full name", "სახელი და გვარი"), ("Date of birth", "დაბადების თარიღი"), ("Age", "ასაკი"),
                                  ("Nationality", "მოქალაქეობა"), ("Passport or ID number", "პასპორტის ან პირადობის ნომერი")])]),
      ("Parent or guardian", "მშობელი ან მეურვე", [("f", [("Full name", "სახელი და გვარი"), ("Relationship to the child", "კავშირი ბავშვთან"),
                                                          ("Phone", "ტელეფონი"), ("Email", "ელფოსტა"), ("Address", "მისამართი")])]),
      ("Emergency contacts", "საგანგებო კონტაქტები", [
        ("p", ("People we can call if we cannot reach you.", "ადამიანები, რომლებსაც დავუკავშირდებით, თუ თქვენ ვერ მოგაგნებთ.")),
        ("f", [("Contact 1: name, relationship, phone", "კონტაქტი 1: სახელი, კავშირი, ტელეფონი"), ("Contact 2: name, relationship, phone", "კონტაქტი 2: სახელი, კავშირი, ტელეფონი")])]),
      ("Health", "ჯანმრთელობა", [
        ("p", ("I confirm that my child is in good health and fit to take part in intensive training. I have listed below everything the coaches need to know.",
               "ვადასტურებ, რომ ჩემი შვილი ჯანმრთელია და მზად არის ინტენსიური ვარჯიშისთვის. ქვემოთ ჩამოვწერე ყველაფერი, რაც მწვრთნელებმა უნდა იცოდნენ.")),
        ("f", [("Medical conditions and past injuries", "სამედიცინო მდგომარეობა და წარსული ტრავმები"), ("Allergies", "ალერგია"),
               ("Medication: name, dose and times", "მედიკამენტები: დასახელება, დოზა და დრო"), ("Dietary needs", "კვების მოთხოვნები"),
               ("Anything else we should know", "სხვა, რაც უნდა ვიცოდეთ")])]),
      ("Permission to take part", "მონაწილეობის ნებართვა", [
        ("p", ("I give permission for my child to take part in the training camp named above, including training in Brazilian jiu-jitsu, grappling, wrestling or judo, and the activities that are part of the camp programme.",
               "ჩემს შვილს ვაძლევ ნებართვას, მონაწილეობა მიიღოს ზემოთ დასახელებულ სავარჯიშო ბანაკში, მათ შორის ბრაზილიური ჯიუ-ჯიტსუს, გრეპლინგის, ჭიდაობის ან ძიუდოს ვარჯიშში და ბანაკის პროგრამის აქტივობებში.")),
        ("p", COMMON_RISK[0]), ("p", COMMON_RISK[1])]),
      ("Permission to travel and stay with CHIDAOBA", "CHIDAOBA-სთან ერთად მგზავრობისა და დარჩენის ნებართვა", [
        ("p", ("I give permission for my child to travel to and from the camp and to stay at the camp venue under the supervision of CHIDAOBA coaches and staff, on the dates written above. This includes:",
               "ჩემს შვილს ვაძლევ ნებართვას, CHIDAOBA-ს მწვრთნელებისა და პერსონალის მეთვალყურეობით იმგზავროს ბანაკში და უკან, და დარჩეს ბანაკის ობიექტზე ზემოთ მითითებულ თარიღებში. ეს მოიცავს:")),
        ("ul", [("Transport arranged by CHIDAOBA from the meeting point to the camp and back.", "CHIDAOBA-ს მიერ ორგანიზებულ ტრანსპორტს შეკრების ადგილიდან ბანაკამდე და უკან."),
                ("Shared accommodation with participants of the same sex and a similar age.", "ერთი სქესისა და მსგავსი ასაკის მონაწილეებთან ერთად ცხოვრებას."),
                ("Supervised activities outside training, such as meals, hikes and sightseeing.", "მეთვალყურეობით აქტივობებს ვარჯიშის გარდა, როგორიცაა კვება, ლაშქრობა და დათვალიერება."),
                ("My child may not leave the camp venue without a member of staff.", "ჩემი შვილი ბანაკის ობიექტს პერსონალის გარეშე ვერ დატოვებს.")]),
        ("f", [("Meeting point and time", "შეკრების ადგილი და დრო")]),
        ("p", ("At the end of the camp my child may be collected only by me or by the people named here:", "ბანაკის ბოლოს ჩემს შვილს წაიყვანს მხოლოდ მე ან აქ დასახელებული ადამიანები:")),
        ("f", [("Name, relationship, phone", "სახელი, კავშირი, ტელეფონი"), ("Name, relationship, phone", "სახელი, კავშირი, ტელეფონი")])]),
      ("Rules and behaviour", "წესები და ქცევა", [("p", (
        "I have explained the camp rules to my child: follow the coaches' instructions, respect training partners and staff, no alcohol, tobacco or drugs, and keep to the agreed times for sleep and phones. If my child seriously or repeatedly breaks these rules, CHIDAOBA may contact me to arrange an early return, at my cost.",
        "ჩემს შვილს ავუხსენი ბანაკის წესები: შეასრულოს მწვრთნელების მითითებები, პატივი სცეს პარტნიორებსა და პერსონალს, არ მოიხმაროს ალკოჰოლი, თამბაქო ან ნარკოტიკი, და დაიცვას ძილისა და ტელეფონის შეთანხმებული დრო. თუ ჩემი შვილი ამ წესებს სერიოზულად ან განმეორებით დაარღვევს, CHIDAOBA შეიძლება დამიკავშირდეს ადრე დაბრუნების მოსაწყობად, ჩემი ხარჯით."))]),
      ("Medical treatment", "სამედიცინო დახმარება", [("p", (
        "If my child is injured or falls ill, I allow CHIDAOBA staff to give first aid, call emergency services and take my child to a doctor or hospital. If I cannot be reached in time, I allow the doctors to give the treatment they consider urgent and necessary. CHIDAOBA will contact me as soon as possible. Medical costs are my responsibility or that of my child's insurance.",
        "თუ ჩემი შვილი ტრავმას მიიღებს ან ავად გახდება, CHIDAOBA-ს პერსონალს ვაძლევ უფლებას, აღმოუჩინოს პირველადი დახმარება, გამოიძახოს სასწრაფო და წაიყვანოს ექიმთან ან საავადმყოფოში. თუ დროულად ვერ დამიკავშირდებიან, ექიმებს ვაძლევ უფლებას, ჩაატარონ ის მკურნალობა, რომელსაც სასწრაფოდ აუცილებლად მიიჩნევენ. CHIDAOBA რაც შეიძლება მალე დამიკავშირდება. სამედიცინო ხარჯები ჩემი ან ჩემი შვილის დაზღვევის პასუხისმგებლობაა."))]),
      ("Release of liability", "პასუხისმგებლობის მოხსნა", [("p", (RELEASE[0].format(who="my child's"), RELEASE[1].format(who_ka="ჩემი შვილის")))]),
      ("Photos and video", "ფოტო და ვიდეო", [
        ("p", ("Photos and video are taken during the camp for the CHIDAOBA website and social media.", "ბანაკის დროს CHIDAOBA-ს ვებგვერდისა და სოციალური ქსელებისთვის ფოტო და ვიდეო გადაიღება.")),
        ("tick", [("I agree that my child may appear in them", "თანახმა ვარ, ჩემი შვილი მათში გამოჩნდეს"), ("I do not agree", "არ ვარ თანახმა")])]),
      ("Travelling from abroad", "საზღვარგარეთიდან მგზავრობა", [("p", (
        "If your child travels to Georgia without one or both parents, border officers may ask for a notarised letter of consent from the parent or parents who are not travelling. Please check the rules of your country and of Georgia before you book flights.",
        "თუ თქვენი შვილი საქართველოში ერთ-ერთი ან ორივე მშობლის გარეშე მოგზაურობს, მესაზღვრეებმა შეიძლება მოითხოვონ იმ მშობლის ან მშობლების ნოტარიულად დამოწმებული თანხმობა, რომლებიც არ მგზავრობენ. ბილეთების შეძენამდე გთხოვთ, გადაამოწმოთ თქვენი ქვეყნისა და საქართველოს წესები."))]),
      ("Declaration", "განცხადება", [
        ("p", ("I am the parent or legal guardian of the child named above. I have read and understood this form and I sign it voluntarily.",
               "ვარ ზემოთ დასახელებული ბავშვის მშობელი ან კანონიერი მეურვე. წავიკითხე და გავიგე ეს ფორმა და ხელს ნებაყოფლობით ვაწერ.")),
        ("f", [("Signature of parent or guardian", "მშობლის ან მეურვის ხელმოწერა"), ("Full name", "სახელი და გვარი"), ("Date", "თარიღი"), ("Place", "ადგილი")]),
        ("p", ("Second parent or guardian, if required:", "მეორე მშობელი ან მეურვე, საჭიროების შემთხვევაში:")),
        ("f", [("Signature", "ხელმოწერა"), ("Full name", "სახელი და გვარი"), ("Date", "თარიღი")])]),
    ],
  },
}


def pairs():
    """Every English string with its Georgian translation, for the site translator."""
    out = {}
    def add(t):
        if isinstance(t, tuple) and len(t) == 2 and isinstance(t[0], str):
            out[t[0]] = t[1]
    for t in CAMP_FIELDS: add(t)
    add(CONTACT)
    for w in WAIVERS.values():
        add(w["title"]); add(w["short"]); add(w["for"])
        for h_en, h_ka, items in w["sections"]:
            add((h_en, h_ka))
            for kind, val in items:
                if kind == "p": add(val)
                else:
                    for t in val: add(t)
    return out


def doc_html(w, lang="en", sample=False):
    """The waiver as clean HTML (used on its page and for the PDF). Strings are English; the translator turns them Georgian."""
    L = 0 if lang == "en" else 1
    def t(pair): return pair[L]
    def fields(fs):
        return "".join(f'<div class="wv-f"><span>{t(f)}</span><i></i></div>' for f in fs)
    body = f'<div class="wv-camp">{fields(CAMP_FIELDS)}</div>'
    for n, (h_en, h_ka, items) in enumerate(w["sections"], 1):
        inner = ""
        for kind, val in items:
            if kind == "p": inner += f"<p>{t(val)}</p>"
            elif kind == "ul": inner += "<ul>" + "".join(f"<li>{t(x)}</li>" for x in val) + "</ul>"
            elif kind == "f": inner += f'<div class="wv-fs">{fields(val)}</div>'
            elif kind == "tick": inner += '<div class="wv-tick">' + "".join(f"<span><b></b>{t(x)}</span>" for x in val) + "</div>"
        body += f'<section class="wv-s"><h2><em>{n}</em>{(h_en, h_ka)[L]}</h2>{inner}</section>'
    return (f'<article class="wv-doc" id="wv-{w["slug"]}"><header class="wv-head"><div class="wv-brand">CHIDAOBA</div>'
            f'<h1>{t(w["title"])}</h1><p class="wv-for">{t(w["for"])}</p></header>{body}'
            f'<footer class="wv-foot"><p>{t(CONTACT)}</p><p>CHIDAOBA · chidaoba.com · chidaobaculture@gmail.com · +995 595 606 670</p></footer></article>')
