/* Wave 3 easter eggs. Type "summit" anywhere and a cable car takes you up. The Konami code turns on
   QA mode: the page outlines itself, the mountain turns to wireframe and a real test run checks the
   page you're looking at. Click the sun or the moon and it winks. A bird that trusts you (sparkle.js)
   and a wrong turn (404.html) count too. Found secrets are remembered on this device, and the
   console says hello to anyone who opens it. */
(function(){
  'use strict';
  var S = window.__site; if (!S) return;
  var $ = S.$, $$ = S.$$, safe = S.safe, reduce = S.reduce, root = document.documentElement;
  var IDS = ['summit', 'konami', 'wink', 'bird', 'lost'], found = {};
  try { found = JSON.parse(localStorage.getItem('av-eggs') || '{}') || {}; } catch (e){ found = {}; }
  function count(){ return IDS.filter(function(k){ return found[k]; }).length; }
  function rnd(a, b){ return a + Math.random() * (b - a); }
  function sfx(n, o){ if (S.sfx) S.sfx(n, o); }
  function theme(){ var t = root.getAttribute('data-time'); return t === 'night' || t === 'morning' ? t : 'dusk'; }
  var I = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';
  var ICON = {
    cable: I + '<path d="M2 5.5l20-3"/><path d="M12 4v4"/><rect x="5" y="8" width="14" height="11" rx="3"/><path d="M5 13.5h14M9.5 8v5.5M14.5 8v5.5"/></svg>',
    bug: I + '<path d="M8.5 7.5a3.5 3.5 0 0 1 7 0"/><rect x="7" y="7.5" width="10" height="12.5" rx="5"/><path d="M12 8v12M3 12h4M17 12h4M3.5 18l3.6-1.2M20.5 18l-3.6-1.2M4.5 6l2.8 2.6M19.5 6l-2.8 2.6"/></svg>',
    wink: I + '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 16.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/></svg>',
    bird: I + '<path d="M3.5 15.5c3.2 0 5.2-2.2 6.1-5.2.9-3 2.9-5 5.9-5 2 0 3.2 1 4 2.2l2 .5-2 1.1c-.2 5.2-4.2 9.2-10 9.2-2.3 0-4.3-.9-6-2.8z"/><path d="M13.5 9.5h.01"/></svg>',
    lost: I + '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/></svg>'
  };
  var noteEl = null, noteT = 0;
  function note(msg, sub, icon){
    if (!noteEl){ noteEl = document.createElement('div'); noteEl.className = 'egg-note'; noteEl.setAttribute('role', 'status'); document.body.appendChild(noteEl); }
    noteEl.innerHTML = (ICON[icon] || ICON.wink) + '<p></p>'; var p = $('p', noteEl); p.textContent = msg;
    if (sub){ var s = document.createElement('small'); s.textContent = sub; p.appendChild(s); }
    clearTimeout(noteT); noteEl.classList.remove('show'); void noteEl.offsetWidth; noteEl.classList.add('show');
    noteT = setTimeout(function(){ noteEl.classList.remove('show'); }, 5400);
  }
  function find(id, msg, icon){
    var fresh = !found[id]; if (fresh){ found[id] = Date.now(); try { localStorage.setItem('av-eggs', JSON.stringify(found)); } catch (e){} S.track('egg', { id: id }); }
    var n = count(); note(msg, 'Secret ' + n + ' of ' + IDS.length + (fresh ? ' found' : ', found before') + (fresh && n === IDS.length ? '. That’s all of them.' : ''), icon);
    if (fresh) sfx('egg');
  }
  window.__eggs = { find: find, count: count, total: IDS.length, found: function(){ return JSON.parse(JSON.stringify(found)); }, note: note };

  /* ---------- "summit": a cable car rides you to the top ---------- */
  var cab = null;
  function cable(){
    if (cab) return; var sm = document.getElementById('summit'); if (!sm) return;
    var y0 = window.pageYOffset, r = sm.getBoundingClientRect(), max = document.documentElement.scrollHeight - window.innerHeight;
    var to = Math.max(0, Math.min(max, Math.round(r.top + y0 + r.height / 2 - window.innerHeight * 0.48)));
    cab = document.createElement('div'); cab.className = 'cable'; cab.setAttribute('aria-hidden', 'true');
    cab.innerHTML = '<svg><path class="cb-line"/><g class="cb-car"><path class="cb-arm" d="M0 0 V17 M-6 17 H6"/><circle class="cb-wheel" cx="-4.5" cy="0" r="2.6"/><circle class="cb-wheel" cx="4.5" cy="0" r="2.6"/>' +
      '<rect class="cb-cab" x="-18" y="17" width="36" height="27" rx="6"/><rect class="cb-win" x="-13.5" y="21.5" width="11.5" height="9.5" rx="2"/><rect class="cb-win" x="2" y="21.5" width="11.5" height="9.5" rx="2"/></g></svg>';
    document.body.appendChild(cab);
    var W = window.innerWidth, H = window.innerHeight, A = [-50, H * 0.9], B = [W + 50, H * 0.1], C = [W * 0.5, H * 0.56];
    $('.cb-line', cab).setAttribute('d', 'M' + A.join(' ') + ' Q' + C.join(' ') + ' ' + B.join(' ')); var car = $('.cb-car', cab);
    function q(t){ var m = 1 - t; return [m * m * A[0] + 2 * m * t * C[0] + t * t * B[0], m * m * A[1] + 2 * m * t * C[1] + t * t * B[1]]; }
    requestAnimationFrame(function(){ cab.classList.add('on'); });
    sfx('cable'); if (window.__world && window.__world.gust) window.__world.gust(1);
    var dur = reduce ? 0 : 2800, t0 = performance.now(); root.style.scrollBehavior = 'auto'; root.classList.add('riding');
    function finish(){ root.style.scrollBehavior = ''; root.classList.remove('riding'); if (cab) cab.classList.remove('on'); var c = cab; setTimeout(function(){ if (c && c.parentNode) c.parentNode.removeChild(c); cab = null; }, 600);
      find('summit', 'Took the cable car? Fair. The view’s the same.', 'cable'); }
    if (!dur){ window.scrollTo(0, to); finish(); return; }
    (function f(now){ var u = Math.min(1, (now - t0) / dur), e = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
      window.scrollTo(0, y0 + (to - y0) * e);
      var p = q(0.04 + e * 0.92), sw = Math.sin(now / 1000 * 4.4) * 4 * (1 - u * 0.6) + (u < 0.15 ? (0.15 - u) * 40 : 0);
      car.setAttribute('transform', 'translate(' + p[0].toFixed(1) + ' ' + p[1].toFixed(1) + ') rotate(' + sw.toFixed(2) + ')');
      if (u < 1) requestAnimationFrame(f); else finish(); })(t0);
  }

  /* ---------- the sun or the moon winks when you click it ---------- */
  safe(function(){
    var SKIP = 'a, button, input, textarea, select, label, summary, [role="button"], [tabindex], .env, .h-peek, .chip, .mk, dialog, .gopuram, .pl-scene, .fc, .af-card, .reg, .bird-b, .hdr, .alt, .trail-btn, .qa-term, .qa-bug, .fps';
    var LINE = { night: 'The moon winked back.', morning: 'The sun winked. It likes an early start.', dusk: 'The sun winked on its way down.' };
    function blink(el){ el.classList.remove('wink'); void el.getBoundingClientRect(); el.classList.add('wink'); setTimeout(function(){ el.classList.remove('wink'); }, 800); }
    document.addEventListener('click', function(e){
      if (e.defaultPrevented || e.button !== 0) return; var t = e.target; if (!t || !t.closest || t.closest(SKIP)) return;
      if (window.getSelection && String(window.getSelection())) return;
      var x = e.clientX, y = e.clientY, hit = false, Wd = window.__world;
      if (Wd && Wd.orb && root.classList.contains('has-3d')){ var o = Wd.orb(); if (o && o.vis && Math.hypot(x - o.x, y - o.y) < Math.max(34, o.r * 1.6)) hit = Wd.wink(); }
      else { var th = theme(), c = th === 'night' ? $('.env-paint .pt-night .mo') : th === 'dusk' ? $('.env-paint .pt-dusk .su') : null;
        if (c){ var r = c.getBoundingClientRect(); if (r.width && Math.hypot(x - (r.left + r.width / 2), y - (r.top + r.height / 2)) < Math.max(34, r.width * 0.8)){ hit = true; blink(c); } } }
      if (!hit) return;
      var b = $('.tod button[aria-pressed="true"]'); if (b) blink(b);
      sfx('wink'); find('wink', LINE[theme()], 'wink');
    });
  });

  /* ---------- the Konami code: QA mode ---------- */
  var qa = (function(){
    var on = false, term = null, body = null, lbls = [], bug = null, timers = [], bugN = 0, q = [], qt = 0, head = null;
    function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
    function later(ms, fn){ timers.push(setTimeout(fn, ms)); }
    function line(html, cls){ var d = document.createElement('div'); d.className = 'qt-l' + (cls ? ' ' + cls : ''); d.innerHTML = html; body.appendChild(d); term.scrollTop = term.scrollHeight; return d; }
    function queue(html, cls){ q.push([html, cls]); if (!qt) pump(); }
    function pump(){ if (!q.length || !on){ qt = 0; return; } var x = q.shift(); line(x[0], x[1]); qt = setTimeout(pump, reduce ? 0 : 85); }
    function vis(el){ return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length) && !el.closest('.print-only'); }
    function labels(){ $$('main > section').forEach(function(s){ var l = document.createElement('span'); l.className = 'qa-lbl'; l.setAttribute('aria-hidden', 'true');
      l.textContent = '#' + s.id + '  ' + Math.round(s.offsetWidth) + ' × ' + Math.round(s.offsetHeight); s.appendChild(l); lbls.push(l); }); }
    function run(done){
      var R = [], t0 = performance.now();
      function add(ok, name, det){ R.push({ ok: ok, name: name, det: det }); }
      var nav = performance.getEntriesByType ? performance.getEntriesByType('navigation')[0] : null, lt = nav ? (nav.loadEventEnd || nav.domContentLoadedEventEnd) - nav.startTime : 0;
      add(lt > 0 && lt < 5000, 'page loads in under 5 s', lt > 0 ? (lt / 1000).toFixed(2) + ' s' : 'not measured');
      var ne = window.__errs || 0; add(ne === 0, 'no errors in the console', ne + (ne === 1 ? ' error' : ' errors'));
      var h1 = $$('h1'); add(h1.length === 1, 'exactly one h1', h1.length + ' found');
      var hs = $$('main h1, main h2, main h3, main h4').filter(vis), prev = 1, skip = 0; hs.forEach(function(h){ var l = +h.tagName[1]; if (l > prev + 1) skip++; prev = l; });
      add(skip === 0, 'headings never skip a level', hs.length + ' headings' + (skip ? ', ' + skip + ' skipped' : ''));
      var bl = $$('a[target="_blank"]'), bad = bl.filter(function(a){ return !/noopener|noreferrer/.test(a.getAttribute('rel') || ''); });
      add(!bad.length, 'new-tab links use rel="noopener"', (bl.length - bad.length) + '/' + bl.length);
      var bt = $$('button').filter(function(b){ return !b.closest('.qa-term'); }), un = bt.filter(function(b){ return !((b.textContent || '').trim() || b.getAttribute('aria-label') || b.getAttribute('title') || b.getAttribute('aria-labelledby')); });
      add(!un.length, 'every button has a name', (bt.length - un.length) + '/' + bt.length);
      var im = $$('img'), na = im.filter(function(i){ return !i.hasAttribute('alt'); }); add(!na.length, 'images have alt text', im.length ? (im.length - na.length) + '/' + im.length : 'no <img> tags: it’s all SVG and code');
      var sv = $$('main svg, header svg'), ex = sv.filter(function(s){ return !s.closest('[aria-hidden="true"]') && s.getAttribute('role') !== 'img' && !s.getAttribute('aria-label') && !s.closest('[aria-label]'); });
      add(!ex.length, 'decorative SVGs are hidden from screen readers', ex.length ? ex.length + ' exposed' : sv.length + '/' + sv.length);
      var ln = $$('.alt a[href^="#"], .trail-sheet a[href^="#"]'), dead = ln.filter(function(a){ return !document.getElementById(a.getAttribute('href').slice(1)); });
      add(!dead.length, 'every nav link has a target', (ln.length - dead.length) + '/' + ln.length);
      add(!!root.getAttribute('lang'), 'page language is set', 'lang="' + (root.getAttribute('lang') || '') + '"');
      var md = $('meta[name="description"]'); add(!!md && md.content.length >= 50 && md.content.length <= 170, 'meta description fits a search result', md ? md.content.length + ' characters' : 'missing');
      var T = window.__trail, n = T && T.size ? T.size() : 0; add(n > 10, 'the trail runs from my name to LinkedIn', n + ' points');
      var three = root.classList.contains('has-3d'), Wd = window.__world;
      add(three || root.classList.contains('no-3d'), three ? '3D world is running' : 'painted fallback stands in for 3D', three && Wd && Wd.quality ? 'pixel ratio ' + Wd.quality().pr.toFixed(2) : 'no WebGL here');
      var fr = 0, f0 = performance.now();
      (function f(now){ fr++; if (now - f0 < 1000) requestAnimationFrame(f); else { var fps = fr * 1000 / (now - f0); add(fps >= 30, 'frame rate stays above 30 fps', fps.toFixed(0) + ' fps'); done(R, performance.now() - t0); } })(f0);
    }
    function spawnBug(){
      var b = document.createElement('button'); b.type = 'button'; b.className = 'qa-bug'; b.setAttribute('aria-label', 'A bug is loose on the page. Squash it.');
      b.innerHTML = '<svg viewBox="-15 -15 30 30" aria-hidden="true"><g class="qb-l" stroke="#2A0B0D" stroke-width="1.5" stroke-linecap="round"><path d="M3 -5 L6 -10.5 M-2 5.5 L-3 11 M-6 -4.5 L-10 -9"/></g>' +
        '<g class="qb-l qb-l2" stroke="#2A0B0D" stroke-width="1.5" stroke-linecap="round"><path d="M3 5 L6 10.5 M-2 -5.5 L-3 -11 M-6 4.5 L-10 9"/></g>' +
        '<ellipse cx="-1.5" cy="0" rx="8" ry="6.3" fill="#E5484D" stroke="#7A1418" stroke-width="1"/><path d="M-1.5 -6.2 V6.2" stroke="#7A1418" stroke-width="1"/>' +
        '<circle cx="-4.5" cy="-2.8" r="1.4" fill="#2A0B0D"/><circle cx="1.8" cy="3" r="1.2" fill="#2A0B0D"/><circle cx="-4" cy="3.2" r="1" fill="#2A0B0D"/><circle cx="1.6" cy="-3.2" r=".9" fill="#2A0B0D"/>' +
        '<circle cx="7.6" cy="0" r="3.2" fill="#2A0B0D"/><path d="M9.8 -1.6 L13.4 -4.8 M9.8 1.6 L13.4 4.8" stroke="#2A0B0D" stroke-width="1.1" stroke-linecap="round"/></svg>';
      document.body.appendChild(b);
      var W = window.innerWidth, H = window.innerHeight, x = rnd(90, W - 90), y = rnd(140, H - 140), a = rnd(0, 6.28), va = 0, sp = rnd(60, 90), last = 0, alive = true, pause = 0;
      function ad(t, s){ var d = t - s; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; }
      function f(now){ if (!alive || !on) return; var dt = Math.min(0.05, (now - (last || now)) / 1000); last = now; W = window.innerWidth; H = window.innerHeight;
        if (now > pause){ va += rnd(-1, 1) * 7 * dt; va *= 0.97; a += va * dt * 3;
          if (x < 70 || x > W - 70 || y < 110 || y > H - 70) a += ad(Math.atan2(H / 2 - y, W / 2 - x), a) * Math.min(1, dt * 4);
          x += Math.cos(a) * sp * dt; y += Math.sin(a) * sp * dt; if (Math.random() < dt * 0.35) pause = now + rnd(250, 900); }
        b.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) rotate(' + (a * 180 / Math.PI).toFixed(1) + 'deg)';
        requestAnimationFrame(f); }
      requestAnimationFrame(f);
      b.addEventListener('click', function(){ if (!alive) return; alive = false; b.classList.add('squash'); sfx('squash'); bugN++;
        var id = 'BUG-' + new Date().getFullYear() + '-' + ('00' + bugN).slice(-3);
        queue('<span class="ok">✓</span> <span class="wh">' + id + '</span> filed <span class="dim">· P3 · found in production, by you</span>');
        queue('<span class="dim">Bug found in production. Filed it. Now we add a test so it never comes back.</span>');
        later(700, function(){ if (b.parentNode) b.parentNode.removeChild(b); if (bug === b) bug = null; }); });
      bug = b;
    }
    function start(){
      if (on) return; on = true; root.classList.add('qa-mode'); if (window.__world && window.__world.debug) window.__world.debug(true); labels();
      term = document.createElement('div'); term.className = 'qa-term'; term.setAttribute('role', 'region'); term.setAttribute('aria-label', 'QA mode test run');
      term.innerHTML = '<div class="qt-h"><span>qa mode · aravind.test.js</span><button type="button" aria-label="Close QA mode">esc ✕</button></div><div class="qt-b" role="log" aria-live="polite"></div>';
      document.body.appendChild(term); body = $('.qt-b', term); $('.qt-h button', term).addEventListener('click', stop);
      requestAnimationFrame(function(){ if (term) term.classList.add('show'); });
      head = line('<span class="hl">RUNS</span>  aravind.test.js'); queue('<span class="dim">  The climb, checked while you look at it</span>');
      sfx('konami'); find('konami', 'QA mode. Every page deserves a test run.', 'bug');
      run(function(R, ms){ if (!on) return; var pass = 0, fail = 0;
        R.forEach(function(r){ if (r.ok) pass++; else fail++; queue('    <span class="' + (r.ok ? 'ok">✓' : 'no">✕') + '</span> ' + esc(r.name) + ' <span class="dim">(' + esc(r.det) + ')</span>'); });
        queue('', ''); queue('Tests:   ' + (fail ? '<span class="no">' + fail + ' failed</span>, ' : '') + '<span class="ok">' + pass + ' passed</span>, ' + R.length + ' total', 'qt-sum');
        queue('Time:    ' + (ms / 1000).toFixed(2) + ' s'); queue('Secrets: ' + count() + ' of ' + IDS.length + ' found');
        queue('<span class="dim">Ran all test suites. A bug got loose on the page. Squash it.</span>');
        later(q.length * (reduce ? 0 : 85) + 200, function(){ if (!on) return; head.innerHTML = (fail ? '<span class="no">FAIL</span>' : '<span class="ok">PASS</span>') + '  aravind.test.js'; spawnBug(); });
      });
    }
    function stop(){
      if (!on) return; on = false; clearTimeout(qt); qt = 0; q = []; timers.forEach(clearTimeout); timers = [];
      root.classList.remove('qa-mode'); if (window.__world && window.__world.debug) window.__world.debug(false);
      lbls.forEach(function(l){ if (l.parentNode) l.parentNode.removeChild(l); }); lbls = [];
      if (bug && bug.parentNode) bug.parentNode.removeChild(bug); bug = null;
      var t = term; term = null; if (t){ t.classList.remove('show'); setTimeout(function(){ if (t.parentNode) t.parentNode.removeChild(t); }, 300); }
    }
    return { on: function(){ return on; }, start: start, stop: stop, toggle: function(){ if (on) stop(); else start(); }, bug: function(){ return bug; } };
  })();

  /* ---------- keys: "summit" and the Konami code ---------- */
  safe(function(){
    var buf = '', KON = ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a'], ki = 0;
    document.addEventListener('keydown', function(e){
      if (e.ctrlKey || e.metaKey || e.altKey) return; var t = e.target; if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      var k = (e.key || '').toLowerCase();
      if (k === KON[ki]){ ki++; if (ki === KON.length){ ki = 0; qa.toggle(); } }
      else ki = k === 'arrowup' ? (ki === 2 ? 2 : 1) : 0;
      if (k === 'escape' && qa.on()) qa.stop();
      if (k.length === 1 && k >= 'a' && k <= 'z'){ buf = (buf + k).slice(-12); if (/summit$/.test(buf)){ buf = ''; cable(); } }
    });
  });
  window.__qa = qa; window.__cable = cable;

  /* ---------- for anyone who opens the console ---------- */
  safe(function(){
    if (!window.console || !console.log) return;
    console.log('%cHi. You found the console.%c\nI’m Aravind, a QA leader who builds. Naturally, I left a few things to find:\n  · type “summit” anywhere\n  · ↑ ↑ ↓ ↓ ← → ← → B A\n  · click the sun, or the moon\n  · sit still for a while\n  · take a wrong turn (any bad URL)\nOr just say hello: Aravin4d@gmail.com',
      'font:600 15px/1.7 Georgia, serif; color:#F07A55', 'font:12px/1.7 ui-monospace, Menlo, monospace; color:#8B95AA');
  });
})();
