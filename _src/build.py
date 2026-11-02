#!/usr/bin/env python3
"""Static page generator for chidaoba.com (Phase 1).

Run from the repo root:  python3 _src/build.py
Writes index.html, culture/, camps/, community/, journal/, shop/, privacy/ and 404.html.
Folders starting with "_" are not published by GitHub Pages (Jekyll), so this source stays private to the repo.
"""
import os, html

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SYM = open(os.path.join(ROOT, "_src", "symbol_path.txt")).read().strip()
IG = "https://www.instagram.com/chidaobaculture/"
IG_HANDLE = "@chidaobaculture"
UNESCO = "https://ich.unesco.org/en/RL/chidaoba-wrestling-in-georgia-01371"

NAV = [("/", "Home"), ("/culture/", "Culture"), ("/camps/", "Camps &amp; Events"),
       ("/community/", "Community"), ("/journal/", "Journal"), ("/shop/", "Shop")]

def sym_svg(cls, extra=""):
    return f'<svg class="{cls}" viewBox="130 10 670 940" aria-hidden="true" focusable="false"{extra}><path d="{SYM}" fill-rule="evenodd"/></svg>'

BAG = ('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">'
       '<path d="M5 8h14l-1.2 12H6.2L5 8Z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/></svg>')

def head(title, desc, path):
    url = "https://chidaoba.com" + path
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="canonical" href="{url}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="CHIDAOBA CULTURE">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="https://chidaoba.com/assets/img/og.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#202020">
<link rel="icon" href="/assets/img/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&amp;family=Noto+Sans+Georgian:wght@400;700&amp;display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/css/site.css">
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
"""

def header(path):
    links = "".join(f'<a href="{h}"{" aria-current=\"page\"" if h == path else ""}>{t}</a>' for h, t in NAV[1:])
    mlinks = "".join(f'<a href="{h}"{" aria-current=\"page\"" if h == path else ""}>{t}</a>' for h, t in NAV)
    return f"""<header class="site-head">
  <div class="wrap">
    <a class="brand" href="/" aria-label="CHIDAOBA CULTURE — home"><img src="/assets/img/symbol-chalk.svg" alt="CHIDAOBA CULTURE" width="26" height="36"></a>
    <nav class="nav" aria-label="Main">{links}</nav>
    <div class="head-tools">
      <a class="bag" href="/shop/" aria-label="Shopping bag, 0 items">{BAG}<span aria-hidden="true">0</span></a>
      <button class="burger" type="button" aria-label="Menu" aria-expanded="false" aria-controls="mobile-menu"><span></span><span></span><span></span></button>
    </div>
  </div>
</header>
<div class="mobile-menu" id="mobile-menu">
  <nav aria-label="Mobile">{mlinks}</nav>
  <a class="label" href="{IG}" rel="noopener">Instagram — {IG_HANDLE}</a>
</div>
"""

def footer():
    return f"""<footer class="site-foot">
  <div class="wrap">
    <div class="foot-grid">
      <div>
        <img src="/assets/img/lockup-chalk.svg" alt="CHIDAOBA CULTURE" width="400" height="40">
        <p class="body soft" style="margin-top:24px;max-width:26em">Georgian wrestling heritage, expressed through modern sports culture. Tbilisi, Georgia.</p>
        <p class="label muted" style="margin-top:28px">The Culture Letter — launching soon</p>
      </div>
      <div><h3>Explore</h3><ul>
        <li><a href="/culture/">Culture</a></li><li><a href="/camps/">Camps &amp; Events</a></li>
        <li><a href="/community/">Community</a></li><li><a href="/journal/">Journal</a></li><li><a href="/shop/">Shop</a></li></ul></div>
      <div><h3>Brand</h3><ul>
        <li><a href="/culture/">About</a></li><li><a href="{IG}" rel="noopener">Contact (Instagram DM)</a></li>
        <li><a href="{IG}" rel="noopener">Instagram</a></li></ul></div>
      <div><h3>Legal</h3><ul><li><a href="/privacy/">Privacy</a></li></ul></div>
    </div>
    <div class="foot-bottom label"><span>© <span data-year>2026</span> Chidaoba Culture</span><span>A culture that moves<span class="dot">.</span></span></div>
  </div>
