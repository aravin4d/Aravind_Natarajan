/* Wave 4 · Part 2: every world reveals its chapters in its own weather.
   Night: mist lifts off the Nilgiris. Morning: frost thaws off the glass. Dusk: the wind blows the sand away.
   The four Experience chapters are open windows onto the landscape. Each starts covered, clears as you scroll
   into it, finishes on its own once it's past halfway, and covers over again once it's well off screen, so it
   plays again next time. The Moments cards clear the same way, smaller and quicker, and their numbers roll
   once they're clear. Each block draws on one small canvas, from a coarse grid, and only while it changes. */
(function(){
  'use strict';
  var S = window.__site; if (!S || S.reduce) return;
  var root = document.documentElement, $ = S.$, $$ = S.$$;
  var DPR = Math.min(1.25, window.devicePixelRatio || 1);
  function theme(){ var t = root.getAttribute('data-time'); return t === 'night' || t === 'morning' ? t : 'dusk'; }
  function clamp(v, a, b){ return v < a ? a : v > b ? b : v; }
  function sm(a, b, x){ var t = (x - a) / (b - a); t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); }
  function hash(x, y, s){ var h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 1442695041)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
  function vn(x, y, s){ var xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    var a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
  function fbm(x, y, s, o){ var t = 0, a = 0.5, n = 0; for (var i = 0; i < o; i++){ t += a * vn(x, y, s + i * 31); n += a; a *= 0.5; x = x * 2.03 + 5.3; y = y * 2.03 + 1.7; } return t / n; }
  /* fbm bunches up around the middle; stretch it so thresholds have the whole range to work with */
  function fs(x, y, s, o){ var v = (fbm(x, y, s, o) - 0.5) * 2.1 + 0.5; return v < 0 ? 0 : v > 1 ? 1 : v; }
  function rng(seed){ var s = seed >>> 0; return function(){ s = (s + 0x6D2B79F5) >>> 0; var t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  /* ---------- fine detail, shared by every block of a theme: frost ferns and crystals, grains of sand ---------- */
  var TILES = {};
  function tile(k){
    if (k in TILES) return TILES[k];
    var c = null;
    if (k === 'morning' || k === 'dusk'){
      var n = k === 'morning' ? 320 : 180, x, R = rng(k === 'morning' ? 41 : 73), i;
      c = document.createElement('canvas'); c.width = c.height = n; x = c.getContext('2d');
      if (k === 'morning'){
        x.lineCap = 'round';
        var fern = function(px, py, a, len, w, d){
          var pts = [[px, py]], br = [], st = 2.4, bend = (R() - 0.5) * 0.06, sx = px, sy = py, side = R() < 0.5 ? 1 : -1, next = 4 + R() * 3, s, q, ox, oy;
          for (s = 0; s < len; s += st){ a += bend; sx += Math.cos(a) * st; sy += Math.sin(a) * st; pts.push([sx, sy]);
            if (d < 2 && s > next){ next = s + (d ? 2.6 : 4.2) + R() * 2.4; br.push([sx, sy, a + side * (0.9 + R() * 0.25), (len - s) * (d ? 0.4 : 0.46) * (0.55 + R() * 0.5)]); side = -side; } }
          var al = (0.62 - d * 0.17) * (0.7 + R() * 0.3);
          for (var pass = 0; pass < 2; pass++){ x.strokeStyle = pass ? 'rgba(255,255,255,' + al.toFixed(2) + ')' : 'rgba(92,124,172,' + (al * 0.42).toFixed(2) + ')'; x.lineWidth = pass ? w : w + 0.6; var sh = pass ? 0 : 0.9;
          for (ox = -n + sh; ox <= n + sh; ox += n) for (oy = -n + sh; oy <= n + sh; oy += n){ x.beginPath(); x.moveTo(pts[0][0] + ox - sh, pts[0][1] + oy - sh); for (q = 1; q < pts.length; q++) x.lineTo(pts[q][0] + ox - sh, pts[q][1] + oy - sh); x.stroke(); } }
          br.forEach(function(b){ if (b[3] > 2.5) fern(b[0], b[1], b[2], b[3], w * 0.7, d + 1); }); };
        for (i = 0; i < 18; i++) fern(R() * n, R() * n, R() * Math.PI * 2, 40 + R() * 56, 1.25, 0);
        for (i = 0; i < 70; i++){ var cx = R() * n, cy = R() * n, rr = 0.8 + R() * 1.8, t3, an; x.strokeStyle = 'rgba(255,255,255,' + (0.4 + R() * 0.5).toFixed(2) + ')'; x.lineWidth = 0.7; x.beginPath();
          for (t3 = 0; t3 < 3; t3++){ an = t3 * Math.PI / 3 + R(); x.moveTo(cx - Math.cos(an) * rr, cy - Math.sin(an) * rr); x.lineTo(cx + Math.cos(an) * rr, cy + Math.sin(an) * rr); } x.stroke(); }
      } else {
        for (i = 0; i < n * n / 18; i++){ var dk = R() < 0.56, sz = R() < 0.82 ? 1 : 1.7; x.fillStyle = dk ? 'rgba(92,44,18,' + (0.16 + R() * 0.3).toFixed(2) + ')' : 'rgba(255,238,204,' + (0.2 + R() * 0.4).toFixed(2) + ')'; x.fillRect(R() * n, R() * n, sz, sz); }
      }
    }
    TILES[k] = c; return c;
  }

  /* ---------- one veil per block ---------- */
  var veils = [], raf = 0, lastT = 0, frozen = false, sndAt = -1e5;
  function add(host, small, idx){
    var cv = document.createElement('canvas'); cv.className = 'vl-c'; cv.setAttribute('aria-hidden', 'true'); host.appendChild(cv);
    var V = { host: host, cv: cv, ctx: cv.getContext('2d'), small: small, i: idx, col: 0, p: 0, drawn: -1, lock: false, key: '', off: 0, parts: [], t: idx * 7.3, acc: 0, started: false, finished: false, glint: -1, idleAt: 0, flies: 0 };
    if (small) host.addEventListener('focusin', function(){ V.lock = true; kick(); });
    veils.push(V); return V;
  }
  function build(V){
    var k = theme(), W = Math.max(24, Math.round(V.host.offsetWidth + (V.small ? 2 : 0))), H = Math.max(24, Math.round(V.host.offsetHeight + (V.small ? 2 : 0))), key = k + ':' + W + 'x' + H;
    if (V.key === key || !V.ctx) return false;
    V.key = key; V.kind = k; V.W = W; V.H = H; V.parts = []; V.flies = 0; V.glint = -1; V.pat = null;
    V.cv.width = Math.round(W * DPR); V.cv.height = Math.round(H * DPR);
    var cell = k === 'night' ? (V.small ? 4 : 6) : k === 'dusk' ? 3 : (W > 900 ? 4 : 3), gw = Math.ceil(W / cell), gh = Math.ceil(H / cell), x, y, i, sd = 17 + V.i * 13;
    V.cell = cell; V.gw = gw; V.gh = gh;
    if (!V.low) V.low = document.createElement('canvas'); V.low.width = gw; V.low.height = gh; V.lctx = V.low.getContext('2d'); V.img = V.lctx.createImageData(gw, gh);
    if (V.small){ var g = V.host.parentNode; V.col = g && V.host.offsetLeft - g.offsetLeft > g.offsetWidth * 0.3 ? 1 : 0;
      if (!V.o && window.__odo){ var ne = $('.xs-n', V.host); if (ne && /[0-9]/.test(ne.textContent)){ V.o = window.__odo.odo(ne); window.__odo.zero(V.o); } } }
    if (k === 'night'){
      /* moonlit mist in soft horizontal banks, with room to drift sideways and to lift */
      var A = V.small ? 3 : 10, L = Math.ceil(gh * 0.45) + 2, DW = gw + 2 * A + 3, DH = gh + L + 2, D = new Float32Array(DW * DH), sx = cell / (V.small ? 110 : 260), sy = cell / (V.small ? 46 : 120);
      for (y = 0; y < DH; y++) for (x = 0; x < DW; x++){ var nn = fs(x * sx, y * sy, sd, 4), band = 0.5 + 0.5 * Math.sin(y * sy * 2.4 + nn * 4.2); D[y * DW + x] = clamp(nn * 0.72 + band * 0.34 - 0.06, 0, 1); }
      V.D = D; V.DW = DW; V.A = A; V.L = L;
    } else if (k === 'morning'){
      /* frost on glass: a haze with crystals in it, and the order it melts in, from a warm spot outward */
      var N = new Float32Array(gw * gh), M = new Float32Array(gw * gh), cx = gw * (V.small ? 0.5 : 0.34), cy = gh * (V.small ? 0.5 : 0.7), dm = Math.hypot(Math.max(cx, gw - cx), Math.max(cy, gh - cy) * 1.1);
      for (y = 0; y < gh; y++) for (x = 0; x < gw; x++){ i = y * gw + x; var dd = Math.hypot(x - cx, (y - cy) * 1.1) / dm;
        var ed = Math.min(x, gw - 1 - x, y, gh - 1 - y) * cell, eb = V.small ? Math.max(0, 1 - ed / 40) * 0.5 : Math.max(0, 1 - ed / 150);
        N[i] = Math.min(1, fs(x * cell / 26, y * cell / 26, sd, 3) * 0.45 + fs(x * cell / 90, y * cell / 90, sd + 4, 3) * 0.55 + eb * 0.5); M[i] = dd * 0.9 + (fs(x * cell / 60, y * cell / 60, sd + 9, 3) - 0.5) * 0.32 + (V.small ? 0 : Math.max(0, dd - 0.8) * 1.1); }
      V.N = N; V.M = M; V.wet = new Float32Array(gw * gh);
    } else {
      /* a drift of sand with wind ripples lit from the upper right, streaks for the wind to follow, and a low ridge that stays */
      var PAD = V.small ? 8 : Math.ceil(gw * 0.08) + 2, RW = gw + PAD, Rp = new Float32Array(RW * gh), K = new Float32Array(gw * gh), RES = new Float32Array(gw);
      for (y = 0; y < gh; y++) for (x = 0; x < RW; x++){ var px = (x - PAD) * cell, py = y * cell, warp = fs(px / 300, py / 220, sd, 2) * 1.5 + Math.sin(px / 190 + sd) * 0.3, ph = (px * 0.16 + py * 0.99) / (V.small ? 13 : 19) + warp, s = ph - Math.floor(ph);
        var b = s < 0.7 ? 0.5 + 0.34 * (s / 0.7) + (s > 0.62 ? (s - 0.62) * 1.6 : 0) : 0.3 + 0.18 * ((s - 0.7) / 0.3); b += (fs(px / 560, py / 420, sd + 3, 2) - 0.5) * 0.36; Rp[y * RW + x] = clamp(b, 0, 1); }
      for (y = 0; y < gh; y++) for (x = 0; x < gw; x++) K[y * gw + x] = fs(x * cell / 340, y * cell / 26, sd + 5, 4);
      var CR = new Float32Array(gw); for (x = 0; x < gw; x++){ RES[x] = 0.955 - 0.032 * fs(x * cell / 90, 3.3, sd + 8, 2); CR[x] = 0.015 + 0.06 * fs(x * cell / 150, 1.7, sd + 11, 2); }
      V.Rp = Rp; V.RW = RW; V.PAD = PAD; V.K = K; V.RES = V.small ? null : RES; V.CR = V.small ? null : CR;
    }
    V.drawn = -1; return true;
  }
  function thrOf(V){ return V.kind === 'night' ? -0.45 + V.p * 1.62 : V.kind === 'morning' ? -0.3 + V.p * 1.36 : -0.25 + V.p * 1.5; }

  function paint(V){
    var k = V.kind, gw = V.gw, gh = V.gh, P = V.img.data, thr = thrOf(V), x, y, i, o, a;
    if (k === 'night'){
      var D = V.D, DW = V.DW, ox = V.A * (1 + 0.85 * Math.sin(V.t * 0.21 + V.i)), oy = V.p * (V.L - 2), bx = ox | 0, by = oy | 0, fx = ox - bx, fy = oy - by, hx = V.small ? 0.5 : 0.36;
      for (y = 0; y < gh; y++){ var yy = y / gh, env = V.small ? 1 : sm(0, 0.1, yy) * (1 - sm(0.86, 1, yy)), r0 = (y + by) * DW + bx;
        for (x = 0; x < gw; x++){ var j = r0 + x, d = (D[j] + (D[j + 1] - D[j]) * fx) * (1 - fy) + (D[j + DW] + (D[j + DW + 1] - D[j + DW]) * fx) * fy, xx = x / gw;
          var v = d * 0.7 + (1 - yy) * 0.24 - (0.5 - Math.abs(xx - hx)) * 0.22, mo = xx * (1 - yy) * 24;
          a = sm(thr, thr + 0.3, v) * env; o = (y * gw + x) << 2;
          P[o] = 96 + 112 * d + mo; P[o + 1] = 114 + 106 * d + mo; P[o + 2] = 160 + 84 * d + mo * 0.5; P[o + 3] = a * 242; } }
    } else if (k === 'morning'){
      var N = V.N, M = V.M, wet = V.wet, tint = V.small ? 16 : 0, n = gw * gh;
      for (i = 0, o = 0; i < n; i++, o += 4){ var m = M[i], f = sm(thr - 0.03, thr + 0.03, m), q = N[i], al, r, g, b;
        if (f > 0.002){ var e = 1 - Math.abs(m - thr) / 0.045; if (e < 0) e = 0; al = f * (0.64 + q * 0.34); r = 226 + q * 26 - e * 34 - tint; g = 236 + q * 18 - e * 24 - tint * 0.6; b = 246 + q * 9 - e * 10; }
        else { var film = thr - m < 0.1 ? 1 - (thr - m) / 0.1 : 0; al = film * 0.2; r = 226; g = 236; b = 248; }
        al *= 1 - wet[i] * 0.94; P[o] = r; P[o + 1] = g; P[o + 2] = b; P[o + 3] = al * 255; }
    } else {
      var Rp = V.Rp, RW = V.RW, K = V.K, RES = V.RES, CR = V.CR, sh = Math.floor(V.p * V.PAD * 0.85);
      for (y = 0; y < gh; y++){ var yy2 = y / gh, row = y * RW + V.PAD - sh;
        for (x = 0; x < gw; x++){ i = y * gw + x; o = i << 2; var ridge = RES && yy2 > RES[x], key = (x / gw) * 0.78 + K[i] * 0.42 + (ridge ? 3 : 0), t2 = (key - thr) / 0.09;
          if (t2 <= 0 || (CR && yy2 < CR[x])){ P[o + 3] = 0; continue; }
          var b2 = Rp[row + x], al2 = (t2 >= 1 ? 1 : t2 * t2 * (3 - 2 * t2)) * 0.97 * (t2 < 1.6 ? 0.6 + 0.25 * t2 : 1), r2, g2, bb;
          if (CR && (yy2 - CR[x]) * gh < 2.2) b2 = Math.min(1, b2 + 0.22);
          if (b2 < 0.5){ var q1 = b2 / 0.5; r2 = 108 + 88 * q1; g2 = 50 + 66 * q1; bb = 26 + 40 * q1; } else { var q2 = (b2 - 0.5) / 0.5; r2 = 196 + 46 * q2; g2 = 116 + 64 * q2; bb = 66 + 50 * q2; }
          if (ridge && (yy2 - RES[x]) * gh < 1.5){ r2 *= 0.8; g2 *= 0.78; bb *= 0.76; }
          P[o] = r2; P[o + 1] = g2; P[o + 2] = bb; P[o + 3] = al2 * 255; } }
    }
    V.lctx.putImageData(V.img, 0, 0);
    var c = V.ctx, w = V.cv.width, h = V.cv.height; c.globalCompositeOperation = 'source-over'; c.clearRect(0, 0, w, h); c.imageSmoothingEnabled = true; c.drawImage(V.low, 0, 0, w, h);
    var tl = tile(k); if (tl){ if (!V.pat) V.pat = c.createPattern(tl, 'repeat'); c.save(); c.globalCompositeOperation = 'source-atop'; c.scale(DPR, DPR); c.fillStyle = V.pat; c.fillRect(0, 0, V.W, V.H); c.restore(); }
    drawParts(V, c);
    if (V.glint >= 0){ var gg = V.glint, gx0 = -0.4 * V.W + gg * 1.8 * V.W; c.save(); c.scale(DPR, DPR); var lg = c.createLinearGradient(gx0, 0, gx0 + V.W * 0.35, V.H * 0.4);
      lg.addColorStop(0, 'rgba(255,255,255,0)'); lg.addColorStop(0.5, 'rgba(255,255,255,' + (0.24 * Math.sin(gg * Math.PI)).toFixed(3) + ')'); lg.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = lg; c.fillRect(0, 0, V.W, V.H); c.restore(); }
  }

  /* ---------- what the world does while it clears: fireflies, meltwater, blown grains ---------- */
  function spawn(V, dp){
    var k = V.kind, R = Math.random, tries, thr = thrOf(V);
    if (k === 'night'){ if (!V.flies && V.p > 0.3){ V.flies = 1; for (var f = V.small ? 1 : 6; f > 0; f--) V.parts.push({ f: 1, x: V.W * (0.12 + R() * 0.76), y: V.H * (0.4 + R() * 0.5), vx: (R() - 0.5) * 14, vy: -6 - R() * 10, ph: R() * 6, age: 0, life: 3.8 + R() * 2.4 }); } return; }
    if (dp <= 0) return;
    if (k === 'morning'){ V.acc += dp * (V.small ? 14 : 60);
      while (V.acc >= 1){ V.acc -= 1; for (tries = 0; tries < 50; tries++){ var gx = (R() * V.gw) | 0, gy = (R() * V.gh * 0.85) | 0; if (Math.abs(V.M[gy * V.gw + gx] - thr) < 0.03){
        V.parts.push({ d: 1, x: (gx + 0.5) * V.cell, y: (gy + 0.5) * V.cell, r: (V.small ? 1.6 : 2.2) + R() * (V.small ? 1.4 : 2.6), vy: 0, stick: R() * 0.4, age: 0, life: 3 + R() * 2 }); break; } } } return; }
    var cap = V.small ? 60 : 280; if (V.parts.length > cap) return;
    for (tries = V.small ? 30 : 220; tries > 0; tries--){ var sx = (R() * V.gw) | 0, sy = (R() * V.gh) | 0, t2 = ((sx / V.gw) * 0.78 + V.K[sy * V.gw + sx] * 0.42 - thr) / 0.09;
      if (t2 > 0 && t2 < 0.5 && (!V.RES || sy / V.gh <= V.RES[sx])){ V.parts.push({ s: 1, x: (sx + 0.5) * V.cell, y: (sy + 0.5) * V.cell, vx: (V.small ? 50 : 140) + R() * (V.small ? 110 : 320), vy: -20 - R() * 50, age: 0, life: 0.45 + R() * 0.8 }); if (V.parts.length > cap) break; } }
  }
  function wetLine(V, x, y0, y1, r){ var c = V.cell, gw = V.gw, gh = V.gh, gx = Math.round(x / c), rr = Math.max(1, Math.round(r * 0.7 / c)), a = Math.max(0, Math.floor(Math.min(y0, y1) / c)), b = Math.min(gh - 1, Math.ceil(Math.max(y0, y1) / c));
    for (var gy = a; gy <= b; gy++) for (var dx = -rr; dx <= rr; dx++){ var xx = gx + dx; if (xx >= 0 && xx < gw) V.wet[gy * gw + xx] = 1; } }
  function stepParts(V, dt){
    if (!V.parts.length) return; var out = [];
    for (var i = 0; i < V.parts.length; i++){ var q = V.parts[i]; q.age += dt; if (q.age > q.life) continue;
      if (q.f){ q.x += (q.vx + Math.sin(q.age * 1.3 + q.ph) * 9) * dt; q.y += (q.vy + Math.cos(q.age * 0.9 + q.ph) * 5) * dt; }
      else if (q.d){ if (q.stick > 0) q.stick -= dt; else { q.vy = Math.min(q.vy + 110 * dt, 90); if (Math.random() < dt * 0.8) q.stick = 0.1 + Math.random() * 0.3; var y0 = q.y; q.y += q.vy * dt; q.x += Math.sin(q.y * 0.07 + q.r) * 0.25; wetLine(V, q.x, y0, q.y, q.r); }
        if (q.y > V.H + 8) continue; }
      else { q.vx *= 1 - 0.5 * dt; q.vy += 150 * dt; q.x += q.vx * dt; q.y += q.vy * dt; if (q.x > V.W + 20) continue; }
      out.push(q); }
    V.parts = out;
  }
  function drawParts(V, c){
    if (!V.parts.length) return; c.save(); c.scale(DPR, DPR);
    for (var i = 0; i < V.parts.length; i++){ var q = V.parts[i], lf = q.age / q.life, fade = lf < 0.15 ? lf / 0.15 : lf > 0.75 ? (1 - lf) / 0.25 : 1;
      if (q.f){ var al = fade * (0.35 + 0.65 * Math.pow(0.5 + 0.5 * Math.sin(q.age * 3.1 + q.ph), 3)), g = c.createRadialGradient(q.x, q.y, 0, q.x, q.y, 11);
        g.addColorStop(0, 'rgba(236,250,170,' + (al * 0.9).toFixed(3) + ')'); g.addColorStop(0.25, 'rgba(210,240,140,' + (al * 0.35).toFixed(3) + ')'); g.addColorStop(1, 'rgba(210,240,140,0)'); c.fillStyle = g; c.fillRect(q.x - 11, q.y - 11, 22, 22); }
      else if (q.d){ c.globalAlpha = Math.min(1, fade * 1.4); c.beginPath(); c.arc(q.x, q.y, q.r, 0, Math.PI * 2); c.fillStyle = 'rgba(255,255,255,.2)'; c.fill();
        c.lineWidth = 1; c.strokeStyle = 'rgba(66,96,140,.5)'; c.beginPath(); c.arc(q.x, q.y, q.r, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke();
        c.fillStyle = 'rgba(255,255,255,.9)'; c.beginPath(); c.arc(q.x - q.r * 0.35, q.y - q.r * 0.4, Math.max(0.6, q.r * 0.28), 0, Math.PI * 2); c.fill(); c.globalAlpha = 1; }
      else { c.strokeStyle = 'rgba(250,214,160,' + (fade * 0.8).toFixed(3) + ')'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(q.x, q.y); c.lineTo(q.x - q.vx * 0.035, q.y - q.vy * 0.035); c.stroke(); } }
    c.restore();
  }

  /* ---------- progress follows the scroll, smoothly and never backwards while it's on screen ---------- */
  function goal(V, r, vh){ var vis = Math.min(r.bottom, vh) - Math.max(r.top, 0); if (vis <= 0) return -1; var C = Math.min(r.height, vh);
    return clamp((vis - C * (V.small ? 0.16 : 0.1)) / (C * (V.small ? 0.62 : 0.78)) - V.col * 0.14, 0, 1); }
  function reset(V){ V.p = 0; V.lock = false; V.parts = []; V.flies = 0; V.acc = 0; V.started = false; V.finished = false; V.glint = -1; V.off = 0; if (V.wet) V.wet.fill(0);
    if (V.o && window.__odo) window.__odo.zero(V.o); V.rolled = false; V.cv.style.visibility = ''; V.drawn = -1; }
  function events(V){
    var p = V.p;
    if (!V.started && p > 0.02){ V.started = true; var now = performance.now();
      if (now - sndAt > (V.small ? 1600 : 900)){ sndAt = now; var r = V.host.getBoundingClientRect(); S.sfx('clear', { k: V.kind, small: V.small, x: (r.left + r.width / 2) / window.innerWidth }); } }
    if (V.small && !V.rolled && p >= 0.55){ V.rolled = true; if (V.o && window.__odo) window.__odo.roll(V.o, 80); }
    if (p >= 1 && !V.finished){ V.finished = true; if (!V.small){ S.track('chapter_open', { id: V.host.id }); if (V.kind === 'morning') V.glint = 0; } }
  }
  function frame(now){
    raf = 0; if (document.hidden) return;
    var dt = Math.min(0.5, Math.max(0.001, (now - (lastT || now)) / 1000)), vh = window.innerHeight, more = false; lastT = now;
    for (var n = 0; n < veils.length; n++){ var V = veils[n], r = V.host.getBoundingClientRect();
      if (!(r.bottom > -vh * 0.8 && r.top < vh * 1.8)){ if (V.key && V.p > 0) reset(V); continue; }
      build(V); V.t += dt;
      var p0 = V.p, vis = r.bottom > 0 && r.top < vh;
      if (!frozen){ var g = goal(V, r, vh);
        if (g < 0){ V.off += dt; if (V.off > 0.3 && V.p > 0 && (r.bottom < -vh * 0.25 || r.top > vh * 1.1)) reset(V); }
        else { V.off = 0; if (g >= (V.small ? 0.42 : 0.46)) V.lock = true; if (V.lock) g = 1;
          var want = g - V.p; if (want > 0){ var step = Math.max(want * (1 - Math.exp(-dt / 0.24)), Math.min(want, dt * 0.3)); V.p = Math.min(g, V.p + Math.min(step, dt / (V.small ? 0.7 : 1.2))); if (g - V.p < 0.003) V.p = g; } } }
      var dp = V.p - p0; if (dp > 0) events(V);
      if (vis) spawn(V, dp); stepParts(V, dt);
      if (V.glint >= 0){ V.glint += dt / 1.1; if (V.glint > 1) V.glint = -2; }
      var drift = V.kind === 'night' && V.p < 1, need = V.drawn < 0 || dp !== 0 || V.parts.length || V.glint >= 0 || V.glint === -2 || (drift && now - V.idleAt > 60);
      if (need && vis){ paint(V); V.drawn = V.p; V.idleAt = now; if (V.glint === -2) V.glint = -3;
        V.cv.style.visibility = V.p >= 1 && !V.parts.length && V.kind === 'night' ? 'hidden' : ''; }
      if ((vis && (drift || V.parts.length || V.glint >= 0 || (V.lock && V.p < 1))) || (V.lock && V.p < 1)) more = true; }
    if (more) kick();
  }
  function kick(){ if (!raf) raf = requestAnimationFrame(frame); }

  function setup(){
    $$('#experience .xc').forEach(function(cv, i){ add(cv, false, i); });
    $$('#experience .xs-grid').forEach(function(g, gi){ $$('.xs-m', g).forEach(function(m, i){ add(m, true, 10 + gi * 6 + i); }); });
    if (!veils.length) return;
    root.classList.add('vl-on');
    S.onScroll(kick); window.addEventListener('resize', function(){ veils.forEach(function(V){ V.drawn = -1; }); kick(); });
    document.addEventListener('timechange', function(){ veils.forEach(function(V){ V.key = ''; }); kick(); });
    document.addEventListener('visibilitychange', function(){ lastT = 0; kick(); });
    kick();
  }
  S.safe(setup);

  /* test hooks: freeze the automatic reveal and draw any block at any point of it */
  window.__reveal = {
    list: function(){ return veils.map(function(V){ var h = $('h3, h4', V.host); return { id: V.host.id || (h ? h.textContent : ''), small: V.small, p: +V.p.toFixed(3), lock: V.lock, kind: V.kind || '', parts: V.parts.length, rolled: !!V.rolled, col: V.col }; }); },
    freeze: function(on){ frozen = !!on; kick(); },
    at: function(i, p){ var V = veils[i]; if (!V) return false; frozen = true; build(V); V.p = clamp(p, 0, 1); V.cv.style.visibility = ''; paint(V); V.drawn = V.p; return true; },
    kick: kick
  };
})();
