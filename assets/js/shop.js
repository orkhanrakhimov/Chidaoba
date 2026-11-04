// CHIDAOBA, shop: filters, product options, size finder, bag, WhatsApp order
(function () {
  var dataEl = document.getElementById('shop-data'); if (!dataEl) return;
  var P = JSON.parse(dataEl.textContent);
  var META = window.CHD_SHOP_META || {};
  var WA = 'https://wa.me/995595606670';
  var KEY = 'chd_bag';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var KA = document.documentElement.lang === 'ka';
  var T = function (en, ka) { return KA ? ka : en; };

  // ---------- product drawings ----------
  var ART = {};
  var tpl = document.getElementById('shop-art');
  if (tpl) $$('svg', tpl.content).forEach(function (s) { ART[s.getAttribute('data-k')] = s.innerHTML; });
  // colour is passed by its position in the product's colour list (names are translated, hex values are not)
  function artSvg(p, colour) {
    var i = Math.max(0, p.colours.indexOf(colour));
    return '<svg class="part" viewBox="0 0 120 120" aria-hidden="true" style="--pc:' + (p.hex[i] || '#1E1E1E') + ';--pd:' + (p.dk[i] ? 'rgba(255,255,255,.5)' : 'rgba(30,30,30,.45)') + '">' + (ART[p.art] || '') + '</svg>';
  }

  // ---------- bag storage ----------
  var mem = [];
  function load() { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { return mem; } }
  function save(b) { mem = b; try { localStorage.setItem(KEY, JSON.stringify(b)); } catch (e) { } count(); }
  function count() {
    var n = load().reduce(function (s, i) { return s + i.q; }, 0);
    $$('[data-bag-n]').forEach(function (x) { x.textContent = n; x.hidden = !n; });
  }

  // ---------- filters: sport, who for, search ----------
  var state = { sport: 'all', aud: 'all', q: '' };
  var tiles = $$('.ptile'), depts = $$('.dept'), pcats = $$('.pcat');
  // men: men's and unisex adult items; women: women's and unisex adult items; kids: kids' items. One size / any age gear shows for all.
  var AUD = { all: null, men: { men: 1, adult: 1, all: 1 }, women: { women: 1, adult: 1, all: 1 }, kids: { kids: 1, all: 1 } };
  function audOk(a) { return !AUD[state.aud] || !!AUD[state.aud][a]; }
  function apply() {
    var shown = 0, q = state.q.toLowerCase();
    tiles = $$('.ptile');
    tiles.forEach(function (t) {
      var p = P[t.dataset.id];
      var ok = (state.sport === 'all' || t.dataset.sport === state.sport) && audOk(t.dataset.aud) &&
        (!q || (p.name + ' ' + p.desc + ' ' + p.catName + ' ' + p.sportName + ' ' + t.textContent).toLowerCase().indexOf(q) >= 0);
      t.hidden = !ok; if (ok) shown++;
    });
    pcats.forEach(function (c) {
      var n = $$('.ptile', c).filter(function (t) { return !t.hidden; }).length;
      c.hidden = !n; $('.prow-n', c).textContent = n === 1 ? T('1 item', '1 ნივთი') : n + T(' items', ' ნივთი');
      $('.prow', c).scrollLeft = 0;
    });
    var overview = state.sport === 'all' && !state.q;
    $('#shop-main').classList.toggle('all-view', overview);
    depts.forEach(function (d) {
      var n = $$('.ptile', d).filter(function (t) { return !t.hidden; }).length;
      d.hidden = !n; $('.dept-n', d).textContent = '(' + n + ')';
      $('.dept-rows', d).scrollLeft = 0;
    });
    $('#shop-empty').hidden = shown > 0;
    $('#shop-count').textContent = shown === 1 ? T('1 item', '1 ნივთი') : shown + T(' items', ' ნივთი');
    $('#shop-reset').hidden = state.sport === 'all' && state.aud === 'all' && !state.q;
    $$('.shop-tabs button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.sport === state.sport ? 'true' : 'false'); });
    $('#shop-who').value = state.aud;
    $('#shop-who').parentNode.classList.toggle('on', state.aud !== 'all');
    $$('.who-btn').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.who === state.aud ? 'true' : 'false'); });
    navs();
    try {
      var u = new URLSearchParams(); if (state.sport !== 'all') u.set('sport', state.sport); if (state.aud !== 'all') u.set('for', state.aud);
      var qs = u.toString(); history.replaceState(null, '', location.pathname + (qs ? '?' + qs : ''));
    } catch (e) { }
  }
  function toTop() {
    var main = $('.shop-main'), bar = $('#shop-bar');
    var y = main.getBoundingClientRect().top + window.scrollY - (bar ? bar.offsetHeight : 0) - 70;
    if (window.scrollY > y + 40 || window.scrollY < y - 40) window.scrollTo({ top: y, behavior: 'smooth' });
  }
  $$('.shop-tabs button').forEach(function (b) { b.addEventListener('click', function () { state.sport = b.dataset.sport; apply(); toTop(); }); });
  $('#shop-who').addEventListener('change', function (ev) { state.aud = ev.target.value; apply(); toTop(); });
  $$('.who-btn').forEach(function (b) { b.addEventListener('click', function () { state.aud = b.dataset.who; state.sport = 'all'; apply(); toTop(); }); });
  $('#shop-q').addEventListener('input', function (ev) { state.q = ev.target.value.trim(); if (state.q) state.sport = 'all'; apply(); });
  $('#shop-reset').addEventListener('click', function () { state = { sport: 'all', aud: 'all', q: '' }; $('#shop-q').value = ''; closeSearch(); apply(); });

  // search opens over the bar
  var sb = $('#sbar-search');
  function openSearch() { sb.hidden = false; bar.classList.add('searching'); setTimeout(function () { $('#shop-q').focus(); }, 20); }
  function closeSearch() { sb.hidden = true; bar.classList.remove('searching'); if (state.q) { state.q = ''; $('#shop-q').value = ''; apply(); } }
  $('#search-open').addEventListener('click', openSearch);
  $('#search-close').addEventListener('click', closeSearch);
  $('#shop-q').addEventListener('keydown', function (ev) { if (ev.key === 'Escape') { ev.stopPropagation(); closeSearch(); } });

  // ---------- side-scrolling rows ----------
  function pairs() {
    return pcats.map(function (c) { return [$('.prow', c), c]; }).concat(depts.map(function (d) { return [$('.dept-rows', d), d]; }));
  }
  function navs() {
    pairs().forEach(function (pr) {
      var r = pr[0], box = pr[1], over = r.scrollWidth > r.clientWidth + 4;
      box.classList.toggle('scrolls', over);
      var bs = $$(':scope > .prow-head .prow-btn, :scope > .dept-head .prow-btn', box);
      if (bs.length) { bs[0].disabled = r.scrollLeft < 4; bs[1].disabled = r.scrollLeft + r.clientWidth >= r.scrollWidth - 4; }
    });
  }
  pairs().forEach(function (pr) {
    var r = pr[0], box = pr[1];
    $$(':scope > .prow-head .prow-btn, :scope > .dept-head .prow-btn', box).forEach(function (b) {
      b.addEventListener('click', function () { r.scrollBy({ left: +b.dataset.dir * r.clientWidth * 0.85, behavior: 'smooth' }); });
    });
    r.addEventListener('scroll', function () { clearTimeout(r._t); r._t = setTimeout(navs, 60); }, { passive: true });
  });
  $$('.dept-all').forEach(function (b) { b.addEventListener('click', function () { state.sport = b.dataset.go; apply(); toTop(); }); });
  window.addEventListener('resize', navs);

  // sticky bar shadow
  var bar = $('#shop-bar');
  window.addEventListener('scroll', function () { bar.classList.toggle('stuck', bar.getBoundingClientRect().top <= 73); }, { passive: true });

  // ---------- size guides (approximate, sizes vary between makers) ----------
  var H = T('Height (cm)', 'სიმაღლე (სმ)'), W = T('Weight (kg)', 'წონა (კგ)'), S = T('Size', 'ზომა');
  var GUIDES = {
    gi: [[S, H, W], ['A0', '150-160', '45-55'], ['A1', '160-170', '55-70'], ['A2', '170-180', '70-85'], ['A3', '180-190', '85-100'], ['A4', '190-200', '100-115'], ['A5', '195-205', '115-140']],
    gi_w: [[S, H, W], ['F1', '150-160', '45-55'], ['F2', '158-168', '55-65'], ['F3', '165-175', '65-75'], ['F4', '172-182', '75-90']],
    gi_k: [[S, H, W], ['M000', '95-105', '14-18'], ['M00', '105-115', '18-22'], ['M0', '115-125', '22-27'], ['M1', '125-135', '27-33'], ['M2', '135-145', '33-40'], ['M3', '145-155', '40-48'], ['M4', '155-165', '48-56']],
    belt: [[T('Belt', 'ქამარი'), T('Fits gi size', 'კიმონოს ზომა')], ['A1', 'A0, A1'], ['A2', 'A2'], ['A3', 'A3'], ['A4', 'A4, A5']],
    belt_k: [[T('Belt', 'ქამარი'), T('Fits gi size', 'კიმონოს ზომა')], ['M0', 'M000-M0'], ['M1', 'M1'], ['M2', 'M2'], ['M3', 'M3'], ['M4', 'M4']],
    judogi: [[S, H], ['110 cm', '105-115'], ['120 cm', '115-125'], ['130 cm', '125-135'], ['140 cm', '135-145'], ['150 cm', '145-155'], ['160 cm', '155-165'], ['170 cm', '165-175'], ['180 cm', '175-185'], ['190 cm', '185-195'], ['200 cm', '195-205']],
    jbelt: [[T('Belt length', 'ქამრის სიგრძე'), T('Judogi size', 'კიმონოს ზომა')], ['180 cm', '110-120'], ['200 cm', '130-140'], ['220 cm', '150'], ['240 cm', '160'], ['260 cm', '170-180'], ['280 cm', '190'], ['300 cm', '200']],
    top: [[S, T('Chest (cm)', 'მკერდი (სმ)'), H], ['XS', '84-88', '160-167'], ['S', '89-94', '165-172'], ['M', '95-100', '170-177'], ['L', '101-106', '175-182'], ['XL', '107-112', '180-187'], ['XXL', '113-118', '185-195']],
    top_w: [[S, T('Chest (cm)', 'მკერდი (სმ)'), H], ['XS', '78-82', '152-160'], ['S', '83-87', '158-165'], ['M', '88-93', '163-170'], ['L', '94-99', '168-175'], ['XL', '100-106', '173-182']],
    kids: [[S, T('Age', 'ასაკი'), H], ['4-5 y', '4-5', '104-116'], ['6-7 y', '6-7', '116-128'], ['8-9 y', '8-9', '128-140'], ['10-11 y', '10-11', '140-152'], ['12-13 y', '12-13', '152-164']],
    shorts: [[S, T('Waist (in)', 'წელი (ინჩი)'), T('Waist (cm)', 'წელი (სმ)')], ['28', '28', '71'], ['30', '30', '76'], ['32', '32', '81'], ['34', '34', '86'], ['36', '36', '91'], ['38', '38', '97']],
    shoes: [[T('EU size', 'EU ზომა'), T('Foot length (cm)', 'ტერფის სიგრძე (სმ)')], ['EU 30', '19.0'], ['EU 32', '20.5'], ['EU 34', '21.5'], ['EU 36', '23.0'], ['EU 38', '24.0'], ['EU 40', '25.5'], ['EU 42', '26.5'], ['EU 44', '28.0'], ['EU 46', '29.5']]
  };
  // size finder: columns with height / weight ranges
  function col(g, word) { for (var i = 1; i < g[0].length; i++) if (g[0][i] === word) return i; return -1; }
  function rng(s) { var m = String(s).split('-'); return [+m[0], +(m[1] || m[0])]; }
  function findSize(g, h, w) {
    var hi = col(g, H), wi = col(g, W), best = -1, rows = g.slice(1);
    function pick(ci, v) {
      if (ci < 0 || !v) return -1;
      for (var i = 0; i < rows.length; i++) { var r = rng(rows[i][ci]); if (v <= r[1]) return i; }
      return rows.length - 1;
    }
    var a = pick(hi, h), b = pick(wi, w);
    best = Math.max(a, b);
    return best >= 0 ? rows[best][0] : null;
  }

  // ---------- product popup ----------
  var pv = $('#pv'), cur = null, sel = {}, last = null;
  function open(id) {
    var p = P[id]; if (!p) return; cur = id; last = document.activeElement;
    if (window.CHD_TRACK) window.CHD_TRACK('product', id);
    sel = { size: p.sizes.length === 1 ? p.sizes[0] : null, colour: p.colours[0], q: 1 };
    $('#pv-cat').textContent = p.sportName + ' · ' + p.catName; $('#pv-name').textContent = p.name; $('#pv-desc').textContent = p.desc;
    var pr = $('#pv-price'); if (pr) { pr.textContent = p.price != null ? fmt(p.price, p.currency) : T('Price on request', 'ფასი მოთხოვნით'); pr.classList.toggle('req', p.price == null); }
    $('#pv-add').hidden = !!p.soldOut; $('#pv-wa').textContent = p.soldOut ? T('Sold out. Ask on WhatsApp', 'გაყიდულია. იკითხეთ WhatsApp-ზე') : T('Order this on WhatsApp', 'შეუკვეთეთ WhatsApp-ით');
    $('#pv-sizes').innerHTML = p.sizes.map(function (z) { return '<button type="button" data-v="' + esc(z) + '">' + esc(z) + '</button>'; }).join('');
    $('#pv-cols').innerHTML = p.colours.map(function (c) { return '<button type="button" class="sw sw-' + c.toLowerCase() + '" data-v="' + esc(c) + '" aria-label="' + esc(c) + '" title="' + esc(c) + '"></button>'; }).join('');
    var g = GUIDES[p.guide] || null;
    $('#pv-guide').hidden = !g; $('#pv-sg').hidden = true;
    $('#pv-sg').innerHTML = g ? '<table>' + g.map(function (r, i) { return '<tr>' + r.map(function (c) { return i ? '<td>' + esc(c) + '</td>' : '<th>' + esc(c) + '</th>'; }).join('') + '</tr>'; }).join('') + '</table><p class="note">' + T('Approximate sizes. Between two sizes? Take the larger one or message us.', 'მიახლოებითი ზომებია. ორ ზომას შორის ხართ? აიღეთ უფრო დიდი ან მოგვწერეთ.') + '</p>' : '';
    var canFit = g && col(g, H) > 0;
    $('#pv-fit').hidden = !canFit; $('#fit-w-l').hidden = !(g && col(g, W) > 0);
    $('#fit-h').value = ''; $('#fit-w').value = ''; $('#fit-out').textContent = '';
    $('#pv-q').textContent = '1'; $('#pv-msg').textContent = '';
    draw();
    pv.hidden = false; document.body.classList.add('modal-open');
    try { history.replaceState(null, '', location.pathname + location.search + '#' + id); } catch (e) { }
    setTimeout(function () { $('.pv-x', pv).focus(); }, 30);
  }
  function close() {
    pv.hidden = true; document.body.classList.remove('modal-open'); cur = null;
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { }
    if (last) last.focus();
  }
  function draw() {
    var p = P[cur];
    $$('#pv-sizes button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.v === sel.size ? 'true' : 'false'); });
    $$('#pv-cols button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.v === sel.colour ? 'true' : 'false'); });
    $('#pv-col-name').textContent = sel.colour || '';
    $('#pv-art').innerHTML = p.photo ? '<img src="' + esc(p.photo) + '" alt="">' : artSvg(p, sel.colour);
    $('#pv-wa').href = WA + '?text=' + encodeURIComponent(T('Hi CHIDAOBA! I would like to order:', 'გამარჯობა CHIDAOBA! მინდა შევუკვეთო:') + '\n' + line(cur, sel) + '\n\n' + T('Name:\nCity / country:', 'სახელი:\nქალაქი / ქვეყანა:'));
  }
  function fmt(n, cur) {
    if ((cur || 'GEL') === 'GEL') return (Math.round(n) === +n ? +n : (+n).toFixed(2)) + ' ₾';
    try { return new Intl.NumberFormat(KA ? 'ka-GE' : 'en-GB', { style: 'currency', currency: cur || 'GEL', maximumFractionDigits: Math.round(n) === +n ? 0 : 2 }).format(+n); } catch (e) { return n + ' ' + (cur || ''); }
  }
  function line(id, o) {
    var p = P[id];
    return p.name + (o.size && !p.one ? ', ' + T('size ', 'ზომა ') + o.size : '') + (o.colour ? ', ' + o.colour : '') + ' x' + o.q;
  }
  function ready() {
    if (!sel.size) { $('#pv-msg').textContent = T('Please choose a size.', 'აირჩიეთ ზომა.'); return false; }
    return true;
  }
  function fit() {
    var p = P[cur], g = GUIDES[p.guide], h = +$('#fit-h').value, w = +$('#fit-w').value;
    if (!g || (!h && !w)) { $('#fit-out').textContent = ''; return; }
    var z = findSize(g, h, w);
    if (z && p.sizes.indexOf(z) < 0) z = h < rng(g[1][col(g, H)])[0] ? p.sizes[0] : p.sizes[p.sizes.length - 1];
    if (!z) return;
    sel.size = z; draw();
    $('#fit-out').textContent = T('We suggest size ' + z + '. Between sizes? Take the larger one or message us.', 'გირჩევთ ზომას ' + z + '. ორ ზომას შორის ხართ? აიღეთ უფრო დიდი ან მოგვწერეთ.');
  }
  $('#fit-h').addEventListener('input', fit); $('#fit-w').addEventListener('input', fit);
  $('#pv-sizes').addEventListener('click', function (ev) { var b = ev.target.closest('button'); if (b) { sel.size = b.dataset.v; $('#pv-msg').textContent = ''; draw(); } });
  $('#pv-cols').addEventListener('click', function (ev) { var b = ev.target.closest('button'); if (b) { sel.colour = b.dataset.v; draw(); } });
  $$('.pv-qty button').forEach(function (b) { b.addEventListener('click', function () { sel.q = Math.max(1, Math.min(20, sel.q + +b.dataset.q)); $('#pv-q').textContent = sel.q; draw(); }); });
  $('#pv-guide').addEventListener('click', function () { var g = $('#pv-sg'); g.hidden = !g.hidden; });
  $('#pv-wa').addEventListener('click', function (ev) { if (!ready()) { ev.preventDefault(); return; } if (window.CHD_TRACK) window.CHD_TRACK('order', cur); });
  $('#pv-add').addEventListener('click', function () {
    if (!ready()) return;
    var b = load(), found = b.filter(function (i) { return i.id === cur && i.size === sel.size && i.colour === sel.colour; })[0];
    if (found) found.q = Math.min(20, found.q + sel.q); else b.push({ id: cur, size: sel.size, colour: sel.colour, q: sel.q });
    save(b); close(); openBag(true);
  });
  $('.pv-x', pv).addEventListener('click', close);
  pv.addEventListener('click', function (ev) { if (ev.target === pv) close(); });
  document.addEventListener('click', function (ev) { var b = ev.target.closest('.ptile-open'); if (b) open(b.closest('.ptile').dataset.id); });
  // colour dots on a tile preview that colour
  document.addEventListener('mouseover', function (ev) {
    var d = ev.target.closest('.ptile .dots .sw'); if (!d) return;
    var t = d.closest('.ptile'), p = P[t.dataset.id], k = $$('.dots .sw', t).indexOf(d), sv = $('.ptile-art svg.part', t);
    if (p && sv) sv.outerHTML = artSvg(p, p.colours[k]);
  });

  // ---------- bag drawer ----------
  var bagd = $('#bagd');
  function renderBag() {
    var b = load().filter(function (i) { return P[i.id]; });
    $('#bag-list').innerHTML = b.length ? b.map(function (i, k) {
      var p = P[i.id];
      return '<div class="bag-item"><div class="bag-art">' + artSvg(p, i.colour) + '</div><div><b>' + esc(p.name) + '</b><span>' + esc([!p.one ? i.size : '', i.colour].filter(Boolean).join(' · ')) + '</span></div>' +
        '<div class="stepper sm"><button type="button" data-k="' + k + '" data-d="-1" aria-label="Less">−</button><output>' + i.q + '</output><button type="button" data-k="' + k + '" data-d="1" aria-label="More">+</button></div>' +
        '<button type="button" class="bag-rm" data-k="' + k + '" aria-label="Remove">×</button></div>';
    }).join('') : '<p class="bag-empty">' + T('Your bag is empty. Choose items from the shop and they will appear here.', 'კალათა ცარიელია. აირჩიეთ ნივთები მაღაზიიდან და ისინი აქ გამოჩნდება.') + '</p>';
    $('#bag-send').hidden = !b.length; $('#bag-clear').hidden = !b.length;
    var priced = b.filter(function (i) { return P[i.id].price != null; }), tot = priced.reduce(function (s, i) { return s + P[i.id].price * i.q; }, 0), cur = priced.length ? P[priced[0].id].currency : 'GEL';
    var te = $('#bag-total'); if (te) { te.hidden = !priced.length; te.innerHTML = '<span>' + T(priced.length < b.length ? 'Total for priced items' : 'Total', priced.length < b.length ? 'ჯამი ფასიანი ნივთებისთვის' : 'ჯამი') + '</span><b>' + fmt(tot, cur) + '</b>'; }
    $('#bag-send').href = WA + '?text=' + encodeURIComponent(T('Hi CHIDAOBA! I would like to order:', 'გამარჯობა CHIDAOBA! მინდა შევუკვეთო:') + '\n' + b.map(function (i, k) { return (k + 1) + '. ' + line(i.id, i); }).join('\n') + '\n\n' + T('Name:\nCity / country:', 'სახელი:\nქალაქი / ქვეყანა:'));
  }
  function openBag(added) {
    renderBag(); bagd.hidden = false; document.body.classList.add('modal-open');
    bagd.classList.toggle('just-added', !!added);
  }
  function closeBag() { bagd.hidden = true; document.body.classList.remove('modal-open'); if (location.hash === '#bag') try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { } }
  $('#bag-list').addEventListener('click', function (ev) {
    var t = ev.target.closest('button'); if (!t) return;
    var b = load(), k = +t.dataset.k;
    if (t.classList.contains('bag-rm')) b.splice(k, 1); else { b[k].q = Math.max(0, Math.min(20, b[k].q + +t.dataset.d)); if (!b[k].q) b.splice(k, 1); }
    save(b); renderBag();
  });
  $('#bag-x').addEventListener('click', closeBag);
  $('#bag-send').addEventListener('click', function () { if (window.CHD_TRACK) window.CHD_TRACK('order', load().length + ' items'); });
  bagd.addEventListener('click', function (ev) { if (ev.target === bagd) closeBag(); });
  $('#bag-clear').addEventListener('click', function () { save([]); renderBag(); });
  $$('.site-head .bag').forEach(function (a) { a.addEventListener('click', function (ev) { ev.preventDefault(); openBag(); }); });
  document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') { if (!pv.hidden) close(); else if (!bagd.hidden) closeBag(); } });

  // ---------- products from the database (edited in the admin panel) ----------
  var BADGE = { men: T('Men', 'მამაკაცები'), women: T('Women', 'ქალები'), adult: T('Unisex', 'უნისექსი'), kids: T('Kids', 'ბავშვები') };
  var ORDER = ['men', 'women', 'adult', 'kids', 'all'];
  var KIDS_AGE = ['4-5 y', '6-7 y', '8-9 y', '10-11 y', '12-13 y'];
  function szSum(z) {
    if (z.length === 1 && z[0] === 'One size') return T('One size', 'ერთი ზომა');
    if (z.join() === KIDS_AGE.join()) return T('Ages 4 to 13', '4–13 წლის');
    return z.length > 2 ? T('Sizes ' + z[0] + ' to ' + z[z.length - 1], 'ზომები ' + z[0] + '–' + z[z.length - 1]) : T('Sizes ', 'ზომები ') + z.join(' · ');
  }
  function tileHtml(id, p) {
    var dots = p.colours.map(function (c) { return '<i class="sw sw-' + c.toLowerCase() + '" title="' + esc(c) + '"></i>'; }).join('');
    var badge = BADGE[p.aud] ? '<span class="ptile-aud a-' + p.aud + '">' + BADGE[p.aud] + '</span>' : '';
    var art = p.photo ? '<img class="ptile-ph" src="' + esc(p.photo) + '" alt="" loading="lazy">' : artSvg(p, p.colours[0]);
    return '<article class="ptile' + (p.soldOut ? ' sold' : '') + '" id="' + id + '" data-id="' + id + '" data-sport="' + p.sport + '" data-cat="' + p.cat + '" data-aud="' + p.aud + '">' +
      '<button type="button" class="ptile-open" aria-label="' + esc(p.name) + '"><div class="ptile-art">' + art + badge + (p.soldOut ? '<span class="ptile-sold">' + T('Sold out', 'გაყიდულია') + '</span>' : '') + '</div>' +
      '<div class="ptile-body"><p class="ptile-cat">' + esc(p.catName) + '</p><h3>' + esc(p.name) + '</h3><p>' + esc(p.desc) + '</p>' +
      '<div class="ptile-meta"><span>' + (p.price != null ? '<b class="ptile-price">' + fmt(p.price, p.currency) + '</b> · ' : '') + esc(szSum(p.sizes)) + '</span><span class="dots">' + dots + '</span></div></div></button></article>';
  }
  function useRows(rows) {
    var NP = {}, by = {};
    rows.forEach(function (r) {
      var box = $('.dept[data-sport="' + r.sport + '"] .pcat[data-cat="' + r.category + '"]'); if (!box) return;
      var cols = (r.colours && r.colours.length ? r.colours : ['Black']);
      NP[r.id] = { name: (KA && r.name_ka) || r.name, desc: (KA && r.description_ka) || r.description || '', sport: r.sport, cat: r.category,
        catName: $('.pcat-h', box).textContent, sportName: $('h2', box.closest('.dept')).textContent, aud: r.audience || 'adult',
        sizes: r.sizes && r.sizes.length ? r.sizes : ['One size'], colours: cols, guide: r.size_guide || '', art: r.drawing || 'tshirt',
        hex: cols.map(function (c) { return (META.colours || {})[c] || '#1E1E1E'; }), dk: cols.map(function (c) { return (META.dark || []).indexOf(c) >= 0 ? 1 : 0; }),
        one: !r.sizes || !r.sizes.length || (r.sizes.length === 1 && r.sizes[0] === 'One size'), price: r.price == null || r.price === '' ? null : +r.price, currency: r.currency || 'GEL',
        photo: r.photo_url || null, soldOut: r.status === 'sold_out', sort: r.sort || 0 };
      (by[r.sport + '/' + r.category] = by[r.sport + '/' + r.category] || []).push(r.id);
    });
    if (!Object.keys(NP).length) return;
    P = NP;
    pcats.forEach(function (c) {
      var k = c.closest('.dept').dataset.sport + '/' + c.dataset.cat, ids = (by[k] || []).slice();
      ids.sort(function (a, b) { return ORDER.indexOf(P[a].aud) - ORDER.indexOf(P[b].aud) || P[a].sort - P[b].sort; });
      $('.prow', c).innerHTML = ids.map(function (id) { return tileHtml(id, P[id]); }).join('');
    });
    apply(); count();
  }
  var CFG = window.CHD_CONFIG || {};
  function loadLive() {
    if (!CFG.SUPABASE_URL || !CFG.SUPABASE_ANON_KEY) return Promise.resolve();
    return fetch(CFG.SUPABASE_URL.replace(/\/$/, '') + '/rest/v1/products?select=*&status=neq.hidden&order=sort.asc', { headers: { apikey: CFG.SUPABASE_ANON_KEY, Authorization: 'Bearer ' + CFG.SUPABASE_ANON_KEY } })
      .then(function (r) { if (!r.ok) throw new Error('no products table yet'); return r.json(); })
      .then(function (rows) { if (Array.isArray(rows) && rows.length) useRows(rows); })
      .catch(function (err) { if (window.console) console.warn('shop: using built-in catalogue', err && err.message); });
  }

  // ---------- start ----------
  var params = new URLSearchParams(location.search);
  var sp = params.get('sport'), au = params.get('for');
  if (sp && $('.shop-tabs [data-sport="' + sp + '"]')) state.sport = sp;
  if (au === 'adult') au = 'men';
  if (au && AUD.hasOwnProperty(au)) state.aud = au;
  apply(); count();
  var h = location.hash.slice(1);
  loadLive().then(function () { if (h === 'bag') openBag(); else if (P[h]) open(h); });
})();
