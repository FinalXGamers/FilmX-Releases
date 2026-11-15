/* brand.js — FilmX naming, title, provider wording, covers, toolbar, drawer */
window.FMX = window.FMX || {};
(function (FMX) {
  'use strict';

  var TITLE = 'FilmX Made By FinalXGamers';

  var RULES = [
    [/TMDB API key \(v3\)/g, 'API key'],
    [/OMDb key \(fallback\)/g, 'Backup key'],
    [/Metadata courtesy of TMDB and OMDb\./g, 'Metadata from public movie databases.'],
    [/Metadata via OMDb/g, 'Metadata from public sources'],
    [/The OMDb API\./g, 'A public movie database.'],
    [/the OMDb API/g, 'a public movie database'],
    [/TMDb|TMDB/g, 'database'],
    [/OMDb/g, 'database']
  ];

  var ROOTS = ['main', 'ftr', 'toasts'];
  var busy = false;

  function scrub(el) {
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
    var node, batch = [];
    while ((node = walker.nextNode())) batch.push(node);
    for (var i = 0; i < batch.length; i++) {
      var t = batch[i], v = t.nodeValue, out = v;
      for (var r = 0; r < RULES.length; r++) out = out.replace(RULES[r][0], RULES[r][1]);
      if (out !== v) t.nodeValue = out;
    }
  }

  function dropProviderLinks(el) {
    var links = el.querySelectorAll('a[href*="omdbapi.com"], a[href*="themoviedb.org"]');
    for (var i = 0; i < links.length; i++) {
      var a = links[i];
      if (a.parentNode) a.parentNode.removeChild(a);
    }
  }

  /* ---------- wordmark + tab title ---------- */
  function applyBrand() {
    if (document.title !== TITLE) document.title = TITLE;
  }

  /* ---------- hide key fields ---------- */
  function hideKeyFields() {
    ['pKey', 'pOmdb'].forEach(function (id) {
      var inp = document.getElementById(id);
      if (!inp) return;
      var box = inp.closest('label');
      if (box) box.classList.add('fx-hidden');
    });
    var save = document.getElementById('saveKey');
    if (save) save.classList.add('fx-hidden');
  }

  /* ---------- own mobile drawer ---------- */
  var LINKS = [
    ['#/', 'Home'], ['#/movies', 'Movies'], ['#/tv', 'TV shows'],
    ['#/genre/action', 'Genres'], ['#/watchlist', 'Watchlist'],
    ['#/continue', 'Continue'], ['#/suggest', 'Feedback'], ['#/about', 'About']
  ];

  function buildDrawer() {
    if (document.getElementById('fxDrawer')) return;
    var d = document.createElement('div');
    d.id = 'fxDrawer';
    var links = FMX.isAppSurface ? LINKS :
      LINKS.slice(0, 6).concat([['#/downloads', 'Apps and downloads']], LINKS.slice(6));
    d.innerHTML = links.map(function (l) {
      return '<a href="' + l[0] + '">' + l[1] + '</a>';
    }).join('');
    document.body.appendChild(d);
    d.addEventListener('click', function (e) {
      if (e.target.closest && e.target.closest('a')) closeDrawer();
    });
  }

  function openDrawer() {
    document.body.classList.add('fx-nav');
    var button = document.getElementById('burger');
    if (button) button.setAttribute('aria-expanded', 'true');
  }
  function closeDrawer() {
    document.body.classList.remove('fx-nav');
    var button = document.getElementById('burger');
    if (button) button.setAttribute('aria-expanded', 'false');
  }

  function bindBurger() {
    if (document.body.dataset.fxBurger) return;
    document.body.dataset.fxBurger = '1';

    document.addEventListener('click', function (e) {
      var btn = e.target.closest && e.target.closest('#burger, .hdr__burger');
      if (btn) {
        e.preventDefault();
        if (document.body.classList.contains('fx-nav')) closeDrawer();
        else openDrawer();
        return;
      }
      if (document.body.classList.contains('fx-nav') &&
          !(e.target.closest && e.target.closest('#fxDrawer'))) closeDrawer();
    }, true);
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeDrawer();
  });

  /* ---------- cover repair ---------- */
  function xmlEsc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function posterSVG(title) {
    var t = String(title || 'FilmX').trim().slice(0, 44);
    var h = 0, i;
    for (i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) % 360;
    var a = 'hsl(' + h + ',60%,27%)';
    var b = 'hsl(' + ((h + 48) % 360) + ',55%,11%)';

    var words = xmlEsc(t).split(/\s+/), lines = [], cur = '';
    for (i = 0; i < words.length; i++) {
      if ((cur + ' ' + words[i]).trim().length > 15 && cur) { lines.push(cur); cur = words[i]; }
      else cur = (cur ? cur + ' ' : '') + words[i];
      if (lines.length === 3) break;
    }
    if (cur && lines.length < 4) lines.push(cur);

    var startY = 225 - (lines.length - 1) * 21;
    var text = '';
    for (i = 0; i < lines.length; i++) {
      text += '<text x="150" y="' + (startY + i * 42) + '" text-anchor="middle" ' +
              'font-family="Inter,Segoe UI,Arial,sans-serif" font-size="27" font-weight="600" ' +
              'fill="rgba(255,255,255,.94)">' + lines[i] + '</text>';
    }

    var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 450">' +
      '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="' + a + '"/><stop offset="1" stop-color="' + b + '"/>' +
      '</linearGradient></defs>' +
      '<rect width="300" height="450" fill="url(#g)"/>' + text +
      '<text x="150" y="424" text-anchor="middle" font-family="Inter,Arial,sans-serif" ' +
      'font-size="11" letter-spacing="2" fill="rgba(255,255,255,.42)">FILMX</text>' +
      '</svg>';

    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  function repair(img) {
    if (!img || img.dataset.cvFixed) return;
    img.dataset.cvFixed = '1';
    img.src = posterSVG(img.getAttribute('alt') || img.getAttribute('data-title') || '');
    img.style.objectFit = 'cover';
  }

  function sweep() {
    var main = document.getElementById('main');
    if (!main) return;
    var imgs = main.querySelectorAll('img');
    for (var i = 0; i < imgs.length; i++) {
      var im = imgs[i];
      if (im.dataset.cvFixed) continue;
      if (!im.getAttribute('src') || (im.complete && im.naturalWidth === 0)) repair(im);
    }
  }

  document.addEventListener('error', function (e) {
    var t = e.target;
    if (t && t.tagName === 'IMG' && t.closest && t.closest('#main')) repair(t);
  }, true);

  /* ---------- player toolbar: keep only the language selector ---------- */
  var BAR_SEL = '.player__bar, .player-bar, .player__tools, .player__controls, ' +
                '[class*="player"][class*="tool"]';
  var KEEP = /lang|language|subtitle|caption|subs|\bcc\b/i;

  function trimBars() {
    var main = document.getElementById('main');
    if (!main) return;
    var bars = main.querySelectorAll(BAR_SEL);
    for (var b = 0; b < bars.length; b++) {
      var bar = bars[b];
      if (bar.dataset.fxTrim) continue;
      var kids = bar.children, i, keep = [];
      for (i = 0; i < kids.length; i++) {
        var k = kids[i];
        var sig = (k.id || '') + ' ' + (k.className || '') + ' ' + (k.textContent || '');
        if (k.tagName === 'SELECT' || KEEP.test(sig)) keep.push(k);
      }
      if (!keep.length) continue;
      bar.dataset.fxTrim = '1';
      for (i = 0; i < kids.length; i++) {
        if (keep.indexOf(kids[i]) === -1) kids[i].classList.add('fx-hidden');
      }
      bar.style.flexWrap = 'nowrap';
    }
  }

  function hideServerChips() {
    var main = document.getElementById('main');
    if (!main) return;
    var btns = main.querySelectorAll('[data-server]');
    for (var i = 0; i < btns.length; i++) {
      var p = btns[i].parentElement;
      if (p && !p.dataset.fxTrim) { p.dataset.fxTrim = '1'; p.classList.add('fx-hidden'); }
    }
  }

  /* ---------- R = random title ---------- */
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'r' && e.key !== 'R') return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var t = e.target;
    if (t && /INPUT|SELECT|TEXTAREA/.test(t.tagName)) return;
    if (!FMX.pick || !FMX.ALL_IDS) return;
    location.hash = '/title/' + FMX.pick(FMX.ALL_IDS);
    if (FMX.ui) FMX.ui().toast('Random pick · R again for another');
  });

  var style = document.createElement('style');
  style.textContent =
    '.fx-hidden{display:none!important}' +
    '#hdr .fx-brand i{font-style:normal;background:linear-gradient(90deg,#7c5cff,#22d3ee);' +
    '-webkit-background-clip:text;background-clip:text;color:transparent}' +

    /* compact burger, pinned right */
    '.hdr__tools{margin-left:auto!important;align-items:center!important}' +
    '#burger,.hdr__burger{width:30px!important;min-width:30px!important;height:30px!important;' +
      'padding:0!important;border-radius:9px!important;display:inline-flex!important;' +
      'align-items:center!important;justify-content:center!important;flex:0 0 auto!important;' +
      'order:99!important}' +
    '#burger svg,.hdr__burger svg{width:15px!important;height:15px!important}' +

    /* drawer — explicit colours so both themes work */
    '#fxDrawer{display:none;position:fixed;left:auto;right:10px;top:calc(var(--hdr-h,56px) + 8px);' +
      'z-index:9998;width:min(264px,calc(100vw - 20px));max-height:calc(100dvh - var(--hdr-h,56px) - 24px);' +
      'overflow:auto;padding:7px;border:1px solid #232838;border-radius:14px;' +
      'background:#0d1017;box-shadow:0 14px 34px rgba(0,0,0,.45)}' +
    'body.fx-nav #fxDrawer{display:flex;flex-direction:column;gap:2px}' +
    '#fxDrawer a{display:block;padding:9px 11px;border-radius:9px;' +
      'color:#eef1f7;font-size:13px;font-weight:500;line-height:1.35;text-decoration:none}' +
    '#fxDrawer a:hover{background:rgba(255,255,255,.07)}' +

    '[data-theme="light"] #fxDrawer{background:#ffffff;border-bottom-color:#e3e8f1;' +
      'box-shadow:0 14px 30px rgba(16,22,35,.14)}' +
    '[data-theme="light"] #fxDrawer a{color:#101623}' +
    '[data-theme="light"] #fxDrawer a:hover{background:rgba(16,22,35,.06)}';

  document.head.appendChild(style);

  /* ---------- main pass ---------- */
  function pass() {
    if (busy) return;
    busy = true;
    for (var i = 0; i < ROOTS.length; i++) {
      var el = document.getElementById(ROOTS[i]);
      if (!el) continue;
      dropProviderLinks(el);
      scrub(el);
    }
    busy = false;
    applyBrand();
    hideKeyFields();
    buildDrawer();
    bindBurger();
    sweep();
    trimBars();
    hideServerChips();
  }

  var queued = false;
  function queue() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () { queued = false; pass(); });
  }

  function start() {
    pass();
    var obs = new MutationObserver(queue);
    for (var i = 0; i < ROOTS.length; i++) {
      var el = document.getElementById(ROOTS[i]);
      if (el) obs.observe(el, { childList: true, subtree: true, characterData: true });
    }
    var hdr = document.getElementById('hdr');
    if (hdr) obs.observe(hdr, { childList: true, subtree: true });
    FMX.brandObserver = obs;
    setTimeout(pass, 400);
    setTimeout(pass, 1500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
  window.addEventListener('load', queue);
  window.addEventListener('hashchange', function () { closeDrawer(); queue(); });
})(window.FMX);