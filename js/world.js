/* The climb: three landscapes behind the page.
   Night   = the Nilgiris, the Blue Mountains near home: shola forest in the folds,
             grassland on the tops, valley mist, fireflies, owls, sambar deer, elephants.
   Morning = the Alps: sharp ridges, snow and glacier ice, pines, ibex, eagles over the peak.
   Dusk    = the Sahara: red rock mesas that give way to a sea of dunes, a camel caravan, an oasis.
   Scrolling climbs: up the valley, through the cloud layers, over the summit at the
   Summit section, then down the far side to a camp that sits beside the last section.
   Switching theme is a world event: the old sun or moon sets, the new one rises, and
   the land changes in a wave that sweeps out from where you stand.
   If WebGL is unavailable, the page uses the painted fallback in the CSS instead. */
(function(){
  'use strict';
  var root = document.documentElement, canvas = document.getElementById('world');
  var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var small = Math.min(window.innerWidth, window.innerHeight) < 720;
  var conn = navigator.connection || {};
  if (!canvas || typeof THREE === 'undefined' || conn.saveData){ root.classList.add('no-3d'); return; }
  var renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false, powerPreference: 'high-performance' }); }
  catch (e){ root.classList.add('no-3d'); return; }

  /* ---------- small helpers ---------- */
  function clamp(v, a, b){ return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t){ return a + (b - a) * t; }
  function sstep(a, b, t){ t = clamp((t - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
  function ease(t){ return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  function rng(seed){ return function(){ seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  var perm = new Uint8Array(512);
  (function(){ var p = [], s = 20171, i, j, t; for (i = 0; i < 256; i++) p[i] = i;
    for (i = 255; i > 0; i--){ s = (s * 16807) % 2147483647; j = s % (i + 1); t = p[i]; p[i] = p[j]; p[j] = t; }
    for (i = 0; i < 512; i++) perm[i] = p[i & 255]; })();
  function fade(t){ return t * t * t * (t * (t * 6 - 15) + 10); }
  function grad(h, x, y){ switch (h & 7){ case 0: return x + y; case 1: return -x + y; case 2: return x - y; case 3: return -x - y; case 4: return x; case 5: return -x; case 6: return y; default: return -y; } }
  function noise(x, y){
    var X = Math.floor(x) & 255, Y = Math.floor(y) & 255; x -= Math.floor(x); y -= Math.floor(y);
    var u = fade(x), v = fade(y), a = perm[X] + Y, b = perm[X + 1] + Y;
    return lerp(lerp(grad(perm[a], x, y), grad(perm[b], x - 1, y), u), lerp(grad(perm[a + 1], x, y - 1), grad(perm[b + 1], x - 1, y - 1), u), v);
  }
  function fbm(x, y, oct){ var s = 0, a = 0.5, f = 1, n = 0; for (var o = 0; o < oct; o++){ s += noise(x * f, y * f) * a; n += a; a *= 0.5; f *= 2.02; } return s / n; }
  function ridged(x, y, oct){ var s = 0, a = 1, f = 1, n = 0; for (var o = 0; o < oct; o++){ var v = 1 - Math.abs(noise(x * f, y * f)); s += v * v * a; n += a; a *= 0.5; f *= 2.03; } return s / n; }
  function gauss(x, z, cx, cz, r){ var dx = x - cx, dz = z - cz; return Math.exp(-(dx * dx + dz * dz) / (2 * r * r)); }
  function col(h){ return new THREE.Color(h); }
  function canvasTex(w, h, draw){ var cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); var t = new THREE.CanvasTexture(cv); t.minFilter = THREE.LinearFilter; return t; }

  /* ---------- the route: 13 points, the summit is the middle one (u = 0.5) ---------- */
  var ZP = -1750, CAMP = { x: 0, z: -3760 };
  var PATH = [[0, 600, 24], [-38, 260, 28], [52, -120, 34], [-64, -500, 42], [74, -900, 54], [22, -1330, 56], [0, ZP + 70, 44],
              [-24, -2050, 56], [56, -2420, 52], [-44, -2820, 42], [26, -3200, 32], [-8, -3460, 26], [0, -3610, 22]];
  function pathAt(u){ var n = PATH.length - 1, f = clamp(u, 0, 1) * n, i = Math.min(n - 1, Math.floor(f)), t = f - i;
    var p0 = PATH[Math.max(0, i - 1)], p1 = PATH[i], p2 = PATH[i + 1], p3 = PATH[Math.min(n, i + 2)], out = [0, 0, 0];
    for (var k = 0; k < 3; k++) out[k] = 0.5 * ((2 * p1[k]) + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t * t + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t * t * t);
    return out; }
  var PX = []; for (var q = 0; q <= 480; q++){ var pp0 = pathAt(q / 480); PX.push([pp0[1], pp0[0]]); }
  function pathXAt(z){ if (z >= PX[0][0]) return PX[0][1]; if (z <= PX[PX.length - 1][0]) return PX[PX.length - 1][1];
    var lo = 0, hi = PX.length - 1; while (hi - lo > 1){ var m = (lo + hi) >> 1; if (PX[m][0] >= z) lo = m; else hi = m; }
    var a = PX[lo], b = PX[hi]; return lerp(a[1], b[1], (a[0] - z) / (a[0] - b[0] || 1)); }
  function carve(x, z, depth, wide){ var dx = x - pathXAt(z), w = wide || 190;
    var along = Math.min(1, sstep(ZP + 160, ZP + 720, z) + (1 - sstep(ZP - 1100, ZP - 260, z)));
    return 1 - depth * Math.exp(-dx * dx / (2 * w * w)) * along; }
  function terrace(h, step, sharp){ var t = h / step, f = t - Math.floor(t); return (Math.floor(t) + sstep(0.5 - sharp, 0.5 + sharp, f)) * step; }

  /* ---------- three landscapes on the same ground plan ---------- */
  var HF = {
    night: function(x, z){
      var roll = fbm(x * 0.0021 + 3.1, z * 0.0021 - 1.7, 5) * 0.5 + 0.5, rid = ridged(x * 0.0016 + 8.3, z * 0.0016 + 2.9, 4);
      var h = 34 + roll * 150 + rid * 80;
      h += 300 * gauss(x, z, 0, ZP, 290) + 170 * gauss(x, z, -640, ZP + 380, 280) + 200 * gauss(x, z, 680, ZP + 240, 300)
         + 130 * gauss(x, z, -480, ZP - 640, 260) + 160 * gauss(x, z, 560, ZP - 760, 280) + 110 * gauss(x, z, -920, 200, 320) + 130 * gauss(x, z, 960, -300, 340)
         + 90 * gauss(x, z, -700, -2900, 300) + 100 * gauss(x, z, 720, -3200, 320);
      h += 260 * sstep(-3950, -5700, z) * (0.55 + 0.45 * rid);
      h *= carve(x, z, 0.8, 200);
      return Math.max(0, h - 6);
    },
    morning: function(x, z){
      var r = ridged(x * 0.0023 + 11, z * 0.0023 + 7, 5);
      var h = r * 200 + fbm(x * 0.007, z * 0.007, 3) * 18;
      var pk = 540 * gauss(x, z, 0, ZP, 250) + 340 * gauss(x, z, -620, ZP + 300, 220) + 390 * gauss(x, z, 640, ZP + 180, 230)
         + 230 * gauss(x, z, -360, ZP + 950, 170) + 250 * gauss(x, z, 400, ZP + 1050, 180) + 310 * gauss(x, z, -720, ZP - 700, 260) + 330 * gauss(x, z, 720, ZP - 820, 260)
         + 210 * gauss(x, z, -950, 400, 260) + 230 * gauss(x, z, 1000, -100, 280) + 220 * gauss(x, z, -640, -3000, 260) + 240 * gauss(x, z, 660, -3300, 260);
      h += pk * (0.72 + 0.56 * ridged(x * 0.0055, z * 0.0055, 4));
      h += 440 * sstep(-3750, -5700, z) * (0.35 + 0.65 * r);
      h *= carve(x, z, 0.86, 185);
      return Math.max(0, h - 10);
    },
    dusk: function(x, z){
      var r = ridged(x * 0.0024 + 5.3, z * 0.0024 + 1.1, 5);
      var rock = r * 150 + 430 * gauss(x, z, 0, ZP, 270) + 250 * gauss(x, z, -580, ZP + 340, 230) + 280 * gauss(x, z, 620, ZP + 220, 240)
        + 180 * gauss(x, z, -420, ZP + 1000, 200) + 200 * gauss(x, z, 460, ZP + 900, 210) + 170 * gauss(x, z, -900, 300, 240) + 180 * gauss(x, z, 900, -200, 260);
      rock *= 0.8 + 0.36 * ridged(x * 0.006, z * 0.006, 3);
      rock = lerp(terrace(rock, 36, 0.09), rock, gauss(x, z, 0, ZP, 300));
      var rockZone = sstep(ZP - 950, ZP - 150, z);
      var dir = x * 0.55 + z * 0.83, warp = fbm(x * 0.0017, z * 0.0017, 3) * 2.6;
      var w = Math.sin(dir * 0.0105 + warp), dune = Math.pow(1 - Math.abs(w), 2.4) * 62 + (fbm(x * 0.0035 + 4, z * 0.0035, 3) * 0.5 + 0.5) * 34 + (Math.sin(dir * 0.0031 + warp * 0.5) * 0.5 + 0.5) * 30;
      var basin = 1 - 0.85 * gauss(x, z, CAMP.x, CAMP.z, 230);
      var outcrop = Math.max(0, ridged(x * 0.004 + 2, z * 0.004 + 9, 3) - 0.72) * 700 * sstep(0.05, 0.3, fbm(x * 0.0009 + 1.3, z * 0.0009 - 4.1, 3)) * (1 - gauss(x, z, CAMP.x, CAMP.z, 600));
      var sand = dune * basin + outcrop * (1 - rockZone);
      var h = lerp(sand, Math.max(rock, sand * 0.6), rockZone) + 340 * sstep(-3850, -5700, z) * (0.3 + 0.7 * r);
      h *= lerp(carve(x, z, 0.55, 240), carve(x, z, 0.8, 200), rockZone);
      return Math.max(0, h - 4);
    }
  };
  var THEMES = ['night', 'morning', 'dusk'];

  function init(){
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    var gl2 = renderer.capabilities.isWebGL2;
    var scene = new THREE.Scene();
    var cam = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 2, 14000);
    var fog = new THREE.Fog(0xffffff, 60, 1800); scene.fog = fog;
    var hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6); scene.add(hemi);
    var sun = new THREE.DirectionalLight(0xffffff, 1); scene.add(sun); scene.add(sun.target);
    sun.castShadow = true; sun.shadow.mapSize.set(small ? 2048 : 4096, small ? 2048 : 4096);
    var sc = sun.shadow.camera; sc.left = -1500; sc.right = 1500; sc.top = 1500; sc.bottom = -1500; sc.near = 10; sc.far = 7000;
    sun.shadow.bias = -0.0006; sun.shadow.normalBias = 1.2;

    /* ---------- ground: a grid that is dense along the route and coarse at the edges ---------- */
    var NX = small ? 190 : 260, NZ = small ? 310 : 430, W1 = NX + 1, NV = W1 * (NZ + 1);
    var XS = new Float32Array(W1), ZS = new Float32Array(NZ + 1), i, j, k;
    for (i = 0; i <= NX; i++){ var s0 = i / NX * 2 - 1, a0 = Math.abs(s0); XS[i] = (s0 < 0 ? -1 : 1) * 3000 * (0.3 * a0 + 0.7 * Math.pow(a0, 2.3)); }
    for (j = 0; j <= NZ; j++){ var t0 = j / NZ; ZS[j] = t0 < 0.05 ? lerp(1180, 660, t0 / 0.05) : t0 < 0.8 ? lerp(660, -3800, (t0 - 0.05) / 0.75) : lerp(-3800, -6500, (t0 - 0.8) / 0.2); }
    function idxX(x){ if (x <= XS[0]) return 0; if (x >= XS[NX]) return NX; var lo = 0, hi = NX; while (hi - lo > 1){ var m = (lo + hi) >> 1; if (XS[m] <= x) lo = m; else hi = m; } return lo + (x - XS[lo]) / (XS[hi] - XS[lo]); }
    function idxZ(z){ if (z >= ZS[0]) return 0; if (z <= ZS[NZ]) return NZ; var lo = 0, hi = NZ; while (hi - lo > 1){ var m = (lo + hi) >> 1; if (ZS[m] >= z) lo = m; else hi = m; } return lo + (ZS[lo] - z) / (ZS[lo] - ZS[hi]); }
    function gridH(arr, x, z){ var fx = idxX(x), fz = idxZ(z), ii = Math.min(NX - 1, Math.floor(fx)), jj = Math.min(NZ - 1, Math.floor(fz)), tx = fx - ii, tz = fz - jj;
      return lerp(lerp(arr[jj * W1 + ii], arr[jj * W1 + ii + 1], tx), lerp(arr[(jj + 1) * W1 + ii], arr[(jj + 1) * W1 + ii + 1], tx), tz); }

    var T = {}; /* per theme ground: heights, colours, roughness, peak */
    function buildGround(name){
      var fn = HF[name], h = new Float32Array(NV), c = new Float32Array(NV * 3), r = new Float32Array(NV), ii, jj, kk;
      for (jj = 0; jj <= NZ; jj++) for (ii = 0; ii <= NX; ii++) h[jj * W1 + ii] = fn(XS[ii], ZS[jj]);
      var C = {}, cc = new THREE.Color(), rc = new THREE.Color();
      if (name === 'night') C = { forest: col(0x183327), forest2: col(0x21422F), grass: col(0x4C5C39), grass2: col(0x5F6B43), rock: col(0x3A4150), rock2: col(0x2B303D) };
      if (name === 'morning') C = { snow: col(0xF4F7FB), ice: col(0xCFE3F3), rock: col(0x6C6763), rock2: col(0x4A4643), meadow: col(0x5E7C46), forest: col(0x2E4A33) };
      if (name === 'dusk') C = { sand: col(0xDDA062), sand2: col(0xC98247), rock: col(0xA24E2F), rock2: col(0x6E2D1C), mesa: col(0xB9683D), water: col(0x2B6E78), floor: col(0x8A7A3A) };
      var peakH = 0, peakI = 0;
      for (jj = 0; jj <= NZ; jj++) for (ii = 0; ii <= NX; ii++){
        kk = jj * W1 + ii; var y = h[kk], x = XS[ii], z = ZS[jj];
        var i0 = Math.max(0, ii - 1), i1 = Math.min(NX, ii + 1), j0 = Math.max(0, jj - 1), j1 = Math.min(NZ, jj + 1);
        var gx = (h[jj * W1 + i1] - h[jj * W1 + i0]) / (XS[i1] - XS[i0]), gz = (h[j1 * W1 + ii] - h[j0 * W1 + ii]) / (ZS[j0] - ZS[j1]), sl = Math.sqrt(gx * gx + gz * gz);
        var n1 = noise(x * 0.02, z * 0.02), n2 = fbm(x * 0.004 + 7, z * 0.004 - 3, 3), rough = 1;
        if (Math.abs(x) < 400 && z < ZP + 500 && z > ZP - 500 && y > peakH){ peakH = y; peakI = kk; }
        if (name === 'night'){
          var tops = sstep(150, 250, y + n2 * 70) * (1 - sstep(0.55, 0.9, sl));
          cc.copy(C.forest).lerp(C.forest2, 0.5 + n1 * 0.5).lerp(C.grass, tops).lerp(C.grass2, tops * (0.5 + n1 * 0.5));
          if (sl > 0.95) cc.lerp(C.rock, sstep(0.95, 1.5, sl)).lerp(C.rock2, 0.4 + n1 * 0.4);
        } else if (name === 'morning'){
          var snowLine = 172 + n1 * 38 + n2 * 28, steep = sstep(0.95, 1.45, sl);
          if (y < 70 + n2 * 30) cc.copy(C.meadow).lerp(C.forest, sstep(40, 90, y) * 0.7);
          else if (y < 150) cc.copy(C.forest).lerp(C.rock2, sstep(110, 160, y) * 0.6 + steep * 0.5);
          else cc.copy(C.rock).lerp(C.rock2, 0.5 + n1 * 0.5);
          var sn = sstep(snowLine - 18, snowLine + 12, y) * (1 - steep * 0.85);
          if (sn > 0){ var glacier = (1 - sstep(0.22, 0.45, sl)) * sstep(snowLine - 10, snowLine + 40, y) * sstep(-0.1, 0.25, n2); cc.lerp(C.snow, sn).lerp(C.ice, glacier * 0.9); rough = lerp(1, lerp(0.5, 0.22, glacier), sn); }
        } else {
          var rz = sstep(ZP - 950, ZP - 150, z), cliffy = sstep(0.55, 1.1, sl), bump = sstep(34, 70, y);
          cc.copy(C.sand).lerp(C.sand2, clamp(0.5 + n2 * 0.9 + n1 * 0.2, 0, 1));
          var rockish = Math.max(rz * bump, sstep(60, 120, y) * (1 - rz));
          if (rockish > 0){ rc.copy(C.mesa).lerp(C.rock, cliffy).lerp(C.rock2, cliffy * (0.4 + n1 * 0.4)); cc.lerp(rc, rockish); }
          rough = lerp(0.85, 1, rockish);
          var dw = Math.sqrt((x - CAMP.x) * (x - CAMP.x) + (z - CAMP.z) * (z - CAMP.z));
          if (dw < 170) cc.lerp(C.floor, (1 - sstep(80, 170, dw)) * 0.55);
          if (dw < 64 && y < 14){ cc.copy(C.water); rough = 0.12; }
        }
        c[kk * 3] = cc.r; c[kk * 3 + 1] = cc.g; c[kk * 3 + 2] = cc.b; r[kk] = rough;
      }
      T[name] = { h: h, c: c, r: r, peak: { x: XS[peakI % W1], z: ZS[Math.floor(peakI / W1)], h: peakH } };
    }

    var cur = root.getAttribute('data-time'); if (!HF[cur]) cur = 'dusk';
    buildGround(cur);
    var Hc = new Float32Array(T[cur].h), Cc = new Float32Array(T[cur].c), Rc = new Float32Array(T[cur].r);
    var pos = new Float32Array(NV * 3);
    for (j = 0; j <= NZ; j++) for (i = 0; i <= NX; i++){ k = j * W1 + i; pos[k * 3] = XS[i]; pos[k * 3 + 1] = Hc[k]; pos[k * 3 + 2] = ZS[j]; }
    var idx = new Uint32Array(NX * NZ * 6), q2 = 0;
    for (j = 0; j < NZ; j++) for (i = 0; i < NX; i++){ var A = j * W1 + i, B = A + 1, Cn = A + W1, D = Cn + 1;
      if ((i + j) & 1){ idx[q2++] = A; idx[q2++] = B; idx[q2++] = Cn; idx[q2++] = B; idx[q2++] = D; idx[q2++] = Cn; }
      else { idx[q2++] = A; idx[q2++] = D; idx[q2++] = Cn; idx[q2++] = A; idx[q2++] = B; idx[q2++] = D; } }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(Cc, 3));
    geo.setAttribute('aRough', new THREE.BufferAttribute(Rc, 1));
    geo.setIndex(new THREE.BufferAttribute(idx, 1));
    geo.computeVertexNormals();
    var groundMat = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1, metalness: 0 });
    groundMat.onBeforeCompile = function(sh){
      sh.vertexShader = 'attribute float aRough;\nvarying float vRough;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n  vRough = aRough;');
      sh.fragmentShader = 'varying float vRough;\n' + sh.fragmentShader.replace('float roughnessFactor = roughness;', 'float roughnessFactor = roughness * vRough;');
    };
    var ground = new THREE.Mesh(geo, groundMat); ground.castShadow = true; ground.receiveShadow = true; ground.frustumCulled = false; scene.add(ground);
    var posAttr = geo.attributes.position, colAttr = geo.attributes.color, rAttr = geo.attributes.aRough;
    function groundAt(x, z){ return gridH(Hc, x, z); }

    /* ---------- shared textures ---------- */
    var glowTex = canvasTex(128, 128, function(g, w){ var r = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.2, 'rgba(255,255,255,.8)'); r.addColorStop(0.5, 'rgba(255,255,255,.2)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, w, w); });
    var sunTex = canvasTex(256, 256, function(g, w){ var r = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
      r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.15, 'rgba(255,252,240,1)'); r.addColorStop(0.19, 'rgba(255,240,210,.7)'); r.addColorStop(0.32, 'rgba(255,220,170,.24)'); r.addColorStop(0.6, 'rgba(255,200,150,.07)'); r.addColorStop(1, 'rgba(255,200,150,0)'); g.fillStyle = r; g.fillRect(0, 0, w, w); });
    var moonTex = canvasTex(256, 256, function(g, w){ var c0 = w / 2, R = w * 0.2, r = g.createRadialGradient(c0, c0, R * 0.9, c0, c0, w / 2);
      r.addColorStop(0, 'rgba(190,210,255,.35)'); r.addColorStop(0.3, 'rgba(160,190,255,.1)'); r.addColorStop(1, 'rgba(160,190,255,0)'); g.fillStyle = r; g.fillRect(0, 0, w, w);
      var d = g.createRadialGradient(c0 - R * 0.3, c0 - R * 0.3, R * 0.1, c0, c0, R); d.addColorStop(0, '#FFFDF4'); d.addColorStop(0.8, '#E9E6DA'); d.addColorStop(1, '#CFCBBE');
      g.fillStyle = d; g.beginPath(); g.arc(c0, c0, R, 0, Math.PI * 2); g.fill();
      var rr = rng(7); g.fillStyle = 'rgba(120,120,110,.16)'; for (var m = 0; m < 16; m++){ var a = rr() * 6.28, dd = rr() * R * 0.8, cr = R * (0.05 + rr() * 0.16); g.beginPath(); g.arc(c0 + Math.cos(a) * dd, c0 + Math.sin(a) * dd, cr, 0, 6.28); g.fill(); }
      g.fillStyle = 'rgba(110,112,108,.2)'; g.beginPath(); g.ellipse(c0 - R * 0.25, c0 - R * 0.1, R * 0.34, R * 0.24, 0.5, 0, 6.28); g.fill(); g.beginPath(); g.ellipse(c0 + R * 0.25, c0 + R * 0.28, R * 0.22, R * 0.16, -0.3, 0, 6.28); g.fill(); });

    /* ---------- sky dome, with a milky way for the Nilgiri nights ---------- */
    var skyU = { uTop: { value: new THREE.Color() }, uMid: { value: new THREE.Color() }, uHor: { value: new THREE.Color() }, uSunDir: { value: new THREE.Vector3(0, 0.2, -1) }, uSunCol: { value: new THREE.Color() }, uGlow: { value: 1 }, uMilky: { value: 0 }, uTime: { value: 0 } };
    var sky = new THREE.Mesh(new THREE.SphereGeometry(9000, 48, 24), new THREE.ShaderMaterial({ uniforms: skyU, side: THREE.BackSide, depthWrite: false, fog: false,
      vertexShader: 'varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: [
        'uniform vec3 uTop, uMid, uHor, uSunDir, uSunCol; uniform float uGlow, uMilky, uTime; varying vec3 vDir;',
        'float h31(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }',
        'float vn3(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f); return mix(mix(mix(h31(i), h31(i + vec3(1,0,0)), f.x), mix(h31(i + vec3(0,1,0)), h31(i + vec3(1,1,0)), f.x), f.y), mix(mix(h31(i + vec3(0,0,1)), h31(i + vec3(1,0,1)), f.x), mix(h31(i + vec3(0,1,1)), h31(i + vec3(1,1,1)), f.x), f.y), f.z); }',
        'void main(){ vec3 d = normalize(vDir); float h = d.y;',
        '  vec3 c = mix(uMid, uTop, smoothstep(0.02, 0.62, h)); c = mix(uHor, c, smoothstep(-0.03, 0.26, h)); if (h < -0.03) c = mix(uHor, uHor * 0.7, smoothstep(-0.03, -0.4, h));',
        '  float sd = max(dot(d, normalize(uSunDir)), 0.0); c += uSunCol * (pow(sd, 6.0) * 0.28 + pow(sd, 48.0) * 0.5 + pow(sd, 400.0) * 0.6) * uGlow;',
        '  if (uMilky > 0.001){ vec3 ax = normalize(vec3(0.42, 0.62, 0.66)); float b = dot(d, ax); float band = exp(-b * b * 26.0); float n = vn3(d * 7.0) * 0.55 + vn3(d * 19.0) * 0.3 + vn3(d * 45.0) * 0.15; float dust = smoothstep(0.35, 0.8, vn3(d * 11.0 + 3.0));',
        '    c += vec3(0.62, 0.66, 0.86) * band * pow(n, 2.2) * 0.55 * uMilky * smoothstep(0.0, 0.25, h); c -= vec3(0.05) * band * dust * uMilky * smoothstep(0.0, 0.25, h); }',
        '  gl_FragColor = vec4(max(c, 0.0), 1.0); }'].join('\n') }));
    sky.renderOrder = -10; sky.frustumCulled = false; scene.add(sky);

    /* stars that twinkle */
    var SN = small ? 1400 : 3000, sp = new Float32Array(SN * 3), ssz = new Float32Array(SN), sph = new Float32Array(SN), rs = rng(3);
    for (i = 0; i < SN; i++){ var th = rs() * Math.PI * 2, yy = Math.pow(rs(), 0.8) * 0.98 + 0.02, rr0 = Math.sqrt(1 - yy * yy) * 8400; sp[i * 3] = Math.cos(th) * rr0; sp[i * 3 + 1] = yy * 8400; sp[i * 3 + 2] = Math.sin(th) * rr0; ssz[i] = 1 + Math.pow(rs(), 5) * 4.2; sph[i] = rs() * 30; }
    var sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3)); sg.setAttribute('aSize', new THREE.BufferAttribute(ssz, 1)); sg.setAttribute('aPhase', new THREE.BufferAttribute(sph, 1));
    var starU = { uTime: { value: 0 }, uOpacity: { value: 0 }, uPR: { value: renderer.getPixelRatio() } };
    var stars = new THREE.Points(sg, new THREE.ShaderMaterial({ uniforms: starU, transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending,
      vertexShader: 'attribute float aSize; attribute float aPhase; uniform float uTime, uOpacity, uPR; varying float vA; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = aSize * uPR * 1.4; vA = uOpacity * (0.6 + 0.4 * sin(uTime * (1.2 + fract(aPhase) * 2.0) + aPhase)); }',
      fragmentShader: 'varying float vA; void main(){ float d = length(gl_PointCoord - 0.5); gl_FragColor = vec4(0.9, 0.93, 1.0, smoothstep(0.5, 0.05, d) * vA); }' }));
    stars.frustumCulled = false; stars.renderOrder = -9; scene.add(stars);

    /* the sun and the moon: one orb per theme so one can set while the next rises */
    function orb(tex, additive){ var s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, fog: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending })); s.renderOrder = -8; s.frustumCulled = false; scene.add(s); return s; }
    var ORB = { morning: orb(sunTex, true), dusk: orb(sunTex, true), night: orb(moonTex, false) };
    /* W3-05: click the sun or the moon and it winks back, with a glint */
    var glintTex = canvasTex(128, 128, function(g, w){ var c = w / 2; g.globalCompositeOperation = 'lighter';
      [[0, 1], [Math.PI / 2, 1], [Math.PI / 4, 0.45], [-Math.PI / 4, 0.45]].forEach(function(a){ g.save(); g.translate(c, c); g.rotate(a[0]); var gr = g.createLinearGradient(-c, 0, c, 0);
        gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(255,255,255,' + a[1] + ')'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(-c, -1.6 * a[1], w, 3.2 * a[1]); g.restore(); });
      var r = g.createRadialGradient(c, c, 0, c, c, c * 0.35); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, w, w); });
    var glint = new THREE.Sprite(new THREE.SpriteMaterial({ map: glintTex, transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending })); glint.renderOrder = -7; glint.frustumCulled = false; glint.visible = false; scene.add(glint);
    var WK = { t: 9, d: 0.66 }, orbS = { x: -1, y: -1, r: 0, vis: false }, camUp = new THREE.Vector3(), orbP = new THREE.Vector3();
    function backOut(s){ var c1 = 2.2, c3 = c1 + 1; return 1 + c3 * Math.pow(s - 1, 3) + c1 * Math.pow(s - 1, 2); }
    function winkF(t){ if (t < 0.15){ var a = t / 0.15; return 1 - 0.9 * a * a; } if (t < 0.24) return 0.1; if (t < WK.d) return 0.1 + 0.9 * backOut((t - 0.24) / (WK.d - 0.24)); return 1; }
    /* the debug view (the Konami code in sparkle.js): every surface as wireframe */
    var DBG = false;
    function debugView(on){ on = !!on; if (on === DBG) return DBG; DBG = on;
      scene.traverse(function(o){ if (!o.material || o.isSprite || o.isPoints) return; (Array.isArray(o.material) ? o.material : [o.material]).forEach(function(m){ if (on){ m.__wf = m.wireframe; m.wireframe = true; } else m.wireframe = !!m.__wf; m.needsUpdate = true; }); });
      return DBG; }

    /* ---------- palettes: the light changes as you climb (base, summit, far camp) ---------- */
    function Pl(o){ var r = {}; for (var key in o){ r[key] = key.charAt(0) === 'c' ? col(o[key]) : o[key]; } return r; }
    var PAL = {
      morning: [
        Pl({ cTop: 0x6A98D6, cMid: 0xB5CFEE, cHor: 0xF2D8CE, cFog: 0xDCE2EC, cHs: 0xDDE8F7, cHg: 0x6A6258, hI: 0.86, cSun: 0xFFE0C0, sI: 1.15, el: 7, az: -38, size: 1500, stars: 0, milky: 0, cCl: 0xFFFFFF, cSh: 0xC6D2E4, near: 90, far: 2300, glow: 0.9, cSign: 0xFFFFFF }),
        Pl({ cTop: 0x3B74C6, cMid: 0x8AB6EA, cHor: 0xEAF1F8, cFog: 0xE2EAF3, cHs: 0xE9F0FA, cHg: 0x7A7266, hI: 0.95, cSun: 0xFFF7E8, sI: 1.35, el: 36, az: -30, size: 1100, stars: 0, milky: 0, cCl: 0xFFFFFF, cSh: 0xCBD7E8, near: 700, far: 7200, glow: 0.7, cSign: 0xFFFFFF }),
        Pl({ cTop: 0x5A86C9, cMid: 0xADC7E6, cHor: 0xF5E1C3, cFog: 0xE7E1D6, cHs: 0xF2E9DA, cHg: 0x6D6152, hI: 0.9, cSun: 0xFFE2AE, sI: 1.25, el: 17, az: 34, size: 1400, stars: 0, milky: 0, cCl: 0xFFFBF2, cSh: 0xD9CDBE, near: 160, far: 3400, glow: 0.9, cSign: 0xFFF6EA })],
      dusk: [
        Pl({ cTop: 0x3A1A2E, cMid: 0x9A3F36, cHor: 0xF0A15C, cFog: 0xB9603F, cHs: 0xFFB88A, cHg: 0x3A1A10, hI: 0.62, cSun: 0xFFB070, sI: 1.55, el: 13, az: -28, size: 1500, stars: 0, milky: 0, cCl: 0xF6B488, cSh: 0x9A4A3A, near: 140, far: 3400, glow: 1, cSign: 0xF2C4A0 }),
        Pl({ cTop: 0x1E0F24, cMid: 0x6B2238, cHor: 0xFF8A4A, cFog: 0x8E3C2C, cHs: 0xFF9A70, cHg: 0x2A1010, hI: 0.55, cSun: 0xFF7A45, sI: 1.7, el: 2.5, az: -8, size: 2400, stars: 0.08, milky: 0, cCl: 0xFF9C6E, cSh: 0x7A2E36, near: 600, far: 7000, glow: 1.2, cSign: 0xE8A884 }),
        Pl({ cTop: 0x120B22, cMid: 0x3A1B3E, cHor: 0xC0583E, cFog: 0x4C2632, cHs: 0xC88AA0, cHg: 0x1A0C10, hI: 0.42, cSun: 0xFF6A40, sI: 0.6, el: -2, az: -6, size: 2200, stars: 0.55, milky: 0.15, cCl: 0xB46A6A, cSh: 0x4A2440, near: 140, far: 3000, glow: 0.9, cSign: 0xB88A8A })],
      night: [
        Pl({ cTop: 0x040814, cMid: 0x0E1D3E, cHor: 0x2C4B80, cFog: 0x142650, cHs: 0x6F8FC8, cHg: 0x070B18, hI: 0.52, cSun: 0xC8D8FF, sI: 0.78, el: 15, az: 30, size: 1100, stars: 0.75, milky: 0.35, cCl: 0x9FB2D8, cSh: 0x2E3E66, near: 60, far: 1900, glow: 0.55, cSign: 0x8E9CC2 }),
        Pl({ cTop: 0x02040C, cMid: 0x091532, cHor: 0x1E3766, cFog: 0x0E1B3A, cHs: 0x7C9AD2, cHg: 0x060A16, hI: 0.55, cSun: 0xD2E0FF, sI: 0.95, el: 32, az: 24, size: 900, stars: 1, milky: 1, cCl: 0xB8C8EA, cSh: 0x33466E, near: 500, far: 6500, glow: 0.5, cSign: 0x9AA8CC }),
        Pl({ cTop: 0x03060F, cMid: 0x0B1631, cHor: 0x243F72, cFog: 0x112150, cHs: 0x6A88C0, cHg: 0x060A16, hI: 0.5, cSun: 0xC8D8FF, sI: 0.8, el: 24, az: -22, size: 1000, stars: 0.9, milky: 0.75, cCl: 0x9FB2D8, cSh: 0x2A3A62, near: 120, far: 2600, glow: 0.5, cSign: 0x8E9CC2 })]
    };
    var CLOUDS = { /* fraction of summit height, cover threshold, opacity, scale */
      morning: [[0.34, 0.54, 0.72, 0.0024], [0.63, 0.47, 0.96, 0.0013], [0.9, 0.64, 0.5, 0.0019]],
      night:   [[0.24, 0.46, 0.62, 0.0021], [0.6, 0.5, 0.85, 0.0014], [0.88, 0.66, 0.45, 0.002]],
      dusk:    [[0.3, 0.42, 0.42, 0.0012], [0.72, 0.6, 0.55, 0.0016], [0.93, 0.7, 0.3, 0.002]]
    };
    function mixPal(a, b, t){ var r = {}; for (var key in a){ r[key] = a[key] instanceof THREE.Color ? a[key].clone().lerp(b[key], t) : lerp(a[key], b[key], t); } return r; }
    function palAt(name, u){ var L = PAL[name]; return u <= 0.5 ? mixPal(L[0], L[1], sstep(0, 0.5, u)) : mixPal(L[1], L[2], sstep(0.5, 1, u)); }

    /* ---------- cloud layers you climb through, and a sea of cloud from the top ---------- */
    var cloudVS = 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }';
    var cloudFS = [
      'uniform float uOpacity, uCover, uScale, uFar, uDrift; uniform vec3 uTop, uShade, uFog, uCam; varying vec3 vW;',
      'float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }',
      'float vn(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f); return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), u.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), u.x), u.y); }',
      'float fbm(vec2 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 6; i++){ s += vn(p) * a; p = p * 2.03 + vec2(17.1, 9.2); a *= 0.5; } return s; }',
      'void main(){ vec2 p = vW.xz * uScale + vec2(uDrift, uDrift * 0.37); float n = fbm(p) + (fbm(p * 3.1 - uDrift * 0.6) - 0.5) * 0.18;',
      '  float a = smoothstep(uCover, uCover + 0.2, n); vec3 c = mix(uShade, uTop, smoothstep(uCover, uCover + 0.34, n));',
      '  float d = length(vW.xz - uCam.xz); c = mix(c, uFog, smoothstep(uFar * 0.2, uFar, d) * 0.85);',
      '  float below = step(vW.y, uCam.y);',
      '  a *= uOpacity * (1.0 - smoothstep(uFar * 0.75, uFar * 1.1, d)) * smoothstep(3.0, 36.0, abs(uCam.y - vW.y) + d * 0.015) * mix(smoothstep(80.0, 900.0, d) * 0.7 + 0.3, 1.0, below);',
      '  if (a < 0.003) discard; gl_FragColor = vec4(c, a); }'].join('\n');
    var layers = [];
    for (i = 0; i < 3; i++){
      var cu = { uOpacity: { value: 0 }, uCover: { value: 0.5 }, uScale: { value: 0.002 }, uFar: { value: 4000 }, uDrift: { value: i * 13.7 }, uTop: { value: new THREE.Color() }, uShade: { value: new THREE.Color() }, uFog: { value: new THREE.Color() }, uCam: { value: new THREE.Vector3() } };
      var cmesh = new THREE.Mesh(new THREE.PlaneGeometry(16000, 16000, 1, 1), new THREE.ShaderMaterial({ uniforms: cu, vertexShader: cloudVS, fragmentShader: cloudFS, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false }));
      cmesh.rotation.x = -Math.PI / 2; cmesh.frustumCulled = false; cmesh.renderOrder = 5 + i; scene.add(cmesh); layers.push({ mesh: cmesh, u: cu });
    }

    /* ---------- weather: snow, sand or leaves, pushed by how fast you scroll ---------- */
    var WN = small ? 2600 : 5200, wp = new Float32Array(WN * 3), ws = new Float32Array(WN), rw = rng(11), BOX = new THREE.Vector3(760, 420, 760);
    for (i = 0; i < WN; i++){ wp[i * 3] = rw() * BOX.x; wp[i * 3 + 1] = rw() * BOX.y; wp[i * 3 + 2] = rw() * BOX.z; ws[i] = rw(); }
    var wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.BufferAttribute(wp, 3)); wg.setAttribute('aSeed', new THREE.BufferAttribute(ws, 1));
    var weaU = { uTime: { value: 0 }, uFall: { value: 0 }, uWind: { value: new THREE.Vector2() }, uCam: { value: new THREE.Vector3() }, uBox: { value: BOX }, uSize: { value: 2 }, uCount: { value: 0.5 }, uOpacity: { value: 0 }, uColor: { value: new THREE.Color() }, uShape: { value: 0 }, uPR: { value: renderer.getPixelRatio() }, uStreak: { value: 0 } };
    var weather = new THREE.Points(wg, new THREE.ShaderMaterial({ uniforms: weaU, transparent: true, depthWrite: false, fog: false,
      vertexShader: ['attribute float aSeed; uniform float uTime, uFall, uSize, uCount, uOpacity, uPR; uniform vec2 uWind; uniform vec3 uCam, uBox; varying float vA; varying float vS;',
        'void main(){ vec3 p = position; float sp = 0.6 + aSeed * 0.8; p.y -= uFall * uTime * sp; p.xz += uWind * (0.7 + aSeed * 0.6);',
        '  p.x += sin(uTime * 0.8 + aSeed * 40.0) * 7.0; p.z += cos(uTime * 0.6 + aSeed * 23.0) * 5.0;',
        '  p = mod(p - uCam + uBox * 0.5, uBox) - uBox * 0.5 + uCam;',
        '  vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = uSize * uPR * (0.6 + aSeed * 0.8) * (260.0 / max(20.0, -mv.z));',
        '  vA = step(aSeed, uCount) * uOpacity * smoothstep(0.0, 60.0, -mv.z) * (1.0 - smoothstep(300.0, 380.0, -mv.z)); vS = aSeed; }'].join('\n'),
      fragmentShader: ['uniform vec3 uColor; uniform float uShape, uTime, uStreak; varying float vA; varying float vS;',
        'void main(){ vec2 q = gl_PointCoord - 0.5; float a;',
        '  if (uShape < 0.5){ q.x *= 1.0 - uStreak * 0.7; a = smoothstep(0.5, 0.1, length(q)); }',
        '  else { float an = vS * 6.28 + uTime * (1.0 + vS * 2.0); vec2 r = vec2(cos(an) * q.x - sin(an) * q.y, sin(an) * q.x + cos(an) * q.y); a = smoothstep(0.5, 0.35, length(vec2(r.x * 2.2, r.y))); }',
        '  gl_FragColor = vec4(uColor * (0.85 + vS * 0.3), a * vA); }'].join('\n') }));
    weather.frustumCulled = false; weather.renderOrder = 9; scene.add(weather);
    var WEATHER = { /* fall, size, share, opacity, colour, shape, wind */
      morning: [22, 3.2, 0.55, 0.9, 0xFFFFFF, 0, 1], dusk: [3, 1.25, 0.5, 0.5, 0xE9B07A, 0, 2.2], night: [6, 2.6, 0.22, 0.75, 0x55704A, 1, 1.2] };

    /* ---------- decoration builders ---------- */
    function part(g, color, m4){ var gg = g.index ? g.toNonIndexed() : g.clone(); if (m4) gg.applyMatrix4(m4); var n = gg.attributes.position.count, cArr = new Float32Array(n * 3), cl = col(color);
      for (var a = 0; a < n; a++){ cArr[a * 3] = cl.r; cArr[a * 3 + 1] = cl.g; cArr[a * 3 + 2] = cl.b; } gg.setAttribute('color', new THREE.BufferAttribute(cArr, 3)); return gg; }
    function merge(parts){ var n = 0, o = 0; parts.forEach(function(p){ n += p.attributes.position.count; });
      var P2 = new Float32Array(n * 3), C2 = new Float32Array(n * 3);
      parts.forEach(function(p){ P2.set(p.attributes.position.array, o * 3); C2.set(p.attributes.color.array, o * 3); o += p.attributes.position.count; });
      var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P2, 3)); g.setAttribute('color', new THREE.BufferAttribute(C2, 3)); g.computeVertexNormals(); return g; }
    function M(tx, ty, tz, sx, sy, sz, rx, ry, rz){ var m = new THREE.Matrix4(); m.compose(new THREE.Vector3(tx, ty, tz), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx || 0, ry || 0, rz || 0)), new THREE.Vector3(sx, sy, sz)); return m; }
    var decoMat = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1, metalness: 0 });
    var decoMat2 = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1, metalness: 0, side: THREE.DoubleSide });
    var dummy = new THREE.Object3D(), tint = new THREE.Color();

    /* an instanced field of things that grow in and out when the world changes */
    function field(geomF, mat, list){
      var mesh = new THREE.InstancedMesh(geomF, mat, Math.max(1, list.length)); mesh.castShadow = true; mesh.receiveShadow = true; mesh.frustumCulled = false;
      list.forEach(function(it, n){ tint.setRGB(it.t[0], it.t[1], it.t[2]); mesh.setColorAt(n, tint); });
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      var F = { mesh: mesh, list: list, grow: function(fS){ for (var n = 0; n < list.length; n++){ var it = list[n], s1 = it.s * fS(it); dummy.position.set(it.x, it.y, it.z); dummy.rotation.set(it.rx || 0, it.ry, it.rz || 0); dummy.scale.set(s1, s1 * (it.sy || 1), s1); dummy.updateMatrix(); mesh.setMatrixAt(n, dummy.matrix); } mesh.instanceMatrix.needsUpdate = true; } };
      F.grow(function(){ return 1; });
      return F;
    }

    /* sprite sheets for animals, drawn as silhouettes */
    function sheet(frames, fw, fh, draw){ var cv = document.createElement('canvas'); cv.width = fw * frames; cv.height = fh; var g = cv.getContext('2d');
      for (var f = 0; f < frames; f++){ g.save(); g.beginPath(); g.rect(f * fw, 0, fw, fh); g.clip(); g.translate(f * fw, 0); draw(g, f / frames * Math.PI * 2, f); g.restore(); }
      var tx = new THREE.CanvasTexture(cv); tx.minFilter = THREE.LinearFilter; tx.repeat.set(1 / frames, 1); tx.userData = { frames: frames }; return tx; }
    function limb(g, x, y, a, len, w, knee){ g.lineWidth = w; g.beginPath(); g.moveTo(x, y); var kx = x + Math.sin(a) * len * 0.5, ky = y + Math.cos(a) * len * 0.5; g.lineTo(kx, ky); var b = a * (knee || 0.3); g.lineTo(kx + Math.sin(b) * len * 0.5, ky + Math.cos(b) * len * 0.5); g.stroke(); }
    function drawCamel(g, ph, rider){ g.fillStyle = g.strokeStyle = '#140C0A'; g.lineCap = 'round'; g.lineJoin = 'round'; var bob = Math.sin(ph * 2) * 1.6;
      limb(g, 48, 66 + bob, Math.sin(ph) * 0.42, 50, 6, -0.4); limb(g, 58, 66 + bob, Math.sin(ph + Math.PI) * 0.42, 50, 6, -0.4);
      limb(g, 100, 66 + bob, Math.sin(ph + Math.PI) * 0.42, 50, 6, 0.4); limb(g, 110, 66 + bob, Math.sin(ph) * 0.42, 50, 6, 0.4);
      g.beginPath(); g.ellipse(78, 58 + bob, 40, 16, 0, 0, 6.29); g.fill();
      g.beginPath(); g.ellipse(72, 44 + bob, 21, 17, 0, Math.PI, 6.29); g.fill();
      g.lineWidth = 11; g.beginPath(); g.moveTo(108, 56 + bob); g.quadraticCurveTo(132, 66 + bob, 136, 32 + bob); g.stroke();
      g.beginPath(); g.ellipse(142, 30 + bob, 12, 6.5, 0.2, 0, 6.29); g.fill();
      g.lineWidth = 3; g.beginPath(); g.moveTo(39, 54 + bob); g.quadraticCurveTo(31, 62 + bob, 34, 76 + bob); g.stroke();
      if (rider){ g.beginPath(); g.moveTo(64, 30 + bob); g.lineTo(82, 30 + bob); g.lineTo(76, 6 + bob); g.lineTo(69, 6 + bob); g.closePath(); g.fill(); g.beginPath(); g.arc(72.5, 3 + bob, 5.5, 0, 6.29); g.fill(); g.lineWidth = 3; g.beginPath(); g.moveTo(80, 14 + bob); g.lineTo(96, 22 + bob); g.stroke(); } }
    function drawFox(g, ph){ g.fillStyle = g.strokeStyle = '#1A100C'; g.lineCap = 'round'; var bob = Math.sin(ph * 2) * 1.2;
      limb(g, 30, 40 + bob, Math.sin(ph) * 0.8, 22, 3.5, -0.6); limb(g, 36, 40 + bob, Math.sin(ph + 0.9) * 0.8, 22, 3.5, -0.6); limb(g, 62, 40 + bob, Math.sin(ph + Math.PI) * 0.8, 22, 3.5, 0.6); limb(g, 67, 40 + bob, Math.sin(ph + Math.PI + 0.9) * 0.8, 22, 3.5, 0.6);
      g.beginPath(); g.ellipse(48, 36 + bob, 22, 9, -0.05, 0, 6.29); g.fill(); g.beginPath(); g.ellipse(74, 29 + bob, 9, 7, -0.2, 0, 6.29); g.fill();
      g.beginPath(); g.moveTo(80, 28 + bob); g.lineTo(92, 32 + bob); g.lineTo(80, 34 + bob); g.fill();
      g.beginPath(); g.moveTo(68, 25 + bob); g.lineTo(66, 4 + bob); g.lineTo(75, 22 + bob); g.fill(); g.beginPath(); g.moveTo(74, 24 + bob); g.lineTo(80, 5 + bob); g.lineTo(81, 24 + bob); g.fill();
      g.beginPath(); g.moveTo(27, 33 + bob); g.quadraticCurveTo(8, 26 + bob + Math.sin(ph) * 3, 3, 38 + bob); g.quadraticCurveTo(14, 40 + bob, 28, 38 + bob); g.fill(); }
    function drawDeer(g, ph, f){ g.fillStyle = g.strokeStyle = '#070B14'; g.lineCap = 'round'; var up = f % 2 === 1;
      limb(g, 40, 62, 0.05, 44, 4.5, 0); limb(g, 48, 62, -0.08, 44, 4.5, 0); limb(g, 82, 62, 0.06, 44, 4.5, 0); limb(g, 90, 62, -0.05, 44, 4.5, 0);
      g.beginPath(); g.ellipse(64, 56, 32, 14, 0, 0, 6.29); g.fill();
      g.lineWidth = 10; g.beginPath(); g.moveTo(90, 50); if (up) g.lineTo(104, 22); else g.lineTo(106, 84); g.stroke();
      var hx = up ? 108 : 110, hy = up ? 16 : 90; g.beginPath(); g.ellipse(hx, hy, 10, 6, up ? -0.3 : 1.2, 0, 6.29); g.fill();
      g.lineWidth = 2.5; if (up){ g.beginPath(); g.moveTo(104, 12); g.lineTo(96, -2); g.moveTo(99, 4); g.lineTo(90, 2); g.moveTo(108, 12); g.lineTo(114, -4); g.moveTo(112, 3); g.lineTo(122, 0); g.stroke(); }
      g.beginPath(); g.moveTo(33, 50); g.lineTo(26, 58); g.stroke(); }
    function drawEagle(g, ph){ g.fillStyle = '#1B1712'; var w = Math.sin(ph); g.beginPath(); g.ellipse(64, 34, 14, 5, 0, 0, 6.29); g.fill(); g.beginPath(); g.ellipse(80, 32, 6, 4, 0, 0, 6.29); g.fill();
      g.beginPath(); g.moveTo(80, 31); g.lineTo(88, 33); g.lineTo(80, 35); g.fill(); g.beginPath(); g.moveTo(50, 34); g.lineTo(40, 30); g.lineTo(40, 40); g.fill();
      g.beginPath(); g.moveTo(58, 32); g.quadraticCurveTo(44, 32 - w * 22, 14, 30 - w * 26); g.lineTo(30, 36 - w * 12); g.quadraticCurveTo(46, 38, 66, 35); g.fill(); }
    function drawIbex(g){ g.fillStyle = g.strokeStyle = '#2A2622'; g.lineCap = 'round'; limb(g, 30, 44, 0.05, 30, 4, 0); limb(g, 36, 44, -0.1, 30, 4, 0); limb(g, 60, 44, 0.1, 30, 4, 0); limb(g, 66, 44, -0.05, 30, 4, 0);
      g.beginPath(); g.ellipse(48, 40, 24, 11, 0, 0, 6.29); g.fill(); g.lineWidth = 8; g.beginPath(); g.moveTo(66, 36); g.lineTo(74, 20); g.stroke(); g.beginPath(); g.ellipse(78, 18, 8, 5, -0.4, 0, 6.29); g.fill();
      g.lineWidth = 3.5; g.beginPath(); g.moveTo(74, 13); g.quadraticCurveTo(62, -4, 50, 6); g.stroke(); g.lineWidth = 2; g.beginPath(); g.moveTo(84, 22); g.lineTo(84, 30); g.stroke(); }
    function drawElephant(g, ph){ g.fillStyle = g.strokeStyle = '#05080F'; g.lineCap = 'round'; var bob = Math.sin(ph * 2) * 1.2;
      limb(g, 48, 70 + bob, Math.sin(ph) * 0.25, 42, 15, 0); limb(g, 64, 70 + bob, Math.sin(ph + Math.PI) * 0.25, 42, 15, 0); limb(g, 108, 70 + bob, Math.sin(ph + Math.PI) * 0.25, 42, 15, 0); limb(g, 122, 70 + bob, Math.sin(ph) * 0.25, 42, 15, 0);
      g.beginPath(); g.ellipse(84, 58 + bob, 50, 28, 0, 0, 6.29); g.fill(); g.beginPath(); g.ellipse(134, 50 + bob, 20, 22, 0, 0, 6.29); g.fill(); g.beginPath(); g.ellipse(126, 50 + bob, 14, 18, 0.2, 0, 6.29); g.fill();
      g.lineWidth = 9; g.beginPath(); g.moveTo(150, 56 + bob); g.quadraticCurveTo(160 + Math.sin(ph) * 4, 80, 154 + Math.sin(ph) * 6, 100); g.stroke(); g.lineWidth = 3; g.beginPath(); g.moveTo(35, 52 + bob); g.lineTo(30, 70 + bob); g.stroke(); }

    function setFrame(s, f){ var n = s.userData.frames, fr = ((Math.floor(f) % n) + n) % n, m = s.material.map; m.offset.x = m.repeat.x < 0 ? (fr + 1) / n : fr / n; }
    function animal(tex, w, h, x, z, extra){ var m = new THREE.SpriteMaterial({ map: tex.clone(), transparent: true, depthWrite: true, alphaTest: 0.3 }); m.map.needsUpdate = true;
      var s = new THREE.Sprite(m); s.center.set(0.5, 0.02); s.scale.set(w, h, 1); s.userData = Object.assign({ x: x, z: z, frames: tex.userData.frames, ph: Math.random() * 6.28 }, extra || {});
      m.map.repeat.set((s.userData.flip ? -1 : 1) / s.userData.frames, 1); setFrame(s, s.userData.frame || 0); return s; }

    /* ---------- the camps at the end of the descent ---------- */
    function fireAt(group, x, y, z){ var L = new THREE.PointLight(0xFF8A3A, 2.2, 260, 2); L.position.set(x, y + 6, z); group.add(L);
      var fl = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xFFA050, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); fl.position.set(x, y + 4, z); fl.scale.set(26, 30, 1); group.add(fl);
      var logs = new THREE.Mesh(merge([part(new THREE.CylinderGeometry(0.6, 0.6, 7, 5), 0x3A2414, M(0, 0.6, 0, 1, 1, 1, 0, 0, Math.PI / 2)), part(new THREE.CylinderGeometry(0.6, 0.6, 7, 5), 0x3A2414, M(0, 0.6, 0, 1, 1, 1, Math.PI / 2, 0, 0))]), decoMat); logs.position.set(x, y, z); group.add(logs);
      return { light: L, flame: fl, base: 2.2 }; }

    /* ---------- build each theme's living things ---------- */
    var SIGNDEF = [[0.03, 2016, 1], [0.12, 2018, -1], [0.21, 2020, 1], [0.3, 2022, -1], [0.39, 2024, 1], [0.47, 2026, -1]];
    var SIGNPOS = SIGNDEF.map(function(sg0){ var P2 = pathAt(sg0[0] + 0.02); return [P2[0] + sg0[2] * 46, P2[1]]; });
    var TH = {};
    function buildDeco(name){
      if (TH[name]) return TH[name];
      var HA = T[name].h, fn = function(x, z){ return gridH(HA, x, z); };
      function slope(x, z){ var e = 7, gx = (fn(x + e, z) - fn(x - e, z)) / (2 * e), gz = (fn(x, z + e) - fn(x, z - e)) / (2 * e); return Math.sqrt(gx * gx + gz * gz); }
      function clearance(x, z){ var dp = Math.abs(x - pathXAt(z)); return z < ZP - 2300 ? 999 : dp; }
      var R = rng(name.length * 977 + 5), group = new THREE.Group(), fields = [], anim = [], fires = [], D = { group: group, fields: fields, anim: anim, fires: fires, snap: [] };
      group.visible = false; scene.add(group);
      function pick(nearFrac){ var z = lerp(820, -4300, R()), x = R() < nearFrac ? pathXAt(z) + (R() + R() + R() - 1.5) * 520 : lerp(-1700, 1700, R()); return [x, z]; }
      function nearScale(x, z){ var dp = clearance(x, z); return lerp(0.5, 1, sstep(46, 170, dp)); }
      function nearCamp(x, z, r){ if (Math.abs(z - CAMP.z) < r && Math.abs(x - CAMP.x) < r) return true; for (var q = 0; q < SIGNPOS.length; q++){ var a = x - SIGNPOS[q][0], b = z - SIGNPOS[q][1]; if (a * a + b * b < 900) return true; } return false; }
      if (name === 'night'){
        var tree = merge([part(new THREE.IcosahedronGeometry(1, 0), 0x2F5A3C, M(0, 11, 0, 6.5, 6, 6.5)), part(new THREE.IcosahedronGeometry(1, 0), 0x3A6A46, M(2.5, 14.5, 1, 4.2, 4, 4.2)), part(new THREE.CylinderGeometry(0.7, 1, 7, 5), 0x3A2A1E, M(0, 3.5, 0, 1, 1, 1))]);
        var tall = merge([part(new THREE.ConeGeometry(4.2, 16, 6), 0x24462F, M(0, 13, 0, 1, 1, 1)), part(new THREE.ConeGeometry(3.2, 11, 6), 0x2B5236, M(0, 20, 0, 1, 1, 1)), part(new THREE.CylinderGeometry(0.6, 0.9, 7, 5), 0x3A2A1E, M(0, 3.5, 0, 1, 1, 1))]);
        var L1 = [], L2 = [], tries = 0, want = small ? 5500 : 11000;
        while (L1.length + L2.length < want && tries++ < want * 7){ var pk = pick(0.62), x = pk[0], z = pk[1];
          if (clearance(x, z) < 46 || nearCamp(x, z, 90)) continue;
          var y = fn(x, z), m = fbm(x * 0.004 + 7, z * 0.004 - 3, 3), tops = sstep(150, 250, y + m * 70);
          if (R() < tops * 0.93) continue; if (slope(x, z) > 1.05) continue;
          var sh = 0.8 + R() * 0.35, it = { x: x, y: y - 1.5, z: z, ry: R() * 6.28, s: (1.1 + R() * 1.5) * nearScale(x, z), t: [sh * (0.85 + R() * 0.2), sh, sh * (0.85 + R() * 0.25)] };
          (R() < 0.18 ? L2 : L1).push(it); }
        fields.push(field(tree, decoMat, L1), field(tall, decoMat, L2));
        /* fireflies drifting low over the valley */
        var FN = small ? 700 : 1400, fp = new Float32Array(FN * 3), fs = new Float32Array(FN);
        for (var n = 0; n < FN; n++){ var zz = lerp(700, -3900, R()), xx = pathXAt(zz) + (R() - 0.5) * 520; fp[n * 3] = xx; fp[n * 3 + 1] = fn(xx, zz) + 6 + R() * 40; fp[n * 3 + 2] = zz; fs[n] = R(); }
        var fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.BufferAttribute(fp, 3)); fg.setAttribute('aSeed', new THREE.BufferAttribute(fs, 1));
        D.flyU = { uTime: { value: 0 }, uOpacity: { value: 1 }, uPR: { value: renderer.getPixelRatio() }, uScatter: { value: 0 } };
        var flies = new THREE.Points(fg, new THREE.ShaderMaterial({ uniforms: D.flyU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
          vertexShader: 'attribute float aSeed; uniform float uTime, uOpacity, uPR, uScatter; varying float vA; void main(){ vec3 p = position; float t = uTime * (0.3 + aSeed * 0.4) + aSeed * 50.0; p += vec3(sin(t) * 9.0, sin(t * 1.3) * 5.0 + uScatter * aSeed * 30.0, cos(t * 0.8) * 9.0) * (1.0 + uScatter * 2.0); vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = uPR * 7.0 * (180.0 / max(30.0, -mv.z)); vA = uOpacity * pow(max(0.0, sin(uTime * (1.1 + aSeed) + aSeed * 90.0)), 3.0) * (1.0 - smoothstep(600.0, 900.0, -mv.z)); }',
          fragmentShader: 'varying float vA; void main(){ float d = length(gl_PointCoord - 0.5); gl_FragColor = vec4(1.0, 0.92, 0.55, smoothstep(0.5, 0.0, d) * vA); }' }));
        flies.frustumCulled = false; group.add(flies);
        /* owls: pairs of eyes in the trees near the path, blinking */
        var eyes = canvasTex(64, 32, function(g){ [[18, 16], [46, 16]].forEach(function(e){ var r = g.createRadialGradient(e[0], e[1], 0, e[0], e[1], 12); r.addColorStop(0, 'rgba(255,236,160,1)'); r.addColorStop(0.35, 'rgba(255,196,80,.95)'); r.addColorStop(1, 'rgba(255,160,40,0)'); g.fillStyle = r; g.beginPath(); g.arc(e[0], e[1], 12, 0, 6.29); g.fill(); g.fillStyle = '#1A0E04'; g.beginPath(); g.arc(e[0], e[1], 2.6, 0, 6.29); g.fill(); }); });
        var owls = 0, at2 = 0;
        while (owls < 10 && at2++ < 600 && L1.length){ var tr = L1[Math.floor(R() * L1.length)], dp = clearance(tr.x, tr.z); if (dp > 170 || dp < 50) continue;
          var ow = new THREE.Sprite(new THREE.SpriteMaterial({ map: eyes, transparent: true, depthWrite: false, fog: false })); ow.scale.set(5, 2.5, 1); ow.position.set(tr.x, tr.y + 10 * tr.s, tr.z + 6); ow.userData = { kind: 'owl', next: 2 + R() * 6, t: 0 }; group.add(ow); anim.push(ow); owls++; }
        /* sambar deer grazing in clearings, and elephants crossing a far meadow */
        var deerTex = sheet(2, 128, 110, drawDeer);
        [[96, 0.19], [-110, 0.27], [130, 0.72]].forEach(function(d0){ var P0 = pathAt(d0[1]); var dr = animal(deerTex, 16, 14, P0[0] + d0[0], P0[1] - 60, { kind: 'deer', next: 3 + R() * 4, flip: d0[0] < 0 }); group.add(dr); anim.push(dr); });
        var eleTex = sheet(8, 180, 128, drawElephant);
        for (n = 0; n < 3; n++){ var el = animal(eleTex, 30 - n * 5, 22 - n * 3.5, lerp(420, -320, 0.3 + n * 0.08), -3020 - n * 18, { kind: 'walk', vx: -3.2, x0: 420, x1: -320, rate: 1.1, flip: true }); group.add(el); anim.push(el); }
        var tent = merge([part(new THREE.ConeGeometry(11, 12, 4), 0xB0663A, M(0, 6, 0, 1, 1, 1.4, 0, Math.PI / 4, 0)), part(new THREE.BoxGeometry(3, 5, 0.4), 0x2A1810, M(0, 2.5, 7.6, 1, 1, 1))]);
        var tm = new THREE.Mesh(tent, decoMat); tm.castShadow = true; tm.rotation.y = 0.3; group.add(tm); D.snap.push([tm, CAMP.x - 22, CAMP.z - 30, 0]);
        fires.push(fireAt(group, CAMP.x + 8, fn(CAMP.x + 8, CAMP.z - 10), CAMP.z - 10));
      }
      if (name === 'morning'){
        var pine = merge([part(new THREE.ConeGeometry(4, 12, 7), 0x2A4A33, M(0, 8, 0, 1, 1, 1)), part(new THREE.ConeGeometry(3.1, 9, 7), 0x325A3C, M(0, 14, 0, 1, 1, 1)), part(new THREE.ConeGeometry(2, 6, 7), 0x3A6645, M(0, 19, 0, 1, 1, 1)), part(new THREE.CylinderGeometry(0.5, 0.7, 5, 5), 0x4A3322, M(0, 2.5, 0, 1, 1, 1))]);
        var LP = [], t2 = 0, wantP = small ? 2800 : 5200;
        while (LP.length < wantP && t2++ < wantP * 8){ var pk2 = pick(0.6), px = pk2[0], pz = pk2[1];
          if (clearance(px, pz) < 40 || nearCamp(px, pz, 80)) continue; var py = fn(px, pz);
          if (py > 150 + fbm(px * 0.01, pz * 0.01, 2) * 40 || slope(px, pz) > 0.95) continue;
          var sh2 = 0.85 + R() * 0.3; LP.push({ x: px, y: py - 1, z: pz, ry: R() * 6.28, s: (1 + R() * 1.4) * nearScale(px, pz), t: [sh2 * 0.95, sh2, sh2] }); }
        fields.push(field(pine, decoMat, LP));
        var eagleTex = sheet(8, 128, 64, drawEagle);
        for (var e2 = 0; e2 < 2; e2++){ var eg = animal(eagleTex, 26, 13, 0, ZP, { kind: 'eagle', r: 170 + e2 * 90, sp: 0.16 - e2 * 0.05, a0: e2 * 2.4, hy: 70 + e2 * 60 }); eg.material.depthWrite = false; eg.center.set(0.5, 0.5); group.add(eg); anim.push(eg); }
        var ibexTex = sheet(1, 96, 80, drawIbex);
        [[0.4, 62], [0.42, -70], [0.43, 44], [0.6, -58]].forEach(function(b){ var P1 = pathAt(b[0]); var ib = animal(ibexTex, 9, 7.5, P1[0] + b[1], P1[1] - 40, { kind: 'still', flip: b[1] < 0 }); group.add(ib); anim.push(ib); });
        var hut = merge([part(new THREE.BoxGeometry(18, 10, 14), 0x7A5234, M(0, 5, 0, 1, 1, 1)), part(new THREE.CylinderGeometry(12.5, 12.5, 20, 3, 1), 0x3B2F2B, M(0, 12.5, 0, 1, 0.55, 1, 0, 0, Math.PI / 2)), part(new THREE.BoxGeometry(2.4, 7, 2.4), 0x5A4A42, M(5, 15, 3, 1, 1, 1)), part(new THREE.BoxGeometry(3, 3, 0.4), 0xFFC66A, M(-4, 5, 7.2, 1, 1, 1)), part(new THREE.BoxGeometry(3, 3, 0.4), 0xFFC66A, M(4, 5, 7.2, 1, 1, 1))]);
        var hm = new THREE.Mesh(hut, decoMat); hm.castShadow = true; group.add(hm); D.snap.push([hm, CAMP.x + 10, CAMP.z - 40, -2]);
        D.smoke = []; for (var s2 = 0; s2 < 7; s2++){ var sm = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xDDE3EC, transparent: true, depthWrite: false, opacity: 0.4 })); sm.userData = { o: s2 / 7 }; group.add(sm); D.smoke.push(sm); }
      }
      if (name === 'dusk'){
        var rock = merge([part(new THREE.DodecahedronGeometry(1, 0), 0x8A4028, M(0, 0.4, 0, 1, 0.7, 1))]);
        var LR = [], t3 = 0, wantR = small ? 900 : 1800;
        while (LR.length < wantR && t3++ < wantR * 8){ var pk3 = pick(0.5), rx = pk3[0], rz = pk3[1];
          if (clearance(rx, rz) < 30 || nearCamp(rx, rz, 60)) continue; var ry = fn(rx, rz), zone = sstep(ZP - 950, ZP - 150, rz);
          if (R() > 0.2 + zone * 0.8 && ry < 70) continue; if (slope(rx, rz) > 1.3) continue; var sh3 = 0.8 + R() * 0.35;
          LR.push({ x: rx, y: ry - 0.5, z: rz, ry: R() * 6.28, rx: R(), rz: R(), s: 2 + R() * 7, sy: 0.7 + R() * 0.5, t: [sh3, sh3 * 0.9, sh3 * 0.85] }); }
        fields.push(field(rock, decoMat, LR));
        var palm = [part(new THREE.CylinderGeometry(0.6, 1.1, 20, 6), 0x6B4A2C, M(0, 10, 0, 1, 1, 1, 0, 0, 0.08))];
        for (var fr = 0; fr < 8; fr++){ palm.push(part(new THREE.PlaneGeometry(12, 2.6, 2, 1), fr % 2 ? 0x2F5A2A : 0x3A6A30, M(Math.cos(fr / 8 * 6.28) * 5.2, 18.8, Math.sin(fr / 8 * 6.28) * 5.2, 1, 1, 1, 0.55, -fr / 8 * 6.28, 0))); }
        var palmG = merge(palm), LPm = [];
        for (var pm = 0; pm < 30; pm++){ var pa = R() * 6.28, pr = 70 + R() * 70, pmx = CAMP.x + Math.cos(pa) * pr, pmz = CAMP.z + Math.sin(pa) * pr; LPm.push({ x: pmx, y: fn(pmx, pmz) - 1, z: pmz, ry: R() * 6.28, s: 0.8 + R() * 0.6, t: [1, 1, 1], rz: (R() - 0.5) * 0.25 }); }
        fields.push(field(palmG, decoMat2, LPm));
        var camelTex = sheet(8, 160, 120, function(g, ph){ drawCamel(g, ph, false); }), riderTex = sheet(8, 160, 120, function(g, ph){ drawCamel(g, ph, true); });
        for (var cm2 = 0; cm2 < 6; cm2++){ var cl2 = animal(cm2 === 0 ? riderTex : camelTex, 22, 16.5, -660 + cm2 * 46, -2960 - cm2 * 6, { kind: 'caravan', vx: 5.5, x0: -700, x1: 700, rate: 0.95, ph: cm2 * 0.7 }); group.add(cl2); anim.push(cl2); }
        var foxTex = sheet(8, 96, 64, drawFox); var fox = animal(foxTex, 7, 4.7, CAMP.x - 200, CAMP.z + 60, { kind: 'fox', next: 4, run: 0 }); fox.visible = false; group.add(fox); anim.push(fox);
        for (var rc2 = 0; rc2 < 3; rc2++){ var rest = animal(camelTex, 18, 13.5, CAMP.x + 40 + rc2 * 22, CAMP.z - 70 - rc2 * 8, { kind: 'still', frame: 2 + rc2 * 2 }); group.add(rest); anim.push(rest); }
        var btent = merge([part(new THREE.BoxGeometry(26, 7, 16), 0x3B2418, M(0, 3.5, 0, 1, 1, 1)), part(new THREE.CylinderGeometry(9, 9, 26, 3, 1), 0x4A2E1E, M(0, 7, 0, 1, 0.35, 1, 0, 0, Math.PI / 2))]);
        var bt = new THREE.Mesh(btent, decoMat); bt.castShadow = true; group.add(bt); D.snap.push([bt, CAMP.x - 34, CAMP.z - 40, 0]);
        fires.push(fireAt(group, CAMP.x - 10, fn(CAMP.x - 10, CAMP.z - 12), CAMP.z - 12));
      }
      fields.forEach(function(F){ group.add(F.mesh); });
      D.snap.forEach(function(s3){ s3[0].position.set(s3[1], fn(s3[1], s3[2]) + s3[3], s3[2]); });
      TH[name] = D; return D;
    }

    /* ---------- year signposts along the way up ---------- */
    function signTex(year){ return canvasTex(160, 200, function(g){ g.fillStyle = '#4A301C'; g.fillRect(72, 58, 16, 142); g.fillStyle = '#3A2414'; g.fillRect(84, 58, 4, 142);
      g.fillStyle = '#C99A5E'; g.beginPath(); g.moveTo(12, 22); g.lineTo(128, 22); g.lineTo(150, 50); g.lineTo(128, 78); g.lineTo(12, 78); g.closePath(); g.fill();
      g.strokeStyle = '#6A4526'; g.lineWidth = 5; g.stroke(); g.strokeStyle = 'rgba(106,69,38,.35)'; g.lineWidth = 1.5; for (var l = 0; l < 4; l++){ g.beginPath(); g.moveTo(18, 34 + l * 12); g.bezierCurveTo(60, 30 + l * 12, 90, 40 + l * 12, 124, 34 + l * 12); g.stroke(); }
      g.fillStyle = '#2E1A0C'; g.font = '700 38px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(year, 72, 52); }); }
    var SIGNS = SIGNDEF.map(function(sg0, q){
      var s = new THREE.Sprite(new THREE.SpriteMaterial({ map: signTex(sg0[1]), transparent: true, alphaTest: 0.4 })); s.center.set(0.5, 0.02); s.scale.set(20, 25, 1);
      s.userData = { x: SIGNPOS[q][0], z: SIGNPOS[q][1] }; scene.add(s); return s; });

    /* ---------- the summit flag: planted the first time you reach the top ----------
       It drops onto the peak, bites into the ground, wobbles upright and unfurls. The cloth
       carries the theme's emblem (moon, snowflake or sun), the same one pressed into the seal. */
    var FL = { h: 14, cw: 10.5, ch: 6.2, dx: 0, dz: 0, ry: -0.42, s: 0.62 };
    function flagTex(name){ return canvasTex(256, 152, function(g, w, h){
      var C = { night: ['#2B4A8F', '#E4EBFA'], morning: ['#23634A', '#FFFFFF'], dusk: ['#B3302A', '#F7D48C'] }[name];
      g.fillStyle = C[0]; g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(255,255,255,.1)'; g.fillRect(0, 0, w, 9); g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(0, h - 9, w, 9);
      g.save(); g.translate(w * 0.5, h * 0.5); g.fillStyle = C[1]; g.strokeStyle = C[1]; g.lineCap = 'round'; g.lineWidth = 8;
      if (name === 'night'){ g.beginPath(); g.arc(0, 0, 40, 0, Math.PI * 2); g.fill(); g.fillStyle = C[0]; g.beginPath(); g.arc(17, -14, 34, 0, Math.PI * 2); g.fill(); }
      else if (name === 'morning'){ for (var i = 0; i < 6; i++){ g.save(); g.rotate(i * Math.PI / 3); g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -44); g.moveTo(0, -27); g.lineTo(-12, -38); g.moveTo(0, -27); g.lineTo(12, -38); g.stroke(); g.restore(); } }
      else { g.beginPath(); g.arc(0, 0, 18, 0, Math.PI * 2); g.fill(); for (var j = 0; j < 12; j++){ g.save(); g.rotate(j * Math.PI / 6); g.beginPath(); g.moveTo(0, -28); g.lineTo(0, -44); g.stroke(); g.restore(); } }
      g.restore(); }); }
    var FLT = {}; THEMES.forEach(function(n){ FLT[n] = flagTex(n); });
    var flag = new THREE.Group(); flag.visible = false; scene.add(flag);
    var poleMat = new THREE.MeshStandardMaterial({ color: 0xD8DCE3, metalness: 0.5, roughness: 0.35, emissive: 0x202328 });
    var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.28, FL.h, 6), poleMat); pole.position.y = FL.h / 2; pole.castShadow = true; flag.add(pole);
    var knob = new THREE.Mesh(new THREE.SphereGeometry(0.46, 8, 6), poleMat); knob.position.y = FL.h + 0.25; flag.add(knob);
    var clothGeo = new THREE.PlaneGeometry(FL.cw, FL.ch, 16, 6); clothGeo.translate(FL.cw / 2 + 0.25, FL.h - FL.ch / 2 - 0.35, 0);
    var clothBase = Float32Array.from(clothGeo.attributes.position.array);
    var clothMat = new THREE.MeshStandardMaterial({ map: FLT[cur], emissiveMap: FLT[cur], emissive: 0x3A3A3A, side: THREE.DoubleSide, roughness: 0.85, metalness: 0 });
    var cloth = new THREE.Mesh(clothGeo, clothMat); cloth.castShadow = true; flag.add(cloth);
    var FLAG = { on: false, t: 0 };
    function plant(now){ if (FLAG.on) return; FLAG.on = true; FLAG.t = now ? 9 : 0; flag.visible = true; }
    document.addEventListener('summit:reached', function(){ plant(false); });
    function stepFlag(dt, pk, from, tm){
      if (!FLAG.on) return;
      FLAG.t += dt; var ft = FLAG.t, D = 0.55, fx = pk.x + FL.dx, fz = pk.z + FL.dz, gy = groundAt(fx, fz) - 0.6, want = FLT[tm > 0.5 ? cur : from];
      if (clothMat.map !== want){ clothMat.map = want; clothMat.emissiveMap = want; clothMat.needsUpdate = true; }
      var y = gy, spin = 0, rz = 0, rx = 0;
      if (ft < D){ var q = ft / D; y = gy + 44 * (1 - q * q); spin = (1 - q) * Math.PI * 2.2; rz = 0.35 * (1 - q); }
      else { var k = ft - D, dm = Math.exp(-k * 4.2); rz = 0.28 * dm * Math.sin(k * 17); rx = 0.12 * dm * Math.sin(k * 13 + 1); y = gy - 0.8 * dm * Math.max(0, Math.sin(k * 20)); }
      flag.position.set(fx, y, fz); flag.rotation.set(rx, FL.ry + spin, rz); flag.scale.setScalar(FL.s);
      var un = ft < D ? 0.06 : Math.min(1, 0.06 + (ft - D) / 0.75), ue = 1 - Math.pow(1 - un, 3), arr = clothGeo.attributes.position.array, wv = 0.75 + wind * 1.7;
      for (var c = 0; c < arr.length; c += 3){ var bx = clothBase[c] - 0.25, by = clothBase[c + 1], fr = bx / FL.cw;
        arr[c] = 0.25 + bx * ue; arr[c + 1] = by - fr * fr * 0.9 * (1 - wind * 0.6) * ue; arr[c + 2] = Math.sin(bx * 0.95 - time * (5.2 + wind * 3) + by * 0.4) * fr * wv * ue; }
      clothGeo.attributes.position.needsUpdate = true; clothGeo.computeVertexNormals();
    }

    /* ---------- post: heat shimmer, passing through cloud, a soft vignette ---------- */
    function rtW(){ return Math.floor(window.innerWidth * renderer.getPixelRatio()); } function rtH(){ return Math.floor(window.innerHeight * renderer.getPixelRatio()); }
    var rt = gl2 && THREE.WebGLMultisampleRenderTarget ? new THREE.WebGLMultisampleRenderTarget(rtW(), rtH(), { format: THREE.RGBAFormat }) : new THREE.WebGLRenderTarget(rtW(), rtH(), { format: THREE.RGBAFormat });
    if (rt.samples !== undefined) rt.samples = 4;
    var postU = { tDiffuse: { value: rt.texture }, uTime: { value: 0 }, uShimmer: { value: 0 }, uWhite: { value: 0 }, uWhiteCol: { value: new THREE.Color(1, 1, 1) }, uVig: { value: 0.35 } };
    var postScene = new THREE.Scene(), postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ uniforms: postU, depthTest: false, depthWrite: false,
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: ['uniform sampler2D tDiffuse; uniform float uTime, uShimmer, uWhite, uVig; uniform vec3 uWhiteCol; varying vec2 vUv;',
        'void main(){ vec2 uv = vUv; float band = uShimmer * smoothstep(0.75, 0.25, uv.y);',
        '  uv.x += (sin(uv.y * 160.0 + uTime * 3.2) * 0.0014 + sin(uv.y * 61.0 - uTime * 2.3) * 0.0011) * band; uv.y += cos(uv.x * 130.0 + uTime * 2.6) * 0.0009 * band;',
        '  vec3 c = texture2D(tDiffuse, uv).rgb; float w = uWhite * (0.82 + 0.18 * sin(uv.x * 9.0 + uv.y * 5.0 + uTime * 0.7)); c = mix(c, uWhiteCol, clamp(w, 0.0, 1.0));',
        '  vec2 d = vUv - 0.5; c *= 1.0 - uVig * dot(d, d) * 1.5; gl_FragColor = vec4(c, 1.0); }'].join('\n') })));

    /* ---------- scroll, pointer, tilt ---------- */
    var u = 0, uT = 0, pS = 0.62, maxS = 1, lastP = 0, vel = 0, wind = 0, windOff = new THREE.Vector2(), mx = 0, my = 0, cmx = 0, cmy = 0, tiltX = 0, tiltY = 0, dirBias = 0, camYs = null;
    function measure(){ var sm = document.getElementById('summit'); maxS = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      if (sm){ var r = sm.getBoundingClientRect(); pS = clamp((r.top + window.pageYOffset + r.height / 2 - window.innerHeight / 2) / maxS, 0.15, 0.95); } }
    function targetU(){ var p = clamp(window.pageYOffset / maxS, 0, 1); return p <= pS ? 0.5 * p / pS : 0.5 + 0.5 * (p - pS) / (1 - pS); }
    window.addEventListener('scroll', function(){ uT = targetU(); }, { passive: true });
    window.addEventListener('mousemove', function(e){ mx = e.clientX / window.innerWidth * 2 - 1; my = e.clientY / window.innerHeight * 2 - 1; }, { passive: true });
    window.addEventListener('deviceorientation', function(e){ if (e.gamma == null) return; tiltX = clamp(e.gamma / 30, -1, 1); tiltY = clamp((e.beta - 45) / 30, -1, 1); }, { passive: true });
    function resize(){ renderer.setSize(window.innerWidth, window.innerHeight); cam.aspect = window.innerWidth / window.innerHeight; cam.updateProjectionMatrix(); rt.setSize(rtW(), rtH()); measure(); uT = targetU(); }
    window.addEventListener('resize', resize); window.addEventListener('load', function(){ measure(); uT = targetU(); });
    setInterval(function(){ measure(); uT = targetU(); }, 2500);

    /* ---------- theme changes: a wave that sweeps out from where you stand ---------- */
    var morph = null, dist = new Float32Array(NV), cgx = 0, cgz = 0;
    function ensure(name){ if (!T[name]) buildGround(name); buildDeco(name); }
    function pushGround(){ for (var n = 0; n < NV; n++) pos[n * 3 + 1] = Hc[n]; posAttr.needsUpdate = true; colAttr.needsUpdate = true; rAttr.needsUpdate = true; }
    function finishMorph(){ if (!morph) return; var to = morph.to; Hc.set(T[to].h); Cc.set(T[to].c); Rc.set(T[to].r); pushGround();
      if (morph.from !== to) TH[morph.from].group.visible = false; TH[to].group.visible = true; TH[to].fields.forEach(function(F){ F.grow(function(){ return 1; }); });
      TH[to].snap.forEach(function(s3){ s3[0].position.y = groundAt(s3[1], s3[2]) + s3[3]; }); morph = null; geo.computeVertexNormals(); }
    function startMorph(to){
      if (!HF[to]) return; if (morph) finishMorph(); if (to === cur) return;
      ensure(to); var from = cur; cur = to;
      if (reduce){ morph = { from: from, to: to }; finishMorph(); return; }
      for (var jj = 0; jj <= NZ; jj++) for (var ii = 0; ii <= NX; ii++){ var dx = XS[ii] - cgx, dz = ZS[jj] - cgz; dist[jj * W1 + ii] = Math.sqrt(dx * dx + dz * dz); }
      [from, to].forEach(function(nm){ TH[nm].fields.forEach(function(F){ F.list.forEach(function(it){ var dx = it.x - cgx, dz = it.z - cgz; it.d = Math.sqrt(dx * dx + dz * dz); }); }); });
      TH[to].group.visible = true; TH[to].fields.forEach(function(F){ F.grow(function(){ return 0.001; }); });
      morph = { from: from, to: to, t: 0, dur: 3.0, max: 9000, band: 1100 }; wind = 1;
    }
    function waveAt(d, e){ return sstep(0, 1, (e * (morph.max + morph.band) - d) / morph.band); }
    function stepMorph(dt){
      morph.t = Math.min(1, morph.t + dt / morph.dur); var e = ease(morph.t), A = T[morph.from], B = T[morph.to], span = e * (morph.max + morph.band), bd = morph.band;
      for (var n = 0; n < NV; n++){ var f = (span - dist[n]) / bd; f = f <= 0 ? 0 : f >= 1 ? 1 : f * f * (3 - 2 * f);
        if (f === 0) Hc[n] = A.h[n]; else if (f === 1) Hc[n] = B.h[n]; else Hc[n] = A.h[n] + (B.h[n] - A.h[n]) * f + Math.sin(f * Math.PI) * 10;
        var o = n * 3; Cc[o] = A.c[o] + (B.c[o] - A.c[o]) * f; Cc[o + 1] = A.c[o + 1] + (B.c[o + 1] - A.c[o + 1]) * f; Cc[o + 2] = A.c[o + 2] + (B.c[o + 2] - A.c[o + 2]) * f; Rc[n] = A.r[n] + (B.r[n] - A.r[n]) * f; }
      pushGround();
      TH[morph.from].fields.forEach(function(F){ F.grow(function(it){ return Math.max(0.001, 1 - waveAt(it.d, e)); }); });
      TH[morph.to].fields.forEach(function(F){ F.grow(function(it){ var w = waveAt(it.d + 260, e); return Math.max(0.001, w < 1 ? w * (1 + Math.sin(w * Math.PI) * 0.25) : 1); }); });
      if (morph.t >= 1) finishMorph();
    }
    document.addEventListener('timechange', function(e){ startMorph(e.detail); });

    /* ---------- the render loop ---------- */
    var look = new THREE.Vector3(), tmpV = new THREE.Vector3(), fwd = new THREE.Vector3(), camRight = new THREE.Vector3(), sunDir = new THREE.Vector3(), whiteCol = new THREE.Color(), cTmp = new THREE.Color();
    var last = performance.now(), time = 0, intro = reduce ? 1 : 0;
    buildDeco(cur).group.visible = true;
    function orbDir(el, az, out){ var e = el * Math.PI / 180, a = az * Math.PI / 180; return out.set(Math.sin(a) * Math.cos(e), Math.sin(e), -Math.cos(a) * Math.cos(e)); }
    /* W3-11: if frames stay slow for a few seconds, render at a slightly lower resolution; step back up when there's headroom.
       Nothing else changes: every effect stays on. */
    var GOV = { max: renderer.getPixelRatio(), pr: renderer.getPixelRatio(), acc: 0, n: 0, slow: 0, fast: 0, t0: performance.now(), fps: 0 };
    function govern(ms){ GOV.acc += ms; GOV.n++; if (GOV.acc < 1500) return; var avg = GOV.acc / GOV.n; GOV.fps = 1000 / avg; GOV.acc = 0; GOV.n = 0;
      if (performance.now() - GOV.t0 < 7000 || morph || document.hidden) return;
      if (avg > 24){ GOV.slow++; GOV.fast = 0; } else if (avg < 12.5){ GOV.fast++; GOV.slow = 0; } else { GOV.slow = 0; GOV.fast = 0; }
      var to = GOV.pr; if (GOV.slow >= 2 && GOV.pr > 1) to = Math.max(1, GOV.pr - 0.25); else if (GOV.fast >= 6 && GOV.pr < GOV.max) to = Math.min(GOV.max, GOV.pr + 0.25);
      if (to !== GOV.pr){ GOV.pr = to; GOV.slow = GOV.fast = 0; renderer.setPixelRatio(to); resize(); } }
    var paused = false;
    function frame(now){
      requestAnimationFrame(frame);
      if (document.hidden || paused){ last = now; return; }
      var dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000)); last = now; time += dt; govern(dt * 1000);
      if (intro < 1) intro = Math.min(1, intro + dt / 2.6);
      u += (uT - u) * (reduce ? 1 : 1 - Math.exp(-dt * 5.5));
      var p = window.pageYOffset / maxS, v = (p - lastP) * maxS / dt; lastP = p; vel = lerp(vel, v, 0.2);
      wind = Math.max(wind * Math.exp(-dt * 1.4), clamp(Math.abs(vel) / 2600, 0, 1)); dirBias = lerp(dirBias, clamp(vel / 1800, -1, 1), 0.05);
      cmx += ((mx + tiltX) - cmx) * 0.05; cmy += ((my + tiltY) - cmy) * 0.05;
      if (morph) stepMorph(dt);

      /* where we are and what we look at */
      var tm = morph ? ease(morph.t) : 1, from = morph ? morph.from : cur;
      var pkA = T[from].peak, pkB = T[cur].peak, pk = { x: lerp(pkA.x, pkB.x, tm), z: lerp(pkA.z, pkB.z, tm), h: lerp(pkA.h, pkB.h, tm) };
      var Pp = pathAt(u), sw = 1 - sstep(0, 0.1, Math.abs(u - 0.5)); if (sw > 0){ Pp[0] = lerp(Pp[0], pk.x, sw); Pp[1] = lerp(Pp[1], pk.z + 40, sw); }
      var g0 = groundAt(Pp[0], Pp[1]), gm = Math.max(g0, groundAt(Pp[0] + 22, Pp[1]), groundAt(Pp[0] - 22, Pp[1]), groundAt(Pp[0], Pp[1] - 30), groundAt(Pp[0], Pp[1] + 22), groundAt(Pp[0], Pp[1] - 60) - 8);
      var cy = Math.max(g0 + Pp[2], gm + 14); cy = Math.max(cy, lerp(cy, pk.h + 30, sw * sw * (3 - 2 * sw))); camYs = camYs === null ? cy : lerp(camYs, cy, reduce ? 1 : 1 - Math.exp(-dt * 7)); camYs = Math.max(camYs, gm + 9);
      cam.position.set(Pp[0] + cmx * 14, camYs - cmy * 5 + Math.sin(time * 1.3) * 0.5, Pp[1]);
      cgx = Pp[0]; cgz = Pp[1];
      var campH = groundAt(CAMP.x, CAMP.z), w1 = sstep(0.4, 0.515, u), w2 = sstep(0.58, 0.86, u);
      look.set(lerp(lerp(pk.x, 0, w1), CAMP.x, w2) + cmx * 40,
               lerp(lerp(pk.h + 26, pk.h * 0.25, w1), campH + 14, w2) - cmy * 26 + dirBias * 24,
               lerp(lerp(pk.z, ZP - 2100, w1), CAMP.z - 150, w2));
      cam.lookAt(look);

      /* light and air for this height, blended across a theme change */
      var pal = palAt(cur, u); if (morph) pal = mixPal(palAt(morph.from, u), pal, tm);
      skyU.uTop.value.copy(pal.cTop); skyU.uMid.value.copy(pal.cMid); skyU.uHor.value.copy(pal.cHor); skyU.uMilky.value = pal.milky; skyU.uTime.value = time; skyU.uGlow.value = pal.glow;
      var clear = sstep(0, 1, intro); fog.color.copy(pal.cFog); fog.near = lerp(10, pal.near, clear); fog.far = lerp(420, pal.far, clear);
      hemi.color.copy(pal.cHs); hemi.groundColor.copy(pal.cHg); hemi.intensity = pal.hI;
      sky.position.copy(cam.position); stars.position.copy(cam.position); starU.uTime.value = time; starU.uOpacity.value = pal.stars;
      /* the orbs: the old one sets while the new one rises */
      var sunI = 0; tmpV.set(0, 0, 0);
      THEMES.forEach(function(nm){ var o = ORB[nm], w = nm === cur ? tm : (morph && nm === morph.from ? 1 - tm : 0);
        if (w <= 0.001){ o.visible = false; return; } o.visible = true; var pp = palAt(nm, u), el = pp.el - (1 - w) * 28;
        orbDir(el, pp.az, sunDir); o.position.copy(cam.position).addScaledVector(sunDir, 7000); var sz = pp.size * (nm === 'night' ? 1 : 1 + (1 - sstep(-2, 14, el)) * 0.25); o.scale.set(sz, sz, 1); if (nm === cur && WK.t < WK.d) o.scale.y = sz * winkF(WK.t);
        o.material.color.copy(pp.cSun); o.material.opacity = clamp(w * 1.6, 0, 1) * sstep(-6, 2, el);
        tmpV.addScaledVector(sunDir, w); sunI += pp.sI * w * sstep(-5, 6, el); if (w >= 0.5) skyU.uSunDir.value.copy(sunDir); });
      skyU.uSunCol.value.copy(pal.cSun);
      /* where the current orb sits on screen (for the wink), and the glint while it winks */
      var ob = ORB[cur]; if (ob && ob.visible && ob.material.opacity > 0.25){ orbP.copy(ob.position).project(cam); var hh = window.innerHeight / 2;
        orbS.vis = orbP.z < 1 && Math.abs(orbP.x) < 1.1 && Math.abs(orbP.y) < 1.1; orbS.x = (orbP.x + 1) * window.innerWidth / 2; orbS.y = (1 - orbP.y) * hh; orbS.r = ob.scale.x * (cur === 'night' ? 0.2 : 0.17) / (7000 * Math.tan(cam.fov * Math.PI / 360)) * hh; } else orbS.vis = false;
      if (WK.t < WK.d + 0.2){ WK.t += dt; var gt = (WK.t - 0.28) / 0.4; if (ob && gt > 0 && gt < 1){ var gs = Math.sin(gt * Math.PI); glint.visible = true; camUp.set(0, 1, 0).applyQuaternion(cam.quaternion); camRight.set(1, 0, 0).applyQuaternion(cam.quaternion);
        glint.position.copy(ob.position).addScaledVector(camRight, ob.scale.x * 0.17).addScaledVector(camUp, ob.scale.x * 0.17); glint.scale.set(ob.scale.x * 0.95 * gs, ob.scale.x * 0.95 * gs, 1); glint.material.opacity = gs; glint.material.rotation = gt * 0.9; } else glint.visible = false; }
      tmpV.normalize(); if (tmpV.y < 0.06){ tmpV.y = 0.06; tmpV.normalize(); }
      sun.color.copy(pal.cSun); sun.intensity = Math.max(0.15, sunI);
      fwd.set(look.x - cam.position.x, 0, look.z - cam.position.z).normalize();
      var fx = Math.round((cam.position.x + fwd.x * 700) / 8) * 8, fz = Math.round((cam.position.z + fwd.z * 700) / 8) * 8;
      sun.target.position.set(fx, 0, fz); sun.position.set(fx, 0, fz).addScaledVector(tmpV, 3000); sun.target.updateMatrixWorld();

      /* clouds: climb through them, then look down on them */
      var CLa = CLOUDS[from], CLb = CLOUDS[cur], white = 0, wsum = 0; whiteCol.setRGB(0, 0, 0);
      layers.forEach(function(L, n){ var a = CLa[n], b = CLb[n], ly = lerp(a[0], b[0], tm) * pk.h;
        L.mesh.position.set(cam.position.x, ly, cam.position.z); L.u.uCover.value = lerp(a[1], b[1], tm); L.u.uOpacity.value = lerp(a[2], b[2], tm) * (0.4 + 0.6 * clear); L.u.uScale.value = lerp(a[3], b[3], tm);
        L.u.uTop.value.copy(pal.cCl); L.u.uShade.value.copy(pal.cSh); L.u.uFog.value.copy(pal.cFog); L.u.uCam.value.copy(cam.position); L.u.uFar.value = pal.far * 1.1;
        L.u.uDrift.value += dt * (0.004 + wind * 0.05);
        var band = L.u.uOpacity.value * (1 - sstep(0, 30, Math.abs(cam.position.y - ly))) * 0.9; white = 1 - (1 - white) * (1 - band);
        cTmp.copy(pal.cCl).lerp(pal.cFog, 0.3).multiplyScalar(band); whiteCol.add(cTmp); wsum += band; });
      postU.uWhite.value = Math.min(0.86, white); if (wsum > 0.001) postU.uWhiteCol.value.copy(whiteCol).multiplyScalar(1 / wsum);

      /* weather */
      var WA = WEATHER[from], WB = WEATHER[cur], wx = lerp(WA[6], WB[6], tm), wWin = tm > 0.5 ? WB : WA;
      windOff.x += dt * (6 + wind * 160) * wx; windOff.y += dt * (2 + wind * 60) * wx;
      weaU.uTime.value = time; weaU.uWind.value.copy(windOff); weaU.uCam.value.copy(cam.position); weaU.uStreak.value = wind;
      weaU.uFall.value = wWin[0]; weaU.uSize.value = wWin[1] * (1 + wind * 0.4); weaU.uColor.value.setHex(wWin[4]); weaU.uShape.value = wWin[5];
      weaU.uCount.value = clamp(wWin[2] * (0.45 + wind * 1.1), 0, 1); weaU.uOpacity.value = wWin[3] * Math.abs(tm - 0.5) * 2 * clear;
      postU.uShimmer.value = ((from === 'dusk' ? 1 - tm : 0) + (cur === 'dusk' ? tm : 0)) * (1 - 0.6 * sstep(0.3, 0.5, u) * (1 - sstep(0.5, 0.75, u))); postU.uTime.value = time;

      /* the living things */
      camRight.set(1, 0, 0).applyQuaternion(cam.quaternion);
      THEMES.forEach(function(nm){ var D2 = TH[nm]; if (!D2 || !D2.group.visible) return;
        if (D2.flyU){ D2.flyU.uTime.value = time; D2.flyU.uOpacity.value = nm === cur ? tm : 1 - tm; D2.flyU.uScatter.value = lerp(D2.flyU.uScatter.value, wind, 0.08); }
        D2.fires.forEach(function(F){ var fl = 0.8 + Math.sin(time * 11) * 0.08 + Math.sin(time * 23.7) * 0.06 + Math.random() * 0.08; F.light.intensity = F.base * fl; F.flame.scale.set(24 * fl, 30 * fl, 1); });
        if (D2.smoke) D2.smoke.forEach(function(s){ var ph = (time * 0.12 + s.userData.o) % 1; s.position.set(CAMP.x + 15 + ph * 16, groundAt(CAMP.x + 10, CAMP.z - 40) + 20 + ph * 60, CAMP.z - 37); var z2 = 6 + ph * 26; s.scale.set(z2, z2, 1); s.material.opacity = 0.5 * Math.sin(ph * Math.PI); });
        D2.anim.forEach(function(a){ var ud = a.userData;
          if (ud.kind === 'owl'){ ud.t += dt; if (ud.t > ud.next){ ud.t = 0; ud.next = 2 + Math.random() * 7; ud.blink = 0.16; } if (ud.blink > 0){ ud.blink -= dt; a.scale.y = 0.4; } else a.scale.y = 2.5; }
          else if (ud.kind === 'deer'){ ud.ph += dt; if (ud.ph > ud.next){ ud.ph = 0; ud.next = 3 + Math.random() * 5; ud.up = !ud.up; } setFrame(a, ud.up ? 1 : 0); a.position.set(ud.x, groundAt(ud.x, ud.z), ud.z); }
          else if (ud.kind === 'walk' || ud.kind === 'caravan'){ ud.x += ud.vx * dt; if (ud.vx > 0 && ud.x > ud.x1) ud.x = ud.x0; if (ud.vx < 0 && ud.x < ud.x1) ud.x = ud.x0; ud.ph += dt * ud.rate; setFrame(a, ud.ph * 8 / 6.28 * 2.2);
            a.position.set(ud.x, groundAt(ud.x, ud.z), ud.z); var ed = Math.min(Math.abs(ud.x - ud.x0), Math.abs(ud.x - ud.x1)); a.material.opacity = sstep(0, 80, ed); }
          else if (ud.kind === 'eagle'){ var an = ud.a0 + time * ud.sp; a.position.set(pk.x + Math.cos(an) * ud.r, pk.h + ud.hy + Math.sin(time * 0.7 + ud.a0) * 10, pk.z + Math.sin(an) * ud.r);
            tmpV.set(-Math.sin(an), 0, Math.cos(an)); a.material.map.repeat.x = (tmpV.dot(camRight) < 0 ? -1 : 1) / 8; setFrame(a, Math.sin(time * 0.35 + ud.a0) > 0.2 ? 2 : time * 9); a.material.rotation = Math.sin(an * 2) * 0.12; }
          else if (ud.kind === 'fox'){ ud.next -= dt; if (!ud.run && ud.next < 0){ ud.run = 1; ud.x = CAMP.x - 240; a.visible = true; } if (ud.run){ ud.x += dt * 70; ud.ph += dt * 3; setFrame(a, ud.ph * 8 / 6.28 * 3); a.position.set(ud.x, groundAt(ud.x, ud.z), ud.z); if (ud.x > CAMP.x + 260){ ud.run = 0; a.visible = false; ud.next = 9 + Math.random() * 10; } } }
          else if (ud.kind === 'still'){ a.position.set(ud.x, groundAt(ud.x, ud.z), ud.z); } });
        if (morph) D2.snap.forEach(function(s3){ s3[0].position.y = groundAt(s3[1], s3[2]) + s3[3]; });
      });
      SIGNS.forEach(function(s){ s.position.set(s.userData.x, groundAt(s.userData.x, s.userData.z) - 0.5, s.userData.z); s.material.color.copy(pal.cSign); });
      stepFlag(dt, pk, from, tm);

      renderer.setRenderTarget(rt); renderer.render(scene, cam); renderer.setRenderTarget(null); renderer.render(postScene, postCam);
    }

    /* ---------- snapshots: the view from any point of the climb, for the altimeter previews ----------
       Rendered into a small target between frames; the next frame puts every light and uniform back. */
    var snapRT = null, snapBuf = null, snapCam = new THREE.PerspectiveCamera(52, 16 / 10, 2, 14000), snapCache = {};
    function snapshot(y, w, h){
      if (morph || !T[cur]) return null;
      w = Math.round(w || 360); h = Math.round(h || 216);
      var key = cur + ':' + Math.round(y / 12) + ':' + w + 'x' + h; if (snapCache[key]) return snapCache[key];
      if (!snapRT || snapRT.width !== w || snapRT.height !== h){ if (snapRT) snapRT.dispose(); snapRT = new THREE.WebGLRenderTarget(w, h); snapBuf = new Uint8Array(w * h * 4); }
      var p = clamp(y / maxS, 0, 1), uu = p <= pS ? 0.5 * p / pS : 0.5 + 0.5 * (p - pS) / (1 - pS), pk = T[cur].peak;
      var Pp = pathAt(uu), sw = 1 - sstep(0, 0.1, Math.abs(uu - 0.5)); if (sw > 0){ Pp[0] = lerp(Pp[0], pk.x, sw); Pp[1] = lerp(Pp[1], pk.z + 40, sw); }
      var g0 = groundAt(Pp[0], Pp[1]), gm = Math.max(g0, groundAt(Pp[0] + 22, Pp[1]), groundAt(Pp[0] - 22, Pp[1]), groundAt(Pp[0], Pp[1] - 30), groundAt(Pp[0], Pp[1] + 22), groundAt(Pp[0], Pp[1] - 60) - 8);
      var cy = Math.max(g0 + Pp[2], gm + 14); cy = Math.max(cy, lerp(cy, pk.h + 30, sw * sw * (3 - 2 * sw)), gm + 9);
      snapCam.aspect = w / h; snapCam.updateProjectionMatrix(); snapCam.position.set(Pp[0], cy, Pp[1]);
      var campH = groundAt(CAMP.x, CAMP.z), w1 = sstep(0.4, 0.515, uu), w2 = sstep(0.58, 0.86, uu);
      snapCam.lookAt(lerp(lerp(pk.x, 0, w1), CAMP.x, w2), lerp(lerp(pk.h + 26, pk.h * 0.25, w1), campH + 14, w2), lerp(lerp(pk.z, ZP - 2100, w1), CAMP.z - 150, w2));
      var pal = palAt(cur, uu);
      skyU.uTop.value.copy(pal.cTop); skyU.uMid.value.copy(pal.cMid); skyU.uHor.value.copy(pal.cHor); skyU.uMilky.value = pal.milky; skyU.uGlow.value = pal.glow; skyU.uSunCol.value.copy(pal.cSun);
      fog.color.copy(pal.cFog); fog.near = pal.near; fog.far = pal.far; hemi.color.copy(pal.cHs); hemi.groundColor.copy(pal.cHg); hemi.intensity = pal.hI;
      sky.position.copy(snapCam.position); stars.position.copy(snapCam.position); starU.uOpacity.value = pal.stars;
      THEMES.forEach(function(nm){ var o = ORB[nm]; if (nm !== cur){ o.visible = false; return; } o.visible = true; orbDir(pal.el, pal.az, sunDir);
        o.position.copy(snapCam.position).addScaledVector(sunDir, 7000); o.scale.set(pal.size, pal.size, 1); o.material.color.copy(pal.cSun); o.material.opacity = sstep(-6, 2, pal.el); skyU.uSunDir.value.copy(sunDir); });
      sun.color.copy(pal.cSun); sun.intensity = Math.max(0.15, pal.sI * sstep(-5, 6, pal.el));
      var CL = CLOUDS[cur]; layers.forEach(function(L, n){ var a = CL[n]; L.mesh.position.set(snapCam.position.x, a[0] * pk.h, snapCam.position.z); L.u.uCover.value = a[1]; L.u.uOpacity.value = a[2]; L.u.uScale.value = a[3];
        L.u.uTop.value.copy(pal.cCl); L.u.uShade.value.copy(pal.cSh); L.u.uFog.value.copy(pal.cFog); L.u.uCam.value.copy(snapCam.position); L.u.uFar.value = pal.far * 1.1; });
      var wo = weaU.uOpacity.value; weaU.uOpacity.value = 0;
      renderer.setRenderTarget(snapRT); renderer.render(scene, snapCam); renderer.readRenderTargetPixels(snapRT, 0, 0, w, h, snapBuf); renderer.setRenderTarget(null); weaU.uOpacity.value = wo;
      var cv = document.createElement('canvas'); cv.width = w; cv.height = h; var g2 = cv.getContext('2d'), img = g2.createImageData(w, h);
      for (var r = 0; r < h; r++) img.data.set(snapBuf.subarray((h - 1 - r) * w * 4, (h - r) * w * 4), r * w * 4);
      g2.putImageData(img, 0, 0); snapCache[key] = cv; return cv;
    }
    document.addEventListener('timechange', function(){ snapCache = {}; });
    window.addEventListener('resize', function(){ snapCache = {}; });

    measure(); uT = u = targetU(); lastP = window.pageYOffset / maxS;
    var smEl = document.getElementById('summit'); if (smEl && smEl.classList.contains('made')) plant(true);
    frame(performance.now());
    root.classList.add('has-3d');
    /* build the other two worlds while the page is idle, so switching is instant */
    var rest = THEMES.filter(function(n){ return n !== cur; });
    function idle(fn){ if (window.requestIdleCallback) window.requestIdleCallback(fn, { timeout: 2500 }); else setTimeout(fn, 60); }
    setTimeout(function(){ idle(function(){ ensure(rest[0]); idle(function(){ ensure(rest[1]); }); }); }, 1800);
    window.__climb = { summit: function(){ return pS; }, u: function(){ return u; } };
    window.__world = { jump: function(){ uT = targetU(); u = uT; camYs = null; }, morphAt: function(t){ if (morph){ morph.t = Math.min(0.999, t); stepMorph(0); } }, groundAt: groundAt, theme: function(){ return cur; }, peak: function(){ return T[cur].peak; }, snapshot: snapshot, orb: function(){ return orbS; }, wink: function(){ if (WK.t < WK.d) return false; WK.t = 0; return true; }, debug: debugView, gust: function(k){ wind = Math.max(wind, k == null ? 1 : k); }, quality: function(){ return { pr: GOV.pr, max: GOV.max, fps: GOV.fps }; }, pause: function(v){ paused = !!v; }, paused: function(){ return paused; }, flag: function(){ return { on: FLAG.on, t: FLAG.t, pos: flag.position.toArray() }; }, flagAt: function(t){ if (FLAG.on) FLAG.t = t; }, flagCfg: FL };
  }
  try { init(); } catch (err){
    root.classList.remove('has-3d'); root.classList.add('no-3d');
    if (window.console) console.warn('3D environment disabled:', err);
  }
})();
