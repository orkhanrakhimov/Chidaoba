// CHIDAOBA, site behaviours
(function () {
  var body = document.body;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var EMAIL = 'chidaobaculture@gmail.com';

  // ---------- mobile menu ----------
  var burger = document.querySelector('.burger');
  if (burger) {
    burger.addEventListener('click', function () {
      var open = body.classList.toggle('menu-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && body.classList.contains('menu-open')) {
        body.classList.remove('menu-open'); burger.setAttribute('aria-expanded', 'false'); burger.focus();
      }
    });
  }
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  // ---------- load reveal ----------
  requestAnimationFrame(function () { body.classList.add('loaded'); });

  // ---------- word scrub (split into words) ----------
  var scrubs = [].slice.call(document.querySelectorAll('.scrub'));
  scrubs.forEach(function (el) {
    var text = el.textContent.trim();
    el.setAttribute('aria-label', text);
    el.innerHTML = text.split(/\s+/).map(function (w) { return '<span class="w" aria-hidden="true">' + w + '</span>'; }).join(' ');
  });

  // ---------- reveal / stagger / counters ----------
  function count(scope) {
    scope.querySelectorAll('[data-count]').forEach(function (el) {
      var end = +el.dataset.count, pre = el.dataset.pre || '', start = +(el.dataset.from || 0);
      if (reduce) { el.textContent = pre + end; return; }
      var t0 = null;
      function step(t) { if (!t0) t0 = t; var p = Math.min(1, (t - t0) / 1400); p = 1 - Math.pow(1 - p, 3);
        el.textContent = pre + Math.round(start + (end - start) * p); if (p < 1) requestAnimationFrame(step); }
      requestAnimationFrame(step);
    });
  }
  var watch = document.querySelectorAll('.reveal, .stagger, .disc');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); count(e.target); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -10% 0px' });
    watch.forEach(function (el) { io.observe(el); });
  } else {
    watch.forEach(function (el) { el.classList.add('in'); count(el); });
  }

  // ---------- scroll-linked: scrub words, parallax ----------
  var pars = [].slice.call(document.querySelectorAll('[data-par]'));
  var ghost = document.querySelector('.ghost-word'), why = document.querySelector('.why-word');
  if (reduce) {
    document.querySelectorAll('.scrub .w').forEach(function (w) { w.classList.add('on'); });
  } else {
    var ticking = false;
    var frame = function () {
      ticking = false;
      var vh = window.innerHeight;
      scrubs.forEach(function (el) {
        var r = el.getBoundingClientRect();
        var p = Math.max(0, Math.min(1, (vh * 0.82 - r.top) / (r.height + vh * 0.3)));
        var ws = el.children, n = Math.round(p * ws.length);
        for (var i = 0; i < ws.length; i++) ws[i].classList.toggle('on', i < n);
      });
      pars.forEach(function (im) {
        var r3 = im.parentNode.getBoundingClientRect();
        if (r3.bottom < 0 || r3.top > vh) return;
        im.style.transform = 'translateY(' + (((r3.top + r3.height / 2) - vh / 2) / vh * -10) + '%)';
      });
      if (ghost) ghost.style.transform = 'translateY(' + (window.scrollY * 0.18) + 'px)';
      if (why) {
        var r2 = why.getBoundingClientRect();
        why.style.transform = 'translateX(' + ((0.5 - (vh - r2.top) / (vh + r2.height)) * 30) + '%)';
      }
    };
    var onScroll = function () { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    frame();
  }

  // ---------- culture chapters (if present) ----------
  var links = document.querySelectorAll('.chapters a');
  if (links.length && 'IntersectionObserver' in window) {
    var map = {};
    links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) { a.classList.remove('on'); });
        var a = map[en.target.id]; if (a) { a.classList.add('on'); a.parentNode.scrollTo({ left: a.offsetLeft - 40, behavior: 'smooth' }); }
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    Object.keys(map).forEach(function (id) { var el = document.getElementById(id); if (el) cio.observe(el); });
  }

  // ---------- forms: saved in our database; if that is not possible, open the visitor's email app ----------
  var CFG = window.CHD_CONFIG || {};
  var KA = document.documentElement.lang === 'ka';
  var TT = function (en, ka) { return KA ? ka : en; };
  var KA_ERR = { 'Please fill in your name.': 'შეიყვანეთ სახელი.', 'Please enter your WhatsApp number with the country code.': 'შეიყვანეთ WhatsApp-ის ნომერი ქვეყნის კოდით.', 'Please enter a valid email address.': 'შეიყვანეთ სწორი ელფოსტა.', 'Please accept the privacy notice.': 'დაეთანხმეთ კონფიდენციალურობის პოლიტიკას.',
    'Please fill in your name and message.': 'შეავსეთ სახელი და შეტყობინება.', 'Too many messages. Please try again later or write to us on WhatsApp.': 'ძალიან ბევრი შეტყობინებაა. სცადეთ მოგვიანებით ან მოგვწერეთ WhatsApp-ზე.' };
  function rpc(fn, body) {
    if (!CFG.SUPABASE_URL || !CFG.SUPABASE_ANON_KEY) return Promise.reject(new Error('offline'));
    return fetch(CFG.SUPABASE_URL.replace(/\/$/, '') + '/rest/v1/rpc/' + fn, {
      method: 'POST', headers: { apikey: CFG.SUPABASE_ANON_KEY, Authorization: 'Bearer ' + CFG.SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p: body })
    }).then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) throw new Error('offline'); return j || {}; }); });
  }
  window.CHD_RPC = rpc;
  function mailto(data, subject) {
    var lines = [];
    data.forEach(function (v, k) { if (['subject', 'from_name', 'botcheck', 'access_key'].indexOf(k) < 0 && v) lines.push(k.replace(/_/g, ' ') + ': ' + v); });
    window.location.href = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(lines.join('\n'));
  }
  document.querySelectorAll('form.js-form').forEach(function (form) {
    var msg = form.querySelector('.form-msg');
    var btn = form.querySelector('button[type="submit"]');
    var done = form.dataset.done ? document.getElementById(form.dataset.done) : null;
    function say(t, cls) { if (msg) { msg.className = 'form-msg' + (cls ? ' ' + cls : ''); msg.textContent = t; } }
    function ok() {
      if (done) { form.style.display = 'none'; done.classList.add('show'); done.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
      else { form.reset(); form.querySelectorAll('input[name="interest"]').forEach(function (c) { c.checked = true; }); btn.disabled = false; say(TT(form.dataset.okText || 'Thank you.', 'გმადლობთ. თქვენ სიაში ხართ.'), 'ok'); }
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var data = new FormData(form);
      if (data.get('botcheck')) return;
      var subject = data.get('subject') || 'Message from chidaoba.com';
      var kind = form.dataset.db;
      if (kind) {
        var body = { consent: data.get('consent') ? 'yes' : '', lang: document.documentElement.lang || 'en' };
        if (kind === 'subscribe') {
          body.email = data.get('email'); body.name = data.get('name') || ''; body.source = form.dataset.source || '';
          body.interests = data.getAll('interest').concat(data.getAll('sport'));
          if (!body.interests.length) body.interests = ['news'];
        } else {
          ['name', 'email', 'phone', 'topic', 'message'].forEach(function (k) { body[k] = data.get(k) || ''; });
        }
        btn.disabled = true; say(TT('Sending…', 'იგზავნება…'));
        if (kind === 'interest') body.camp = data.get('camp') || '';
        rpc(kind === 'subscribe' ? 'subscribe' : kind === 'interest' ? 'camp_interest' : 'send_message', body).then(function (j) {
          if (j.error) { btn.disabled = false; say(KA ? (KA_ERR[j.error] || j.error) : j.error, 'err'); return; }
          ok();
        }).catch(function () {
          btn.disabled = false; mailto(data, subject);
          say(TT('Your email app should open with the message ready. Just press send.', 'გაიხსნება თქვენი ელფოსტის აპი მზა შეტყობინებით. უბრალოდ დააჭირეთ გაგზავნას.'), 'ok');
        });
        return;
      }
      mailto(data, subject);
      say(TT('Your email app should open with the message ready. Just press send.', 'გაიხსნება თქვენი ელფოსტის აპი მზა შეტყობინებით. უბრალოდ დააჭირეთ გაგზავნას.'), 'ok');
    });
  });
})();

