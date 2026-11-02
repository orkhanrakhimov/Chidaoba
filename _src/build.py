#!/usr/bin/env python3
"""Static page generator for chidaoba.com (Phase 1).

Run from the repo root:  python3 _src/build.py
Writes index.html, culture/, camps/, community/, journal/, shop/, privacy/ and 404.html.
Folders starting with "_" are not published by GitHub Pages (Jekyll), so this source stays private to the repo.
"""
import os, html, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SYM = open(os.path.join(ROOT, "_src", "symbol_path.txt")).read().strip()
IG = "https://www.instagram.com/chidaobaculture/"
IG_HANDLE = "@chidaobaculture"
EMAIL = "chidaobaculture@gmail.com"
WA_NUM = "995595606670"
WA_SHOW = "+995 595 606 670"
WA = "https://wa.me/" + WA_NUM + "?text=" + "Hi%20CHIDAOBA%2C%20"
UNESCO = "https://ich.unesco.org/en/RL/chidaoba-wrestling-in-georgia-01371"

NAV = [("/", "Home"), ("/culture/", "Culture"), ("/camps/", "Camps &amp; Events"),
       ("/georgia/", "Why Georgia"), ("/community/", "Community"), ("/journal/", "Journal"), ("/shop/", "Shop")]

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
<link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,300..800&amp;family=Noto+Sans+Georgian:wght@400;600;700&amp;display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/css/site.css?v={ASSET_V}">
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
"""

def header(path):
    links = "".join(f'<a href="{h}"{" aria-current=\"page\"" if h == path else ""}>{t}</a>' for h, t in NAV[1:])
    mlinks = "".join(f'<a href="{h}"{" aria-current=\"page\"" if h == path else ""}>{t}</a>' for h, t in NAV)
    return f"""<header class="site-head">
  <div class="wrap">
    <a class="brand" href="/" aria-label="CHIDAOBA CULTURE home"><img src="/assets/img/symbol-chalk.svg" alt="CHIDAOBA CULTURE" width="26" height="36"></a>
    <nav class="nav" aria-label="Main">{links}</nav>
    <div class="head-tools">
      <a class="bag" href="/shop/" aria-label="Shop">{BAG}</a>
      <button class="burger" type="button" aria-label="Menu" aria-expanded="false" aria-controls="mobile-menu"><span></span><span></span><span></span></button>
    </div>
  </div>
</header>
<div class="mobile-menu" id="mobile-menu">
  <nav aria-label="Mobile">{mlinks}</nav>
  <a class="label" href="{IG}" rel="noopener">Instagram {IG_HANDLE}</a>
</div>
"""

WA_ICON = ('<svg viewBox="0 0 24 24" aria-hidden="true" width="22" height="22"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.1 5.1 0 0 0 1.1 2.7 11.6 11.6 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .1-1.3c0-.1-.2-.2-.4-.3Z"/></svg>')

def newsletter_form(where):
    big = where != "foot"
    return f"""<form class="js-form news{' news-big' if big else ''}" data-key="{WEB3FORMS_KEY}" data-ok-text="You’re on the list. Welcome to The Culture Letter." novalidate>
      <input type="hidden" name="subject" value="Newsletter signup, The Culture Letter">
      <input type="hidden" name="from_name" value="chidaoba.com">
      <input type="checkbox" name="botcheck" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">
      <label class="news-label" for="nl-{where}">The Culture Letter</label>
      <p class="news-sub">Camps, events, new releases and stories. A few times a year.</p>
      <div class="news-row"><input id="nl-{where}" name="email" type="email" autocomplete="email" placeholder="Your email" required>
      <button class="btn btn-primary" type="submit">Subscribe</button></div>
      <label class="news-consent"><input type="checkbox" name="consent" value="yes" required> I agree to receive emails and accept the <a href="/privacy/">privacy notice</a>.</label>
      <p class="form-msg" aria-live="polite"></p>
    </form>"""

def footer(path=""):
    return f"""<footer class="site-foot">
  <div class="wrap">
    <div class="foot-grid">
      <div>
        <img src="/assets/img/lockup-chalk.svg" alt="CHIDAOBA CULTURE" width="400" height="40">
        <p class="body soft" style="margin-top:24px;max-width:26em">Georgian wrestling heritage, expressed through modern sports culture. Tbilisi, Georgia.</p>
        {'' if path == '/' else newsletter_form('foot')}
      </div>
      <div><h3>Explore</h3><ul>
        <li><a href="/culture/">Culture</a></li><li><a href="/camps/">Camps &amp; Events</a></li>
        <li><a href="/georgia/">Why Georgia</a></li><li><a href="/community/">Community</a></li><li><a href="/journal/">Journal</a></li><li><a href="/shop/">Shop</a></li></ul></div>
      <div><h3>Brand</h3><ul>
        <li><a href="/culture/">About</a></li><li><a href="/contact/">Contact</a></li>
        <li><a href="mailto:{EMAIL}">{EMAIL}</a></li><li><a href="{WA}" rel="noopener">WhatsApp</a></li>
        <li><a href="{IG}" rel="noopener">Instagram</a></li></ul></div>
      <div><h3>Legal</h3><ul><li><a href="/privacy/">Privacy</a></li></ul></div>
    </div>
    <div class="foot-bottom label"><span>© <span data-year>2026</span> Chidaoba Culture</span><span>A culture that moves<span class="dot">.</span></span></div>
  </div>
