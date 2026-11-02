// CHIDAOBA CULTURE — admin panel (camps & registrations)
(function () {
  var H = window.CHD, app = document.getElementById('admin');
  if (!H || !app) return;
  var e = H.esc, $ = function (s, r) { return (r || app).querySelector(s); }, $$ = function (s, r) { return [].slice.call((r || app).querySelectorAll(s)); };
  var STATUS = { draft: 'Draft', published: 'Published', sold_out: 'Sold out', cancelled: 'Cancelled', completed: 'Completed' };
  var RSTATUS = { pending: 'Pending deposit', deposit_paid: 'Deposit paid', paid: 'Paid in full', waitlist: 'Waitlist', cancelled: 'Cancelled' };
  var state = { camps: [], regs: [], view: 'dash', camp: null, filter: 'all', q: '' };

  if (H.mode === 'empty') {
    app.innerHTML = box('<p class="label"><span class="bar"></span>Admin</p><h1 class="display h-md">Connect the database<span class="dot">.</span></h1>' +
      '<p class="body">The admin panel needs Supabase. Add your project URL and anon key to <code>assets/js/config.js</code>.</p>' +
      '<p class="body">Want to try it first? <a href="?demo=1">Open the demo</a> (sample data, saved in this browser only).</p>');
    return;
  }
  if (H.mode === 'demo') {
    var bar = document.createElement('div'); bar.className = 'demo-bar';
    bar.innerHTML = 'Demo mode — sample data in this browser only. <a href="#" id="demo-reset">Reset demo</a> · <a href="?demo=0">Exit</a>';
    document.body.prepend(bar);
    bar.querySelector('#demo-reset').addEventListener('click', function (ev) { ev.preventDefault(); H.api.reset().then(function () { location.reload(); }); });
  }
  function box(inner) { return '<div class="adm-login"><div>' + inner + '</div></div>'; }
  function toast(t, bad) { var x = document.createElement('div'); x.className = 'toast' + (bad ? ' bad' : ''); x.textContent = t; document.body.appendChild(x); setTimeout(function () { x.remove(); }, 2600); }
  function money(v, c) { return H.money(v || 0, c || 'EUR'); }

  // ---------------- login ----------------
  function login() {
    app.innerHTML = box('<p class="label"><span class="bar"></span>Admin</p><h1 class="display h-md">Sign in<span class="dot">.</span></h1>' +
      '<form id="lf" class="adm-form" novalidate><div class="field"><label for="le">Email</label><input id="le" type="email" autocomplete="username" required value="' + (H.mode === 'demo' ? 'demo@chidaoba.com' : '') + '"></div>' +
      '<div class="field"><label for="lp">Password</label><input id="lp" type="password" autocomplete="current-password" required value="' + (H.mode === 'demo' ? 'demo' : '') + '"></div>' +
      '<button class="btn btn-primary" type="submit">Sign in <span class="arr">→</span></button><p class="form-msg"></p></form>');
    $('#lf').addEventListener('submit', function (ev) {
      ev.preventDefault(); var m = $('#lf .form-msg'); m.textContent = 'Signing in…'; m.className = 'form-msg';
      H.api.signIn($('#le').value.trim(), $('#lp').value).then(load).catch(function (err) { m.className = 'form-msg err'; m.textContent = err.message; });
    });
  }

  function load() {
    app.innerHTML = '<p class="adm-loading">Loading…</p>';
    return Promise.all([H.api.adminCamps(), H.api.regs()]).then(function (r) {
      state.camps = r[0] || []; state.regs = r[1] || []; route();
    }).catch(function (err) { if (/sign in|JWT|expired/i.test(err.message)) { H.api.signOut(); login(); } else app.innerHTML = box('<p class="body">' + e(err.message) + '</p>'); });
  }
  function shell(inner, tab) {
    return '<header class="adm-head"><a class="adm-brand" href="#dash"><img src="/assets/img/symbol-chalk.svg" alt="" width="20" height="28"> Admin</a>' +
      '<nav><a href="#dash"' + (tab === 'dash' ? ' class="on"' : '') + '>Camps</a><a href="#regs"' + (tab === 'regs' ? ' class="on"' : '') + '>Registrations</a><a href="/camps/" target="_blank">View site ↗</a></nav>' +
      '<button type="button" class="adm-out">Sign out</button></header><main class="adm-main">' + inner + '</main>';
  }
  function route() {
    var h = location.hash.replace('#', '');
    if (h.indexOf('edit/') === 0) return editor(h.slice(5));
    if (h === 'new') return editor(null);
    if (h.indexOf('regs') === 0) return regsView(h.split('/')[1] || 'all');
    return dash();
  }
  window.addEventListener('hashchange', function () { if (H.api.signedIn()) route(); });
  app.addEventListener('click', function (ev) {
    if (ev.target.closest('.adm-out')) { H.api.signOut().then(login); }
  });

  // ---------------- stats ----------------
  function statsFor(c) {
    var rs = state.regs.filter(function (r) { return r.camp_id === c.id; });
    var act = rs.filter(function (r) { return ['pending', 'deposit_paid', 'paid'].indexOf(r.status) >= 0; });
    var people = act.reduce(function (s, r) { return s + (r.people || 1); }, 0);
    var wl = rs.filter(function (r) { return r.status === 'waitlist'; }).reduce(function (s, r) { return s + (r.people || 1); }, 0);
    var booked = act.reduce(function (s, r) { return s + +r.total; }, 0);
    var received = rs.reduce(function (s, r) { return s + (r.status === 'paid' ? +r.total : r.status === 'deposit_paid' ? +r.deposit : 0); }, 0);
    var unpaid = rs.filter(function (r) { return r.status === 'pending'; }).length;
    return { people: people, wl: wl, booked: booked, received: received, unpaid: unpaid, count: rs.length };
  }

  // ---------------- dashboard ----------------
  function dash() {
    var tot = { people: 0, booked: 0, received: 0, unpaid: 0 }, cur = (state.camps[0] || {}).currency || 'EUR';
    var rows = state.camps.map(function (c) {
      var s = statsFor(c); if (c.status !== 'cancelled') { tot.people += s.people; tot.booked += s.booked; tot.received += s.received; tot.unpaid += s.unpaid; }
      var pct = c.capacity ? Math.min(100, Math.round(s.people / c.capacity * 100)) : 0;
      var cv = H.cover(c);
      return '<tr><td class="cam-td">' + (cv ? '<img class="cam-th" src="' + e(cv.thumb) + '" alt="">' : '<span class="cam-th"></span>') + '<div><a href="#edit/' + c.id + '"><b>' + e(c.title) + '</b></a><span class="sub">' + e(H.DISC[c.discipline] || '') + ' · ' + e(H.dateRange(c.start_date, c.end_date)) + '</span></div></td>' +
        '<td><span class="pill-s s-' + c.status + '">' + STATUS[c.status] + '</span></td>' +
        '<td><b>' + s.people + (c.capacity ? ' / ' + c.capacity : '') + '</b>' + (c.capacity ? '<i class="bar"><b style="width:' + pct + '%"></b></i>' : '') + (s.wl ? '<span class="sub">+' + s.wl + ' waitlist</span>' : '') + '</td>' +
        '<td>' + money(s.booked, c.currency) + '</td><td>' + money(s.received, c.currency) + (s.unpaid ? '<span class="sub warn">' + s.unpaid + ' awaiting deposit</span>' : '') + '</td>' +
        '<td class="act"><a href="#regs/' + c.id + '">Registrations</a><a href="#edit/' + c.id + '">Edit</a>' + (c.status !== 'draft' ? '<a href="/camps/camp/?c=' + encodeURIComponent(c.slug) + '" target="_blank">View ↗</a>' : '') + '</td></tr>';
    }).join('');
    app.innerHTML = shell(
      '<div class="adm-top"><h1 class="display h-md">Camps<span class="dot">.</span></h1><a class="btn btn-primary" href="#new">New camp +</a></div>' +
      '<div class="kpis"><div><span>People booked</span><b>' + tot.people + '</b></div><div><span>Booked value</span><b>' + money(tot.booked, cur) + '</b></div>' +
      '<div><span>Received</span><b>' + money(tot.received, cur) + '</b></div><div><span>Awaiting deposit</span><b>' + tot.unpaid + '</b></div></div>' +
      (state.camps.length ? '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Camp</th><th>Status</th><th>Booked</th><th>Value</th><th>Received</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div>'
        : '<p class="body">No camps yet. <a href="#new">Create your first camp →</a></p>') +
      '<p class="note">Totals are per currency of each camp; the summary uses ' + cur + '.</p>', 'dash');
  }

  // ---------------- registrations ----------------
  function regsView(campId) {
    var camps = state.camps, camp = camps.filter(function (c) { return c.id === campId; })[0];
    var name = function (id) { var c = camps.filter(function (k) { return k.id === id; })[0]; return c ? c.title : '—'; };
    var cur = function (id) { var c = camps.filter(function (k) { return k.id === id; })[0]; return c ? c.currency : 'EUR'; };
    var list = state.regs.filter(function (r) { return (!camp || r.camp_id === campId) && (state.filter === 'all' || r.status === state.filter); })
      .filter(function (r) { var q = state.q.toLowerCase(); return !q || [r.full_name, r.email, r.ref, r.phone, r.country, r.club].join(' ').toLowerCase().indexOf(q) >= 0; });
    var opts = '<option value="all">All camps</option>' + camps.map(function (c) { return '<option value="' + c.id + '"' + (c.id === campId ? ' selected' : '') + '>' + e(c.title) + '</option>'; }).join('');
    var fopts = '<option value="all">Any status</option>' + Object.keys(RSTATUS).map(function (k) { return '<option value="' + k + '"' + (state.filter === k ? ' selected' : '') + '>' + RSTATUS[k] + '</option>'; }).join('');
    var rows = list.map(function (r) {
      var wa = r.phone ? 'https://wa.me/' + r.phone.replace(/[^0-9]/g, '') + '?text=' + encodeURIComponent('Hi ' + (r.full_name || '').split(' ')[0] + ', this is CHIDAOBA about your booking ' + r.ref + '.') : null;
      return '<tr data-id="' + r.id + '"><td><b>' + e(r.full_name) + '</b><span class="sub">' + e(r.ref) + ' · ' + new Date(r.created_at).toLocaleDateString('en-GB') + '</span>' + (camp ? '' : '<span class="sub">' + e(name(r.camp_id)) + '</span>') + '</td>' +
        '<td><a href="mailto:' + e(r.email) + '?subject=' + encodeURIComponent('Your booking ' + r.ref) + '">' + e(r.email) + '</a>' + (wa ? '<span class="sub"><a href="' + wa + '" target="_blank" rel="noopener">WhatsApp ' + e(r.phone) + '</a></span>' : '') + '<span class="sub">' + e([r.country, r.age ? r.age + ' y' : '', r.experience, r.level, r.club].filter(Boolean).join(' · ')) + '</span></td>' +
        '<td>' + e(r.package_name) + (r.addons && r.addons.length ? '<span class="sub">+ ' + r.addons.map(function (a) { return e(a.name); }).join(', ') + '</span>' : '') + '<span class="sub">' + r.people + ' ' + (r.people > 1 ? 'people' : 'person') + '</span></td>' +
        '<td><b>' + money(r.total, cur(r.camp_id)) + '</b><span class="sub">Deposit ' + money(r.deposit, cur(r.camp_id)) + (r.pay_by ? ' by ' + new Date(r.pay_by + 'T00:00').toLocaleDateString('en-GB') : '') + '</span></td>' +
        '<td><select class="rs s-' + r.status + '">' + Object.keys(RSTATUS).map(function (k) { return '<option value="' + k + '"' + (r.status === k ? ' selected' : '') + '>' + RSTATUS[k] + '</option>'; }).join('') + '</select>' +
        '<input class="rn" placeholder="Note…" value="' + e(r.admin_note || '') + '">' + (r.notes ? '<span class="sub">“' + e(r.notes) + '”</span>' : '') + '</td></tr>';
    }).join('');
    app.innerHTML = shell('<div class="adm-top"><h1 class="display h-md">Registrations<span class="dot">.</span></h1><button class="btn btn-ghost" type="button" id="csv">Export CSV</button></div>' +
      '<div class="adm-filters"><select id="fc">' + opts + '</select><select id="fs">' + fopts + '</select><input id="fq" type="search" placeholder="Search name, email, code…" value="' + e(state.q) + '"><span class="sub">' + list.length + ' shown</span></div>' +
      (list.length ? '<div class="tbl-wrap"><table class="tbl regs"><thead><tr><th>Name</th><th>Contact</th><th>Package</th><th>Amount</th><th>Status</th></tr></thead><tbody>' + rows + '</tbody></table></div>' : '<p class="body">No registrations match.</p>'), 'regs');
    $('#fc').addEventListener('change', function () { location.hash = 'regs/' + this.value; });
    $('#fs').addEventListener('change', function () { state.filter = this.value; regsView(campId); });
    $('#fq').addEventListener('input', function () { state.q = this.value; clearTimeout(this._t); var me = this; this._t = setTimeout(function () { regsView(campId); var i = $('#fq'); i.focus(); i.setSelectionRange(me.value.length, me.value.length); }, 250); });
    $$('.rs').forEach(function (s) {
      s.addEventListener('change', function () {
        var id = s.closest('tr').dataset.id, v = s.value;
        H.api.updateReg(id, { status: v }).then(function () { state.regs.forEach(function (r) { if (r.id === id) r.status = v; }); s.className = 'rs s-' + v; toast('Status updated'); })
          .catch(function (err) { toast(err.message, true); });
      });
    });
    $$('.rn').forEach(function (i) {
      i.addEventListener('change', function () {
        var id = i.closest('tr').dataset.id, v = i.value;
        H.api.updateReg(id, { admin_note: v }).then(function () { state.regs.forEach(function (r) { if (r.id === id) r.admin_note = v; }); toast('Note saved'); }).catch(function (err) { toast(err.message, true); });
      });
    });
    $('#csv').addEventListener('click', function () { csv(list, name); });
  }
  function csv(list, name) {
    var cols = ['ref', 'created_at', 'camp', 'status', 'full_name', 'email', 'phone', 'country', 'age', 'experience', 'level', 'club', 'package_name', 'addons', 'people', 'total', 'deposit', 'pay_by', 'notes', 'admin_note'];
    var q = function (v) { v = v == null ? '' : String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
    var out = [cols.join(',')].concat(list.map(function (r) {
      return cols.map(function (k) { return q(k === 'camp' ? name(r.camp_id) : k === 'addons' ? (r.addons || []).map(function (a) { return a.name; }).join('; ') : r[k]); }).join(',');
    })).join('\n');
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + out], { type: 'text/csv' }));
    a.download = 'chidaoba-registrations-' + new Date().toISOString().slice(0, 10) + '.csv'; a.click();
  }

  // ---------------- camp editor ----------------
  function blank() {
    return { title: '', slug: '', discipline: 'bjj', status: 'draft', featured: false, start_date: '', end_date: '', city: '', country: 'Georgia', venue: '', level: 'All levels',
      summary: '', description: '', capacity: 20, currency: 'EUR', early_bird_deadline: '', registration_deadline: '', deposit_pct: 30, payment_days: 7,
      group_min: 4, group_discount_pct: 10, bank_details: '', packages: [{ id: 'training', name: 'Training only', description: '', price: '', early_price: '' }],
      addons: [], schedule: [], included: [], excluded: [], coaches: [], faq: [], cover_url: null, gallery: [], venue_key: '', address: '', map_url: '', venue_info: '' };
  }
  function slugify(t) { return (t || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70); }
  function inp(n, l, v, t, extra) { return '<div class="field"><label for="e-' + n + '">' + l + '</label><input id="e-' + n + '" name="' + n + '" type="' + (t || 'text') + '" value="' + e(v == null ? '' : v) + '"' + (extra || '') + '></div>'; }
  function sel(n, l, v, o) { return '<div class="field"><label for="e-' + n + '">' + l + '</label><select id="e-' + n + '" name="' + n + '">' + Object.keys(o).map(function (k) { return '<option value="' + k + '"' + (k === v ? ' selected' : '') + '>' + o[k] + '</option>'; }).join('') + '</select></div>'; }
  function area(n, l, v, ph) { return '<div class="field full"><label for="e-' + n + '">' + l + '</label><textarea id="e-' + n + '" name="' + n + '" placeholder="' + e(ph || '') + '">' + e(v || '') + '</textarea></div>'; }
  function rep(key, items, fields, addLabel) {
    return '<div class="rep" data-key="' + key + '">' + items.map(function (it) { return repRow(fields, it); }).join('') +
      '</div><button type="button" class="btn btn-ghost add-row" data-key="' + key + '">' + addLabel + '</button>';
  }
  function repRow(fields, it) {
    it = it || {};
    return '<div class="rep-row">' + fields.map(function (f) {
      var v = it[f[0]] == null ? '' : it[f[0]];
      return f[2] === 'area' ? '<label class="rf w"><span>' + f[1] + '</span><textarea data-f="' + f[0] + '">' + e(v) + '</textarea></label>'
        : '<label class="rf' + (f[3] ? ' ' + f[3] : '') + '"><span>' + f[1] + '</span><input data-f="' + f[0] + '" type="' + (f[2] || 'text') + '" value="' + e(v) + '"' + (f[2] === 'number' ? ' step="any" min="0"' : '') + '></label>';
    }).join('') + '<button type="button" class="rep-x" aria-label="Remove">×</button></div>';
  }
  var F = {
    packages: [['name', 'Package name'], ['price', 'Price', 'number', 's'], ['early_price', 'Early-bird price', 'number', 's'], ['description', 'What’s included', 'text', 'w']],
    addons: [['name', 'Add-on'], ['price', 'Price', 'number', 's']],
    coaches: [['name', 'Name'], ['role', 'Role / rank'], ['bio', 'Short bio', 'area']],
    faq: [['q', 'Question'], ['a', 'Answer', 'area']],
    schedule: [['day', 'Day / label', 'text', 's'], ['items', 'One line per item: “09:30 Morning technique”', 'area']]
  };

  function editor(id) {
    var c = id ? state.camps.filter(function (k) { return k.id === id; })[0] : blank();
    if (!c) { location.hash = 'dash'; return; }
    var sched = (c.schedule || []).map(function (d) { return { day: d.day, items: (d.items || []).map(function (i) { return (i.time ? i.time + ' ' : '') + i.title; }).join('\n') }; });
    var s = id ? statsFor(c) : null;
    app.innerHTML = shell('<form id="ef" class="adm-edit" novalidate>' +
      '<div class="adm-top"><div><a class="sub" href="#dash">← Camps</a><h1 class="display h-md">' + (id ? e(c.title) : 'New camp') + '<span class="dot">.</span></h1>' +
      (s ? '<span class="sub">' + s.people + (c.capacity ? '/' + c.capacity : '') + ' booked · ' + s.wl + ' waitlist · ' + money(s.received, c.currency) + ' received</span>' : '') + '</div>' +
      '<div class="row-btns">' + (id ? '<button type="button" class="btn btn-ghost" id="dup">Duplicate</button>' : '') + '<button class="btn btn-primary" type="submit">Save camp</button></div></div>' +

      sec('Basics', '<div class="g2">' + inp('title', 'Title', c.title, 'text', ' required') + inp('slug', 'Web address (auto)', c.slug, 'text', ' pattern="[a-z0-9-]{3,80}"') +
        sel('discipline', 'Discipline', c.discipline, H.DISC) + sel('status', 'Status', c.status, STATUS) +
        inp('start_date', 'Start date', c.start_date, 'date') + inp('end_date', 'End date', c.end_date, 'date') +
        inp('city', 'City', c.city) + inp('country', 'Country', c.country) + inp('venue', 'Venue', c.venue) + inp('level', 'Level', c.level) +
        '<label class="chk"><input type="checkbox" name="featured"' + (c.featured ? ' checked' : '') + '> Feature this camp</label></div>' +
        area('summary', 'Card summary (1–2 sentences)', c.summary) + area('description', 'Full description (blank line = new paragraph)', c.description)) +

      sec('Photos & location', photosHtml(c) +
        '<div class="g2">' + sel('venue_key', 'Venue', c.venue_key || '', venueOpts()) + inp('address', 'Address (for the map)', c.address) +
        inp('map_url', 'Google Maps link (optional)', c.map_url, 'url', ' placeholder="https://maps.app.goo.gl/…"') + '</div>' +
        area('venue_info', 'Venue notes (extra details for this camp)', c.venue_info, 'Rooms, transfers, what to bring…') +
        '<p class="note">Choosing a venue adds its photos, facilities, meals and map to the camp page. Your own photos above appear first.</p>') +

      sec('Spots & pricing', '<div class="g3">' + inp('capacity', 'Capacity (people)', c.capacity, 'number', ' min="1"') +
        sel('currency', 'Currency', c.currency, { EUR: 'EUR €', GEL: 'GEL ₾', USD: 'USD $' }) + inp('deposit_pct', 'Deposit %', c.deposit_pct, 'number', ' min="0" max="100"') +
        inp('payment_days', 'Days to pay deposit', c.payment_days, 'number', ' min="1" max="60"') + inp('early_bird_deadline', 'Early-bird ends', c.early_bird_deadline, 'date') +
        inp('registration_deadline', 'Registration closes', c.registration_deadline, 'date') +
        inp('group_min', 'Group discount from (people)', c.group_min, 'number', ' min="2"') + inp('group_discount_pct', 'Group discount %', c.group_discount_pct, 'number', ' min="0" max="50"') + '</div>' +
        '<h3 class="sub-h">Packages</h3>' + rep('packages', c.packages || [], F.packages, 'Add package +') +
        '<h3 class="sub-h">Add-ons</h3>' + rep('addons', c.addons || [], F.addons, 'Add add-on +') +
        area('bank_details', 'Bank transfer details (shown after registering)', c.bank_details, 'Bank, account holder, IBAN, SWIFT…')) +

      sec('Programme', '<h3 class="sub-h">Schedule</h3>' + rep('schedule', sched, F.schedule, 'Add day +') +
        '<div class="g2">' + area('included', 'Included (one per line)', (c.included || []).join('\n')) + area('excluded', 'Not included (one per line)', (c.excluded || []).join('\n')) + '</div>' +
        '<h3 class="sub-h">Coaches</h3>' + rep('coaches', c.coaches || [], F.coaches, 'Add coach +') +
        '<h3 class="sub-h">FAQ</h3>' + rep('faq', c.faq || [], F.faq, 'Add question +')) +

      '<div class="adm-foot"><button class="btn btn-primary" type="submit">Save camp</button>' + (id ? '<button type="button" class="btn btn-ghost danger" id="del">Delete camp</button>' : '') + '<p class="form-msg"></p></div></form>', 'dash');

    var form = $('#ef');
    wirePhotos(c);
    var title = form.elements.title, slug = form.elements.slug, touched = !!c.slug;
    slug.addEventListener('input', function () { touched = true; });
    title.addEventListener('input', function () { if (!touched) slug.value = slugify(title.value); });
    $$('.add-row').forEach(function (b) { b.addEventListener('click', function () { var k = b.dataset.key; $('.rep[data-key="' + k + '"]').insertAdjacentHTML('beforeend', repRow(F[k], {})); }); });
    form.addEventListener('click', function (ev) { if (ev.target.classList.contains('rep-x')) ev.target.closest('.rep-row').remove(); });
    form.addEventListener('submit', function (ev) { ev.preventDefault(); save(c, form); });
    if (id) {
      $('#del').addEventListener('click', function () {
        var n = statsFor(c).count;
        if (!confirm('Delete “' + c.title + '”' + (n ? ' and its ' + n + ' registrations' : '') + '? This cannot be undone. (Tip: set status to Cancelled or Completed instead.)')) return;
        H.api.deleteCamp(c.id).then(function () { toast('Camp deleted'); location.hash = 'dash'; return load(); }).catch(function (err) { toast(err.message, true); });
      });
      $('#dup').addEventListener('click', function () {
        var copy = JSON.parse(JSON.stringify(c)); delete copy.id; copy.title += ' (copy)'; copy.slug = (c.slug + '-copy').slice(0, 80); copy.status = 'draft';
        H.api.saveCamp(copy).then(function (n) { toast('Duplicated as draft'); return load().then(function () { location.hash = 'edit/' + n.id; }); }).catch(function (err) { toast(err.message, true); });
      });
    }
  }
  function venueOpts() {
    var o = { '': '— None —' }, V = window.CHD_VENUES || {};
    Object.keys(V).forEach(function (k) { o[k] = V[k].name + ' — ' + V[k].place; }); return o;
  }
  function photosHtml(c) {
    var gal = (c.gallery || []);
    return '<div class="ph-wrap"><div class="ph-cover"><span class="rf-l">Cover photo</span><div class="ph-slot" id="ph-cover">' +
      (c.cover_url ? '<img src="' + e(c.cover_url) + '" alt=""><button type="button" class="ph-x" data-cover aria-label="Remove cover">×</button>' : '<span>No cover — the venue’s photo is used</span>') +
      '</div><label class="btn btn-ghost ph-btn">Upload cover<input type="file" accept="image/*" id="ph-cover-in" hidden></label></div>' +
      '<div class="ph-gal"><span class="rf-l">Gallery</span><div class="ph-grid" id="ph-grid">' +
      gal.map(function (g, i) { return '<figure data-i="' + i + '"><img src="' + e(g.url) + '" alt=""><button type="button" class="ph-x" aria-label="Remove photo">×</button></figure>'; }).join('') +
      '</div><label class="btn btn-ghost ph-btn">Add photos<input type="file" accept="image/*" multiple id="ph-gal-in" hidden></label><p class="form-msg" id="ph-msg"></p></div></div>';
  }
  function shrink(file, max) {
    return new Promise(function (res, rej) {
      var img = new Image(), url = URL.createObjectURL(file);
      img.onload = function () {
        var k = Math.min(1, max / Math.max(img.width, img.height)), w = Math.round(img.width * k), h = Math.round(img.height * k);
        var cv = document.createElement('canvas'); cv.width = w; cv.height = h; cv.getContext('2d').drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url); cv.toBlob(function (b) { b ? res(b) : rej(new Error('Could not read image')); }, 'image/jpeg', 0.82);
      };
      img.onerror = function () { rej(new Error('Could not read image')); }; img.src = url;
    });
  }
  function wirePhotos(c) {
    var msg = $('#ph-msg');
    function up(file) { return shrink(file, H.mode === 'demo' ? 1100 : 2000).then(function (b) { return H.api.upload(b, (file.name || 'photo').replace(/[^a-z0-9.]+/gi, '-').replace(/\.[^.]+$/, '') + '.jpg'); }); }
    function redraw() {
      $('#ph-cover').innerHTML = c.cover_url ? '<img src="' + e(c.cover_url) + '" alt=""><button type="button" class="ph-x" data-cover aria-label="Remove cover">×</button>' : '<span>No cover — the venue’s photo is used</span>';
      $('#ph-grid').innerHTML = (c.gallery || []).map(function (g, i) { return '<figure data-i="' + i + '"><img src="' + e(g.url) + '" alt=""><button type="button" class="ph-x" aria-label="Remove photo">×</button></figure>'; }).join('');
    }
    $('#ph-cover-in').addEventListener('change', function () {
      var f = this.files[0]; if (!f) return; msg.className = 'form-msg'; msg.textContent = 'Uploading…';
      up(f).then(function (u) { c.cover_url = u; redraw(); msg.textContent = 'Cover uploaded — remember to save the camp.'; })
        .catch(function (err) { msg.className = 'form-msg err'; msg.textContent = err.message; });
      this.value = '';
    });
    $('#ph-gal-in').addEventListener('change', function () {
      var fs = [].slice.call(this.files); if (!fs.length) return; var n = 0; msg.className = 'form-msg'; msg.textContent = 'Uploading 0 / ' + fs.length + '…';
      fs.reduce(function (p, f) { return p.then(function () { return up(f).then(function (u) { c.gallery = (c.gallery || []).concat([{ url: u, alt: '' }]); n++; msg.textContent = 'Uploading ' + n + ' / ' + fs.length + '…'; redraw(); }); }); }, Promise.resolve())
        .then(function () { msg.textContent = fs.length + ' photo' + (fs.length > 1 ? 's' : '') + ' uploaded — remember to save the camp.'; })
        .catch(function (err) { msg.className = 'form-msg err'; msg.textContent = err.message; });
      this.value = '';
    });
    app.querySelector('.ph-wrap').addEventListener('click', function (ev) {
      var x = ev.target.closest('.ph-x'); if (!x) return;
      if (x.hasAttribute('data-cover')) c.cover_url = null; else { var i = +x.closest('figure').dataset.i; c.gallery = c.gallery.filter(function (_, k) { return k !== i; }); }
      redraw();
    });
  }
  function sec(t, inner) { return '<section class="adm-sec"><h2>' + t + '</h2>' + inner + '</section>'; }

  function read(form, key) {
    return $$('.rep[data-key="' + key + '"] .rep-row', form).map(function (row) {
      var o = {}; $$('[data-f]', row).forEach(function (i) { o[i.dataset.f] = i.value.trim(); }); return o;
    });
  }
  function save(c, form) {
    var msg = form.querySelector('.adm-foot .form-msg'), E = form.elements;
    var num = function (v) { return v === '' || v == null ? null : +v; };
    var lines = function (v) { return v.split('\n').map(function (s) { return s.trim(); }).filter(Boolean); };
    var o = { id: c.id };
    ['title', 'slug', 'discipline', 'status', 'city', 'country', 'venue', 'level', 'summary', 'description', 'currency', 'bank_details', 'address', 'map_url', 'venue_info'].forEach(function (k) { o[k] = E[k].value.trim(); });
    o.venue_key = E.venue_key.value || null; o.cover_url = c.cover_url || null; o.gallery = c.gallery || [];
    ['start_date', 'end_date', 'early_bird_deadline', 'registration_deadline'].forEach(function (k) { o[k] = E[k].value || null; });
    o.capacity = num(E.capacity.value); o.deposit_pct = num(E.deposit_pct.value) || 0; o.payment_days = num(E.payment_days.value) || 7;
    o.group_min = num(E.group_min.value); o.group_discount_pct = num(E.group_discount_pct.value) || 0; o.featured = E.featured.checked;
    o.slug = o.slug || slugify(o.title);
    var used = {};
    o.packages = read(form, 'packages').filter(function (p) { return p.name; }).map(function (p) {
      var id = slugify(p.name) || 'pkg'; while (used[id]) id += '-2'; used[id] = 1;
      return { id: id, name: p.name, description: p.description, price: num(p.price), early_price: p.early_price === '' ? null : num(p.early_price) };
    });
    used = {};
    o.addons = read(form, 'addons').filter(function (a) { return a.name; }).map(function (a) { var id = slugify(a.name) || 'addon'; while (used[id]) id += '-2'; used[id] = 1; return { id: id, name: a.name, price: num(a.price) || 0 }; });
    o.schedule = read(form, 'schedule').filter(function (d) { return d.day || d.items; }).map(function (d) {
      return { day: d.day, items: lines(d.items || '').map(function (l) { var m = l.match(/^(\d{1,2}[:.]\d{2})\s+(.*)$/); return m ? { time: m[1].replace('.', ':'), title: m[2] } : { time: '', title: l }; }) };
    });
    o.included = lines(E.included.value); o.excluded = lines(E.excluded.value);
    o.coaches = read(form, 'coaches').filter(function (k) { return k.name; });
    o.faq = read(form, 'faq').filter(function (f) { return f.q; });

    var errs = [];
    if (!o.title) errs.push('Add a title.');
    if (!/^[a-z0-9-]{3,80}$/.test(o.slug)) errs.push('Web address: 3+ lowercase letters, numbers or dashes.');
    if (o.status === 'published') {
      if (!o.start_date) errs.push('Published camps need a start date.');
      if (!o.packages.length || o.packages.some(function (p) { return p.price == null; })) errs.push('Published camps need at least one package with a price.');
      if (!o.bank_details) errs.push('Add bank details so people know how to pay the deposit.');
    }
    if (o.end_date && o.start_date && o.end_date < o.start_date) errs.push('End date is before start date.');
    if (errs.length) { msg.className = 'form-msg err'; msg.textContent = errs.join(' '); toast(errs[0], true); return; }
    msg.className = 'form-msg'; msg.textContent = 'Saving…';
    H.api.saveCamp(o).then(function (saved) {
      toast('Camp saved'); return load().then(function () { location.hash = 'edit/' + saved.id; route(); });
    }).catch(function (err) {
      var m = /duplicate|unique/i.test(err.message) ? 'That web address is already used by another camp.' : err.message;
      msg.className = 'form-msg err'; msg.textContent = m; toast(m, true);
    });
  }

  if (H.api.signedIn()) load(); else login();
})();
