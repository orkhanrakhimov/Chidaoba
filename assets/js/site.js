// CHIDAOBA CULTURE — small site behaviours
(function () {
  var body = document.body;
  var burger = document.querySelector('.burger');
  if (burger) {
    burger.addEventListener('click', function () {
      var open = body.classList.toggle('menu-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && body.classList.contains('menu-open')) {
        body.classList.remove('menu-open');
        burger.setAttribute('aria-expanded', 'false');
        burger.focus();
      }
    });
  }
  var y = document.querySelectorAll('[data-year]');
  for (var i = 0; i < y.length; i++) y[i].textContent = new Date().getFullYear();

  var els = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -10% 0px' });
    els.forEach(function (el) { io.observe(el); });
  } else {
    els.forEach(function (el) { el.classList.add('in'); });
  }
})();

// Camp interest / registration form (Web3Forms)
(function () {
  var form = document.getElementById('camp-form');
  if (!form) return;
  var msg = form.querySelector('.form-msg');
  var btn = form.querySelector('button[type="submit"]');
  var done = document.getElementById('camp-done');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!form.dataset.key) return;
    if (!form.checkValidity()) { form.reportValidity(); return; }
    var data = new FormData(form);
    var types = data.getAll('camp_types');
    data.delete('camp_types');
    data.append('camp_types', types.join(', ') || '—');
    data.append('access_key', form.dataset.key);
    btn.disabled = true; msg.className = 'form-msg'; msg.textContent = 'Sending…';
    fetch('https://api.web3forms.com/submit', { method: 'POST', headers: { 'Accept': 'application/json' }, body: data })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok && j.success, j: j }; }); })
      .then(function (res) {
        if (res.ok) {
          form.style.display = 'none';
          done.classList.add('show');
          done.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else { throw new Error((res.j && res.j.message) || 'Failed'); }
      })
      .catch(function () {
        btn.disabled = false;
        msg.className = 'form-msg err';
        msg.textContent = 'Something went wrong. Please try again, or message us on Instagram @chidaobaculture.';
      });
  });
})();

// Culture page: chapter highlight + click-to-load video
(function () {
  var links = document.querySelectorAll('.chapters a');
  if (links.length && 'IntersectionObserver' in window) {
    var map = {};
    links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          links.forEach(function (a) { a.classList.remove('on'); });
          var a = map[en.target.id]; if (a) { a.classList.add('on'); var w = a.parentNode; w.scrollTo({ left: a.offsetLeft - 40, behavior: 'smooth' }); }
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    Object.keys(map).forEach(function (id) { var el = document.getElementById(id); if (el) io.observe(el); });
  }
  document.querySelectorAll('.video button[data-yt]').forEach(function (b) {
    b.addEventListener('click', function () {
      var f = document.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + b.dataset.yt + '?autoplay=1&rel=0';
      f.title = b.getAttribute('aria-label') || 'Video';
      f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      f.allowFullscreen = true;
      b.parentNode.replaceChild(f, b);
    });
  });
})();