// footer: live Tbilisi time
(function () {
  var el = document.querySelector('[data-tbilisi-time]'); if (!el) return;
  function tick() {
    try { el.textContent = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tbilisi' }).format(new Date()) + ' local time, GMT+4'; } catch (e) { }
  }
  tick(); setInterval(tick, 30000);
})();

// header bag count (shop bag is stored in this browser)
(function () {
  try {
    var b = JSON.parse(localStorage.getItem('chd_bag') || '[]'), n = b.reduce(function (s, i) { return s + (i.q || 0); }, 0);
    document.querySelectorAll('[data-bag-n]').forEach(function (x) { x.textContent = n; x.hidden = !n; });
  } catch (e) { }
})();

// language switcher: keep ?query (e.g. /camps/camp/?c=...) and remember choice
(function () {
  document.querySelectorAll('.lang-dd a').forEach(function (a) {
    if (location.search) a.setAttribute('href', a.getAttribute('href').split('?')[0] + location.search);
    a.addEventListener('click', function () { try { localStorage.setItem('chd_lang', a.getAttribute('hreflang')); } catch (e) { } });
  });
})();

// close the language dropdown when clicking elsewhere
document.addEventListener('click', function (ev) {
  document.querySelectorAll('.lang-dd[open]').forEach(function (d) { if (!d.contains(ev.target)) d.removeAttribute('open'); });
});

// visitor stats: page views and a few actions, no cookies, nothing personal (Admin → Visitors)
(function () {
  var C = window.CHD_CONFIG || {};
  var host = location.hostname;
  var on = /(^|\.)chidaoba\.com$/.test(host);
  try { if (localStorage.getItem('chd_track_test') === '1') on = true; if (localStorage.getItem('chd_notrack') === '1') on = false; } catch (e) { }
  if (location.pathname.indexOf('/admin') === 0) { try { localStorage.setItem('chd_notrack', '1'); } catch (e) { } on = false; }
  if (!on || !C.SUPABASE_URL || navigator.webdriver && !host.match(/localhost|127\./)) { window.CHD_TRACK = function () { }; return; }
  var lang = document.documentElement.lang || 'en';
  var device = Math.min(screen.width || 9999, window.innerWidth || 9999) < 760 ? 'mobile' : 'desktop';
  function send(body) {
    try {
      fetch(C.SUPABASE_URL.replace(/\/$/, '') + '/rest/v1/rpc/track', {
        method: 'POST', keepalive: true,
        headers: { apikey: C.SUPABASE_ANON_KEY, Authorization: 'Bearer ' + C.SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ p: body })
      }).catch(function () { });
    } catch (e) { }
  }
  var ref = '';
  try {
    var q = new URLSearchParams(location.search).get('utm_source');
    if (q) ref = q.toLowerCase();
    else if (document.referrer) { var h = new URL(document.referrer).hostname; if (h !== host) ref = h.replace(/^(www|l|lm|m|mobile)\./, ''); }
  } catch (e) { }
  var first = false;
  try { first = !sessionStorage.getItem('chd_visit'); sessionStorage.setItem('chd_visit', '1'); } catch (e) { }
  send({ kind: 'view', path: location.pathname, lang: lang, ref: first ? ref : '', device: device, new_visit: first });
  window.CHD_TRACK = function (kind, item) { send({ kind: kind, item: item || '', path: location.pathname, lang: lang, device: device }); };
  document.addEventListener('click', function (ev) {
    var a = ev.target.closest && ev.target.closest('a[href*="wa.me/"]');
    if (a && a.id !== 'bag-send' && a.id !== 'pv-wa') window.CHD_TRACK('wa');
  }, true);
})();
// the floating WhatsApp button steps aside while a form, the footer or another WhatsApp button is on screen
(function () {
  var f = document.querySelector('.wa-float');
  if (!f || !('IntersectionObserver' in window)) return;
  var seen = [];
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (en) { var i = seen.indexOf(en.target); if (en.isIntersecting && i < 0) seen.push(en.target); else if (!en.isIntersecting && i >= 0) seen.splice(i, 1); });
    f.classList.toggle('wa-away', seen.length > 0);
  }, { rootMargin: '0px 0px -40px 0px' });
  function watch() {
    [].forEach.call(document.querySelectorAll('.site-foot, main form, .foot-cta, a.btn[href*="wa.me/"], .btn-wa, .feature-body .row-btns, .book'), function (el) {
      if (el !== f && !el._waW) { el._waW = 1; io.observe(el); }
    });
  }
  watch(); setTimeout(watch, 2500);
})();
// tabs: [data-tabs] with role=tab buttons and role=tabpanel panels. Without script every panel stays visible.
(function () {
  [].forEach.call(document.querySelectorAll('[data-tabs]'), function (box) {
    var tabs = [].slice.call(box.querySelectorAll('[role="tab"]'));
    if (!tabs.length) return;
    function pick(t, focus) {
      tabs.forEach(function (x) {
        var on = x === t, p = document.getElementById(x.getAttribute('aria-controls'));
        x.setAttribute('aria-selected', on ? 'true' : 'false'); x.tabIndex = on ? 0 : -1;
        if (p) p.hidden = !on;
      });
      if (focus) t.focus();
    }
    box.classList.add('tabs-on'); pick(tabs[0]);
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { pick(t); });
      t.addEventListener('keydown', function (ev) {
        var d = ev.key === 'ArrowRight' ? 1 : ev.key === 'ArrowLeft' ? -1 : 0;
        if (d) { ev.preventDefault(); pick(tabs[(i + d + tabs.length) % tabs.length], true); }
      });
    });
  });
})();
// home hero: the symbol writes itself. First visit of a session: it is written large in the middle of a clear
// screen, then moves to its place while the page appears. Later: a quiet redraw. Desktop: it leans toward the pointer.
(function () {
  var s = document.querySelector('.hero-draw'); if (!s) return;
  var root = document.documentElement, hero = s.closest('.hero');
  var still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function play() { s.classList.remove('go'); s.classList.remove('drawn'); void s.getBoundingClientRect(); s.classList.add('go'); }
  function lean() {
    if (!(window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches)) return;
    hero.addEventListener('pointermove', function (ev) {
      var r = hero.getBoundingClientRect(), x = (ev.clientX - r.left) / r.width - .5, y = (ev.clientY - r.top) / r.height - .5;
      s.style.transform = 'translate(' + (x * -26).toFixed(1) + 'px,' + (y * -18).toFixed(1) + 'px)';
    });
    hero.addEventListener('pointerleave', function () { s.style.transform = ''; });
  }
  function watch() {
    if (!('IntersectionObserver' in window)) return;
    var seen = true;
    new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting && !seen) { seen = true; play(); } else if (!en.isIntersecting) seen = false; }); }, { threshold: .35 }).observe(hero);
  }
  if (still) { root.classList.remove('op-in'); return; }
  if (!root.classList.contains('op-in')) { play(); watch(); lean(); return; }
  // intro
  var done = false;
  function finish() {
    if (done) return; done = true;
    try { sessionStorage.setItem('chd_intro', '1'); } catch (e) { }
    var a = s.getBoundingClientRect();
    s.style.transition = 'none';
    root.classList.add('op-out'); root.classList.remove('op-in');
    var b = s.getBoundingClientRect();
    if (b.height > 0 && a.height > 0) {
      s.style.transformOrigin = '50% 50%';
      s.style.transform = 'translate(' + ((a.left + a.width / 2) - (b.left + b.width / 2)).toFixed(1) + 'px,' + ((a.top + a.height / 2) - (b.top + b.height / 2)).toFixed(1) + 'px) scale(' + (a.height / b.height).toFixed(4) + ')';
      void s.getBoundingClientRect();
    }
    s.style.transition = ''; s.style.transform = '';
    setTimeout(function () { s.classList.add('drawn'); s.classList.remove('go'); root.classList.remove('op-out'); watch(); lean(); }, 1500);
  }
  play();
  setTimeout(finish, 2350);
  ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(function (t) { window.addEventListener(t, finish, { once: true, passive: true }); });
})();