</footer>
<script src="/assets/js/site.js" defer></script>
</body>
</html>
"""

def page(path, title, desc, main):
    return head(title, desc, path) + header(path) + f'<main id="main">{main}</main>\n' + footer()

def arrow(): return '<span class="arr" aria-hidden="true">→</span>'

CATS = ["Training Camps", "Chidaoba Workshops", "Wrestling Seminars", "BJJ / No-Gi Camps",
        "Competitions", "Open Mats", "Cultural Experiences"]
JCATS = ["Heritage", "Wrestling", "Grappling", "Training", "Athletes", "Culture", "Interviews"]

# ------------------------------------------------------------------ home
def home():
    chips = "".join(f"<li>{c}</li>" for c in CATS)
    jchips = "".join(f"<li>{c}</li>" for c in JCATS)
    return f"""
<section class="hero dark" aria-labelledby="hero-title">
  <div class="hero-rule" aria-hidden="true"></div>
  {sym_svg("hero-sym")}
  <div class="wrap">
    <p class="label muted"><span class="bar"></span>Chidaoba Culture — Tbilisi, Georgia</p>
    <div>
      <h1 id="hero-title" class="display h-xl">Rooted in heritage.<br>Built for the future<span class="dot">.</span></h1>
      <p class="lead soft">A culture shaped by movement, discipline and the spirit of Georgian wrestling.</p>
      <div class="ctas">
        <a class="btn btn-primary" href="/culture/">Explore culture {arrow()}</a>
        <a class="btn btn-ghost" href="/camps/">Discover camps {arrow()}</a>
      </div>
    </div>
    <div class="hero-foot label muted">
      <span>Chidaoba — UNESCO Intangible Cultural Heritage, 2018</span>
      <span>A culture that moves<span class="dot">.</span></span>
    </div>
  </div>
</section>

<section class="section light" aria-labelledby="intro-title">
  <div class="wrap">
    <div class="intro">
      <p class="label" style="grid-column:1/-1"><span class="bar"></span>01 — The culture</p>
      <h2 id="intro-title" class="display h-lg reveal">A culture that moves<span class="dot">.</span></h2>
      <div class="text reveal">
        <p class="lead">Chidaoba is more than a traditional wrestling discipline. It is movement, discipline and heritage — a connection between generations, carried through the grip.</p>
        <p class="body muted">For centuries it has combined wrestling with music, dance and its own garments. CHIDAOBA CULTURE exists to preserve, develop, modernise and share that culture — and to connect it with today’s wrestling, judo, Brazilian Jiu-Jitsu and grappling world.</p>
        <a class="link" href="/culture/" style="align-self:start">What is Chidaoba</a>
      </div>
      <div class="stats reveal">
        <div class="stat"><b>2018</b><span>Chidaoba, wrestling in Georgia, inscribed on UNESCO’s Representative List of the Intangible Cultural Heritage of Humanity.</span></div>
        <div class="stat"><b>≈200</b><span>Holds and counter-holds, by UNESCO’s estimate — and the creativity of combining them.</span></div>
        <div class="stat"><b>ჭ</b><span>The first letter of ჭიდაობა. One letter carries the brand.</span></div>
      </div>
    </div>
    <p class="src">Source: <a href="{UNESCO}" rel="noopener">UNESCO Intangible Cultural Heritage — Chidaoba, wrestling in Georgia</a></p>
  </div>
</section>

