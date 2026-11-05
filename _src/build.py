#!/usr/bin/env python3
"""Static page generator for chidaoba.com (Phase 1).

Run from the repo root:  python3 _src/build.py
Writes index.html, culture/, camps/, community/, journal/, shop/, privacy/ and 404.html.
Folders starting with "_" are not published by GitHub Pages (Jekyll), so this source stays private to the repo.
"""
import os, html, re, json

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SYM = open(os.path.join(ROOT, "_src", "symbol_path.txt")).read().strip()
IG = "https://www.instagram.com/chidaobaculture/"
IG_HANDLE = "@chidaobaculture"
FB = "https://www.facebook.com/chidaoba"
EMAIL = "chidaobaculture@gmail.com"
WA_NUM = "995595606670"
WA_SHOW = "+995 595 606 670"
WA = "https://wa.me/" + WA_NUM + "?text=" + "Hi%20CHIDAOBA%2C%20"
UNESCO = "https://ich.unesco.org/en/RL/chidaoba-wrestling-in-georgia-01371"

NAV = [("/", "Home"), ("/culture/", "Culture"), ("/camps/", "Camps &amp; Events"),
       ("/georgia/", "Why Georgia"), ("/shop/", "Shop")]

def sym_svg(cls, extra=""):
    return f'<svg class="{cls}" viewBox="130 10 670 940" aria-hidden="true" focusable="false"{extra}><path d="{SYM}" fill-rule="evenodd"/></svg>'

BAG = ('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">'
       '<path d="M5 8h14l-1.2 12H6.2L5 8Z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/></svg>')

def og_img(path):
    k = {"/": "home", "/camps/": "camps", "/camps/camp/": "camps", "/camps/venue/": "camps", "/shop/": "shop",
         "/culture/": "culture", "/georgia/": "georgia"}.get(path)
    return f"og-{k}.png" if k else "og.png"

def org_ld():
    d = {"@context": "https://schema.org", "@graph": [
        {"@type": "Organization", "@id": "https://chidaoba.com/#org", "name": "CHIDAOBA", "url": "https://chidaoba.com/",
         "logo": "https://chidaoba.com/assets/img/icon-512.png", "email": EMAIL, "telephone": WA_SHOW.replace(" ", ""),
         "sameAs": [IG, FB], "address": {"@type": "PostalAddress", "addressCountry": "GE"}},
        {"@type": "WebSite", "@id": "https://chidaoba.com/#site", "name": "CHIDAOBA", "url": "https://chidaoba.com/",
         "inLanguage": ["en", "ka"], "publisher": {"@id": "https://chidaoba.com/#org"}}]}
    return '\n<script type="application/ld+json">' + json.dumps(d, ensure_ascii=False) + '</script>'

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
<meta property="og:site_name" content="CHIDAOBA">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="https://chidaoba.com/assets/img/{og_img(path)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="{title}">
<meta property="og:locale" content="en_US">
<meta property="og:locale:alternate" content="ka_GE">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{title}">
<meta name="twitter:description" content="{desc}">
<meta name="twitter:image" content="https://chidaoba.com/assets/img/{og_img(path)}">{org_ld() if path == "/" else ""}
<meta name="theme-color" content="#202020">
<link rel="icon" href="/assets/img/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="preload" href="/assets/fonts/archivo-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/css/site.css?v={ASSET_V}">
<!--ALT-->
</head>
<body id="top">
<a class="skip" href="#main">Skip to content</a>
"""

def header(path):
    links = "".join(f'<a href="{h}"{" aria-current=\"page\"" if h == path else ""}>{t}</a>' for h, t in NAV[1:])
    mlinks = "".join(f'<a href="{h}"{" aria-current=\"page\"" if h == path else ""}>{t}</a>' for h, t in NAV)
    return f"""<header class="site-head">
  <div class="wrap">
    <a class="brand" href="/" aria-label="CHIDAOBA home"><img src="/assets/img/symbol-chalk.svg" alt="CHIDAOBA" width="26" height="36"></a>
    <nav class="nav" aria-label="Main">{links}</nav>
    <div class="head-tools">
      <!--LANGSW-->
      <a class="bag" href="/shop/#bag" aria-label="Bag">{BAG}<b class="bag-n" data-bag-n hidden>0</b></a>
      <button class="burger" type="button" aria-label="Menu" aria-expanded="false" aria-controls="mobile-menu"><span></span><span></span><span></span></button>
    </div>
  </div>
</header>
<div class="mobile-menu" id="mobile-menu">
  <nav aria-label="Mobile">{mlinks}</nav>
  {socials("socials socials-menu")}
</div>
"""

WA_ICON = ('<svg viewBox="0 0 24 24" aria-hidden="true" width="22" height="22"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.1 5.1 0 0 0 1.1 2.7 11.6 11.6 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .1-1.3c0-.1-.2-.2-.4-.3Z"/></svg>')

IG_ICON = ('<svg viewBox="0 0 24 24" aria-hidden="true" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8">'
           '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none"/></svg>')
FB_ICON = ('<svg viewBox="0 0 24 24" aria-hidden="true" width="22" height="22"><path fill="currentColor" '
           'd="M13.5 21.5v-8h2.7l.4-3.2h-3.1V8.3c0-.9.3-1.5 1.6-1.5h1.7V4a22 22 0 0 0-2.5-.1c-2.5 0-4.2 1.5-4.2 4.3v2.1H7.4v3.2h2.7v8Z"/></svg>')
MAIL_ICON = ('<svg viewBox="0 0 24 24" aria-hidden="true" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8">'
             '<rect x="3" y="5" width="18" height="14" rx="1.5"/><path d="m3.5 6 8.5 7 8.5-7"/></svg>')

FLAG = ('<svg class="flag" viewBox="0 0 30 20" width="21" height="14" role="img" aria-label="Georgia"><rect width="30" height="20" fill="#fff"/>'
        '<path fill="#E8112D" d="M13 0h4v20h-4zM0 8h30v4H0z"/>'
        + "".join(f'<path fill="#E8112D" d="M{x-.6} {y-2.4}h1.2v1.8h1.8v1.2h-1.8v1.8h-1.2v-1.8h-1.8v-1.2h1.8z"/>' for x, y in [(6.5, 4), (23.5, 4), (6.5, 16), (23.5, 16)])
        + '</svg>')

def socials(cls="socials"):
    items = [(WA, "WhatsApp", WA_ICON), (IG, "Instagram", IG_ICON), (FB, "Facebook", FB_ICON), (f"mailto:{EMAIL}", "Email", MAIL_ICON)]
    return f'<div class="{cls}">' + "".join(
        f'<a href="{u}"{"" if u.startswith("mailto") else " rel=\"noopener\""} aria-label="{n}" title="{n}">{i}</a>' for u, n, i in items) + "</div>"

def newsletter_form(where, interests=("camps", "shop"), title="The Culture Letter", sub="New camps and new products, first. A few emails a year.", btn="Subscribe", hidden=()):
    big = where != "foot"
    names = {"camps": "Camp dates", "shop": "Shop news", "news": "Stories", "bjj": "BJJ", "wrestling": "Wrestling", "judo": "Judo"}
    chips = "".join(f'<label class="news-int"><input type="checkbox" name="interest" value="{k}" checked><span>{names[k]}</span></label>' for k in interests)
    return f"""<form class="js-form news{' news-big' if big else ''}" data-db="subscribe" data-source="{where}" data-key="{WEB3FORMS_KEY}" data-ok-text="Thank you. You’re on the list." novalidate>
      <input type="hidden" name="subject" value="Email signup, chidaoba.com">
      <input type="checkbox" name="botcheck" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">{"".join(f'<input type="hidden" name="interest" value="{h}">' for h in hidden)}
      <label class="news-label" for="nl-{where}">{title}</label>
      <p class="news-sub">{sub}</p>
      <div class="news-ints" role="group" aria-label="What would you like to hear about?">{chips}</div>
      <div class="news-row"><input id="nl-{where}" name="email" type="email" autocomplete="email" placeholder="Your email" required>
      <button class="btn btn-primary" type="submit">{btn}</button></div>
      <label class="news-consent"><input type="checkbox" name="consent" value="yes" required><span>I agree to receive emails and accept the <a href="/privacy/">privacy policy</a>. Unsubscribe any time.</span></label>
      <p class="form-msg" aria-live="polite"></p>
    </form>"""

def footer(path=""):
    cta = "" if path.startswith("/camps/") or path == "/admin/" else f"""
    <div class="foot-cta">
      <h2 class="display">Train with us<br>in Georgia</h2>
      <div class="foot-cta-btns">
        <a class="btn btn-primary" href="/camps/">See camps {arrow()}</a>
        <a class="btn btn-ghost" href="{WA}" rel="noopener">WhatsApp us {arrow()}</a>
      </div>
    </div>"""
    news = "" if path == "/" else f'<div class="foot-news">{newsletter_form("foot")}</div>'
    return f"""<footer class="site-foot">
  <div class="wrap">{cta}
    <div class="foot-grid">
      {news}
      <nav class="foot-col" aria-label="Explore"><h3>Explore</h3><ul>
        <li><a href="/culture/">Culture</a></li><li><a href="/camps/">Camps &amp; Events</a></li>
        <li><a href="/georgia/">Why Georgia</a></li><li><a href="/shop/">Shop</a></li></ul></nav>
      <div class="foot-col"><h3>Connect</h3>{socials()}<ul style="margin-top:22px"><li><a href="/contact/">Contact</a></li></ul></div>
      <div class="foot-col"><h3>Legal</h3><ul><li><a href="/privacy/">Privacy</a></li></ul></div>
    </div>
  </div>
  <div class="foot-mark" aria-hidden="true"><svg viewBox="0 0 1000 150" preserveAspectRatio="xMidYMid meet"><text x="0" y="128" textLength="1000" lengthAdjust="spacingAndGlyphs">CHIDAOBA</text></svg></div>
  <div class="wrap">
    <div class="foot-bottom label"><span class="foot-copy">© <span data-year>2026</span> CHIDAOBA {FLAG}</span><a class="foot-top" href="#top">Back to top ↑</a></div>
  </div>
