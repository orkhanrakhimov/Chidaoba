// CHIDAOBA CULTURE, site behaviours
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

  // ---------- forms: Web3Forms when a key is set, otherwise open the visitor's email app ----------
  document.querySelectorAll('form.js-form').forEach(function (form) {
    var msg = form.querySelector('.form-msg');
    var btn = form.querySelector('button[type="submit"]');
    var done = form.dataset.done ? document.getElementById(form.dataset.done) : null;
    function say(t, cls) { if (msg) { msg.className = 'form-msg' + (cls ? ' ' + cls : ''); msg.textContent = t; } }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var data = new FormData(form);
      if (data.get('botcheck')) return;
      // join multi-value fields
      var multi = {};
      form.querySelectorAll('input[type="checkbox"][name]').forEach(function (c) {
        if (c.name !== 'consent' && c.name !== 'botcheck') multi[c.name] = true;
      });
      Object.keys(multi).forEach(function (n) { var v = data.getAll(n); data.delete(n); data.append(n, v.join(', ') || '-'); });
      var subject = data.get('subject') || 'Message from chidaoba.com';
      var key = form.dataset.key;
      if (!key) {
        var lines = [];
        data.forEach(function (v, k) { if (['subject', 'from_name', 'botcheck', 'access_key'].indexOf(k) < 0 && v) lines.push(k.replace(/_/g, ' ') + ': ' + v); });
        window.location.href = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(lines.join('\n'));
        say('Your email app should open with the message ready. Just press send. If nothing happens, email us at ' + EMAIL + '.', 'ok');
        return;
      }
      data.append('access_key', key);
      btn.disabled = true; say('Sending…');
      fetch('https://api.web3forms.com/submit', { method: 'POST', headers: { 'Accept': 'application/json' }, body: data })
        .then(function (r) { return r.json().then(function (j) { return r.ok && j.success; }); })
        .then(function (ok) {
          if (!ok) throw new Error('failed');
          if (done) { form.style.display = 'none'; done.classList.add('show'); done.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
          else { form.reset(); btn.disabled = false; say(form.dataset.okText || 'Thank you. Received.', 'ok'); }
        })
        .catch(function () { btn.disabled = false; say('Something went wrong. Please try again, or email ' + EMAIL + '.', 'err'); });
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