<section class="section dark" aria-labelledby="camps-title">
  <div class="wrap">
    <div class="sec-head">
      <p class="label muted"><span class="bar"></span>02 — Camps &amp; Events</p>
      <h2 id="camps-title" class="display h-lg reveal">Train. Connect. Experience<span class="dot">.</span></h2>
      <p class="body soft reveal">Training camps, workshops, competitions and cultural experiences rooted in Georgian grappling culture — in Georgia and abroad.</p>
    </div>
    <article class="feature reveal">
      <div class="feature-visual" aria-hidden="true">{sym_svg("")}<div class="ring"></div></div>
      <div class="feature-body">
        <span class="pill"><i></i>First dates announced soon</span>
        <h3 class="display h-md">The first camps are being planned<span class="dot">.</span></h3>
        <p class="body soft">We are preparing our first training camps and experiences in Georgia. Dates, coaches, locations and registration will be published here first.</p>
        <ul class="chips">{chips}</ul>
        <div style="display:flex;gap:14px;flex-wrap:wrap;margin-top:8px">
          <a class="btn btn-primary" href="/camps/">Explore camps &amp; events {arrow()}</a>
          <a class="btn btn-ghost" href="{IG}" rel="noopener">Follow for dates {arrow()}</a>
        </div>
      </div>
    </article>
  </div>
</section>

<section class="section light" aria-label="Community and Journal">
  <div class="wrap">
    <div class="duo">
      <article class="reveal">
        <p class="label"><span class="bar"></span>03 — Community</p>
        <h2 class="display h-md">Built by people<span class="dot">.</span></h2>
        <p class="body muted">Athletes, coaches and clubs who carry the culture — in Georgia and around the world. Profiles are in preparation.</p>
        <div class="cols3"><div><b>Athletes</b><span>Wrestlers and grapplers</span></div><div><b>Coaches</b><span>The people who teach</span></div><div><b>Clubs</b><span>Where to train</span></div></div>
        <a class="link" href="{IG}" rel="noopener" style="align-self:start">Coach, athlete or club? Get in touch</a>
      </article>
      <article class="reveal">
        <p class="label"><span class="bar"></span>04 — Journal</p>
        <h2 class="display h-md">Stories from the circle<span class="dot">.</span></h2>
        <p class="body muted">An editorial home for Georgian wrestling and grappling — heritage, technique, training and the people behind it. First stories coming soon.</p>
        <ul class="chips">{jchips}</ul>
        <a class="link" href="/journal/" style="align-self:start">Visit the journal</a>
      </article>
    </div>
  </div>
</section>

<section class="section dark drop" aria-labelledby="drop-title">
  <div class="big" aria-hidden="true">01</div>
  <div class="wrap">
    <div class="drop-grid">
      <div class="reveal">
        <p class="label muted"><span class="bar"></span>05 — Apparel</p>
        <h2 id="drop-title" class="display h-lg">Drop 01<span class="dot">.</span></h2>
        <p class="lead soft">The first collection is in development: heavyweight tees, hoodies, shorts and rashguards — made to be trained in.</p>
        <a class="btn btn-primary" href="/shop/" style="align-self:start">Explore collection {arrow()}</a>
      </div>
    </div>
  </div>
</section>

<section class="section dark invite" aria-labelledby="invite-title" style="border-top:1px solid var(--carbon-line)">
  <div class="wrap">
    <p class="label muted"><span class="bar"></span>06 — Join</p>
    <h2 id="invite-title" class="display h-lg reveal" style="margin-top:24px">More than a sport. A culture we share<span class="dot">.</span></h2>
    <div class="invite-links reveal">
      <a href="{IG}" rel="noopener"><span class="label muted">Instagram</span><b>{IG_HANDLE} →</b></a>
      <a href="/camps/"><span class="label muted">Upcoming</span><b>Camps &amp; events →</b></a>
      <div><span class="label muted">Newsletter</span><b>The Culture Letter</b><span class="body soft">Launching soon.</span></div>
    </div>
  </div>
</section>
"""

# ------------------------------------------------------------------ inner pages
def inner(label, title, lead, what, what_items, cta_html, extra=""):
    items = "".join(f"<li>{i}</li>" for i in what_items)
    return f"""