</footer>
<a class="wa-float" href="{WA}" rel="noopener" aria-label="Message us on WhatsApp">{WA_ICON}<span>WhatsApp</span></a>
<script src="/assets/js/site.js?v={ASSET_V}" defer></script>
</body>
</html>
"""

ASSET_V = "10"
EXTRA_JS = {"/camps/": ["config", "venues", "data", "camps"], "/camps/camp/": ["config", "venues", "data", "camps"], "/camps/venue/": ["config", "venues", "data", "camps"], "/admin/": ["config", "venues", "data", "admin"]}

def page(path, title, desc, main):
    js = "".join(f'<script src="/assets/js/{n}.js?v={ASSET_V}" defer></script>' for n in EXTRA_JS.get(path, []))
    out = head(title, desc, path) + header(path) + f'<main id="main">{main}</main>\n' + footer(path)
    if path == "/admin/":
        out = head(title, desc, path).replace('<meta name="viewport"', '<meta name="robots" content="noindex,nofollow">\n<meta name="viewport"') + f'<main id="admin" class="adm"></main>' + f'<script src="/assets/js/site.js?v={ASSET_V}" defer></script></body></html>'
    tag = f'<script src="/assets/js/site.js?v={ASSET_V}" defer></script>'
    return out.replace(tag, js + tag)

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
  {sym_svg("hero-sym")}
  <div class="wrap">
    <p class="label muted fade-load hero-top"><span><span class="bar"></span>Chidaoba Culture, Tbilisi, Georgia</span><a class="hero-story" href="/culture/">Our story {arrow()}</a></p>
    <div>
      <h1 id="hero-title" class="display h-xl"><span class="ln"><span>A culture</span></span><span class="ln"><span>that moves<span class="dot">.</span></span></span></h1>
      <p class="lead soft fade-load">A culture shaped by movement, discipline and the spirit of Georgian wrestling, and a home for everyone who wrestles and grapples today.</p>
      <div class="ctas fade-load">
        <a class="btn btn-primary" href="/camps/">Explore camps {arrow()}</a>
        <a class="btn btn-ghost" href="/shop/">Shop {arrow()}</a>
      </div>
    </div>
    <div class="hero-foot label muted">
      <span>Chidaoba, UNESCO Intangible Cultural Heritage, 2018</span>
      <span class="scroll-cue"><i></i>Scroll</span>
    </div>
  </div>
</section>

<section class="section light" aria-labelledby="intro-title">
  <div class="wrap">
    <div class="intro">
      <p class="label" style="grid-column:1/-1"><span class="bar"></span>01 · The culture</p>
      <h2 id="intro-title" class="display h-lg reveal">More than a wrestling style<span class="dot">.</span></h2>
      <div class="text reveal">
        <p class="scrub scrub-sm">Chidaoba is more than a traditional wrestling discipline. It is movement, discipline and heritage, a connection between generations, carried through the grip.</p>
        <p class="body muted">For centuries it has combined wrestling with music, dance and its own garments. CHIDAOBA CULTURE exists to preserve, develop, modernise and share that culture, and to connect it with today’s wrestling, judo, Brazilian Jiu-Jitsu and grappling world.</p>
        <a class="link" href="/culture/" style="align-self:start">What is Chidaoba</a>
      </div>
      <div class="stats stagger">
        <div class="stat"><b data-count="2018" data-from="1900">2018</b><span>Chidaoba, wrestling in Georgia, inscribed on UNESCO’s Representative List of the Intangible Cultural Heritage of Humanity.</span></div>
        <div class="stat"><b data-count="200" data-pre="≈">≈200</b><span>Holds and counter-holds by UNESCO’s estimate, and the creativity of combining them.</span></div>
        <div class="stat"><b>ჭ</b><span>The first letter of ჭიდაობა. One letter carries the brand.</span></div>
      </div>
    </div>
    <p class="src">Source: <a href="{UNESCO}" rel="noopener">UNESCO Intangible Cultural Heritage: Chidaoba, wrestling in Georgia</a></p>
  </div>
</section>

<section class="section dark" aria-labelledby="camps-title">
  <div class="wrap">
    <div class="sec-head">
      <p class="label muted"><span class="bar"></span>02 · Camps &amp; Events</p>
      <h2 id="camps-title" class="display h-lg reveal">Train. Connect. Experience<span class="dot">.</span></h2>
      <p class="body soft reveal">Training camps, workshops, competitions and cultural experiences rooted in Georgian grappling culture, in Georgia and abroad.</p>
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
        <p class="label"><span class="bar"></span>03 · Community</p>
        <h2 class="display h-md">Built by people<span class="dot">.</span></h2>
        <p class="body muted">Athletes, coaches and clubs who carry the culture, in Georgia and around the world. Profiles are in preparation.</p>
        <div class="cols3"><div><b>Athletes</b><span>Wrestlers and grapplers</span></div><div><b>Coaches</b><span>The people who teach</span></div><div><b>Clubs</b><span>Where to train</span></div></div>
        <a class="link" href="/contact/" style="align-self:start">Coach, athlete or club? Get in touch</a>
      </article>
      <article class="reveal">
        <p class="label"><span class="bar"></span>04 · Journal</p>
        <h2 class="display h-md">Stories from the circle<span class="dot">.</span></h2>
        <p class="body muted">An editorial home for Georgian wrestling and grappling: heritage, technique, training and the people behind it. First stories coming soon.</p>
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
        <p class="label muted"><span class="bar"></span>05 · Apparel</p>
        <h2 id="drop-title" class="display h-lg">Drop 01<span class="dot">.</span></h2>
        <p class="lead soft">Fight wear, gis and kimonos, gear and everyday pieces. The first collection is in development. Tell us what you want first.</p>
        <a class="btn btn-primary" href="/shop/" style="align-self:start">Explore collection {arrow()}</a>
      </div>
    </div>
  </div>
</section>

<section class="section dark invite" aria-labelledby="invite-title" style="border-top:1px solid var(--carbon-line)">
  <div class="wrap">
    <p class="label muted"><span class="bar"></span>06 · Join</p>
    <h2 id="invite-title" class="display h-lg reveal" style="margin-top:24px">More than a sport. A culture we share<span class="dot">.</span></h2>
    <div class="invite-links reveal">
      <a href="{IG}" rel="noopener"><span class="label muted">Instagram</span><b>{IG_HANDLE} →</b></a>
      <a href="/camps/"><span class="label muted">Upcoming</span><b>Camps &amp; events →</b></a>
      <a href="{WA}" rel="noopener"><span class="label muted">WhatsApp</span><b>{WA_SHOW} →</b></a>
    </div>
    <div class="news-wrap reveal">{newsletter_form("home")}</div>
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

UNESCO_DEC = "https://ich.unesco.org/en/Decisions/13.COM/10.b.15"
AFP = "https://en.prothomalo.com/sports/Chidaoba-wrestling-gets-UNESCO-protected-status"

def culture():
    story = [
        ("Long before it was a sport, Chidaoba was preparation for battle, a skill it kept until the late Middle Ages.", "UNESCO"),
        ("Then the fight became a celebration. Tournaments moved into open-air arenas in villages and towns, surrounded by large crowds.", "UNESCO; AFP, 2018"),
        ("Music opened every bout. The zurna and the doli set the rhythm, the crowd formed the circle, and sometimes the wrestlers left the arena dancing.", "UNESCO"),
        ("Its code was chivalric. Strength mattered, but so did respect: for the opponent, and for the people watching.", "UNESCO Decision 13.COM 10.b.15"),
        ("It was passed from one generation to the next, in families, schools and village clubs. Children learned by watching, then practised outdoors from spring to autumn.", "UNESCO; AFP, 2018"),
        ("Today there is a wrestling section in almost every village and city in Georgia. The tradition is still alive.", "UNESCO"),
    ]
    st = "".join(f'<div class="scrub-item"><span class="n">{i+1:02d}</span><p class="scrub">{t}</p><p class="scrub-src">Source: {src}</p></div>'
                 for i, (t, src) in enumerate(story))
    disc = [("Traditional Georgian Chidaoba", "The root", True), ("Wrestling", "", False), ("Grappling", "", False),
            ("Brazilian Jiu-Jitsu", "", False), ("Judo", "", False), ("Related combat &amp; grappling sports", "", False)]
    dl = "".join(f'<li{" class=\"root\"" if r else ""}><span>{t}</span>{f"<small>{tag}</small>" if tag else ""}</li>' for t, tag, r in disc)
    mq_items = ['<span class="k">ჭიდაობა</span>', '<span>Wrestling</span>', '<span class="d">·</span>', '<span>Grappling</span>',
                '<span class="d">·</span>', '<span>Jiu-Jitsu</span>', '<span class="d">·</span>', '<span>Judo</span>', '<span class="d">·</span>']
    mq = "".join(mq_items) * 2
    return f"""
