// CHIDAOBA CULTURE, shop: filters, product options, bag, WhatsApp order
(function () {
  var dataEl = document.getElementById('shop-data'); if (!dataEl) return;
  var P = JSON.parse(dataEl.textContent);
  var WA = 'https://wa.me/995595606670';
  var KEY = 'chd_bag';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  // ---------- bag storage ----------
  function load() { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { return mem; } }
  var mem = [];
  function save(b) { mem = b; try { localStorage.setItem(KEY, JSON.stringify(b)); } catch (e) { } count(); }
  function count() {
    var n = load().reduce(function (s, i) { return s + i.q; }, 0);
    var el = $('#bag-n'); if (el) el.textContent = n;
    $$('[data-bag-n]').forEach(function (x) { x.textContent = n; x.hidden = !n; });
  }

  // ---------- filters ----------
  var state = { cat: 'all', sport: null, q: '' };
  var tiles = $$('.ptile'), depts = $$('.dept');
  function apply() {
    var shown = 0, q = state.q.toLowerCase();
    tiles.forEach(function (t) {
      var p = P[t.dataset.id];
      var ok = (state.cat === 'all' || t.dataset.cat === state.cat) &&
        (!state.sport || t.dataset.sports === 'all' || t.dataset.sports.split(' ').indexOf(state.sport) >= 0) &&
        (!q || (p.name + ' ' + p.desc + ' ' + p.cat).toLowerCase().indexOf(q) >= 0);
      t.hidden = !ok; if (ok) shown++;
    });
    depts.forEach(function (d) { d.hidden = !$$('.ptile', d).some(function (t) { return !t.hidden; }); });
    $('#shop-empty').hidden = shown > 0;
    $('#shop-count').textContent = shown + ' item' + (shown === 1 ? '' : 's');
    $$('.shop-cats button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.cat === state.cat ? 'true' : 'false'); });
    $$('.shop-sports button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.sport === state.sport ? 'true' : 'false'); });
  }
  function toTop() {
    var main = $('.shop-main'), bar = $('#shop-bar');
    var y = main.getBoundingClientRect().top + window.scrollY - (bar ? bar.offsetHeight : 0) - 70;
    if (window.scrollY > y) window.scrollTo({ top: y, behavior: 'smooth' });
  }
  $$('.shop-cats button').forEach(function (b) { b.addEventListener('click', function () { state.cat = b.dataset.cat; apply(); toTop(); }); });
  $$('.shop-sports button').forEach(function (b) {
    b.addEventListener('click', function () { state.sport = state.sport === b.dataset.sport ? null : b.dataset.sport; apply(); toTop(); });
  });
  $('#shop-q').addEventListener('input', function (ev) { state.q = ev.target.value.trim(); apply(); });

  // sticky bar shadow
  var bar = $('#shop-bar');
  window.addEventListener('scroll', function () { bar.classList.toggle('stuck', bar.getBoundingClientRect().top <= 73); }, { passive: true });

  // ---------- size guides ----------
  var GUIDES = {
    apparel: [['Size', 'Chest (cm)', 'Height (cm)'], ['XS', '84-88', '160-167'], ['S', '89-94', '165-172'], ['M', '95-100', '170-177'], ['L', '101-106', '175-182'], ['XL', '107-112', '180-187'], ['XXL', '113-118', '185-192']],
    gi: [['Size', 'Height (cm)', 'Weight (kg)'], ['A0', '150-160', '45-55'], ['A1', '160-170', '55-70'], ['A2', '170-180', '70-85'], ['A3', '180-190', '85-100'], ['A4', '190-200', '100-115']],
    shorts: [['Size', 'Waist (in)', 'Waist (cm)'], ['28', '28', '71'], ['30', '30', '76'], ['32', '32', '81'], ['34', '34', '86'], ['36', '36', '91'], ['38', '38', '97']]
  };
  function guideFor(p) {
    if (p.sizes[0] === 'XS') return GUIDES.apparel;
    if (p.sizes[0] === 'A0' || p.sizes[0] === 'A1') return GUIDES.gi;
    if (p.sizes[0] === '28') return GUIDES.shorts;
    return null;
  }

  // ---------- product popup ----------
  var pv = $('#pv'), cur = null, sel = {}, last = null;
  function open(id) {
    var p = P[id]; if (!p) return; cur = id; last = document.activeElement;
    sel = { size: p.sizes.length === 1 ? p.sizes[0] : null, colour: p.colours.length === 1 ? p.colours[0] : null, q: 1 };
    $('#pv-cat').textContent = p.cat; $('#pv-name').textContent = p.name; $('#pv-desc').textContent = p.desc;
    $('#pv-sizes').innerHTML = p.sizes.map(function (z) { return '<button type="button" data-v="' + esc(z) + '" aria-pressed="' + (sel.size === z) + '">' + esc(z) + '</button>'; }).join('');
    $('#pv-cols').innerHTML = p.colours.map(function (c) { return '<button type="button" class="sw sw-' + c.toLowerCase() + '" data-v="' + esc(c) + '" aria-pressed="' + (sel.colour === c) + '" aria-label="' + esc(c) + '" title="' + esc(c) + '"></button>'; }).join('');
    var g = guideFor(p);
    $('#pv-guide').hidden = !g; $('#pv-sg').hidden = true;
    $('#pv-sg').innerHTML = g ? '<table>' + g.map(function (r, i) { return '<tr>' + r.map(function (c) { return i ? '<td>' + c + '</td>' : '<th>' + c + '</th>'; }).join('') + '</tr>'; }).join('') + '</table><p class="note">Between two sizes? Message us and we will help.</p>' : '';
    $('#pv-q').textContent = '1'; $('#pv-msg').textContent = '';
    draw();
    pv.hidden = false; document.body.classList.add('modal-open');
    try { history.replaceState(null, '', '#' + id); } catch (e) { }
    setTimeout(function () { $('.pv-x', pv).focus(); }, 30);
  }
  function close() {
    pv.hidden = true; document.body.classList.remove('modal-open'); cur = null;
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { }
    if (last) last.focus();
  }
  function draw() {
    $$('#pv-sizes button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.v === sel.size ? 'true' : 'false'); });
    $$('#pv-cols button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.v === sel.colour ? 'true' : 'false'); });
    $('#pv-col-name').textContent = sel.colour || '';
    $('#pv-wa').href = WA + '?text=' + encodeURIComponent('Hi CHIDAOBA! I would like to order:\n' + line(cur, sel) + '\n\nName:\nCity / country:');
  }
  function line(id, o) {
    var p = P[id];
    return p.name + (o.size && o.size !== 'One size' ? ', size ' + o.size : '') + (o.colour ? ', ' + o.colour : '') + ' x' + o.q;
  }
  function ready() {
    var miss = [];
    if (!sel.size) miss.push('a size'); if (!sel.colour) miss.push('a colour');
    if (miss.length) { $('#pv-msg').textContent = 'Please choose ' + miss.join(' and ') + '.'; return false; }
    return true;
  }
  $('#pv-sizes').addEventListener('click', function (ev) { var b = ev.target.closest('button'); if (b) { sel.size = b.dataset.v; $('#pv-msg').textContent = ''; draw(); } });
  $('#pv-cols').addEventListener('click', function (ev) { var b = ev.target.closest('button'); if (b) { sel.colour = b.dataset.v; $('#pv-msg').textContent = ''; draw(); } });
  $$('.pv-qty button').forEach(function (b) { b.addEventListener('click', function () { sel.q = Math.max(1, Math.min(20, sel.q + +b.dataset.q)); $('#pv-q').textContent = sel.q; draw(); }); });
  $('#pv-guide').addEventListener('click', function () { var g = $('#pv-sg'); g.hidden = !g.hidden; });
  $('#pv-wa').addEventListener('click', function (ev) { if (!ready()) ev.preventDefault(); });
  $('#pv-add').addEventListener('click', function () {
    if (!ready()) return;
    var b = load(), found = b.filter(function (i) { return i.id === cur && i.size === sel.size && i.colour === sel.colour; })[0];
    if (found) found.q = Math.min(20, found.q + sel.q); else b.push({ id: cur, size: sel.size, colour: sel.colour, q: sel.q });
    save(b); close(); openBag(true);
  });
  $('.pv-x', pv).addEventListener('click', close);
  pv.addEventListener('click', function (ev) { if (ev.target === pv) close(); });
  $$('.ptile-open, .ptile-add').forEach(function (b) { b.addEventListener('click', function () { open(b.closest('.ptile').dataset.id); }); });

  // ---------- bag drawer ----------
  var bagd = $('#bagd');
  function renderBag() {
    var b = load().filter(function (i) { return P[i.id]; });
    $('#bag-list').innerHTML = b.length ? b.map(function (i, k) {
      var p = P[i.id];
      return '<div class="bag-item"><div><b>' + esc(p.name) + '</b><span>' + esc([i.size !== 'One size' ? i.size : '', i.colour].filter(Boolean).join(' · ')) + '</span></div>' +
        '<div class="stepper sm"><button type="button" data-k="' + k + '" data-d="-1" aria-label="Less">−</button><output>' + i.q + '</output><button type="button" data-k="' + k + '" data-d="1" aria-label="More">+</button></div>' +
        '<button type="button" class="bag-rm" data-k="' + k + '" aria-label="Remove">×</button></div>';
    }).join('') : '<p class="bag-empty">Your bag is empty. Choose items from the shop and they will appear here.</p>';
    $('#bag-send').hidden = !b.length; $('#bag-clear').hidden = !b.length;
    $('#bag-send').href = WA + '?text=' + encodeURIComponent('Hi CHIDAOBA! I would like to order:\n' + b.map(function (i, k) { return (k + 1) + '. ' + line(i.id, i); }).join('\n') + '\n\nName:\nCity / country:');
  }
  function openBag(added) {
    renderBag(); bagd.hidden = false; document.body.classList.add('modal-open');
    bagd.classList.toggle('just-added', !!added);
  }
  function closeBag() { bagd.hidden = true; document.body.classList.remove('modal-open'); if (location.hash === '#bag') try { history.replaceState(null, '', location.pathname); } catch (e) { } }
  $('#bag-list').addEventListener('click', function (ev) {
    var t = ev.target.closest('button'); if (!t) return;
    var b = load(), k = +t.dataset.k;
    if (t.classList.contains('bag-rm')) b.splice(k, 1); else { b[k].q = Math.max(0, Math.min(20, b[k].q + +t.dataset.d)); if (!b[k].q) b.splice(k, 1); }
    save(b); renderBag();
  });
  $('#bag-open').addEventListener('click', function () { openBag(); });
  $('#bag-x').addEventListener('click', closeBag);
  bagd.addEventListener('click', function (ev) { if (ev.target === bagd) closeBag(); });
  $('#bag-clear').addEventListener('click', function () { save([]); renderBag(); });
  $$('.site-head .bag').forEach(function (a) { a.addEventListener('click', function (ev) { ev.preventDefault(); openBag(); }); });
  document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') { if (!pv.hidden) close(); else if (!bagd.hidden) closeBag(); } });

  // ---------- start ----------
  var params = new URLSearchParams(location.search);
  if (params.get('cat') && $('.shop-cats [data-cat="' + params.get('cat') + '"]')) state.cat = params.get('cat');
  if (params.get('sport') && P && $('.shop-sports [data-sport="' + params.get('sport') + '"]')) state.sport = params.get('sport');
  apply(); count();
  var h = location.hash.slice(1);
  if (h === 'bag') openBag(); else if (P[h]) open(h);
})();