<section class="page-hero dark">
  {sym_svg("ghost")}
  <div class="wrap" style="position:relative">
    <p class="label muted"><span class="bar"></span>{label}</p>
    <h1 class="display h-xl">{title}</h1>
    <p class="lead soft">{lead}</p>
  </div>
</section>
{extra}
<section class="section light">
  <div class="wrap status">
    <div>
      <span class="pill" style="border-color:var(--chalk-line)"><i></i>In progress</span>
      <h2 class="display h-md" style="margin-top:22px">{what}</h2>
    </div>
    <div>
      <ul class="chips">{items}</ul>
      <div style="display:flex;gap:14px;flex-wrap:wrap">{cta_html}</div>
    </div>
  </div>
</section>
"""

def ig_btn(text="Follow on Instagram"):
    return f'<a class="btn btn-primary" href="{IG}" rel="noopener">{text} {arrow()}</a>'

def culture():
    extra = f"""
<section class="section light">
  <div class="wrap intro">
    <p class="label" style="grid-column:1/-1"><span class="bar"></span>What is Chidaoba</p>
    <h2 class="display h-lg">Wrestling, music and the circle<span class="dot">.</span></h2>
    <div class="text">
      <p class="lead">Chidaoba is Georgia’s traditional wrestling. UNESCO describes it as an ancient martial art practised throughout the country’s regions, villages and communities — combining wrestling with music, dance and special garments.</p>
      <p class="body muted">Wrestlers draw on an estimated 200 holds and counter-holds. In 2018 UNESCO inscribed “Chidaoba, wrestling in Georgia” on the Representative List of the Intangible Cultural Heritage of Humanity, noting that it serves a cultural function in the country that extends beyond sport.</p>
      <p class="src">Source: <a href="{UNESCO}" rel="noopener">UNESCO — Chidaoba, wrestling in Georgia (Decision 13.COM 10.b.15)</a></p>
    </div>
  </div>
