const VERSION = 'fmx-v19';

const CORE = [
  './', 'index.html', 'css/style.css',
  'manifest.json',
  'js/data.js', 'js/util.js', 'js/store.js', 'js/api.js', 'js/subs.js',
  'js/ui.js', 'js/pages.js', 'js/app.js', 'js/brand.js', 'js/suggest.js',
  'assets/logo.svg', 'assets/logo-mark.svg'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION)
    .then(function (c) { return c.addAll(CORE).catch(function () {}); })
    .then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== VERSION; })
      .map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== location.origin) return;

  var isDoc = req.mode === 'navigate' || (req.headers.get('accept') || '').indexOf('text/html') > -1;
  var isCode = /\.(js|css)$/.test(url.pathname);

  if (isDoc || isCode) {
    e.respondWith(fetch(req).then(function (res) {
      var copy = res.clone();
      caches.open(VERSION).then(function (c) { c.put(req, copy); });
      return res;
    }).catch(function () {
      return caches.match(req).then(function (hit) { return hit || caches.match('index.html'); });
    }));
    return;
  }

  e.respondWith(caches.match(req).then(function (hit) {
    if (hit) return hit;
    return fetch(req).then(function (res) {
      var copy = res.clone();
      caches.open(VERSION).then(function (c) { c.put(req, copy); });
      return res;
    });
  }));
});