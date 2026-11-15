(function (FMX) {
'use strict';

var esc = FMX.esc, icon = FMX.icon;
var U = function () { return FMX.ui; };
var pages = {};

function kv(k, v) { return '<div class="kv"><span>' + esc(k) + '</span><span>' + esc(v || '—') + '</span></div>'; }
function faq(q, a) { return '<details><summary>' + esc(q) + '</summary><div class="acc__bd">' + esc(a) + '</div></details>'; }
function live() { return !!(FMX.TMDB_KEY && FMX.TMDB_KEY()); }
function ctxId(a) {
  if (a == null) return '';
  if (typeof a === 'object') {
    if (a.id) return String(a.id);
    if (a.params) return String(a.params.id || a.params.genre || a.params.q || '');
    return '';
  }
  return String(a);
}

pages.home = function (main) {
  var continueIds = FMX.progress.watching().slice(0, 8).map(function (p) { return p.id; });
  var recentIds = FMX.recent.all().slice(0, 8).map(function (r) { return r.id; });
  var unmountHero = null;

  main.innerHTML = '<div class="wrap"><div id="heroSlot"></div><div id="contSlot"></div>' +
    '<div id="recentSlot"></div><div id="rowSlot"></div>' +
    '<section class="sec"><div class="sec__hd"><div><h2>Browse by genre</h2>' +
    '<p class="sec__sub">jump straight to a mood</p></div></div>' +
    '<div class="chips chips--scroll"><a class="chip" href="#/movies">All movies</a>' +
    Object.keys(FMX.GENRES || {}).map(function (k) {
      return '<a class="chip" href="#/genre/' + k + '">' + esc(FMX.GENRES[k].name) + '</a>';
    }).join('') + '<a class="chip" href="#/tv">All TV</a></div></section></div>';

  var slot = document.getElementById('rowSlot');
  var rows = [
    { title: 'Trending this week', sub: 'what everyone is watching', kind: 'movie', mode: 'trending' },
    { title: 'New releases', sub: 'fresh in the last two years', kind: 'movie', mode: 'recent' },
    { title: 'Trending shows', sub: 'series people are bingeing', kind: 'series', mode: 'trending' },
    { title: 'Top rated', sub: 'highest scores', kind: 'movie', mode: 'rating' }
  ];

  slot.innerHTML = rows.map(function (r, i) {
    return '<section class="sec"><div class="sec__hd"><div><h2>' + esc(r.title) + '</h2>' +
      '<p class="sec__sub">' + esc(r.sub) + '</p></div></div>' +
      '<div class="grid" id="row' + i + '">' + U().skelRow(6) + '</div></section>';
  }).join('');

  rows.forEach(function (r, i) {
    var el = document.getElementById('row' + i);
    if (!el) return;
    var run = r.mode === 'trending'
      ? function () { return FMX.trending(r.kind); }
      : function () { return FMX.discover({ type: r.kind, sort: r.mode === 'rating' ? 'rating' : 'default', recent: r.mode === 'recent' }); };
    run().then(function (res) {
      var items = (res.results || []).slice(0, 12);
      el.innerHTML = items.length ? items.map(U().card).join('') : '<p class="small muted">Nothing to show.</p>';
    }).catch(function () { el.innerHTML = '<p class="small muted">Unavailable right now.</p>'; });
  });

  if (live()) {
    FMX.trending('movie').then(function (res) {
      var items = res.results.slice(0, 5);
      if (!items.length) return;
      var h = document.getElementById('heroSlot');
      h.innerHTML = U().heroHTML();
      unmountHero = U().mountHero(items);
    }).catch(function () {});
  }

  if (continueIds.length) {
    FMX.getMany(continueIds).then(function (items) {
      var s = document.getElementById('contSlot'), list = items.filter(Boolean);
      if (!s || !list.length) return;
      s.innerHTML = '<section class="sec"><div class="sec__hd"><div><h2>Continue watching</h2>' +
        '<p class="sec__sub">pick up where you stopped</p></div>' +
        '<a class="sec__more" href="#/continue">See all</a></div>' +
        '<div class="grid">' + list.map(U().card).join('') + '</div></section>';
    });
  }

  if (recentIds.length) {
    FMX.getMany(recentIds).then(function (items) {
      var s = document.getElementById('recentSlot'), list = items.filter(Boolean);
      if (!s || !list.length) return;
      s.innerHTML = '<section class="sec"><div class="sec__hd"><div><h2>Recently viewed</h2></div></div>' +
        '<div class="grid">' + list.map(U().card).join('') + '</div></section>';
    });
  }

  return function () { if (unmountHero) unmountHero(); };
};

pages.downloads = function (main) {
  main.innerHTML = '<div class="wrap downloads-page">' +
    '<header class="downloads-hero"><span class="downloads-eyebrow">FILMX EVERYWHERE</span>' +
      '<h1>FilmX, on your screen</h1>' +
      '<p class="muted">Install FilmX on your phone, tablet, or computer. Pick your device to get started.</p></header>' +
    '<section class="download-grid" aria-label="FilmX apps">' +
      '<article class="download-card download-card--featured">' +
        '<div class="download-card__top"><div class="download-card__icon download-card__icon--android">' + icon('phone', 24) + '</div>' +
          '<span class="download-card__tag">ANDROID</span></div><h2>FilmX for Android</h2>' +
        '<p>Install the Android app on your phone or tablet.</p>' +
        '<a class="btn btn--pri" href="' + esc(FMX.CONFIG.androidDownload) + '" target="_blank" rel="noopener">' + icon('download', 16) + 'Download APK</a>' +
        '<span class="download-card__note">Android 7.0 or later · APK installer</span>' +
      '</article>' +
      '<article class="download-card">' +
        '<div class="download-card__top"><div class="download-card__icon">' + icon('monitor', 24) + '</div>' +
          '<span class="download-card__tag">WINDOWS</span></div><h2>FilmX for Windows</h2>' +
        '<p>Install FilmX as a desktop app with Start Menu and desktop shortcuts.</p>' +
        '<a class="btn btn--secondary" href="https://github.com/FinalXGamers/FilmX-Releases/releases/download/desktop-v1.0.2/FilmX-1.0.2-Windows-Setup.exe">' +
          icon('download', 16) + 'Download Windows app</a>' +
        '<span class="download-card__note">Windows 10 or later · 64-bit installer · Internet required</span>' +
      '</article>' +
      '<article class="download-card">' +
        '<div class="download-card__top"><div class="download-card__icon">' + icon('monitor', 24) + '</div>' +
          '<span class="download-card__tag">MACOS</span></div><h2>FilmX for Mac</h2>' +
        '<p>One universal disk image for Intel and Apple Silicon Macs.</p>' +
        '<a class="btn btn--secondary" href="https://github.com/FinalXGamers/FilmX-Releases/releases/download/desktop-v1.0.1/FilmX-1.0.1-macOS.dmg">' +
          icon('download', 16) + 'Download Mac app</a>' +
        '<span class="download-card__note">macOS 12 or later · Not signed/notarized; macOS may ask you to approve opening it</span>' +
      '</article>' +
      '<article class="download-card">' +
        '<div class="download-card__top"><div class="download-card__icon">' + icon('monitor', 24) + '</div>' +
          '<span class="download-card__tag">LINUX</span></div><h2>FilmX for Linux</h2>' +
        '<p>Run FilmX as a standalone AppImage on most 64-bit Linux distributions.</p>' +
        '<a class="btn btn--secondary" href="https://github.com/FinalXGamers/FilmX-Releases/releases/download/desktop-v1.0.1/FilmX-1.0.1-Linux.AppImage">' +
          icon('download', 16) + 'Download Linux app</a>' +
        '<span class="download-card__note">64-bit AppImage · You may need to allow the file to run as an application</span>' +
      '</article>' +
      '<article class="download-card">' +
        '<div class="download-card__top"><div class="download-card__icon">' + icon('phone', 24) + '</div>' +
          '<span class="download-card__tag">IPHONE · IPAD</span></div><h2>Add FilmX to iPhone</h2>' +
        '<p>Install FilmX from Safari for an app-like icon on your Home Screen.</p>' +
        '<div class="download-install-steps"><span><b>1</b>Open FilmX in Safari.</span>' +
          '<span><b>2</b>Tap Share, then <b>Add to Home Screen</b>.</span></div>' +
        '<a class="btn btn--secondary" href="/">Open FilmX</a>' +
        '<span class="download-card__note">Web app install · No IPA or App Store version is published</span>' +
      '</article>' +
    '</section>' +
    '<section class="download-help"><div class="download-help__icon">' + icon('message', 21) + '</div>' +
      '<div><h2>Need help installing?</h2><p>Tell us which device you use and we’ll help.</p></div>' +
      '<a class="btn btn--secondary" href="#/suggest">Contact FilmX support</a></section>' +
      '<p class="download-card__note" style="text-align:center"><a href="https://github.com/FinalXGamers/FilmX-Releases/releases" target="_blank" rel="noopener">View all FilmX installers and releases on GitHub</a></p>' +
    '</div>';
};

pages.browse = function (main, opts) {
  if (typeof opts === 'string') opts = { genre: opts };
  opts = opts || {};
  var isTV = opts.type === 'series';
  var genreSlug = opts.genre && FMX.GENRES && FMX.GENRES[opts.genre] ? opts.genre : '';
  var state = { page: 1, sort: 'default', minRating: 0, decade: '', acc: [], done: false };

  main.innerHTML = '<div class="wrap"><div class="results-head"><div><h1>' +
    (genreSlug ? esc(FMX.GENRES[genreSlug].name) : isTV ? 'TV shows' : 'Movies') + '</h1>' +
    '<p class="sec__sub" id="count">Loading…</p></div></div>' +
    '<div class="filters">' +
    '<label class="field"><span class="field__lbl">Sort</span><select class="select" id="fSort">' +
    '<option value="default">Most popular</option><option value="rating">Highest rated</option>' +
    '<option value="year-new">Newest</option><option value="year-old">Oldest</option>' +
    '<option value="az">A–Z</option></select></label>' +
    '<label class="field"><span class="field__lbl">Rating</span><select class="select" id="fRating">' +
    '<option value="0">Any</option><option value="6">6+</option><option value="7">7+</option>' +
    '<option value="8">8+</option><option value="8.5">8.5+</option></select></label>' +
    '<label class="field"><span class="field__lbl">Era</span><select class="select" id="fDecade">' +
    '<option value="">Any</option><option value="2020">2020s</option><option value="2010">2010s</option>' +
    '<option value="2000">2000s</option><option value="1990">1990s</option>' +
    '<option value="classic">Before 1980</option></select></label></div>' +
    '<div class="grid" id="results"></div><div class="load-more" id="moreSlot"></div></div>';

  function paint() {
    var box = document.getElementById('results');
    if (!box) return;
    box.innerHTML = state.acc.length ? state.acc.map(U().card).join('')
      : U().emptyBox('Nothing here', 'Loosen the filters and try again.');
    document.getElementById('count').textContent = FMX.plural(state.acc.length, 'title');
    document.getElementById('moreSlot').innerHTML = state.done ? '' : '<button class="btn" id="moreBtn">Load more</button>';
    var mb = document.getElementById('moreBtn');
    if (mb) mb.onclick = function () { state.page++; load(); };
  }

  function load(reset) {
    if (reset) { state.page = 1; state.acc = []; state.done = false; document.getElementById('results').innerHTML = U().skelRow(12); }
    if (!live()) { state.done = true; paint(); return; }
    FMX.discover({
      type: isTV ? 'series' : 'movie', genre: genreSlug, sort: state.sort,
      minRating: state.minRating, decade: state.decade, page: state.page
    }).then(function (res) {
      if (reset) state.acc = [];
      var seen = {};
      state.acc.forEach(function (d) { seen[d.tmdbID] = 1; });
      (res.results || []).forEach(function (d) {
        if (seen[d.tmdbID]) return;
        seen[d.tmdbID] = 1; state.acc.push(d);
      });
      state.done = !res.results.length || state.page >= res.pages;
      paint();
    }).catch(function () { state.done = true; paint(); });
  }

  document.getElementById('fSort').onchange = function (e) { state.sort = e.target.value; load(true); };
  document.getElementById('fRating').onchange = function (e) { state.minRating = parseFloat(e.target.value); load(true); };
  document.getElementById('fDecade').onchange = function (e) { state.decade = e.target.value; load(true); };
  load(true);
};

pages.movies = function (main) { return pages.browse(main, { type: 'movie' }); };
pages.tv = function (main) { return pages.browse(main, { type: 'series' }); };
pages.genre = function (main, a) { return pages.browse(main, { genre: ctxId(a) }); };

pages.detail = function (main, a) {
  var id = ctxId(a);
  main.innerHTML = '<div class="wrap"><p class="muted" style="padding:60px 0">Loading…</p></div>';

  return FMX.getTitle(id).then(function (d) {
    if (!d) { main.innerHTML = '<div class="wrap">' + U().emptyBox('Not found', 'This title is gone.') + '</div>'; return; }
    var isTV = d.Type === 'series';
    var saved = FMX.watchlist.has(d.imdbID);
    var pr = FMX.progress.get(d.imdbID);
    var genres = (d.Genre || '').split(',').map(function (g) { return g.trim(); }).filter(Boolean);

    main.innerHTML = '<div class="wrap"><div class="dtl"><div><div class="dtl__poster">' +
      '<img src="' + esc(d.Poster && d.Poster !== 'N/A' ? d.Poster : U().coverOf(d)) + '" alt="' + esc(d.Title) + '"></div></div>' +
      '<div><h1>' + esc(d.Title) + '</h1>' +
      '<div class="dtl__meta"><span>' + esc(d.Year || '') + '</span>' +
      (d.Runtime ? '<span class="pill">' + esc(d.Runtime) + '</span>' : '') +
      (d.imdbRating ? '<span class="dtl__score">' + icon('star', 12) + esc(d.imdbRating) + ' / 10</span>' : '') + '</div>' +
      '<div class="chips">' + genres.map(function (g) { return '<span class="pill">' + esc(g) + '</span>'; }).join('') + '</div>' +
      '<p class="dtl__plot">' + esc(d.Plot || 'No synopsis yet.') + '</p>' +
      '<div class="dtl__acts">' +
      '<a class="btn btn--pri btn--lg" href="#/watch/' + esc(d.imdbID) + '">' + icon('play', 15) + (pr ? 'Resume' : 'Watch now') + '</a>' +
      '<button class="btn btn--lg' + (saved ? ' btn--on' : '') + '" data-wl="' + esc(d.imdbID) + '">' +
      icon(saved ? 'check' : 'plus', 15) + (saved ? 'In watchlist' : 'Watchlist') + '</button>' +
      '<button class="btn btn--lg" id="shareBtn">' + icon('share', 15) + 'Share</button></div></div></div>' +
      '<div class="dtl__cols"><div>' +
      (isTV ? '<div class="panel" style="margin-bottom:16px"><div class="panel__hd"><h3>Episodes</h3></div>' +
        '<div class="panel__bd" id="epPanel"></div></div>' : '') +
      '<div class="panel"><div class="panel__hd"><h3>Similar titles</h3></div>' +
      '<div class="panel__bd"><div class="grid" id="sim"></div></div></div></div>' +
      '<aside><div class="panel"><div class="panel__hd"><h3>Details</h3></div><div class="panel__bd">' +
      kv('Type', isTV ? 'TV show' : 'Movie') + kv('Released', d.Released) + kv('Language', d.Language) +
      kv('Country', d.Country) + kv('Director', d.Director) + kv('Box office', d.BoxOffice) +
      '</div></div></aside></div></div>';

    document.getElementById('shareBtn').onclick = function () {
      if (navigator.share) { navigator.share({ title: d.Title, url: location.href }).catch(function () {}); return; }
      navigator.clipboard.writeText(location.href).then(function () { U().toast('Link copied'); });
    };

    if (isTV && d.tmdbID) {
      var panel = document.getElementById('epPanel');
      panel.innerHTML = '<div class="chips" id="seasonChips"></div><div class="ep-list" id="epList"></div>';
      var total = Math.min(d.totalSeasons || 1, 30);
      document.getElementById('seasonChips').innerHTML = Array.from({ length: total }, function (_, i) {
        return '<button class="chip' + (i === 0 ? ' is-on' : '') + '" data-season="' + (i + 1) + '">S' + (i + 1) + '</button>';
      }).join('');

      var loadSeason = function (s) {
        document.getElementById('epList').innerHTML = '<div class="spinner"></div>';
        FMX.api.season(d.imdbID, s).then(function (data) {
          var eps = data.Episodes || [];
          document.getElementById('epList').innerHTML = eps.length ? eps.map(function (e) {
            return '<a class="ep" href="#/watch/' + esc(d.imdbID) + '?s=' + s + '&e=' + e.Episode + '">' +
              '<span class="ep__body"><span class="ep__t">' + e.Episode + '. ' + esc(e.Title) + '</span>' +
              '<span class="ep__meta">' + esc([e.Runtime, e.Air].filter(Boolean).join(' · ')) + '</span></span></a>';
          }).join('') : '<p class="small muted">No episodes listed.</p>';
        }).catch(function () { document.getElementById('epList').innerHTML = '<p class="small muted">Unavailable.</p>'; });
      };

      panel.querySelectorAll('[data-season]').forEach(function (b) {
        b.onclick = function () {
          panel.querySelectorAll('[data-season]').forEach(function (x) { x.classList.remove('is-on'); });
          b.classList.add('is-on');
          loadSeason(+b.dataset.season);
        };
      });
      loadSeason(1);
    }

    if (d.tmdbID) {
      FMX.discover({ type: isTV ? 'series' : 'movie', page: 2 }).then(function (res) {
        var sims = res.results.filter(function (x) { return x.tmdbID !== d.tmdbID; }).slice(0, 6);
        var el = document.getElementById('sim');
        if (el) el.innerHTML = sims.map(U().card).join('');
      }).catch(function () {});
    }

    document.title = d.Title + ' (' + (d.Year || '') + ') · FilmX';
  });
};

pages.watch = function (main, a, q) {
  var query = q || (a && a.query) || {};
  var id = ctxId(a);
  var season = +(query.s || 1), episode = +(query.e || 1);
  main.innerHTML = '<div class="wrap"><p class="muted" style="padding:60px 0">Loading player…</p></div>';

  return FMX.getTitle(id).then(function (d) {
    if (!d) { main.innerHTML = '<div class="wrap">' + U().emptyBox('Not found', '') + '</div>'; return; }

    var isTV = d.Type === 'series';
    var hasImdb = /^tt\d+$/.test(d.imdbID);
    var ids = { imdb: hasImdb ? d.imdbID : String(d.tmdbID || ''), tmdb: d.tmdbID };
    var showMins = d.Runtime ? parseInt(d.Runtime, 10) || null : null;

    FMX.recent.push({ id: d.imdbID, Title: d.Title, Year: d.Year, Type: d.Type });

    var servers = FMX.CONFIG.servers.filter(function (s) { return s.need === 'tmdb' ? !!d.tmdbID : hasImdb; });
    if (!servers.length) servers = FMX.CONFIG.servers;

    var server = servers.filter(function (s) { return s.id === FMX.prefs.get('server'); })[0] || servers[0];
    var retried = false, loadTimer = null;
    var srcFor = function (s) { return isTV ? s.tv(ids, season, episode) : s.movie(ids); };

    main.innerHTML = '<div class="wrap">' +
      '<a class="btn btn--ghost btn--sm" href="#/title/' + esc(d.imdbID) + '" style="margin-bottom:14px">' + icon('back', 14) + 'Back</a>' +
      '<div class="results-head"><div><h1 style="font-size:clamp(18px,2.6vw,26px)">' + esc(d.Title) + '</h1>' +
      '<p class="sec__sub">' + (isTV ? 'Season ' + season + ' · Episode ' + episode : esc(d.Year || '')) + '</p></div>' +
      '<a class="btn btn--sm" href="#/title/' + esc(d.imdbID) + '">' + icon('info', 13) + 'Details</a></div>' +
      '<div class="player-wrap" id="playerWrap"><div class="player"><div class="frame-host" id="frameHost"></div>' +
      '<button class="fsbtn" id="fsBtn" type="button" aria-label="Fullscreen">' +
      '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">' +
      '<path d="M4 9V4h5M20 15v5h-5M20 9V4h-5M4 15v5h5"/></svg></button></div></div>' +
      '<div class="banner banner--warn" id="playerWarn" hidden>' + icon('warn', 15) +
      '<span>Source not responding. Pick another below.</span></div>' +
      '<div class="srcbar"><label class="srcbar__lbl">Source</label>' +
      '<select class="select select--sm" id="srcSelect">' +
      servers.map(function (s) { return '<option value="' + esc(s.id) + '">' + esc(s.name) + '</option>'; }).join('') +
      '</select><a class="btn btn--sm" id="extBtn" target="_blank" rel="noopener">' + icon('external', 13) + 'New tab</a></div>' +
      (isTV ? '<div class="panel" style="margin-top:16px"><div class="panel__hd"><h3>Episodes</h3></div>' +
        '<div class="panel__bd" id="epPanel"><div class="spinner"></div></div></div>' : '') + '</div>';

    document.title = d.Title + ' (' + (d.Year || '') + ') · FilmX';

    var frameHost = document.getElementById('frameHost');
    var warnEl = document.getElementById('playerWarn');
    var sel = document.getElementById('srcSelect');
    var extBtn = document.getElementById('extBtn');
    var wrap = document.getElementById('playerWrap');

    function mountFrame() {
      var url = srcFor(server);
      frameHost.innerHTML = '<iframe id="playerFrame" src="' + esc(url) + '" style="width:100%;height:100%;border:0;display:block" ' +
        'allow="autoplay; fullscreen; encrypted-media; picture-in-picture" allowfullscreen title="Video player"></iframe>';
      if (extBtn) extBtn.href = url;
      if (sel) sel.value = server.id;
      FMX.prefs.set('server', server.id);
      if (warnEl) warnEl.hidden = true;
      clearTimeout(loadTimer);
      var f = document.getElementById('playerFrame');
      if (f) {
        f.onload = function () { clearTimeout(loadTimer); if (warnEl) warnEl.hidden = true; };
      }
      loadTimer = setTimeout(function () {
        if (!retried) {
          retried = true;
          var i = servers.indexOf(server);
          var n = servers[(i + 1) % servers.length];
          if (n && n.id !== server.id) { server = n; mountFrame(); }
          return;
        }
        if (warnEl) warnEl.hidden = false;
      }, 12000);
    }

    mountFrame();

    if (sel) sel.onchange = function (e) {
      server = servers.filter(function (s) { return s.id === e.target.value; })[0] || server;
      retried = false;
      mountFrame();
    };

    function goFull() {
      if (document.fullscreenElement) { document.exitFullscreen(); return; }
      var req = wrap.requestFullscreen || wrap.webkitRequestFullscreen;
      if (!req) return;
      var p = req.call(wrap);
      var lock = function () {
        try { if (screen.orientation && screen.orientation.lock) screen.orientation.lock('portrait').catch(function () {}); } catch (e) {}
      };
      if (p && p.then) p.then(lock).catch(lock); else lock();
    }
    document.getElementById('fsBtn').onclick = goFull;
    wrap.addEventListener('dblclick', goFull);
    var unlockOrientation = function () {
      if (!document.fullscreenElement && screen.orientation && screen.orientation.unlock) {
        screen.orientation.unlock();
      }
    };
    document.addEventListener('fullscreenchange', unlockOrientation);

    try { FMX.progress.set(d.imdbID, { season: season, episode: episode, pos: 0, pct: 0 }); } catch (e) {}

    if (isTV) {
      var panel = document.getElementById('epPanel');
      var total = Math.min(d.totalSeasons || 1, 40);
      panel.innerHTML = '<div class="chips" style="margin-bottom:12px">' +
        Array.from({ length: total }, function (_, i) {
          return '<button class="chip' + (i + 1 === season ? ' is-on' : '') + '" data-season="' + (i + 1) + '">S' + (i + 1) + '</button>';
        }).join('') + '</div><div class="ep-list" id="epList"></div>';

      var loadEpisodes = function (s) {
        var list = document.getElementById('epList');
        list.innerHTML = '<div class="spinner"></div>';
        FMX.api.season(d.imdbID, s, showMins).then(function (data) {
          var eps = data.Episodes || [];
          if (!eps.length) { list.innerHTML = '<p class="small muted">No episode data.</p>'; return; }
          list.innerHTML = eps.map(function (e) {
            var meta = [e.Runtime, e.Air, e.imdbRating ? e.imdbRating + ' / 10' : ''].filter(Boolean).join(' · ');
            return '<a class="ep' + (+e.Episode === episode && s === season ? ' is-on' : '') + '" href="#/watch/' +
              esc(d.imdbID) + '?s=' + s + '&e=' + e.Episode + '">' +
              (e.Still ? '<img class="ep__img" src="' + esc(e.Still) + '" alt="" loading="lazy">' : '') +
              '<span class="ep__body"><span class="ep__t">' + e.Episode + '. ' + esc(e.Title) + '</span>' +
              (meta ? '<span class="ep__meta">' + esc(meta) + '</span>' : '') +
              (e.Plot ? '<span class="ep__plot">' + esc(e.Plot) + '</span>' : '') + '</span></a>';
          }).join('');
        }).catch(function () { list.innerHTML = '<p class="small muted">Episode list unavailable.</p>'; });
      };

      panel.querySelectorAll('[data-season]').forEach(function (b) {
        b.onclick = function () {
          panel.querySelectorAll('[data-season]').forEach(function (x) { x.classList.remove('is-on'); });
          b.classList.add('is-on');
          loadEpisodes(+b.dataset.season);
        };
      });
      loadEpisodes(season);
    }

    return function () {
      clearTimeout(loadTimer);
      document.removeEventListener('fullscreenchange', unlockOrientation);
      if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock();
    };
  });
};

pages.watchlist = function (main) {
  var items = FMX.watchlist.all();
  if (!items.length) {
    main.innerHTML = '<div class="wrap">' + U().emptyBox('Nothing saved yet', 'Tap the + on any poster to keep it here.') + '</div>';
    return;
  }
  main.innerHTML = '<div class="wrap"><div class="sec__hd"><div><h1>Your watchlist</h1>' +
    '<p class="sec__sub">' + FMX.plural(items.length, 'saved title') + '</p></div>' +
    '<button class="btn btn--sm btn--danger" id="clearWl">' + icon('trash', 13) + 'Clear</button></div>' +
    '<div class="grid">' + items.map(U().card).join('') + '</div></div>';
  document.getElementById('clearWl').onclick = function () {
    FMX.watchlist.clear(); U().toast('Watchlist cleared'); pages.watchlist(main);
  };
};

pages.continueWatching = function (main) {
  var w = FMX.progress.watching();
  if (!w.length) {
    main.innerHTML = '<div class="wrap">' + U().emptyBox('Nothing in progress', 'Open a title and press play.') + '</div>';
    return;
  }
  main.innerHTML = '<div class="wrap"><h1>Continue watching</h1>' +
    '<div class="grid" style="margin-top:14px">' + w.map(U().card).join('') + '</div></div>';
};
pages.continue = pages.continueWatching;

pages.search = function (main, a) {
  var q0 = typeof a === 'string' ? a : (a && (a.q || (a.query && a.query.q))) || '';
  var state = { q: q0, type: '', page: 1, acc: [] };

  main.innerHTML = '<div class="wrap"><h1>Search</h1>' +
    '<div class="filters"><label class="field"><span class="field__lbl">Keyword</span>' +
    '<input class="input" id="sq" value="' + esc(q0) + '" placeholder="Title or keyword"></label>' +
    '<label class="field"><span class="field__lbl">Type</span><select class="select" id="stype">' +
    '<option value="">All</option><option value="movie">Movies</option><option value="series">TV</option></select></label></div>' +
    '<p class="sec__sub" id="scount">—</p><div class="grid" id="sres"></div><div class="load-more" id="smore"></div></div>';

  function run(reset) {
    var box = document.getElementById('sres');
    if (reset) { state.page = 1; state.acc = []; box.innerHTML = U().skelRow(12); }
    if (!state.q) { box.innerHTML = U().emptyBox('Start typing', 'Search movies and shows by name.'); return; }
    FMX.searchTitles(state.q, { type: state.type || undefined, page: state.page }).then(function (res) {
      state.acc = reset ? res.results : state.acc.concat(res.results);
      box.innerHTML = state.acc.length ? state.acc.map(U().card).join('') : U().emptyBox('No matches', 'Try a shorter keyword.');
      document.getElementById('scount').textContent = FMX.plural(state.acc.length, 'result');
      document.getElementById('smore').innerHTML = (!res.offline && state.acc.length < res.total) ? '<button class="btn" id="moreBtn">Load more</button>' : '';
      var mb = document.getElementById('moreBtn');
      if (mb) mb.onclick = function () { state.page++; run(false); };
    }).catch(function () {});
  }

  var t = null;
  document.getElementById('sq').oninput = function (e) {
    state.q = e.target.value.trim();
    clearTimeout(t); t = setTimeout(function () { run(true); }, 420);
  };
  document.getElementById('stype').onchange = function (e) { state.type = e.target.value; run(true); };
  if (state.q) run(true);
};

pages.about = function (main) {
  main.innerHTML = '<div class="wrap"><h1>About FilmX</h1>' +
    '<p class="dtl__plot">A fast, free way to find something to watch. No account, no tracking.</p>' +
    '<div class="panel" style="margin-top:18px"><div class="panel__hd"><h3>Preferences</h3></div><div class="panel__bd">' +
    '<div class="switch"><span>Dark theme</span><input type="checkbox" id="pTheme"></div>' +
    '<div class="switch"><span>Remember playback position</span><input type="checkbox" id="pRemember"></div>' +
    '<button class="btn btn--danger" id="wipe" style="margin-top:16px">Clear all data</button></div></div>' +
    '<div class="panel" style="margin-top:16px"><div class="panel__hd"><h3>Questions</h3></div><div class="panel__bd">' +
    faq('Do I need an account?', 'No. Everything is stored in your browser.') +
    faq('Where does data come from?', 'Metadata, posters and ratings come from TMDB.') +
    faq('Is it free?', 'Yes. Made by FinalXGamers.') + '</div></div></div>';

  var pt = document.getElementById('pTheme');
  pt.checked = FMX.prefs.get('theme') === 'dark';
  pt.onchange = function (e) { FMX.prefs.set('theme', e.target.checked ? 'dark' : 'light'); };

  var pr = document.getElementById('pRemember');
  pr.checked = !!FMX.prefs.get('rememberProgress');
  pr.onchange = function (e) { FMX.prefs.set('rememberProgress', e.target.checked); };

  document.getElementById('wipe').onclick = function () {
    if (!confirm('Clear watchlist, progress and settings?')) return;
    FMX.wipeAll(); location.reload();
  };
};

pages.notFound = function (main) {
  main.innerHTML = '<div class="wrap">' + U().emptyBox('Page not found', 'The link may be old.') +
    '<div style="text-align:center;margin-top:14px"><a class="btn btn--pri" href="#/">Home</a></div></div>';
};

FMX.pages = pages;

})(window.FMX = window.FMX || {});