</section>"""
    return inner("Culture", "What is Chidaoba<span class=\"dot\">?</span>",
                 "An editorial home for Georgian wrestling heritage — where it comes from, what it means, and how it lives on in modern grappling.",
                 "The full story is being researched and written<span class=\"dot\">.</span>",
                 ["Georgian wrestling heritage", "Historical background", "Cultural significance", "Connection to modern grappling",
                  "Photo &amp; video archive", "People and contributors", "Recognition &amp; preservation"],
                 ig_btn(), extra)

WEB3FORMS_KEY = ""   # paste the Web3Forms access key here to switch the camp form on

FORMATS = [
    ("Training Camps", "Several days of focused training in Georgia — two sessions a day with local coaches, plus time to recover and explore."),
    ("Chidaoba Workshops", "Learn Georgian traditional wrestling: its grips, throws and the music and ritual that surround a bout."),
    ("Wrestling Seminars", "Technical sessions with Georgian wrestling coaches, built around specific positions and throws."),
    ("BJJ / No-Gi Camps", "Grappling camps where Georgian wrestling meets Brazilian Jiu-Jitsu and no-gi — takedowns to the ground."),
    ("Competitions", "Tournaments and challenge matches, from friendly club events to open competitions."),
    ("Open Mats", "Drop-in sessions to roll, drill and meet local grapplers — no programme, just training."),
    ("Cultural Experiences", "Time off the mat: Georgian food, landscapes, music and the places where the tradition lives."),
    ("Other Events", "Talks, screenings, team trips and collaborations with clubs and academies."),
]

def camps():
    fmts = "".join(f'<div class="reveal"><span class="n">{i+1:02d}</span><h3>{t}</h3><p>{d}</p></div>' for i, (t, d) in enumerate(FORMATS))
    sched = [("09:00", "Morning training", "Technique and drilling — the main session of the day."),
             ("11:30", "Recovery &amp; lunch", "Rest, food, free time."),
             ("14:00", "Cultural activity", "A visit, a walk, a meal together — the Georgia around the mat."),
             ("18:00", "Evening training", "Live rounds, sparring and specific situations."),
             ("20:30", "Dinner", "Together, Georgian style.")]
    tl = "".join(f'<li><time>{a}</time><div><b>{b}</b><span>{c}</span></div></li>' for a, b, c in sched)
    yes = [("Training sessions", "Every camp"), ("Coaches &amp; instructors", "Every camp"), ("Cultural activities", "Most camps")]
    opt = [("Accommodation", "Optional — depends on the camp"), ("Meals", "Depends on the camp"), ("Transfers &amp; transport", "Depends on the camp"), ("Flights", "Not included")]
    yl = "".join(f'<li class="yes"><i>✓</i>{a}<small>{b}</small></li>' for a, b in yes)
    ol = "".join(f'<li><i>—</i>{a}<small>{b}</small></li>' for a, b in opt)
    types = "".join(f'<label><input type="checkbox" name="camp_types" value="{t}"><span>{t}</span></label>' for t, _ in FORMATS[:7])
    countries_hint = "e.g. Georgia, Germany, USA"
    key = WEB3FORMS_KEY
    disabled = "" if key else " disabled"
    pending = "" if key else '<p class="form-msg">Registration opens very soon. Until then, message us on Instagram <a href="' + IG + '" rel="noopener">@chidaobaculture</a>.</p>'
    faqs = [
        ("Do I need experience?", "No. Camps will list their level — some are open to beginners, others are for experienced wrestlers and grapplers. Tell us your level in the form and we’ll point you to the right one."),
        ("Do I need to speak Georgian?", "No. Sessions and communication for international guests will be in English. Learning a few Georgian words is welcome, of course."),
        ("Which camps run, and when?", "The first dates are being finalised. Register your interest and you’ll hear about them before they are announced publicly."),
        ("How do I get to Georgia?", "Georgia has international airports in Tbilisi, Kutaisi and Batumi. Each camp page will say which airport is closest and whether transfers are included. Please check the visa requirements for your passport before booking."),
        ("What should I bring?", "Your usual training gear — for grappling camps, a gi and/or no-gi kit depending on the camp. A full packing list will be on each camp page."),
        ("Is registering interest a booking?", "No. It’s free and doesn’t commit you to anything. When a camp opens, we’ll send you the details and you decide."),
    ]
    fq = "".join(f'<details><summary>{q}</summary><p>{a}</p></details>' for q, a in faqs)
    return f"""
<section class="page-hero dark">
  {sym_svg("ghost")}
  <div class="wrap" style="position:relative">
    <p class="label muted"><span class="bar"></span>Camps &amp; Events</p>
    <h1 class="display h-xl">Train. Connect. Experience<span class="dot">.</span></h1>
    <p class="lead soft">Training camps, workshops, competitions and experiences rooted in Georgian grappling culture — in Georgia and abroad.</p>
    <div style="display:flex;gap:14px;flex-wrap:wrap;margin-top:36px">
      <a class="btn btn-primary" href="#register">Register your interest {arrow()}</a>
      <a class="btn btn-ghost" href="#what">What is a camp {arrow()}</a>
    </div>
  </div>
</section>

<section class="section light" id="what">
  <div class="wrap intro">
    <p class="label" style="grid-column:1/-1"><span class="bar"></span>01 — What is a camp</p>
    <h2 class="display h-lg reveal">Train where the culture lives<span class="dot">.</span></h2>
    <div class="text reveal">
      <p class="lead">A CHIDAOBA CULTURE camp is a few days to a week in Georgia built around training — wrestling, Chidaoba and grappling sessions with local coaches.</p>
      <p class="body muted">Between sessions you meet the people, food, landscapes and traditions that shaped Georgian wrestling. You leave with better technique, new training partners and a real sense of where it all comes from. Camps are small, organised end-to-end, and open to international guests.</p>
    </div>
  </div>