</footer>
<a class="wa-float" href="{WA}" rel="noopener" aria-label="Message us on WhatsApp">{WA_ICON}<span>WhatsApp</span></a>
<script src="/assets/js/site.js?v={ASSET_V}" defer></script>
</body>
</html>
"""

ASSET_V = "62"
EXTRA_JS = {"/": ["config", "venues", "data", "camps"], "/camps/": ["config", "venues", "data", "camps"], "/camps/camp/": ["config", "venues", "catalog", "data", "camps"], "/camps/venue/": ["config", "venues", "data", "camps"], "/admin/": ["config", "venues", "catalog", "data", "admin"], "/shop/": ["config", "catalog", "shop"]}

def page(path, title, desc, main):
    names = EXTRA_JS.get(path, [])
    names = names if "config" in names else ["config"] + names
    js = "".join(f'<script src="/assets/js/{n}.js?v={ASSET_V}" defer></script>' for n in names)
    out = head(title, desc, path) + header(path) + f'<main id="main">{main}</main>\n' + footer(path)
    if path == "/admin/":
        out = head(title, desc, path).replace('<meta name="viewport"', '<meta name="robots" content="noindex,nofollow">\n<meta name="viewport"') + f'<main id="admin" class="adm"></main>' + f'<script src="/assets/js/site.js?v={ASSET_V}" defer></script></body></html>'
    tag = f'<script src="/assets/js/site.js?v={ASSET_V}" defer></script>'
    return out.replace(tag, js + tag)

def arrow(): return ''

CATS = ["Training Camps", "Wrestling Seminars", "BJJ / No-Gi Camps",
        "Competitions", "Open Mats", "Cultural Experiences"]
JCATS = ["Heritage", "Wrestling", "Grappling", "Training", "Athletes", "Culture", "Interviews"]

# ------------------------------------------------------------------ home
def home_picks():
    from shop_art import art
    picks = [("BJJ gi", "bjj"), ("Rashguard, long sleeve", "train"), ("Wrestling singlet", "wrestling"), ("Judogi", "judo")]
    out = ""
    for name, sp in picks:
        p = next(x for x in PRODUCTS if x[0] == name)
        out += f'<a class="hpick" href="/shop/?sport={sp}#{slugify(name)}"><div class="hpick-art">{art(p[8], p[6][0])}</div><b>{name}</b><span>{dict((k, n) for k, n, _ in SPORTS)[sp]}</span></a>'
    return out

def home():
    chips = "".join(f"<li>{c}</li>" for c in CATS)
    jchips = "".join(f"<li>{c}</li>" for c in JCATS)
    return f"""
<section class="hero dark" aria-labelledby="hero-title">
  {sym_svg("hero-sym")}
  <div class="wrap">
    <p class="hero-top fade-load"><a class="hero-story" href="/culture/">Our story {arrow()}</a></p>
    <div>
      <h1 id="hero-title" class="display h-xl"><span class="ln"><span>A culture</span></span><span class="ln"><span>that moves<span class="dot">.</span></span></span></h1>
      <p class="lead soft fade-load">Born in Georgia, CHIDAOBA brings wrestling heritage into modern grappling culture through training camps, apparel and a growing community of athletes.</p>
      <div class="ctas fade-load">
        <a class="btn btn-primary" href="/camps/">Explore camps {arrow()}</a>
        <a class="btn btn-ghost" href="/shop/">Shop {arrow()}</a>
      </div>
    </div>
  </div>
</section>

<section class="section light" aria-labelledby="intro-title">
  <div class="wrap">
    <div class="intro">
      <h2 id="intro-title" class="display h-lg reveal">Our roots<span class="dot">.</span></h2>
      <div class="text reveal">
        <p class="scrub scrub-sm">Chidaoba is the traditional wrestling of Georgia. Our brand takes its name and values from it.</p>
        <p class="body muted">We connect this heritage with the sports people train today: wrestling, judo, Brazilian jiu-jitsu and grappling.</p>
        <a class="link" href="/culture/" style="align-self:start">What is Chidaoba</a>
      </div>
      <div class="stats stats-3 stagger">
        <div class="stat"><b data-count="9">9</b><span>Olympic gold medals for Georgia in judo and wrestling</span></div>
        <div class="stat"><b>1 : 82,000</b><span>One Olympic medal for every 82,000 people</span></div>
        <div class="stat"><b data-count="2018" data-from="1900">2018</b><span>Chidaoba added to UNESCO’s list of intangible cultural heritage</span></div>
      </div>
      <a class="link home-why" href="/georgia/">Why train in Georgia</a>
    </div>
  </div>
</section>

<section class="section dark" aria-labelledby="camps-title">
  <div class="wrap">
    <div class="sec-head">
      <h2 id="camps-title" class="display h-lg reveal">Training camps in Georgia</h2>
      <p class="body soft reveal">Camps for BJJ and grappling, wrestling and judo, with local coaches, accommodation and meals.</p>
    </div>
    <div id="home-camps" class="camp-list" hidden></div>
    <article class="feature reveal" id="home-camps-soon">
      <div class="feature-visual" aria-hidden="true">{sym_svg("")}<div class="ring"></div></div>
      <div class="feature-body">
                <h3 class="display h-md">The first camps are being planned<span class="dot">.</span></h3>
        <p class="body soft">We are preparing our first training camps and experiences in Georgia. Dates, coaches, locations and registration will be published here first.</p>
        <ul class="chips"><li>BJJ &amp; grappling</li><li>Wrestling</li><li>Judo</li></ul>
        <div style="display:flex;gap:14px;flex-wrap:wrap;margin-top:8px">
          <a class="btn btn-primary" href="/camps/">Explore camps &amp; events {arrow()}</a>
          <a class="btn btn-ghost" href="/camps/#notify">Get dates by email {arrow()}</a>
        </div>
      </div>
    </article>
  </div>
</section>

<section class="section light home-shop" aria-labelledby="drop-title">
  <div class="wrap">
    <div class="sec-head">
      <h2 id="drop-title" class="display h-lg reveal">Shop</h2>
      <p class="body muted reveal">Gis, training wear and gear for adults and kids. Order on WhatsApp.</p>
    </div>
    <div class="home-picks stagger">{home_picks()}</div>
    <a class="btn btn-primary" href="/shop/" style="margin-top:28px">View the shop {arrow()}</a>
  </div>
</section>

