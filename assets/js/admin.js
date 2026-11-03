// CHIDAOBA CULTURE, admin panel (camps & registrations)
(function () {
  var H = window.CHD, app = document.getElementById('admin');
  if (!H || !app) return;
  var e = H.esc, $ = function (s, r) { return (r || app).querySelector(s); }, $$ = function (s, r) { return [].slice.call((r || app).querySelectorAll(s)); };
  var STATUS = { draft: 'Draft', published: 'Published', sold_out: 'Sold out', cancelled: 'Cancelled', completed: 'Completed' };
  var RSTATUS = { pending: 'New request', deposit_paid: 'Confirmed', paid: 'Paid', waitlist: 'Waitlist', cancelled: 'Cancelled' };
  var state = { camps: [], regs: [], view: 'dash', camp: null, filter: 'all', q: '' };

  if (H.mode === 'empty') {
    app.innerHTML = box('<p class="label"><span class="bar"></span>Admin</p><h1 class="display h-md">Connect the database<span class="dot">.</span></h1>' +
      '<p class="body">The admin panel needs Supabase. Add your project URL and anon key to <code>assets/js/config.js</code>.</p>' +
      '<p class="body">Want to try it first? <a href="?demo=1">Open the demo</a> (sample data, saved in this browser only).</p>');
    return;
  }
  if (H.mode === 'demo') {
    var bar = document.createElement('div'); bar.className = 'demo-bar';
    bar.innerHTML = 'Demo mode: sample data in this browser only. <a href="#" id="demo-reset">Reset demo</a> · <a href="?demo=0">Exit</a>';
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
      H.api.messages().then(function (m) { state.msgs = m || []; if (!/^#(edit|new|product)/.test(location.hash)) route(); }).catch(function () { });
    }).catch(function (err) { if (/sign in|JWT|expired/i.test(err.message)) { H.api.signOut(); login(); } else app.innerHTML = box('<p class="body">' + e(err.message) + '</p>'); });
  }
  function shell(inner, tab) {
    return '<header class="adm-head"><a class="adm-brand" href="#dash"><img src="/assets/img/symbol-chalk.svg" alt="" width="20" height="28"> Admin</a>' +
      '<nav>' + [['dash', 'Camps'], ['regs', 'Requests'], ['shop', 'Shop'], ['subs', 'Signups'], ['msgs', 'Messages'], ['vis', 'Visitors']].map(function (t) {
        var n = t[0] === 'msgs' ? (state.msgs || []).filter(function (m) { return m.status === 'new'; }).length : t[0] === 'regs' ? state.regs.filter(function (r) { return r.status === 'pending'; }).length : 0;
        return '<a href="#' + t[0] + '"' + (tab === t[0] ? ' class="on"' : '') + '>' + t[1] + (n ? '<i class="nav-n">' + n + '</i>' : '') + '</a>';
      }).join('') + '<a href="/" target="_blank">View site ↗</a></nav>' +
      '<button type="button" class="adm-out">Sign out</button></header><main class="adm-main">' + inner + '</main>';
  }
  function route() {
    var h = location.hash.replace('#', '');
    if (h.indexOf('edit/') === 0) return editor(h.slice(5));
    if (h === 'new') return editor(null);
    if (h.indexOf('regs') === 0) return regsView(h.split('/')[1] || 'all');
    if (h === 'shop') return shopView();
    if (h === 'product-new') return productEditor(null);
    if (h.indexOf('product/') === 0) return productEditor(decodeURIComponent(h.slice(8)));
    if (h === 'subs') return subsView();
    if (h === 'msgs') return msgsView();
    if (h === 'vis') return visView();
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
    var received = rs.reduce(function (s, r) { return s + (r.status === 'paid' ? +r.total : 0); }, 0);
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
        '<td>' + money(s.booked, c.currency) + '</td><td>' + money(s.received, c.currency) + (s.unpaid ? '<span class="sub warn">' + s.unpaid + ' new request' + (s.unpaid > 1 ? 's' : '') + '</span>' : '') + '</td>' +
        '<td class="act"><a href="#regs/' + c.id + '">Requests</a><a href="#edit/' + c.id + '">Edit</a>' + (c.status !== 'draft' ? '<a href="/camps/camp/?c=' + encodeURIComponent(c.slug) + '" target="_blank">View ↗</a>' : '') + '</td></tr>';
    }).join('');
    app.innerHTML = shell(
      '<div class="adm-top"><h1 class="display h-md">Camps<span class="dot">.</span></h1><a class="btn btn-primary" href="#new">New camp +</a></div>' +
      '<div class="kpis"><div><span>People signed up</span><b>' + tot.people + '</b></div><div><span>Expected value</span><b>' + money(tot.booked, cur) + '</b></div>' +
      '<div><span>Paid</span><b>' + money(tot.received, cur) + '</b></div><div><span>New requests</span><b>' + tot.unpaid + '</b></div></div>' +
      (state.camps.length ? '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Camp</th><th>Status</th><th>Signed up</th><th>Value</th><th>Paid</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div>'
        : '<p class="body">No camps yet. <a href="#new">Create your first camp →</a></p>') +
      '<p class="note">Totals are per currency of each camp; the summary uses ' + cur + '.</p>', 'dash');
  }

  // ---------------- registrations ----------------
  function regsView(campId) {
    var camps = state.camps, camp = camps.filter(function (c) { return c.id === campId; })[0];
    var name = function (id) { var c = camps.filter(function (k) { return k.id === id; })[0]; return c ? c.title : '-'; };
    var cur = function (id) { var c = camps.filter(function (k) { return k.id === id; })[0]; return c ? c.currency : 'EUR'; };
    var list = state.regs.filter(function (r) { return (!camp || r.camp_id === campId) && (state.filter === 'all' || r.status === state.filter); })
      .filter(function (r) { var q = state.q.toLowerCase(); return !q || [r.full_name, r.email, r.ref, r.phone, r.country, r.club].join(' ').toLowerCase().indexOf(q) >= 0; });
    var opts = '<option value="all">All camps</option>' + camps.map(function (c) { return '<option value="' + c.id + '"' + (c.id === campId ? ' selected' : '') + '>' + e(c.title) + '</option>'; }).join('');
    var fopts = '<option value="all">Any status</option>' + Object.keys(RSTATUS).map(function (k) { return '<option value="' + k + '"' + (state.filter === k ? ' selected' : '') + '>' + RSTATUS[k] + '</option>'; }).join('');
    var rows = list.map(function (r) {
      var wa = r.phone ? 'https://wa.me/' + r.phone.replace(/[^0-9]/g, '') + '?text=' + encodeURIComponent('Hi ' + (r.full_name || '').split(' ')[0] + ', this is CHIDAOBA about your camp request ' + r.ref + '.') : null;
      return '<tr data-id="' + r.id + '"><td><b>' + e(r.full_name) + '</b><span class="sub">' + e(r.ref) + ' · ' + new Date(r.created_at).toLocaleDateString('en-GB') + '</span>' + (camp ? '' : '<span class="sub">' + e(name(r.camp_id)) + '</span>') + '</td>' +
        '<td><a href="mailto:' + e(r.email) + '?subject=' + encodeURIComponent('Your camp request ' + r.ref) + '">' + e(r.email) + '</a>' + (wa ? '<span class="sub"><a href="' + wa + '" target="_blank" rel="noopener">WhatsApp ' + e(r.phone) + '</a></span>' : '') + '<span class="sub">' + e([r.country, r.age ? r.age + ' y' : '', r.experience, r.level, r.club].filter(Boolean).join(' · ')) + '</span></td>' +
        '<td>' + e(r.package_name) + (r.addons && r.addons.length ? '<span class="sub">+ ' + r.addons.map(function (a) { return e(a.name); }).join(', ') + '</span>' : '') + '<span class="sub">' + r.people + ' ' + (r.people > 1 ? 'people' : 'person') + '</span></td>' +
        '<td><b>' + money(r.total, cur(r.camp_id)) + '</b></td>' +
        '<td><select class="rs s-' + r.status + '">' + Object.keys(RSTATUS).map(function (k) { return '<option value="' + k + '"' + (r.status === k ? ' selected' : '') + '>' + RSTATUS[k] + '</option>'; }).join('') + '</select>' +
        '<input class="rn" placeholder="Note…" value="' + e(r.admin_note || '') + '">' + (r.notes ? '<span class="sub">“' + e(r.notes) + '”</span>' : '') + '</td></tr>';
    }).join('');
    app.innerHTML = shell('<div class="adm-top"><h1 class="display h-md">Requests<span class="dot">.</span></h1><button class="btn btn-ghost" type="button" id="csv">Export CSV</button></div>' +
      '<div class="adm-filters"><select id="fc">' + opts + '</select><select id="fs">' + fopts + '</select><input id="fq" type="search" placeholder="Search name, email, code…" value="' + e(state.q) + '"><span class="sub">' + list.length + ' shown</span></div>' +
      (list.length ? '<div class="tbl-wrap"><table class="tbl regs"><thead><tr><th>Name</th><th>Contact</th><th>Package</th><th>Amount</th><th>Status</th></tr></thead><tbody>' + rows + '</tbody></table></div>' : '<p class="body">No requests yet.</p>'), 'regs');
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
    var cols = ['ref', 'created_at', 'camp', 'status', 'full_name', 'email', 'phone', 'country', 'age', 'experience', 'level', 'club', 'package_name', 'addons', 'people', 'total', 'notes', 'admin_note'];
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
      addons: [], schedule: [], included: [], excluded: [], coaches: [], faq: [], cover_url: null, gallery: [], venue_key: '', address: '', map_url: '', venue_info: '',
      intensity: null, age_min: null, age_max: null, fit_for: [], bring: [], reviews: [], ka: {}, show_urgency: true };
  }
  function slugify(t) { return (t || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70); }
  function inp(n, l, v, t, extra) { return '<div class="field"><label for="e-' + n + '">' + l + '</label><input id="e-' + n + '" name="' + n + '" type="' + (t || 'text') + '" value="' + e(v == null ? '' : v) + '"' + (extra || '') + '></div>'; }
  function sel(n, l, v, o) { return '<div class="field"><label for="e-' + n + '">' + l + '</label><select id="e-' + n + '" name="' + n + '">' + Object.keys(o).map(function (k) { return '<option value="' + k + '"' + (k === v ? ' selected' : '') + '>' + o[k] + '</option>'; }).join('') + '</select></div>'; }
  function area(n, l, v, ph) { return '<div class="field full"><label for="e-' + n + '">' + l + '</label><textarea id="e-' + n + '" name="' + n + '" placeholder="' + e(ph || '') + '">' + e(v || '') + '</textarea></div>'; }
  function kaInp(n, l, v, isArea) {
    return '<div class="field ka-f' + (isArea ? ' full' : '') + '"><label for="e-ka-' + n + '">' + l + ' <em>ქართული</em></label>' +
      (isArea ? '<textarea id="e-ka-' + n + '" name="ka_' + n + '">' + e(v || '') + '</textarea>' : '<input id="e-ka-' + n + '" name="ka_' + n + '" value="' + e(v || '') + '">') + '</div>';
  }
  function rep(key, items, fields, addLabel) {
    return '<div class="rep" data-key="' + key + '">' + items.map(function (it) { return repRow(fields, it); }).join('') +
      '</div><button type="button" class="btn btn-ghost add-row" data-key="' + key + '">' + addLabel + '</button>';
  }
  function fieldHtml(f, it, ka) {
    var k = f[0] + (ka ? '_ka' : ''), t = f[2] || 'text', o = f[4] || {}, lab = f[1] + (ka ? ' <em>ქართული</em>' : '');
    var v = it[k] == null ? '' : it[k], cls = 'rf' + (f[3] ? ' ' + f[3] : '') + (ka ? ' ka-f' : '');
    if (t === 'lines') return '<label class="' + cls + ' w"><span>' + lab + '</span><textarea data-f="' + k + '" data-lines placeholder="One per line">' + e(Array.isArray(v) ? v.join('\n') : v) + '</textarea></label>';
    if (t === 'area') return '<label class="' + cls + ' w"><span>' + lab + '</span><textarea data-f="' + k + '">' + e(v) + '</textarea></label>';
    if (t === 'select') return '<label class="' + cls + '"><span>' + lab + '</span><select data-f="' + k + '">' + Object.keys(o.opts).map(function (x) { return '<option value="' + e(x) + '"' + (String(v) === x ? ' selected' : '') + '>' + e(o.opts[x]) + '</option>'; }).join('') + '</select></label>';
    if (t === 'photo') return '<div class="' + cls + ' rf-ph"><span>' + lab + '</span><input type="hidden" data-f="' + k + '" value="' + e(v) + '"><div class="rph">' + (v ? '<img src="' + e(v) + '" alt="">' : '<i>No photo</i>') + '</div>' +
      '<label class="btn btn-ghost rph-up">' + (v ? 'Change' : 'Upload') + '<input type="file" accept="image/*" hidden></label>' + (v ? '<button type="button" class="rph-x">Remove</button>' : '') + '</div>';
    return '<label class="' + cls + '"><span>' + lab + '</span><input data-f="' + k + '" type="' + t + '" value="' + e(v) + '"' + (t === 'number' ? ' step="any" min="0"' : '') + '></label>';
  }
  function repRow(fields, it) {
    it = it || {};
    return '<div class="rep-row">' + fields.map(function (f) { return fieldHtml(f, it) + ((f[4] || {}).ka ? fieldHtml(f, it, true) : ''); }).join('') +
      '<div class="rep-tools"><button type="button" class="rep-up" aria-label="Move up" title="Move up">↑</button><button type="button" class="rep-dn" aria-label="Move down" title="Move down">↓</button><button type="button" class="rep-x" aria-label="Remove" title="Remove">×</button></div></div>';
  }
  var KA = { ka: true };
  var shopOpts = function () { var o = { '': 'No shop link' }, S = window.CHD_SHOP || {}; Object.keys(S).forEach(function (k) { o[k] = S[k].name + ' (' + S[k].cat + ')'; }); return o; };
  var F = {
    packages: [['name', 'Package name', 'text', '', KA], ['price', 'Price', 'number', 's'], ['early_price', 'Early-bird price', 'number', 's'],
      ['description', 'Short description', 'text', 'w', KA], ['features', 'What’s included (one per line, for the comparison table)', 'lines', 'w', KA]],
    addons: [['name', 'Add-on', 'text', '', KA], ['price', 'Price', 'number', 's']],
    coaches: [['photo', 'Photo', 'photo'], ['name', 'Name'], ['role', 'Role / rank (e.g. BJJ black belt)', 'text', '', KA], ['titles', 'Titles and achievements (one per line)', 'lines', 'w', KA], ['bio', 'Short bio', 'area', '', KA]],
    faq: [['q', 'Question', 'text', 'w', KA], ['a', 'Answer', 'area', '', KA]],
    schedule: [['day', 'Day / label', 'text', 's', KA], ['items', 'One line per item: “09:30 Morning technique”', 'area'], ['items_ka', 'Same lines in Georgian (titles only, same order)', 'area', 'ka-f']],
    bring: [['item', 'Item', 'text', '', KA], ['shop', 'Link to shop product', 'select', '', { opts: shopOpts() }]],
    reviews: [['name', 'Name'], ['from', 'Country / club'], ['rating', 'Stars', 'select', 's', { opts: { '5': '★★★★★', '4': '★★★★', '3': '★★★', '': 'No stars' } }], ['text', 'Review', 'area', '', KA]]
  };

  function editor(id) {
    var c = id ? state.camps.filter(function (k) { return k.id === id; })[0] : blank();
    if (!c) { location.hash = 'dash'; return; }
    var sched = (c.schedule || []).map(function (d) { return { day: d.day, day_ka: d.day_ka, items: (d.items || []).map(function (i) { return (i.time ? i.time + ' ' : '') + i.title; }).join('\n'), items_ka: (d.items || []).map(function (i) { return i.title_ka || ''; }).join('\n').replace(/^\n+$/, '') }; });
    var K = c.ka || {}, kaOn = localStorage.getItem('chd_adm_ka') === '1';
    var INT = { '': 'Not set', '1': '1 · Light', '2': '2 · Moderate', '3': '3 · Hard', '4': '4 · Very hard', '5': '5 · Competition level' };
    var s = id ? statsFor(c) : null;
    app.innerHTML = shell('<form id="ef" class="adm-edit' + (kaOn ? ' show-ka' : '') + '" novalidate>' +
      '<div class="adm-top"><div><a class="sub" href="#dash">← Camps</a><h1 class="display h-md">' + (id ? e(c.title) : 'New camp') + '<span class="dot">.</span></h1>' +
      (s ? '<span class="sub">' + s.people + (c.capacity ? '/' + c.capacity : '') + ' booked · ' + s.wl + ' waitlist · ' + money(s.received, c.currency) + ' received</span>' : '') + '</div>' +
      '<div class="row-btns">' + (id ? '<button type="button" class="btn btn-ghost" id="dup">Duplicate</button>' : '') + '<button class="btn btn-primary" type="submit">Save camp</button></div></div>' +
      '<label class="ka-toggle"><input type="checkbox" id="ka-on"' + (kaOn ? ' checked' : '') + '> Show Georgian fields <span>ქართული ვერსია</span></label>' +

      sec('Basics', '<div class="g2">' + inp('title', 'Title', c.title, 'text', ' required') + inp('slug', 'Web address (auto)', c.slug, 'text', ' pattern="[a-z0-9-]{3,80}"') +
        sel('discipline', 'Discipline', c.discipline, H.DISC) + sel('status', 'Status', c.status, STATUS) +
        inp('start_date', 'Start date', c.start_date, 'date') + inp('end_date', 'End date', c.end_date, 'date') +
        inp('city', 'City', c.city) + inp('country', 'Country', c.country) + inp('venue', 'Venue', c.venue) + inp('level', 'Level', c.level) +
        '<label class="chk"><input type="checkbox" name="featured"' + (c.featured ? ' checked' : '') + '> Feature this camp</label></div>' +
        '<div class="g2 ka-g">' + kaInp('title', 'Title', K.title) + kaInp('level', 'Level', K.level) + '</div>' +
        area('summary', 'Card summary (1–2 sentences)', c.summary) + kaInp('summary', 'Card summary', K.summary, true) +
        area('description', 'Full description (blank line = new paragraph)', c.description) + kaInp('description', 'Full description', K.description, true)) +

      sec('Who it’s for', '<div class="g3">' + sel('intensity', 'Intensity', c.intensity == null ? '' : String(c.intensity), INT) +
        inp('age_min', 'Minimum age', c.age_min, 'number', ' min="5" max="99"') + inp('age_max', 'Maximum age (optional)', c.age_max, 'number', ' min="5" max="99"') + '</div>' +
        area('fit_for', '“Good for you if” (one per line)', (c.fit_for || []).join('\n'), 'You have trained 6 months or more…') + kaInp('fit_for', '“Good for you if”', (K.fit_for || []).join('\n'), true) +
        '<label class="chk"><input type="checkbox" name="show_urgency"' + (c.show_urgency === false ? '' : ' checked') + '> Show “Early-bird ends in X days” and “Only X spots left”</label>') +

      sec('Photos & location', photosHtml(c) +
        '<div class="g2">' + sel('venue_key', 'Venue', c.venue_key || '', venueOpts()) + inp('address', 'Address (for the map)', c.address) +
        inp('map_url', 'Google Maps link (optional)', c.map_url, 'url', ' placeholder="https://maps.app.goo.gl/…"') + '</div>' +
        area('venue_info', 'Venue notes (extra details for this camp)', c.venue_info, 'Rooms, transfers…') + kaInp('venue_info', 'Venue notes', K.venue_info, true) +
        '<p class="note">Choosing a venue adds its photos, facilities, meals and map to the camp page. Your own photos above appear first.</p>') +

      sec('Spots & pricing', '<div class="g3">' + inp('capacity', 'Capacity (people)', c.capacity, 'number', ' min="1"') +
        sel('currency', 'Currency', c.currency, { EUR: 'EUR €', GEL: 'GEL ₾', USD: 'USD $' }) +
        inp('early_bird_deadline', 'Early-bird ends', c.early_bird_deadline, 'date') +
        inp('registration_deadline', 'Registration closes', c.registration_deadline, 'date') +
        inp('group_min', 'Group discount from (people)', c.group_min, 'number', ' min="2"') + inp('group_discount_pct', 'Group discount %', c.group_discount_pct, 'number', ' min="0" max="50"') + '</div>' +
        '<h3 class="sub-h">Packages</h3>' + rep('packages', c.packages || [], F.packages, 'Add package +') +
        '<h3 class="sub-h">Add-ons</h3>' + rep('addons', c.addons || [], F.addons, 'Add add-on +') ) +

      sec('Programme', '<h3 class="sub-h">Schedule</h3>' + rep('schedule', sched, F.schedule, 'Add day +') +
        '<div class="g2">' + area('included', 'Included (one per line)', (c.included || []).join('\n')) + area('excluded', 'Not included (one per line)', (c.excluded || []).join('\n')) +
        kaInp('included', 'Included', (K.included || []).join('\n'), true) + kaInp('excluded', 'Not included', (K.excluded || []).join('\n'), true) + '</div>' +
        '<h3 class="sub-h">FAQ</h3>' + rep('faq', c.faq || [], F.faq, 'Add question +')) +

      sec('Coaches', rep('coaches', c.coaches || [], F.coaches, 'Add coach +')) +
      sec('What to bring', '<p class="note">Link an item to a shop product and the camp page shows “Get it in our shop”.</p>' + rep('bring', c.bring || [], F.bring, 'Add item +')) +
      sec('Reviews', '<p class="note">Add reviews from past camps. They appear under “What people say”.</p>' + rep('reviews', c.reviews || [], F.reviews, 'Add review +')) +

      '<div class="adm-foot"><button class="btn btn-primary" type="submit">Save camp</button>' + (id ? '<button type="button" class="btn btn-ghost danger" id="del">Delete camp</button>' : '') + '<p class="form-msg"></p></div></form>', 'dash');

    var form = $('#ef');
    wirePhotos(c);
    var title = form.elements.title, slug = form.elements.slug, touched = !!c.slug;
    slug.addEventListener('input', function () { touched = true; });
    title.addEventListener('input', function () { if (!touched) slug.value = slugify(title.value); });
    $$('.add-row').forEach(function (b) { b.addEventListener('click', function () { var k = b.dataset.key; $('.rep[data-key="' + k + '"]').insertAdjacentHTML('beforeend', repRow(F[k], {})); }); });
    var jump = document.createElement('nav'); jump.className = 'adm-jump';
    jump.innerHTML = $$('.adm-sec', form).map(function (x) { return '<button type="button">' + e(x.dataset.sec) + '</button>'; }).join('');
    form.querySelector('.ka-toggle').after(jump);
    jump.addEventListener('click', function (ev) { var b = ev.target.closest('button'); if (!b) return; var i = [].indexOf.call(jump.children, b); var t = $$('.adm-sec', form)[i]; window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY - 70, behavior: 'smooth' }); });
    $('#ka-on').addEventListener('change', function () { form.classList.toggle('show-ka', this.checked); try { localStorage.setItem('chd_adm_ka', this.checked ? '1' : '0'); } catch (x) { } });
    form.addEventListener('click', function (ev) {
      var t = ev.target, row = t.closest('.rep-row');
      if (t.classList.contains('rep-x')) row.remove();
      else if (t.classList.contains('rep-up') && row.previousElementSibling) row.parentNode.insertBefore(row, row.previousElementSibling);
      else if (t.classList.contains('rep-dn') && row.nextElementSibling) row.parentNode.insertBefore(row.nextElementSibling, row);
      else if (t.classList.contains('rph-x')) { var w = t.closest('.rf-ph'); w.querySelector('[data-f]').value = ''; w.querySelector('.rph').innerHTML = '<i>No photo</i>'; t.remove(); }
    });
    form.addEventListener('change', function (ev) {
      var t = ev.target; if (!t.closest('.rph-up') || !t.files || !t.files[0]) return;
      var w = t.closest('.rf-ph'), f = t.files[0]; w.querySelector('.rph').innerHTML = '<i>Uploading…</i>';
      shrink(f, H.mode === 'demo' ? 600 : 900).then(function (b) { return H.api.upload(b, 'coach.jpg'); })
        .then(function (u) { w.querySelector('[data-f]').value = u; w.querySelector('.rph').innerHTML = '<img src="' + e(u) + '" alt="">'; toast('Photo uploaded. Remember to save.'); })
        .catch(function (err) { w.querySelector('.rph').innerHTML = '<i>Upload failed</i>'; toast(err.message, true); });
      t.value = '';
    });
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
    var o = { '': 'None' }, V = window.CHD_VENUES || {};
    Object.keys(V).forEach(function (k) { o[k] = V[k].name + ', ' + V[k].place; }); return o;
  }
  function photosHtml(c) {
    var gal = (c.gallery || []);
    return '<div class="ph-wrap"><div class="ph-cover"><span class="rf-l">Cover photo</span><div class="ph-slot" id="ph-cover">' +
      (c.cover_url ? '<img src="' + e(c.cover_url) + '" alt=""><button type="button" class="ph-x" data-cover aria-label="Remove cover">×</button>' : '<span>No cover yet. The venue’s photo is used</span>') +
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
      $('#ph-cover').innerHTML = c.cover_url ? '<img src="' + e(c.cover_url) + '" alt=""><button type="button" class="ph-x" data-cover aria-label="Remove cover">×</button>' : '<span>No cover yet. The venue’s photo is used</span>';
      $('#ph-grid').innerHTML = (c.gallery || []).map(function (g, i) { return '<figure data-i="' + i + '"><img src="' + e(g.url) + '" alt=""><button type="button" class="ph-x" aria-label="Remove photo">×</button></figure>'; }).join('');
    }
    $('#ph-cover-in').addEventListener('change', function () {
      var f = this.files[0]; if (!f) return; msg.className = 'form-msg'; msg.textContent = 'Uploading…';
      up(f).then(function (u) { c.cover_url = u; redraw(); msg.textContent = 'Cover uploaded. Remember to save the camp.'; })
        .catch(function (err) { msg.className = 'form-msg err'; msg.textContent = err.message; });
      this.value = '';
    });
    $('#ph-gal-in').addEventListener('change', function () {
      var fs = [].slice.call(this.files); if (!fs.length) return; var n = 0; msg.className = 'form-msg'; msg.textContent = 'Uploading 0 / ' + fs.length + '…';
      fs.reduce(function (p, f) { return p.then(function () { return up(f).then(function (u) { c.gallery = (c.gallery || []).concat([{ url: u, alt: '' }]); n++; msg.textContent = 'Uploading ' + n + ' / ' + fs.length + '…'; redraw(); }); }); }, Promise.resolve())
        .then(function () { msg.textContent = fs.length + ' photo' + (fs.length > 1 ? 's' : '') + ' uploaded. Remember to save the camp.'; })
        .catch(function (err) { msg.className = 'form-msg err'; msg.textContent = err.message; });
      this.value = '';
    });
    app.querySelector('.ph-wrap').addEventListener('click', function (ev) {
      var x = ev.target.closest('.ph-x'); if (!x) return;
      if (x.hasAttribute('data-cover')) c.cover_url = null; else { var i = +x.closest('figure').dataset.i; c.gallery = c.gallery.filter(function (_, k) { return k !== i; }); }
      redraw();
    });
  }
  function sec(t, inner) { return '<section class="adm-sec" data-sec="' + e(t) + '"><h2>' + t + '</h2>' + inner + '</section>'; }

  function read(form, key) {
    return $$('.rep[data-key="' + key + '"] .rep-row', form).map(function (row) {
      var o = {}; $$('[data-f]', row).forEach(function (i) { var v = i.value.trim(); o[i.dataset.f] = i.hasAttribute('data-lines') ? v.split('\n').map(function (x) { return x.trim(); }).filter(Boolean) : v; }); return o;
    });
  }
  function save(c, form) {
    var msg = form.querySelector('.adm-foot .form-msg'), E = form.elements;
    var num = function (v) { return v === '' || v == null ? null : +v; };
    var lines = function (v) { return v.split('\n').map(function (s) { return s.trim(); }).filter(Boolean); };
    var o = { id: c.id };
    ['title', 'slug', 'discipline', 'status', 'city', 'country', 'venue', 'level', 'summary', 'description', 'currency', 'address', 'map_url', 'venue_info'].forEach(function (k) { o[k] = E[k].value.trim(); });
    o.venue_key = E.venue_key.value || null; o.cover_url = c.cover_url || null; o.gallery = c.gallery || [];
    ['start_date', 'end_date', 'early_bird_deadline', 'registration_deadline'].forEach(function (k) { o[k] = E[k].value || null; });
    o.capacity = num(E.capacity.value); o.deposit_pct = 0;
    o.group_min = num(E.group_min.value); o.group_discount_pct = num(E.group_discount_pct.value) || 0; o.featured = E.featured.checked;
    o.slug = o.slug || slugify(o.title);
    var used = {};
    o.packages = read(form, 'packages').filter(function (p) { return p.name; }).map(function (p) {
      var id = slugify(p.name) || 'pkg'; while (used[id]) id += '-2'; used[id] = 1;
      return { id: id, name: p.name, name_ka: p.name_ka, description: p.description, description_ka: p.description_ka, features: p.features || [], features_ka: p.features_ka || [], price: num(p.price), early_price: p.early_price === '' ? null : num(p.early_price) };
    });
    used = {};
    o.addons = read(form, 'addons').filter(function (a) { return a.name; }).map(function (a) { var id = slugify(a.name) || 'addon'; while (used[id]) id += '-2'; used[id] = 1; return { id: id, name: a.name, name_ka: a.name_ka, price: num(a.price) || 0 }; });
    o.schedule = read(form, 'schedule').filter(function (d) { return d.day || d.items; }).map(function (d) {
      var kl = (d.items_ka || '').split('\n').map(function (x) { return x.trim().replace(/^\d{1,2}[:.]\d{2}\s+/, ''); });
      return { day: d.day, day_ka: d.day_ka, items: lines(d.items || '').map(function (l, i) { var m = l.match(/^(\d{1,2}[:.]\d{2})\s+(.*)$/); var it = m ? { time: m[1].replace('.', ':'), title: m[2] } : { time: '', title: l }; if (kl[i]) it.title_ka = kl[i]; return it; }) };
    });
    o.included = lines(E.included.value); o.excluded = lines(E.excluded.value);
    o.coaches = read(form, 'coaches').filter(function (k) { return k.name; });
    o.faq = read(form, 'faq').filter(function (f) { return f.q; });
    o.bring = read(form, 'bring').filter(function (b) { return b.item; });
    o.reviews = read(form, 'reviews').filter(function (r) { return r.text; }).map(function (r) { r.rating = r.rating ? +r.rating : null; return r; });
    o.intensity = num(E.intensity.value); o.age_min = num(E.age_min.value); o.age_max = num(E.age_max.value);
    o.fit_for = lines(E.fit_for.value); o.show_urgency = E.show_urgency.checked;
    o.ka = { title: E.ka_title.value.trim(), level: E.ka_level.value.trim(), summary: E.ka_summary.value.trim(), description: E.ka_description.value.trim(),
      venue_info: E.ka_venue_info.value.trim(), fit_for: lines(E.ka_fit_for.value), included: lines(E.ka_included.value), excluded: lines(E.ka_excluded.value) };

    var errs = [];
    if (!o.title) errs.push('Add a title.');
    if (!/^[a-z0-9-]{3,80}$/.test(o.slug)) errs.push('Web address: 3+ lowercase letters, numbers or dashes.');
    if (o.status === 'published') {
      if (!o.start_date) errs.push('Published camps need a start date.');
      if (!o.packages.length || o.packages.some(function (p) { return p.price == null; })) errs.push('Published camps need at least one package with a price.');
    }
    if (o.end_date && o.start_date && o.end_date < o.start_date) errs.push('End date is before start date.');
    if (o.age_min && o.age_max && o.age_max < o.age_min) errs.push('Maximum age is below minimum age.');
    if (errs.length) { msg.className = 'form-msg err'; msg.textContent = errs.join(' '); toast(errs[0], true); return; }
    msg.className = 'form-msg'; msg.textContent = 'Saving…';
    H.api.saveCamp(o).then(function (saved) {
      toast('Camp saved'); return load().then(function () { location.hash = 'edit/' + saved.id; route(); });
    }).catch(function (err) {
      var m = /duplicate|unique/i.test(err.message) ? 'That web address is already used by another camp.' : err.message;
      msg.className = 'form-msg err'; msg.textContent = m; toast(m, true);
    });
  }

  // ================= shared for the new sections =================
  var META = window.CHD_SHOP_META || { sports: [], cats: {}, audience: {}, guides: {}, drawings: [], colours: {}, dark: [], sizesets: {}, art: {} };
  function needUpdate(title) {
    return shell('<div class="adm-top"><h1 class="display h-md">' + title + '<span class="dot">.</span></h1></div>' +
      '<div class="adm-sec"><h2>One database update needed</h2><p class="body">This section needs <b>update-005.sql</b>. Open Supabase → SQL Editor → New query, paste the file and press Run. Then reload this page.</p></div>',
      title === 'Shop' ? 'shop' : title === 'Signups' ? 'subs' : 'msgs');
  }
  function fail(title) { return function (err) { if (err.message === 'NEEDS_UPDATE_005') app.innerHTML = needUpdate(title); else if (/sign in|expired/i.test(err.message)) { H.api.signOut(); login(); } else toast(err.message, true); }; }
  function artSvg(p, size) {
    var cols = p.colours || [], c = cols[0], hex = META.colours[c] || '#1E1E1E', dk = META.dark.indexOf(c) >= 0;
    if (p.photo_url) return '<img src="' + e(p.photo_url) + '" alt="">';
    return '<svg class="part" viewBox="0 0 120 120" style="--pc:' + hex + ';--pd:' + (dk ? 'rgba(255,255,255,.5)' : 'rgba(30,30,30,.45)') + (size ? ';width:' + size : '') + '">' + (META.art[p.drawing] || META.art.tshirt || '') + '</svg>';
  }
  var sportName = function (k) { var x = META.sports.filter(function (s) { return s[0] === k; })[0]; return x ? x[1] : k; };
  var catName = function (sp, k) { var x = (META.cats[sp] || []).filter(function (c) { return c[0] === k; })[0]; return x ? x[1] : k; };
  var PSTATUS = { active: 'In the shop', sold_out: 'Sold out', hidden: 'Hidden' };
  function dl(name, text, type) { var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + text], { type: type || 'text/csv' })); a.download = name; a.click(); }
  function csvLine(vals) { return vals.map(function (v) { v = v == null ? '' : String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(','); }

  // ================= shop =================
  state.shop = { sport: 'all', q: '' };
  function shopView() {
    app.innerHTML = shell('<p class="adm-loading">Loading products…</p>', 'shop');
    H.api.adminProducts().then(function (list) { state.products = list || []; drawShop(); }).catch(fail('Shop'));
  }
  function drawShop() {
    var f = state.shop, q = f.q.toLowerCase();
    var list = state.products.filter(function (p) { return (f.sport === 'all' || p.sport === f.sport) && (!q || (p.name + ' ' + (p.name_ka || '') + ' ' + p.id).toLowerCase().indexOf(q) >= 0); });
    var groups = META.sports.filter(function (s) { return f.sport === 'all' || s[0] === f.sport; }).map(function (s) {
      var ci = (META.cats[s[0]] || []).map(function (c) { return c[0]; });
      var items = list.filter(function (p) { return p.sport === s[0]; }).sort(function (a, b) { return ci.indexOf(a.category) - ci.indexOf(b.category) || a.sort - b.sort; });
      if (!items.length) return '';
      return '<h2 class="sub-h">' + e(s[1]) + ' <em class="cnt">' + items.length + '</em></h2><div class="tbl-wrap"><table class="tbl prod-tbl"><thead><tr><th></th><th>Product</th><th>For</th><th>Sizes</th><th>Price</th><th>Status</th><th></th></tr></thead><tbody>' +
        items.map(function (p) {
          return '<tr data-id="' + e(p.id) + '"><td class="pt-art">' + artSvg(p) + '</td><td><a href="#product/' + encodeURIComponent(p.id) + '"><b>' + e(p.name) + '</b></a><span class="sub">' + e(catName(p.sport, p.category)) + (p.name_ka ? ' · ' + e(p.name_ka) : ' · <em class="warn">no Georgian name</em>') + '</span></td>' +
            '<td>' + e(META.audience[p.audience] || p.audience) + '</td><td><span class="sub">' + e((p.sizes || []).length > 3 ? p.sizes[0] + ' to ' + p.sizes[p.sizes.length - 1] : (p.sizes || []).join(', ')) + '</span></td>' +
            '<td>' + (p.price != null && p.price !== '' ? money(p.price, p.currency) : '<span class="sub">On request</span>') + '</td>' +
            '<td><select class="ps s-' + p.status + '">' + Object.keys(PSTATUS).map(function (k) { return '<option value="' + k + '"' + (p.status === k ? ' selected' : '') + '>' + PSTATUS[k] + '</option>'; }).join('') + '</select></td>' +
            '<td class="act"><a href="#product/' + encodeURIComponent(p.id) + '">Edit</a></td></tr>';
        }).join('') + '</tbody></table></div>';
    }).join('');
    var opts = '<option value="all">All sections</option>' + META.sports.map(function (s) { return '<option value="' + s[0] + '"' + (f.sport === s[0] ? ' selected' : '') + '>' + e(s[1]) + '</option>'; }).join('');
    var act = state.products.filter(function (p) { return p.status === 'active'; }).length;
    app.innerHTML = shell('<div class="adm-top"><h1 class="display h-md">Shop<span class="dot">.</span></h1><a class="btn btn-primary" href="#product-new">New product +</a></div>' +
      '<div class="kpis"><div><span>Products</span><b>' + state.products.length + '</b></div><div><span>In the shop</span><b>' + act + '</b></div>' +
      '<div><span>Without a price</span><b>' + state.products.filter(function (p) { return p.price == null || p.price === ''; }).length + '</b></div>' +
      '<div><span>Hidden or sold out</span><b>' + (state.products.length - act) + '</b></div></div>' +
      '<div class="adm-filters"><select id="sf">' + opts + '</select><input id="sq" type="search" placeholder="Search products…" value="' + e(f.q) + '"><span class="sub">' + list.length + ' shown</span></div>' +
      (groups || '<p class="body">No products found.</p>') +
      '<p class="note">Change the status here to hide a product or mark it sold out. Products without a price show “Price on request” and are ordered on WhatsApp.</p>', 'shop');
    $('#sf').addEventListener('change', function () { f.sport = this.value; drawShop(); });
    $('#sq').addEventListener('input', function () { f.q = this.value; clearTimeout(this._t); var v = this.value; this._t = setTimeout(function () { drawShop(); var i = $('#sq'); i.focus(); i.setSelectionRange(v.length, v.length); }, 250); });
    $$('.ps').forEach(function (s) {
      s.addEventListener('change', function () {
        var id = s.closest('tr').dataset.id, p = state.products.filter(function (x) { return x.id === id; })[0], v = s.value;
        var o = Object.assign({}, p, { status: v, old_id: p.id });
        H.api.saveProduct(o).then(function () { p.status = v; s.className = 'ps s-' + v; toast('Saved'); }).catch(function (err) { toast(err.message, true); });
      });
    });
  }
  function productEditor(id) {
    if (!state.products) { H.api.adminProducts().then(function (l) { state.products = l || []; productEditor(id); }).catch(fail('Shop')); app.innerHTML = shell('<p class="adm-loading">Loading…</p>', 'shop'); return; }
    var p = id ? state.products.filter(function (x) { return x.id === id; })[0] : { id: '', name: '', sport: 'train', category: 'rash', audience: 'adult', sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'], colours: ['Black'], size_guide: 'top', drawing: 'tshirt', price: null, currency: 'GEL', status: 'active', sort: (state.products.length + 1) * 10 };
    if (!p) { location.hash = 'shop'; return; }
    p = JSON.parse(JSON.stringify(p));
    var so = {}; META.sports.forEach(function (s) { so[s[0]] = s[1]; });
    var swatches = Object.keys(META.colours).map(function (c) { return '<label class="sw-pick"><input type="checkbox" name="colour" value="' + c + '"' + ((p.colours || []).indexOf(c) >= 0 ? ' checked' : '') + '><i style="background:' + META.colours[c] + '"></i><span>' + c + '</span></label>'; }).join('');
    var sets = Object.keys(META.sizesets).map(function (k) { return '<button type="button" class="btn btn-ghost sz-set" data-set="' + e(k) + '">' + e(k) + '</button>'; }).join('');
    var draws = {}; META.drawings.forEach(function (d) { draws[d] = d; });
    app.innerHTML = shell('<form id="pf" class="adm-edit" novalidate>' +
      '<div class="adm-top"><div><a class="sub" href="#shop">← Shop</a><h1 class="display h-md">' + (id ? e(p.name) : 'New product') + '<span class="dot">.</span></h1></div>' +
      '<div class="row-btns"><button class="btn btn-primary" type="submit">Save product</button></div></div>' +
      '<div class="prod-ed"><div>' +
      sec('Product', '<div class="g2">' + inp('name', 'Name', p.name, 'text', ' required') + inp('name_ka', 'Name in Georgian', p.name_ka) + '</div>' +
        area('description', 'Short description', p.description) + area('description_ka', 'Short description in Georgian', p.description_ka) +
        '<div class="g3">' + sel('sport', 'Section', p.sport, so) + '<div class="field"><label for="e-category">Category</label><select id="e-category" name="category"></select></div>' + sel('audience', 'For', p.audience, META.audience) + '</div>') +
      sec('Sizes & colours', inp('sizes', 'Sizes (comma separated)', (p.sizes || []).join(', '), 'text', ' placeholder="XS, S, M, L, XL"') + '<div class="sz-sets">' + sets + '</div>' +
        '<div class="g2">' + sel('size_guide', 'Size guide shown to buyers', p.size_guide || '', META.guides) + '</div>' +
        '<div class="field full"><label>Colours (first one is shown on the card)</label><div class="sw-picks">' + swatches + '</div></div>') +
      sec('Price & status', '<div class="g3">' + inp('price', 'Price (leave empty for “on request”)', p.price, 'number', ' min="0" step="any"') +
        sel('currency', 'Currency', p.currency || 'GEL', { GEL: 'GEL ₾', EUR: 'EUR €', USD: 'USD $' }) + sel('status', 'Status', p.status, PSTATUS) + '</div>' +
        '<div class="g2">' + inp('id', 'Web address (auto)', p.id, 'text', ' pattern="[a-z0-9-]{2,80}"') + inp('sort', 'Order in its row (lower comes first)', p.sort, 'number') + '</div>') +
      sec('Picture', '<div class="g2">' + sel('drawing', 'Drawing (used when there is no photo)', p.drawing || 'tshirt', draws) + '</div>' +
        '<div class="ph-wrap"><div class="ph-cover"><span class="rf-l">Product photo (optional)</span><div class="ph-slot" id="pp-slot"></div>' +
        '<label class="btn btn-ghost ph-btn">Upload photo<input type="file" accept="image/*" id="pp-in" hidden></label><p class="form-msg" id="pp-msg"></p></div></div>') +
      '</div><aside class="prod-prev"><span class="rf-l">Preview</span><div class="pp-card"><div class="pp-art" id="pp-art"></div><b id="pp-name"></b><span id="pp-meta"></span></div></aside></div>' +
      '<div class="adm-foot"><button class="btn btn-primary" type="submit">Save product</button>' + (id ? '<button type="button" class="btn btn-ghost danger" id="pdel">Delete product</button>' : '') + '<p class="form-msg"></p></div></form>', 'shop');
    var form = $('#pf'), E = form.elements, touched = !!p.id;
    function cats() { var sp = E.sport.value, list = META.cats[sp] || []; E.category.innerHTML = list.map(function (c) { return '<option value="' + c[0] + '"' + (c[0] === p.category ? ' selected' : '') + '>' + e(c[1]) + '</option>'; }).join(''); }
    function cur() {
      return { id: E.id.value.trim(), name: E.name.value.trim(), name_ka: E.name_ka.value.trim(), description: E.description.value.trim(), description_ka: E.description_ka.value.trim(),
        sport: E.sport.value, category: E.category.value, audience: E.audience.value,
        sizes: E.sizes.value.split(',').map(function (x) { return x.trim(); }).filter(Boolean),
        colours: $$('input[name="colour"]:checked', form).map(function (c) { return c.value; }),
        size_guide: E.size_guide.value, drawing: E.drawing.value, price: E.price.value === '' ? null : +E.price.value, currency: E.currency.value,
        status: E.status.value, sort: +E.sort.value || 0, photo_url: p.photo_url || null };
    }
    function preview() {
      var o = cur();
      $('#pp-art').innerHTML = artSvg(o); $('#pp-name').textContent = o.name || 'Product name';
      $('#pp-meta').textContent = [catName(o.sport, o.category), o.price != null ? money(o.price, o.currency) : 'Price on request'].join(' · ');
      $('#pp-slot').innerHTML = p.photo_url ? '<img src="' + e(p.photo_url) + '" alt=""><button type="button" class="ph-x" id="pp-x" aria-label="Remove photo">×</button>' : '<span>No photo. The drawing is used.</span>';
    }
    cats(); preview();
    E.sport.addEventListener('change', function () { p.category = ''; cats(); preview(); });
    E.name.addEventListener('input', function () { if (!touched) E.id.value = slugify(E.name.value); });
    E.id.addEventListener('input', function () { touched = true; });
    form.addEventListener('input', preview); form.addEventListener('change', preview);
    $$('.sz-set', form).forEach(function (b) { b.addEventListener('click', function () { E.sizes.value = META.sizesets[b.dataset.set].join(', '); preview(); }); });
    form.addEventListener('click', function (ev) { if (ev.target.id === 'pp-x') { p.photo_url = null; preview(); } });
    $('#pp-in').addEventListener('change', function () {
      var f = this.files[0], m = $('#pp-msg'); if (!f) return; m.className = 'form-msg'; m.textContent = 'Uploading…';
      shrink(f, H.mode === 'demo' ? 900 : 1600).then(function (b) { return H.api.upload(b, 'product.jpg'); })
        .then(function (u) { p.photo_url = u; preview(); m.textContent = 'Photo uploaded. Remember to save.'; })
        .catch(function (err) { m.className = 'form-msg err'; m.textContent = err.message; });
      this.value = '';
    });
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var o = cur(), msg = form.querySelector('.adm-foot .form-msg'), errs = [];
      o.id = o.id || slugify(o.name); o.old_id = id || '';
      if (!o.name) errs.push('Add a name.');
      if (!/^[a-z0-9-]{2,80}$/.test(o.id)) errs.push('Web address: lowercase letters, numbers and dashes.');
      if (!id && state.products.some(function (x) { return x.id === o.id; })) errs.push('That web address is already used.');
      if (!o.colours.length) errs.push('Choose at least one colour.');
      if (!o.sizes.length) errs.push('Add at least one size (or “One size”).');
      if (errs.length) { msg.className = 'form-msg err'; msg.textContent = errs.join(' '); toast(errs[0], true); return; }
      msg.className = 'form-msg'; msg.textContent = 'Saving…';
      H.api.saveProduct(o).then(function () {
        toast('Product saved'); return H.api.adminProducts().then(function (l) { state.products = l || []; location.hash = 'product/' + encodeURIComponent(o.id); route(); });
      }).catch(function (err) { msg.className = 'form-msg err'; msg.textContent = err.message === 'NEEDS_UPDATE_005' ? 'Run update-005.sql in Supabase first.' : err.message; toast(msg.textContent, true); });
    });
    if (id) $('#pdel').addEventListener('click', function () {
      if (!confirm('Delete “' + p.name + '”? This cannot be undone. Tip: set the status to Hidden instead.')) return;
      H.api.deleteProduct(p.id).then(function () { state.products = state.products.filter(function (x) { return x.id !== p.id; }); toast('Product deleted'); location.hash = 'shop'; }).catch(function (err) { toast(err.message, true); });
    });
  }

  // ================= email signups =================
  var INT = { camps: 'Camp dates', bjj: 'BJJ', wrestling: 'Wrestling', judo: 'Judo', shop: 'Shop news', news: 'Stories' };
  var SRC = { foot: 'Footer', home: 'Home page', camps: 'Camps page', camp: 'Camp page' };
  state.sub = { int: 'all', status: 'active', q: '' };
  function subsView() {
    app.innerHTML = shell('<p class="adm-loading">Loading signups…</p>', 'subs');
    H.api.subscribers().then(function (l) { state.subs = l || []; drawSubs(); }).catch(fail('Signups'));
  }
  function drawSubs() {
    var f = state.sub, q = f.q.toLowerCase(), all = state.subs, act = all.filter(function (s) { return s.status === 'active'; });
    var list = all.filter(function (s) { return (f.status === 'all' || s.status === f.status) && (f.int === 'all' || (s.interests || []).indexOf(f.int) >= 0) && (!q || (s.email + ' ' + (s.name || '')).toLowerCase().indexOf(q) >= 0); });
    var n = function (k) { return act.filter(function (s) { return (s.interests || []).indexOf(k) >= 0; }).length; };
    var week = act.filter(function (s) { return new Date(s.created_at) > new Date(Date.now() - 7 * 864e5); }).length;
    var rows = list.map(function (s) {
      return '<tr data-id="' + s.id + '"><td><a href="mailto:' + e(s.email) + '"><b>' + e(s.email) + '</b></a>' + (s.name ? '<span class="sub">' + e(s.name) + '</span>' : '') + '</td>' +
        '<td>' + (s.interests || []).map(function (i) { return '<span class="int-chip">' + e(INT[i] || i) + '</span>'; }).join(' ') + '</td>' +
        '<td><span class="sub">' + e(SRC[s.source] || s.source || '') + ' · ' + e((s.lang || '').toUpperCase()) + '</span></td>' +
        '<td><span class="sub">' + new Date(s.created_at).toLocaleDateString('en-GB') + '</span></td>' +
        '<td class="act">' + (s.status === 'active' ? '<button type="button" class="lnk su-off">Unsubscribe</button>' : '<span class="pill-s s-cancelled">Unsubscribed</span> <button type="button" class="lnk su-on">Re-add</button>') + '<button type="button" class="lnk danger su-del">Delete</button></td></tr>';
    }).join('');
    var io = '<option value="all">Any interest</option>' + Object.keys(INT).map(function (k) { return '<option value="' + k + '"' + (f.int === k ? ' selected' : '') + '>' + INT[k] + '</option>'; }).join('');
    var so = [['active', 'Subscribed'], ['unsubscribed', 'Unsubscribed'], ['all', 'Everyone']].map(function (o) { return '<option value="' + o[0] + '"' + (f.status === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('');
    app.innerHTML = shell('<div class="adm-top"><h1 class="display h-md">Email signups<span class="dot">.</span></h1><div class="row-btns"><button class="btn btn-ghost" type="button" id="copy">Copy emails</button><button class="btn btn-ghost" type="button" id="scsv">Export CSV</button></div></div>' +
      '<div class="kpis"><div><span>Subscribed</span><b>' + act.length + '</b></div><div><span>Want camp dates</span><b>' + n('camps') + '</b></div>' +
      '<div><span>BJJ · Wrestling · Judo</span><b>' + n('bjj') + ' · ' + n('wrestling') + ' · ' + n('judo') + '</b></div><div><span>New this week</span><b>' + week + '</b></div></div>' +
      '<div class="adm-filters"><select id="si">' + io + '</select><select id="ss">' + so + '</select><input id="sq2" type="search" placeholder="Search email…" value="' + e(f.q) + '"><span class="sub">' + list.length + ' shown</span></div>' +
      (list.length ? '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Email</th><th>Interested in</th><th>Signed up from</th><th>Date</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div>' : '<p class="body">No signups yet. They appear here when people use the email forms on the site.</p>') +
      '<p class="note">“Copy emails” copies the emails shown above, so you can paste them into Gmail (BCC) or a newsletter tool. Filter first, e.g. “Want camp dates” + “BJJ”.</p>', 'subs');
    $('#si').addEventListener('change', function () { f.int = this.value; drawSubs(); });
    $('#ss').addEventListener('change', function () { f.status = this.value; drawSubs(); });
    $('#sq2').addEventListener('input', function () { f.q = this.value; clearTimeout(this._t); var v = this.value; this._t = setTimeout(function () { drawSubs(); var i = $('#sq2'); i.focus(); i.setSelectionRange(v.length, v.length); }, 250); });
    $('#copy').addEventListener('click', function () {
      var t = list.filter(function (s) { return s.status === 'active'; }).map(function (s) { return s.email; }).join(', ');
      if (!t) return toast('No emails to copy', true);
      (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { toast(t.split(',').length + ' emails copied'); }, function () { prompt('Copy these emails:', t); });
    });
    $('#scsv').addEventListener('click', function () {
      dl('chidaoba-signups-' + new Date().toISOString().slice(0, 10) + '.csv', [csvLine(['email', 'name', 'interests', 'source', 'language', 'status', 'signed_up'])].concat(list.map(function (s) {
        return csvLine([s.email, s.name, (s.interests || []).map(function (i) { return INT[i] || i; }).join('; '), SRC[s.source] || s.source, s.lang, s.status, (s.created_at || '').slice(0, 10)]); })).join('\n'));
    });
    app.querySelectorAll('.su-off, .su-on, .su-del').forEach(function (b) {
      b.addEventListener('click', function () {
        var id = b.closest('tr').dataset.id, del = b.classList.contains('su-del');
        if (del && !confirm('Delete this email from the list?')) return;
        var patch = del ? { delete: true } : { status: b.classList.contains('su-off') ? 'unsubscribed' : 'active' };
        H.api.updateSubscriber(id, patch).then(function () {
          if (del) state.subs = state.subs.filter(function (s) { return s.id !== id; }); else state.subs.forEach(function (s) { if (s.id === id) s.status = patch.status; });
          toast(del ? 'Deleted' : 'Saved'); drawSubs();
        }).catch(function (err) { toast(err.message, true); });
      });
    });
  }

  // ================= contact messages =================
  var MSTATUS = { new: 'New', replied: 'Replied', closed: 'Closed' };
  state.msgF = 'open';
  function msgsView() {
    app.innerHTML = shell('<p class="adm-loading">Loading messages…</p>', 'msgs');
    H.api.messages().then(function (l) { state.msgs = l || []; drawMsgs(); }).catch(fail('Messages'));
  }
  function drawMsgs() {
    var f = state.msgF, list = state.msgs.filter(function (m) { return f === 'all' || (f === 'open' ? m.status !== 'closed' : m.status === f); });
    var cards = list.map(function (m) {
      var first = (m.name || '').split(' ')[0];
      var wa = m.phone ? 'https://wa.me/' + m.phone.replace(/[^0-9]/g, '') + '?text=' + encodeURIComponent('Hi ' + first + ', this is CHIDAOBA. Thank you for your message.') : null;
      return '<article class="msg s-' + m.status + '" data-id="' + m.id + '"><header><div><b>' + e(m.name) + '</b><span class="sub">' + e(m.topic || 'General') + ' · ' + new Date(m.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) + (m.lang ? ' · ' + e(m.lang.toUpperCase()) : '') + '</span></div>' +
        '<select class="ms">' + Object.keys(MSTATUS).map(function (k) { return '<option value="' + k + '"' + (m.status === k ? ' selected' : '') + '>' + MSTATUS[k] + '</option>'; }).join('') + '</select></header>' +
        '<p class="msg-t">' + e(m.message).replace(/\n/g, '<br>') + '</p>' +
        '<div class="msg-act"><a class="btn btn-primary sm" href="mailto:' + e(m.email) + '?subject=' + encodeURIComponent('Re: ' + (m.topic || 'your message') + ' | CHIDAOBA') + '">Reply by email</a>' +
        (wa ? '<a class="btn btn-ghost sm" href="' + wa + '" target="_blank" rel="noopener">WhatsApp ' + e(m.phone) + '</a>' : '') +
        '<span class="sub">' + e(m.email) + '</span><input class="mn" placeholder="Note…" value="' + e(m.admin_note || '') + '"><button type="button" class="lnk danger md">Delete</button></div></article>';
    }).join('');
    var fo = [['open', 'Open (new and replied)'], ['new', 'New'], ['replied', 'Replied'], ['closed', 'Closed'], ['all', 'All']].map(function (o) { return '<option value="' + o[0] + '"' + (f === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('');
    app.innerHTML = shell('<div class="adm-top"><h1 class="display h-md">Messages<span class="dot">.</span></h1></div>' +
      '<div class="adm-filters"><select id="mf">' + fo + '</select><span class="sub">' + list.length + ' shown</span></div>' +
      (list.length ? '<div class="msgs">' + cards + '</div>' : '<p class="body">No messages here. Messages from the contact form appear here.</p>') +
      '<p class="note">Reply by email or WhatsApp, then set the status to Replied. Closed messages are hidden from the default view.</p>', 'msgs');
    $('#mf').addEventListener('change', function () { state.msgF = this.value; drawMsgs(); });
    $$('.ms').forEach(function (s) { s.addEventListener('change', function () { var id = s.closest('.msg').dataset.id, v = s.value; H.api.updateMessage(id, { status: v }).then(function () { state.msgs.forEach(function (m) { if (m.id === id) m.status = v; }); toast('Saved'); drawMsgs(); }).catch(function (err) { toast(err.message, true); }); }); });
    $$('.mn').forEach(function (i) { i.addEventListener('change', function () { var id = i.closest('.msg').dataset.id; H.api.updateMessage(id, { admin_note: i.value }).then(function () { state.msgs.forEach(function (m) { if (m.id === id) m.admin_note = i.value; }); toast('Note saved'); }).catch(function (err) { toast(err.message, true); }); }); });
    $$('.md').forEach(function (b) { b.addEventListener('click', function () { if (!confirm('Delete this message?')) return; var id = b.closest('.msg').dataset.id; H.api.updateMessage(id, { delete: true }).then(function () { state.msgs = state.msgs.filter(function (m) { return m.id !== id; }); toast('Deleted'); drawMsgs(); }).catch(function (err) { toast(err.message, true); }); }); });
  }

  // ================= visitors =================
  state.visDays = 30;
  function visView() {
    app.innerHTML = shell('<p class="adm-loading">Loading visitor stats…</p>', 'vis');
    H.api.stats(state.visDays).then(drawVis).catch(function (err) {
      if (err.message === 'NEEDS_UPDATE_007') app.innerHTML = shell('<div class="adm-top"><h1 class="display h-md">Visitors<span class="dot">.</span></h1></div><div class="adm-sec"><h2>One database update needed</h2><p class="body">Run <b>update-007.sql</b> in Supabase (SQL Editor → New query → paste → Run), then reload this page. Stats start counting from that moment.</p></div>', 'vis');
      else if (/sign in|expired/i.test(err.message)) { H.api.signOut(); login(); } else toast(err.message, true);
    });
  }
  var PAGE = { '/': 'Home', '/shop/': 'Shop', '/camps/': 'Camps', '/camps/camp/': 'A camp page', '/camps/venue/': 'Venue', '/georgia/': 'Why Georgia', '/culture/': 'Culture', '/contact/': 'Contact', '/privacy/': 'Privacy' };
  function pageName(p) { var ka = /^\/ka(\/|$)/.test(p || ''), k = (p || '/').replace(/^\/ka/, '') || '/'; return (PAGE[k] || k) + (ka ? ' (Georgian)' : ''); }
  function refName(r) { if (!r) return 'Direct, or link without source'; var m = { 'instagram.com': 'Instagram', instagram: 'Instagram', ig: 'Instagram', 'facebook.com': 'Facebook', facebook: 'Facebook', fb: 'Facebook', google: 'Google', tiktok: 'TikTok', 'google.com': 'Google', 't.co': 'X / Twitter', 'youtube.com': 'YouTube', 'tiktok.com': 'TikTok', 'wa.me': 'WhatsApp', 'web.whatsapp.com': 'WhatsApp' }; return m[r] || (/google\./.test(r) ? 'Google' : r); }
  function bars(rows, total, label) {
    total = total || rows.reduce(function (s, r) { return s + r[1]; }, 0) || 1;
    return '<ul class="vbars">' + rows.map(function (r) { var pc = Math.round(r[1] / total * 100); return '<li><span class="vb-l">' + e(label(r[0])) + '</span><span class="vb-b"><i style="width:' + Math.max(2, pc) + '%"></i></span><b>' + r[1] + '</b><em>' + pc + '%</em></li>'; }).join('') + '</ul>';
  }
  function drawVis(s) {
    var days = s.days || [], max = Math.max.apply(null, days.map(function (d) { return d[1]; }).concat([1]));
    var chart = '<div class="vchart" role="img" aria-label="Page views per day">' + days.map(function (d) {
      var dt = new Date(d[0] + 'T00:00:00'), lab = dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      return '<div class="vc-col" title="' + lab + ': ' + d[1] + ' page views, ' + d[2] + ' visits"><i style="height:' + Math.round(d[1] / max * 100) + '%"></i><i class="v2" style="height:' + Math.round(d[2] / max * 100) + '%"></i></div>';
    }).join('') + '</div><div class="vc-axis"><span>' + (days[0] ? new Date(days[0][0] + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '') + '</span><span>Today</span></div>';
    var dev = s.devices || {}, dt = (dev.mobile || 0) + (dev.desktop || 0) + (dev.unknown || 0) || 1;
    var lg = s.langs || {}, lt = (lg.en || 0) + (lg.ka || 0) || 1;
    var prodName = function (id) { var x = (window.CHD_PRODUCTS || []).filter(function (p) { return p.id === id; })[0]; return x ? x.name : id; };
    var opts = [[7, 'Last 7 days'], [30, 'Last 30 days'], [90, 'Last 90 days'], [365, 'Last 12 months']].map(function (o) { return '<option value="' + o[0] + '"' + (state.visDays === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('');
    app.innerHTML = shell('<div class="adm-top"><h1 class="display h-md">Visitors<span class="dot">.</span></h1><select id="vd" class="vd">' + opts + '</select></div>' +
      '<div class="kpis"><div><span>Visits</span><b>' + s.visits + '</b></div><div><span>Page views</span><b>' + s.views + '</b></div>' +
      '<div><span>WhatsApp clicks</span><b>' + s.wa + '</b></div><div><span>Shop orders sent</span><b>' + s.orders + '</b></div></div>' +
      '<section class="adm-sec"><h2>Every day</h2>' + chart + '<p class="note"><i class="lg"></i> Page views <i class="lg v2"></i> Visits (a visit can include several pages)</p></section>' +
      '<div class="vgrid"><section class="adm-sec"><h2>Where visitors come from</h2>' + ((s.refs || []).length ? bars(s.refs, s.visits, refName) : '<p class="body">No visits yet.</p>') +
        '<p class="note">Tip: add <code>?utm_source=instagram</code> to the link in your Instagram bio to see exactly how many people come from it.</p></section>' +
      '<section class="adm-sec"><h2>Most visited pages</h2>' + ((s.pages || []).length ? bars(s.pages, s.views, pageName) : '<p class="body">No page views yet.</p>') + '</section>' +
      '<section class="adm-sec"><h2>Phone or computer</h2>' + bars([['Phone', dev.mobile || 0], ['Computer', dev.desktop || 0]], dt, function (x) { return x; }) +
        '<h2 style="margin-top:28px">Language</h2>' + bars([['English', lg.en || 0], ['Georgian', lg.ka || 0]], lt, function (x) { return x; }) + '</section>' +
      '<section class="adm-sec"><h2>Most opened products</h2>' + ((s.products || []).length ? bars(s.products, null, prodName) : '<p class="body">No products opened yet.</p>') +
        '<p class="note">Camp requests sent: <b>' + (s.camps || 0) + '</b>. WhatsApp clicks by page: ' + ((s.wa_pages || []).map(function (r) { return e(pageName(r[0])) + ' ' + r[1]; }).join(', ') || 'none yet') + '.</p></section></div>' +
      '<p class="note">Counted without cookies and without storing anything personal. Your own visits are not counted on any browser where you have opened this admin page.</p>', 'vis');
    $('#vd').addEventListener('change', function () { state.visDays = +this.value; visView(); });
  }

  if (H.api.signedIn()) load(); else login();
})();