<div class="cx">
<section class="cx-hero dark" aria-labelledby="c-title">
  <div class="ghost-word" aria-hidden="true">ჭ</div>
  <div class="wrap">
    <p class="label muted fade-load"><span class="bar"></span>Culture · <span class="ka">ჭიდაობა</span></p>
    <h1 id="c-title" class="display"><span class="ln"><span>Rooted in</span></span><span class="ln"><span>heritage.</span></span><span class="ln"><span>Built for the</span></span><span class="ln"><span>future<span class="dot">.</span></span></span></h1>
    <p class="lead soft fade-load">CHIDAOBA is a Georgian-rooted sports culture brand inspired by the tradition of wrestling. We celebrate where grappling comes from, support where it is going, and bring its community closer together.</p>
    <div class="cx-hero-foot fade-load">
      <span class="label muted">UNESCO Intangible Cultural Heritage of Humanity, 2018</span>
      <span class="label muted scroll-cue"><i></i>Scroll</span>
    </div>
  </div>
</section>

<section class="story dark" aria-labelledby="story-title">
  <div class="wrap">
    <p class="label muted" id="story-title"><span class="bar"></span>01 · The story of Chidaoba</p>
    <div class="scrub-list">{st}</div>
  </div>
</section>

<section class="section light" aria-labelledby="details-title">
  <div class="wrap">
    <div class="sec-head" style="margin-bottom:48px">
      <p class="label"><span class="bar"></span>02 · Chidaoba in four details</p>
      <h2 id="details-title" class="display h-md">Four details<span class="dot">.</span></h2>
    </div>
    <div class="details stagger">
      <div><b data-count="2018" data-from="1900">2018</b><p>Inscribed on UNESCO’s Representative List of the Intangible Cultural Heritage of Humanity.</p></div>
      <div><b data-count="200" data-pre="≈">≈200</b><p>Holds and counter-holds, as documented by UNESCO.</p></div>
      <div><b>Open air</b><p>Tournaments in an outdoor arena, surrounded by a large audience.</p></div>
      <div><b>Zurna &amp; doli</b><p>Traditional wind and percussion instruments that accompany Chidaoba wrestling events.</p></div>
    </div>
    <p class="src">Source: <a href="{UNESCO}" rel="noopener">UNESCO: Chidaoba, wrestling in Georgia</a></p>
  </div>
</section>

<section class="section dark why" aria-labelledby="why-title">
  <div class="why-word" aria-hidden="true">ჭიდაობა<span class="eq">=</span><span class="tr">Wrestling</span></div>
  <div class="wrap">
    <div class="why-grid">
      <h2 id="why-title" class="display h-lg stagger"><span>A word that carries our roots<span class="dot">.</span></span></h2>
      <div class="text stagger">
        <p class="label muted"><span class="bar"></span>03 · Why Chidaoba?</p>
        <p class="lead soft">In Georgian, ჭიდაობა (Chidaoba) means wrestling. It is a familiar, everyday word, and one that carries generations of Georgian life, identity and tradition.</p>
        <p class="body soft">We chose it deliberately. CHIDAOBA takes that word beyond its traditional meaning and gives it a modern, international presence, so that a word every Georgian knows becomes a name the whole grappling world can recognise.</p>
      </div>
    </div>
  </div>
</section>

<section class="section dark" aria-labelledby="disc-title" style="padding-top:0">
  <div class="wrap">
    <div class="sec-head" style="margin-bottom:40px">
      <p class="label muted"><span class="bar"></span>04 · More than one discipline</p>
      <h2 id="disc-title" class="display h-md">Inspired by heritage. Open to every grappler<span class="dot">.</span></h2>
      <p class="body soft">CHIDAOBA is inspired by Georgian heritage, but it is not limited to one traditional discipline. We support the sports that share its grip, its discipline and its values.</p>
    </div>
    <ul class="disc">{dl}</ul>
  </div>
</section>

<section class="section light" aria-labelledby="purpose-title">
  <div class="wrap">
    <div class="sec-head" style="margin-bottom:56px">
      <p class="label"><span class="bar"></span>05 · What we do</p>
      <h2 id="purpose-title" class="display h-md">A brand and a community<span class="dot">.</span></h2>
      <p class="body muted">Built around these disciplines, their athletes, their culture and their shared values.</p>
    </div>
    <div class="pillars stagger">
      <div><b>Promote</b><p>Wrestling and grappling sports, in Georgia and around the world.</p></div>
      <div><b>Celebrate</b><p>Their culture: the heritage, the people and the stories behind every grip.</p></div>
      <div><b>Connect</b><p>Athletes, coaches, clubs and communities, and help these sports grow.</p></div>
    </div>
  </div>
</section>

<section class="dark" aria-hidden="true"><div class="marquee"><div class="marquee-track">{mq}</div></div></section>

<section class="cx-close dark" aria-labelledby="close-title">
  <div class="wrap stagger">
    <p class="label muted"><span class="bar"></span>ჭიდაობა</p>
    <h2 id="close-title" class="display h-lg" style="margin-top:24px">A culture that moves<span class="dot">.</span></h2>
    <div style="display:flex;gap:14px;justify-content:center;flex-wrap:wrap;margin-top:40px">
      <a class="btn btn-primary" href="/camps/">Camps &amp; events {arrow()}</a>
      <a class="btn btn-ghost" href="{IG}" rel="noopener">Follow {IG_HANDLE} {arrow()}</a>
    </div>
  </div>
</section>

<section class="section light sources" style="padding:64px 0">
  <div class="wrap">
    <p class="label"><span class="bar"></span>Sources</p>
    <ol style="margin-top:24px">
      <li><a href="{UNESCO}" rel="noopener">UNESCO Intangible Cultural Heritage: “Chidaoba, wrestling in Georgia”</a>, Representative List, inscribed 2018 (13.COM).</li>
      <li><a href="{UNESCO_DEC}" rel="noopener">UNESCO: Decision 13.COM 10.b.15</a> (chivalric nature, friendship and respect, identity).</li>
      <li><a href="{AFP}" rel="noopener">AFP, “Chidaoba wrestling gets UNESCO protected status”</a>, 29 November 2018 (festive tournaments, transmission in families and clubs).</li>
    </ol>
  </div>
