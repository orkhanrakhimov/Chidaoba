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
    <a class="brand" href="/" aria-label="CHIDAOBA CULTURE — home"><img src="/assets/img/lockup-chalk.svg" alt="CHIDAOBA CULTURE" width="300" height="30"></a>
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

def camps():
    return inner("Camps &amp; Events", "Train. Connect. Experience<span class=\"dot\">.</span>",
                 "Discover training camps, workshops, competitions and experiences rooted in Georgian grappling culture.",
                 "First camps and dates — announced soon<span class=\"dot\">.</span>", CATS + ["Other Events"],
                 ig_btn("Follow for first dates"))

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
<p>At the moment chidaoba.com does not collect personal data. There are no forms, accounts, analytics or advertising cookies on this site.</p>
<h2>Third-party services</h2>
<p>The site is hosted on GitHub Pages and loads its typefaces from Google Fonts. Like any web server, these services receive technical information such as your IP address when your browser requests a page or a font. Their own privacy policies apply.</p>
<h2>Changes</h2>
<p>When we add event registration, the newsletter or the shop, this page will be updated before any personal data is collected, explaining what we collect, why, and how to request access or deletion.</p>
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
