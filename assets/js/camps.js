// CHIDAOBA, public camps: list, detail page, booking
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

  // On the Georgian site, use the Georgian text the admin entered (falls back to English).
  var KA = document.documentElement.lang === 'ka';
  function locItem(o) {
    if (Array.isArray(o)) return o.map(locItem);
    if (!o || typeof o !== 'object') return o;
    var r = {};
    Object.keys(o).forEach(function (k) { if (!/_ka$/.test(k)) r[k] = locItem(o[k]); });
    Object.keys(o).forEach(function (k) {
      var m = k.match(/^(.*)_ka$/); if (!m) return;
      var v = o[k]; if (Array.isArray(v) ? v.length : (v != null && String(v).trim() !== '')) r[m[1]] = locItem(v);
    });
    return r;
  }
  function loc(c) {
    if (!KA || !c) return c;
    var r = locItem(c), k = c.ka || {};
    Object.keys(k).forEach(function (f) { var v = k[f]; if (Array.isArray(v) ? v.length : (v != null && String(v).trim() !== '')) r[f] = v; });
    return r;
  }
  function spots(c) {
    if (!c.capacity) return null;
    var left = Math.max(0, c.capacity - (c.taken || 0));
    return { left: left, pct: Math.min(100, Math.round((c.taken || 0) / c.capacity * 100)) };
  }
  function state(c) {
    if (c.status === 'completed') return { key: 'done', label: 'Completed' };
    if (c.status === 'sold_out') return { key: 'full', label: 'Sold out, join waitlist' };
    if (!(c.packages || []).length) return { key: 'soon', label: 'Dates coming soon' };
    if (c.registration_deadline && H.today() > H.d(c.registration_deadline)) return { key: 'closed', label: 'Registration closed' };
    var s = spots(c);
    if (s && s.left === 0) return { key: 'full', label: 'Full, join waitlist' };
    if (s && s.left <= Math.max(3, Math.ceil(c.capacity * 0.2))) return { key: 'few', label: 'Only ' + s.left + ' spot' + (s.left === 1 ? '' : 's') + ' left' };
    return { key: 'open', label: 'Open for requests' };
  }

  // ================= LIST =================
  function card(c) {
    var st = state(c), s = spots(c), from = H.fromPrice(c), early = H.isEarly(c);
    var n = H.days(c.start_date, c.end_date);
    var cv = H.cover(c), v = H.venue(c);
    return '<a class="camp-card st-' + st.key + (c.featured ? ' featured' : '') + (cv ? ' has-img' : '') + '" href="/camps/camp/?c=' + encodeURIComponent(c.slug) + '">' +
      (cv ? '<div class="cc-img"><img src="' + e(cv.thumb) + '" alt="' + e(cv.alt || '') + '" loading="lazy"></div>' : '') + '<div class="cc-body">' +
      '<div class="cc-top"><span class="label">' + e(H.DISC[c.discipline] || '') + '</span><span class="cc-status">' + e(st.label) + '</span></div>' +
      '<h3>' + e(c.title) + '</h3>' +
      '<dl class="cc-meta"><div><dt>Dates</dt><dd>' + e((c.start_date ? H.dateRange(c.start_date, c.end_date) : (c.dates_note || H.dateRange()))) + (n ? ' · ' + n + ' days' : '') + '</dd></div>' +
      '<div><dt>Where</dt><dd>' + e([c.city, c.country].filter(Boolean).join(', ') || 'TBA') + '</dd></div>' +
      (c.level ? '<div><dt>Level</dt><dd>' + e(c.level) + '</dd></div>' : '') + '</dl>' +
      (c.summary ? '<p class="cc-sum">' + e(c.summary) + '</p>' : '') +
      '<div class="cc-foot"><div class="cc-price">' + (from != null ? '<span>From</span><b>' + H.money(from, c.currency) + '</b>' + (early ? '<em>Early-bird</em>' : '') : '<b>Price TBA</b>') + '</div>' +
      (s && c.status !== 'completed' ? '<div class="cc-spots"><span>' + (s.left ? s.left + ' of ' + c.capacity + ' spots left' : 'Waitlist open') + '</span><i><b style="width:' + s.pct + '%"></b></i></div>' : '') +
      '<span class="cc-cta">' + (st.key === 'open' || st.key === 'few' ? 'See camp &amp; request' : 'View camp') + ' <span class="arr">→</span></span></div></div></a>';
  }
  // home page: next camps, if any are published
  var hc = $('#home-camps');
  if (hc) H.api.listCamps().then(function (c) {
    var up = (c || []).map(loc).filter(function (x) { return x.status !== 'completed'; }).slice(0, 3);
    if (!up.length) return;
    hc.innerHTML = up.map(card).join(''); hc.hidden = false;
    var soon = $('#home-camps-soon'); if (soon) soon.hidden = true;
  }).catch(function () { });
  var list = $('#camp-list');
  if (list) {
    var tabs = document.querySelectorAll('.disc-tabs button');
    var all = [];
    function render(filter) {
      var items = all.filter(function (c) { return !filter || filter === 'all' || c.discipline === filter; });
      var up = items.filter(function (c) { return c.status !== 'completed'; });
      var past = items.filter(function (c) { return c.status === 'completed'; });
      if (!items.length) {
        list.innerHTML = '<div class="camp-empty">' +
          '<h3 class="display h-md">' + (all.length ? 'No camps in this discipline yet' : 'The first camps are being planned') + '<span class="dot">.</span></h3>' +
          '<p class="body soft">New dates are published here first. Message us and we’ll tell you as soon as registration opens.</p>' +
          '<div class="row-btns"><a class="btn btn-primary" href="' + WA + '?text=' + encodeURIComponent('Hi CHIDAOBA, please tell me when camps open.') + '" rel="noopener">Notify me on WhatsApp <span class="arr">→</span></a>' +
          '<a class="btn btn-ghost" href="https://wa.me/995595606670?text=' + encodeURIComponent(KA ? 'გამარჯობა CHIDAOBA! მაინტერესებს გუნდის ბანაკი.' : 'Hi CHIDAOBA! I would like to ask about a team camp.') + '" rel="noopener">Ask about a team camp on WhatsApp</a></div></div>';
        return;
      }
      list.innerHTML = up.map(card).join('') + (past.length ? '<p class="label muted past-label">Past camps</p>' + past.map(card).join('') : '');
    }
    list.innerHTML = '<p class="body soft loading">Loading camps…</p>';
    function counts() {
      document.querySelectorAll('[data-n]').forEach(function (el) {
        var k = el.dataset.n, n = all.filter(function (c) { return c.status !== 'completed' && (c.packages || []).length && (k === 'all' || c.discipline === k); }).length;
        el.textContent = n ? n + ' camp' + (n === 1 ? '' : 's') + ' open' : 'Coming soon';
      });
    }
    var start = new URLSearchParams(location.search).get('sport');
    function pick(k) {
      tabs.forEach(function (x) { x.setAttribute('aria-pressed', x.dataset.f === k ? 'true' : 'false'); });
      render(k);
    }
    H.api.listCamps().then(function (c) { all = (c || []).map(loc); counts(); pick(start && document.querySelector('.disc-tabs [data-f="' + start + '"]') ? start : 'all'); })
      .catch(function () { list.innerHTML = '<p class="body soft">Camps could not be loaded. Please refresh, or message us on WhatsApp.</p>'; });
    tabs.forEach(function (t) {
      t.addEventListener('click', function () {
        pick(t.dataset.f);
        try { history.replaceState(null, '', t.dataset.f === 'all' ? location.pathname : '?sport=' + t.dataset.f); } catch (x) { }
        var top = list.getBoundingClientRect().top + window.scrollY - 140;
        if (window.scrollY < top - 200 || window.scrollY > top + 200) window.scrollTo({ top: top, behavior: 'smooth' });
      });
    });
  }


  // ================= COACHES (camps page + camp page) =================
  function coachIni(k) { return (k.name || '?').replace(/[\[\]]/g, '').split(/\s+/).map(function (w) { return w[0] || ''; }).join('').slice(0, 2).toUpperCase(); }
  function coachTitles(k) { return Array.isArray(k.titles) ? k.titles : String(k.titles || '').split('\n').filter(Boolean); }
  function coachCard(k, i) {
    return '<button type="button" class="co-card" data-co="' + i + '">' +
      (k.photo ? '<img class="co-ph" src="' + e(k.photo) + '" alt="" loading="lazy">' : '<span class="co-ph co-ini" aria-hidden="true">' + e(coachIni(k)) + '</span>') +
      '<span class="co-txt"><b>' + e(k.name) + '</b>' + (k.role ? '<span>' + e(k.role) + '</span>' : '') +
      (k.sport ? '<em>' + e(k.sport) + '</em>' : '') + '</span><span class="co-more" aria-hidden="true">+</span></button>';
  }
  var coDlg = null;
  function openCoach(k) {
    if (!coDlg) {
      coDlg = document.createElement('dialog'); coDlg.className = 'co-dlg';
      coDlg.addEventListener('click', function (ev) { if (ev.target === coDlg || ev.target.closest('.co-x')) coDlg.close(); });
      document.body.appendChild(coDlg);
    }
    var t = coachTitles(k);
    coDlg.setAttribute('aria-label', k.name || 'Coach');
    coDlg.innerHTML = '<div class="co-dlg-in"><button type="button" class="co-x" aria-label="Close">×</button>' +
      '<div class="co-dlg-top">' + (k.photo ? '<img class="co-dlg-ph" src="' + e(k.photo) + '" alt="' + e(k.name) + '">' : '<span class="co-dlg-ph co-ini" aria-hidden="true">' + e(coachIni(k)) + '</span>') +
      '<div><h3>' + e(k.name) + '</h3>' + (k.role ? '<p class="co-role">' + e(k.role) + '</p>' : '') + (k.sport ? '<p class="co-sport">' + e(k.sport) + '</p>' : '') + '</div></div>' +
      (t.length ? '<h4>Titles and achievements</h4><ul class="coach-t">' + t.map(function (x) { return '<li>' + e(x) + '</li>'; }).join('') + '</ul>' : '') +
      (k.bio ? '<p class="co-bio">' + e(k.bio) + '</p>' : '') +
      ((k.camps || []).length ? '<h4>Coaching at</h4><ul class="co-camps">' + k.camps.map(function (c) { return '<li><a href="/camps/camp/?c=' + encodeURIComponent(c.slug) + '">' + e(c.title) + '</a></li>'; }).join('') + '</ul>' : '') +
      '</div>';
    if (coDlg.showModal) coDlg.showModal(); else coDlg.setAttribute('open', '');
  }
  function wireCoaches(scope, items) {
    scope.querySelectorAll('[data-co]').forEach(function (b) { b.addEventListener('click', function () { openCoach(items[+b.dataset.co]); }); });
  }
  var coList = $('#coach-list');
  if (coList) {
    var coAll = [], coTabs = document.querySelectorAll('.co-tabs button');
    function coRender(f) {
      var items = coAll.filter(function (k) { return f === 'all' || k.discs.indexOf(f) >= 0; });
      coTabs.forEach(function (x) { x.setAttribute('aria-pressed', x.dataset.f === f ? 'true' : 'false'); });
      if (!items.length) {
        coList.innerHTML = '<div class="co-empty"><span class="co-ph co-ini" aria-hidden="true">?</span><div><b>' + (coAll.length ? 'No coaches for this sport yet' : 'Coaches will be announced soon') + '</b>' +
          '<p>We are confirming the coaches for the spring 2027 camps. Their profiles will appear here.</p></div></div>';
        return;
      }
      coList.innerHTML = items.map(coachCard).join('');
      wireCoaches(coList, items);
    }
    H.api.listCamps().then(function (cs) {
      var by = {};
      (cs || []).map(loc).filter(function (c) { return c.status !== 'completed'; }).forEach(function (c) {
        (c.coaches || []).forEach(function (k) {
          if (!k.name) return;
          var id = k.name.trim().toLowerCase();
          var o = by[id] || (by[id] = Object.assign({}, k, { discs: [], camps: [], sport: '' }));
          if (o.discs.indexOf(c.discipline) < 0) o.discs.push(c.discipline);
          o.camps.push({ slug: c.slug, title: c.title });
          if (!o.photo && k.photo) o.photo = k.photo;
        });
      });
      coAll = Object.keys(by).map(function (id) { var o = by[id]; o.sport = o.discs.map(function (d) { return H.DISC[d] || d; }).join(', '); return o; });
      coRender('all');
    }).catch(function () { coRender('all'); });
    coTabs.forEach(function (t) { t.addEventListener('click', function () { coRender(t.dataset.f); }); });
  }

  // ================= VENUES (list + page) =================
  var vlist = $('#venue-list'), V_ALL = window.CHD_VENUES || {};
  if (vlist) {
    vlist.innerHTML = Object.keys(V_ALL).map(function (k) {
      var v = V_ALL[k];
      return '<a class="venue-card" href="/camps/venue/?v=' + encodeURIComponent(k) + '"><div class="vc-img"><img src="' + e(v.cover.url) + '" alt="' + e(v.cover.alt) + '" loading="lazy"></div>' +
        '<div class="vc-body"><h3>' + e(v.name) + '</h3><p class="vc-place">' + e(v.place) + '</p><p>' + e(v.intro) + '</p>' +
        '<div class="vc-facts">' + v.facts.map(function (f) { return '<span><b>' + e(f[0]) + '</b> ' + e(f[1]) + '</span>'; }).join('') + '</div>' +
        '<span class="cc-cta">See the venue <span class="arr">→</span></span></div></a>';
    }).join('');
  }
  var vroot = $('#venue-root');
  if (vroot) {
    var vk = new URLSearchParams(location.search).get('v'), V1 = V_ALL[vk];
    if (!V1) { vroot.innerHTML = '<section class="page-hero dark"><div class="wrap"><h1 class="display h-lg">Venue not found</h1><div style="margin-top:28px"><a class="btn btn-primary" href="/camps/">All camps <span class="arr">→</span></a></div></div></section>'; }
    else {
      document.title = V1.name + ', ' + V1.place + ' | CHIDAOBA';
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
  H.api.getCamp(slug).then(function (c) { if (!c) return notFound(); renderCamp(loc(c)); })
    .catch(function () { root.innerHTML = '<div class="wrap section"><p class="body">This camp could not be loaded. Please refresh.</p></div>'; });

  function notFound() {
    root.innerHTML = '<section class="page-hero dark"><div class="wrap">' +
      '<h1 class="display h-lg" style="margin-top:24px">Camp not found<span class="dot">.</span></h1><p class="lead soft">It may have ended or moved.</p>' +
      '<div style="margin-top:32px"><a class="btn btn-primary" href="/camps/">All camps <span class="arr">→</span></a></div></div></section>';
  }

  function paras(t) { return (t || '').split(/\n\s*\n/).map(function (p) { return '<p>' + e(p).replace(/\n/g, '<br>') + '</p>'; }).join(''); }

  function renderCamp(c) {
    document.title = c.title + ' | CHIDAOBA';
    var st = state(c), s = spots(c), n = H.days(c.start_date, c.end_date), early = H.isEarly(c);
    var canBook = c.status === 'published' && st.key !== 'closed';
    var sched = (c.schedule || []).filter(function (d) { return d && (d.day || (d.items || []).length); });
    var html = '';
    var cv = H.cover(c), V = H.venue(c);
    html += '<section class="camp-hero dark' + (cv ? ' has-img' : '') + '">' + (cv ? '<img class="camp-hero-img" src="' + e(cv.url) + '" alt="' + e(cv.alt || '') + '">' : '') + '<div class="wrap">' +
      '<a class="back label muted" href="/camps/">← All camps</a>' +
      '<h1 class="display h-lg">' + e(c.title) + '</h1>' +
      '<div class="facts-row">' +
      fact('Dates', (c.start_date ? H.dateRange(c.start_date, c.end_date) : (c.dates_note || H.dateRange()))) + (n ? fact('Duration', n + ' days') : '') +
      fact('Where', [c.venue, c.city, c.country].filter(Boolean).join(', ') || 'TBA') + (c.level ? fact('Level', c.level) : '') +
      (s ? fact('Spots', s.left ? s.left + ' of ' + c.capacity + ' left' : 'Full (waitlist open)') : '') +
      '</div><div class="hero-row"><span class="cc-status hero-status st-' + st.key + '">' + e(st.label) + '</span>' + shareHtml() + '</div>' + (canBook ? urgency(c, s) : '') + '</div></section>';

    html += '<section class="section light camp-body"><div class="wrap camp-grid"><div class="camp-main">';
    if (c.summary) html += '<p class="lead">' + e(c.summary) + '</p>';
    if (c.description) html += '<div class="prose camp-desc">' + paras(c.description) + '</div>';
    html += fitHtml(c);
    var gal = (c.gallery || []).map(function (g) { return { url: g.url, thumb: g.url, alt: g.alt || c.title }; }).concat(V ? V.gallery : []);
    if (V || c.address || c.venue_info || gal.length) {
      html += block('Where you’ll train &amp; stay', venueHtml(V, c, gal));
      galleryData = gal;
    }
    if ((c.packages || []).length) {
      var feats = [];
      c.packages.forEach(function (p) { (p.features || []).forEach(function (f) { if (feats.indexOf(f) < 0) feats.push(f); }); });
      var price = function (p) { var ep = early && p.early_price !== '' && p.early_price != null; return (ep ? '<s>' + H.money(p.price, c.currency) + '</s>' : '') + '<b>' + H.money(ep ? p.early_price : p.price, c.currency) + '</b>'; };
      var body = feats.length
        ? '<div class="cmp-wrap"><table class="cmp"><thead><tr><th></th>' + c.packages.map(function (p) { return '<th><span>' + e(p.name) + '</span><div class="cmp-p">' + price(p) + '</div></th>'; }).join('') + '</tr></thead><tbody>' +
          feats.map(function (f) { return '<tr><td>' + e(f) + '</td>' + c.packages.map(function (p) { var y = (p.features || []).indexOf(f) >= 0; return '<td class="' + (y ? 'y' : 'n') + '">' + (y ? '<i aria-label="Included">✓</i>' : '<i aria-label="Not included">–</i>') + '</td>'; }).join('') + '</tr>'; }).join('') +
          (c.packages.some(function (p) { return p.description; }) ? '<tr class="cmp-d"><td></td>' + c.packages.map(function (p) { return '<td>' + e(p.description || '') + '</td>'; }).join('') + '</tr>' : '') +
          '</tbody></table></div>'
        : '<div class="pkg-list">' + c.packages.map(function (p) {
            return '<div class="pkg-row"><div><b>' + e(p.name) + '</b>' + (p.description ? '<span>' + e(p.description) + '</span>' : '') + '</div><div class="pkg-p">' + price(p) + '</div></div>';
          }).join('') + '</div>';
      html += block('Packages', body + (early ? '<p class="note">Early-bird prices until ' + e(H.dateRange(c.early_bird_deadline)) + '.</p>' : '') +
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
    var coItems = (c.coaches || []).filter(function (k) { return k.name; });
    if (coItems.length) {
      html += block('Coaches', '<div class="co-grid">' + coItems.map(coachCard).join('') + '</div>');
    } else if (c.status !== 'completed') {
      html += block('Coaches', '<div class="co-empty"><span class="co-ph co-ini" aria-hidden="true">?</span><div><b>Coaches will be announced soon</b><p>We are confirming the coaches for this camp. Their profiles will appear here.</p></div></div>');
    }
    if ((c.bring || []).length) {
      var SHOP = window.CHD_SHOP || {};
      html += block('What to bring', '<ul class="bring">' + c.bring.map(function (b) {
        var sp = b.shop && SHOP[b.shop];
        return '<li><i aria-hidden="true"></i><span>' + e(b.item) + '</span>' + (sp ? '<a href="/shop/#' + e(b.shop) + '">Get it in our shop <span class="arr">→</span></a>' : '') + '</li>';
      }).join('') + '</ul>');
    }
    if ((c.reviews || []).length) {
      html += block('What people say', '<div class="reviews">' + c.reviews.map(function (r) {
        var n = Math.max(0, Math.min(5, +r.rating || 0));
        return '<figure class="review">' + (n ? '<div class="stars" aria-label="' + n + ' out of 5">' + '★★★★★'.slice(0, n) + '<span>' + '★★★★★'.slice(n) + '</span></div>' : '') +
          '<blockquote>' + e(r.text) + '</blockquote><figcaption><b>' + e(r.name) + '</b>' + (r.from ? '<span>' + e(r.from) + '</span>' : '') + '</figcaption></figure>';
      }).join('') + '</div>');
    }
    if (c.status !== 'completed') html += block('Before you go', '<a class="prep-card prep-card-s" href="' + (KA ? '/ka' : '') + '/camps/prepare/"><div><p class="body">Steps from request to arrival, waivers to print and a packing list.</p></div><span class="btn btn-primary">See the steps</span></a>');
    if ((c.faq || []).length) html += block('Questions', '<div class="faq">' + c.faq.map(function (f) { return '<details><summary>' + e(f.q) + '</summary><p>' + e(f.a) + '</p></details>'; }).join('') + '</div>');
    html += '</div>';

    // booking panel
    html += '<aside class="book" id="book"><div class="book-in dark">';
    if (canBook && (c.packages || []).length) {
      html += '<h3 class="book-h">' + (st.key === 'full' ? 'Join the waitlist' : 'Request a spot') + '</h3>' +
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
        urgency(c, s) +
        '<div class="b-sum" id="b-sum"></div>' +
        '<button class="btn btn-primary b-go" type="button" id="b-go">' + (st.key === 'full' ? 'Join waitlist' : 'Request a spot') + ' <span class="arr">→</span></button>' +
        '<p class="note">Free and takes a minute. No payment now. ' + (st.key === 'full' ? 'We’ll contact you if a spot opens.' : 'We confirm your spot on WhatsApp or email within 24 hours.') + '</p>';
    } else {
      if (canBook) {
        html += '<h3 class="book-h">Dates and prices coming soon</h3><p class="body">Leave your email and we will tell you first when registration opens.</p>' +
          '<a class="btn btn-primary" href="#notify">Notify me</a>';
      } else {
      html += '<h3 class="book-h">' + e(st.label) + '</h3><p class="body">' +
        (c.status === 'completed' ? 'This camp has finished. See upcoming camps.' : 'Registration is not open for this camp right now.') + '</p>' +
        '<a class="btn btn-primary" href="/camps/">Upcoming camps <span class="arr">→</span></a>';
      }
    }
    if (c.start_date && c.status !== 'completed') html += calHtml(c);
    html += '<a class="book-wa" href="' + WA + '?text=' + encodeURIComponent('Hi CHIDAOBA, a question about ' + c.title + ': ') + '" rel="noopener">Questions? WhatsApp us</a></div></aside>';
    html += '</div></section>';
    if (canBook && (c.packages || []).length) html += '<div class="book-bar dark" id="book-bar"><div><span>From</span><b>' + H.money(H.fromPrice(c), c.currency) + '</b></div><a class="btn btn-primary" href="#book">' + (st.key === 'full' ? 'Join waitlist' : 'Request a spot') + '</a></div>';
    html += modal(c, st);
    root.innerHTML = html;
    // structured data for Google, once a camp has real dates
    if (c.start_date) {
      var V2 = H.venue(c), from2 = H.fromPrice(c), cv2 = H.cover(c);
      var ev = { '@context': 'https://schema.org', '@type': 'Event', name: c.title, description: c.summary || undefined,
        startDate: c.start_date, endDate: c.end_date || c.start_date,
        eventStatus: c.status === 'cancelled' ? 'https://schema.org/EventCancelled' : 'https://schema.org/EventScheduled',
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        location: { '@type': 'Place', name: c.venue || (V2 && V2.name) || c.city || 'Georgia', address: { '@type': 'PostalAddress', addressLocality: c.city || undefined, addressCountry: 'GE', streetAddress: c.address || (V2 && V2.address) || undefined } },
        image: cv2 ? [new URL(cv2.url, location.origin).href] : undefined,
        organizer: { '@type': 'Organization', name: 'CHIDAOBA', url: 'https://chidaoba.com/' } };
      if (from2 != null) ev.offers = { '@type': 'Offer', price: from2, priceCurrency: c.currency, url: location.href, availability: st.key === 'full' ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock' };
      var ld = document.createElement('script'); ld.type = 'application/ld+json'; ld.textContent = JSON.stringify(ev); document.head.appendChild(ld);
    }
    var md = document.querySelector('meta[name="description"]'); if (md && c.summary) md.setAttribute('content', c.summary);

    wireMedia(root);
    wireCoaches(root, coItems);
    wireShare(root, c);
    var ib = root.querySelector('.cal-ics'); if (ib) ib.addEventListener('click', function () { icsDownload(c); });
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
  var INT = ['', 'Light', 'Moderate', 'Hard', 'Very hard', 'Competition level'];
  function fitHtml(c) {
    var ages = c.age_min && c.age_max ? c.age_min + '–' + c.age_max : c.age_min ? c.age_min + '+' : c.age_max ? 'Up to ' + c.age_max : '';
    var fit = c.fit_for || [];
    if (!c.level && !c.intensity && !ages && !fit.length) return '';
    var n = +c.intensity || 0;
    return block('Is this camp for you?', '<div class="fit">' +
      '<div class="fit-facts">' + (c.level ? '<div><span class="label muted">Level</span><b>' + e(c.level) + '</b></div>' : '') +
      (n ? '<div><span class="label muted">Intensity</span><b>' + e(INT[n]) + '</b><span class="meter" aria-label="' + n + ' of 5">' + [1, 2, 3, 4, 5].map(function (i) { return '<i class="' + (i <= n ? 'on' : '') + '"></i>'; }).join('') + '</span></div>' : '') +
      (ages ? '<div><span class="label muted">Age</span><b>' + e(ages) + '</b></div>' : '') + '</div>' +
      (fit.length ? '<div class="fit-list"><h3>Good for you if</h3><ul>' + fit.map(function (t) { return '<li><i>✓</i>' + e(t) + '</li>'; }).join('') + '</ul></div>' : '') + '</div>');
  }
  function urgency(c, s) {
    if (c.show_urgency === false) return '';
    var out = [], t = H.today();
    if (H.isEarly(c) && c.early_bird_deadline) {
      var d = Math.ceil((H.d(c.early_bird_deadline) - t) / 864e5);
      if (d >= 0) out.push(d === 0 ? 'Early-bird price ends today' : d === 1 ? 'Early-bird price ends tomorrow' : 'Early-bird price ends in ' + d + ' days');
    }
    if (s && s.left > 0 && s.left <= Math.max(5, Math.ceil(c.capacity * 0.25))) out.push(s.left === 1 ? 'Only 1 spot left' : 'Only ' + s.left + ' spots left');
    return out.length ? '<div class="urg">' + out.map(function (x) { return '<span><i></i>' + x + '</span>'; }).join('') + '</div>' : '';
  }
  function ymd(dt) { return dt.getFullYear() + String(dt.getMonth() + 1).padStart(2, '0') + String(dt.getDate()).padStart(2, '0'); }
  function calHtml(c) {
    var a = H.d(c.start_date), b = H.d(c.end_date || c.start_date); if (!a) return '';
    var end = new Date(b.getTime() + 864e5), where = [c.venue, c.city, c.country].filter(Boolean).join(', ');
    var url = location.origin + location.pathname + location.search;
    var g = 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent(c.title) + '&dates=' + ymd(a) + '/' + ymd(end) +
      '&details=' + encodeURIComponent((c.summary ? c.summary + '\n\n' : '') + url) + '&location=' + encodeURIComponent(where);
    return '<details class="cal"><summary>Add to calendar</summary><div><a href="' + g + '" target="_blank" rel="noopener">Google Calendar</a><button type="button" class="cal-ics">Apple / Outlook (.ics)</button></div></details>';
  }
  function icsDownload(c) {
    var a = H.d(c.start_date), b = H.d(c.end_date || c.start_date), end = new Date(b.getTime() + 864e5);
    var esc = function (t) { return String(t || '').replace(/[\\,;]/g, '\\$&').replace(/\n/g, '\\n'); };
    var ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//CHIDAOBA//Camps//EN', 'BEGIN:VEVENT', 'UID:' + (c.id || c.slug) + '@chidaoba.com',
      'DTSTAMP:' + new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z', 'DTSTART;VALUE=DATE:' + ymd(a), 'DTEND;VALUE=DATE:' + ymd(end),
      'SUMMARY:' + esc(c.title), 'LOCATION:' + esc([c.venue, c.city, c.country].filter(Boolean).join(', ')),
      'DESCRIPTION:' + esc((c.summary || '') + '\n' + location.href), 'URL:' + location.href, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    var l = document.createElement('a'); l.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' })); l.download = (c.slug || 'camp') + '.ics';
    document.body.appendChild(l); l.click(); l.remove();
  }
  function fact(k, v) { return '<div><span class="label muted">' + k + '</span><b>' + e(v) + '</b></div>'; }
  function wvPdf(k) { return '/assets/docs/chidaoba-waiver-' + k + (KA ? '-ka' : '') + '.pdf'; }
  // ---------- share a camp: native share on phones, otherwise copy and apps ----------
  function shareHtml() {
    return '<div class="share"><button type="button" class="share-btn" aria-expanded="false" aria-controls="share-pop"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M7 8l5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>Share</button>' +
      '<div class="share-pop" id="share-pop" hidden><button type="button" class="share-copy">Copy link</button>' +
      '<a class="share-wa" target="_blank" rel="noopener">WhatsApp</a><a class="share-tg" target="_blank" rel="noopener">Telegram</a>' +
      '<a class="share-fb" target="_blank" rel="noopener">Facebook</a><a class="share-mail">Email</a></div></div>';
  }
  function wireShare(root, c) {
    var box = root.querySelector('.share'); if (!box) return;
    var url = location.origin + location.pathname + '?c=' + encodeURIComponent(c.slug);
    var when = c.start_date ? H.dateRange(c.start_date, c.end_date) : (c.dates_note || '');
    var msg = c.title + (when && c.title.indexOf(when) < 0 ? ' · ' + when : '');
    var btn = box.querySelector('.share-btn'), pop = box.querySelector('.share-pop'), cp = box.querySelector('.share-copy');
    box.querySelector('.share-wa').href = 'https://wa.me/?text=' + encodeURIComponent(msg + '\n' + url);
    box.querySelector('.share-tg').href = 'https://t.me/share/url?url=' + encodeURIComponent(url) + '&text=' + encodeURIComponent(msg);
    box.querySelector('.share-fb').href = 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url);
    box.querySelector('.share-mail').href = 'mailto:?subject=' + encodeURIComponent(msg) + '&body=' + encodeURIComponent(url);
    function toggle(open) { pop.hidden = !open; btn.setAttribute('aria-expanded', open ? 'true' : 'false'); }
    btn.addEventListener('click', function () {
      if (navigator.share && matchMedia('(pointer:coarse)').matches) {
        navigator.share({ title: c.title, text: msg, url: url }).catch(function () { });
        if (window.CHD_TRACK) window.CHD_TRACK('camp', 'share ' + c.slug);
        return;
      }
      toggle(pop.hidden);
    });
    cp.addEventListener('click', function () {
      var done = function () { cp.textContent = KA ? 'ბმული დაკოპირდა' : 'Link copied'; setTimeout(function () { cp.textContent = KA ? 'ბმულის კოპირება' : 'Copy link'; }, 2000); };
      if (navigator.clipboard) navigator.clipboard.writeText(url).then(done, function () { prompt('Copy', url); });
      else { prompt('Copy', url); }
      if (window.CHD_TRACK) window.CHD_TRACK('camp', 'copy ' + c.slug);
    });
    document.addEventListener('click', function (ev) { if (!box.contains(ev.target)) toggle(false); });
    document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') toggle(false); });
  }
  function block(t, inner) { return '<div class="camp-block reveal in"><h2 class="display h-md">' + t + '<span class="dot">.</span></h2>' + inner + '</div>'; }

  function modal(c, st) {
    return '<div class="modal" id="b-modal" hidden role="dialog" aria-modal="true" aria-labelledby="b-title"><div class="modal-box dark">' +
      '<button class="modal-x" type="button" aria-label="Close">×</button>' +
      '<form id="b-form" novalidate><h3 class="book-h">' + e(c.title) + '</h3>' +
      '<h2 id="b-title" class="display h-md">' + (st.key === 'full' ? 'Join the waitlist' : 'Send your request') + '<span class="dot">.</span></h2>' +
      '<div class="b-recap" id="b-recap"></div>' +
      '<div class="b-fields">' +
      f('full_name', 'Full name', 'text', true, 'name') + f('email', 'Email', 'email', true, 'email') +
      f('phone', 'Phone / WhatsApp', 'tel', true, 'tel') + f('country', 'Country', 'text', true, 'country-name') +
      '<div class="field"><label for="b-experience">Experience</label><select id="b-experience" name="experience" required><option value="">Select…</option><option>Beginner</option><option>Under 1 year</option><option>1 to 3 years</option><option>3 to 5 years</option><option>5+ years</option><option>Competitive athlete</option><option>Coach</option></select></div>' +
      f('age', 'Age', 'number', false) + f('level', 'Belt / level', 'text', false) +
      '<div class="field full"><label for="b-notes">Message <em>optional</em></label><textarea id="b-notes" name="notes" placeholder="Questions, people in your group, dietary needs…"></textarea></div>' +
      '<input type="text" name="website" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">' +
      '<label class="consent"><input type="checkbox" name="consent" required><span>I agree that CHIDAOBA stores these details to organise this camp and contact me, as described in the <a href="/privacy/" target="_blank">privacy notice</a>.</span></label>' +
      '</div><div class="form-foot"><button class="btn btn-primary" type="submit" id="b-submit">' + (st.key === 'full' ? 'Join waitlist' : 'Send request') + ' <span class="arr">→</span></button><p class="form-msg" aria-live="polite"></p></div></form>' +
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
      rows += '<div class="tot"><span>Estimated total</span><b>' + m(q.total) + '</b></div>';
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
      ['full_name', 'email', 'phone', 'country', 'age', 'experience', 'level', 'notes'].forEach(function (k) { p[k] = (fd.get(k) || '').toString().trim(); });
      btn.disabled = true; msg.className = 'form-msg'; msg.textContent = 'Sending…';
      H.api.register(p).then(function (r) { if (window.CHD_TRACK) window.CHD_TRACK('camp', c.slug); done(c, r, p); })
        .catch(function (err) { btn.disabled = false; msg.className = 'form-msg err'; msg.textContent = (err && err.message) || 'Something went wrong. Please try again.'; });
    });
  }

  function done(c, r, p) {
    var m = function (v) { return H.money(v, r.currency); };
    var wait = r.status === 'waitlist';
    var waMsg = 'Hi CHIDAOBA, I just sent a request for ' + c.title + '. My code: ' + r.ref;
    var h = '<h3 class="book-h">' + (wait ? 'On the waitlist' : 'Request sent') + '</h3>' +
      '<h2 class="display h-md">' + (wait ? 'You’re on the waitlist' : 'Thank you, ' + e(p.full_name.split(' ')[0])) + '<span class="dot">.</span></h2>' +
      (wait ? '<p class="body">The camp is full right now. If a spot opens, we’ll contact you at ' + e(p.email) + ' or on WhatsApp. First come, first served.</p>'
            : '<p class="body">We got your request for <b>' + e(c.title) + '</b>. We’ll contact you within 24 hours on WhatsApp or at ' + e(p.email) + ' to confirm your spot and the details.</p>') +
      '<div class="ref"><span class="label muted">Your request code</span><b>' + e(r.ref) + '</b></div>' +
      (r.total ? '<div class="b-sum"><div class="tot"><span>Estimated total</span><b>' + m(r.total) + '</b></div></div>' : '') +
      '<p class="note">Want a faster reply? Send us your code on WhatsApp.</p><div class="row-btns"><a class="btn btn-primary" href="' + WA + '?text=' + encodeURIComponent(waMsg) + '" rel="noopener">Message us on WhatsApp <span class="arr">→</span></a>' +
      '<a class="btn btn-ghost" href="/camps/">Back to camps</a></div>';
    $('#b-form').hidden = true; var d = $('#b-done'); d.innerHTML = h; d.hidden = false;
    $('.modal-box').scrollTop = 0;
  }
})();
