// CHIDAOBA, data layer for camps.
// Uses Supabase (REST, no library) when configured; otherwise a clearly labelled
// demo mode stored in this browser only (enable with ?demo=1).
(function () {
  var C = window.CHD_CONFIG || {};
  var live = !!(C.SUPABASE_URL && C.SUPABASE_ANON_KEY);
  var qs = new URLSearchParams(location.search);
  if (qs.get('demo') === '1') sessionStorage.setItem('chd_demo', '1');
  if (qs.get('demo') === '0') sessionStorage.removeItem('chd_demo');
  var demo = !live || sessionStorage.getItem('chd_demo') === '1';
  if (live && sessionStorage.getItem('chd_demo') !== '1') demo = false;
  var demoOn = sessionStorage.getItem('chd_demo') === '1';

  var NET = 'Can’t reach the database. Check your internet connection, turn off content blockers for this site, and make sure the Supabase project is active.';
  var LOC = ({ ka: 'ka-GE', ru: 'ru-RU' })[document.documentElement.lang] || 'en-GB';
  var DISC = { bjj: 'BJJ & Grappling', wrestling: 'Freestyle & Greco-Roman Wrestling', judo: 'Judo', other: 'Other' };
  var ERR = {
    camp_not_open: 'Registration for this camp is not open.',
    registration_closed: 'Registration for this camp has closed.',
    package_required: 'Please choose a package.',
    consent_required: 'Please accept the privacy notice.',
    rejected: 'Your registration could not be accepted.'
  };

  // ---------------- helpers ----------------
  function money(n, cur) {
    try { return new Intl.NumberFormat(LOC, { style: 'currency', currency: cur || 'EUR', maximumFractionDigits: (Math.round(n) === +n ? 0 : 2) }).format(+n || 0); }
    catch (e) { return (cur || '') + ' ' + n; }
  }
  function d(s) { return s ? new Date(s + 'T00:00:00') : null; }
  function dateRange(a, b) {
    var A = d(a), B = d(b);
    if (!A) return 'Dates to be announced';
    var o = { day: 'numeric', month: 'short', year: 'numeric' };
    if (!B || a === b) return A.toLocaleDateString(LOC, o);
    if (A.getFullYear() === B.getFullYear() && A.getMonth() === B.getMonth())
      return A.getDate() + '–' + B.toLocaleDateString(LOC, o);
    if (A.getFullYear() === B.getFullYear())
      return A.toLocaleDateString(LOC, { day: 'numeric', month: 'short' }) + ' – ' + B.toLocaleDateString(LOC, o);
    return A.toLocaleDateString(LOC, o) + ' – ' + B.toLocaleDateString(LOC, o);
  }
  function days(a, b) { var A = d(a), B = d(b); return A && B ? Math.round((B - A) / 864e5) + 1 : null; }
  function today() { var t = new Date(); t.setHours(0, 0, 0, 0); return t; }
  function isEarly(c) { return c.early_bird_deadline && today() <= d(c.early_bird_deadline); }
  function fromPrice(c) {
    var early = isEarly(c), best = null;
    (c.packages || []).forEach(function (p) {
      var v = early && p.early_price !== '' && p.early_price != null ? +p.early_price : +p.price;
      if (!isNaN(v) && (best === null || v < best)) best = v;
    });
    return best;
  }
  function quote(c, sel) {
    var pkg = (c.packages || []).filter(function (p) { return p.id === sel.package; })[0];
    if (!pkg) return null;
    var early = isEarly(c) && pkg.early_price !== '' && pkg.early_price != null;
    var unit = early ? +pkg.early_price : +pkg.price || 0;
    var extras = 0, chosen = [];
    (c.addons || []).forEach(function (a) { if ((sel.addons || []).indexOf(a.id) >= 0) { extras += +a.price || 0; chosen.push(a); } });
    var people = Math.max(1, Math.min(30, +sel.people || 1));
    var total = (unit + extras) * people, disc = 0;
    if (c.group_min && people >= c.group_min && c.group_discount_pct > 0) { disc = Math.round(total * c.group_discount_pct) / 100; total -= disc; }
    var dep = Math.round(total * (c.deposit_pct || 0)) / 100;
    return { pkg: pkg, early: early, unit: unit, extras: extras, addons: chosen, people: people, discount: disc, total: total, deposit: dep };
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (ch) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]; }); }

  // ---------------- Supabase REST ----------------
  var SES = 'chd_session';
  function session() { try { return JSON.parse(sessionStorage.getItem(SES) || 'null'); } catch (e) { return null; } }
  function setSession(s) { if (s) sessionStorage.setItem(SES, JSON.stringify(s)); else sessionStorage.removeItem(SES); }
  function req(path, opt, auth) {
    opt = opt || {};
    var h = { apikey: C.SUPABASE_ANON_KEY, 'Content-Type': 'application/json' };
    var s = auth && session();
    h.Authorization = 'Bearer ' + (s ? s.access_token : C.SUPABASE_ANON_KEY);
    Object.keys(opt.headers || {}).forEach(function (k) { h[k] = opt.headers[k]; });
    return fetch(C.SUPABASE_URL.replace(/\/$/, '') + path, { method: opt.method || 'GET', headers: h, body: opt.body ? JSON.stringify(opt.body) : undefined })
      .catch(function () { throw new Error(NET); })
      .then(function (r) {
        if (r.status === 401 && auth && s && s.refresh_token && !opt._retried) {
          return refresh().then(function () { opt._retried = true; return req(path, opt, auth); });
        }
        return r.text().then(function (t) {
          var j = null; try { j = t ? JSON.parse(t) : null; } catch (e) { }
          if (!r.ok) {
            var m = (j && (j.message || j.error_description || j.msg)) || ('Error ' + r.status);
            throw new Error(ERR[m] || m);
          }
          return j;
        });
      });
  }
  function refresh() {
    var s = session();
    return fetch(C.SUPABASE_URL.replace(/\/$/, '') + '/auth/v1/token?grant_type=refresh_token', {
      method: 'POST', headers: { apikey: C.SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: s.refresh_token })
    }).then(function (r) { return r.json().then(function (j) { if (!r.ok) { setSession(null); throw new Error('Session expired. Please sign in again.'); } setSession(j); }); });
  }
  function rpcA(fn, args) {
    var s = session();
    if (!s || !s.token) return Promise.reject(new Error('Session expired. Please sign in again.'));
    return req('/rest/v1/rpc/' + fn, { method: 'POST', body: Object.assign({ p_token: s.token }, args) });
  }
  function u5(err) {
    if (/Could not find|schema cache|does not exist|404/i.test(err.message)) throw new Error('NEEDS_UPDATE_005');
    throw err;
  }
  var liveApi = {
    listCamps: function () {
      return Promise.all([
        req('/rest/v1/camps?select=*&status=in.(published,sold_out,completed)&order=start_date.asc.nullslast'),
        req('/rest/v1/rpc/camp_counts', { method: 'POST', body: {} })
      ]).then(function (r) { return attach(r[0], r[1]); });
    },
    getCamp: function (slug) {
      return Promise.all([
        req('/rest/v1/camps?select=*&slug=eq.' + encodeURIComponent(slug)),
        req('/rest/v1/rpc/camp_counts', { method: 'POST', body: {} })
      ]).then(function (r) { return attach(r[0], r[1])[0] || null; });
    },
    register: function (p) { return req('/rest/v1/rpc/register_for_camp', { method: 'POST', body: { p: p } }); },
    signIn: function (email, pw) {
      return req('/rest/v1/rpc/admin_login', { method: 'POST', body: { p_email: email, p_password: pw } })
        .then(function (j) {
          if (!j || j.error || !j.token) throw new Error((j && j.error) || 'Wrong email or password.');
          setSession(j); return true;
        }, function (err) {
          if (/admin_login|schema cache|Could not find/i.test(err.message)) throw new Error('The database update is not installed yet. Run admin-login.sql in Supabase.');
          throw err;
        });
    },
    signOut: function () { var s = session(); setSession(null); if (s && s.token) req('/rest/v1/rpc/admin_logout', { method: 'POST', body: { p_token: s.token } }).catch(function () { }); return Promise.resolve(); },
    signedIn: function () { var s = session(); return !!(s && s.token && new Date(s.expires_at) > new Date()); },
    adminCamps: function () { return rpcA('admin_camps', {}); },
    saveCamp: function (c) {
      var body = Object.assign({}, c); delete body.taken; delete body.waitlist; delete body.created_at; delete body.updated_at;
      return rpcA('admin_save_camp', { p: body });
    },
    deleteCamp: function (id) { return rpcA('admin_delete_camp', { p_id: id }); },
    regs: function (campId) { return rpcA('admin_regs', { p_camp: campId || null }); },
    updateReg: function (id, patch) { return rpcA('admin_update_reg', { p_id: id, p: patch }); },
    // shop, email signups, contact messages (Update 005)
    products: function () { return req('/rest/v1/products?select=*&status=neq.hidden&order=sort.asc'); },
    adminProducts: function () { return rpcA('admin_products', {}).catch(u5); },
    saveProduct: function (p) { return rpcA('admin_save_product', { p: p }).catch(u5); },
    deleteProduct: function (id) { return rpcA('admin_delete_product', { p_id: id }).catch(u5); },
    subscribers: function () { return rpcA('admin_subscribers', {}).catch(u5); },
    updateSubscriber: function (id, patch) { return rpcA('admin_update_subscriber', { p_id: id, p: patch }).catch(u5); },
    messages: function () { return rpcA('admin_messages', {}).catch(u5); },
    updateMessage: function (id, patch) { return rpcA('admin_update_message', { p_id: id, p: patch }).catch(u5); },
    stats: function (days) { return rpcA('admin_stats', { p_days: days }).catch(function (err) { if (/Could not find|schema cache|does not exist|404/i.test(err.message)) throw new Error('NEEDS_UPDATE_007'); throw err; }); },
    upload: function (blob, name) {
      var base = C.SUPABASE_URL.replace(/\/$/, ''), path;
      return rpcA('admin_upload_ticket', {}).then(function (folder) {
        path = folder + '/' + Date.now() + '-' + name;
        return fetch(base + '/storage/v1/object/camp-images/' + path, {
          method: 'POST', body: blob,
          headers: { apikey: C.SUPABASE_ANON_KEY, Authorization: 'Bearer ' + C.SUPABASE_ANON_KEY, 'Content-Type': blob.type || 'image/jpeg', 'x-upsert': 'false' }
        });
      }).catch(function () { throw new Error(NET); }).then(function (r) {
        if (!r.ok) return r.text().then(function (t) { throw new Error('Upload failed (' + r.status + '). ' + (/bucket/i.test(t) ? 'Run the latest database update.' : '')); });
        return base + '/storage/v1/object/public/camp-images/' + path;
      });
    }
  };
  function attach(camps, counts) {
    var m = {}; (counts || []).forEach(function (c) { m[c.camp_id] = c; });
    return (camps || []).map(function (c) { var k = m[c.id] || {}; c.taken = k.taken || 0; c.waitlist = k.waitlist || 0; return c; });
  }

  // ---------------- Demo (this browser only) ----------------
  var DK = 'chd_demo_db3';
  function uid() { return 'x' + Math.random().toString(36).slice(2, 10); }
  function iso(offset) { var t = today(); t.setDate(t.getDate() + offset); return t.toISOString().slice(0, 10); }
  function seed() {
    return {
      camps: [{
        id: uid(), slug: 'demo-bjj-camp-tbilisi', title: 'DEMO: BJJ & No-Gi Mountain Camp, Svaneti', venue_key: 'mulakhi', gallery: [], discipline: 'bjj', status: 'published', featured: true,
        start_date: iso(60), end_date: iso(66), city: 'Mulakhi, Svaneti', country: 'Georgia', venue: 'Ilia Gabliani Sports Complex', level: 'All levels',
        summary: 'Sample camp to preview how camps look. Seven days of gi and no-gi training with Georgian wrestling coaches.',
        description: 'This is sample content for demo mode only, it is not a real camp.\n\nTwo sessions a day: technique in the morning, live rounds in the evening. Between sessions: recovery, food and time to explore Svaneti.',
        capacity: 20, currency: 'EUR', early_bird_deadline: iso(20), registration_deadline: iso(50), deposit_pct: 30, payment_days: 7,
        group_min: 4, group_discount_pct: 10, bank_details: '[Bank name]\n[Account holder]\nIBAN: [GE00 XX00 0000 0000 0000 00]\nReference: your booking code',
        packages: [
          { id: 'training', name: 'Training only', name_ka: 'მხოლოდ ვარჯიში', description: 'All sessions, camp T-shirt.', price: 390, early_price: 340, features: ['All training sessions', 'Camp T-shirt'] },
          { id: 'stay', name: 'Training + stay', name_ka: 'ვარჯიში + საცხოვრებელი', description: 'All sessions, 7 nights shared room, breakfast.', price: 690, early_price: 620, features: ['All training sessions', 'Camp T-shirt', '7 nights, shared room', 'Breakfast'] },
          { id: 'all', name: 'All-inclusive', name_ka: 'ყველაფერი ჩათვლით', description: 'Training, private room, all meals, transfers, cultural day.', price: 990, early_price: 900, features: ['All training sessions', 'Camp T-shirt', '7 nights, private room', 'Breakfast', 'Lunch and dinner', 'Airport transfers', 'Cultural day trip'] }
        ],
        addons: [{ id: 'transfer', name: 'Airport transfer (both ways)', price: 40 }, { id: 'private', name: 'Private lesson (1 hour)', price: 60 }, { id: 'merch', name: 'CHIDAOBA merch pack', price: 55 }],
        schedule: [
          { day: 'Day 1', items: [{ time: '15:00', title: 'Arrival & check-in' }, { time: '19:00', title: 'Welcome session & dinner' }] },
          { day: 'Days 2–6', items: [{ time: '09:30', title: 'Morning technique' }, { time: '12:00', title: 'Lunch & recovery' }, { time: '15:00', title: 'Cultural activity / free time' }, { time: '18:30', title: 'Evening live rounds' }] },
          { day: 'Day 7', items: [{ time: '10:00', title: 'Open mat & closing' }, { time: '13:00', title: 'Departure' }] }
        ],
        included: ['Two training sessions a day', 'Coaches & instructors', 'Camp T-shirt', 'One cultural day'],
        excluded: ['Flights', 'Travel insurance'],
        coaches: [{ name: '[Coach name]', role: 'BJJ black belt', titles: ['Sample title 1', 'Sample title 2'], bio: 'Sample coach profile.' }, { name: '[Coach name]', role: 'Wrestling coach', titles: [], bio: 'Sample coach profile.' }],
        faq: [{ q: 'Is this a real camp?', a: 'No. This is demo content to preview the booking flow.' }],
        intensity: 3, age_min: 16, age_max: null, show_urgency: true,
        fit_for: ['You have trained BJJ, wrestling or judo for 6 months or more', 'You want two sessions a day and real sparring', 'You like the mountains and a slower pace between sessions'],
        bring: [{ item: 'BJJ gi (2 if you can)', shop: 'bjj-gi' }, { item: 'Rashguard and shorts for no-gi', shop: 'rashguard-long-sleeve' }, { item: 'Mouthguard', shop: 'mouthguard' }, { item: 'Slides for walking off the mat', shop: 'slides' }, { item: 'Warm layer for mountain evenings', shop: 'hoodie' }, { item: 'Towel', shop: 'gym-towel' }, { item: 'Passport and travel insurance', shop: '' }],
        reviews: [{ name: '[Name]', from: 'Sample review', rating: 5, text: 'Demo review. Real reviews from past camps appear here.' }],
        ka: { title: 'დემო: BJJ და No-Gi სამთო ბანაკი, სვანეთი', summary: 'სანიმუშო ბანაკი, რომ ნახოთ, როგორ გამოიყურება ბანაკები.', fit_for: ['BJJ-ს, ჭიდაობას ან ძიუდოს 6 თვე ან მეტია ვარჯიშობთ', 'გსურთ დღეში ორი ვარჯიში და ნამდვილი სპარინგი'] }
      }, {
        id: uid(), slug: 'demo-wrestling-week', title: 'DEMO: Wrestling Week, Kutaisi', discipline: 'wrestling', status: 'published', featured: false,
        start_date: iso(95), end_date: iso(99), city: 'Kutaisi', country: 'Georgia', level: 'Intermediate+',
        summary: 'Sample camp: freestyle & Greco-Roman sessions with Georgian coaches.', description: 'Demo content.',
        capacity: 6, currency: 'EUR', early_bird_deadline: null, deposit_pct: 30, payment_days: 7, group_min: null, group_discount_pct: 0,
        bank_details: '[Bank details]', packages: [{ id: 'training', name: 'Training only', price: 280 }], addons: [], schedule: [], included: ['Training sessions'], excluded: [], coaches: [], faq: []
      }],
      regs: []
    };
  }
  function db() { var x = null; try { x = JSON.parse(localStorage.getItem(DK)); } catch (e) { } if (!x || !x.camps) x = seed(); demoPeople(x); localStorage.setItem(DK, JSON.stringify(x)); return x; }
  function save(x) { localStorage.setItem(DK, JSON.stringify(x)); }
  function counts(x, c) {
    var t = 0, w = 0; x.regs.forEach(function (r) { if (r.camp_id === c.id) { if (['pending', 'deposit_paid', 'paid'].indexOf(r.status) >= 0) t += r.people; if (r.status === 'waitlist') w += r.people; } });
    var o = JSON.parse(JSON.stringify(c)); o.taken = t; o.waitlist = w; return o;
  }
  function prods(x) { if (!x.products) x.products = JSON.parse(JSON.stringify(window.CHD_PRODUCTS || [])); return x.products; }
  function demoPeople(x) {
    if (x.subs) return;
    var now = Date.now();
    x.subs = [{ id: uid(), email: 'anna@example.com', name: '', interests: ['camps', 'bjj'], source: 'camps', lang: 'en', status: 'active', created_at: new Date(now - 864e5).toISOString() },
      { id: uid(), email: 'giorgi@example.com', name: '', interests: ['camps', 'wrestling', 'news'], source: 'foot', lang: 'ka', status: 'active', created_at: new Date(now - 3 * 864e5).toISOString() },
      { id: uid(), email: 'sam@example.com', name: '', interests: ['shop', 'news'], source: 'home', lang: 'en', status: 'active', created_at: new Date(now - 6 * 864e5).toISOString() }];
    x.msgs = [{ id: uid(), name: 'Demo person', email: 'demo@example.com', phone: '+995 555 00 00 00', topic: 'Camps & events', message: 'Sample message: do you run camps for teams of 10?', lang: 'en', status: 'new', admin_note: '', created_at: new Date(now - 2 * 36e5).toISOString() }];
  }
  var wait = function (v) { return new Promise(function (r) { setTimeout(function () { r(v); }, 250); }); };
  var demoApi = {
    listCamps: function () { var x = db(); return wait(x.camps.filter(function (c) { return ['published', 'sold_out', 'completed'].indexOf(c.status) >= 0; }).map(function (c) { return counts(x, c); })); },
    getCamp: function (slug) { var x = db(); var c = x.camps.filter(function (c) { return c.slug === slug; })[0]; return wait(c ? counts(x, c) : null); },
    register: function (p) {
      var x = db(); var c = x.camps.filter(function (c) { return c.slug === p.camp && c.status === 'published'; })[0];
      if (!c) return Promise.reject(new Error(ERR.camp_not_open));
      if (!p.consent) return Promise.reject(new Error(ERR.consent_required));
      var q = quote(c, p); if (!q) return Promise.reject(new Error(ERR.package_required));
      var cc = counts(x, c), st = c.capacity && cc.taken + q.people > c.capacity ? 'waitlist' : 'pending';
      var pay = new Date(); pay.setDate(pay.getDate() + (c.payment_days || 7));
      var r = { id: uid(), ref: 'CHD-' + Math.random().toString(16).slice(2, 8).toUpperCase(), camp_id: c.id, created_at: new Date().toISOString(), status: st,
        full_name: p.full_name, email: p.email, phone: p.phone, country: p.country, age: p.age, experience: p.experience, level: p.level, club: p.club,
        package_id: q.pkg.id, package_name: q.pkg.name, addons: q.addons, people: q.people, accommodation: p.accommodation, notes: p.notes,
        unit_price: q.unit, total: q.total, deposit: q.deposit, pay_by: st === 'waitlist' ? null : pay.toISOString().slice(0, 10), admin_note: '' };
      x.regs.unshift(r); save(x);
      return wait({ ref: r.ref, status: st, currency: c.currency, unit_price: q.unit, early: q.early, extras: q.extras, people: q.people, discount: q.discount,
        total: q.total, deposit: q.deposit, deposit_pct: c.deposit_pct, pay_by: r.pay_by, bank_details: st === 'waitlist' ? null : c.bank_details, camp_title: c.title });
    },
    signIn: function () { sessionStorage.setItem('chd_demo_admin', '1'); return wait(true); },
    signOut: function () { sessionStorage.removeItem('chd_demo_admin'); return wait(true); },
    signedIn: function () { return sessionStorage.getItem('chd_demo_admin') === '1'; },
    adminCamps: function () { var x = db(); return wait(x.camps.map(function (c) { return counts(x, c); })); },
    saveCamp: function (c) {
      var x = db(); var o = JSON.parse(JSON.stringify(c)); delete o.taken; delete o.waitlist;
      if (o.id) { x.camps = x.camps.map(function (k) { return k.id === o.id ? o : k; }); } else { o.id = uid(); x.camps.unshift(o); }
      save(x); return wait(o);
    },
    deleteCamp: function (id) { var x = db(); x.camps = x.camps.filter(function (c) { return c.id !== id; }); x.regs = x.regs.filter(function (r) { return r.camp_id !== id; }); save(x); return wait(true); },
    regs: function (campId) { var x = db(); return wait(x.regs.filter(function (r) { return !campId || r.camp_id === campId; })); },
    updateReg: function (id, patch) { var x = db(); x.regs.forEach(function (r) { if (r.id === id) Object.assign(r, patch); }); save(x); return wait(true); },
    products: function () { var x = db(); return wait(prods(x).filter(function (p) { return p.status !== 'hidden'; })); },
    adminProducts: function () { return wait(prods(db())); },
    saveProduct: function (p) {
      var x = db(), list = prods(x), o = JSON.parse(JSON.stringify(p)), old = o.old_id || o.id; delete o.old_id;
      var i = list.map(function (k) { return k.id; }).indexOf(old);
      if (i >= 0) list[i] = Object.assign({}, list[i], o); else list.push(o);
      x.products = list; save(x); return wait(o);
    },
    deleteProduct: function (id) { var x = db(); x.products = prods(x).filter(function (p) { return p.id !== id; }); save(x); return wait(true); },
    subscribers: function () { return wait(db().subs || []); },
    updateSubscriber: function (id, patch) { var x = db(); x.subs = (x.subs || []).filter(function (r) { return !(patch.delete && r.id === id); }); x.subs.forEach(function (r) { if (r.id === id && patch.status) r.status = patch.status; }); save(x); return wait(true); },
    messages: function () { return wait(db().msgs || []); },
    updateMessage: function (id, patch) { var x = db(); x.msgs = (x.msgs || []).filter(function (r) { return !(patch.delete && r.id === id); }); x.msgs.forEach(function (r) { if (r.id === id) Object.assign(r, patch); }); save(x); return wait(true); },
    stats: function (days) {
      var d = [], t = new Date(); for (var i = days - 1; i >= 0; i--) { var x = new Date(t); x.setDate(t.getDate() - i); var n = Math.round(20 + 15 * Math.sin(i / 2) + Math.random() * 10); d.push([x.toISOString().slice(0, 10), n, Math.round(n * .6)]); }
      var v = d.reduce(function (s, r) { return s + r[1]; }, 0), s2 = d.reduce(function (s, r) { return s + r[2]; }, 0);
      return wait({ views: v, visits: s2, wa: Math.round(s2 * .08), orders: Math.round(s2 * .02), camps: 1, days: d,
        pages: [['/', Math.round(v * .35)], ['/shop/', Math.round(v * .2)], ['/camps/', Math.round(v * .15)], ['/ka/', Math.round(v * .1)], ['/georgia/', Math.round(v * .08)]],
        refs: [['', Math.round(s2 * .4)], ['instagram.com', Math.round(s2 * .35)], ['google.com', Math.round(s2 * .15)], ['facebook.com', Math.round(s2 * .1)]],
        devices: { mobile: Math.round(s2 * .7), desktop: Math.round(s2 * .3) }, langs: { en: Math.round(s2 * .55), ka: Math.round(s2 * .45) },
        products: [['bjj-gi', 14], ['rashguard-long-sleeve', 9], ['kids-bjj-gi', 6]], wa_pages: [['/shop/', 5], ['/camps/', 3]] });
    },
    reset: function () { localStorage.removeItem(DK); return wait(true); },
    upload: function (blob) { return new Promise(function (res) { var r = new FileReader(); r.onload = function () { res(r.result); }; r.readAsDataURL(blob); }); }
  };

  var useDemo = demoOn || !live;
  window.CHD = {
    api: useDemo ? demoApi : liveApi,
    mode: useDemo ? (demoOn ? 'demo' : 'empty') : 'live',
    venue: function (c) { return (window.CHD_VENUES || {})[c && c.venue_key] || null; },
    cover: function (c) { var v = (window.CHD_VENUES || {})[c && c.venue_key]; return c && c.cover_url ? { url: c.cover_url, thumb: c.cover_url, alt: c.title } : (v ? v.cover : null); },
    live: live, DISC: DISC, money: money, dateRange: dateRange, days: days, isEarly: isEarly, fromPrice: fromPrice, quote: quote, esc: esc, d: d, today: today
  };
  // Without Supabase and without ?demo=1, the public site shows no camps (never sample data).
  if (!live && !demoOn) {
    window.CHD.api = Object.assign({}, demoApi, {
      listCamps: function () { return Promise.resolve([]); },
      getCamp: function () { return Promise.resolve(null); },
      register: function () { return Promise.reject(new Error('Registration is not available yet.')); }
    });
  }
})();