</section>

<section class="section light" style="padding-top:0">
  <div class="wrap">
    <div class="sec-head" style="margin-bottom:40px">
      <p class="label"><span class="bar"></span>02 — Formats</p>
      <h2 class="display h-md">Eight ways to train and take part<span class="dot">.</span></h2>
    </div>
    <div class="formats">{fmts}</div>
  </div>
</section>

<section class="section dark">
  <div class="wrap day">
    <div class="reveal">
      <p class="label muted"><span class="bar"></span>03 — A typical day</p>
      <h2 class="display h-md">Two sessions. One country<span class="dot">.</span></h2>
      <p class="body soft">An example of a training-camp day. Every camp publishes its own detailed daily schedule.</p>
    </div>
    <ol class="timeline reveal">{tl}</ol>
  </div>
</section>

<section class="section light">
  <div class="wrap">
    <div class="sec-head" style="margin-bottom:40px">
      <p class="label"><span class="bar"></span>04 — Who it’s for</p>
      <h2 class="display h-md">Every level has a place on the mat<span class="dot">.</span></h2>
    </div>
    <div class="levels">
      <div class="reveal"><p class="label" style="color:var(--red)">Beginners</p><h3>New to wrestling or grappling</h3><p>Fit and curious? Selected camps and workshops start from the basics — safely, with patient coaches.</p></div>
      <div class="reveal"><p class="label" style="color:var(--red)">Experienced</p><h3>Wrestlers, judoka, grapplers</h3><p>Sharpen your stand-up and grips with Georgian coaches and hard training partners.</p></div>
      <div class="reveal"><p class="label" style="color:var(--red)">Teams &amp; coaches</p><h3>Clubs and academies</h3><p>Bring your team. We can shape a camp around your club’s level, dates and goals.</p></div>
    </div>
    <div class="incl" style="margin-top:clamp(56px,7vw,96px)">
      <div><h3>Included</h3><ul>{yl}</ul></div>
      <div><h3>Optional / varies</h3><ul>{ol}</ul></div>
    </div>
  </div>
</section>

