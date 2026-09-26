/* Wave 3 sparkle: a themed cursor that leaves fireflies, ice or sand behind it, content that leans
   a little as you scroll, film grain and paper, a gentle snap to section headings, idle moments
   (the trail tip taps, a bird comes down to rest on the trail), tab details, print prep and a
   ?fps meter for checking frame rate on a real GPU. All of it is decoration: if any piece fails,
   the page carries on without it. */
(function(){
  'use strict';
  var S = window.__site; if (!S) return;
  var $ = S.$, $$ = S.$$, safe = S.safe, reduce = S.reduce, fine = S.fine, root = document.documentElement;
  function theme(){ var t = root.getAttribute('data-time'); return t === 'night' || t === 'morning' ? t : 'dusk'; }
  function clamp(v, a, b){ return v < a ? a : v > b ? b : v; }
  function rnd(a, b){ return a + Math.random() * (b - a); }
  function dlgOpen(){ return root.classList.contains('dlg-open') || !!document.querySelector('dialog[open]'); }
  function sfx(n, o){ if (S.sfx) S.sfx(n, o); }

  /* ---------- W3-11: loops in sections more than a screen away wait until you come back ---------- */
  safe(function(){
    if (!('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function(es){ es.forEach(function(e){ e.target.classList.toggle('zz', !e.isIntersecting); }); }, { rootMargin: '150px 0px' });
    $$('main > section').forEach(function(s){ io.observe(s); });
  });

  /* ---------- W3-01: the cursor is a firefly, a snowflake or a grain of sand, and leaves a little of itself behind ---------- */
  safe(function(){
    if (fine) root.classList.add('cur-on');
    if (reduce) return;
    var cv = document.createElement('canvas'), g = cv.getContext && cv.getContext('2d'); if (!g) return;
    cv.className = 'cur-fx'; cv.setAttribute('aria-hidden', 'true'); cv.style.visibility = 'hidden'; document.body.appendChild(cv);
    var DPR = 1, W = 0, H = 0, P = [], raf = 0, last = 0, lx = null, ly = null, lt = 0, acc = 0, th = theme(), mx = -1, my = -1;
    function size(){ DPR = Math.min(2, window.devicePixelRatio || 1); W = window.innerWidth; H = window.innerHeight; cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR); }
    size(); window.addEventListener('resize', size);
    function sprite(n, draw){ var c = document.createElement('canvas'); c.width = c.height = n; draw(c.getContext('2d'), n); return c; }
    function flake(col){ return sprite(32, function(x, n){ x.translate(n / 2, n / 2); x.lineCap = 'round';
      [['rgba(255,255,255,.95)', 3.4], [col, 1.4]].forEach(function(p){ x.strokeStyle = p[0]; x.lineWidth = p[1]; x.beginPath();
        for (var k = 0; k < 6; k++){ var a = k * Math.PI / 3, bx = Math.cos(a) * 6, by = Math.sin(a) * 6; x.moveTo(0, 0); x.lineTo(Math.cos(a) * 11.5, Math.sin(a) * 11.5);
          for (var sd = -1; sd <= 1; sd += 2){ var b = a + sd * 0.9; x.moveTo(bx, by); x.lineTo(bx + Math.cos(b) * 3.8, by + Math.sin(b) * 3.8); } }
        x.stroke(); }); }); }
    var SPR = {
      glow: sprite(64, function(x, n){ var r = x.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2); r.addColorStop(0, 'rgba(252,255,200,1)'); r.addColorStop(0.16, 'rgba(230,252,128,.9)');
        r.addColorStop(0.42, 'rgba(196,238,92,.26)'); r.addColorStop(1, 'rgba(160,220,70,0)'); x.fillStyle = r; x.fillRect(0, 0, n, n); }),
      flake: flake('#1F5FBF'), ice: flake('#6E9BD8') };
    var SAND = ['#E8AE62', '#D98E4A', '#F2C98A', '#B9773A', '#F4D9A8'];
    function add(p){ if (P.length > 260) P.shift(); P.push(p); }
    /* vx, vy: the velocity the particle starts with (a share of the cursor's, or a burst's) */
    function emit(x, y, vx, vy){
      if (th === 'night') add({ k: 0, x: x + rnd(-4, 4), y: y + rnd(-4, 4), vx: vx + rnd(-10, 10), vy: vy + rnd(-26, -8), l: 0, m: rnd(1.5, 2.6), s: rnd(11, 19), ph: rnd(0, 6.28), f: rnd(1.4, 2.4), t1: rnd(0.15, 0.6) });
      else if (th === 'morning') add({ k: 1, x: x + rnd(-5, 5), y: y + rnd(-5, 5), vx: vx + rnd(-14, 14), vy: vy + rnd(8, 30), l: 0, m: rnd(1.2, 2.1), s: rnd(6, 11), r: rnd(0, 6.28), vr: rnd(-2.4, 2.4), ph: rnd(0, 6.28), c: Math.random() < 0.4 ? 1 : 0 });
      else add({ k: 2, x: x + rnd(-3, 3), y: y + rnd(-3, 3), vx: vx + rnd(-30, 30), vy: vy + rnd(-50, 5), l: 0, m: rnd(0.8, 1.4), s: rnd(1.1, 2.3), c: SAND[Math.random() * SAND.length | 0] });
    }
    function burst(x, y, n, sp){ for (var i = 0; i < n; i++){ var a = rnd(0, 6.283), v = rnd(sp * 0.35, sp); emit(x, y, Math.cos(a) * v, Math.sin(a) * v - (th === 'dusk' ? 40 : 0)); } wake(); }
    function step(dt){
      for (var i = P.length - 1; i >= 0; i--){ var p = P[i]; p.l += dt; if (p.l >= p.m){ P.splice(i, 1); continue; }
        if (p.k === 0){ p.vx += Math.sin(p.l * p.f * 2 + p.ph) * 26 * dt; p.vx *= 1 - dt * 1.5; p.vy *= 1 - dt * 0.7; p.vy -= 7 * dt; }
        else if (p.k === 1){ p.vx += Math.sin(p.l * 3 + p.ph) * 34 * dt; p.vx *= 1 - dt * 1.3; p.vy += (28 - p.vy) * dt * 1.6; p.r += p.vr * dt; }
        else { p.vy += 430 * dt; p.vx += 34 * dt; p.vx *= 1 - dt * 0.9; }
        p.x += p.vx * dt; p.y += p.vy * dt; }
    }
    function draw(){
      g.setTransform(DPR, 0, 0, DPR, 0, 0); g.clearRect(0, 0, W, H);
      for (var i = 0; i < P.length; i++){ var p = P[i], u = p.l / p.m, a, s;
        if (p.k === 0){ /* a firefly: fades in, flashes twice, fades out */
          var d1 = p.l - p.t1, d2 = d1 - 0.28, fl = Math.min(1, 0.22 + Math.exp(-d1 * d1 * 80) + Math.exp(-d2 * d2 * 80));
          a = Math.min(1, u * 8) * (1 - u) * fl; s = p.s * (0.7 + fl * 0.4); g.globalAlpha = a; g.drawImage(SPR.glow, p.x - s / 2, p.y - s / 2, s, s); }
        else if (p.k === 1){ a = Math.min(1, u * 5) * (1 - u); g.globalAlpha = a * 0.95; s = p.s; g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.drawImage(p.c ? SPR.ice : SPR.flake, -s / 2, -s / 2, s, s); g.restore(); }
        else { g.globalAlpha = (1 - u) * 0.95; g.fillStyle = p.c; g.beginPath(); g.arc(p.x, p.y, p.s * (1 - u * 0.3), 0, 6.283); g.fill(); } }
      g.globalAlpha = 1;
    }
    function frame(now){ raf = 0; var dt = Math.min(0.05, (now - (last || now)) / 1000 || 0.016); last = now; step(dt); draw();
      if (P.length) raf = requestAnimationFrame(frame); else { last = 0; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height); cv.style.visibility = 'hidden'; } }
    function wake(){ if (!raf){ cv.style.visibility = ''; raf = requestAnimationFrame(frame); } }
    var GAP = { night: 30, morning: 19, dusk: 10 };
    document.addEventListener('pointermove', function(e){
      if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
      var x = e.clientX, y = e.clientY; mx = x; my = y;
      if (lx === null){ lx = x; ly = y; lt = e.timeStamp; return; }
      var dx = x - lx, dy = y - ly, d = Math.hypot(dx, dy), dtm = Math.max(8, e.timeStamp - lt); lx = x; ly = y; lt = e.timeStamp;
      if (d < 0.5 || d > 420) return;
      var vx = dx / dtm * 1000, vy = dy / dtm * 1000, k = th === 'night' ? 0.07 : th === 'morning' ? 0.05 : -0.06; acc += d;
      while (acc >= GAP[th]){ acc -= GAP[th]; var f = acc / d; emit(x - dx * f, y - dy * f, vx * k, vy * k); }
      wake(); }, { passive: true });
    document.addEventListener('pointerout', function(e){ if (!e.relatedTarget) lx = null; });
    document.addEventListener('pointerdown', function(e){ if (e.button > 0) return; burst(e.clientX, e.clientY, e.pointerType === 'touch' ? 9 : 13, th === 'dusk' ? 190 : 120); }, { passive: true });
    document.addEventListener('timechange', function(){ th = theme(); var x = mx >= 0 ? mx : W / 2, y = mx >= 0 ? my : H * 0.3; burst(x, y, 26, 170); });
    /* when a dialog is open it sits in the top layer, so the particles move in with it */
    function place(){ var d = document.querySelector('dialog[open]'), host = d || document.body; if (cv.parentNode !== host) host.appendChild(cv); }
    $$('dialog').forEach(function(d){ if (window.MutationObserver) new MutationObserver(place).observe(d, { attributes: true, attributeFilter: ['open'] }); });
    window.__cursorFX = { burst: burst, count: function(){ return P.length; } };
  });

  /* ---------- W3-02: scroll lean. Content has a little weight: it lags and tilts as you scroll, then springs back ---------- */
  safe(function(){
    if (reduce) return;
    var els = $$('main > section > .wrap').concat($$('#summit > [data-reveal]'));
    var st = { r: 0, vr: 0, y: 0, vy: 0, v: 0 }, lastY = window.pageYOffset, lastT = performance.now(), lastS = 0, raf = 0, prev = 0;
    if ('IntersectionObserver' in window){ var io = new IntersectionObserver(function(es){ es.forEach(function(e){ e.target.__lv = e.isIntersecting; }); }, { rootMargin: '80px 0px' }); els.forEach(function(el){ io.observe(el); }); }
    else els.forEach(function(el){ el.__lv = true; });
    /* never touch a block while its reveal is still sliding in */
    els.forEach(function(el){ el.addEventListener('transitionend', function(e){ if (e.target === el && e.propertyName === 'transform' && el.classList.contains('in')) el.__set = true; }); });
    function settled(el, now){ if (!el.hasAttribute('data-reveal')) return true; if (!el.classList.contains('in')) return false; if (el.__set) return true; if (!el.__inAt) el.__inAt = now; return now - el.__inAt > 1100; }
    window.addEventListener('scroll', function(){ var now = performance.now(), y = window.pageYOffset, dt = Math.max(8, now - lastT), v = (y - lastY) / dt * 1000; lastY = y; lastT = now; lastS = now;
      if (Math.abs(v) > 30000) v = 0; st.v += (v - st.v) * 0.35; if (!raf) raf = requestAnimationFrame(frame); }, { passive: true });
    function frame(now){
      raf = 0; var real = (now - (prev || now)) / 1000 || 0.016, DT = Math.min(0.25, real), sub = Math.ceil(DT / 0.017), dt = DT / sub; prev = now;
      if (now - lastS > 70) st.v *= Math.exp(-real * 14);
      /* reading-speed scrolling (under ~550 px/s) never leans; a quick fling does, up to 2.8° */
      var m = window.innerWidth < 760 ? 0.6 : 1, av = Math.abs(st.v), k = (st.v < 0 ? -1 : 1) * clamp((av - 550) / 2050, 0, 1), tr = k * 2.8 * m, ty = k * 9 * m;
      if (dlgOpen() || root.classList.contains('fps-nofx') || root.classList.contains('riding')){ tr = 0; ty = 0; }
      /* substeps keep the spring in real time even when frames are slow */
      for (var s = 0; s < sub; s++){ st.vr += (120 * (tr - st.r) - 15 * st.vr) * dt; st.r += st.vr * dt; st.vy += (120 * (ty - st.y) - 15 * st.vy) * dt; st.y += st.vy * dt; }
      var rest = Math.abs(st.r) < 0.004 && Math.abs(st.vr) < 0.02 && Math.abs(st.y) < 0.03 && Math.abs(st.vy) < 0.08 && Math.abs(st.v) < 4;
      var H2 = window.innerHeight / 2, want = [], i;
      for (i = 0; i < els.length; i++){ var el = els[i]; if (!rest && el.__lv && settled(el, now)) want.push([el, el.parentNode.getBoundingClientRect().top + el.offsetTop]); else if (el.__lean) off(el); }
      var tf = 'perspective(1400px) translate3d(0,' + st.y.toFixed(2) + 'px,0) rotateX(' + st.r.toFixed(3) + 'deg)';
      for (i = 0; i < want.length; i++){ var w = want[i][0]; if (!w.__lean){ w.__lean = true; w.style.transition = 'none'; }
        w.style.transformOrigin = '50% ' + (H2 - want[i][1]).toFixed(0) + 'px'; w.style.transform = tf; }
      if (rest){ st.r = st.y = st.vr = st.vy = st.v = 0; prev = 0; } else raf = requestAnimationFrame(frame);
    }
    function off(el){ el.__lean = false; el.style.transform = ''; el.style.transformOrigin = ''; el.style.transition = ''; }
    window.__lean = { state: function(){ return { r: st.r, y: st.y, v: st.v }; } };
  });

  /* ---------- W3-03: film grain over everything, and a paper tooth on the section panels and case studies ---------- */
  safe(function(){
    var cache = {}, gr = document.createElement('div'); gr.className = 'grain'; gr.setAttribute('aria-hidden', 'true'); document.body.appendChild(gr);
    function seeded(s){ return function(){ s |= 0; s = s + 0x6D2B79F5 | 0; var t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
    function toURL(cv, cb){ try { if (cv.toBlob && window.URL && URL.createObjectURL){ cv.toBlob(function(b){ cb(b ? URL.createObjectURL(b) : cv.toDataURL()); }); return; } } catch (e){} cb(cv.toDataURL()); }
    var GR = { night: [236, 232, 224, 6, 10, 26], morning: [255, 255, 255, 19, 22, 28], dusk: [246, 232, 214, 22, 11, 6] };
    function grain(t, cb){ var n = 256, cv = document.createElement('canvas'); cv.width = cv.height = n; var x = cv.getContext('2d', { willReadFrequently: true }), im = x.createImageData(n, n), d = im.data, c = GR[t];
      for (var i = 0; i < n * n; i++){ var v = (Math.random() + Math.random() + Math.random()) / 1.5 - 1, o = i * 4, a = Math.min(255, v * v * 430);
        if (v > 0){ d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; } else { d[o] = c[3]; d[o + 1] = c[4]; d[o + 2] = c[5]; } d[o + 3] = a; }
      x.putImageData(im, 0, 0); toURL(cv, cb); }
    var PA = { night: { lt: '205,218,255', dk: '4,8,22', a: 0.05 }, morning: { lt: '255,255,255', dk: '40,62,104', a: 0.042 }, dusk: { lt: '255,226,192', dk: '24,10,4', a: 0.05 } };
    function paper(t, cb){ var n = 512, cv = document.createElement('canvas'); cv.width = cv.height = n; var x = cv.getContext('2d', { willReadFrequently: true }), p = PA[t], R = seeded(t.length * 977 + 11), i;
      function wrap(cx, cy, rad, fn){ for (var ox = -n; ox <= n; ox += n) for (var oy = -n; oy <= n; oy += n){ if (cx + ox + rad < 0 || cx + ox - rad > n || cy + oy + rad < 0 || cy + oy - rad > n) continue; x.save(); x.translate(ox, oy); fn(); x.restore(); } }
      /* soft mottling, like pulp that dried unevenly */
      for (i = 0; i < 30; i++){ (function(){ var cx = R() * n, cy = R() * n, r = 40 + R() * 130, col = R() < 0.5 ? p.lt : p.dk, a = p.a * (0.35 + R() * 0.9);
        wrap(cx, cy, r, function(){ var g = x.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, 'rgba(' + col + ',' + a.toFixed(3) + ')'); g.addColorStop(1, 'rgba(' + col + ',0)'); x.fillStyle = g; x.fillRect(cx - r, cy - r, r * 2, r * 2); }); })(); }
      /* fibres */
      x.lineCap = 'round';
      for (i = 0; i < 560; i++){ (function(){ var fx = R() * n, fy = R() * n, L = 5 + R() * 24, an = R() * Math.PI, bend = (R() - 0.5) * 8, col = R() < 0.6 ? p.lt : p.dk, a = p.a * (0.7 + R() * 1.6), w = 0.4 + R() * 0.7;
        wrap(fx, fy, L + 6, function(){ var ex = fx + Math.cos(an) * L, ey = fy + Math.sin(an) * L; x.strokeStyle = 'rgba(' + col + ',' + a.toFixed(3) + ')'; x.lineWidth = w; x.beginPath(); x.moveTo(fx, fy);
          x.quadraticCurveTo((fx + ex) / 2 - Math.sin(an) * bend, (fy + ey) / 2 + Math.cos(an) * bend, ex, ey); x.stroke(); }); })(); }
      /* a few specks of grit */
      for (i = 0; i < 160; i++){ var sx = R() * n, sy = R() * n; x.fillStyle = 'rgba(' + (R() < 0.5 ? p.lt : p.dk) + ',' + (p.a * (1 + R() * 2)).toFixed(3) + ')'; x.fillRect(sx, sy, 0.8 + R(), 0.8 + R()); }
      toURL(cv, cb); }
    function set(o){ root.style.setProperty('--grain-img', 'url(' + o.g + ')'); root.style.setProperty('--paper-img', 'url(' + o.p + ')'); }
    function apply(){ var t = theme(); if (cache[t]){ if (cache[t].g && cache[t].p) set(cache[t]); return; } var o = cache[t] = {};
      grain(t, function(u){ o.g = u; if (o.p && theme() === t) set(o); }); paper(t, function(u){ o.p = u; if (o.g && theme() === t) set(o); }); }
    /* made once the name has landed (or after 2.5 s at most), on CPU-backed canvases: a few milliseconds each */
    var made = false; function first(){ if (made) return; made = true; setTimeout(apply, 60); }
    document.addEventListener('intro:landed', first); setTimeout(first, 2500);
    document.addEventListener('timechange', function(){ setTimeout(apply, 30); });
    /* the grain shifts while you scroll, so it reads as film rather than a dirty screen */
    if (!reduce){ var jt = 0; window.addEventListener('scroll', function(){ var now = performance.now(); if (now - jt < 85) return; jt = now;
      gr.style.transform = 'translate3d(' + (Math.random() * 128 - 64 | 0) + 'px,' + (Math.random() * 128 - 64 | 0) + 'px,0)'; }, { passive: true }); }
    window.__textures = { apply: apply, ready: function(){ var c = cache[theme()]; return !!(c && c.g && c.p); } };
  });

  /* ---------- W3-04: a gentle heading snap. When you stop scrolling just short of a section, or just past its
     heading, the page glides the last few pixels so the heading sits at the top. It never fights you. ---------- */
  safe(function(){
    if (reduce) return;
    var secs = $$('main > section'), lastUser = 0, lastKey = 0, dir = 0, lastY = window.pageYOffset, tmr = 0, tw = null, quietUntil = 0;
    function user(){ lastUser = performance.now(); if (tw) cancel(); }
    window.addEventListener('wheel', user, { passive: true });
    window.addEventListener('touchstart', user, { passive: true });
    window.addEventListener('touchmove', function(){ lastUser = performance.now(); }, { passive: true });
    window.addEventListener('pointerdown', function(e){ if (tw) cancel(); if (e.target === root || e.clientX >= root.clientWidth) lastUser = performance.now(); }, { passive: true });
    window.addEventListener('keydown', function(){ lastKey = performance.now(); if (tw) cancel(); });
    window.addEventListener('scroll', function(){ var y = window.pageYOffset; if (y !== lastY) dir = y > lastY ? 1 : -1; lastY = y; if (tw) return; clearTimeout(tmr); tmr = setTimeout(end, 180); }, { passive: true });
    if ('onscrollend' in window) window.addEventListener('scrollend', function(){ if (!tw){ clearTimeout(tmr); tmr = setTimeout(end, 40); } });
    function end(){
      var now = performance.now();
      if (tw || now - lastUser > 1000 || now - lastKey < 1200 || now < quietUntil) return;
      if (dlgOpen() || !root.classList.contains('intro-done') || root.classList.contains('riding')) return;
      var sel = window.getSelection && String(window.getSelection()); if (sel) return;
      var ae = document.activeElement; if (ae && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName)) return;
      var y = window.pageYOffset, max = document.documentElement.scrollHeight - window.innerHeight; if (y > max - 40 || y < 2) return;
      var best = null, bd = 1e9;
      secs.forEach(function(s){ var to = clamp(Math.round(s.getBoundingClientRect().top + y - 30), 0, max), d = to - y, ok = dir >= 0 ? (d >= -56 && d <= 150) : (d >= -150 && d <= 56);
        if (ok && Math.abs(d) > 2 && Math.abs(d) < Math.abs(bd)){ bd = d; best = to; } });
      if (best !== null) glide(y, best);
    }
    function glide(from, to){
      var d = Math.abs(to - from), dur = clamp(240 + d * 2.3, 280, 640), t0 = performance.now(); root.style.scrollBehavior = 'auto'; tw = { raf: 0 }; lastUser = 0;
      function f(now){ if (!tw) return; var u = Math.min(1, (now - t0) / dur), e = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
        window.scrollTo(0, from + (to - from) * e); if (u < 1) tw.raf = requestAnimationFrame(f); else finish(); }
      tw.raf = requestAnimationFrame(f);
    }
    function finish(){ tw = null; root.style.scrollBehavior = ''; quietUntil = performance.now() + 350; }
    function cancel(){ if (tw && tw.raf) cancelAnimationFrame(tw.raf); finish(); }
    window.__snap = { end: end, glide: glide, busy: function(){ return !!tw; }, poke: function(){ lastUser = performance.now(); } };
  });

  /* ---------- W3-06: idle moments. Sit still and the trail tip taps; sit a while longer and a bird comes down to rest
     on the trail: a spotted owlet at night, an alpine chough in the morning, a hoopoe at dusk. Move fast and it's gone.
     Come close slowly and click it, and it trusts you. ---------- */
  var ART = {
    night: '<g class="bt"><path d="M-3 -3.6 L-1 1 L1 1 L3 -3.6Z" fill="#5E503F"/></g><ellipse cx="0" cy="-12" rx="9.5" ry="11" fill="#7C6A55"/><ellipse cx="0" cy="-10" rx="6" ry="7.5" fill="#E2D5BC"/>' +
      '<g fill="#7C6A55"><circle cx="-2.4" cy="-13" r="1.1"/><circle cx="2.2" cy="-11.6" r="1.1"/><circle cx="-1" cy="-8.4" r="1"/><circle cx="3" cy="-7.6" r=".9"/><circle cx="-3.6" cy="-6.6" r=".9"/></g>' +
      '<g class="bw"><path d="M-8.5 -19 C-13.5 -14 -13.5 -6 -8 -2.5 C-7 -8 -6.2 -13.5 -8.5 -19Z" fill="#6A5A47"/><g fill="#EFE6D3"><circle cx="-9.9" cy="-13" r=".8"/><circle cx="-9.4" cy="-9" r=".8"/><circle cx="-8.6" cy="-5.4" r=".7"/></g></g>' +
      '<g class="bw r"><path d="M8.5 -19 C13.5 -14 13.5 -6 8 -2.5 C7 -8 6.2 -13.5 8.5 -19Z" fill="#6A5A47"/><g fill="#EFE6D3"><circle cx="9.9" cy="-13" r=".8"/><circle cx="9.4" cy="-9" r=".8"/><circle cx="8.6" cy="-5.4" r=".7"/></g></g>' +
      '<g class="bh"><circle cx="0" cy="-26" r="9" fill="#7C6A55"/><g fill="#EFE6D3"><circle cx="-4.5" cy="-31.5" r=".9"/><circle cx="-1" cy="-33.4" r=".9"/><circle cx="2.8" cy="-32.8" r=".9"/><circle cx="5.6" cy="-30" r=".8"/></g>' +
      '<path d="M-7.6 -25 C-6 -21 -2 -20 0 -22.5 C2 -20 6 -21 7.6 -25 C6 -29.5 2 -29 0 -27 C-2 -29 -6 -29.5 -7.6 -25Z" fill="#E9DDC6"/>' +
      '<path d="M-6.6 -28.8 C-4.6 -30.2 -2 -29.6 -.8 -28 M6.6 -28.8 C4.6 -30.2 2 -29.6 .8 -28" stroke="#F7F1E4" stroke-width="1.2" fill="none" stroke-linecap="round"/>' +
      '<g class="be"><circle cx="-3.5" cy="-25.2" r="2.7" fill="#F4CE4A"/><circle cx="3.5" cy="-25.2" r="2.7" fill="#F4CE4A"/><circle cx="-3.3" cy="-25" r="1.3" fill="#17120D"/><circle cx="3.7" cy="-25" r="1.3" fill="#17120D"/></g>' +
      '<path d="M-1.1 -23.2 L1.1 -23.2 L0 -20.6Z" fill="#D9B870"/></g>' +
      '<g class="bl" fill="none" stroke="#C9A866" stroke-width="1.3" stroke-linecap="round"><path d="M-2.6 -2.6 V.3 M2.6 -2.6 V.3 M-4.2 .3 H-1 M1 .3 H4.2"/></g>',
    morning: '<g class="bt"><path d="M-7 -8.5 L-19 -5 L-18.2 -1.6 L-6.6 -5Z" fill="#15171D"/></g><path d="M-10.5 -11 C-10.5 -19 -3 -23 4 -20.6 C9.6 -18.6 10.6 -12 7.6 -7.4 C4.6 -3.2 -3 -2.6 -8 -6Z" fill="#1C1F27"/>' +
      '<path d="M-4.5 -18.6 C-.5 -20.6 3.5 -20.6 6 -18.8" fill="none" stroke="#7384A8" stroke-width="1" stroke-linecap="round" opacity=".6"/>' +
      '<g class="bw"><path d="M-6 -17.2 C-12.4 -15.6 -15.6 -9.6 -13.6 -6.2 C-8.6 -7.8 -3.6 -10.8 -1.4 -15Z" fill="#111319"/><path d="M-12.6 -8 L-15.5 -4.6 M-10.8 -7.4 L-13.6 -3.8" stroke="#111319" stroke-width="1.4" stroke-linecap="round"/></g>' +
      '<g class="bh"><circle cx="6" cy="-22" r="5.8" fill="#1C1F27"/><g class="be"><circle cx="7.8" cy="-23.2" r="1.2" fill="#0B0C10"/><circle cx="8.2" cy="-23.6" r=".45" fill="#F4F4F4"/></g>' +
      '<path d="M10.6 -22.6 C14.2 -22.6 16.6 -21 17.2 -18.8 C15 -20.2 12.8 -20.7 10.6 -20.4Z" fill="#F2C418"/></g>' +
      '<g class="bl" fill="none" stroke="#D8453A" stroke-width="1.4" stroke-linecap="round"><path d="M-.6 -4.2 L-1.4 .3 M3.2 -4.4 L3.6 .3 M-3 .4 H.2 M2 .4 H5.4"/></g>',
    dusk: '<g class="bt"><path d="M-7.4 -8 L-19.4 -5.6 L-18.6 -1.8 L-7 -4.6Z" fill="#1E1A18"/><path d="M-14.6 -7.1 L-14.2 -2.7" stroke="#F3EADD" stroke-width="1.6"/></g>' +
      '<path d="M-10.2 -11 C-9.4 -19 -1.4 -22.4 4.6 -19.6 C9 -17.4 9.4 -11.4 6.4 -7.2 C3.4 -3.6 -3.6 -3 -8 -6Z" fill="#E1935B"/>' +
      '<g class="bw"><path d="M-6.8 -16.4 C-13 -14.6 -15.4 -8.6 -12.4 -5.6 C-7.4 -7 -3.2 -10.2 -1.6 -14.2Z" fill="#1E1A18"/><path d="M-11.6 -12.4 L-4.6 -14.4 M-12.9 -9.4 L-6 -11.6 M-12.6 -6.8 L-8.2 -8.3" stroke="#F3EADD" stroke-width="1.25" stroke-linecap="round"/></g>' +
      '<g class="bh"><g class="bc"><path d="M1.4 -23.6 C-.4 -29.6 .6 -33 2.8 -34 L4.4 -24.6Z M4.2 -24.8 C4 -31 6 -34.2 8.2 -34.6 L6.6 -24.4Z M6.4 -24.3 C8 -29.8 10.6 -31.6 12.4 -31.2 L8.4 -23.2Z" fill="#E8A66E"/>' +
      '<path d="M1.5 -31.2 L2.8 -34 L3.7 -31Z M5.4 -31.9 L8.2 -34.6 L7.3 -31.6Z M9.3 -29.4 L12.4 -31.2 L10.4 -28.2Z" fill="#1E1A18"/></g>' +
      '<circle cx="5.6" cy="-20.6" r="4.9" fill="#E8A66E"/><circle class="be" cx="7.2" cy="-21.4" r="1.05" fill="#1E1A18"/><path d="M9.8 -20.8 C13.2 -20.4 16.8 -18.6 18.8 -15.4 C16.2 -17.4 13 -18.6 10 -19Z" fill="#2A2320"/></g>' +
      '<g class="bl" fill="none" stroke="#5A4A40" stroke-width="1.3" stroke-linecap="round"><path d="M-.8 -4.4 L-1.5 .3 M2.8 -4.6 L3.1 .3 M-3.1 .4 H0 M1.6 .4 H4.8"/></g>'
  };
  safe(function(){
    if (reduce) return;
    var T = window.__trail; if (!T) return;
    var lastApi = null, idleAt = performance.now(), lastTap = 0, lastBird = -1e9, bird = null, count = 0, px = -1, py = -1, pv = 0, pt = 0;
    function active(){ idleAt = performance.now(); }
    function onScreen(x, y, m){ var vx = x - window.pageXOffset, vy = y - window.pageYOffset; return vx > m && vx < window.innerWidth - m && vy > 70 + m && vy < window.innerHeight - m; }
    document.addEventListener('pointermove', function(e){ var now = performance.now(), d = px < 0 ? 0 : Math.hypot(e.clientX - px, e.clientY - py), dt = Math.max(8, now - pt);
      pv = pv * 0.55 + (d / dt * 1000) * 0.45; px = e.clientX; py = e.clientY; pt = now; if (d > 3) active(); if (bird) bird.pointer(px, py, pv); }, { passive: true });
    ['keydown', 'wheel', 'touchstart'].forEach(function(ev){ window.addEventListener(ev, function(){ active(); if (bird) bird.leave('startle'); }, { passive: true }); });
    window.addEventListener('scroll', function(){ active(); if (bird) bird.leave('startle'); }, { passive: true });
    document.addEventListener('pointerdown', function(e){ active(); if (bird && !(e.target.closest && e.target.closest('.bird-b'))) bird.leave('startle'); }, { passive: true });
    document.addEventListener('timechange', function(){ if (bird) bird.leave('startle'); });
    window.addEventListener('resize', function(){ if (bird) bird.leave('calm'); });
    function tick(){
      if (document.hidden || dlgOpen()) return;
      var now = performance.now(), idle = now - idleAt;
      if (idle > 7000 && now - lastTap > 8000 && !bird){ var tp = T.tip(); if (tp && tp.vis && !tp.done && onScreen(tp.x, tp.y, 30) && T.tap()){ lastTap = now; sfx('tap'); } }
      if (idle > 14000 && !bird && fine && window.innerWidth > 900 && now - lastBird > 45000 && count < 4){ bird = makeBird(); if (bird) count++; else lastBird = now - 30000; }
    }
    setInterval(tick, 500);
    function norm(a){ while (a > Math.PI / 2) a -= Math.PI; while (a < -Math.PI / 2) a += Math.PI; return a; }
    /* cards and controls count as busy by their box; paragraphs and headings only where there is actual text */
    var CARD = 'a, button, input, label, .btn, .mk, .chip, .tool-vis, .env, .h-peek, .xc, .pl-scene, .fc, .af-card, .gopuram, .cs-row, .oc-card, .ld-block, .rh-card, .xs-m, .climb, .alt, .hdr, .trail-btn, .cvt, .egg-note, .sm-made, .reg, img, video', TEXT = 'p, h1, h2, h3, h4, li';
    function overText(x, y){
      var r = null; if (document.caretRangeFromPoint) r = document.caretRangeFromPoint(x, y);
      else if (document.caretPositionFromPoint){ var cp = document.caretPositionFromPoint(x, y); if (cp){ r = document.createRange(); r.setStart(cp.offsetNode, cp.offset); } }
      if (!r || !r.startContainer || r.startContainer.nodeType !== 3) return false;
      var rg = document.createRange(); rg.selectNodeContents(r.startContainer); var rs = rg.getClientRects();
      for (var i = 0; i < rs.length; i++){ var q = rs[i]; if (x >= q.left - 3 && x <= q.right + 3 && y >= q.top - 3 && y <= q.bottom + 3) return true; }
      return false;
    }
    /* the spot and the space the bird takes up must be empty page; when it sits on a heading, the heading itself doesn't count */
    function clear(vx, vy, above, self){ var pts = above ? [[0, -14], [-15, -24], [15, -24], [0, -38]] : [[0, -8], [-15, -20], [15, -20], [0, -36], [-20, -6], [20, -6]];
      for (var k = 0; k < pts.length; k++){ var x = vx + pts[k][0], y = vy + pts[k][1], el = document.elementFromPoint(x, y); if (!el) return false;
        if (self && (el === self || self.contains(el))) continue; if (!el.closest) continue; if (el.closest(CARD)) return false; if (el.closest(TEXT) && overText(x, y)) return false; }
      return true; }
    function findPerch(){
      var n = T.drawn ? T.drawn() : 0, sx = window.pageXOffset, sy = window.pageYOffset, W = window.innerWidth, H = window.innerHeight, best = null, bs = 1e9;
      for (var i = 6; i < n - 6; i += 3){ var p = T.at(i); if (!p) continue; var vx = p.x - sx, vy = p.y - sy; if (vx < 90 || vx > W - 120 || vy < 150 || vy > H - 90) continue;
        var a = norm(p.ang); if (Math.abs(a) > 0.38 || !clear(vx, vy)) continue;
        var sc = Math.abs(a) * 3 + Math.abs(vy - H * 0.55) / H; if (sc < bs){ bs = sc; best = { i: i }; } }
      if (best) return best;
      /* nowhere on the rope: it sits on top of a heading instead, like a bird on a sign */
      var hs = $$('.h-name, main .s-h, #summit h2');
      for (var k = 0; k < hs.length; k++){ var r = hs[k].getBoundingClientRect(), nm = hs[k].classList.contains('h-name'); if (r.top < (nm ? 80 : 170) || r.top > H - 170 || r.width < 220) continue;
        var fs = parseFloat(getComputedStyle(hs[k]).fontSize) || 40, l0;
        if (nm){ var w0 = hs[k].querySelector('.nw'), lts = w0 ? w0.querySelectorAll('.nl') : []; if (!lts.length) continue; l0 = lts[lts.length - 1].getBoundingClientRect(); var gx = l0.left + l0.width * 0.62, gy = l0.top + fs * 0.08; if (clear(gx, gy - 6, true, hs[k])) return { i: null, x: gx + sx, y: gy + sy }; continue; }
        var rg = document.createRange(); rg.selectNodeContents(hs[k]); var ls = rg.getClientRects(); if (!ls.length) continue; l0 = ls[0];
        var x = l0.left + Math.min(l0.width - 30, l0.width * 0.7), y = l0.top + fs * 0.16; if (clear(x, y - 6, true, hs[k])) return { i: null, x: x + sx, y: y + sy }; }
      return null;
    }
    function bez(a, b, c, d, t){ var m = 1 - t; return { x: m * m * m * a.x + 3 * m * m * t * b.x + 3 * m * t * t * c.x + t * t * t * d.x, y: m * m * m * a.y + 3 * m * m * t * b.y + 3 * m * t * t * c.y + t * t * t * d.y }; }
    function makeBird(){
      var perch = findPerch(); if (!perch) return null;
      var sp = theme(), el = document.createElement('div'); el.className = 'bird bird-' + sp + ' fly'; el.setAttribute('aria-hidden', 'true');
      el.innerHTML = '<div class="bird-b"><div class="bird-f"><svg viewBox="-22 -42 44 44">' + ART[sp] + '</svg></div></div>'; document.body.appendChild(el);
      var left = '', body = $('.bird-b', el), st = 'in', t0 = performance.now(), pos = { x: 0, y: 0 }, ang = 0, raf = 0, actT = 0, perchAt = 0, from, out = null, timers = [];
      function target(){ if (perch.i == null) return { x: perch.x, y: perch.y, ang: 0 }; var p = T.at(perch.i); return p ? { x: p.x, y: p.y - 1, ang: norm(p.ang) } : { x: pos.x, y: pos.y, ang: 0 }; }
      var tg0 = target(), sx = window.pageXOffset, sy = window.pageYOffset, W = window.innerWidth, fromLeft = tg0.x - sx < W / 2;
      from = { x: sx + (fromLeft ? -70 : W + 70), y: sy + rnd(60, 170) }; pos = { x: from.x, y: from.y }; el.classList.toggle('left', !fromLeft);
      var DUR = clamp(1300 + Math.hypot(tg0.x - from.x, tg0.y - from.y) * 0.9, 1500, 2600);
      function later(ms, fn){ timers.push(setTimeout(fn, ms)); }
      function cls(c, ms){ el.classList.add(c); later(ms, function(){ el.classList.remove(c); }); }
      function vx(){ return (pos.x - window.pageXOffset) / window.innerWidth; }
      function landed(){
        body.animate([{ transform: 'scale(1.14,.8)' }, { transform: 'scale(.95,1.06)', offset: 0.5 }, { transform: 'none' }], { duration: 420, easing: 'cubic-bezier(.3,1.6,.5,1)' });
        if (perch.i != null){ T.pluck(perch.i, 190); T.perch(perch.i, 900); }
        if (sp === 'dusk') cls('crest', 1000); actT = performance.now() + 1300; sfx('bird', { sp: sp, soft: true, x: vx() });
      }
      function hop(){ body.animate([{ transform: 'none' }, { transform: 'translateY(-7px) scale(.96,1.04)', offset: 0.4 }, { transform: 'scale(1.08,.9)', offset: 0.8 }, { transform: 'none' }], { duration: 440, easing: 'ease-out' }); if (perch.i != null) T.pluck(perch.i, 80); }
      function act(now){ actT = now + rnd(1400, 3400); var r = Math.random();
        if (r < 0.28) cls('blink', 220); else if (r < 0.48) el.classList.toggle('left'); else if (r < 0.62) hop();
        else if (r < 0.74) cls(sp === 'dusk' ? 'crest' : 'tilt', 900); else if (r < 0.85) cls('preen', 1100); else if (r < 0.94) cls('flick', 420);
        else { sfx('bird', { sp: sp, x: vx() }); cls('tilt', 500); } }
      function frame(now){
        raf = 0;
        if (st === 'in'){ var u = Math.min(1, (now - t0) / DUR), e = 1 - Math.pow(1 - u, 2.2), tg = target();
          var p = bez(from, { x: from.x + (tg.x - from.x) * 0.35, y: Math.min(from.y, tg.y) - 110 }, { x: tg.x - (tg.x - from.x) * 0.1, y: tg.y - 80 }, tg, e);
          ang = clamp((p.y - pos.y) * 0.9, -14, 14) * (fromLeft ? 1 : -1); pos = p;
          if (u > 0.74 && !el.classList.contains('glide')){ el.classList.remove('fly'); el.classList.add('glide', 'land'); }
          if (u >= 1){ st = 'perch'; perchAt = now; el.classList.remove('glide'); el.classList.add('perch'); ang = 0; landed(); } }
        else if (st === 'perch'){ var t2 = target(); pos.x = t2.x; pos.y = t2.y; ang = t2.ang * 180 / Math.PI * 0.6; if (now > actT) act(now); if (now - perchAt > 30000) leave('calm'); }
        else if (st === 'out'){ var v = Math.min(1, (now - t0) / out.dur), q = v * v * (1.4 - 0.4 * v); var c = bez(out.a, { x: out.a.x + (out.b.x - out.a.x) * 0.2, y: out.a.y - 40 }, { x: out.b.x - (out.b.x - out.a.x) * 0.3, y: out.b.y + 60 }, out.b, q);
          ang = clamp((c.y - pos.y) * 0.8, -18, 18) * (out.left ? -1 : 1); pos = c; if (v >= 1){ gone(); return; } }
        el.style.transform = 'translate(' + pos.x.toFixed(1) + 'px,' + pos.y.toFixed(1) + 'px) rotate(' + ang.toFixed(1) + 'deg)';
        raf = requestAnimationFrame(frame);
      }
      function leave(why){
        if (st === 'out' || st === 'gone') return; var perched = st === 'perch'; st = 'out'; t0 = performance.now(); left = why;
        if (perch.i != null){ T.perch(null); if (perched) T.pluck(perch.i, why === 'calm' ? -110 : -250); }
        el.classList.remove('perch', 'glide', 'land', 'tilt', 'preen', 'crest'); el.classList.add('fly');
        var sx2 = window.pageXOffset, W2 = window.innerWidth, left = px >= 0 && why !== 'calm' ? px > pos.x - sx2 : Math.random() < 0.5;
        el.classList.toggle('left', left); out = { a: { x: pos.x, y: pos.y }, b: { x: sx2 + (left ? -90 : W2 + 90), y: window.pageYOffset - 90 }, dur: why === 'calm' || why === 'friend' ? 1700 : 950, left: left };
        if (why === 'startle') sfx('flutter', { x: vx() }); lastBird = performance.now();
      }
      function gone(){ st = 'gone'; timers.forEach(clearTimeout); if (el.parentNode) el.parentNode.removeChild(el); if (bird === api) bird = null; lastBird = performance.now(); }
      function friend(){ st = 'friend'; sfx('bird', { sp: sp, x: vx(), happy: true }); hop(); later(260, hop);
        var nt = document.createElement('span'); nt.className = 'bird-note'; nt.textContent = '♪'; el.appendChild(nt);
        if (window.__eggs) window.__eggs.find('bird', 'It trusts you. Patient testers find the rare ones.', 'bird');
        later(1900, function(){ st = 'perch'; leave('friend'); }); }
      body.addEventListener('click', function(e){ e.preventDefault(); e.stopPropagation(); if (st !== 'perch') return; if (pv < 420) friend(); else leave('startle'); });
      var api = {
        pointer: function(x, y, v){ if (st !== 'perch') return; var d = Math.hypot(x - (pos.x - window.pageXOffset), y - (pos.y - window.pageYOffset) + 18); if (d < 130 && v > 700) leave('startle'); },
        leave: function(why){ if (st === 'friend' && why === 'startle') return; leave(why); },
        state: function(){ return { st: st, sp: sp, i: perch.i, x: pos.x, y: pos.y, why: left }; },
        el: el, friend: function(){ if (st === 'perch') friend(); }
      };
      raf = requestAnimationFrame(frame); lastApi = api;
      return api;
    }
    /* test hooks */
    window.__idle = { last: function(){ return lastApi && lastApi.state(); }, bird: function(){ return bird; }, spawn: function(){ if (!bird){ bird = makeBird(); if (bird) count++; } return bird; }, tap: function(){ return T.tap(); }, perch: findPerch };
  });

  /* ---------- W3-08: tab details. The favicon follows the theme (and gets a flag once you summit), the browser
     chrome takes the theme colour, and an away tab keeps your place ---------- */
  safe(function(){
    var link = $('link[rel="icon"][type="image/svg+xml"]'), meta = $('meta[name="theme-color"]'), base = document.title, summit = false, away = false, tBack = 0;
    var FI = {
      night: ['#0C1224', '#F2C38B', '#ECE8E0', '<path d="M50.5 8.5a9.5 9.5 0 1 0 7.5 15.6a7.6 7.6 0 1 1 -7.5 -15.6z" fill="#ECE8E0"/>', '#8FD8C6', ''],
      morning: ['#EEF1F4', '#1F5FBF', '#FFFFFF', '<circle cx="48" cy="16" r="7" fill="#E9A23B"/>', '#A64B22', ' stroke="rgba(19,22,28,.18)" stroke-width="2"'],
      dusk: ['#17110F', '#F07A55', '#F3EADD', '<circle cx="48" cy="17.5" r="7.5" fill="#D9AE4E"/>', '#D9AE4E', ''] };
    var TC = { night: '#0C1224', morning: '#EEF1F4', dusk: '#17110F' };
    function icon(t){ var c = FI[t], cap = t === 'morning' ? '#13161C' : c[2];
      return 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect x="1" y="1" width="62" height="62" rx="14" fill="' + c[0] + '"' + c[5] + '/>' + c[3] +
        '<path d="M6 52 L25 20 L34 34 L41 24 L58 52 Z" fill="' + c[1] + '"/><path d="M25 20 L20.5 27.6 L25 25.8 L29 28.6 Z" fill="' + c[2] + '"/>' +
        (summit ? '<path d="M25 20.5V8" stroke="' + cap + '" stroke-width="2.4" stroke-linecap="round"/><path d="M25.6 8.4 L34.5 11.6 L25.6 14.8Z" fill="' + c[4] + '"/>' : '') + '</svg>'); }
    function paint(){ var t = theme(); if (link) link.setAttribute('href', icon(t)); if (meta) meta.setAttribute('content', TC[t]); }
    paint(); document.addEventListener('timechange', paint); document.addEventListener('summit:reached', function(){ summit = true; paint(); });
    var AWAY = { night: 'The moon’s still up', morning: 'The snow will keep', dusk: 'The fire’s still going' };
    document.addEventListener('visibilitychange', function(){
      clearTimeout(tBack);
      if (document.hidden){ var m = document.getElementById('altM'), alt = m ? m.textContent.trim() : ''; document.title = AWAY[theme()] + (alt ? ' · ' + alt : ''); away = true; }
      else if (away){ away = false; document.title = 'Welcome back'; tBack = setTimeout(function(){ document.title = base; }, 1800); }
    });
    window.__tab = { icon: icon, base: base };
  });

  /* ---------- W3-10: print. Everything revealed, numbers and headings in their final text, the letter and the four
     case studies on paper too, and nothing that only makes sense on a screen. With a dialog open, just that page. ---------- */
  safe(function(){
    var built = false;
    function clean(node){ $$('.dlg-x, .cs-next, .wb, button, .fold-ghost, .plane, .pl-trail, .door, mask', node).forEach(function(x){ if (x.parentNode) x.parentNode.removeChild(x); });
      $$('[id]', node).forEach(function(x){ x.removeAttribute('id'); }); $$('.sig-ink', node).forEach(function(p){ p.removeAttribute('mask'); }); return node; }
    function copy(from, cls){ var d = document.createElement('div'); d.className = cls; var c = clean(from.cloneNode(true)); while (c.firstChild) d.appendChild(c.firstChild); return d; }
    function build(){ if (built) return; built = true;
      var L = $('#letter .dlg-in'), band = $('#letter-sec .wrap'); if (L && band) band.appendChild(copy(L, 'print-only print-letter'));
      var cw = $('#cases .wrap'); if (cw) $$('dialog.dlg:not(.dlg-letter) .dlg-in').forEach(function(inn){ cw.appendChild(copy(inn, 'print-only print-case')); });
      var ct = $('#contact .wrap'); if (ct){ var f = document.createElement('p'); f.className = 'print-only pr-foot'; f.textContent = 'Printed from https://aravin4d.github.io/Aravind_Natarajan/ · Résumé (PDF): https://aravin4d.github.io/Aravind_Natarajan/assets/Aravind_Natarajan_Resume.pdf'; ct.appendChild(f); } }
    function prep(){
      build(); root.classList.add('printing');
      $$('.js [data-reveal]').forEach(function(el){ el.classList.add('in'); });
      $$('.sr').forEach(function(sr){ var nx = sr.nextElementSibling; if (nx && nx.getAttribute('aria-hidden') === 'true'){ sr.classList.add('pr-sr'); nx.classList.add('pr-hide'); } });
      var od = $('dialog[open]'); if (od){ var inn = $('.dlg-in', od); if (inn){ var cp = copy(inn, 'print-only pr-dlg-copy ' + (od.id === 'letter' ? 'print-letter' : 'pr-case')); document.body.appendChild(cp);
        $$('.sr', cp).forEach(function(sr){ var nx = sr.nextElementSibling; if (nx && nx.getAttribute('aria-hidden') === 'true'){ sr.classList.add('pr-sr'); nx.classList.add('pr-hide'); } }); root.classList.add('pr-dlg'); } }
    }
    function done(){ root.classList.remove('printing', 'pr-dlg'); $$('.pr-dlg-copy').forEach(function(x){ x.parentNode.removeChild(x); });
      $$('.pr-sr').forEach(function(x){ x.classList.remove('pr-sr'); }); $$('.pr-hide').forEach(function(x){ x.classList.remove('pr-hide'); }); }
    window.addEventListener('beforeprint', prep); window.addEventListener('afterprint', done);
    if (window.matchMedia){ var mq = window.matchMedia('print'); if (mq.addEventListener) mq.addEventListener('change', function(e){ if (e.matches) prep(); else done(); }); }
    window.__print = { prep: prep, done: done };
  });

  /* ---------- W3-11: ?fps. A small meter for checking frame rate on a real GPU, with switches to A/B the suspects ---------- */
  safe(function(){
    if (!/[?&]fps\b/.test(location.search)) return;
    var box = document.createElement('div'); box.className = 'fps'; box.setAttribute('role', 'region'); box.setAttribute('aria-label', 'Frame rate meter');
    box.innerHTML = '<div><b class="fv">--</b> fps <span class="fq"></span></div><canvas width="368" height="72"></canvas><div class="fm">frame -- ms · worst --</div>' +
      '<div><button type="button" data-k="halo" aria-pressed="true">halo</button><button type="button" data-k="float" aria-pressed="true">float</button><button type="button" data-k="3d" aria-pressed="true">3D</button><button type="button" data-k="fx" aria-pressed="true">lean + grain</button></div>';
    document.body.appendChild(box);
    var fv = $('.fv', box), fq = $('.fq', box), fm = $('.fm', box), cv = $('canvas', box), g = cv.getContext('2d'), hist = [], last = 0, acc = 0, n = 0, worst = 0, t0 = performance.now();
    function draw(){ g.clearRect(0, 0, 368, 72); g.strokeStyle = 'rgba(255,255,255,.2)'; g.lineWidth = 1; g.beginPath(); [16.7, 33.3].forEach(function(v){ var y = 72 - v / 50 * 72; g.moveTo(0, y); g.lineTo(368, y); }); g.stroke();
      g.strokeStyle = '#5CD69A'; g.lineWidth = 2; g.beginPath(); hist.forEach(function(ms, i){ var x = i / 119 * 368, y = 72 - Math.min(50, ms) / 50 * 72; if (i) g.lineTo(x, y); else g.moveTo(x, y); }); g.stroke(); }
    function frame(now){ if (last){ var ms = now - last; hist.push(ms); if (hist.length > 120) hist.shift(); acc += ms; n++; if (ms > worst) worst = ms; } last = now;
      if (now - t0 > 500 && n){ var fps = 1000 / (acc / n), q = window.__world && window.__world.quality ? window.__world.quality() : null;
        fv.textContent = fps.toFixed(0); fv.style.color = fps >= 55 ? '#5CD69A' : fps >= 30 ? '#F2C38B' : '#FF7A7A';
        fm.textContent = 'frame ' + (acc / n).toFixed(1) + ' ms · worst ' + worst.toFixed(0) + ' ms';
        fq.textContent = q ? '· 3D at ' + q.pr.toFixed(2) + 'x' : root.classList.contains('no-3d') ? '· painted' : ''; acc = 0; n = 0; worst = 0; t0 = now; draw(); }
      requestAnimationFrame(frame); }
    requestAnimationFrame(frame);
    box.addEventListener('click', function(e){ var b = e.target.closest('button'); if (!b) return; var on = b.getAttribute('aria-pressed') !== 'true', k = b.getAttribute('data-k'); b.setAttribute('aria-pressed', on ? 'true' : 'false');
      if (k === 'halo') root.classList.toggle('fps-nohalo', !on); else if (k === 'float') root.classList.toggle('fps-nofloat', !on);
      else if (k === '3d'){ root.classList.toggle('fps-no3d', !on); if (window.__world && window.__world.pause) window.__world.pause(!on); } else root.classList.toggle('fps-nofx', !on); });
  });
})();