</section>
</div>
"""

WEB3FORMS_KEY = ""  # paste the Web3Forms access key here to switch the camp form on

FORMATS = [
    ("Training Camps", "Several days of focused training in Georgia, two sessions a day with local coaches, plus time to recover and explore."),
    ("Chidaoba Workshops", "Learn Georgian traditional wrestling: its grips, throws and the music and ritual that surround a bout."),
    ("Wrestling Seminars", "Technical sessions with Georgian wrestling coaches, built around specific positions and throws."),
    ("BJJ / No-Gi Camps", "Grappling camps where Georgian wrestling meets Brazilian Jiu-Jitsu and no-gi, from takedowns to the ground."),
    ("Competitions", "Tournaments and challenge matches, from friendly club events to open competitions."),
    ("Open Mats", "Drop-in sessions to roll, drill and meet local grapplers. No programme, just training."),
    ("Cultural Experiences", "Time off the mat: Georgian food, landscapes, music and the places where the tradition lives."),
    ("Other Events", "Talks, screenings, team trips and collaborations with clubs and academies."),
]

def camps():
    faqs = [
        ("How do I book?", "Choose a camp, pick your package and add-ons, and press Reserve. You get a booking code and bank details on screen. Your spot is confirmed when the deposit arrives."),
        ("How much is the deposit, and when is the rest due?", "Each camp shows its deposit (usually 30%) and how many days you have to pay it. The rest is paid before the camp starts. We’ll confirm the exact date with you."),
        ("What if the camp is full?", "Join the waitlist from the camp page. If a spot opens, we contact waitlisted people in order."),
        ("Do I need experience?", "Every camp shows its level. Many are open to all levels; tell us your experience when you book."),
        ("Do I need to speak Georgian?", "No. Sessions and communication for international guests are in English."),
        ("How do I get to Georgia?", "Georgia has international airports in Tbilisi, Kutaisi and Batumi. Each camp page says where it is and whether transfers are available as an add-on. Please check the visa rules for your passport."),
        ("Can I bring my team?", "Yes. Camps with a group discount show it on the camp page, and we can build a private camp for your club. Get in touch."),
    ]
    fq = "".join(f'<details><summary>{q}</summary><p>{a}</p></details>' for q, a in faqs)
    tabs = [("all", "All camps"), ("bjj", "BJJ &amp; Grappling"), ("wrestling", "Freestyle &amp; Greco-Roman"), ("judo", "Judo")]
    tb = "".join(f'<button type="button" data-f="{k}" aria-pressed="{"true" if k == "all" else "false"}">{t}</button>' for k, t in tabs)
    return f"""
<section class="page-hero dark camps-hero">
  {sym_svg("ghost")}
  <div class="wrap" style="position:relative">
    <p class="label muted fade-load"><span class="bar"></span>Camps &amp; Events</p>
    <h1 class="display h-xl"><span class="ln"><span>Train. Connect.</span></span><span class="ln"><span>Experience<span class="dot">.</span></span></span></h1>
    <p class="lead soft fade-load">Training camps in Georgia for BJJ &amp; grappling, freestyle &amp; Greco-Roman wrestling and judo, with local coaches, and the culture around the mat.</p>
    <a class="hero-story fade-load" href="/georgia/" style="margin-top:22px">Why train in Georgia {arrow()}</a>
  </div>
</section>

<section class="section dark camps-list-sec" id="camps" style="padding-top:0">
  <div class="wrap">
    <div class="disc-tabs" role="group" aria-label="Filter by discipline">{tb}</div>
    <div id="camp-list" class="camp-list" aria-live="polite"></div>
  </div>
</section>

<section class="section light venues-sec">
  <div class="wrap">
    <div class="sec-head" style="margin-bottom:40px">
      <p class="label"><span class="bar"></span>Where we train</p>
      <h2 class="display h-md">Our venues</h2>
      <p class="body muted">Training halls, rooms and meals in one place, chosen for camps that feel like more than a trip.</p>
    </div>
    <div id="venue-list" class="venue-list"></div>
  </div>
</section>

<section class="section light" style="padding-top:0">
  <div class="wrap">
    <div class="sec-head" style="margin-bottom:48px">
      <p class="label"><span class="bar"></span>How booking works</p>
      <h2 class="display h-md">Three steps to the mat<span class="dot">.</span></h2>
    </div>
    <div class="steps stagger">
      <div><span class="n">01</span><h3>Choose</h3><p>Pick a camp and the package that suits you (training only, with accommodation, or all-inclusive), plus any add-ons.</p></div>
      <div><span class="n">02</span><h3>Reserve</h3><p>Fill in your details. You get a booking code and bank details instantly. Pay the deposit to confirm your spot.</p></div>
      <div><span class="n">03</span><h3>Train</h3><p>We confirm by email or WhatsApp and send everything you need before you arrive. Then: two sessions a day, and Georgia in between.</p></div>
    </div>
    <div class="perks stagger">
      <div><b>Early-bird prices</b><span>Book early, pay less.</span></div>
      <div><b>Group discounts</b><span>Bring your team and save.</span></div>
      <div><b>Waitlist</b><span>Full? Get the next free spot.</span></div>
      <div><b>No card needed</b><span>Deposit by bank transfer.</span></div>
    </div>
  </div>
</section>

<section class="section light" style="padding-top:0">
  <div class="wrap">
    <div class="sec-head" style="margin-bottom:24px">
      <p class="label"><span class="bar"></span>Questions</p>
      <h2 class="display h-md">Good to know<span class="dot">.</span></h2>
    </div>
    <div class="faq">{fq}</div>
    <div class="team-cta">
      <div><p class="label"><span class="bar"></span>Clubs &amp; teams</p><h3 class="display h-md">Want a camp for your club?</h3>
      <p class="body muted">We can build a private camp around your team’s level, dates and budget.</p></div>
      <a class="btn btn-primary" href="/contact/">Get in touch {arrow()}</a>
    </div>
  </div>
