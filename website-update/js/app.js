(function (FMX) {
'use strict';

var $ = FMX.$, $$ = FMX.$$, esc = FMX.esc, icon = FMX.icon;
var P = FMX.pages, U = FMX.ui;
var main = document.getElementById('main');
var cleanup = null;

function report(err) {
  var box = document.getElementById('diag');
  if (!box) return;
  box.style.display = 'block';
  box.textContent += '\napp.js crashed: ' + (err && err.message ? err.message : err) +
    (err && err.stack ? '\n' + err.stack : '');
}

/* ---------------- theme ---------------- */
function applyTheme(t) { document.documentElement.dataset.theme = t === 'light' ? 'light' : 'dark'; }

function updateThemeButton() {
  var button = document.getElementById('themeBtn');
  if (!button) return;
  var dark = FMX.prefs.get('theme') === 'dark';
  var label = dark ? 'Switch to light theme' : 'Switch to dark theme';
  button.innerHTML = icon(dark ? 'sun' : 'moon', 17);
  button.title = label;
  button.setAttribute('aria-label', label);
}

/* ---------------- header ---------------- */
function renderHeader() {
  var wl = FMX.watchlist.all().length;
  var dark = FMX.prefs.get('theme') === 'dark';
  var themeLabel = dark ? 'Switch to light theme' : 'Switch to dark theme';

  $('#hdr').innerHTML = '<div class="hdr__in">' +
    '<a class="brand" href="#/">' +
      '<svg class="brand__mark" viewBox="0 0 44 44" aria-hidden="true">' +
        '<defs><linearGradient id="bmg" x1="0" y1="0" x2="1" y2="1">' +
          '<stop offset="0" stop-color="#7c5cff"/><stop offset="1" stop-color="#22d3ee"/>' +
        '</linearGradient></defs>' +
        '<rect x="1" y="1" width="42" height="42" rx="12.5" fill="url(#bmg)"/>' +
        '<path d="M15.5 13.4 L32.5 22 L15.5 30.6 Z" fill="#fff"/>' +
        '<path d="M19.6 19.4 L28.4 22 L19.6 24.6 Z" fill="#080a0f"/>' +
      '</svg>' +
      '<span class="brand__txt">' +
        '<span class="brand__name">Film<em>X</em></span>' +
        '<span class="brand__sub">made by ' + esc(FMX.CONFIG.author) + '</span>' +
      '</span>' +
    '</a>' +
    '<nav class="hdr__nav" id="nav">' +
      '<a class="nlink" href="#/">Home</a>' +
      '<a class="nlink" href="#/movies">Movies</a>' +
      '<a class="nlink" href="#/tv">TV shows</a>' +
      '<a class="nlink" href="#/genre/action">Genres</a>' +
      '<a class="nlink" href="#/watchlist">Watchlist' + (wl ? '<span class="nlink__badge">' + wl + '</span>' : '') + '</a>' +
      '<a class="nlink" href="#/continue">Continue</a>' +
      (FMX.isAppSurface ? '' : '<a class="nlink" href="#/downloads">Downloads</a>') +
      '<a class="nlink" href="#/suggest">Feedback</a>' +
      '<a class="nlink" href="#/about">About</a>' +
    '</nav>' +
    '<span class="hdr__spacer"></span>' +
    '<div class="hdr__tools">' +
      '<a class="searchbtn" href="#/search">' + icon('search', 15) + '<span>Search titles</span></a>' +
      '<button class="btn btn--icon" id="themeBtn" title="' + themeLabel + '" aria-label="' + themeLabel + '">' +
        icon(dark ? 'sun' : 'moon', 17) + '</button>' +
        '<button class="btn btn--icon hdr__burger" id="burger" title="Menu" aria-label="Menu" ' +
          'aria-haspopup="true" aria-expanded="false" aria-controls="fxDrawer">' +
        icon('menu', 18) + '</button>' +
    '</div>' +
  '</div>';

  var tb = $('#themeBtn');
  if (tb) tb.onclick = function () {
    var next = FMX.prefs.get('theme') === 'dark' ? 'light' : 'dark';
    FMX.prefs.set('theme', next);
    updateThemeButton();
  };

  var nav = $('#nav');
  if (nav) nav.addEventListener('click', function () { nav.classList.remove('open'); });
}

/* ---------------- footer ---------------- */
function renderFooter() {
  $('#ftr').innerHTML = '<div class="wrap"><div class="ftr__grid">' +
    '<div>' +
      '<img src="assets/logo.svg" alt="FilmX, Made By FinalXGamers" style="width:210px;height:auto;margin-bottom:10px" ' +
        'onerror="this.style.display=\'none\'">' +
      '<p class="small dim" style="max-width:34ch">Fast, free, clutter-free movie discovery. Built by ' +
        esc(FMX.CONFIG.author) + '.</p>' +
      '<div class="ftr__badges"><span class="pill">No account</span><span class="pill">PWA ready</span>' +
      '<span class="pill">Offline catalogue</span></div>' +
    '</div>' +
    '<div><h4>Browse</h4>' +
      '<a href="#/">Home</a><a href="#/movies">Movies</a><a href="#/tv">TV shows</a>' +
      '<a href="#/watchlist">Watchlist</a><a href="#/continue">Continue watching</a>' +
    '</div>' +
    '<div><h4>Genres</h4>' +
      ['action', 'scifi', 'comedy', 'horror', 'animation', 'crime'].map(function (g) {
        return '<a href="#/genre/' + g + '">' + g.charAt(0).toUpperCase() + g.slice(1) + '</a>';
      }).join('') +
    '</div>' +
    '<div><h4>More</h4>' +
      '<a href="#/about">About and settings</a><a href="#/search">Search</a>' +
      (FMX.isAppSurface ? '' : '<a href="#/downloads">Apps and downloads</a>') +
      '<a href="https://www.omdbapi.com/" target="_blank" rel="noopener">OMDb API</a>' +
      '<a href="https://www.imdb.com/" target="_blank" rel="noopener">IMDb</a>' +
    '</div>' +
  '</div>' +
  '<div class="ftr__bot">' +
    '<span>&copy; ' + new Date().getFullYear() + ' ' + esc(FMX.CONFIG.site) +
      ' &middot; <b>Made By ' + esc(FMX.CONFIG.author) + '</b></span>' +
    '<span>Metadata via OMDb &middot; video embedded from third-party players</span>' +
  '</div></div>';
}

/* ---------------- router ---------------- */
var ROUTES = [
  ['/',           function () { return P.home(main); }],
  ['/movies',     function () { return P.browse(main, { type: 'movie' }); }],
  ['/tv',         function () { return P.browse(main, { type: 'series' }); }],
  ['/genre/:g',   function (p) { return P.browse(main, { genre: p.params.g }); }],
  ['/list/:l',    function (p) { return P.browse(main, { list: p.params.l }); }],
  ['/row/:i',     function (p) { return P.browse(main, { rowIndex: +p.params.i }); }],
  ['/title/:id',  function (p) { return P.detail(main, p.params.id); }],
  ['/watch/:id',  function (p) { return P.watch(main, p.params.id, p.query); }],
  ['/watchlist',  function () { return P.watchlist(main); }],
  ['/continue',   function () { return P.continueWatching(main); }],
  ['/downloads', function () {
    if (FMX.isNativeApp) { location.hash = '/'; return; }
    return P.downloads(main);
  }],
  ['/search',     function (p) { return P.search(main, p.query); }],
  ['/about',      function () { return P.about(main); }]
];

function parseHash() {
  var raw = location.hash.replace(/^#/, '') || '/';
  var parts = raw.split('?');
  var query = {};
  (parts[1] || '').split('&').forEach(function (kv) {
    if (!kv) return;
    var i = kv.indexOf('=');
    var k = i < 0 ? kv : kv.slice(0, i);
    var v = i < 0 ? '' : kv.slice(i + 1);
    try { query[decodeURIComponent(k)] = decodeURIComponent(v.replace(/\+/g, ' ')); } catch (e) {}
  });
  return { path: parts[0] || '/', query: query };
}

function matchRoute(path) {
  for (var i = 0; i < ROUTES.length; i++) {
    var pattern = ROUTES[i][0];
    var keys = [];
    var re = new RegExp('^' + pattern.replace(/\/:([A-Za-z0-9_]+)/g, function (_, k) {
      keys.push(k); return '/([^/]+)';
    }) + '$');
    var m = path.match(re);
    if (!m) continue;
    var params = {};
    keys.forEach(function (k, n) { params[k] = decodeURIComponent(m[n + 1]); });
    return { handler: ROUTES[i][1], params: params };
  }
  return null;
}

function titleFor(path) {
  var map = {
    '/': FMX.CONFIG.site + ' \u2014 ' + FMX.CONFIG.tagline,
    '/movies': 'Movies \u2014 ' + FMX.CONFIG.site,
    '/tv': 'TV shows \u2014 ' + FMX.CONFIG.site,
    '/watchlist': 'Watchlist \u2014 ' + FMX.CONFIG.site,
    '/continue': 'Continue watching \u2014 ' + FMX.CONFIG.site,
    '/downloads': 'Apps and downloads \u2014 ' + FMX.CONFIG.site,
    '/about': 'About \u2014 ' + FMX.CONFIG.site
  };
  return map[path] || (FMX.CONFIG.site + ' \u2014 ' + FMX.CONFIG.tagline);
}

function markActive() {
  var path = parseHash().path;
  $$('#nav .nlink, #tabbar [data-tab]').forEach(function (a) {
    var href = (a.getAttribute('href') || '').replace('#', '');
    var active = href === path || (href !== '/' && path.indexOf(href) === 0);
    a.classList.toggle('is-on', active);
    if (a.hasAttribute('data-tab')) {
      if (active) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    }
  });
}

function go() {
  var parsed = parseHash();
  var hit = matchRoute(parsed.path);

  if (cleanup) { try { cleanup(); } catch (e) {} cleanup = null; }
  if (U && U.closeModal) U.closeModal();
  if (main) main.innerHTML = '';
  markActive();

  if (!hit) {
    P.notFound(main);
    document.title = 'Not found \u2014 ' + FMX.CONFIG.site;
    window.scrollTo(0, 0);
    return;
  }

  var out;
  try { out = hit.handler({ params: hit.params, query: parsed.query }); }
  catch (e) { report(e); return; }

  if (out && typeof out.then === 'function') {
    out.then(function (fn) { if (typeof fn === 'function') cleanup = fn; })
       .catch(function (e) { report(e); });
  } else if (typeof out === 'function') {
    cleanup = out;
  }

  if (parsed.path !== '/search') document.title = titleFor(parsed.path);
  window.scrollTo(0, 0);
}

/* ---------------- global watchlist toggle ---------------- */
function wireWatchlist() {
  FMX.delegate(document, '[data-wl]', 'click', function (e, el) {
    e.preventDefault();
    e.stopPropagation();

    var id = el.getAttribute('data-wl');
    if (FMX.watchlist.has(id)) {
      FMX.watchlist.remove(id);
      U.toast('Removed from watchlist');
    } else {
      var d = (FMX.titles && FMX.titles[id]) || {};
      FMX.watchlist.add({
        id: id,
        Title: d.Title || 'Saved title',
        Year: d.Year || '',
        Type: d.Type || 'movie',
        Poster: d.Poster || ''
      });
      U.toast('Added to watchlist');
    }

    var on = FMX.watchlist.has(id);
    $$('[data-wl="' + id + '"]').forEach(function (b) {
      b.classList.toggle('is-on', on);
      b.classList.toggle('btn--on', on);
      var lbl = b.querySelector('span');
      if (lbl) lbl.textContent = on ? 'In watchlist' : 'Add to watchlist';
      if (b.classList.contains('ibtn')) b.innerHTML = icon(on ? 'check' : 'plus', 14);
    });

    renderHeader();
    markActive();
  });
}

function compareVersions(a, b) {
  var left = a.split('.').map(Number);
  var right = b.split('.').map(Number);
  for (var i = 0; i < 3; i++) {
    if (left[i] !== right[i]) return left[i] - right[i];
  }
  return 0;
}

function checkDesktopUpdate() {
  var userAgent = navigator.userAgent || '';
  var desktopInfo = window.FMX_DESKTOP;
  var isElectron = userAgent.indexOf('Electron/') !== -1;
  if (!isElectron && !desktopInfo) return;

  var appVersion = (desktopInfo && desktopInfo.version) ||
    (userAgent.match(/FilmXDesktop\/(\d+\.\d+\.\d+)/) || [])[1] || '1.0.0';
  var platform = (desktopInfo && desktopInfo.platform) ||
    (userAgent.match(/FilmXPlatform\/(win32|darwin|linux)/) || [])[1];
  if (!platform) {
    platform = /Windows NT/.test(userAgent) ? 'win32' :
      /Macintosh|Mac OS X/.test(userAgent) ? 'darwin' :
        /Linux/.test(userAgent) ? 'linux' : null;
  }
  var assetPattern = platform === 'win32' ? /-Windows-Setup\.exe$/ :
    platform === 'darwin' ? /-macOS\.dmg$/ :
      platform === 'linux' ? /-Linux\.AppImage$/ : null;
  if (!assetPattern) return;

  fetch('https://api.github.com/repos/FinalXGamers/FilmX-Releases/releases?per_page=100', {
    headers: { Accept: 'application/vnd.github+json' },
    cache: 'no-store'
  }).then(function (response) {
    if (!response.ok) throw new Error('GitHub returned HTTP ' + response.status);
    return response.json();
  }).then(function (releases) {
    var latest = (Array.isArray(releases) ? releases : []).filter(function (release) {
      return release && !release.draft && !release.prerelease &&
        /^desktop-v\d+\.\d+\.\d+$/.test(release.tag_name || '') &&
        (release.assets || []).some(function (item) { return assetPattern.test(item.name || ''); });
    }).sort(function (a, b) {
      return compareVersions(b.tag_name.slice('desktop-v'.length), a.tag_name.slice('desktop-v'.length));
    })[0];
    if (!latest || compareVersions(latest.tag_name.slice('desktop-v'.length), appVersion) <= 0) return;

    var asset = (latest.assets || []).filter(function (item) { return assetPattern.test(item.name || ''); })[0];
    if (!asset || !asset.browser_download_url) {
      console.warn('[FilmX] Desktop update release is missing the installer for ' + platform + '.');
      return;
    }

    var version = latest.tag_name.slice('desktop-v'.length);
    if (window.confirm('FilmX ' + version + ' is available (you have ' + appVersion + '). Download the update?')) {
      if (desktopInfo && typeof desktopInfo.openExternal === 'function') {
        desktopInfo.openExternal(asset.browser_download_url);
      } else {
        window.open(asset.browser_download_url, '_blank', 'noopener');
      }
    }
  }).catch(function (err) {
    console.warn('[FilmX] Desktop update check failed:', err);
  });
}

function startNativeUpdateCheck(updater) {
  var overlay = null, progressBar, statusText, detailsText, retryButton, installButton;
  var updateInfo;

  function showRequiredUpdate(update) {
    updateInfo = update;
    overlay = document.createElement('section');
    overlay.className = 'fmx-update-lock';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'fmxUpdateTitle');
    overlay.innerHTML =
      '<div class="fmx-update-card"><div class="fmx-update-mark">F</div>' +
      '<p class="fmx-update-eyebrow">REQUIRED UPDATE</p>' +
      '<h1 id="fmxUpdateTitle">Update FilmX to continue</h1>' +
      '<p class="fmx-update-copy">Version ' + esc(update.versionName) +
      ' is ready. Keep FilmX open while it downloads. You will need to install it to continue.</p>' +
      '<div class="fmx-update-progress" role="progressbar" aria-label="Update download progress" ' +
      'aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span></span></div>' +
      '<p class="fmx-update-status" aria-live="polite">Starting secure download…</p>' +
      '<p class="fmx-update-details"></p>' +
      '<button class="btn btn--pri fmx-update-install" type="button" hidden>Install update</button>' +
      '<button class="btn btn--pri fmx-update-retry" type="button" hidden>Retry download</button></div>';
    Array.from(document.body.children).forEach(function (element) { element.inert = true; });
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
    progressBar = overlay.querySelector('.fmx-update-progress');
    statusText = overlay.querySelector('.fmx-update-status');
    detailsText = overlay.querySelector('.fmx-update-details');
    retryButton = overlay.querySelector('.fmx-update-retry');
    installButton = overlay.querySelector('.fmx-update-install');
    retryButton.onclick = downloadUpdate;
    installButton.onclick = installUpdate;
    downloadUpdate();
  }

  function formatBytes(bytes) {
    if (bytes < 1024 * 1024) return Math.max(0, bytes / 1024).toFixed(0) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function downloadUpdate() {
    retryButton.hidden = true;
    installButton.hidden = true;
    statusText.textContent = 'Downloading the required update…';
    detailsText.textContent = 'FilmX is unavailable until the update is installed.';
    updater.downloadUpdate({ apkUrl: updateInfo.apkUrl }).catch(function (error) {
      statusText.textContent = 'The update download could not start.';
      detailsText.textContent = error && error.message ? error.message : 'Check your connection and retry.';
      retryButton.hidden = false;
    });
  }

  function installUpdate() {
    installButton.disabled = true;
    statusText.textContent = 'Opening the Android installer…';
    updater.installUpdate().then(function (result) {
      installButton.disabled = false;
      if (result && result.permissionRequired) {
        statusText.textContent = 'Allow FilmX to install updates, then return here.';
        installButton.textContent = 'Continue installation';
        installButton.hidden = false;
      } else {
        detailsText.textContent = 'Complete the installation to start using FilmX.';
      }
    }).catch(function (error) {
      installButton.disabled = false;
      statusText.textContent = 'The installer could not be opened.';
      detailsText.textContent = error && error.message ? error.message : 'Try again to install the update.';
    });
  }

  updater.addListener('updateProgress', function (event) {
    if (!overlay || !event) return;
    var percent = Number(event.percent);
    if (percent >= 0) {
      progressBar.classList.remove('is-indeterminate');
      progressBar.setAttribute('aria-valuenow', String(percent));
      progressBar.firstElementChild.style.width = percent + '%';
      detailsText.textContent = event.totalBytes > 0 ?
        formatBytes(event.downloadedBytes) + ' of ' + formatBytes(event.totalBytes) :
        percent + '% downloaded';
    } else {
      progressBar.classList.add('is-indeterminate');
      progressBar.removeAttribute('aria-valuenow');
      detailsText.textContent = event.downloadedBytes > 0 ?
        formatBytes(event.downloadedBytes) + ' downloaded' : 'Waiting for download size…';
    }

    if (event.status === 'paused') {
      statusText.textContent = 'Download paused. Waiting for a network connection…';
    } else if (event.status === 'complete') {
      progressBar.classList.remove('is-indeterminate');
      progressBar.setAttribute('aria-valuenow', '100');
      progressBar.firstElementChild.style.width = '100%';
      statusText.textContent = 'Download complete. Install the update to continue.';
      detailsText.textContent = 'Your FilmX data stays on this device.';
      installButton.hidden = false;
      installButton.focus();
    } else if (event.status === 'error') {
      statusText.textContent = 'The required update did not finish downloading.';
      detailsText.textContent = event.message || 'Check your connection and retry.';
      retryButton.hidden = false;
      retryButton.focus();
    } else if (event.status === 'downloading') {
      statusText.textContent = 'Downloading the required update…';
    }
  });

  updater.checkForUpdate().then(function (update) {
    if (update && update.available) showRequiredUpdate(update);
  }).catch(function (error) {
    console.warn('[FilmX] Automatic update check failed. The update server must return JSON and an APK without a browser challenge.', error);
    U.toast('Update check failed. ' + (error && error.message ? error.message : 'Please try again later.'), 'err', 6000);
  });
}

/* ---------------- start ---------------- */
function start() {
  applyTheme(FMX.prefs.get('theme'));
  FMX.busOn('prefs', function (p) { applyTheme(p.theme); updateThemeButton(); });
  FMX.busOn('watchlist', renderHeader);
  FMX.busOn('api:state', function (offline) {
    if (offline) U.toast('Switched to offline catalogue', 'warn', 3200);
  });
  FMX.busOn('api:badkey', function () { U.toast('OMDb rejected the API key', 'err', 4000); });
  FMX.busOn('api:limit', function () { U.toast('Daily OMDb request limit reached', 'warn', 4000); });

  renderHeader();
  renderFooter();
  wireWatchlist();

  window.setTimeout(checkDesktopUpdate, 2500);

  if (FMX.isNativeApp && window.Capacitor && window.Capacitor.Plugins &&
      window.Capacitor.Plugins.FilmXUpdater) {
    startNativeUpdateCheck(window.Capacitor.Plugins.FilmXUpdater);
  }

  FMX.installPrompt = null;
  FMX.on(window, 'beforeinstallprompt', function (e) {
    e.preventDefault();
    FMX.installPrompt = e;
    var installButton = document.getElementById('installFilmX');
    if (installButton) installButton.hidden = false;
  });
  FMX.on(document, 'click', function (e) {
    var button = e.target.closest && e.target.closest('#installFilmX');
    if (!button || !FMX.installPrompt) return;
    FMX.installPrompt.prompt();
    FMX.installPrompt.userChoice.then(function () {
      FMX.installPrompt = null;
      button.hidden = true;
    }).catch(function (err) {
      console.warn('[FilmX] Install prompt failed:', err);
    });
  });

  FMX.on(window, 'keydown', function (e) {
    if (e.target.matches('input,select,textarea')) return;
    if (e.key === '/') { e.preventDefault(); location.hash = '/search'; }
    if (e.key === 'Escape' && parseHash().path !== '/') history.back();
  });

  window.addEventListener('hashchange', go);

  if (!location.hash) {
    try { history.replaceState(null, '', '#/'); } catch (err) { location.hash = '/'; }
  }
  go();

  if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    });
  }

  FMX.booted = true;
}

try { start(); } catch (err) { report(err); }

})(window.FMX = window.FMX || {});