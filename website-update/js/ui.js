(function (FMX) {
'use strict';
var esc = FMX.esc, icon = FMX.icon, $ = FMX.$;

/* =========================================================
   COVERS — always resolves to real pixels.
   ========================================================= */
function makePoster(title, year, id) {
  title = title || 'Untitled';
  year = String(year || '').slice(0, 4);
  var h = FMX.hashStr(String(title) + (id || ''));
  var a = h % 360, b = (h * 7 + 137) % 360;

  var words = String(title).split(/\s+/), lines = [], cur = '';
  words.forEach(function (w) {
    if ((cur + ' ' + w).trim().length > 13 && cur) { lines.push(cur); cur = w; }
    else cur = (cur + ' ' + w).trim();
  });
  if (cur && lines.length < 4) lines.push(cur);
  lines = lines.slice(0, 4);
  var y0 = 178 - (lines.length - 1) * 10;
  var spans = lines.map(function (l, i) {
    return '<tspan x="100" dy="' + (i ? 21 : 0) + '">' + esc(l) + '</tspan>';
  }).join('');

  var svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450" viewBox="0 0 200 300">' +
      '<defs>' +
        '<linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
          '<stop offset="0" stop-color="hsl(' + a + ',68%,36%)"/>' +
          '<stop offset="1" stop-color="hsl(' + b + ',64%,15%)"/>' +
        '</linearGradient>' +
        '<radialGradient id="v" cx="0.5" cy="0.35" r="0.75">' +
          '<stop offset="0" stop-color="rgba(0,0,0,0)"/>' +
          '<stop offset="1" stop-color="rgba(0,0,0,.55)"/>' +
        '</radialGradient>' +
      '</defs>' +
      '<rect width="200" height="300" fill="url(#g)"/>' +
      '<rect width="200" height="300" fill="url(#v)"/>' +
      '<g fill="rgba(0,0,0,.28)">' +
        '<rect x="7" y="16" width="4" height="5" rx="1.4"/>' +
        '<rect x="7" y="30" width="4" height="5" rx="1.4"/>' +
        '<rect x="7" y="44" width="4" height="5" rx="1.4"/>' +
        '<rect x="7" y="58" width="4" height="5" rx="1.4"/>' +
        '<rect x="189" y="16" width="4" height="5" rx="1.4"/>' +
        '<rect x="189" y="30" width="4" height="5" rx="1.4"/>' +
        '<rect x="189" y="44" width="4" height="5" rx="1.4"/>' +
        '<rect x="189" y="58" width="4" height="5" rx="1.4"/>' +
      '</g>' +
      '<circle cx="100" cy="106" r="48" fill="rgba(255,255,255,.10)"/>' +
      '<circle cx="100" cy="106" r="48" fill="none" stroke="rgba(255,255,255,.16)"/>' +
      '<path d="M88 90 L118 106 L88 122 Z" fill="rgba(255,255,255,.88)"/>' +
      '<text x="100" y="' + y0 + '" text-anchor="middle" font-family="Inter,Arial,sans-serif" ' +
        'font-size="14.5" font-weight="600" fill="rgba(255,255,255,.96)">' + spans + '</text>' +
      '<text x="100" y="' + (y0 + 27) + '" text-anchor="middle" font-family="Inter,Arial,sans-serif" ' +
        'font-size="11" letter-spacing="1.5" fill="rgba(255,255,255,.62)">' + esc(year) + '</text>' +
      '<text x="100" y="278" text-anchor="middle" font-family="Inter,Arial,sans-serif" ' +
        'font-size="8.5" letter-spacing="2" fill="rgba(255,255,255,.34)">FILMX</text>' +
    '</svg>';

  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg).replace(/'/g, '%27');
}

function coverOf(d) {
  if (!d) return makePoster('Untitled', '', '');
  if (d.Poster && d.Poster !== 'N/A' && /^https?:/.test(d.Poster)) return d.Poster;
  var id = d.imdbID || d.id;
  if (id && /^tt\d+$/.test(id)) {
    return FMX.CONFIG.posterApi + '?apikey=' + FMX.OMDB_KEY() + '&i=' + id;
  }
  return makePoster(d.Title, d.Year, id);
}

function artBg(d) {
  return ' style="background-image:url(\'' + makePoster(d.Title, d.Year, d.imdbID || d.id) + '\')"';
}

/* swaps in the generated poster — never leaves the slot empty */
function posterFallback(img) {
  if (img.dataset.done) return;
  img.dataset.done = '1';
  img.style.visibility = '';
  img.src = makePoster(img.dataset.t || 'Untitled', img.dataset.y || '', img.dataset.id || '');
}

function layeredBg(d) {
  var real = (d.Backdrop && /^https?:/.test(d.Backdrop)) ? d.Backdrop : coverOf(d);
  var gen = makePoster(d.Title, d.Year, d.imdbID || d.id);
  if (real === gen) return 'background-image:url(\'' + gen + '\')';
  return 'background-image:url(\'' + real + '\'),url(\'' + gen + '\')';
}

/* ---------------- toast ---------------- */
function toast(msg, kind, ms) {
  var host = $('#toasts'); if (!host) return;
  var el = document.createElement('div');
  el.className = 'toast toast--' + (kind || 'ok');
  el.innerHTML = icon(kind === 'ok' ? 'ok' : 'warn', 15) + '<span>' + esc(msg) + '</span>';
  host.appendChild(el);
  var kill = function () { if (el.parentNode) el.parentNode.removeChild(el); };
  setTimeout(kill, ms || 2600);
  el.addEventListener('click', kill);
}

/* ---------------- skeleton / empty ---------------- */
function skelCard() {
  return '<div class="skel"><div class="skel__art"></div><div class="skel__l"></div><div class="skel__l"></div></div>';
}
function skelRow(n) { var o = ''; for (var i = 0; i < (n || 6); i++) o += skelCard(); return o; }
function emptyBox(title, sub, ctaIcon, ctaHTML) {
  return '<div class="empty" style="grid-column:1/-1">' +
    '<div class="empty__ic">' + (ctaIcon || '') + '</div>' +
    '<h3>' + esc(title) + '</h3><p>' + esc(sub) + '</p>' +
    (ctaHTML ? '<div style="margin-top:16px">' + ctaHTML + '</div>' : '') + '</div>';
}

/* ---------------- card ---------------- */
function card(d) {
  if (!d) return '';
  var id = d.imdbID || d.id;
  var saved = FMX.watchlist.has(id);
  var pr = FMX.progress.get(id);
  var rating = FMX.ratingOf(d);

  FMX.titles = FMX.titles || {};
  FMX.titles[id] = { id: id, imdbID: id, Title: d.Title, Year: d.Year, Type: d.Type, Poster: d.Poster };

  return '<article class="card" data-id="' + esc(id) + '">' +
    '<a class="card__link" href="#/title/' + esc(id) + '">' +
      '<div class="card__art"' + artBg(d) + '>' +
        '<img class="card__img" src="' + esc(coverOf(d)) + '" alt="' + esc(d.Title) + ' cover" ' +
          'loading="lazy" decoding="async" ' +
          'data-t="' + esc(d.Title) + '" data-y="' + esc(FMX.yearOf(d)) + '" data-id="' + esc(id) + '" ' +
          'onerror="window.FMX.posterFallback(this)">' +
        (rating ? '<span class="card__rate">' + icon('star', 9) + esc(rating) + '</span>' : '') +
        '<span class="card__type">' + (d.Type === 'series' ? 'TV' : 'Film') + '</span>' +
        (pr && pr.pct > 1 ? '<span class="card__bar"><i style="width:' + FMX.clamp(pr.pct, 0, 100) + '%"></i></span>' : '') +
      '</div>' +
      '<div class="card__meta">' +
        '<h3 class="card__title">' + esc(d.Title) + '</h3>' +
        '<p class="card__sub">' + esc(FMX.yearOf(d)) + ' &middot; ' + (d.Type === 'series' ? 'TV show' : 'Movie') +
          (FMX.runtimeOf(d) ? ' &middot; ' + esc(FMX.runtimeOf(d)) : '') + '</p>' +
      '</div>' +
    '</a>' +
    '<div class="card__ov"><div class="card__ov-btns">' +
      '<button class="ibtn ' + (saved ? 'is-on' : '') + '" data-wl="' + esc(id) + '" title="Watchlist" aria-label="Watchlist">' +
        icon(saved ? 'check' : 'plus', 14) + '</button>' +
      '<a class="ibtn" href="#/watch/' + esc(id) + '" title="Play" aria-label="Play">' + icon('play', 13) + '</a>' +
    '</div></div>' +
  '</article>';
}
function cardGrid(items) { return '<div class="grid">' + items.map(card).join('') + '</div>'; }

/* ---------------- hero ---------------- */
var heroTimer = null;
function heroHTML() {
  return '<section class="hero" id="hero">' +
    '<div class="hero__bg" id="heroBg"></div><div class="hero__sc"></div>' +
    '<div class="hero__in" id="heroIn"></div><div class="hero__dots" id="heroDots"></div></section>';
}
function mountHero(items) {
  var list = (items || []).filter(Boolean);
  if (!list.length) return;
  var i = 0;
  var bg = document.getElementById('heroBg');
  var body = document.getElementById('heroIn');
  var dots = document.getElementById('heroDots');

  function paint() {
    var d = list[i], id = d.imdbID || d.id;
    if (bg) {
      bg.style.opacity = 0;
      setTimeout(function () {
        bg.style.cssText = layeredBg(d) + ';background-size:cover;background-position:center 18%;opacity:1';
      }, 120);
    }
    if (body) body.innerHTML =
      '<div class="hero__poster"' + artBg(d) + '>' +
        '<img src="' + esc(coverOf(d)) + '" alt="' + esc(d.Title) + ' cover" ' +
        'data-t="' + esc(d.Title) + '" data-y="' + esc(FMX.yearOf(d)) + '" data-id="' + esc(id) + '" ' +
        'onerror="window.FMX.posterFallback(this)"></div>' +
      '<div class="hero__tx">' +
        '<span class="pill pill--brand">Featured &middot; ' + (d.Type === 'series' ? 'TV show' : 'Movie') + '</span>' +
        '<h1>' + esc(d.Title) + '</h1>' +
        '<div class="hero__meta"><span>' + esc(FMX.yearOf(d)) + '</span>' +
          (d.Rated && d.Rated !== 'N/A' ? '<span class="pill">' + esc(d.Rated) + '</span>' : '') +
          (FMX.runtimeOf(d) ? '<span>' + esc(FMX.runtimeOf(d)) + '</span>' : '') +
          (FMX.ratingOf(d) ? '<span class="dtl__score">' + icon('star', 12) + esc(FMX.ratingOf(d)) + '</span>' : '') +
        '</div>' +
        '<p class="hero__plot">' + esc(d.Plot && d.Plot !== 'N/A' ? d.Plot : 'Open the title page for the full synopsis, cast and ratings.') + '</p>' +
        '<div class="hero__btns">' +
          '<a class="btn btn--pri btn--lg" href="#/watch/' + esc(id) + '">' + icon('play', 14) + 'Watch now</a>' +
          '<a class="btn btn--lg" href="#/title/' + esc(id) + '">' + icon('info', 14) + 'Details</a>' +
          '<button class="btn btn--lg ' + (FMX.watchlist.has(id) ? 'btn--on' : '') + '" data-wl="' + esc(id) + '">' +
            icon(FMX.watchlist.has(id) ? 'check' : 'plus', 14) + '<span>' +
            (FMX.watchlist.has(id) ? 'Saved' : 'Watchlist') + '</span></button>' +
        '</div>' +
      '</div>';
    if (dots) dots.innerHTML = list.map(function (_, n) {
      return '<button class="' + (n === i ? 'is-on' : '') + '" data-hero="' + n + '"></button>';
    }).join('');
  }

  function reset() {
    clearInterval(heroTimer);
    heroTimer = setInterval(function () { i = (i + 1) % list.length; paint(); }, 7000);
  }
  paint();
  if (dots) dots.onclick = function (e) {
    var b = e.target.closest('[data-hero]');
    if (b) { i = +b.dataset.hero; paint(); reset(); }
  };
  reset();
  return function () { clearInterval(heroTimer); };
}

/* ---------------- modal ---------------- */
var escHandler = null;
function openModal(title, body, actions) {
  var root = document.getElementById('modal-root');
  root.innerHTML = '<div class="modal"><div class="modal__box">' +
    '<div class="modal__hd"><h3>' + title + '</h3>' +
    '<button class="ibtn" data-close aria-label="Close">' + icon('close', 14) + '</button></div>' +
    '<div class="modal__bd">' + body + '</div>' +
    (actions ? '<div class="modal__hd">' + actions + '</div>' : '') + '</div></div>';
  root.querySelector('[data-close]').onclick = closeModal;
  root.querySelector('.modal').onclick = function (e) {
    if (e.target.classList.contains('modal')) closeModal();
  };
  escHandler = FMX.on(document, 'keydown', function (e) { if (e.key === 'Escape') closeModal(); });
}
function closeModal() {
  document.getElementById('modal-root').innerHTML = '';
  if (escHandler) { escHandler(); escHandler = null; }
}

FMX.ui = {
  makePoster: makePoster, coverOf: coverOf, artBg: artBg, layeredBg: layeredBg,
  posterFallback: posterFallback, toast: toast, card: card, cardGrid: cardGrid,
  skelCard: skelCard, skelRow: skelRow, emptyBox: emptyBox,
  heroHTML: heroHTML, mountHero: mountHero, openModal: openModal, closeModal: closeModal
};
window.FMX.posterFallback = posterFallback;

})(window.FMX = window.FMX || {});