</section>
"""

def camp_detail():
    return '<div id="camp-root"><section class="page-hero dark"><div class="wrap"><p class="body soft">Loading camp…</p></div></section></div>'

def venue_page():
    return '<div id="venue-root"><section class="page-hero dark"><div class="wrap"><p class="body soft">Loading venue…</p></div></section></div>'

def admin():
    return ""

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

def georgia():
    roots = [
        "In Georgia, wrestling is not a hobby. It is part of who people are.",
        "For centuries, Chidaoba prepared men for battle. Later it moved into village squares, with music, big crowds and a code of honour.",
        "Today there is a wrestling section in almost every village and city. Kids grow up on the mat, and the whole street knows who won on Sunday.",
        "You are not visiting a sport here. You are stepping into a culture that has been training for generations.",
    ]
    rt = "".join(f'<div class="scrub-item"><span class="n">{i+1:02d}</span><p class="scrub">{t}</p></div>' for i, t in enumerate(roots))
    chapters = [("roots", "Roots"), ("champions", "Champions"), ("newwave", "New wave"), ("land", "The land"),
                ("table", "The table"), ("people", "The people"), ("know", "Good to know")]
    ch = "".join(f'<a href="#{k}"><b>{i+1:02d}</b> {t}</a>' for i, (k, t) in enumerate(chapters))
    day = [("07:30", "Breakfast with a view of the Caucasus"), ("09:00", "Morning session: technique and drilling"),
           ("12:30", "Long Georgian lunch"), ("14:00", "Rest, swim, or walk to the old towers"),
           ("17:30", "Evening session: sparring and live rounds"), ("20:30", "Supra: dinner, toasts and stories")]
    dl = "".join(f'<li><span>{t}</span><b>{x}</b></li>' for t, x in day)
    food = [("Khinkali", "Twisted dumplings full of spiced meat and broth. Hold the top, bite, sip, eat. Never use a fork."),
            ("Khachapuri", "Bread and melted cheese, in a different shape in every region. The Adjarian one comes with an egg and butter on top."),
            ("Mtsvadi", "Meat grilled over vine branches. Simple, smoky, and exactly what you want after two sessions."),
            ("Pkhali &amp; badrijani", "Vegetables with walnut paste and herbs, and fried aubergine rolls. Georgian food is not only meat."),
            ("Lobio", "Slow cooked beans in a clay pot, served with cornbread and pickles."),
            ("Churchkhela", "Walnuts dipped in thickened grape juice and dried. Georgia's original energy bar.")]
    fd = "".join(f'<div class="food"><h3>{n}</h3><p>{d}</p></div>' for n, d in food)
    know = [("Visa", "Citizens of many countries, including the EU, UK and US, can stay without a visa for up to a year. Check the rules for your passport before you book."),
            ("Flights", "International airports in Tbilisi, Kutaisi and Batumi, with direct routes from across Europe and the Middle East."),
            ("Money", "The Georgian lari (GEL). Cards work almost everywhere in cities. Bring some cash for villages and markets."),
            ("Language", "Georgian, with its own alphabet. Many young people speak English, and our team is with you the whole camp."),
            ("Best time", "Late spring to early autumn for mountain camps. Tbilisi works all year."),
            ("Time zone", "GMT+4, all year round.")]
    kn = "".join(f'<div><b>{t}</b><p>{d}</p></div>' for t, d in know)
    return f"""
<div class="cx gx">
<section class="cx-hero dark" aria-labelledby="g-title">
  <div class="ghost-word" aria-hidden="true">ჭ</div>
  <div class="wrap">
    <p class="label muted fade-load"><span class="bar"></span>Why Georgia · <span class="ka">საქართველო</span></p>
    <h1 id="g-title" class="display"><span class="ln"><span>Come train</span></span><span class="ln"><span>where it</span></span><span class="ln"><span>runs deep</span></span></h1>
    <p class="lead soft fade-load">Mountains above the mat, the Black Sea a few hours away, a table that never ends, and a country where everyone knows somebody who wrestles. This is what a camp in Georgia feels like.</p>
    <div class="cx-hero-foot fade-load">
      <span class="label muted">A small country with a very big grip</span>
      <span class="label muted scroll-cue"><i></i>Scroll</span>
    </div>
  </div>
</section>

<nav class="chapters" aria-label="Chapters"><div class="wrap">{ch}</div></nav>

<section class="story dark" id="roots" aria-labelledby="roots-title">
  <div class="wrap">
    <p class="label muted" id="roots-title"><span class="bar"></span>01 · Roots</p>
    <div class="scrub-list">{rt}</div>
  </div>
</section>

<section class="section light" id="champions" aria-labelledby="champ-title">
  <div class="wrap">
    <div class="sec-head" style="margin-bottom:48px">
      <p class="label"><span class="bar"></span>02 · Champions</p>
      <h2 id="champ-title" class="display h-lg">Pound for pound, a grappling superpower</h2>
      <p class="body muted">Around 3.5 million people live in Georgia, fewer than in many single cities. Their results on the mat look like those of a country ten times bigger.</p>
    </div>
    <div class="details stagger">
      <div><b data-count="7">7</b><p>Olympic medals at Paris 2024, Georgia's best Games as an independent country. Judo and wrestling led the way.</p></div>
      <div><b data-count="2025" data-from="1990">2025</b><p>World mixed team judo champions for the first time, ending Japan's run of seven straight titles.</p></div>
      <div><b data-count="23">23</b><p>World wrestling medals per million people, second only to Bulgaria in the all-time per capita ranking.</p></div>
      <div><b>×2</b><p>Lasha Bekauri, Olympic judo champion in Tokyo and again in Paris. Geno Petriashvili took freestyle gold at 125 kg in Paris.</p></div>
    </div>
    <p class="body muted gx-note">Even in the Soviet years, Georgian judoka won more medals for the USSR than any other republic. In 2026 Tbilisi hosted the European Judo Championships, and Georgia topped the table with four golds.</p>
  </div>
</section>

<section class="section dark" id="newwave" aria-labelledby="nw-title">
  <div class="wrap gx-split">
    <div class="stagger">
      <p class="label muted"><span class="bar"></span>03 · The new wave</p>
      <h2 id="nw-title" class="display h-lg">And now, everybody rolls</h2>
    </div>
    <div class="stagger">
      <p class="lead soft">Brazilian jiu-jitsu and no-gi grappling are spreading fast in Georgia. New academies keep opening across Tbilisi, international tournaments now come to the city, and the mats are full of people who grew up wrestling or doing judo.</p>
      <p class="body soft">That mix is what makes training here special. Your partner might be a BJJ blue belt, a former Greco-Roman wrestler or a judoka with a national medal. Expect strong grips, real takedowns and rounds that test you.</p>
      <ul class="chips gx-chips"><li>BJJ</li><li>No-gi</li><li>Freestyle</li><li>Greco-Roman</li><li>Judo</li><li>Chidaoba</li></ul>
    </div>
  </div>
</section>

<section class="gx-band" aria-hidden="true"><img src="/assets/venues/mulakhi/summer-terrace-pool.jpg" alt="" loading="lazy" data-par></section>

<section class="section light" id="land" aria-labelledby="land-title">
  <div class="wrap">
    <div class="sec-head" style="margin-bottom:48px">
      <p class="label"><span class="bar"></span>04 · The land</p>
      <h2 id="land-title" class="display h-lg">The perfect place to sweat</h2>
      <p class="body muted">Georgia packs a whole continent into a small map. You can train in the mountains in the morning and be near the sea a day later.</p>
    </div>
    <div class="pillars stagger gx-land">
      <div><b>The mountains</b><p>The Greater Caucasus runs along the north, with peaks above 5,000 m. In Svaneti, medieval stone towers stand over villages, and the air is cool even in July. It is altitude training without trying.</p></div>
      <div><b>The sea</b><p>The Black Sea coast around Batumi brings warm water, beaches and subtropical green. Perfect for a recovery day, or for staying on after camp.</p></div>
      <div><b>The seasons</b><p>Hot, sunny summers in the lowlands, mild springs and golden autumns, and real snow in the mountains in winter. Camps run when the weather is at its best.</p></div>
    </div>
    <div class="gx-day reveal">
      <p class="label"><span class="bar"></span>A camp day in the mountains</p>
      <ol>{dl}</ol>
    </div>
  </div>
</section>

