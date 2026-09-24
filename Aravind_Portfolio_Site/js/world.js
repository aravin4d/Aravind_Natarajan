/* The climb: a 3D Alpine range behind the page.
   Scrolling (the page's main interaction) flies the camera up the valley
   toward the main peak: haze first, then the mountain clears and grows.
   The three themes are the same mountain at morning, dusk and night.
   Renders only when something changes, so it costs almost nothing idle.
   If WebGL is unavailable, or the device asks to save data, the page
   uses the painted fallback in the CSS instead. */
(function(){
  'use strict';
  var root = document.documentElement, canvas = document.getElementById('world');
  var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var small = Math.min(window.innerWidth, window.innerHeight) < 720;
  var conn = navigator.connection || {};
  var weak = !!conn.saveData || (navigator.deviceMemory && navigator.deviceMemory < 3);
  if (!canvas || typeof THREE === 'undefined' || weak){ root.classList.add('no-3d'); return; }
  var renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: !small, alpha: false, powerPreference: 'high-performance' }); }
  catch (e){ root.classList.add('no-3d'); return; }

  function init(){
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.25 : 1.75));
    renderer.setSize(window.innerWidth, window.innerHeight);
    var scene = new THREE.Scene();
    var cam = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 7000);
    var fog = new THREE.Fog(0xffffff, 40, 700); scene.fog = fog;
    var hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6); scene.add(hemi);
    var sun = new THREE.DirectionalLight(0xffffff, 1); scene.add(sun);

    /* ---------- terrain ---------- */
    var perm = new Uint8Array(512);
    (function(){ var p = [], s = 20171, i, j, t; for (i = 0; i < 256; i++) p[i] = i;
      for (i = 255; i > 0; i--){ s = (s * 16807) % 2147483647; j = s % (i + 1); t = p[i]; p[i] = p[j]; p[j] = t; }
      for (i = 0; i < 512; i++) perm[i] = p[i & 255]; })();
    function fade(t){ return t * t * t * (t * (t * 6 - 15) + 10); }
    function lerp(a, b, t){ return a + (b - a) * t; }
    function grad(h, x, y){ switch (h & 7){ case 0: return x + y; case 1: return -x + y; case 2: return x - y; case 3: return -x - y; case 4: return x; case 5: return -x; case 6: return y; default: return -y; } }
    function noise(x, y){
      var X = Math.floor(x) & 255, Y = Math.floor(y) & 255; x -= Math.floor(x); y -= Math.floor(y);
      var u = fade(x), v = fade(y), a = perm[X] + Y, b = perm[X + 1] + Y;
      return lerp(lerp(grad(perm[a], x, y), grad(perm[b], x - 1, y), u), lerp(grad(perm[a + 1], x, y - 1), grad(perm[b + 1], x - 1, y - 1), u), v);
    }
    function ridged(x, y){ var sum = 0, amp = 1, f = 1, norm = 0; for (var o = 0; o < 5; o++){ var n = 1 - Math.abs(noise(x * f, y * f)); sum += n * n * amp; norm += amp; amp *= 0.5; f *= 2.03; } return sum / norm; }
    function gauss(x, z, cx, cz, r){ var dx = x - cx, dz = z - cz; return Math.exp(-(dx * dx + dz * dz) / (2 * r * r)); }
    function height(x, z){
      var base = ridged(x * 0.0024 + 11, z * 0.0024 + 7) * 150;
      var peaks = 460 * gauss(x, z, 0, -1150, 240) + 260 * gauss(x, z, -560, -950, 210) + 300 * gauss(x, z, 600, -1000, 220)
                + 170 * gauss(x, z, -300, -620, 150) + 180 * gauss(x, z, 330, -560, 150) + 140 * gauss(x, z, -700, -300, 180) + 150 * gauss(x, z, 720, -260, 180);
      var along = z > -720 ? 1 : Math.exp(-((z + 720) * (z + 720)) / (2 * 260 * 260));
      var valley = 1 - 0.86 * Math.exp(-(x * x) / (2 * 160 * 160)) * along;
      return Math.max(0, (base + peaks * (0.72 + 0.56 * ridged(x * 0.006, z * 0.006))) * valley - 10);
    }
    var SEG = small ? 110 : 180;
    var geo = new THREE.PlaneGeometry(2600, 2800, SEG, SEG); geo.rotateX(-Math.PI / 2); geo.translate(0, 0, -900);
    var pos = geo.attributes.position;
    for (var i = 0; i < pos.count; i++) pos.setY(i, height(pos.getX(i), pos.getZ(i)));
    geo.computeVertexNormals();
    var nor = geo.attributes.normal, cols = new Float32Array(pos.count * 3), c = new THREE.Color();
    var FOREST = new THREE.Color(0x2F4636), ROCK = new THREE.Color(0x6D6862), ROCK2 = new THREE.Color(0x4B4744), SNOW = new THREE.Color(0xF3F6FA);
    for (i = 0; i < pos.count; i++){
      var y = pos.getY(i), ny = nor.getY(i), n1 = noise(pos.getX(i) * 0.02, pos.getZ(i) * 0.02);
      var snowLine = 205 + n1 * 45, steep = ny < 0.62;
      if (y > snowLine && !steep) c.copy(SNOW);
      else if (y > snowLine - 25 && ny > 0.75) c.copy(SNOW).lerp(ROCK, 0.35);
      else if (y < 55 + n1 * 20 && ny > 0.7) c.copy(FOREST).lerp(ROCK2, 0.25 + n1 * 0.2);
      else c.copy(ROCK).lerp(ROCK2, 0.5 + n1 * 0.5);
      cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    scene.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1, metalness: 0 })));

    /* ---------- sky, sun or moon, stars, haze ---------- */
    function canvasTex(w, h, draw){ var cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); return new THREE.CanvasTexture(cv); }
    function skyTex(stops){ return canvasTex(4, 256, function(g, w, h){ var gr = g.createLinearGradient(0, 0, 0, h); stops.forEach(function(s){ gr.addColorStop(s[0], s[1]); }); g.fillStyle = gr; g.fillRect(0, 0, w, h); }); }
    var glowTex = canvasTex(128, 128, function(g, w){ var r = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.18, 'rgba(255,255,255,.85)'); r.addColorStop(0.45, 'rgba(255,255,255,.22)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, w, w); });
    var hazeTex = canvasTex(256, 128, function(g, w, h){ for (var k = 0; k < 16; k++){ var x = 30 + Math.random() * (w - 60), y = h * 0.35 + Math.random() * h * 0.35, r = 28 + Math.random() * 40, gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); } });
    var orb = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, fog: false }));
    scene.add(orb);
    var SN = small ? 500 : 1100, sp = new Float32Array(SN * 3);
    for (i = 0; i < SN; i++){ sp[i * 3] = (Math.random() - 0.5) * 7000; sp[i * 3 + 1] = 250 + Math.random() * 2200; sp[i * 3 + 2] = -3200 - Math.random() * 600; }
    var sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
    var stars = new THREE.Points(sg, new THREE.PointsMaterial({ size: 5, map: glowTex, color: 0xE4EAFF, transparent: true, opacity: 0, depthWrite: false, fog: false, blending: THREE.AdditiveBlending }));
    scene.add(stars);
    var hazeMat = new THREE.SpriteMaterial({ map: hazeTex, transparent: true, depthWrite: false, opacity: 0.6 }), hazes = [];
    for (i = 0; i < 9; i++){ var hz = new THREE.Sprite(hazeMat); hz.position.set((Math.random() - 0.5) * 700, 60 + Math.random() * 90, 260 - i * 110); var s = 420 + Math.random() * 300; hz.scale.set(s, s * 0.4, 1); scene.add(hz); hazes.push(hz); }

    var TIMES = {
      morning: { sky: [[0, '#7FAEE3'], [0.5, '#BFD8F1'], [0.85, '#E9EEF4'], [1, '#F4F1EA']], fog: 0xDDE6EF, hemi: [0xE2ECF7, 0x6B6258, 0.8], sun: [0xFFF3DE, 1.25, 500, 700, 300],
                 orb: [0xFFF6E4, -900, 820, -3000, 900], stars: 0, haze: 0xFFFFFF },
      dusk:    { sky: [[0, '#1E0F1C'], [0.45, '#5B2330'], [0.78, '#C4553A'], [1, '#EE9A58']], fog: 0x8A3F31, hemi: [0xFFB48A, 0x2A1410, 0.55], sun: [0xFF9459, 1.45, -900, 160, -1400],
                 orb: [0xFFA66A, -700, 230, -3000, 1400], stars: 0.18, haze: 0xF2A07A },
      night:   { sky: [[0, '#03060F'], [0.55, '#0B1631'], [0.85, '#1B3160'], [1, '#2C4B80']], fog: 0x0F1C38, hemi: [0x6F8FC8, 0x090E1C, 0.45], sun: [0xC4D6FF, 0.7, 400, 600, -800],
                 orb: [0xF4F1E6, 800, 900, -3000, 520], stars: 0.95, haze: 0x9FB8E8 }
    };
    var tod = 'dusk', T = TIMES.dusk, bgCache = {};
    function setTime(name){
      tod = TIMES[name] ? name : 'dusk'; T = TIMES[tod];
      scene.background = bgCache[tod] || (bgCache[tod] = skyTex(T.sky));
      fog.color.setHex(T.fog);
      hemi.color.setHex(T.hemi[0]); hemi.groundColor.setHex(T.hemi[1]); hemi.intensity = T.hemi[2];
      sun.color.setHex(T.sun[0]); sun.intensity = T.sun[1]; sun.position.set(T.sun[2], T.sun[3], T.sun[4]);
      orb.material.color.setHex(T.orb[0]); orb.scale.set(T.orb[4], T.orb[4], 1);
      stars.material.opacity = T.stars; hazeMat.color.setHex(T.haze);
      dirty = true;
    }

    /* ---------- scroll drives the climb ---------- */
    var p = 0, pT = 0, mx = 0, my = 0, cmx = 0, cmy = 0, intro = reduce ? 1 : 0, introStart = performance.now(), dirty = true;
    function progress(){ var max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight); return Math.min(1, Math.max(0, window.pageYOffset / max)); }
    function ease(t){ return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
    function smooth(a, b, t){ t = Math.min(1, Math.max(0, (t - a) / (b - a))); return t * t * (3 - 2 * t); }
    var look = new THREE.Vector3();
    function place(){
      var e = ease(p), reveal = smooth(0.02, 0.7, p);
      cam.position.set(Math.sin(p * Math.PI * 1.2) * 26 + cmx * 14, lerp(64, 250, e) - cmy * 8, lerp(380, -500, e));
      look.set(cmx * 30, lerp(118, 330, e), -1150); cam.lookAt(look);
      var clear = reveal * (0.35 + 0.65 * intro);
      fog.near = lerp(18, 420, clear); fog.far = lerp(460, 3600, clear);
      for (var k = 0; k < hazes.length; k++) hazes[k].material.opacity = Math.max(0, 0.62 * (1 - p * 3.2)) * (0.5 + 0.5 * (1 - intro));
      var o = T.orb, rise = tod === 'night' ? p * 420 : (tod === 'dusk' ? -p * 160 : p * 120);
      orb.position.set(o[1], o[2] + rise, o[3]);
    }
    window.addEventListener('scroll', function(){ pT = progress(); dirty = true; }, { passive: true });
    window.addEventListener('mousemove', function(e){ mx = e.clientX / window.innerWidth * 2 - 1; my = e.clientY / window.innerHeight * 2 - 1; dirty = true; }, { passive: true });
    window.addEventListener('resize', function(){ renderer.setSize(window.innerWidth, window.innerHeight); cam.aspect = window.innerWidth / window.innerHeight; cam.updateProjectionMatrix(); pT = progress(); dirty = true; });
    document.addEventListener('timechange', function(e){ setTime(e.detail); if (root.classList.contains('vt-running')) { place(); renderer.render(scene, cam); } });
    function frame(now){
      requestAnimationFrame(frame);
      if (intro < 1){ intro = Math.min(1, (now - introStart) / 2200); dirty = true; }
      var dp = pT - p, dmx = mx - cmx, dmy = my - cmy;
      if (Math.abs(dp) > 0.0002 || Math.abs(dmx) > 0.002 || Math.abs(dmy) > 0.002){ p += dp * (reduce ? 1 : 0.085); cmx += dmx * 0.05; cmy += dmy * 0.05; dirty = true; }
      if (!dirty || document.documentElement.classList.contains('dlg-open') && !root.classList.contains('vt-running')) return;
      dirty = false; place(); renderer.render(scene, cam);
    }
    setTime(root.getAttribute('data-time') || 'dusk');
    pT = p = progress(); place(); renderer.render(scene, cam);
    root.classList.add('has-3d');
    requestAnimationFrame(frame);
    window.__world = { height: height, setTime: setTime };
  }
  try { init(); } catch (err){
    root.classList.remove('has-3d'); root.classList.add('no-3d');
    if (window.console) console.warn('3D environment disabled:', err);
  }
})();