<section class="section dark invite" aria-labelledby="invite-title" style="border-top:1px solid var(--carbon-line)">
  <div class="wrap invite-grid">
    <h2 id="invite-title" class="display h-lg reveal">Stay updated</h2>
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
        ("Later it became a public sport. Tournaments were held in open-air arenas in villages and towns, in front of large crowds.", "UNESCO; AFP, 2018"),
        ("Bouts were accompanied by traditional music played on the zurna and the doli.", "UNESCO"),
        ("The rules were based on fairness and respect for the opponent and the audience.", "UNESCO Decision 13.COM 10.b.15"),
        ("The skills were passed down through families, schools and village clubs.", "UNESCO; AFP, 2018"),
        ("Today there is a wrestling club in almost every village and city in Georgia.", "UNESCO"),
    ]
    st = "".join(f'<div class="scrub-item"><span class="n">{i+1:02d}</span><p class="scrub">{t}</p></div>'
                 for i, (t, src) in enumerate(story))
    disc = [("Wrestling", "", False), ("Grappling", "", False),
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
    <h1 id="c-title" class="display"><span class="ln"><span>About Chidaoba</span></span></h1>
    <p class="lead soft fade-load">Chidaoba is the traditional wrestling of Georgia. Standing bouts in a short jacket, open-air arenas and live music. This is where our name comes from.</p>
  </div>
</section>

<section class="story dark" aria-labelledby="story-title">
  <div class="wrap">
    <h2 id="story-title" class="display h-md story-h">The story of Chidaoba</h2>
    <div class="scrub-list">{st}</div>
  </div>
</section>

<section class="section light" aria-labelledby="details-title">
  <div class="wrap">
    <div class="sec-head" style="margin-bottom:48px">
      <h2 id="details-title" class="display h-lg">How Chidaoba works</h2>
    </div>
    <div class="cf-top reveal"><b>2018</b><p>Chidaoba was added to UNESCO’s Representative List of the Intangible Cultural Heritage of Humanity.</p></div>
    <div class="cf-grid stagger"><div><span class="label">Uniform</span><b>The chokha</b><p>A short, sleeveless wrestling jacket tied with a belt. Wrestlers compete barefoot.</p></div><div><span class="label">Grips</span><b>Jacket and belt</b><p>Wrestlers grip the chokha and the belt. Grabbing the trousers is not allowed.</p></div><div><span class="label">Winning</span><b>A clean throw</b><p>Bouts are fought standing. Throwing the opponent flat onto his back wins the bout.</p></div><div><span class="label">Arena</span><b>Open air</b><p>Held outdoors on grass, hay or sawdust, with spectators standing in a circle around the wrestlers.</p></div><div><span class="label">Music</span><b>Zurna and doli</b><p>A wind instrument and a drum open the contest and keep the rhythm during the bouts.</p></div><div><span class="label">Code</span><b>Respect</b><p>Fairness and respect for the opponent are part of the rules. Dishonest techniques are not accepted.</p></div><div><span class="label">Regions</span><b>Many styles</b><p>Kartli, Kakheti, Svaneti, Racha, Imereti and Guria each developed their own way of wrestling.</p></div><div><span class="label">Legacy</span><b>Roots of sambo</b><p>Chidaoba is one of the regional wrestling styles that shaped sambo in the 20th century.</p></div></div>
  </div>
</section>

<section class="section dark why" aria-labelledby="why-title">
  <div class="wrap">
    <div class="why-grid">
      <h2 id="why-title" class="display h-lg stagger"><span>Why the name Chidaoba</span></h2>
      <div class="text stagger">
        <p class="lead soft">In Georgian, ჭიდაობა (Chidaoba) means wrestling. It is an everyday word that every Georgian knows.</p>
        <p class="body soft">We chose this name because it connects our brand to the Georgian wrestling tradition. Our goal is to make it known internationally.</p>
      </div>
    </div>
  </div>
</section>




</div>
"""

WEB3FORMS_KEY = ""  # paste the Web3Forms access key here to switch the camp form on

FORMATS = [
    ("Training Camps", "Several days of focused training in Georgia, two sessions a day with local coaches, plus time to recover and explore."),
    ("Wrestling Seminars", "Technical sessions with Georgian wrestling coaches, built around specific positions and throws."),
    ("BJJ / No-Gi Camps", "Grappling camps where Georgian wrestling meets Brazilian Jiu-Jitsu and no-gi, from takedowns to the ground."),
    ("Competitions", "Tournaments and challenge matches, from friendly club events to open competitions."),
    ("Open Mats", "Drop-in sessions to roll, drill and meet local grapplers. No programme, just training."),
    ("Cultural Experiences", "Time off the mat: Georgian food, landscapes, music and the places where the tradition lives."),
    ("Other Events", "Talks, screenings, team trips and collaborations with clubs and academies."),
]

def camps():
    faqs = [
        ("How do I sign up?", "Choose your sport, open a camp, pick a package and press Request a spot. Fill in a short form and send it. We reply within 24 hours by WhatsApp or email to confirm your place."),
        ("Do I pay anything when I send a request?", "No. Sending a request is free and does not commit you to anything. We confirm your spot and the payment details with you personally."),
        ("What if the camp is full?", "Join the waitlist from the camp page. If a spot opens, we contact waitlisted people in order."),
        ("Do I need experience?", "Every camp shows its level. Many are open to all levels; tell us your experience when you book."),
        ("Do I need to speak Georgian?", "No. Sessions and communication for international guests are in English."),
        ("How do I get to Georgia?", "Georgia has international airports in Tbilisi, Kutaisi and Batumi. Each camp page says where it is and whether transfers are available as an add-on. Please check the visa rules for your passport."),
        ("Can I bring my team?", "Yes. Camps with a group discount show it on the camp page, and we can build a private camp for your club. Get in touch."),
    ]
    fq = "".join(f'<details><summary>{q}</summary><p>{a}</p></details>' for q, a in faqs)
    faq_ld = '<script type="application/ld+json">' + json.dumps({"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
        {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in faqs]}, ensure_ascii=False) + '</script>'
    tabs = [("all", "All camps", "Every sport"), ("bjj", "BJJ &amp; Grappling", "Gi and no-gi"), ("wrestling", "Wrestling", "Freestyle &amp; Greco-Roman"), ("judo", "Judo", "Throws and groundwork")]
    tb = "".join(f'<button type="button" data-f="{k}" aria-pressed="{"true" if k == "all" else "false"}"><b>{t}</b><span>{sub}</span><em data-n="{k}"></em></button>' for k, t, sub in tabs)
    return f"""
<section class="page-hero dark camps-hero">
  {sym_svg("ghost")}
  <div class="wrap" style="position:relative">
    <h1 class="display h-xl"><span class="ln"><span>Training camps</span></span></h1>
    <p class="lead soft fade-load">Training camps in Georgia for BJJ and grappling, freestyle and Greco-Roman wrestling, and judo, with experienced local coaches.</p>
    <a class="hero-story fade-load" href="/georgia/" style="margin-top:22px">Why train in Georgia {arrow()}</a>
  </div>
</section>

<section class="section dark camps-list-sec" id="camps" style="padding-top:0">
  <div class="wrap">
    <div class="pick-head"><h2 class="display h-md">Choose your sport</h2></div>
    <div class="disc-tabs sport-pick" role="group" aria-label="Choose your sport">{tb}</div>
    <div id="camp-list" class="camp-list" aria-live="polite"></div>
  </div>
</section>

<section class="section dark notify-sec" id="notify">
  <div class="wrap notify-in">{newsletter_form("camps", interests=("bjj", "wrestling", "judo"), title="Get new camp dates by email", sub="Choose your sports. We email you when a new camp opens, before anyone else.", btn="Notify me", hidden=("camps",))}</div>
</section>

<section class="section light venues-sec">
  <div class="wrap">
    <div class="sec-head" style="margin-bottom:40px">
      <h2 class="display h-md">Our venues</h2>
      <p class="body muted">Training halls, accommodation and meals in one place.</p>
    </div>
    <div id="venue-list" class="venue-list"></div>
  </div>
</section>

<section class="section dark coaches-sec" id="coaches" aria-labelledby="co-title">
  <div class="wrap">
    <div class="sec-head" style="margin-bottom:32px">
      <h2 id="co-title" class="display h-md">Coaches</h2>
      <p class="body soft">The coaches who lead our camps, with their titles and experience.</p>
    </div>
    <div class="co-tabs" role="group" aria-label="Coaches by sport">
      <button type="button" data-f="all" aria-pressed="true">All</button><button type="button" data-f="bjj" aria-pressed="false">BJJ &amp; grappling</button><button type="button" data-f="wrestling" aria-pressed="false">Wrestling</button><button type="button" data-f="judo" aria-pressed="false">Judo</button>
    </div>
    <div id="coach-list" class="co-grid" aria-live="polite"></div>
  </div>
</section>

<section class="section light" style="padding-top:0">
  <div class="wrap">
    <div class="sec-head" style="margin-bottom:48px">
      <h2 class="display h-md">How to sign up</h2>
    </div>
    <div class="steps stagger">
      <div><span class="n">01</span><h3>Choose</h3><p>Pick your sport, then the camp and package that suit you: training only, with accommodation, or all-inclusive.</p></div>
      <div><span class="n">02</span><h3>Request</h3><p>Fill in a short form and send it. It takes a minute and there is no payment.</p></div>
      <div><span class="n">03</span><h3>Train</h3><p>We confirm your spot on WhatsApp or email within 24 hours and send everything you need before you arrive.</p></div>
    </div>
    <div class="perks stagger">
      <div><b>Early-bird prices</b><span>Book early, pay less.</span></div>
      <div><b>Group discounts</b><span>Bring your team and save.</span></div>
      <div><b>Waitlist</b><span>Full? Get the next free spot.</span></div>
      <div><b>No payment now</b><span>Requests are free.</span></div>
    </div>
  </div>
</section>

<section class="section light" style="padding-top:0">
  <div class="wrap">
    <div class="sec-head" style="margin-bottom:24px">
      <h2 class="display h-md">FAQ</h2>
    </div>
    <div class="faq">{fq}</div>{faq_ld}
    <div class="team-cta">
      <div><h3 class="display h-md">Want a camp for your club?</h3>
      <p class="body muted">We can build a private camp around your team’s level, dates and budget.</p></div>
      <a class="btn btn-primary" href="/contact/">Get in touch {arrow()}</a>
    </div>
  </div>
</section>
"""

def camp_detail():
    return '<div id="camp-root"><section class="page-hero dark"><div class="wrap"><p class="body soft">Loading camp…</p></div></section></div>' + \
        f'<section class="section dark notify-sec" id="notify"><div class="wrap notify-in">{newsletter_form("camp", interests=("bjj", "wrestling", "judo"), title="Hear about the next camps", sub="We email you when new dates open for your sports.", btn="Notify me", hidden=("camps",))}</div></section>'

def venue_page():
    return '<div id="venue-root"><section class="page-hero dark"><div class="wrap"><p class="body soft">Loading venue…</p></div></section></div>'

def admin():
    return ""

def community():
    return inner("Community", "Community",
                 "Athletes, coaches and clubs from Georgia and abroad.",
                 "Athlete profiles and a club directory are coming soon<span class=\"dot\">.</span>",
                 ["Athletes", "Coaches", "Clubs &amp; Academies", "International Community"],
                 ig_btn("Get in touch on Instagram"))

def journal():
    return inner("Journal", "Journal<span class=\"dot\">.</span>",
                 "Articles about Georgian wrestling and grappling: history, technique, training and interviews.",
                 "The first articles are coming soon<span class=\"dot\">.</span>",
                 ["Heritage", "Technique", "Training", "Interviews", "Athletes", "Events", "Culture", "News"], ig_btn())

def georgia():
    roots = [
        "Wrestling has been part of Georgian life for centuries.",
        "Chidaoba, the traditional Georgian wrestling, was used to prepare soldiers and later became a popular public sport.",
        "Today almost every village and city has a wrestling club, and many children start training at a young age.",
        "Training here means training in a country where these sports are taken seriously.",
    ]
    rt = "".join(f'<div class="scrub-item"><span class="n">{i+1:02d}</span><p class="scrub">{t}</p></div>' for i, t in enumerate(roots))
    chapters = [("champions", "Champions"), ("newwave", "BJJ and grappling"), ("land", "Nature"),
                ("table", "Food"), ("people", "Hospitality"), ("know", "Practical info")]
    ch = "".join(f'<a href="#{k}"><b>{i+1:02d}</b> {t}</a>' for i, (k, t) in enumerate(chapters))
    day = [("08:00", "Breakfast"), ("10:00", "Morning session: technique"),
           ("13:00", "Lunch"), ("14:00", "Rest and free time"),
           ("18:00", "Evening session: sparring"), ("20:30", "Dinner")]
    dl = "".join(f'<li><span>{t}</span><b>{x}</b></li>' for t, x in day)
    food = [("Khinkali", "Dumplings filled with spiced meat and broth."),
            ("Khachapuri", "Bread baked with cheese. The Adjarian version is topped with egg and butter."),
            ("Mtsvadi", "Grilled meat, traditionally cooked over vine branches."),
            ("Pkhali &amp; badrijani", "Vegetables with walnut paste, and fried aubergine rolls with walnut filling."),
            ("Lobio", "Bean stew cooked in a clay pot, served with cornbread."),
            ("Churchkhela", "Walnuts coated in thickened grape juice. A traditional snack.")]
    fd = "".join(f'<div class="food"><h3>{n}</h3><p>{d}</p></div>' for n, d in food)
    know = [("Visa", "Citizens of many countries, including the EU, UK and US, can stay without a visa for up to a year. Check the rules for your passport before you book."),
            ("Flights", "International airports in Tbilisi, Kutaisi and Batumi, with direct routes from across Europe and the Middle East."),
            ("Money", "The Georgian lari (GEL). Cards work almost everywhere in cities. Bring some cash for villages and markets."),
            ("Language", "Georgian, with its own alphabet. Many young people speak English, and our team is with you the whole camp."),
            ("Best time", "Late spring to early autumn for mountain camps. Tbilisi works all year."),
            ("Time zone", "GMT+4, all year round.")]
    kn = "".join(f'<div><h3 class="kn-h">{t}</h3><p>{d}</p></div>' for t, d in know)
    return f"""
<div class="cx gx">
<section class="cx-hero dark" aria-labelledby="g-title">
  <div class="ghost-word" aria-hidden="true">ჭ</div>
  <div class="wrap">
    <h1 id="g-title" class="display"><span class="ln"><span>Why train in Georgia</span></span></h1>
    <p class="lead soft fade-load">Georgia has a long wrestling tradition, world-class judo and wrestling athletes and a growing BJJ community. It is also an easy and affordable country to visit, with mountains, sea and great food.</p>
  </div>
</section>

<nav class="chapters" aria-label="Chapters"><div class="wrap">{ch}</div></nav>


<section class="section light" id="champions" aria-labelledby="champ-title">
  <div class="wrap">
    <div class="sec-head" style="margin-bottom:48px">
      <h2 id="champ-title" class="display h-lg">A small country with many champions</h2>
      <p class="body muted">Most of Georgia's Olympic medals come from judo and wrestling.</p>
    </div>
    <div class="ch-stats stagger">
      <div><b>3.9M</b><span>People living in Georgia</span></div>
      <div><b data-count="48">48</b><span>Olympic medals since 1996, 36 of them in judo and wrestling</span></div>
      <div><b data-count="9">9</b><span>Olympic gold medals in judo and wrestling</span></div>
      <div><b>1 : 82,000</b><span>One Olympic medal for every 82,000 people</span></div>
    </div>
    <div class="ch-eu ch-first">
      <h3>Olympic champions</h3><p class="body muted">All Olympic titles in judo and wrestling</p>
      <div class="ch-lists ch-lists-eu">
        <div><h4>Judo</h4><ul><li><b>Zurab Zviadauri</b><span>90 kg</span><em>2004</em></li><li><b>Irakli Tsirekidze</b><span>90 kg</span><em>2008</em></li><li><b>Lasha Shavdatuashvili</b><span>66 kg</span><em>2012</em></li><li><b>Lasha Bekauri</b><span>90 kg</span><em>2020, 2024</em></li></ul></div>
        <div><h4>Wrestling</h4><ul><li><b>Manuchar Kvirkvelia</b><span>Greco-Roman, 74 kg</span><em>2008</em></li><li><b>Revaz Mindorashvili</b><span>Freestyle, 84 kg</span><em>2008</em></li><li><b>Vladimer Khinchegashvili</b><span>Freestyle, 57 kg</span><em>2016</em></li><li><b>Geno Petriashvili</b><span>Freestyle, 125 kg</span><em>2024</em></li></ul></div>
      </div>
    </div>
    <div class="ch-eu">
      <h3>World champions</h3><p class="body muted">Senior world titles, 2022 to 2026</p>
      <div class="ch-lists ch-lists-eu">
        <div><h4>Judo</h4><ul><li><b>Tato Grigalashvili</b><span>81 kg</span><em>2022, 2023, 2024, 2026</em></li><li><b>Luka Maisuradze</b><span>90 kg</span><em>2023</em></li><li><b>Giorgi Sardalashvili</b><span>60 kg</span><em>2024</em></li><li><b>Eteri Liparteliani</b><span>57 kg</span><em>2025</em></li><li><b>Georgia national team</b><span>Mixed team</span><em>2025</em></li><li><b>Ilia Sulamanidze</b><span>100 kg</span><em>2026</em></li></ul></div>
        <div><h4>Wrestling</h4><ul><li><b>Leri Abuladze</b><span>Greco-Roman, 63 kg</span><em>2023</em></li><li><b>Vakhtang Lolua</b><span>Greco-Roman, 55 kg</span><em>2025</em></li></ul></div>
      </div>
    </div>
    <div class="ch-eu">
      <h3>European champions</h3><p class="body muted">Senior European titles, 2022 to 2026</p>
      <div class="ch-lists ch-lists-eu">
        <div><h4>Judo</h4><ul><li><b>Tato Grigalashvili</b><span>81 kg</span><em>2022, 2024</em></li><li><b>Luka Maisuradze</b><span>90 kg</span><em>2022, 2026</em></li><li><b>Vazha Margvelashvili</b><span>66 kg</span><em>2024</em></li><li><b>Giorgi Sardalashvili</b><span>60 kg</span><em>2025</em></li><li><b>Ilia Sulamanidze</b><span>100 kg</span><em>2025</em></li><li><b>Georgia national team</b><span>Mixed team</span><em>2023, 2025</em></li><li><b>Eteri Liparteliani</b><span>57 kg</span><em>2026</em></li><li><b>Lasha Shavdatuashvili</b><span>73 kg</span><em>2026</em></li><li><b>Guram Tushishvili</b><span>Over 100 kg</span><em>2026</em></li></ul></div>
        <div><h4>Wrestling</h4><ul><li><b>Leri Abuladze</b><span>Greco-Roman, 63 kg</span><em>2022, 2023</em></li><li><b>Zurabi Iakobishvili</b><span>Freestyle, 70 kg</span><em>2022</em></li><li><b>Givi Matcharashvili</b><span>Freestyle, 97 kg</span><em>2023, 2024, 2025</em></li></ul></div>
      </div>
    </div>
  </div>
</section>

<section class="section dark" id="newwave" aria-labelledby="nw-title">
  <div class="wrap gx-split">
    <div class="stagger">
      <h2 id="nw-title" class="display h-lg">A growing BJJ community</h2>
    </div>
    <div class="stagger">
      <p class="lead soft">Brazilian jiu-jitsu and no-gi grappling are growing quickly in Georgia. New academies are opening in Tbilisi, and international tournaments are now held in the city.</p>
      <p class="body soft">Many local athletes also have a wrestling or judo background, so training is technical and physically demanding.</p>
      <ul class="chips gx-chips"><li>Brazilian jiu-jitsu</li><li>No-gi</li><li>Freestyle</li><li>Greco-Roman</li><li>Judo</li></ul>
    </div>
  </div>
</section>


<section class="section light" id="land" aria-labelledby="land-title">
  <div class="wrap">
    <div class="sec-head" style="margin-bottom:48px">
      <h2 id="land-title" class="display h-lg">Mountains, sea and good weather</h2>
      <p class="body muted">Georgia is a small country with a lot of variety. The mountains and the Black Sea coast are both a few hours from Tbilisi.</p>
    </div>
    <div class="pillars stagger gx-land">
      <div><b>The mountains</b><p>The Greater Caucasus runs along the north of the country, with peaks above 5,000 m. Mountain regions such as Svaneti stay cool in summer, which makes them good for training.</p></div>
      <div><b>The sea</b><p>The Black Sea coast around Batumi has beaches and warm water in summer. A good option for rest days or after the camp.</p></div>
      <div><b>The seasons</b><p>Summers are warm and sunny, spring and autumn are mild, and winters bring snow to the mountains. Most camps run from late spring to early autumn.</p></div>
    </div>
  </div>
</section>

<section class="section dark why" id="table" aria-labelledby="table-title">
  <div class="wrap">
    <div class="why-grid">
      <h2 id="table-title" class="display h-lg stagger"><span>Food and wine</span></h2>
      <div class="text stagger">
        <p class="lead soft">Georgian food is one of the best reasons to visit. A traditional feast is called a supra, with many dishes and toasts led by a tamada.</p>
        <p class="body soft">Georgia also has one of the oldest winemaking traditions in the world, about 8,000 years. Wine is still made in clay vessels called qvevri, a method listed by UNESCO.</p>
      </div>
    </div>
    <div class="foods stagger">{fd}</div>
  </div>
</section>

<section class="section light" id="people" aria-labelledby="people-title">
  <div class="wrap gx-split">
    <div class="stagger">
      <h2 id="people-title" class="display h-lg">Hospitality</h2>
    </div>
    <div class="stagger">
      <p class="lead">Georgians are known for their hospitality. There is a saying that a guest is a gift from God.</p>
      <p class="body muted">Visitors are often invited to share a meal or join a celebration. Traditional polyphonic singing, listed by UNESCO, is still part of many gatherings.</p>
      <p class="body muted">At our camps you train, eat and travel together as a group.</p>
    </div>
  </div>
</section>


<section class="section alt" id="know" aria-labelledby="know-title">
  <div class="wrap">
    <div class="sec-head" style="margin-bottom:40px">
      <h2 id="know-title" class="display h-md">Practical information</h2>
    </div>
    <div class="details gx-know stagger">{kn}</div>
  </div>
</section>


</div>
"""


APPAREL = ["XS", "S", "M", "L", "XL", "XXL"]
WOMEN = ["XS", "S", "M", "L", "XL"]
KIDS_AGE = ["4-5 y", "6-7 y", "8-9 y", "10-11 y", "12-13 y"]
ONE = ["One size"]
SPORTS = [  # key, name, short line
    ("bjj", "BJJ &amp; Grappling", "Gis and belts."),
    ("wrestling", "Wrestling", "Singlets, shoes and protection."),
    ("judo", "Judo", "Judogi and belts."),
    ("train", "Training wear", "Rashguards, shorts and compression wear for every grappling sport."),
    ("gear", "Gear", "Bags, protection and training kit."),
    ("lifestyle", "Clothing", "Hoodies, T-shirts and accessories."),
]
CATS = {  # sport -> [(cat key, name)]
    "bjj": [("gis", "Gis"), ("belts", "Belts")],
    "train": [("rash", "Rashguards"), ("shorts", "Shorts"), ("compress", "Compression &amp; spats")],
    "wrestling": [("singlets", "Singlets"), ("shoes", "Wrestling shoes"), ("protect", "Headgear &amp; pads")],
    "judo": [("judogi", "Judogi"), ("jbelts", "Belts")],
    "gear": [("bags", "Bags"), ("protection", "Protection"), ("training", "Training")],
    "lifestyle": [("tops", "Tops"), ("bottoms", "Bottoms"), ("acc", "Accessories")],
}
# audience: men, women, adult (unisex), kids, all (any age / one size)
# (name, description, sport, category, audience, sizes, colours, size guide, drawing)
PRODUCTS = [
    ("BJJ gi", "Pearl weave jacket, ripstop pants, reinforced collar. Men's cut.", "bjj", "gis", "men", ["A0", "A1", "A2", "A3", "A4", "A5"], ["White", "Blue", "Black"], "gi", "gi"),
    ("Women's BJJ gi", "Cut for women: shorter jacket, tapered sleeves and pants.", "bjj", "gis", "women", ["F1", "F2", "F3", "F4"], ["White", "Blue", "Black"], "gi_w", "gi"),
    ("Kids BJJ gi", "Light, tough gi for kids, easy to wash.", "bjj", "gis", "kids", ["M000", "M00", "M0", "M1", "M2", "M3", "M4"], ["White", "Blue"], "gi_k", "gi"),
    ("BJJ belt", "Cotton rank belt for adults.", "bjj", "belts", "adult", ["A1", "A2", "A3", "A4"], ["White", "Blue", "Purple", "Brown", "Black"], "belt", "belt"),
    ("Kids BJJ belt", "Cotton rank belt in kids' colours.", "bjj", "belts", "kids", ["M0", "M1", "M2", "M3", "M4"], ["White", "Grey", "Yellow", "Orange", "Green"], "belt_k", "belt"),
    ("Rashguard, long sleeve", "Tight fit, flatlock seams, print that does not crack.", "train", "rash", "men", APPAREL, ["Black", "White", "Red"], "top", "rash"),
    ("Rashguard, short sleeve", "Same fabric and fit, for warm gyms and summer camps.", "train", "rash", "men", APPAREL, ["Black", "White", "Red"], "top", "rash_ss"),
    ("Women's rashguard", "Long sleeve, cut for women, slightly longer body.", "train", "rash", "women", WOMEN, ["Black", "White", "Red"], "top_w", "rash"),
    ("Kids rashguard", "Long sleeve rashguard sized for kids.", "train", "rash", "kids", KIDS_AGE, ["Black", "Red"], "kids", "rash"),
    ("Fight shorts", "Stretch fabric, no pockets, secure waistband with drawcord.", "train", "shorts", "men", ["28", "30", "32", "34", "36", "38"], ["Black", "Red"], "shorts", "shorts"),
    ("Spats", "Full length compression leggings for no-gi, wrestling and MMA.", "train", "compress", "men", APPAREL, ["Black"], "top", "spats"),
    ("Compression shorts", "Base layer shorts worn under fight shorts, singlets or a gi.", "train", "compress", "adult", APPAREL, ["Black"], "top", "cshorts"),
    ("Women's fight shorts", "Shorter leg, stretch fabric, wide waistband.", "train", "shorts", "women", WOMEN, ["Black"], "top_w", "shorts"),
    ("Women's leggings", "High waist compression leggings for training.", "train", "compress", "women", WOMEN, ["Black"], "top_w", "spats"),
    ("Kids fight shorts", "Stretch shorts with an elastic waist.", "train", "shorts", "kids", KIDS_AGE, ["Black"], "kids", "shorts"),
    ("Wrestling singlet", "Competition cut for freestyle and Greco-Roman.", "wrestling", "singlets", "adult", APPAREL, ["Red", "Blue", "Black"], "top", "singlet"),
    ("Kids wrestling singlet", "Competition singlet sized for kids.", "wrestling", "singlets", "kids", KIDS_AGE, ["Red", "Blue"], "kids", "singlet"),
    ("Wrestling shoes", "Lightweight, split sole, ankle support.", "wrestling", "shoes", "adult", ["EU 38", "EU 39", "EU 40", "EU 41", "EU 42", "EU 43", "EU 44", "EU 45", "EU 46", "EU 47"], ["Black", "Red"], "shoes", "shoe"),
    ("Kids wrestling shoes", "Light shoes with good grip for young wrestlers.", "wrestling", "shoes", "kids", ["EU 30", "EU 31", "EU 32", "EU 33", "EU 34", "EU 35", "EU 36", "EU 37"], ["Black", "Red"], "shoes", "shoe"),
    ("Headgear", "Ear guards for wrestling and grappling. Adjustable straps.", "wrestling", "protect", "all", ["Youth", "Adult"], ["Black", "Red"], "", "headgear"),
    ("Knee pads", "Low profile pads for shots and scrambles. Sold as a pair.", "wrestling", "protect", "all", ["XS", "S", "M", "L"], ["Black"], "", "knee"),
    ("Judogi", "Double weave judogi for training and grading.", "judo", "judogi", "adult", ["160 cm", "170 cm", "180 cm", "190 cm", "200 cm"], ["White", "Blue"], "judogi", "gi"),
    ("Kids judogi", "Single weave judogi for kids, light and durable.", "judo", "judogi", "kids", ["110 cm", "120 cm", "130 cm", "140 cm", "150 cm"], ["White"], "judogi", "gi"),
    ("Judo belt", "Cotton rank belt for adults.", "judo", "jbelts", "adult", ["240 cm", "260 cm", "280 cm", "300 cm"], ["White", "Yellow", "Orange", "Green", "Blue", "Brown", "Black"], "jbelt", "belt"),
    ("Kids judo belt", "Cotton rank belt for kids.", "judo", "jbelts", "kids", ["180 cm", "200 cm", "220 cm"], ["White", "Yellow", "Orange", "Green", "Blue"], "jbelt", "belt"),
    ("Gear bag", "Large duffel with a separate wet compartment for your gi and shoes.", "gear", "bags", "all", ONE, ["Black"], "", "bag"),
    ("Backpack", "Daily training backpack with laptop sleeve and shoe pocket.", "gear", "bags", "all", ONE, ["Black"], "", "backpack"),
    ("Mouthguard", "Boil and bite fit, with a ventilated case.", "gear", "protection", "all", ["Junior", "Adult"], ["Black", "Clear"], "", "mouth"),
    ("Finger tape", "Cotton tape for fingers and joints. Pack of 4 rolls.", "gear", "training", "all", ["0.8 cm", "1.3 cm", "2.5 cm"], ["White"], "", "tape"),
    ("Gym towel", "Quick dry microfibre towel.", "gear", "training", "all", ONE, ["Black", "Red"], "", "towel"),
    ("Slides", "For walking off the mat. Keep the mat clean.", "gear", "training", "all", ["EU 38-39", "EU 40-41", "EU 42-43", "EU 44-45", "EU 46-47"], ["Black"], "", "slides"),
    ("Water bottle", "Stainless steel, 750 ml, keeps water cold.", "gear", "training", "all", ONE, ["Black", "White"], "", "bottle"),
    ("Hoodie", "Heavy cotton, relaxed fit.", "lifestyle", "tops", "adult", APPAREL, ["Black", "White", "Red"], "top", "hoodie"),
    ("T-shirt", "Heavyweight cotton T-shirt.", "lifestyle", "tops", "adult", APPAREL, ["Black", "White", "Red"], "top", "tshirt"),
    ("Sweatshirt", "Crewneck sweatshirt.", "lifestyle", "tops", "adult", APPAREL, ["Black", "Grey"], "top", "sweat"),
    ("Women's T-shirt", "Fitted cotton T-shirt, cut for women.", "lifestyle", "tops", "women", WOMEN, ["Black", "White"], "top_w", "tshirt"),
    ("Kids hoodie", "Soft heavy cotton hoodie for kids.", "lifestyle", "tops", "kids", KIDS_AGE, ["Black", "Red"], "kids", "hoodie"),
    ("Kids T-shirt", "Cotton T-shirt with the CHIDAOBA logo.", "lifestyle", "tops", "kids", KIDS_AGE, ["Black", "White"], "kids", "tshirt"),
    ("Track pants", "Tapered joggers with zip pockets.", "lifestyle", "bottoms", "adult", APPAREL, ["Black", "Grey"], "top", "pants"),
    ("Cap", "Cotton cap with embroidered logo.", "lifestyle", "acc", "all", ONE, ["Black", "White"], "", "cap"),
    ("Beanie", "Knitted beanie with embroidered logo.", "lifestyle", "acc", "all", ONE, ["Black", "Red"], "", "beanie"),
    ("Tote bag", "Heavy canvas tote bag.", "lifestyle", "acc", "all", ONE, ["Natural", "Black"], "", "tote"),
]
AUD_ORDER = ["men", "women", "adult", "kids", "all"]
GROUP = {"men": "Men", "women": "Women", "adult": "Adults, unisex", "kids": "Kids", "all": ""}
BADGE = {"men": "Men", "women": "Women", "adult": "Unisex", "kids": "Kids", "all": ""}
# kept for the camp editor's product picker (catalog.js)
SHOP = [(k, n, d, [(p[0],) for p in PRODUCTS if p[2] == k]) for k, n, d in SPORTS]
SPORT_NAMES = {"bjj": "BJJ", "wrestling": "Wrestling", "judo": "Judo"}

def slugify(n):
    return re.sub(r"[^a-z0-9]+", "-", n.replace("&amp;", "and").lower()).strip("-")

def shop():
    from shop_art import art
    data = {}
    sport_name = {k: n for k, n, _ in SPORTS}
    cat_name = {c: n for k in CATS for c, n in CATS[k]}
    def sz_summary(z):
        if z == ONE: return "One size"
        if z == KIDS_AGE: return "Ages 4 to 13"
        return f"Sizes {z[0]} to {z[-1]}" if len(z) > 2 else "Sizes " + " · ".join(z)
    def tile(p):
        n, d, sp, cat, aud, sizes, cols, guide, kind = p
        pid = slugify(n)
        data[pid] = {"name": n.replace("&amp;", "&"), "desc": d, "sport": sp, "cat": cat, "catName": cat_name[cat].replace("&amp;", "&"),
                     "sportName": sport_name[sp].replace("&amp;", "&"), "aud": aud, "sizes": sizes, "colours": cols, "guide": guide, "art": kind,
                     "hex": [__import__("shop_art").COLOURS.get(c, "#1E1E1E") for c in cols], "dk": [1 if c in __import__("shop_art").DARK else 0 for c in cols], "one": sizes == ONE}
        dots = "".join(f'<i class="sw sw-{c.lower()}" title="{c}"></i>' for c in cols)
        badge = f'<span class="ptile-aud a-{aud}">{BADGE[aud]}</span>' if BADGE[aud] else ""
        return f"""<article class="ptile" id="{pid}" data-id="{pid}" data-sport="{sp}" data-cat="{cat}" data-aud="{aud}">
          <button type="button" class="ptile-open" aria-label="Choose size and colour: {n}">
            <div class="ptile-art">{art(kind, cols[0])}{badge}</div>
            <div class="ptile-body"><p class="ptile-cat">{cat_name[cat]}</p><h3>{n}</h3><p>{d}</p>
            <div class="ptile-meta"><span>{sz_summary(sizes)}</span><span class="dots">{dots}</span></div></div>
          </button>
</article>"""
    depts = ""
    for k, n, line in SPORTS:
        blocks = ""
        for c, cn in CATS[k]:
            items = sorted([p for p in PRODUCTS if p[2] == k and p[3] == c], key=lambda p: AUD_ORDER.index(p[4]))
            blocks += f'''<div class="pcat" data-cat="{c}" id="{k}-{c}">
          <div class="prow-head"><h3 class="pcat-h">{cn}</h3><span class="prow-n"></span>
            <div class="prow-nav"><button type="button" class="prow-btn" data-dir="-1" aria-label="Scroll left">‹</button><button type="button" class="prow-btn" data-dir="1" aria-label="Scroll right">›</button></div></div>
          <div class="prow">{"".join(tile(p) for p in items)}</div></div>'''
        nav = '<div class="prow-nav"><button type="button" class="prow-btn" data-dir="-1" aria-label="Scroll left">‹</button><button type="button" class="prow-btn" data-dir="1" aria-label="Scroll right">›</button></div>'
        depts += f'<section class="dept" id="{k}" data-sport="{k}"><div class="dept-head"><h2 class="display h-md">{n}</h2><p class="lead">{line}</p><button type="button" class="dept-all" data-go="{k}">See all <span class="dept-n"></span></button>{nav}</div><div class="dept-rows">{blocks}</div></section>'
    who = "".join(f'<button type="button" class="who-btn" data-who="{a}"><b>{t}</b><span>{s}</span></button>' for a, t, s in
                  [("men", "Men", "Gis, rashguards, shorts and more"), ("women", "Women", "Cut and sized for women"), ("kids", "Kids", "Ages 4 to 13, kids' sizes")])
    tabs = '<button type="button" data-sport="all" aria-pressed="true">All</button>' + "".join(f'<button type="button" data-sport="{k}" aria-pressed="false">{n}</button>' for k, n, _ in SPORTS)
    SEARCH = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>'
    return f"""
<section class="page-hero dark shop-hero">
  <div class="wrap" style="position:relative">
    <h1 class="display h-xl"><span class="ln"><span>Shop</span></span></h1>
    <p class="lead soft fade-load">Gis, fight wear, gear and clothing for BJJ, wrestling and judo. Choose your size, add to your bag and send the order on WhatsApp. No online payment.</p>
    <p class="shop-q-l fade-load">Who are you shopping for?</p>
    <div class="who fade-load">{who}</div>
  </div>
</section>
<div class="shop-bar" id="shop-bar"><div class="wrap sbar">
  <div class="shop-tabs" role="group" aria-label="Sport">{tabs}</div>
  <div class="sbar-tools">
    <label class="who-sel"><span class="sr-only">Who for</span><select id="shop-who"><option value="all">Everyone</option><option value="men">Men</option><option value="women">Women</option><option value="kids">Kids</option></select></label>
    <button type="button" class="sbar-ic" id="search-open" aria-label="Search">{SEARCH}</button>
  </div>
  <div class="sbar-search" id="sbar-search" hidden>{SEARCH}<input type="search" id="shop-q" placeholder="Search the shop" aria-label="Search the shop"><button type="button" class="sbar-x" id="search-close" aria-label="Close search">×</button></div>
</div></div>
<section class="section light shop-main all-view" id="shop-main"><div class="wrap">
  <div class="shop-status"><p class="shop-count" id="shop-count" aria-live="polite"></p><button type="button" class="shop-reset" id="shop-reset" hidden>Clear filters</button>
    <p class="shop-how-s">Choose items and sizes, send your bag on WhatsApp, and we confirm price, stock and delivery.</p></div>
  {depts}
  <div class="shop-empty" id="shop-empty" hidden><h3>No items found</h3><p>Try another category, sport or search.</p></div>
  <div class="shop-note"><h3>Need something else?</h3><p>Team orders, custom prints for your club or a product we do not list yet. Message us and we will help.</p>
    <a class="btn btn-primary" href="{WA}" rel="noopener">Message us on WhatsApp {arrow()}</a></div>
</div></section>
<div class="pv" id="pv" hidden role="dialog" aria-modal="true" aria-labelledby="pv-name"><div class="pv-box">
  <button type="button" class="pv-x" aria-label="Close">×</button>
  <div class="pv-art" id="pv-art"></div>
  <div class="pv-body"><p class="label" id="pv-cat"></p><h2 class="display h-md" id="pv-name"></h2><p class="pv-price req" id="pv-price"></p><p class="body muted" id="pv-desc"></p>
    <div class="pv-group"><p class="pv-l">Size <button type="button" class="pv-guide" id="pv-guide">Size guide</button></p><div class="pv-opts" id="pv-sizes"></div></div>
    <div class="pv-fit" id="pv-fit" hidden><p class="pv-l">Find my size</p>
      <div class="pv-fit-row"><label><span>Height</span><input type="number" inputmode="numeric" id="fit-h" min="80" max="230" placeholder="cm"></label>
      <label id="fit-w-l"><span>Weight</span><input type="number" inputmode="numeric" id="fit-w" min="10" max="200" placeholder="kg"></label></div>
      <p class="note" id="fit-out" aria-live="polite"></p></div>
    <div class="pv-sg" id="pv-sg" hidden></div>
    <div class="pv-group"><p class="pv-l">Colour <span id="pv-col-name"></span></p><div class="pv-opts" id="pv-cols"></div></div>
    <div class="pv-group pv-qty"><p class="pv-l">Quantity</p><div class="stepper"><button type="button" data-q="-1" aria-label="Less">−</button><output id="pv-q">1</output><button type="button" data-q="1" aria-label="More">+</button></div></div>
    <div class="pv-act"><button type="button" class="btn btn-primary" id="pv-add">Add to bag</button><a class="btn btn-ghost" id="pv-wa" href="#" rel="noopener">Order this on WhatsApp</a></div>
    <p class="note" id="pv-msg" aria-live="polite"></p>
  </div>
</div></div>
<aside class="bagd" id="bagd" hidden aria-label="Bag"><div class="bagd-box">
  <div class="bagd-top"><h2 class="display h-md">Your bag</h2><button type="button" class="pv-x" id="bag-x" aria-label="Close">×</button></div>
  <div class="bagd-list" id="bag-list"></div>
  <div class="bagd-foot"><p class="bag-total" id="bag-total" hidden></p><p class="note">We will reply on WhatsApp with prices, delivery options and payment details.</p>
    <a class="btn btn-primary" id="bag-send" href="#" rel="noopener">Send order on WhatsApp {arrow()}</a>
    <button type="button" class="bagd-clear" id="bag-clear">Clear bag</button></div>
</div></aside>
<template id="shop-art">{"".join(f'<svg data-k="{k}" viewBox="0 0 120 120">{v}</svg>' for k, v in __import__("shop_art").ART.items())}</template>
<script id="shop-data" type="application/json">{json.dumps(data, ensure_ascii=False)}</script>
"""

def privacy():
    return f"""
<section class="page-hero dark"><div class="wrap">
<h1 class="display h-lg">Privacy<span class="dot">.</span></h1></div></section>
<section class="section light"><div class="wrap prose">
<p class="label muted">Last updated: November 2026</p>
<h2>What this website collects</h2>
<p>We only collect what you choose to send us through the forms on this site:</p>
<p><b>Camp request form</b>: name, email, country, age, training experience and the optional details you add (phone or WhatsApp, level, club, accommodation needs, message). Used to arrange your place at a camp.</p>
<p><b>Email signups</b> (The Culture Letter and “Get new camp dates”): your email and the topics you choose, such as camp dates for your sport, shop news or stories. Used to send you those emails. You can unsubscribe at any time by replying “unsubscribe” or writing to us.</p>
<p><b>Contact form</b>: name, email, topic, message and optional phone. Used to reply to you.</p>
<p><b>Shop orders</b> are sent by you on WhatsApp. Your bag is saved only in your own browser until you send it.</p>
<p><b>Visitor counts</b>: we count page views anonymously (the page, language, phone or computer, and which site you came from) to see how the site is used. No cookies, no IP addresses and nothing that identifies you is stored.</p>
<p>We don’t sell or share your details, and there are no accounts or advertising cookies on this site.</p>
<h2>Where your details are kept</h2>
<p>Form submissions are stored in our database at Supabase, a hosting service for databases. Only the CHIDAOBA team can see them, through a password-protected admin page. If a form cannot reach the database, it opens your email app instead and the message is sent from your own email account. We keep your details only as long as needed. To see, correct or delete what we hold about you, email us and we’ll do it.</p>
<p>WhatsApp, Instagram and Facebook links open those services; their own privacy policies apply when you use them.</p>
<h2>Third-party services</h2>
<p>The site is hosted on GitHub Pages, stores form data with Supabase and loads its typefaces from Google Fonts. Like any web server, these services receive technical information such as your IP address. Their own privacy policies apply.</p>
<h2>Contact</h2>
<p>Questions: email <a href="mailto:{EMAIL}">{EMAIL}</a> or message us on Instagram at <a href="{IG}" rel="noopener">{IG_HANDLE}</a>.</p>
</div></section>"""

def notfound():
    return f"""
<section class="page-hero dark" style="min-height:70vh">{sym_svg("ghost")}<div class="wrap" style="position:relative">
<h1 class="display h-xl">Page not found</h1>
<p class="lead soft">This page does not exist.</p>
<div style="margin-top:36px"><a class="btn btn-primary" href="/">Back to home {arrow()}</a></div></div></section>"""

def contact():
    topics = ["General question", "Camps &amp; events", "Coach / athlete / club", "Partnership or collaboration", "Press", "Shop &amp; apparel"]
    opts = "".join(f"<option value=\"{t}\">{t}</option>" for t in topics)
    return f"""
<section class="page-hero dark">
  {sym_svg("ghost")}
  <div class="wrap" style="position:relative">
    <h1 class="display h-xl"><span class="ln"><span>Contact</span></span></h1>
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
        <a href="{FB}" rel="noopener"><span class="label muted">Facebook</span><b>fb.com/chidaoba</b></a>
      </div>
    </div>
    <form id="contact-form" class="js-form stagger" data-db="message" data-key="{WEB3FORMS_KEY}" data-done="contact-done" novalidate>
      <input type="hidden" name="subject" value="New message, chidaoba.com">
      <input type="hidden" name="from_name" value="chidaoba.com">
      <input type="checkbox" name="botcheck" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">
      <div class="field"><label for="c-name">Name</label><input id="c-name" name="name" autocomplete="name" required></div>
      <div class="field"><label for="c-email">Email</label><input id="c-email" name="email" type="email" autocomplete="email" required></div>
      <div class="field"><label for="c-topic">Topic</label><select id="c-topic" name="topic">{opts}</select></div>
      <div class="field"><label for="c-phone">Phone / WhatsApp <em>optional</em></label><input id="c-phone" name="phone" type="tel" autocomplete="tel"></div>
      <div class="field full"><label for="c-msg">Message</label><textarea id="c-msg" name="message" required></textarea></div>
      <label class="consent"><input type="checkbox" name="consent" value="yes" required><span>I agree that CHIDAOBA may use these details to reply to me, as described in the <a href="/privacy/">privacy notice</a>.</span></label>
      <div class="form-foot"><button class="btn btn-primary" type="submit">Send message {arrow()}</button><p class="form-msg" aria-live="polite"></p></div>
    </form>
    <div class="done" id="contact-done" role="status">
      <h3 class="display h-md">Thank you<span class="dot">.</span></h3>
      <p class="body soft">We’ll reply as soon as we can, usually within a few days. For anything urgent, message us on <a href="{WA}" rel="noopener">WhatsApp</a>.</p>
    </div>
  </div>
</section>"""

LLMS = """# CHIDAOBA

> CHIDAOBA is a sports brand from Georgia (the country), named after chidaoba, the traditional Georgian wrestling listed by UNESCO in 2018. It runs BJJ, grappling, wrestling and judo training camps in Georgia and sells BJJ gis, judogi, wrestling singlets and shoes, rashguards, fight shorts and training gear, ordered on WhatsApp. The site is in English and Georgian.

## Camps
- [Training camps in Georgia](https://chidaoba.com/camps/): BJJ and grappling, freestyle and Greco-Roman wrestling, and judo camps with local coaches, accommodation and meals. Requests are free, with no deposit.
- [BJJ and Grappling Camp, Spring 2027](https://chidaoba.com/camps/camp/?c=bjj-grappling-spring-2027): in Svaneti, Georgia, at a mountain sports complex with an 800 m2 training hall, limited to 40 people. Dates and prices to be announced.
- [Venue: Ilia Gabliani Sports Complex](https://chidaoba.com/camps/venue/?v=mulakhi): Mulakhi, Upper Svaneti. Training hall with tatami, 11 rooms for 40 people, three meals a day.

## Shop
- [Shop](https://chidaoba.com/shop/): BJJ gis and belts (men, women, kids), judogi and judo belts, wrestling singlets, shoes, headgear and knee pads, rashguards, fight shorts, spats and compression wear, bags and training gear, hoodies and T-shirts. Ordered on WhatsApp.

## Georgia and the sport
- [Why train in Georgia](https://chidaoba.com/georgia/): Georgia's Olympic, world and European champions in judo and wrestling, the growing BJJ scene, mountains, sea, food and practical travel information.
- [About Chidaoba](https://chidaoba.com/culture/): the history and rules of chidaoba, Georgian folk wrestling, and why the brand carries its name.

## Contact
- Email: chidaobaculture@gmail.com
- WhatsApp: +995 595 606 670
- Instagram: https://www.instagram.com/chidaobaculture/
- Georgian version of the site: https://chidaoba.com/ka/
"""

PAGES = [
    ("/", "index.html", "CHIDAOBA | Georgian wrestling culture, training camps and gear",
     "Born in Georgia, CHIDAOBA brings wrestling heritage into modern grappling culture through training camps, apparel and a growing community of athletes.", home),
    ("/georgia/", "georgia/index.html", "Why Train in Georgia: Judo, Wrestling and BJJ | CHIDAOBA",
     "Why train in Georgia: a wrestling culture centuries old, Olympic and world champions, booming BJJ, the Caucasus mountains, the Black Sea and the Georgian table.", georgia),
    ("/culture/", "culture/index.html", "Culture | Chidaoba and the CHIDAOBA brand",
     "The story of Chidaoba, Georgia’s traditional wrestling (UNESCO Intangible Cultural Heritage, 2018), and why we chose the name: a Georgian-rooted brand for wrestling, grappling, BJJ and judo.", culture),
    ("/camps/", "camps/index.html", "BJJ, Wrestling and Judo Camps in Georgia | CHIDAOBA",
     "Training camps in Georgia for BJJ and grappling, freestyle and Greco-Roman wrestling, and judo, with local coaches, accommodation and meals. Next camp: BJJ and grappling, spring 2027, Svaneti.", camps),
    ("/camps/camp/", "camps/camp/index.html", "Camp | CHIDAOBA",
     "Camp details, packages, schedule and registration | CHIDAOBA.", camp_detail),
    ("/camps/venue/", "camps/venue/index.html", "Venue | CHIDAOBA",
     "Where we train: Ilia Gabliani Sports Complex in Mulakhi, Svaneti. Training hall, rooms for 40, meals, pool and mountain views.", venue_page),
    ("/admin/", "admin/index.html", "Admin | CHIDAOBA", "Admin.", admin),
    ("/shop/", "shop/index.html", "BJJ Gis, Rashguards and Wrestling Gear | CHIDAOBA Shop", "BJJ gis and belts, judogi, wrestling singlets and shoes, rashguards, fight shorts and training gear for men, women and kids. Order on WhatsApp, delivery in Georgia.", shop),
    ("/contact/", "contact/index.html", "Contact | CHIDAOBA",
     "Contact CHIDAOBA: email chidaobaculture@gmail.com, WhatsApp +995 595 606 670 or Instagram @chidaobaculture.", contact),
    ("/privacy/", "privacy/index.html", "Privacy | CHIDAOBA", "Privacy information for chidaoba.com.", privacy),
    ("/404.html", "404.html", "Not found | CHIDAOBA", "Page not found.", notfound),
]

if __name__ == "__main__":
    import i18n
    trs = {l: i18n.Tr(l) for l in i18n.LANGS}
    cat = {slugify(p[0]): {"name": p[0].replace("&amp;", "&"), "cat": {k: n for k, n, _ in SPORTS}[p[2]].replace("&amp;", "&")} for p in PRODUCTS}
    import shop_art
    _ka = json.load(open(os.path.join(ROOT, "_src", "i18n", "ka.json"), encoding="utf-8"))
    seed = [{"id": slugify(p[0]), "name": p[0], "name_ka": _ka.get(p[0]), "description": p[1], "description_ka": _ka.get(p[1]), "sport": p[2], "category": p[3],
             "audience": p[4], "sizes": p[5], "colours": p[6], "size_guide": p[7] or None, "drawing": p[8], "price": None, "currency": "GEL",
             "photo_url": None, "status": "active", "sort": i * 10} for i, p in enumerate(PRODUCTS)]
    meta = {"sports": [[k, n.replace("&amp;", "&")] for k, n, _ in SPORTS],
            "cats": {k: [[c, n.replace("&amp;", "&")] for c, n in v] for k, v in CATS.items()},
            "audience": {"men": "Men", "women": "Women", "adult": "Adults, unisex", "kids": "Kids", "all": "Everyone (one size / any age)"},
            "guides": {"": "None", "gi": "BJJ gi (A0 to A5)", "gi_w": "Women's gi (F1 to F4)", "gi_k": "Kids gi (M000 to M4)", "belt": "BJJ belt", "belt_k": "Kids BJJ belt",
                       "judogi": "Judogi (by height)", "jbelt": "Judo belt", "top": "Tops (XS to XXL)", "top_w": "Women's tops (XS to XL)", "kids": "Kids clothing (by age)",
                       "shorts": "Shorts (waist in inches)", "shoes": "Shoes (EU sizes)"},
            "drawings": sorted(shop_art.ART.keys()), "art": shop_art.ART, "colours": shop_art.COLOURS, "dark": sorted(shop_art.DARK),
            "sizesets": {"Adult XS to XXL": APPAREL, "Women XS to XL": WOMEN, "Kids by age": KIDS_AGE, "One size": ONE}}
    open(os.path.join(ROOT, "assets", "js", "catalog.js"), "w", encoding="utf-8").write(
        "// Generated by _src/build.py: shop catalogue. The live shop reads products from the database;\n"
        "// this copy is the fallback and the starting set.\nwindow.CHD_SHOP=" + json.dumps(cat, ensure_ascii=False) + ";\n"
        "window.CHD_PRODUCTS=" + json.dumps(seed, ensure_ascii=False) + ";\nwindow.CHD_SHOP_META=" + json.dumps(meta, ensure_ascii=False) + ";\n")
    os.makedirs(os.path.join(ROOT, "assets", "i18n"), exist_ok=True)
    for l in i18n.LANGS:
        open(os.path.join(ROOT, "assets", "i18n", l + ".js"), "w", encoding="utf-8").write(i18n.runtime_js(l))
    multi = []
    for path, out, title, desc, fn in PAGES:
        doc = page(path, html.escape(title, quote=False), html.escape(desc), fn())
        ml = path not in ("/admin/", "/404.html")
        def fin(d, lang):
            d = d.replace("<!--LANGSW-->", i18n.switcher(path, lang) if ml else "")
            return d.replace("<!--ALT-->", i18n.alternates(path) if ml else "")
        outs = [(out, fin(doc, "en"))]
        if ml:
            multi.append(path)
            for l, t in trs.items():
                d = t.page(doc, path)
                if l == "ka":  # FAQ data in Georgian, matching the visible answers
                    def _faq(m):
                        dd = json.loads(m.group(1))
                        if dd.get("@type") == "FAQPage":
                            for q in dd["mainEntity"]:
                                q["name"] = _ka.get(q["name"], q["name"]); q["acceptedAnswer"]["text"] = _ka.get(q["acceptedAnswer"]["text"], q["acceptedAnswer"]["text"])
                        return '<script type="application/ld+json">' + json.dumps(dd, ensure_ascii=False) + '</script>'
                    d = re.sub(r'<script type="application/ld\+json">(.*?)</script>', _faq, d, flags=re.S)
                if l == "ka":  # Georgian link previews
                    d = re.sub(r'/assets/img/og-(\w+)\.png', r'/assets/img/og-\1-ka.png', d)
                    d = d.replace('<meta property="og:locale" content="en_US">\n<meta property="og:locale:alternate" content="ka_GE">',
                                  '<meta property="og:locale" content="ka_GE">\n<meta property="og:locale:alternate" content="en_US">')
                if l == "ka":  # numbers the text translator skips
                    d = d.replace("<b>3.9M</b>", "<b>3.9 მლნ</b>").replace("1 : 82,000", "1 : 82 000")
                d = d.replace("<script ", f'<script src="/assets/i18n/{l}.js?v={ASSET_V}"></script>\n<script ', 1) if "<script " in d else d
                outs.append((os.path.join(l, out), fin(d, l)))
        for o, d in outs:
            full = os.path.join(ROOT, o)
            os.makedirs(os.path.dirname(full), exist_ok=True)
            with open(full, "w", encoding="utf-8") as f:
                f.write(d)
    for l, t in trs.items():
        miss = sorted(t.missing)
        json.dump(miss, open(f"/tmp/i18n-missing-{l}.json", "w"), ensure_ascii=False, indent=0)
        print(l, "missing", len(miss))
    import datetime
    today = datetime.date.today().isoformat()
    urls = [pre + p for p in multi if p not in ("/camps/camp/",) for pre in ("", "/ka")]
    urls += [pre + "/camps/camp/?c=bjj-grappling-spring-2027" for pre in ("", "/ka")]
    sm = "".join(f"<url><loc>https://chidaoba.com{html.escape(u)}</loc><lastmod>{today}</lastmod></url>" for u in urls)
    open(os.path.join(ROOT, "sitemap.xml"), "w").write(
        f'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{sm}</urlset>\n')
    bots = ["Googlebot", "Bingbot", "GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-SearchBot", "PerplexityBot", "Google-Extended", "Applebot"]
    open(os.path.join(ROOT, "robots.txt"), "w").write("".join(f"User-agent: {b}\nAllow: /\nDisallow: /admin/\n\n" for b in bots) +
        "User-agent: *\nAllow: /\nDisallow: /admin/\n\nSitemap: https://chidaoba.com/sitemap.xml\n")
    open(os.path.join(ROOT, "llms.txt"), "w", encoding="utf-8").write(LLMS)
    print("built", len(PAGES), "pages x", 1 + len(trs), "languages")