<section class="section dark why" id="table" aria-labelledby="table-title">
  <div class="why-word" aria-hidden="true">სუფრა<span class="eq">=</span><span class="tr">Supra</span></div>
  <div class="wrap">
    <div class="why-grid">
      <h2 id="table-title" class="display h-lg stagger"><span>A table that never ends</span></h2>
      <div class="text stagger">
        <p class="label muted"><span class="bar"></span>05 · The table</p>
        <p class="lead soft">A Georgian feast is called a supra. Plates are stacked on plates, a tamada leads the toasts, and dinner can last longer than your sparring session.</p>
        <p class="body soft">Georgia is also where wine began. Archaeologists found traces of winemaking around 8,000 years old near Tbilisi, and families still make it in clay qvevri buried in the ground, a method UNESCO lists as heritage of humanity.</p>
      </div>
    </div>
    <div class="foods stagger">{fd}</div>
  </div>
</section>

<section class="section light" id="people" aria-labelledby="people-title">
  <div class="wrap gx-split">
    <div class="stagger">
      <p class="label"><span class="bar"></span>06 · The people</p>
      <h2 id="people-title" class="display h-lg">A guest is a gift</h2>
    </div>
    <div class="stagger">
      <p class="lead">There is an old Georgian saying: a guest is a gift from God. You will feel it at the table, in the gym and on the street.</p>
      <p class="body muted">People are proud of their country and love to share it. Someone will invite you home, someone will pour you one more glass, and someone will start singing. Georgian polyphonic singing is on UNESCO's heritage list too, and you might hear it at your own supra.</p>
      <p class="body muted">At CHIDAOBA camps you train together, eat together and travel together. Most people arrive as strangers and leave with a team.</p>
    </div>
  </div>
</section>

<section class="gx-band" aria-hidden="true"><img src="/assets/venues/mulakhi/summer-pitch.jpg" alt="" loading="lazy" data-par></section>

<section class="section alt" id="know" aria-labelledby="know-title">
  <div class="wrap">
    <div class="sec-head" style="margin-bottom:40px">
      <p class="label"><span class="bar"></span>07 · Good to know</p>
      <h2 id="know-title" class="display h-md">Easy to get to, hard to leave</h2>
    </div>
    <div class="details gx-know stagger">{kn}</div>
  </div>
</section>

<section class="cx-close dark" aria-labelledby="gclose-title">
  <div class="wrap stagger">
    <p class="label muted"><span class="bar"></span>გელოდებით · We are waiting for you</p>
    <h2 id="gclose-title" class="display h-lg" style="margin-top:24px">Your camp starts here</h2>
    <div style="display:flex;gap:14px;justify-content:center;flex-wrap:wrap;margin-top:40px">
      <a class="btn btn-primary" href="/camps/">See camps {arrow()}</a>
      <a class="btn btn-ghost" href="{WA}" rel="noopener">Ask us on WhatsApp {arrow()}</a>
    </div>
  </div>
</section>

<section class="section light sources" style="padding:64px 0">
  <div class="wrap">
    <p class="label"><span class="bar"></span>Sources</p>
    <ol style="margin-top:24px">
      <li><a href="{UNESCO}" rel="noopener">UNESCO: Chidaoba, wrestling in Georgia</a> (history, village sections).</li>
      <li><a href="https://civil.ge/?p=620006" rel="noopener">Civil.ge: Georgia finishes Paris 2024 with seven medals</a>.</li>
      <li><a href="https://1tv.ge/lang/en/news/judo-georgias-team-becomes-world-champion/" rel="noopener">1TV: Georgia's team becomes judo world champion</a> (Budapest 2025).</li>
      <li><a href="https://www.mappr.co/?p=94596" rel="noopener">Mappr: World wrestling medals per capita</a> (UWW data, 1951 to 2025).</li>
      <li><a href="https://www.olympedia.org/countries/GEO" rel="noopener">Olympedia: Georgia</a> (Soviet era judo medals).</li>
      <li><a href="https://georgiatoday.ge/georgia-wins-4-golds-at-european-judo-championships/" rel="noopener">Georgia Today: Georgia wins 4 golds at the 2026 European Judo Championships</a>.</li>
      <li><a href="https://www.rferl.org/a/earliest-evidence-grape-winemaking-found-ancient-jars-georgia-8000-years-ago/28852538.html" rel="noopener">RFE/RL: Earliest evidence of winemaking found in Georgia</a>.</li>
      <li><a href="https://www.decanter.com/wine-news/georgian-winemaking-method-joins-unesco-heritage-list-30889" rel="noopener">Decanter: Qvevri winemaking joins the UNESCO list</a>.</li>
    </ol>
  </div>
</section>
</div>
"""


SHOP = [
  ("fightwear", "Fight wear", "Made for rolling, scrambling and hard rounds.", [
    ("Rashguards", "Long and short sleeve. Tight fit, flatlock seams, colours that last.", "BJJ · Grappling"),
    ("Fight shorts", "Stretch panels, no pockets, a waistband that stays put.", "BJJ · Grappling"),
    ("Spats", "Compression leggings for no-gi and wrestling.", "No-gi · Wrestling"),
    ("Wrestling singlets", "Classic cut, competition ready, in red and carbon.", "Freestyle · Greco-Roman"),
  ]),
  ("gis", "Gis &amp; kimonos", "Heavyweight cloth, reinforced where it counts.", [
    ("BJJ gi", "Pearl weave jacket, ripstop pants, clean CHIDAOBA marks.", "BJJ"),
    ("Judo kimono", "Double weave judogi for training and randori.", "Judo"),
    ("Belts", "Rank belts for BJJ and judo.", "BJJ · Judo"),
  ]),
  ("gear", "Gear", "Everything that goes in the bag, and the bag.", [
    ("Gear bags", "Duffels and backpacks with a separate wet compartment.", "All disciplines"),
    ("Headgear", "Ear guards to save your ears from the mat.", "Wrestling · Grappling"),
    ("Mouthguards", "Boil and bite, with a case.", "All disciplines"),
    ("Knee pads", "Low profile pads for shots and scrambles.", "Wrestling"),
    ("Wrestling shoes", "Light, grippy, ankle support.", "Wrestling"),
    ("Tape", "Finger and joint tape for the grip fighters.", "All disciplines"),
  ]),
  ("lifestyle", "Lifestyle", "The culture off the mat.", [
    ("Hoodies", "Heavy cotton, relaxed fit, ჭ on the chest.", "Everyday"),
    ("T-shirts", "Heavyweight tees in carbon, chalk and red.", "Everyday"),
    ("Sweatshirts", "Crewnecks for travel days and cold gyms.", "Everyday"),
    ("Track pants", "Tapered joggers to wear to and from training.", "Everyday"),
    ("Caps &amp; beanies", "Embroidered ჭ, nothing loud.", "Everyday"),
    ("Tote bags", "Heavy canvas for the gym or the market.", "Everyday"),
  ]),
]

def slugify(n):
    return re.sub(r"[^a-z0-9]+", "-", n.replace("&amp;", "and").lower()).strip("-")

def wa_order(n):
    from urllib.parse import quote
    name = n.replace("&amp;", "&")
    msg = f"Hi CHIDAOBA! I want to order: {name}\nhttps://chidaoba.com/shop/#{slugify(n)}\nSize: \nColour: "
    return f"https://wa.me/{WA_NUM}?text={quote(msg)}"

def shop():
    nav = "".join(f'<a href="#{k}"><b>0{i+1}</b>{t}</a>' for i,(k,t,_,_) in enumerate(SHOP))
    depts = ""
    for i,(k,t,sub,items) in enumerate(SHOP):
        tiles = "".join(f"""<article class="ptile" id="{slugify(n)}">
          <div class="ptile-art" aria-hidden="true">{sym_svg("")}<span>0{i+1}.{j+1}</span></div>
          <div class="ptile-body"><p class="ptile-tag">{tag}</p><h3>{n}</h3><p>{d}</p>
          <a class="ptile-wa" href="{wa_order(n)}" rel="noopener">{WA_ICON}Order<span class="wa-long"> on WhatsApp</span></a></div></article>""" for j,(n,d,tag) in enumerate(items))
        depts += f"""<section class="dept section {'light' if i%2==0 else 'alt'}" id="{k}"><div class="wrap">
      <div class="dept-head reveal"><span class="dept-num">0{i+1}</span><div><h2 class="display h-lg">{t}</h2><p class="lead">{sub}</p></div></div>
      <div class="pgrid stagger">{tiles}</div></div></section>"""
    cats = "".join(f'<label><input type="checkbox" name="wants" value="{n}"><span>{n}</span></label>' for _,_,_,items in SHOP for n,_,_ in items)
    sizes = "".join(f'<label><input type="checkbox" name="sizes" value="{z}"><span>{z}</span></label>' for z in ["XS","S","M","L","XL","XXL","A0","A1","A2","A3","A4"])
    return f"""