<section class="section dark" id="register">
  <div class="wrap reg">
    <div class="reg-intro">
      <p class="label muted"><span class="bar"></span>05 — Register your interest</p>
      <h2 class="display h-md">Be first on the mat<span class="dot">.</span></h2>
      <p class="body soft">Tell us who you are and what you’d like to train. We’ll contact you with dates, prices and details as soon as camps open — before they’re announced publicly. Free, and not a booking.</p>
      <p class="label muted">Under 18? A parent or guardian should fill in this form.</p>
    </div>
    <form id="camp-form" data-key="{key}" novalidate>
      <input type="hidden" name="subject" value="New camp interest — chidaoba.com">
      <input type="hidden" name="from_name" value="chidaoba.com">
      <input type="checkbox" name="botcheck" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">
      <div class="field"><label for="f-name">Full name</label><input id="f-name" name="name" autocomplete="name" required></div>
      <div class="field"><label for="f-email">Email</label><input id="f-email" name="email" type="email" autocomplete="email" required></div>
      <div class="field"><label for="f-country">Country</label><input id="f-country" name="country" autocomplete="country-name" placeholder="{countries_hint}" required></div>
      <div class="field"><label for="f-phone">Phone / WhatsApp <em>optional</em></label><input id="f-phone" name="phone" type="tel" autocomplete="tel"></div>
      <div class="field"><label for="f-age">Age</label><input id="f-age" name="age" type="number" min="8" max="99" inputmode="numeric" required></div>
      <div class="field"><label for="f-exp">Grappling experience</label>
        <select id="f-exp" name="experience" required>
          <option value="">Select…</option><option>None — complete beginner</option><option>Under 1 year</option>
          <option>1–3 years</option><option>3–5 years</option><option>5+ years</option><option>Competitive athlete</option><option>Coach</option>
        </select></div>
      <div class="field"><label for="f-level">Belt or skill level <em>optional</em></label><input id="f-level" name="level" placeholder="e.g. BJJ blue belt, national-level wrestler"></div>
      <div class="field"><label for="f-club">Club or academy <em>optional</em></label><input id="f-club" name="club" autocomplete="organization"></div>
      <fieldset class="field full"><legend>What are you interested in? <em>choose any</em></legend><div class="checks">{types}</div></fieldset>
      <div class="field"><label for="f-when">Preferred time</label>
        <select id="f-when" name="preferred_time"><option>Flexible</option><option>Spring</option><option>Summer</option><option>Autumn</option><option>Winter</option></select></div>
      <div class="field"><label for="f-acc">Accommodation</label>
        <select id="f-acc" name="accommodation"><option>Need accommodation</option><option>Don’t need it</option><option>Not sure yet</option></select></div>
      <div class="field full"><label for="f-msg">Anything else? <em>optional</em></label><textarea id="f-msg" name="message" placeholder="Group size, injuries we should know about, questions…"></textarea></div>
      <label class="consent"><input type="checkbox" name="consent" value="yes" required><span>I agree that CHIDAOBA CULTURE may use these details to contact me about camps and events, as described in the <a href="/privacy/">privacy notice</a>.</span></label>
      <div class="form-foot"><button class="btn btn-primary" type="submit"{disabled}>Send {arrow()}</button>{pending if pending else '<p class="form-msg" aria-live="polite"></p>'}</div>
    </form>
    <div class="done" id="camp-done" role="status">
      <p class="label muted"><span class="bar"></span>Received</p>
      <h3 class="display h-md">You’re on the list<span class="dot">.</span></h3>
      <p class="body soft">Thank you. We’ll be in touch as soon as camps open. In the meantime, follow <a href="{IG}" rel="noopener">@chidaobaculture</a>.</p>
    </div>
  </div>
</section>

<section class="section light">
  <div class="wrap">
    <div class="sec-head" style="margin-bottom:24px">
      <p class="label"><span class="bar"></span>06 — Questions</p>
      <h2 class="display h-md">Good to know<span class="dot">.</span></h2>
    </div>
    <div class="faq">{fq}</div>
  </div>
</section>
"""

def community():
    return inner("Community", "Built by people<span class=\"dot\">.</span>",
                 "Athletes, coaches, clubs and the international community who carry the culture forward.",
                 "Profiles and the club directory are in preparation<span class=\"dot\">.</span>",
                 ["Athletes", "Coaches", "Clubs &amp; Academies", "International Community"],
                 ig_btn("Get in touch on Instagram"))

def journal():
    return inner("Journal", "Stories from the circle<span class=\"dot\">.</span>",
                 "Heritage, technique, training, interviews and the people behind Georgian wrestling and grappling.",
                 "The first stories are being written<span class=\"dot\">.</span>",
                 ["Heritage", "Technique", "Training", "Interviews", "Athletes", "Events", "Culture", "News"], ig_btn())

def shop():
    return inner("Shop", "Drop 01<span class=\"dot\">.</span>",
                 "Premium training apparel and everyday sports culture pieces — made to be trained in.",
                 "The first collection is in development<span class=\"dot\">.</span>",
                 ["T-shirts", "Hoodies", "Rashguards", "Training shorts", "Accessories", "Limited collections"],
                 ig_btn("Get notified on Instagram"))

def privacy():
    return f"""
