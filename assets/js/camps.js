// CHIDAOBA CULTURE, public camps: list, detail page, booking
(function () {
  var H = window.CHD; if (!H) return;
  var e = H.esc, $ = function (s, r) { return (r || document).querySelector(s); };
  var WA = 'https://wa.me/' + ((window.CHD_CONFIG || {}).WHATSAPP || '');

  if (H.mode === 'demo') {
    var b = document.createElement('div');
    b.className = 'demo-bar';
    b.innerHTML = 'Demo mode: sample camps, saved only in this browser. <a href="?demo=0">Exit demo</a>';
    document.body.prepend(b);
  }

  function spots(c) {
    if (!c.capacity) return null;
    var left = Math.max(0, c.capacity - (c.taken || 0));
    return { left: left, pct: Math.min(100, Math.round((c.taken || 0) / c.capacity * 100)) };
  }
  function state(c) {
    if (c.status === 'completed') return { key: 'done', label: 'Completed' };
    if (c.status === 'sold_out') return { key: 'full', label: 'Sold out, join waitlist' };
    if (c.registration_deadline && H.today() > H.d(c.registration_deadline)) return { key: 'closed', label: 'Registration closed' };
    var s = spots(c);
    if (s && s.left === 0) return { key: 'full', label: 'Full, join waitlist' };
    if (s && s.left <= Math.max(3, Math.ceil(c.capacity * 0.2))) return { key: 'few', label: 'Only ' + s.left + ' spot' + (s.left === 1 ? '' : 's') + ' left' };
    return { key: 'open', label: 'Open for registration' };
  }

  // ================= LIST =================
  var list = $('#camp-list');
  if (list) {
    var tabs = document.querySelectorAll('.disc-tabs button');
    var all = [];
    function render(filter) {
      var items = all.filter(function (c) { return !filter || filter === 'all' || c.discipline === filter; });
      var up = items.filter(function (c) { return c.status !== 'completed'; });
      var past = items.filter(function (c) { return c.status === 'completed'; });
      if (!items.length) {
        list.innerHTML = '<div class="camp-empty"><p class="label muted"><span class="bar"></span>Coming soon</p>' +
          '<h3 class="display h-md">' + (all.length ? 'No camps in this discipline yet' : 'The first camps are being planned') + '<span class="dot">.</span></h3>' +
          '<p class="body soft">New dates are published here first. Message us and we’ll tell you as soon as registration opens.</p>' +
          '<div class="row-btns"><a class="btn btn-primary" href="' + WA + '?text=' + encodeURIComponent('Hi CHIDAOBA, please tell me when camps open.') + '" rel="noopener">Notify me on WhatsApp <span class="arr">→</span></a>' +
          '<a class="btn btn-ghost" href="/contact/">Ask about a team camp <span class="arr">→</span></a></div></div>';
        return;
      }
      list.innerHTML = up.map(card).join('') + (past.length ? '<p class="label muted past-label">Past camps</p>' + past.map(card).join('') : '');
    }
    function card(c) {
      var st = state(c), s = spots(c), from = H.fromPrice(c), early = H.isEarly(c);
      var n = H.days(c.start_date, c.end_date);
      var cv = H.cover(c), v = H.venue(c);
      return '<a class="camp-card st-' + st.key + (c.featured ? ' featured' : '') + (cv ? ' has-img' : '') + '" href="/camps/camp/?c=' + encodeURIComponent(c.slug) + '">' +
        (cv ? '<div class="cc-img"><img src="' + e(cv.thumb) + '" alt="' + e(cv.alt || '') + '" loading="lazy"></div>' : '') + '<div class="cc-body">' +
        '<div class="cc-top"><span class="label">' + e(H.DISC[c.discipline] || '') + '</span><span class="cc-status">' + e(st.label) + '</span></div>' +
        '<h3>' + e(c.title) + '</h3>' +
        '<dl class="cc-meta"><div><dt>Dates</dt><dd>' + e(H.dateRange(c.start_date, c.end_date)) + (n ? ' · ' + n + ' days' : '') + '</dd></div>' +
        '<div><dt>Where</dt><dd>' + e([c.city, c.country].filter(Boolean).join(', ') || 'TBA') + '</dd></div>' +
        (c.level ? '<div><dt>Level</dt><dd>' + e(c.level) + '</dd></div>' : '') + '</dl>' +
        (c.summary ? '<p class="cc-sum">' + e(c.summary) + '</p>' : '') +
        '<div class="cc-foot"><div class="cc-price">' + (from != null ? '<span>From</span><b>' + H.money(from, c.currency) + '</b>' + (early ? '<em>Early-bird</em>' : '') : '<b>Price TBA</b>') + '</div>' +
        (s && c.status !== 'completed' ? '<div class="cc-spots"><span>' + (s.left ? s.left + ' of ' + c.capacity + ' spots left' : 'Waitlist open') + '</span><i><b style="width:' + s.pct + '%"></b></i></div>' : '') +
        '<span class="cc-cta">View camp <span class="arr">→</span></span></div></div></a>';
    }
    list.innerHTML = '<p class="body soft loading">Loading camps…</p>';
    H.api.listCamps().then(function (c) { all = c || []; render('all'); })
      .catch(function () { list.innerHTML = '<p class="body soft">Camps could not be loaded. Please refresh, or message us on WhatsApp.</p>'; });
    tabs.forEach(function (t) {
      t.addEventListener('click', function () {
        tabs.forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
        t.setAttribute('aria-pressed', 'true'); render(t.dataset.f);
      });
    });
  }

  // ================= VENUES (list + page) =================
  var vlist = $('#venue-list'), V_ALL = window.CHD_VENUES || {};
  if (vlist) {
    vlist.innerHTML = Object.keys(V_ALL).map(function (k) {
      var v = V_ALL[k];
      return '<a class="venue-card" href="/camps/venue/?v=' + encodeURIComponent(k) + '"><div class="vc-img"><img src="' + e(v.cover.url) + '" alt="' + e(v.cover.alt) + '" loading="lazy"></div>' +
        '<div class="vc-body"><span class="label">' + e(v.place) + '</span><h3>' + e(v.name) + '</h3><p>' + e(v.intro) + '</p>' +
        '<div class="vc-facts">' + v.facts.map(function (f) { return '<span><b>' + e(f[0]) + '</b> ' + e(f[1]) + '</span>'; }).join('') + '</div>' +
        '<span class="cc-cta">See the venue <span class="arr">→</span></span></div></a>';
    }).join('');
  }
  var vroot = $('#venue-root');
  if (vroot) {
    var vk = new URLSearchParams(location.search).get('v'), V1 = V_ALL[vk];
    if (!V1) { vroot.innerHTML = '<section class="page-hero dark"><div class="wrap"><h1 class="display h-lg">Venue not found</h1><div style="margin-top:28px"><a class="btn btn-primary" href="/camps/">All camps <span class="arr">→</span></a></div></div></section>'; }
    else {
      document.title = V1.name + ', ' + V1.place + ' | CHIDAOBA CULTURE';
      galleryData = V1.gallery;
      vroot.innerHTML = '<section class="camp-hero dark has-img"><img class="camp-hero-img" src="' + e(V1.cover.url) + '" alt="' + e(V1.cover.alt) + '"><div class="wrap">' +
        '<a class="back label muted" href="/camps/">← All camps</a><p class="label muted" style="margin-top:28px">Venue · ' + e(V1.place) + '</p>' +
        '<h1 class="display h-lg">' + e(V1.name) + '</h1><p class="lead soft" style="margin-top:20px;max-width:34em">' + e(V1.intro) + '</p></div></section>' +
        '<section class="section light"><div class="wrap venue-page"><div class="camp-block">' + venueHtml(V1, {}, V1.gallery) + '</div>' +
        '<div class="team-cta"><div><p class="label">Camps here</p><h3 class="display h-md">Train in the mountains of Svaneti</h3>' +
        '<p class="body muted">Our first camps at this venue are planned for spring and summer. Dates and prices are published on the Camps page first.</p></div>' +
        '<div class="row-btns"><a class="btn btn-primary" href="/camps/">See camps <span class="arr">→</span></a><a class="btn btn-ghost" href="' + WA + '?text=' + encodeURIComponent('Hi CHIDAOBA, I’m interested in a camp at ' + V1.name + ', ' + V1.place + '.') + '" rel="noopener">Ask on WhatsApp</a></div></div></div></section>';
      wireMedia(vroot);
    }
  }

  // ================= DETAIL =================
  var root = $('#camp-root');
  if (!root) return;
  var slug = new URLSearchParams(location.search).get('c');
  if (!slug) { notFound(); return; }
  H.api.getCamp(slug).then(function (c) { if (!c) return notFound(); renderCamp(c); })
    .catch(function () { root.innerHTML = '<div class="wrap section"><p class="body">This camp could not be loaded. Please refresh.</p></div>'; });

  function notFound() {
    root.innerHTML = '<section class="page-hero dark"><div class="wrap"><p class="label muted"><span class="bar"></span>Camps</p>' +
      '<h1 class="display h-lg" style="margin-top:24px">Camp not found<span class="dot">.</span></h1><p class="lead soft">It may have ended or moved.</p>' +
      '<div style="margin-top:32px"><a class="btn btn-primary" href="/camps/">All camps <span class="arr">→</span></a></div></div></section>';
  }

  function paras(t) { return (t || '').split(/\n\s*\n/).map(function (p) { return '<p>' + e(p).replace(/\n/g, '<br>') + '</p>'; }).join(''); }

  function renderCamp(c) {
    document.title = c.title + ' | CHIDAOBA CULTURE';
    var st = state(c), s = spots(c), n = H.days(c.start_date, c.end_date), early = H.isEarly(c);
    var canBook = c.status === 'published' && st.key !== 'closed';
    var sched = (c.schedule || []).filter(function (d) { return d && (d.day || (d.items || []).length); });
    var html = '';
    var cv = H.cover(c), V = H.venue(c);
    html += '<section class="camp-hero dark' + (cv ? ' has-img' : '') + '">' + (cv ? '<img class="camp-hero-img" src="' + e(cv.url) + '" alt="' + e(cv.alt || '') + '">' : '') + '<div class="wrap">' +
      '<a class="back label muted" href="/camps/">← All camps</a>' +
      '<p class="label muted" style="margin-top:28px"><span class="bar"></span>' + e(H.DISC[c.discipline] || 'Camp') + '</p>' +
      '<h1 class="display h-lg">' + e(c.title) + '</h1>' +
      '<div class="facts-row">' +
      fact('Dates', H.dateRange(c.start_date, c.end_date)) + (n ? fact('Duration', n + ' days') : '') +
      fact('Where', [c.venue, c.city, c.country].filter(Boolean).join(', ') || 'TBA') + (c.level ? fact('Level', c.level) : '') +
      (s ? fact('Spots', s.left ? s.left + ' of ' + c.capacity + ' left' : 'Full (waitlist open)') : '') +
      '</div><span class="cc-status hero-status st-' + st.key + '">' + e(st.label) + '</span></div></section>';

    html += '<section class="section light camp-body"><div class="wrap camp-grid"><div class="camp-main">';
    if (c.summary) html += '<p class="lead">' + e(c.summary) + '</p>';
    if (c.description) html += '<div class="prose camp-desc">' + paras(c.description) + '</div>';
    var gal = (c.gallery || []).map(function (g) { return { url: g.url, thumb: g.url, alt: g.alt || c.title }; }).concat(V ? V.gallery : []);
    if (V || c.address || c.venue_info || gal.length) {
      html += block('Where you’ll train &amp; stay', venueHtml(V, c, gal));
      galleryData = gal;
    }
    if ((c.packages || []).length) {
      html += block('Packages', '<div class="pkg-list">' + c.packages.map(function (p) {
        var ep = early && p.early_price !== '' && p.early_price != null;
        return '<div class="pkg-row"><div><b>' + e(p.name) + '</b>' + (p.description ? '<span>' + e(p.description) + '</span>' : '') + '</div>' +
          '<div class="pkg-p">' + (ep ? '<s>' + H.money(p.price, c.currency) + '</s>' : '') + '<b>' + H.money(ep ? p.early_price : p.price, c.currency) + '</b></div></div>';
      }).join('') + '</div>' + (early ? '<p class="note">Early-bird prices until ' + e(H.dateRange(c.early_bird_deadline)) + '.</p>' : '') +
        (c.group_min && c.group_discount_pct ? '<p class="note">Groups of ' + c.group_min + '+ save ' + c.group_discount_pct + '%.</p>' : ''));
    }
    if (sched.length) {
      html += block('Schedule', '<div class="sched-tabs" role="tablist">' + sched.map(function (d, i) { return '<button role="tab" aria-selected="' + (i === 0) + '" data-i="' + i + '">' + e(d.day || 'Day ' + (i + 1)) + '</button>'; }).join('') + '</div>' +
        sched.map(function (d, i) { return '<ol class="timeline sched-panel"' + (i ? ' hidden' : '') + ' data-i="' + i + '">' + (d.items || []).map(function (it) { return '<li><time>' + e(it.time) + '</time><div><b>' + e(it.title) + '</b></div></li>'; }).join('') + '</ol>'; }).join(''));
    }
    if ((c.included || []).length || (c.excluded || []).length) {
      html += block('What’s included', '<div class="incl"><div><h3>Included</h3><ul>' + (c.included || []).map(function (t) { return '<li class="yes"><i>✓</i>' + e(t) + '</li>'; }).join('') + '</ul></div>' +
        '<div><h3>Not included</h3><ul>' + (c.excluded || []).map(function (t) { return '<li><i>×</i>' + e(t) + '</li>'; }).join('') + '</ul></div></div>');
    }
    if ((c.coaches || []).length) {
      html += block('Coaches', '<div class="coaches">' + c.coaches.map(function (k) {
        var ini = (k.name || '?').replace(/[\[\]]/g, '').split(/\s+/).map(function (w) { return w[0] || ''; }).join('').slice(0, 2).toUpperCase();
        return '<div class="coach"><span class="ini">' + e(ini) + '</span><div><b>' + e(k.name) + '</b><span class="label muted">' + e(k.role || '') + '</span><p>' + e(k.bio || '') + '</p></div></div>';
      }).join('') + '</div>');
    }
    if ((c.faq || []).length) html += block('Questions', '<div class="faq">' + c.faq.map(function (f) { return '<details><summary>' + e(f.q) + '</summary><p>' + e(f.a) + '</p></details>'; }).join('') + '</div>');
    html += '</div>';

    // booking panel
    html += '<aside class="book" id="book"><div class="book-in dark">';
    if (canBook && (c.packages || []).length) {
      html += '<p class="label"><span class="bar"></span>' + (st.key === 'full' ? 'Join the waitlist' : 'Reserve your spot') + '</p>' +
        '<fieldset class="b-pk"><legend>Package</legend>' + c.packages.map(function (p, i) {
          var ep = early && p.early_price !== '' && p.early_price != null;
          return '<label class="b-opt"><input type="radio" name="package" value="' + e(p.id) + '"' + (i === 0 ? ' checked' : '') + '>' +
            '<span><b>' + e(p.name) + '</b><em>' + H.money(ep ? p.early_price : p.price, c.currency) + (ep ? ' <s>' + H.money(p.price, c.currency) + '</s>' : '') + '</em></span></label>';
        }).join('') + '</fieldset>' +
        ((c.addons || []).length ? '<fieldset class="b-ad"><legend>Add-ons</legend>' + c.addons.map(function (a) {
          return '<label class="b-chk"><input type="checkbox" name="addon" value="' + e(a.id) + '"><span>' + e(a.name) + '</span><em>+' + H.money(a.price, c.currency) + '</em></label>';
        }).join('') + '</fieldset>' : '') +
        '<div class="b-people"><span>People</span><div class="stepper"><button type="button" data-d="-1" aria-label="Fewer people">−</button><output id="b-n">1</output><button type="button" data-d="1" aria-label="More people">+</button></div></div>' +
        (c.group_min && c.group_discount_pct ? '<p class="note">' + c.group_min + '+ people: −' + c.group_discount_pct + '% group discount</p>' : '') +
        '<div class="b-sum" id="b-sum"></div>' +
        '<button class="btn btn-primary b-go" type="button" id="b-go">' + (st.key === 'full' ? 'Join waitlist' : 'Continue') + ' <span class="arr">→</span></button>' +
        '<p class="note">No payment now. ' + (st.key === 'full' ? 'We’ll contact you if a spot opens.' : 'Secure your spot with a ' + c.deposit_pct + '% deposit by bank transfer within ' + c.payment_days + ' days.') + '</p>';
    } else {
      html += '<p class="label"><span class="bar"></span>' + e(st.label) + '</p><p class="body">' +
        (c.status === 'completed' ? 'This camp has finished. See upcoming camps.' : 'Registration is not open for this camp right now.') + '</p>' +
        '<a class="btn btn-primary" href="/camps/">Upcoming camps <span class="arr">→</span></a>';
    }
    html += '<a class="book-wa" href="' + WA + '?text=' + encodeURIComponent('Hi CHIDAOBA, a question about ' + c.title + ': ') + '" rel="noopener">Questions? WhatsApp us</a></div></aside>';
    html += '</div></section>';
    if (canBook) html += '<div class="book-bar dark" id="book-bar"><div><span>From</span><b>' + H.money(H.fromPrice(c), c.currency) + '</b></div><a class="btn btn-primary" href="#book">' + (st.key === 'full' ? 'Join waitlist' : 'Reserve') + '</a></div>';
    html += modal(c, st);
    root.innerHTML = html;

    wireMedia(root);
    // schedule tabs
    root.querySelectorAll('.sched-tabs button').forEach(function (b) {
      b.addEventListener('click', function () {
        root.querySelectorAll('.sched-tabs button').forEach(function (x) { x.setAttribute('aria-selected', 'false'); });
        b.setAttribute('aria-selected', 'true');
        root.querySelectorAll('.sched-panel').forEach(function (p) { p.hidden = p.dataset.i !== b.dataset.i; });
      });
    });
    if (canBook && (c.packages || []).length) wireBooking(c, st);
  }
  var galleryData = [];
  function venueHtml(V, c, gal) {
    c = c || {};
    var loc = c.address || (V && V.address) || [c.venue, c.city, c.country].filter(Boolean).join(', ');
    var q = (V && !c.address) ? V.map_query : loc, vh = '';
    if (V) vh += '<p class="lead">' + e(V.intro) + '</p><div class="v-facts">' + V.facts.map(function (f) { return '<div><b>' + e(f[0]) + '</b><span>' + e(f[1]) + '</span></div>'; }).join('') + '</div>';
    if (gal.length) {
      vh += '<div class="gal">' + gal.slice(0, 5).map(function (g, i) {
        return '<button type="button" class="gal-i' + (i === 0 ? ' big' : '') + '" data-i="' + i + '" aria-label="View photo: ' + e(g.alt) + '"><img src="' + e(i === 0 ? g.url : g.thumb) + '" alt="' + e(g.alt) + '" loading="lazy">' +
          (i === 4 && gal.length > 5 ? '<span class="gal-more">+' + (gal.length - 5) + ' photos</span>' : '') + '</button>';
      }).join('') + '</div>';
    }
    if (V) {
      vh += '<div class="incl v-list"><div><h3>Indoors</h3><ul>' + V.indoor.map(function (t) { return '<li class="yes"><i>✓</i>' + e(t) + '</li>'; }).join('') + '</ul></div>' +
        '<div><h3>Outdoors</h3><ul>' + V.outdoor.map(function (t) { return '<li class="yes"><i>✓</i>' + e(t) + '</li>'; }).join('') + '</ul></div></div>';
      vh += '<details class="menu"><summary>What you’ll eat: the daily menu</summary><div class="menu-grid">' + V.menu.map(function (m) { return '<div><b>' + e(m.meal) + '</b><p>' + e(m.items) + '</p></div>'; }).join('') + '</div></details>';
    }
    if (c.venue_info) vh += '<div class="prose camp-desc">' + paras(c.venue_info) + '</div>';
    if (loc) {
      var mq = encodeURIComponent(q || loc), open = c.map_url || ('https://www.google.com/maps/search/?api=1&query=' + mq);
      vh += '<div class="map"><div class="map-top"><div><span class="label">Where</span><b>' + e(V ? V.name : (c.venue || loc)) + '</b><span>' + e(loc) + '</span></div>' +
        '<a class="btn btn-ghost" href="' + e(open) + '" target="_blank" rel="noopener">Open in Google Maps <span class="arr">→</span></a></div>' +
        '<button type="button" class="map-load" data-q="' + e(mq) + '">Show map</button></div>';
    }
    return vh;
  }
  function wireMedia(scope) {
    scope.querySelectorAll('.gal-i').forEach(function (b) { b.addEventListener('click', function () { lightbox(+b.dataset.i); }); });
    var ml = scope.querySelector('.map-load');
    if (ml) ml.addEventListener('click', function () {
      var f = document.createElement('iframe'); f.className = 'map-frame'; f.loading = 'lazy'; f.title = 'Map';
      f.referrerPolicy = 'no-referrer-when-downgrade'; f.src = 'https://www.google.com/maps?q=' + ml.dataset.q + '&z=12&output=embed';
      ml.replaceWith(f);
    });
  }
  function lightbox(i) {
    var g = galleryData; if (!g.length) return;
    var lb = document.createElement('div'); lb.className = 'lb'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true');
    lb.innerHTML = '<button class="lb-x" aria-label="Close">×</button><button class="lb-p" aria-label="Previous">‹</button><figure><img alt=""><figcaption></figcaption></figure><button class="lb-n" aria-label="Next">›</button>';
    document.body.appendChild(lb); document.body.classList.add('modal-open');
    function show() { var x = g[i]; lb.querySelector('img').src = x.url; lb.querySelector('img').alt = x.alt; lb.querySelector('figcaption').textContent = (i + 1) + ' / ' + g.length + (x.alt ? ', ' + x.alt : ''); }
    function close() { lb.remove(); document.body.classList.remove('modal-open'); document.removeEventListener('keydown', key); }
    function key(ev) { if (ev.key === 'Escape') close(); if (ev.key === 'ArrowRight') { i = (i + 1) % g.length; show(); } if (ev.key === 'ArrowLeft') { i = (i - 1 + g.length) % g.length; show(); } }
    lb.addEventListener('click', function (ev) {
      if (ev.target.closest('.lb-n')) { i = (i + 1) % g.length; show(); } else if (ev.target.closest('.lb-p')) { i = (i - 1 + g.length) % g.length; show(); }
      else if (ev.target.closest('.lb-x') || ev.target === lb) close();
    });
    var sx = null; lb.addEventListener('touchstart', function (ev) { sx = ev.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (ev) { if (sx == null) return; var dx = ev.changedTouches[0].clientX - sx; if (Math.abs(dx) > 40) { i = (i + (dx < 0 ? 1 : -1) + g.length) % g.length; show(); } sx = null; });
    document.addEventListener('keydown', key); show(); lb.querySelector('.lb-x').focus();
  }
  function fact(k, v) { return '<div><span class="label muted">' + k + '</span><b>' + e(v) + '</b></div>'; }
  function block(t, inner) { return '<div class="camp-block reveal in"><h2 class="display h-md">' + t + '<span class="dot">.</span></h2>' + inner + '</div>'; }

  function modal(c, st) {
    return '<div class="modal" id="b-modal" hidden role="dialog" aria-modal="true" aria-labelledby="b-title"><div class="modal-box dark">' +
      '<button class="modal-x" type="button" aria-label="Close">×</button>' +
      '<form id="b-form" novalidate><p class="label muted"><span class="bar"></span>' + e(c.title) + '</p>' +
      '<h2 id="b-title" class="display h-md">' + (st.key === 'full' ? 'Join the waitlist' : 'Your details') + '<span class="dot">.</span></h2>' +
      '<div class="b-recap" id="b-recap"></div>' +
      '<div class="b-fields">' +
      f('full_name', 'Full name', 'text', true, 'name') + f('email', 'Email', 'email', true, 'email') +
      f('phone', 'Phone / WhatsApp', 'tel', true, 'tel') + f('country', 'Country', 'text', true, 'country-name') +
      f('age', 'Age', 'number', true) +
      '<div class="field"><label for="b-experience">Experience</label><select id="b-experience" name="experience" required><option value="">Select…</option><option>Beginner</option><option>Under 1 year</option><option>1–3 years</option><option>3–5 years</option><option>5+ years</option><option>Competitive athlete</option><option>Coach</option></select></div>' +
      f('level', 'Belt / level', 'text', false) + f('club', 'Club or academy', 'text', false, 'organization') +
      '<div class="field full"><label for="b-notes">Notes <em>optional</em></label><textarea id="b-notes" name="notes" placeholder="Names of others in your group, injuries, dietary needs, questions…"></textarea></div>' +
      '<input type="text" name="website" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">' +
      '<label class="consent"><input type="checkbox" name="consent" required><span>I agree that CHIDAOBA CULTURE stores these details to organise this camp and contact me, as described in the <a href="/privacy/" target="_blank">privacy notice</a>.</span></label>' +
      '</div><div class="form-foot"><button class="btn btn-primary" type="submit" id="b-submit">' + (st.key === 'full' ? 'Join waitlist' : 'Reserve my spot') + ' <span class="arr">→</span></button><p class="form-msg" aria-live="polite"></p></div></form>' +
      '<div id="b-done" hidden></div></div></div>';
  }
  function f(n, l, t, req, ac) {
    return '<div class="field"><label for="b-' + n + '">' + l + (req ? '' : ' <em>optional</em>') + '</label><input id="b-' + n + '" name="' + n + '" type="' + t + '"' +
      (req ? ' required' : '') + (ac ? ' autocomplete="' + ac + '"' : '') + (t === 'number' ? ' min="6" max="99" inputmode="numeric"' : '') + '></div>';
  }

  function wireBooking(c, st) {
    var people = 1, box = $('#book');
    function sel() {
      return { package: (box.querySelector('input[name="package"]:checked') || {}).value,
        addons: [].map.call(box.querySelectorAll('input[name="addon"]:checked'), function (x) { return x.value; }), people: people };
    }
    function draw() {
      var q = H.quote(c, sel()); if (!q) return;
      var m = function (v) { return H.money(v, c.currency); };
      var rows = '<div><span>' + e(q.pkg.name) + (q.early ? ' · early-bird' : '') + '</span><b>' + m(q.unit) + '</b></div>';
      q.addons.forEach(function (a) { rows += '<div><span>' + e(a.name) + '</span><b>' + m(a.price) + '</b></div>'; });
      if (q.people > 1) rows += '<div><span>× ' + q.people + ' people</span><b>' + m((q.unit + q.extras) * q.people) + '</b></div>';
      if (q.discount) rows += '<div class="disc"><span>Group discount −' + c.group_discount_pct + '%</span><b>−' + m(q.discount) + '</b></div>';
      rows += '<div class="tot"><span>Total</span><b>' + m(q.total) + '</b></div>';
      if (st.key !== 'full') rows += '<div class="dep"><span>Deposit to reserve (' + c.deposit_pct + '%)</span><b>' + m(q.deposit) + '</b></div>';
      $('#b-sum').innerHTML = rows;
      return q;
    }
    box.addEventListener('change', draw);
    box.querySelectorAll('.stepper button').forEach(function (b) {
      b.addEventListener('click', function () {
        var max = c.capacity ? Math.max(1, Math.min(30, st.key === 'full' ? 30 : c.capacity - (c.taken || 0))) : 30;
        people = Math.max(1, Math.min(max, people + +b.dataset.d));
        $('#b-n').textContent = people; draw();
      });
    });
    draw();

    var modalEl = $('#b-modal'), form = $('#b-form'), msg = form.querySelector('.form-msg'), last;
    function open() {
      var q = draw(); last = document.activeElement;
      $('#b-recap').innerHTML = '<span>' + e(q.pkg.name) + (q.addons.length ? ' + ' + q.addons.map(function (a) { return e(a.name); }).join(', ') : '') + ' · ' + q.people + ' ' + (q.people > 1 ? 'people' : 'person') + '</span><b>' + H.money(q.total, c.currency) + '</b>';
      modalEl.hidden = false; document.body.classList.add('modal-open');
      setTimeout(function () { $('#b-full_name').focus(); }, 50);
    }
    function close() { modalEl.hidden = true; document.body.classList.remove('modal-open'); if (last) last.focus(); }
    $('#b-go').addEventListener('click', open);
    modalEl.querySelector('.modal-x').addEventListener('click', close);
    modalEl.addEventListener('click', function (ev) { if (ev.target === modalEl) close(); });
    document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && !modalEl.hidden) close(); });

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var fd = new FormData(form), s = sel(), btn = $('#b-submit');
      var p = { camp: c.slug, package: s.package, addons: s.addons, people: s.people, consent: !!fd.get('consent'), website: fd.get('website') || '' };
      ['full_name', 'email', 'phone', 'country', 'age', 'experience', 'level', 'club', 'notes'].forEach(function (k) { p[k] = (fd.get(k) || '').toString().trim(); });
      btn.disabled = true; msg.className = 'form-msg'; msg.textContent = 'Reserving…';
      H.api.register(p).then(function (r) { done(c, r, p); })
        .catch(function (err) { btn.disabled = false; msg.className = 'form-msg err'; msg.textContent = (err && err.message) || 'Something went wrong. Please try again.'; });
    });
  }

  function done(c, r, p) {
    var m = function (v) { return H.money(v, r.currency); };
    var wait = r.status === 'waitlist';
    var waMsg = 'Hi CHIDAOBA, I just registered for ' + c.title + '. Booking code: ' + r.ref;
    var h = '<p class="label muted"><span class="bar"></span>' + (wait ? 'On the waitlist' : 'Spot reserved') + '</p>' +
      '<h2 class="display h-md">' + (wait ? 'You’re on the waitlist' : 'Almost there, ' + e(p.full_name.split(' ')[0])) + '<span class="dot">.</span></h2>' +
      '<div class="ref"><span class="label muted">Your booking code</span><b>' + e(r.ref) + '</b></div>';
    if (wait) {
      h += '<p class="body">The camp is full right now. If a spot opens, we’ll contact you at ' + e(p.email) + ' or on WhatsApp. First come, first served.</p>';
    } else {
      h += '<div class="b-sum"><div><span>Total</span><b>' + m(r.total) + '</b></div>' + (r.discount ? '<div class="disc"><span>Includes group discount</span><b>−' + m(r.discount) + '</b></div>' : '') +
        '<div class="dep"><span>Deposit (' + r.deposit_pct + '%), pay by ' + e(H.dateRange(r.pay_by)) + '</span><b>' + m(r.deposit) + '</b></div></div>' +
        '<p class="label" style="margin-top:28px">Bank transfer</p><pre class="bank">' + e(r.bank_details || 'We’ll send you payment details shortly.') + '</pre>' +
        '<p class="body">Use <b>' + e(r.ref) + '</b> as the payment reference. Your spot is confirmed once the deposit arrives. The rest is paid before the camp starts.</p>';
    }
    h += '<p class="note">Save or screenshot this page.</p><div class="row-btns"><a class="btn btn-primary" href="' + WA + '?text=' + encodeURIComponent(waMsg) + '" rel="noopener">Send code on WhatsApp <span class="arr">→</span></a>' +
      '<a class="btn btn-ghost" href="/camps/">Back to camps</a></div>';
    $('#b-form').hidden = true; var d = $('#b-done'); d.innerHTML = h; d.hidden = false;
    $('.modal-box').scrollTop = 0;
  }
})();
