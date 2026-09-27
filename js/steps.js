/* Wave 4 · the journey is footprints now.
   No line and no glow. The prints walk down the page as you climb, pressed into the ground of whichever
   world you're in: boots in Alpine snow, bare feet in Saharan sand, trail shoes in damp Nilgiri earth.
   They stand side by side at every heading, like someone stopping to read, wander out into the open where
   the landscape shows, and walk down to camp at the end, where a second pair comes in to meet yours.
   They never react to the cursor and only rebuild when the page's real geometry changes, so nothing
   else on the page (the bug game, say) can shake them. */
(function(){
  'use strict';
  var S = window.__site; if (!S) return;
  var $ = S.$, $$ = S.$$, reduce = S.reduce, root = document.documentElement, NS = 'http://www.w3.org/2000/svg';
  function theme(){ var t = root.getAttribute('data-time'); return t === 'night' || t === 'morning' ? t : 'dusk'; }
  function clamp(v, a, b){ return v < a ? a : v > b ? b : v; }
  function f1(v){ return (Math.round(v * 10) / 10).toString(); }
  function rng(seed){ var s = seed >>> 0; return function(){ s = (s + 0x6D2B79F5) >>> 0; var t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  /* ---------- the prints, drawn toes up: a rim of pushed-up ground, the hollow, and the tread ---------- */
  var SOLE = {
    morning: 'M-3.7 -2.3C-4.5 -6.4-3.2 -10.7.2 -10.9C3.6 -11.1 4.8 -7.2 4.3 -2.8C4.1 -.5 3.2 1.1 2.4 2L-2.5 2C-3.2 .9-3.5 -.7-3.7 -2.3ZM-2.7 3.9L2.5 3.9C2.9 6.6 2.4 9.2 0 9.6C-2.4 9.4-3 6.7-2.7 3.9Z',
    night: 'M-3.3 -3.2C-3.9 -8.2-2.2 -10.8.4 -10.8C3.1 -10.8 4.3 -8.1 4 -3.7C3.8 -.6 2.7 1.7 2.5 4.5C2.3 7.7 1.4 9.7-.2 9.7C-2 9.7-2.9 7.9-2.9 4.7C-2.9 1.7-3 -.5-3.3 -3.2Z',
    dusk: 'M-2.8 -3.1C-3.6 -7.1-2.1 -9.4.6 -9.3C3.2 -9.2 4 -6.7 3.6 -3.1C3.3 0 2.3 1.9 2.3 4.5C2.3 7.3 1.2 9.3-.4 9.3C-2.2 9.3-2.9 7.3-2.7 4.7C-2.5 1.8-2.2 0-2.8 -3.1Z'
  };
  var TREAD = {
    morning: '<path class="pf-l" d="M-2.6 -8.2H2.8M-3.2 -5.6H3.5M-3.3 -3H3.5M-2.1 5.6H2M-2 7.7H1.8"/>',
    night: '<path class="pf-l" d="M-2.6 -7.2Q0 -8.4 2.9 -7.2M-3 -4.2Q.3 -5.4 3.5 -4.2M-2.6 5.4Q0 4.6 2.2 5.4"/>',
    dusk: '<g class="pf-t"><circle cx="2.3" cy="-11.6" r="1.45"/><circle cx=".2" cy="-12.2" r="1"/><circle cx="-1.35" cy="-11.8" r=".88"/><circle cx="-2.6" cy="-10.9" r=".78"/><circle cx="-3.4" cy="-9.6" r=".68"/></g>'
  };
  var DEFS = '';
  ['morning', 'night', 'dusk'].forEach(function(t){ DEFS += '<symbol id="pf-' + t + '" overflow="visible"><g class="pf pf-' + t + '"><path class="pf-r" transform="translate(.55 .85)" d="' + SOLE[t] + '"/>' +
    (t === 'dusk' ? '<g class="pf-r" transform="translate(.5 .7)"><circle cx="2.3" cy="-11.6" r="1.45"/><circle cx=".2" cy="-12.2" r="1"/><circle cx="-1.35" cy="-11.8" r=".88"/><circle cx="-2.6" cy="-10.9" r=".78"/><circle cx="-3.4" cy="-9.6" r=".68"/></g>' : '') +
    '<path class="pf-d" d="' + SOLE[t] + '"/>' + TREAD[t] + '</g></symbol>'; });

  var lay = document.createElement('div'); lay.className = 'steps'; lay.setAttribute('aria-hidden', 'true');
  lay.innerHTML = '<svg class="st-defs" width="0" height="0" focusable="false"><defs>' + DEFS + '</defs></svg>';
  /* the layer lives inside main and is clipped to it, so it can never make the page taller than its content */
  var mainEl = $('main') || document.body; mainEl.appendChild(lay); var OY = 0;
  var note = document.createElement('p'); note.className = 'st-note'; note.textContent = 'This is where our paths meet.'; lay.appendChild(note);

  var PR = [], N = 0, CMY = null, chunks = [], his = [], built = false, mob = false, W0 = 0, H0 = 0, wF = -1, shown = -1, target = -1, raf = 0, lastT = 0;
  var builds = 0, started = reduce, startT = 0, met = false, meetT = 0, hisShown = 0, sig = '', lastFreshT = 0;

  /* ---------- geometry ---------- */
  function R(el){ var b = el.getBoundingClientRect(), y = window.pageYOffset, x = window.pageXOffset; return { l: b.left + x, t: b.top + y, r: b.right + x, b: b.bottom + y, w: b.width, h: b.height }; }
  /* resting positions, ignoring reveal slides and scroll lean */
  function RR(el){ var t = 0, l = 0, e = el; while (e){ t += e.offsetTop || 0; l += e.offsetLeft || 0; e = e.offsetParent; } var w = el.offsetWidth, h = el.offsetHeight; if (!w && !h) return R(el); return { l: l, t: t, r: l + w, b: t + h, w: w, h: h }; }
  var OBS = 'h1, h2, h3, h4, .s-k, .s-sub, .story p, .lead, .future, .btn, .btn-cv, .chip, .mk-card, .cs-row, .xc-in, .xs-m, .xs-lead, .xs-left, .xs-all, .tool-copy, .tool-vis, .pl-scene, .pl-side, .oc-card, .ld-block, .rh-card, .gopuram, .env-stage, .env-cap, .h-peek, .h-role, .h-seek, .h-proof, .h-cta, .an, .sm-made, .reg, .edu-row, .cs-rows, .vs-c, .xp-end, .fine, .alt-big, .summit p';
  var BAND = 240, bands = {};
  function obstacles(){
    bands = {}; var all = $$(OBS);
    all.forEach(function(el){ if (el.closest('dialog, .steps, .hdr, .alt, .trail-sheet')) return; var r = RR(el); if (r.w < 2 || r.h < 2) return;
      var s = 7, o = { l: r.l - s, t: r.t - s, r: r.r + s, b: r.b + s };
      for (var k = Math.floor(o.t / BAND); k <= Math.floor(o.b / BAND); k++) (bands[k] || (bands[k] = [])).push(o); });
  }
  function hit(x, y, rad){ var k = Math.floor(y / BAND), a = bands[k]; if (a) for (var i = 0; i < a.length; i++){ var o = a[i]; if (x + rad > o.l && x - rad < o.r && y + rad > o.t && y - rad < o.b) return true; }
    var k2 = Math.floor((y + rad) / BAND), k3 = Math.floor((y - rad) / BAND); if (k2 !== k && bands[k2]) { a = bands[k2]; for (i = 0; i < a.length; i++){ o = a[i]; if (x + rad > o.l && x - rad < o.r && y + rad > o.t && y - rad < o.b) return true; } }
    if (k3 !== k && bands[k3]) { a = bands[k3]; for (i = 0; i < a.length; i++){ o = a[i]; if (x + rad > o.l && x - rad < o.r && y + rad > o.t && y - rad < o.b) return true; } }
    return false; }

  /* catmull-rom through the waypoints, sampled every px by arc length */
  function spline(pts){ var out = [];
    for (var i = 0; i < pts.length - 1; i++){ var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      var c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6, c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
      var n = Math.max(2, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / 3));
      for (var k = (i ? 1 : 0); k <= n; k++){ var t = k / n, m = 1 - t; out.push([m * m * m * p1[0] + 3 * m * m * t * c1x + 3 * m * t * t * c2x + t * t * t * p2[0], m * m * m * p1[1] + 3 * m * m * t * c1y + 3 * m * t * t * c2y + t * t * t * p2[1]]); } }
    return out; }
  /* ang: 0 = toes up, 90 = right, 180 = down, 270 = left */
  function dirOf(a){ var r = a * Math.PI / 180; return [Math.sin(r), -Math.cos(r)]; }
  function walk(list, pts, stride, seed, gapA, gapB){
    var P = spline(pts), rnd = rng(seed), acc = stride - (gapA || 0), foot = list.__foot || 1, lenAll = 0, i;
    for (i = 1; i < P.length; i++) lenAll += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]);
    var endAt = lenAll - (gapB || 0), s = 0;
    for (i = 1; i < P.length; i++){ var dx = P[i][0] - P[i - 1][0], dy = P[i][1] - P[i - 1][1], d = Math.hypot(dx, dy); s += d; acc += d; if (s > endAt) break;
      if (acc >= stride){ acc -= stride; var ux = dx / (d || 1), uy = dy / (d || 1), ang = Math.atan2(ux, -uy) * 180 / Math.PI + (rnd() - 0.5) * 9, off = 4.3 + rnd() * 0.8;
        var x = P[i][0] + foot * off * uy + (rnd() - 0.5) * 1.2, y = P[i][1] - foot * off * ux + (rnd() - 0.5) * 1.2;
        list.push({ x: x, y: y, a: ang, f: foot, k: 'w' }); foot = -foot; } }
    list.__foot = foot; }
  function stand(list, x, y, face, tag){ var d = dirOf(face), lx = d[1], ly = -d[0];
    list.push({ x: x + lx * 5.2, y: y + ly * 5.2, a: face - 3, f: 1, k: 's', tag: tag });
    list.push({ x: x - lx * 5.2 + d[0] * 1.6, y: y - ly * 5.2 + d[1] * 1.6, a: face + 4, f: -1, k: 's', tag: tag }); list.__foot = 1; }

  function anchor(sec){ return $('.s-h', sec) || $('h2', sec) || $('.story .lead', sec) || $('.s-k', sec); }
  function build(){
    var W = document.documentElement.clientWidth, H = document.documentElement.scrollHeight, vh = window.innerHeight;
    var wrapW = Math.min(1160, W - 48), gut = (W - wrapW) / 2; mob = gut < 56 || W < 900;
    OY = mainEl.getBoundingClientRect().top + window.pageYOffset; W0 = W; H0 = H;
    obstacles();
    var list = [], secs = $$('main > section'), LX = Math.round(gut * 0.52), stride = mob ? 21 : 27, seed = 7;
    var hero = secs[0], hi = hero && ($('.h-hi', hero) || $('.h-name', hero)), name = hero && $('.h-name', hero);
    function vistaAfter(sec){ var n = sec.nextElementSibling; return n && n.classList.contains('vista') ? n : null; }
    if (!mob){
      /* you arrive beside my name, then walk down the margin */
      var nr = name ? RR(name) : { t: vh * 0.3, h: 160, b: vh * 0.5 }, y0 = nr.t + Math.min(nr.h, 220) * 0.42, cur = [LX, y0];
      stand(list, LX + 2, y0, 90, 'top');
      secs.slice(1).forEach(function(sec, si){
        var r = RR(sec), pad = parseFloat(getComputedStyle(sec).paddingTop) || 90, last = sec.id === 'contact', a = anchor(sec), ar = a ? RR(a) : { t: r.t + pad, h: 60, l: gut, r: gut + 300 };
        var prev = sec.previousElementSibling, vis = prev && prev.classList.contains('vista') ? RR(prev) : null, pts = [cur];
        if (sec.id === 'summit'){
          /* the top: out to the middle, facing the view */
          var sy = ar.t - 56, cx = W / 2;
          pts.push([cur[0] + 20, cur[1] + (sy - cur[1]) * 0.35]); pts.push([cx - (cx - LX) * 0.55, sy - 26]); pts.push([cx - 34, sy - 4]);
          walk(list, pts, stride, seed++, 8, 18); stand(list, cx, sy, 180, 'summit');
          cur = [cx - 24, sy + 10]; pts = [cur, [cx - (cx - LX) * 0.6, sy + 52], [LX + 16, sy + 150], [LX, Math.min(r.b - pad * 0.5, sy + 320)]];
          walk(list, pts, stride + 4, seed++, 16, 0); cur = pts[pts.length - 1]; return; }
        var sx = LX + 2, sy2 = ar.t + Math.min(ar.h, 66) * 0.46;
        if (vis){ var wx = Math.min(W * 0.32, gut + wrapW * 0.24); pts.push([LX + 26, vis.t + vis.h * 0.12]); pts.push([wx, vis.t + vis.h * 0.46]); pts.push([LX + 40, vis.b - 30]); }
        else pts.push([LX + (si % 2 ? 16 : -12), cur[1] + (sy2 - cur[1]) * 0.55]);
        pts.push([sx, sy2 - 24]);
        walk(list, pts, stride, seed++, 12, 16); stand(list, sx, sy2, 90, sec.id);
        cur = [LX, sy2 + 16];
        var bottom = r.b - pad * (last ? 0.2 : 0.45), steps = Math.max(1, Math.round((bottom - cur[1]) / 260)); pts = [cur];
        if (!last){ for (var k = 1; k <= steps; k++) pts.push([LX + (k % 2 ? -9 : 9) * (gut > 110 ? 1.4 : 1), cur[1] + (bottom - cur[1]) * k / steps]); walk(list, pts, stride + (r.t > (RR($('#summit') || sec).t) ? 4 : 0), seed++, 14, 0); cur = pts[pts.length - 1]; return; }
        /* camp: down past the buttons, then along the bottom to where we meet */
        var fine = $('.fine', sec), fr = fine ? RR(fine) : { b: r.b - 90 }, ym = Math.min(H - 40, fr.b + 74), xm = gut + wrapW * 0.6;
        pts.push([LX, ym - 70]); pts.push([LX + 40, ym - 6]); pts.push([xm - 70, ym + 2]); pts.push([xm - 24, ym]);
        walk(list, pts, stride, seed++, 14, 30); stand(list, xm - 22, ym, 90, 'meet');
        meetAt(xm, ym, W, gut, false);
      });
    } else {
      /* phones and narrow screens: the prints only cross the open ground between sections */
      var hr = hi ? RR(hi) : { l: 20, t: 150 }, cur2;
      stand(list, Math.max(22, hr.l + 16), Math.max(90, hr.t - 22), 180, 'top');
      secs.forEach(function(sec, si){
        if (!si) return; var a = $('.s-k', sec) || anchor(sec); if (!a) return; var ar = RR(a), prev = sec.previousElementSibling, pr = prev ? RR(prev) : null;
        var isV = prev && prev.classList.contains('vista'), ppad = prev && !isV ? (parseFloat(getComputedStyle(prev).paddingBottom) || 60) : 60, top = isV ? pr.t + 18 : pr ? pr.b - ppad * 0.8 : ar.t - 120, last = sec.id === 'contact';
        if (sec.id === 'summit'){ var hs = $('h2', sec), hr2 = hs ? RR(hs) : ar, cy = hr2.t - 64; cur2 = [W * (si % 2 ? 0.2 : 0.8), top];
          walk(list, [cur2, [W * 0.5 + (si % 2 ? -40 : 40), (top + cy) / 2], [W / 2, cy - 18]], stride, seed++, 4, 16); stand(list, W / 2, cy, 180, 'summit'); return; }
        var txt = a.textContent || '', lw = Math.min(ar.w, txt.length * 7.6 + 6), sx = Math.min(W - 26, ar.l + lw + 26), syy = ar.t + ar.h / 2;
        cur2 = [W * (si % 2 ? 0.16 : 0.84), top]; var midY = (top + syy) / 2;
        walk(list, [cur2, [W * (si % 2 ? 0.34 : 0.7), midY], [sx + 22, syy - 10]], stride, seed++, 4, 14); stand(list, sx, syy, 270, sec.id);
        if (last){ var fine2 = $('.fine', sec), f2 = fine2 ? RR(fine2) : { b: RR(sec).b - 60 }, ym2 = Math.min(H - 40, f2.b + 62), xm2 = W / 2;
          walk(list, [[8, ym2 - 30], [W * 0.2, ym2 - 6], [xm2 - 20, ym2]], stride, seed++, 2, 26); stand(list, xm2 - 19, ym2, 90, 'meet'); meetAt(xm2, ym2, W, 0, true); }
      });
    }
    /* anything that would sit on content is left out, like ground too hard to take a print */
    PR = list.filter(function(p){ if (p.x < 8 || p.x > W - 8 || p.y < 8 || p.y > H - 8) return false; return p.k === 's' || !hit(p.x, p.y, 9); });
    N = PR.length; CMY = new Float32Array(N); for (var i = 0; i < N; i++) CMY[i] = i ? Math.max(CMY[i - 1], PR[i].y) : PR[i].y;
    render(); built = true; builds++;
  }
  function meetAt(xm, ym, W, gut, m){ his = []; var from = [W + 26, ym - (m ? 30 : 46)], pts = m ? [from, [W * 0.8, ym - 8], [xm + 20, ym]] : [from, [W - gut * 0.4, ym - 34], [xm + 80, ym - 2], [xm + 24, ym]];
    his.__foot = -1; walk(his, pts, m ? 22 : 31, 99, 10, m ? 26 : 30); stand(his, xm + (m ? 19 : 22), ym, 270, 'him');
    note.style.left = f1(xm) + 'px'; note.style.top = f1(ym - (m ? 16 : 18) - OY) + 'px'; }

  /* ---------- drawing: one small svg per stretch of the page, so a new print only repaints its stretch ---------- */
  function mk(t){ return document.createElementNS(NS, t); }
  function render(){
    chunks.forEach(function(c){ if (c.svg.parentNode) c.svg.parentNode.removeChild(c.svg); }); chunks = [];
    var all = PR.concat(his.map(function(p){ p.him = true; return p; })), sym = '#pf-' + theme(), CH = 1400;
    all.forEach(function(p){ var ci = Math.floor(p.y / CH), c = chunks[ci];
      if (!c){ c = chunks[ci] = { svg: mk('svg'), top: ci * CH }; c.svg.setAttribute('class', 'st-c'); c.svg.setAttribute('width', W0); c.svg.setAttribute('height', CH + 40);
        c.svg.setAttribute('viewBox', '0 ' + (ci * CH - 20) + ' ' + W0 + ' ' + (CH + 40)); c.svg.style.top = (ci * CH - 20 - OY) + 'px'; lay.appendChild(c.svg); }
      var g = mk('g'); g.setAttribute('transform', 'translate(' + f1(p.x) + ' ' + f1(p.y) + ') rotate(' + Math.round(p.a) + ')' + (p.f < 0 ? ' scale(-1 1)' : '') + (mob ? ' scale(.86)' : '') + (p.him ? ' scale(1.08)' : ''));
      var u = mk('use'); u.setAttribute('href', sym); u.setAttribute('class', 'stp' + (p.k === 's' ? ' st-s' : '') + (p.him ? ' st-him' : '')); g.appendChild(u); c.svg.appendChild(g); p.el = u; p.g = g; });
    chunks = chunks.filter(Boolean);
    shown = -1; hisShown = 0; met = false; root.classList.remove('trail-done'); note.classList.remove('on');
    lay.classList.add('inst'); sync(Math.floor(wF), true); requestAnimationFrame(function(){ requestAnimationFrame(function(){ lay.classList.remove('inst'); }); });
  }

  /* ---------- walking: the prints follow the scroll, a little below the middle of the screen ---------- */
  function targetIdx(){ if (!N) return -1; var y = window.pageYOffset, vh = window.innerHeight, max = document.documentElement.scrollHeight - vh; if (y >= max - 6) return N - 1;
    var rest = max - y, near = rest < vh * 0.6 ? 1 - rest / (vh * 0.6) : 0, ty = y + vh * (0.64 + 0.36 * near), lo = 0, hi = N - 1;
    if (CMY[hi] <= ty) return hi; if (CMY[0] > ty) return -1; while (hi - lo > 1){ var m = (lo + hi) >> 1; if (CMY[m] <= ty) lo = m; else hi = m; } return lo; }
  function firstAt(y){ if (!N) return 0; var lo = 0, hi = N - 1; if (CMY[0] >= y) return 0; if (CMY[hi] < y) return hi; while (hi - lo > 1){ var m = (lo + hi) >> 1; if (CMY[m] < y) lo = m; else hi = m; } return hi; }
  function onScreen(p){ var y = p.y - window.pageYOffset; return y > -30 && y < window.innerHeight + 30; }
  function sync(n, inst){
    if (n === shown) return;
    var fresh = !inst && !reduce && Math.abs(n - shown) <= 3 && performance.now() - lastFreshT > 60;
    if (n > shown){ for (var i = Math.max(0, shown + 1); i <= n && i < N; i++){ var p = PR[i]; p.el.classList.add('on'); if (fresh && onScreen(p)) { puff(p); lastFreshT = performance.now(); } } }
    else { for (var j = Math.min(N - 1, shown); j > n && j >= 0; j--) PR[j].el.classList.remove('on', 'old'); }
    var old = n - 22; for (var k = Math.max(0, Math.min(shown, n) - 26); k <= n && k < N; k++){ if (k >= 0) PR[k].el.classList.toggle('old', k < old); }
    shown = n;
    var done = N > 0 && n >= N - 1; if (done !== met){ met = done; meetT = performance.now(); if (!done) leaveMeet(); kick(); }
  }
  function frame(now){
    raf = 0; if (!built) return;
    var dt = Math.min(0.25, Math.max(0.008, (now - (lastT || now)) / 1000)); lastT = now;
    target = started ? targetIdx() : -1;
    /* a long jump (the nav, the cable car): everything well above the screen is simply there already, and only the stretch you can see is walked */
    if (target - wF > 30){ var yTop = window.pageYOffset - window.innerHeight * 0.25, j = firstAt(yTop) - 8; if (j > wF) wF = j; }
    else if (wF - target > 30){ var yBot = window.pageYOffset + window.innerHeight * 1.25, j2 = firstAt(yBot) + 8; if (j2 < wF) wF = Math.max(target, j2); }
    var diff = target - wF, moving = false;
    if (Math.abs(diff) > 0.01){ var cap = now - startT < 2600 && Math.abs(diff) < 26 ? 15 : 170, sp = reduce ? 1e6 : clamp(Math.abs(diff) * 6, 10, cap) * dt; wF += clamp(diff, -sp, sp); if (Math.abs(target - wF) < 0.02) wF = target; moving = true; }
    sync(Math.floor(wF + 0.0001), false);
    if (met){ var el2 = now - meetT, want = reduce ? his.length : clamp(Math.floor((el2 - 380) / 118), 0, his.length);
      if (want > hisShown){ for (var h = hisShown; h < want; h++){ his[h].el.classList.add('on'); if (!reduce && onScreen(his[h])) puff(his[h]); } hisShown = want;
        if (hisShown === his.length) arrived(); }
      if (hisShown < his.length) moving = true; }
    if (moving) kick();
  }
  function kick(){ if (!raf) raf = requestAnimationFrame(frame); }
  function arrived(){ note.classList.add('on'); root.classList.add('trail-done');
    $$('#contact .row .btn').forEach(function(b, i){ b.classList.remove('hi'); void b.offsetWidth; b.style.setProperty('--hd', (0.18 + i * 0.08) + 's'); b.classList.add('hi'); });
    S.track('camp_reached'); }
  function leaveMeet(){ for (var h = his.length - 1; h >= 0; h--) his[h].el.classList.remove('on'); hisShown = 0; note.classList.remove('on'); root.classList.remove('trail-done'); }

  /* ---------- the ground answers: a puff of snow, a spill of sand, a glint of dew ---------- */
  var fxN = 0;
  function puff(p){ if (fxN > 6) return; var t = theme(), g = mk('g'), c = p.g.parentNode; if (!c) return; fxN++;
    g.setAttribute('class', 'st-fx st-fx-' + t); g.setAttribute('transform', 'translate(' + f1(p.x) + ' ' + f1(p.y) + ')');
    for (var i = 0; i < 4; i++){ var d = mk('circle'), a = Math.random() * Math.PI * 2, r = 6 + Math.random() * 7; d.setAttribute('r', (0.6 + Math.random() * 0.8).toFixed(2));
      d.style.setProperty('--dx', f1(Math.cos(a) * r) + 'px'); d.style.setProperty('--dy', f1(Math.sin(a) * r * (t === 'dusk' ? 0.5 : 1) - (t === 'morning' ? 2 : 0)) + 'px'); d.style.animationDelay = (i * 25) + 'ms'; g.appendChild(d); }
    c.appendChild(g); setTimeout(function(){ if (g.parentNode) g.parentNode.removeChild(g); fxN--; }, 900); }
  /* now and then, while you read: a firefly lifts off a print at night, a crystal glints in the morning, a breath of wind crosses the sand at dusk */
  function ambient(){
    if (reduce || document.hidden || !built || root.classList.contains('dlg-open')) return;
    var vis = []; for (var i = Math.max(0, shown - 40); i <= shown; i++){ var p = PR[i]; if (p && onScreen(p) && p.y - window.pageYOffset > 90) vis.push(p); }
    if (!vis.length) return; var q = vis[(Math.random() * vis.length) | 0], t = theme(), el = document.createElement('i');
    el.className = 'st-amb st-amb-' + t; el.style.left = f1(q.x) + 'px'; el.style.top = f1(q.y - OY) + 'px'; lay.appendChild(el); setTimeout(function(){ if (el.parentNode) el.parentNode.removeChild(el); }, 3400); }
  setInterval(ambient, 4200);

  /* ---------- the idle shuffle: stand still long enough and the newest pair shifts its weight ---------- */
  function lastPrint(){ return shown >= 0 && PR[shown] ? PR[shown] : null; }
  function shuffle(){ var p = lastPrint(); if (!p) return false; var q = PR[shown - 1] && PR[shown - 1].k === p.k ? PR[shown - 1] : null;
    [q, p].forEach(function(z, i){ if (!z) return; z.el.classList.remove('shuf'); void z.el.getBoundingClientRect(); setTimeout(function(){ z.el.classList.add('shuf'); }, i * 220); });
    setTimeout(function(){ [p, q].forEach(function(z){ if (z) z.el.classList.remove('shuf'); }); }, 1300); return true; }

  /* ---------- the same shape the old trail offered, so the idle moments and QA mode keep working ---------- */
  window.__trail = {
    tip: function(){ var p = lastPrint(); return p ? { x: p.x, y: p.y, vis: true, done: met, i: shown } : { x: 0, y: 0, vis: false, done: false, i: -1 }; },
    mobile: function(){ return mob; }, size: function(){ return N; }, drawn: function(){ return 0; }, at: function(){ return null; },
    perch: function(){}, pluck: function(){}, tap: shuffle, kick: kick,
    prints: function(){ return PR.map(function(p){ return { x: p.x, y: p.y, a: p.a, k: p.k, on: p.el.classList.contains('on') }; }); },
    meet: function(){ return { met: met, his: hisShown, of: his.length }; }, builds: function(){ return builds; }
  };


  /* ---------- the vistas: open ground between chapters, with a trail sign saying where you are ---------- */
  var VT = {
    valley: { night: 'Past the tea gardens. The shola starts here.', morning: 'Out of the larches above Chamonix.', dusk: 'The last dunes before the rock.' },
    treeline: { night: 'Mist in every valley. The moon’s on the ridge.', morning: 'Above the tree line. The glacier’s ahead.', dusk: 'Old lava and older wind. The Tibesti.' },
    camp: { night: 'Camp’s below. The fire’s going.', morning: 'The hut’s in sight. Soup’s on.', dusk: 'The oasis. Tents up, fire lit.' }
  };
  function vistas(){ var max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight), t = theme();
    $$('.vista').forEach(function(v){ var k = v.id.replace('vista-', ''), r = RR(v), pr = clamp((r.t + r.h / 2 - window.innerHeight / 2) / max, 0, 1), m = $('.vs-m', v), tx = $('.vs-t', v);
      if (m && S.altitude) m.textContent = Math.round(S.altitude(pr)).toLocaleString('en-US') + ' m'; if (tx && VT[k]) tx.textContent = VT[k][t]; }); }
  $$('.vista').forEach(function(v){ S.onView(v, function(){ v.classList.add('in'); }, 0.3); });
  document.addEventListener('timechange', vistas);

  function setTheme(){ var sym = '#pf-' + theme(); lay.setAttribute('data-t', theme()); PR.forEach(function(p){ p.el.setAttribute('href', sym); }); his.forEach(function(p){ p.el.setAttribute('href', sym); }); }
  document.addEventListener('timechange', setTheme); lay.setAttribute('data-t', theme());
  S.onScroll(kick);
  function land(){ if (started) return; started = true; startT = performance.now(); kick(); }
  document.addEventListener('intro:landed', function(){ setTimeout(land, 350); }); setTimeout(land, 3600);

  /* rebuild only when the page's real geometry changes */
  function signature(){ var t = document.documentElement.clientWidth + ':' + document.documentElement.scrollHeight; $$('main > section, main > .vista').forEach(function(s){ t += '|' + s.offsetTop + ',' + s.offsetHeight; }); return t; }
  var rt = 0; function later(ms){ clearTimeout(rt); rt = setTimeout(function(){ var s2 = signature(); if (s2 === sig && built) return; sig = s2; build(); setTheme(); vistas(); }, ms == null ? 220 : ms); }
  window.addEventListener('resize', function(){ later(); }); window.addEventListener('load', function(){ later(60); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ later(); });
  if ('ResizeObserver' in window) new ResizeObserver(function(){ later(320); }).observe(document.body);
  setInterval(function(){ if (signature() !== sig) later(0); }, 2500);
  later(0);
})();