<section class="page-hero dark">
  {sym_svg("ghost")}
  <div class="wrap" style="position:relative">
    <p class="label muted fade-load"><span class="bar"></span>Shop · Drop 01 in development</p>
    <h1 class="display h-xl"><span class="ln"><span>Built for</span></span><span class="ln"><span>the mat</span></span></h1>
    <p class="lead soft fade-load">Fight wear, gis, gear and everyday pieces for wrestlers, grapplers and judoka. Designed in Tbilisi. See something you want? Tap order and message us on WhatsApp.</p>
    <nav class="shop-nav fade-load" aria-label="Shop sections">{nav}</nav>
  </div>
</section>
{depts}
<section class="section dark" id="request"><div class="wrap reg">
  <div class="reg-intro">
    <p class="label muted"><span class="bar"></span>Shape Drop 01</p>
    <h2 class="display h-lg">Tell us what you want first</h2>
    <p class="body soft">Pick what you would buy and your size. The most wanted pieces get made first, and everyone on this list gets early access and launch pricing.</p>
  </div>
  <form class="js-form" data-key="{WEB3FORMS_KEY}" data-done="shop-done" data-multi="wants,sizes" novalidate>
    <input type="hidden" name="subject" value="Shop interest, chidaoba.com">
    <input type="hidden" name="from_name" value="chidaoba.com">
    <input type="checkbox" name="botcheck" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">
    <fieldset class="field full"><legend>I would buy</legend><div class="checks">{cats}</div></fieldset>
    <fieldset class="field full"><legend>My size <em>gi sizes A0 to A4</em></legend><div class="checks">{sizes}</div></fieldset>
    <div class="field"><label for="s-name">Name</label><input id="s-name" name="name" autocomplete="name" required></div>
    <div class="field"><label for="s-email">Email</label><input id="s-email" name="email" type="email" autocomplete="email" required></div>
    <div class="field full"><label for="s-msg">Anything else <em>optional</em></label><textarea id="s-msg" name="message" placeholder="Colours, fits, a piece we missed..."></textarea></div>
    <label class="consent"><input type="checkbox" name="consent" value="yes" required><span>Email me when Drop 01 is ready. See the <a href="/privacy/">privacy notice</a>.</span></label>
    <div class="form-foot"><button class="btn btn-primary" type="submit">Join the drop list {arrow()}</button><p class="form-msg" aria-live="polite"></p></div>
  </form>
  <div class="done" id="shop-done" role="status">
    <p class="label muted"><span class="bar"></span>You are on the list</p>
    <h3 class="display h-md">Thank you</h3>
    <p class="body soft">We will email you before Drop 01 goes live. Follow <a href="{IG}" rel="noopener">{IG_HANDLE}</a> for first looks.</p>
  </div>
</div></section>
"""

def privacy():
    return f"""
<section class="page-hero dark"><div class="wrap"><p class="label muted"><span class="bar"></span>Legal</p>
<h1 class="display h-lg">Privacy<span class="dot">.</span></h1></div></section>
<section class="section light"><div class="wrap prose">
<p class="label muted">Last updated: November 2026</p>
<h2>What this website collects</h2>
<p>We only collect what you choose to send us through the forms on this site:</p>
<p><b>Camp interest form</b>, name, email, country, age, training experience and the optional details you add (phone/WhatsApp, belt or skill level, club, interests, accommodation needs, message). Used to contact you about camps and events.</p>
<p><b>Contact form</b>, name, email, topic, message and optional phone. Used to reply to you.</p>
<p><b>The Culture Letter</b>, your email address. Used to send our newsletter; you can unsubscribe at any time by replying “unsubscribe” or emailing us.</p>
<p>We don’t sell or share your details, and there are no accounts, analytics or advertising cookies on this site.</p>
<h2>How the forms work</h2>
<p>Form submissions are delivered to our inbox (chidaobaculture@gmail.com) by Web3Forms, a form-processing service. If the form opens your email app instead, your message is sent from your own email account. We keep your details only as long as needed. To see, correct or delete what we hold about you, email us and we’ll do it.</p>
<p>WhatsApp and Instagram links open those services; their own privacy policies apply when you use them.</p>
<h2>Third-party services</h2>
<p>The site is hosted on GitHub Pages and loads its typefaces from Google Fonts. Like any web server, these services receive technical information such as your IP address when your browser requests a page or a font. Their own privacy policies apply.</p>
<h2>Changes</h2>
<p>When we add accounts or the shop, this page will be updated before any new personal data is collected.</p>
<h2>Contact</h2>
<p>Questions: email <a href="mailto:{EMAIL}">{EMAIL}</a> or message us on Instagram at <a href="{IG}" rel="noopener">{IG_HANDLE}</a>.</p>
</div></section>"""

def notfound():
    return f"""
