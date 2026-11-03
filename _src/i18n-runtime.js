// Live translator: translates text that page scripts add after load
// (camp cards, booking form, shop bag, form messages) and adds the
// language prefix to internal links.
(function () {
  var D = window.CHD_I18N || {}, L = window.CHD_LANG;
  if (!L) return;
  var pats = [];
  Object.keys(D).sort(function (a, b) { return b.length - a.length; }).forEach(function (k) {
    if (k.indexOf('{') < 0) return;
    var names = [];
    var rx = k.replace(/[.*+?^$()|[\]\\]/g, '\\$&').replace(/\{(\w+)\}/g, function (_, n) { names.push(n); return '(.+?)'; });
    pats.push({ re: new RegExp('^' + rx + '$'), names: names, out: D[k] });
  });
  function tr(s) {
    var key = s.replace(/\s+/g, ' ').trim();
    if (!key || !/[A-Za-z]{2}/.test(key)) return null;
    if (D[key]) return s.replace(key, D[key]);
    for (var i = 0; i < pats.length; i++) {
      var m = key.match(pats[i].re);
      if (m) {
        var o = pats[i].out;
        pats[i].names.forEach(function (n, j) { var v = m[j + 1]; var tv = tr(v); o = o.split('{' + n + '}').join(tv == null ? v : tv); });
        return s.replace(key, o);
      }
    }
    return null;
  }
  var ATTRS = ['placeholder', 'aria-label', 'title', 'alt'];
  var SKIP = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1 };
  function link(a) {
    var h = a.getAttribute('href'); if (a.hasAttribute('hreflang')) return;
    if (h && h.charAt(0) === '/' && h.charAt(1) !== '/' && !/^\/(assets|admin|ka|ru)(\/|$)/.test(h)) a.setAttribute('href', '/' + L + h);
  }
  function walk(n) {
    if (n.nodeType === 3) {
      var p = n.parentNode; if (!p || SKIP[p.nodeName]) return;
      var t = tr(n.nodeValue); if (t != null && t !== n.nodeValue) n.nodeValue = t;
      return;
    }
    if (n.nodeType !== 1 || SKIP[n.nodeName] || n.closest && n.closest('.adm, [data-no-tr]')) return;
    ATTRS.forEach(function (a) { var v = n.getAttribute(a); if (v) { var t = tr(v); if (t != null) n.setAttribute(a, t); } });
    if (n.nodeName === 'A') link(n);
    for (var c = n.firstChild; c; c = c.nextSibling) walk(c);
  }
  window.CHD_T = function (s) { var t = tr(s); return t == null ? s : t; };
  function start() {
    walk(document.body);
    new MutationObserver(function (ms) {
      ms.forEach(function (m) {
        if (m.type === 'characterData') walk(m.target);
        else if (m.type === 'attributes') walk(m.target);
        else m.addedNodes.forEach(walk);
      });
    }).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS.concat(['href']) });
  }
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
})();