<section class="page-hero dark"><div class="wrap"><p class="label muted"><span class="bar"></span>Legal</p>
<h1 class="display h-lg">Privacy<span class="dot">.</span></h1></div></section>
<section class="section light"><div class="wrap prose">
<p class="label muted">Last updated: November 2026</p>
<h2>What this website collects</h2>
<p>The only personal data chidaoba.com collects is what you choose to send through the camp interest form on the Camps &amp; Events page: your name, email, country, age, training experience and the optional details you add (phone/WhatsApp, belt or skill level, club, accommodation needs and your message).</p>
<p>We use these details only to contact you about camps and events. We don’t sell or share them, and there are no accounts, analytics or advertising cookies on this site.</p>
<h2>How the form works</h2>
<p>Form submissions are delivered to our email by Web3Forms, a form-processing service. We keep your details only as long as needed to organise camps and events. To see, correct or delete what we hold about you, message us and we’ll do it.</p>
<h2>Third-party services</h2>
<p>The site is hosted on GitHub Pages and loads its typefaces from Google Fonts. Like any web server, these services receive technical information such as your IP address when your browser requests a page or a font. Their own privacy policies apply.</p>
<h2>Changes</h2>
<p>When we add the newsletter, accounts or the shop, this page will be updated before any new personal data is collected.</p>
<h2>Contact</h2>
<p>Questions: message us on Instagram at <a href="{IG}" rel="noopener">{IG_HANDLE}</a>.</p>
</div></section>"""

def notfound():
    return f"""
<section class="page-hero dark" style="min-height:70vh">{sym_svg("ghost")}<div class="wrap" style="position:relative">
<p class="label muted"><span class="bar"></span>404</p>
<h1 class="display h-xl">Off the mat<span class="dot">.</span></h1>
<p class="lead soft">This page doesn’t exist — or not yet.</p>
<div style="margin-top:36px"><a class="btn btn-primary" href="/">Back to home {arrow()}</a></div></div></section>"""

PAGES = [
    ("/", "index.html", "CHIDAOBA CULTURE — Rooted in heritage. Built for the future.",
     "Georgian wrestling heritage expressed through modern sports culture. Chidaoba, camps and events, community, journal and apparel — from Tbilisi, Georgia.", home),
    ("/culture/", "culture/index.html", "What is Chidaoba? — CHIDAOBA CULTURE",
     "Chidaoba, Georgia’s traditional wrestling — inscribed on UNESCO’s Representative List of Intangible Cultural Heritage in 2018.", culture),
    ("/camps/", "camps/index.html", "Camps & Events — CHIDAOBA CULTURE",
     "Training camps, Chidaoba workshops, wrestling seminars, BJJ/No-Gi camps and cultural experiences in Georgia.", camps),
    ("/community/", "community/index.html", "Community — CHIDAOBA CULTURE",
     "Athletes, coaches and clubs of Georgian wrestling and grappling.", community),
    ("/journal/", "journal/index.html", "Journal — CHIDAOBA CULTURE",
     "Stories on Georgian wrestling heritage, technique, training and the people behind it.", journal),
    ("/shop/", "shop/index.html", "Shop — CHIDAOBA CULTURE", "Drop 01 — premium training apparel from CHIDAOBA CULTURE.", shop),
    ("/privacy/", "privacy/index.html", "Privacy — CHIDAOBA CULTURE", "Privacy information for chidaoba.com.", privacy),
    ("/404.html", "404.html", "Not found — CHIDAOBA CULTURE", "Page not found.", notfound),
]

if __name__ == "__main__":
    for path, out, title, desc, fn in PAGES:
        full = os.path.join(ROOT, out)
        os.makedirs(os.path.dirname(full), exist_ok=True)
        with open(full, "w") as f:
            f.write(page(path, html.escape(title, quote=False), html.escape(desc), fn()))
        print("wrote", out)
    sm = "".join(f"<url><loc>https://chidaoba.com{p}</loc></url>" for p, o, *_ in PAGES if not o.startswith("404"))
    open(os.path.join(ROOT, "sitemap.xml"), "w").write(
        f'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{sm}</urlset>\n')
    open(os.path.join(ROOT, "robots.txt"), "w").write("User-agent: *\nAllow: /\nSitemap: https://chidaoba.com/sitemap.xml\n")
    print("wrote sitemap.xml, robots.txt")