<section class="page-hero dark" style="min-height:70vh">{sym_svg("ghost")}<div class="wrap" style="position:relative">
<p class="label muted"><span class="bar"></span>404</p>
<h1 class="display h-xl">Off the mat<span class="dot">.</span></h1>
<p class="lead soft">This page doesn’t exist yet.</p>
<div style="margin-top:36px"><a class="btn btn-primary" href="/">Back to home {arrow()}</a></div></div></section>"""

def contact():
    topics = ["General question", "Camps &amp; events", "Coach / athlete / club", "Partnership or collaboration", "Press", "Shop &amp; apparel"]
    opts = "".join(f"<option>{t}</option>" for t in topics)
    return f"""
<section class="page-hero dark">
  {sym_svg("ghost")}
  <div class="wrap" style="position:relative">
    <p class="label muted fade-load"><span class="bar"></span>Contact</p>
    <h1 class="display h-xl"><span class="ln"><span>Let’s talk<span class="dot">.</span></span></span></h1>
    <p class="lead soft fade-load">Questions about camps, clubs, partnerships or the brand? Write to us, or message us on WhatsApp.</p>
  </div>
</section>
<section class="section dark" style="padding-top:0">
  <div class="wrap reg">
    <div class="reg-intro">
      <div class="contact-list stagger">
        <a href="mailto:{EMAIL}"><span class="label muted">Email</span><b>{EMAIL}</b></a>
        <a href="{WA}" rel="noopener"><span class="label muted">WhatsApp</span><b>{WA_SHOW}</b></a>
        <a href="{IG}" rel="noopener"><span class="label muted">Instagram</span><b>{IG_HANDLE}</b></a>
        <div><span class="label muted">Based in</span><b>Tbilisi, Georgia</b></div>
      </div>
    </div>
    <form id="contact-form" class="js-form" data-key="{WEB3FORMS_KEY}" data-done="contact-done" novalidate>
      <input type="hidden" name="subject" value="New message, chidaoba.com">
      <input type="hidden" name="from_name" value="chidaoba.com">
      <input type="checkbox" name="botcheck" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">
      <div class="field"><label for="c-name">Name</label><input id="c-name" name="name" autocomplete="name" required></div>
      <div class="field"><label for="c-email">Email</label><input id="c-email" name="email" type="email" autocomplete="email" required></div>
      <div class="field"><label for="c-topic">Topic</label><select id="c-topic" name="topic">{opts}</select></div>
      <div class="field"><label for="c-phone">Phone / WhatsApp <em>optional</em></label><input id="c-phone" name="phone" type="tel" autocomplete="tel"></div>
      <div class="field full"><label for="c-msg">Message</label><textarea id="c-msg" name="message" required></textarea></div>
      <label class="consent"><input type="checkbox" name="consent" value="yes" required><span>I agree that CHIDAOBA CULTURE may use these details to reply to me, as described in the <a href="/privacy/">privacy notice</a>.</span></label>
      <div class="form-foot"><button class="btn btn-primary" type="submit">Send message {arrow()}</button><p class="form-msg" aria-live="polite"></p></div>
    </form>
    <div class="done" id="contact-done" role="status">
      <p class="label muted"><span class="bar"></span>Sent</p>
      <h3 class="display h-md">Thank you<span class="dot">.</span></h3>
      <p class="body soft">We’ll reply as soon as we can, usually within a few days. For anything urgent, message us on <a href="{WA}" rel="noopener">WhatsApp</a>.</p>
    </div>
  </div>
</section>"""

PAGES = [
    ("/", "index.html", "CHIDAOBA CULTURE | Rooted in heritage. Built for the future.",
     "Georgian wrestling heritage expressed through modern sports culture. Chidaoba, camps and events, community, journal and apparel, from Tbilisi, Georgia.", home),
    ("/georgia/", "georgia/index.html", "Why Georgia | Train where grappling runs deep, CHIDAOBA CULTURE",
     "Why train in Georgia: a wrestling culture centuries old, Olympic and world champions, booming BJJ, the Caucasus mountains, the Black Sea and the Georgian table.", georgia),
    ("/culture/", "culture/index.html", "Culture | Chidaoba and the CHIDAOBA brand",
     "The story of Chidaoba, Georgia’s traditional wrestling (UNESCO Intangible Cultural Heritage, 2018), and why we chose the name: a Georgian-rooted brand for wrestling, grappling, BJJ and judo.", culture),
    ("/camps/", "camps/index.html", "Camps & Events | CHIDAOBA CULTURE",
     "Training camps, Chidaoba workshops, wrestling seminars, BJJ/No-Gi camps and cultural experiences in Georgia.", camps),
    ("/camps/camp/", "camps/camp/index.html", "Camp | CHIDAOBA CULTURE",
     "Camp details, packages, schedule and registration | CHIDAOBA CULTURE.", camp_detail),
    ("/camps/venue/", "camps/venue/index.html", "Venue | CHIDAOBA CULTURE",
     "Where we train: Ilia Gabliani Sports Complex in Mulakhi, Svaneti. Training hall, rooms for 40, meals, pool and mountain views.", venue_page),
    ("/admin/", "admin/index.html", "Admin | CHIDAOBA CULTURE", "Admin.", admin),
    ("/community/", "community/index.html", "Community | CHIDAOBA CULTURE",
     "Athletes, coaches and clubs of Georgian wrestling and grappling.", community),
    ("/journal/", "journal/index.html", "Journal | CHIDAOBA CULTURE",
     "Stories on Georgian wrestling heritage, technique, training and the people behind it.", journal),
    ("/shop/", "shop/index.html", "Shop | CHIDAOBA CULTURE", "Rashguards, fight shorts, singlets, BJJ gis, judo kimonos, gear and lifestyle pieces from CHIDAOBA CULTURE.", shop),
    ("/contact/", "contact/index.html", "Contact | CHIDAOBA CULTURE",
     "Contact CHIDAOBA CULTURE: email chidaobaculture@gmail.com, WhatsApp +995 595 606 670 or Instagram @chidaobaculture.", contact),
    ("/privacy/", "privacy/index.html", "Privacy | CHIDAOBA CULTURE", "Privacy information for chidaoba.com.", privacy),
    ("/404.html", "404.html", "Not found | CHIDAOBA CULTURE", "Page not found.", notfound),
]

if __name__ == "__main__":
    for path, out, title, desc, fn in PAGES:
        full = os.path.join(ROOT, out)
        os.makedirs(os.path.dirname(full), exist_ok=True)
        with open(full, "w") as f:
            f.write(page(path, html.escape(title, quote=False), html.escape(desc), fn()))
        print("wrote", out)
    sm = "".join(f"<url><loc>https://chidaoba.com{p}</loc></url>" for p, o, *_ in PAGES if not o.startswith("404") and p not in ("/admin/", "/camps/camp/"))
    open(os.path.join(ROOT, "sitemap.xml"), "w").write(
        f'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{sm}</urlset>\n')
    open(os.path.join(ROOT, "robots.txt"), "w").write("User-agent: *\nAllow: /\nDisallow: /admin/\nSitemap: https://chidaoba.com/sitemap.xml\n")
    print("wrote sitemap.xml, robots.txt")
