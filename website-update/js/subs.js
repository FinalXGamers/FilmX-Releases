(function (FMX) {
'use strict';

function srtSec(t) {
  var m = String(t).trim().replace(',', '.').match(/(\d{1,2}):(\d{2}):(\d{2})[.,](\d{1,3})/);
  if (!m) return FMX.parseTime(t);
  return (+m[1]) * 3600 + (+m[2]) * 60 + (+m[3]) + (+m[4].padEnd(3, '0')) / 1000;
}

function parseSRT(text) {
  var blocks = String(text).replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').split(/\n{2,}/);
  var cues = [];
  blocks.forEach(function (block) {
    var lines = block.split('\n').filter(function (l) { return l.trim() !== ''; });
    if (lines.length < 2) return;
    var idx = /^\d+$/.test(lines[0].trim()) ? 1 : 0;
    var m = lines[idx] && lines[idx].match(/(\d{1,2}:\d{2}:\d{2}[,.]\d{1,3})\s*-->\s*(\d{1,2}:\d{2}:\d{2}[,.]\d{1,3})/);
    if (!m) return;
    var body = lines.slice(idx + 1).join('\n').replace(/\{\\[^}]*\}/g, '').replace(/<[^>]+>/g, '').trim();
    if (body) cues.push({ start: srtSec(m[1]), end: srtSec(m[2]), text: body });
  });
  return cues.sort(function (a, b) { return a.start - b.start; });
}

function parseVTT(text) {
  var clean = String(text).replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n')
    .replace(/^WEBVTT[^\n]*\n+/, '').replace(/^NOTE[\s\S]*?\n\n/gm, '');
  var cues = [];
  clean.split(/\n{2,}/).forEach(function (block) {
    var lines = block.split('\n').filter(Boolean);
    var ti = -1;
    for (var i = 0; i < lines.length; i++) if (lines[i].indexOf('-->') > -1) { ti = i; break; }
    if (ti < 0) return;
    var parts = lines[ti].split('-->');
    var body = lines.slice(ti + 1).join('\n').replace(/<[^>]+>/g, '').trim();
    if (!body) return;
    cues.push({ start: srtSec(parts[0]), end: srtSec(String(parts[1]).trim().split(/\s+/)[0]), text: body });
  });
  return cues.sort(function (a, b) { return a.start - b.start; });
}

function parseASS(text) {
  var cues = [];
  String(text).split(/\r?\n/).forEach(function (line) {
    if (line.indexOf('Dialogue:') !== 0) return;
    var p = line.slice(9).split(',');
    if (p.length < 10) return;
    var body = p.slice(9).join(',').replace(/\{[^}]*\}/g, '').replace(/\\N/gi, '\n').trim();
    if (body) cues.push({ start: srtSec(p[1]), end: srtSec(p[2]), text: body });
  });
  return cues.sort(function (a, b) { return a.start - b.start; });
}

function parseAny(text, name) {
  name = (name || '').toLowerCase();
  if (/\.vtt$/.test(name) || /^WEBVTT/.test(text)) return parseVTT(text);
  if (/\.(ass|ssa)$/.test(name) || /\[Script Info\]/i.test(text)) return parseASS(text);
  return parseSRT(text);
}

function srtOut(s) {
  function p(n) { return String(Math.floor(n)).padStart(2, '0'); }
  return p(s / 3600) + ':' + p((s / 60) % 60) + ':' + p(s % 60) + ',' + String(Math.round((s % 1) * 1000)).padStart(3, '0');
}
function toSRT(cues) {
  return cues.map(function (c, i) { return (i + 1) + '\n' + srtOut(c.start) + ' --> ' + srtOut(c.end) + '\n' + c.text + '\n'; }).join('\n');
}

function SubtitleTrack(cues, meta) { this.cues = cues; this.meta = meta || {}; }
SubtitleTrack.prototype.at = function (t) {
  var c = this.cues, lo = 0, hi = c.length - 1, found = -1;
  while (lo <= hi) {
    var mid = (lo + hi) >> 1;
    if (c[mid].start <= t) { found = mid; lo = mid + 1; } else hi = mid - 1;
  }
  if (found < 0) return null;
  var cue = c[found];
  return t >= cue.start && t <= cue.end + 0.35 ? cue : null;
};
SubtitleTrack.prototype.indexAt = function (t) {
  var cue = this.at(t);
  return cue ? this.cues.indexOf(cue) : -1;
};

function searchSubs(imdbId, lang) {
  var url = FMX.CONFIG.subApi + '/imdbid-' + String(imdbId).replace(/^tt/, '') + '/sublanguageid-' + (lang || 'en');
  return fetch(url, { headers: { 'X-User-Agent': 'FilmX v1' } }).then(function (res) {
    if (!res.ok) throw new Error('Subtitle service ' + res.status);
    return res.json();
  }).then(function (rows) {
    if (!Array.isArray(rows)) return [];
    var seen = {};
    return rows.filter(function (r) { return r.SubDownloadLink; }).map(function (r) {
      return {
        name: r.MovieReleaseName || r.SubFileName || 'subtitle',
        lang: r.SubLanguageID,
        format: r.SubFormat,
        downloads: parseInt(r.SubDownloadsCnt || 0, 10),
        url: r.SubDownloadLink
      };
    }).filter(function (r) {
      var k = r.name + r.format;
      if (seen[k]) return false; seen[k] = 1; return true;
    }).sort(function (a, b) { return b.downloads - a.downloads; }).slice(0, 25);
  });
}

function fetchTextMaybeGzip(url) {
  return fetch(url).then(function (res) {
    if (!res.ok) throw new Error('Download failed');
    return res.arrayBuffer();
  }).then(function (buf) {
    var head = new Uint8Array(buf.slice(0, 2));
    if (head[0] === 0x1f && head[1] === 0x8b && typeof DecompressionStream === 'function') {
      var stream = new Response(buf).body.pipeThrough(new DecompressionStream('gzip'));
      return new Response(stream).text();
    }
    return new TextDecoder('utf-8').decode(buf);
  });
}

function loadRemoteSub(url, name) {
  return fetchTextMaybeGzip(url).then(function (text) {
    var cues = parseAny(text, name);
    if (!cues.length) throw new Error('No cues parsed');
    return new SubtitleTrack(cues, { name: name, source: 'remote' });
  });
}

function loadLocalSub(file) {
  return file.text().then(function (text) {
    var cues = parseAny(text, file.name);
    if (!cues.length) throw new Error('No cues found in that file');
    return new SubtitleTrack(cues, { name: file.name, source: 'local' });
  });
}

function persist(id, track) {
  return FMX.subsStore.set(id, { name: track.meta.name, cues: track.cues, at: Date.now() });
}
function restore(id) {
  var p = FMX.subsStore.get(id);
  if (!p || !p.cues || !p.cues.length) return null;
  return new SubtitleTrack(p.cues, { name: p.name, source: 'saved' });
}

function Clock(onTick) {
  this.t = 0; this.running = false; this._last = 0; this._raf = 0; this.onTick = onTick || function () {};
}
Clock.prototype.start = function () { if (this.running) return; this.running = true; this._last = performance.now(); this._loop(); };
Clock.prototype.pause = function () { this.running = false; cancelAnimationFrame(this._raf); };
Clock.prototype.toggle = function () { this.running ? this.pause() : this.start(); };
Clock.prototype.seek = function (t) { this.t = Math.max(0, t); this._last = performance.now(); this.onTick(this.t); };
Clock.prototype.nudge = function (d) { this.seek(this.t + d); };
Clock.prototype._loop = function () {
  if (!this.running) return;
  var now = performance.now();
  this.t += (now - this._last) / 1000;
  this._last = now;
  this.onTick(this.t);
  this._raf = requestAnimationFrame(this._loop.bind(this));
};

FMX.subs = {
  parseAny: parseAny, toSRT: toSRT, SubtitleTrack: SubtitleTrack, Clock: Clock,
  searchSubs: searchSubs, loadRemoteSub: loadRemoteSub, loadLocalSub: loadLocalSub,
  persist: persist, restore: restore
};

})(window.FMX = window.FMX || {});