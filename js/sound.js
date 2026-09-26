/* W3-07 sound, off until you turn it on. Everything is made in Web Audio as it plays: there are no
   files to load. The ambience follows the theme and where you are on the mountain (wind that picks
   up near the summit and when you scroll fast, crickets and a far-off owl at night, cowbells in the
   morning, a sand hiss and a camel bell at dusk, the camp fire at basecamp). One-shots follow the page:
   paper folding, the knife, the doors, the bell, a pen signing the letter, the lantern catching.
   Your choice is remembered, sound pauses while the tab is hidden, and nothing ever plays until you
   have touched the page. */
(function(){
  'use strict';
  var S = window.__site; if (!S) return;
  var root = document.documentElement, btn = document.querySelector('.snd'), AC = window.AudioContext || window.webkitAudioContext;
  if (!AC){ if (btn) btn.hidden = true; return; }
  var ctx = null, master, sfxBus, ambBus, verbIn, an = null, NB = null, BB = null, on = false, amb = null, steps = 0;
  var want = false; try { want = localStorage.getItem('av-sound') === '1'; } catch (e){}
  function R(a, b){ return a + Math.random() * (b - a); }
  function clamp(v, a, b){ return v < a ? a : v > b ? b : v; }
  function theme(){ var t = root.getAttribute('data-time'); return t === 'night' || t === 'morning' ? t : 'dusk'; }

  function init(){
    if (ctx) return true;
    try { ctx = new AC({ latencyHint: 'interactive' }); } catch (e){ try { ctx = new AC(); } catch (e2){ ctx = null; return false; } }
    master = ctx.createGain(); master.gain.value = 0.0001;
    var comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.knee.value = 10; comp.ratio.value = 3.5; comp.attack.value = 0.003; comp.release.value = 0.25;
    master.connect(comp); comp.connect(ctx.destination);
    an = ctx.createAnalyser(); an.fftSize = 2048; comp.connect(an);
    sfxBus = ctx.createGain(); sfxBus.gain.value = 0.85; sfxBus.connect(master);
    ambBus = ctx.createGain(); ambBus.gain.value = 0.5; ambBus.connect(master);
    var n = ctx.sampleRate * 3, w = ctx.createBuffer(1, n, ctx.sampleRate), b = ctx.createBuffer(1, n, ctx.sampleRate), wd = w.getChannelData(0), bd = b.getChannelData(0), last = 0;
    for (var i = 0; i < n; i++){ var r = Math.random() * 2 - 1; wd[i] = r; last = (last + 0.02 * r) / 1.02; bd[i] = last * 3.5; }
    NB = w; BB = b;
    var L = Math.floor(ctx.sampleRate * 2.8), ir = ctx.createBuffer(2, L, ctx.sampleRate);
    for (var c = 0; c < 2; c++){ var d = ir.getChannelData(c); for (var j = 0; j < L; j++) d[j] = (Math.random() * 2 - 1) * Math.pow(1 - j / L, 2.6); }
    var verb = ctx.createConvolver(); verb.buffer = ir; verbIn = ctx.createGain(); verbIn.gain.value = 0.3; var vo = ctx.createGain(); vo.gain.value = 0.85;
    verbIn.connect(verb); verb.connect(vo); vo.connect(master);
    return true;
  }

  /* ---------- building blocks ---------- */
  function out(node, pan, wet, bus){ var n = node; if (pan && ctx.createStereoPanner){ var p = ctx.createStereoPanner(); p.pan.value = clamp(pan, -1, 1); n.connect(p); n = p; }
    n.connect(bus || sfxBus); if (wet){ var s = ctx.createGain(); s.gain.value = wet; n.connect(s); s.connect(verbIn); } }
  function env(p, t, a, peak, d){ p.setValueAtTime(0.0001, t); p.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a); p.exponentialRampToValueAtTime(0.0001, t + a + d); }
  function noise(t, o){
    var a = o.a || 0.005, d = o.d || 0.1, s = ctx.createBufferSource(); s.buffer = o.brown ? BB : NB; s.loop = true; if (o.rate) s.playbackRate.value = o.rate;
    var f = ctx.createBiquadFilter(); f.type = o.type || 'bandpass'; f.frequency.setValueAtTime(o.f || 1200, t); if (o.f2) f.frequency.exponentialRampToValueAtTime(o.f2, t + a + d); f.Q.value = o.q == null ? 1 : o.q;
    var g = ctx.createGain(); env(g.gain, t, a, o.g || 0.2, d); s.connect(f); f.connect(g); out(g, o.pan, o.wet, o.bus);
    s.start(t, Math.random() * 2); s.stop(t + a + d + 0.05);
  }
  function tone(t, o){
    var a = o.a || 0.004, d = o.d || 0.2, s = ctx.createOscillator(); s.type = o.type || 'sine'; s.frequency.setValueAtTime(o.f, t);
    if (o.f2) s.frequency.exponentialRampToValueAtTime(o.f2, t + (o.glide || a + d));
    var g = ctx.createGain(); env(g.gain, t, a, o.g || 0.1, d); s.connect(g); var n = g;
    if (o.lp){ var f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.lp; g.connect(f); n = f; }
    out(n, o.pan, o.wet, o.bus); s.start(t); s.stop(t + a + d + 0.05);
  }
  function ring(t, fs, g, d, pan, wet, bus, lp){ fs.forEach(function(f, i){ tone(t, { f: f * R(0.997, 1.003), d: d * (1 - i * 0.12), a: 0.002, g: g / (1 + i * 0.7), pan: pan, wet: wet, bus: bus, lp: lp }); }); }
  /* a sheet of paper creasing: a soft body, a few crackles, the crease settling */
  function paper(t, d, g, pan){
    noise(t, { d: d, a: d * 0.35, g: g * 0.55, type: 'bandpass', f: R(1800, 2600), f2: R(900, 1300), q: 0.7, pan: pan, wet: 0.08 });
    for (var i = 0, k = 3 + (Math.random() * 3 | 0); i < k; i++) noise(t + R(0, d * 0.8), { d: R(0.012, 0.035), a: 0.002, g: g * R(0.4, 1), type: 'highpass', f: R(2800, 4800), q: 0.5, pan: pan });
    noise(t + d * 0.85, { d: 0.08, a: 0.004, g: g * 0.35, type: 'lowpass', f: 700, q: 0.7, pan: pan });
  }
  function thud(t, g, f){ f = f || 110; tone(t, { f: f, f2: f * 0.5, d: 0.16, a: 0.003, g: g }); noise(t, { d: 0.05, a: 0.002, g: g * 0.5, type: 'lowpass', f: 500, q: 0.7 }); }
  function creak(t, d, g, pan){
    var s = ctx.createOscillator(), f0 = R(130, 190); s.type = 'sawtooth'; s.frequency.setValueAtTime(f0, t); s.frequency.linearRampToValueAtTime(f0 * R(1.25, 1.5), t + d * 0.6); s.frequency.linearRampToValueAtTime(f0 * 1.1, t + d);
    var bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = R(700, 1100); bp.Q.value = 4;
    var tr = ctx.createGain(); tr.gain.value = 0.5; var lfo = ctx.createOscillator(); lfo.frequency.value = R(18, 30); var lg = ctx.createGain(); lg.gain.value = 0.5; lfo.connect(lg); lg.connect(tr.gain);
    var gg = ctx.createGain(); env(gg.gain, t, d * 0.3, g, d * 0.7); s.connect(bp); bp.connect(tr); tr.connect(gg); out(gg, pan, 0.15);
    s.start(t); s.stop(t + d + 0.05); lfo.start(t); lfo.stop(t + d + 0.05);
  }
  function scratch(t, d, g){ noise(t, { d: d, a: 0.02, g: g, type: 'bandpass', f: R(3800, 5200), q: 2.2, pan: R(-0.15, 0.15) });
    for (var i = 0, n = Math.max(2, d / 0.06 | 0); i < n; i++) noise(t + i * d / n + R(0, 0.02), { d: 0.012, a: 0.002, g: g * 0.6, type: 'highpass', f: 6000, q: 0.6 }); }
  function bell(t, f, g, wet){ [[0.5, 3.4, 0.5], [1, 3, 1], [1.19, 2.2, 0.45], [1.56, 1.8, 0.35], [2, 1.5, 0.3], [2.51, 1.1, 0.2], [3.01, 0.8, 0.16]].forEach(function(p){ tone(t, { f: f * p[0], d: p[1], a: 0.004, g: g * p[2], wet: wet }); }); }
  function hoot(t){ var p = R(-0.6, 0.6); tone(t, { f: 380, f2: 340, d: 0.42, a: 0.06, g: 0.022, wet: 0.8, bus: ambBus, pan: p }); tone(t + 0.6, { f: 365, f2: 320, d: 0.62, a: 0.07, g: 0.02, wet: 0.8, bus: ambBus, pan: p }); }
  function pan01(x){ return ((x == null ? 0.5 : x) * 2 - 1); }

  /* ---------- one-shots ---------- */
  var SND = {
    unfold: function(t, o){ var n = o.n || 3, at = Math.max(0, (o.at || 200) / 1000), st = (o.st || 110) / 1000, u = (o.u || 300) / 1000, g = o.letter ? 0.14 : 0.18;
      if (n < 2) paper(t, 0.25, g, 0); for (var k = 1; k < n; k++) paper(t + at + (k - 1) * st, u * 0.75, g, k % 2 ? -0.25 : 0.25); },
    fold: function(t, o){ var n = o.n || 3, st = (o.st || 75) / 1000, u = (o.u || 220) / 1000; for (var k = 1; k < n; k++) paper(t + (k - 1) * st, u * 0.6, 0.12, k % 2 ? 0.2 : -0.2); thud(t + Math.max(0, n - 1) * st + u * 0.5, 0.05, 160); },
    cut: function(t, o){ var d = (o.dur || 420) / 1000, p = (o.k || 0) % 2 ? 0.3 : -0.3;
      noise(t + d * 0.05, { d: d * 0.55, a: d * 0.4, g: 0.2, type: 'bandpass', f: 700, f2: 5600, q: 1.3, pan: p, wet: 0.15 });
      ring(t + d * 0.5, [3150, 4720, 6230, 8120], 0.045, 0.9, -p, 0.25);
      noise(t + d * 0.5, { d: 0.06, a: 0.002, g: 0.16, type: 'highpass', f: 2500, q: 0.7, pan: -p }); },
    whoosh: function(t, o){ var d = o.d || 0.9; noise(t, { d: d * 0.6, a: d * 0.4, g: 0.16, type: 'bandpass', f: 280, f2: 1700, q: 0.8, wet: 0.3 }); },
    plane: function(t, o){ var F = o.fold || [0, 170, 320, 460]; for (var i = 1; i < F.length; i++) paper(t + Math.max(0, F[i] / 1000 - 0.08), 0.14, 0.1, 0);
      var at = (o.at || 520) / 1000, fly = (o.fly || 700) / 1000; noise(t + at, { d: fly * 0.7, a: fly * 0.3, g: 0.14, type: 'bandpass', f: 500, f2: 2600, q: 1.1, pan: pan01(o.x), wet: 0.25 }); },
    doors: function(t, o){ var n = Math.min(o.n || 4, 6), gap = (o.gap || 115) / 1000; for (var i = 0; i < n; i++){ var p = i / Math.max(1, n - 1) * 1.2 - 0.6; creak(t + i * gap, 0.5, 0.03, p); thud(t + i * gap + 0.52, 0.07, 95); } },
    jingle: function(t, o){ var p = pan01(o.x) * 0.8, r = R(0.94, 1.08); for (var i = 0; i < 3; i++) ring(t + i * 0.06 + R(0, 0.02), [2150 * r, 3390 * r, 5240 * r, 6900 * r], 0.022, 0.4, p, 0.2); },
    bell: function(t){ bell(t, 392, 0.09, 0.55); },
    run: function(t, o){ if (o.on) startSteps(); else stopSteps(); },
    pop: function(t){ tone(t, { f: 920, f2: 240, d: 0.12, a: 0.002, g: 0.14 }); noise(t, { d: 0.025, a: 0.001, g: 0.08, type: 'highpass', f: 3000 }); },
    crack: function(t){ noise(t, { d: 0.07, a: 0.001, g: 0.19, type: 'highpass', f: 1800, q: 0.7 }); noise(t + 0.01, { d: 0.2, a: 0.003, g: 0.11, type: 'bandpass', f: 420, q: 2 }); tone(t, { f: 150, f2: 70, d: 0.14, a: 0.002, g: 0.12 }); },
    pen: function(t, o){ (o.plan || []).forEach(function(p){ scratch(t + p[0] / 1000, Math.max(0.05, p[1] / 1000), 0.05); }); },
    time: function(t){ var th = theme(), ch = th === 'night' ? [392, 494, 587, 740] : th === 'morning' ? [523, 659, 784, 988] : [440, 554, 659, 831];
      noise(t, { d: 0.9, a: 0.5, g: 0.07, type: 'bandpass', f: 400, f2: 2200, q: 0.7, wet: 0.4 });
      ch.forEach(function(f, i){ tone(t + 0.25 + i * 0.09, { f: f, d: 1.4, a: 0.01, g: 0.035, wet: 0.6, type: 'triangle' }); }); },
    summit: function(t){ [262, 330, 392, 523, 659].forEach(function(f, i){ tone(t + i * 0.12, { f: f, d: 2.4 - i * 0.2, a: 0.25, g: 0.03, wet: 0.7, type: 'triangle' }); });
      noise(t, { d: 2, a: 0.8, g: 0.08, type: 'lowpass', f: 700, q: 0.5, brown: true, wet: 0.3 }); },
    lantern: function(t){ noise(t, { d: 0.09, a: 0.002, g: 0.18, type: 'highpass', f: 2600, q: 0.8 }); noise(t + 0.05, { d: 0.6, a: 0.12, g: 0.1, type: 'lowpass', f: 300, f2: 1400, q: 0.6, brown: true }); },
    wink: function(t){ tone(t, { f: 1760, f2: 2640, d: 0.22, a: 0.004, g: 0.05, wet: 0.5 }); tone(t + 0.1, { f: 2640, f2: 3520, d: 0.3, a: 0.004, g: 0.035, wet: 0.6 }); },
    konami: function(t){ [523, 659, 784, 1047, 784, 1047, 1319].forEach(function(f, i){ tone(t + i * 0.075, { f: f, d: 0.09, a: 0.003, g: 0.03, type: 'square', lp: 3000 }); }); },
    egg: function(t){ tone(t, { f: 1318, d: 0.5, a: 0.004, g: 0.04, wet: 0.5, type: 'triangle' }); tone(t + 0.12, { f: 1976, d: 0.7, a: 0.004, g: 0.035, wet: 0.6, type: 'triangle' }); },
    squash: function(t){ noise(t, { d: 0.06, a: 0.001, g: 0.22, type: 'bandpass', f: 1400, q: 1.2 }); noise(t + 0.02, { d: 0.09, a: 0.002, g: 0.12, type: 'highpass', f: 3500 }); tone(t, { f: 180, f2: 60, d: 0.18, a: 0.002, g: 0.12 }); },
    cable: function(t){ noise(t, { d: 2.4, a: 0.6, g: 0.1, type: 'bandpass', f: 250, f2: 900, q: 0.7, brown: true, wet: 0.3 }); for (var i = 0; i < 3; i++) creak(t + 0.1 + i * 0.8, 0.45, 0.02, R(-0.3, 0.3));
      tone(t, { f: 110, d: 2.6, a: 0.4, g: 0.015, type: 'sawtooth', lp: 400 }); },
    tap: function(t){ tone(t, { f: 1500, f2: 900, d: 0.05, a: 0.001, g: 0.03 }); tone(t + 0.24, { f: 1400, f2: 850, d: 0.05, a: 0.001, g: 0.025 }); },
    flutter: function(t, o){ var p = pan01(o.x); for (var i = 0; i < 9; i++) noise(t + i * 0.045 * R(0.9, 1.1), { d: 0.03, a: 0.004, g: 0.06 * (1 - i / 11), type: 'bandpass', f: R(500, 900), q: 1.4, pan: p }); },
    bird: function(t, o){ var sp = o.sp || theme(), p = pan01(o.x), g = o.soft ? 0.5 : 1, i;
      if (sp === 'night') for (i = 0; i < (o.happy ? 5 : 3); i++) tone(t + i * 0.11, { f: R(1100, 1300), f2: R(800, 950), d: 0.07, a: 0.006, g: 0.028 * g, pan: p, wet: 0.35, type: 'triangle' });
      else if (sp === 'morning') for (i = 0; i < (o.happy ? 2 : 1); i++){ tone(t + i * 0.32, { f: 2600, f2: 1700, glide: 0.24, d: 0.26, a: 0.01, g: 0.032 * g, pan: p, wet: 0.3 }); tone(t + i * 0.32, { f: 5200, f2: 3400, glide: 0.24, d: 0.22, a: 0.01, g: 0.008 * g, pan: p }); }
      else for (i = 0; i < (o.happy ? 5 : 3); i++) tone(t + i * 0.2, { f: 470, f2: 420, d: 0.1, a: 0.012, g: 0.05 * g, pan: p, wet: 0.3 }); }
  };
  function startSteps(){ if (steps) return; var i = 0; steps = setInterval(function(){ if (!on || !ctx || ctx.state !== 'running') return; var t = ctx.currentTime + 0.02;
    noise(t, { d: 0.06, a: 0.003, g: 0.12, type: 'lowpass', f: R(380, 520), q: 0.9, pan: i++ % 2 ? 0.12 : -0.12 }); noise(t + 0.01, { d: 0.03, a: 0.002, g: 0.03, type: 'bandpass', f: 2600, q: 1.5 }); }, 330); }
  function stopSteps(){ clearInterval(steps); steps = 0; }

  /* ---------- ambience ---------- */
  var speed = 0, lastY = window.pageYOffset, lastT = performance.now();
  window.addEventListener('scroll', function(){ var now = performance.now(), y = window.pageYOffset, v = Math.abs(y - lastY) / Math.max(8, now - lastT) * 1000; lastY = y; lastT = now; if (v < 20000) speed = Math.max(speed, v); }, { passive: true });
  function where(){
    var max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight), p = window.pageYOffset / max, sp = S.summitP ? S.summitP() : 0.62;
    var alt = p <= sp ? p / sp : 1 - (p - sp) / Math.max(0.01, 1 - sp), ct = document.getElementById('contact'), fire = 0;
    if (ct){ var r = ct.getBoundingClientRect(); fire = clamp((window.innerHeight - r.top) / window.innerHeight, 0, 1); }
    return { alt: clamp(alt, 0, 1), fire: fire };
  }
  function ambient(){
    if (amb) return; amb = {};
    var s = ctx.createBufferSource(); s.buffer = BB; s.loop = true;
    var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 500; lp.Q.value = 0.6;
    var pk = ctx.createBiquadFilter(); pk.type = 'peaking'; pk.frequency.value = 900; pk.gain.value = 4; pk.Q.value = 0.8;
    var wg = ctx.createGain(); wg.gain.value = 0.0001; var lfo = ctx.createOscillator(); lfo.frequency.value = 0.09; var lfg = ctx.createGain(); lfg.gain.value = 160; lfo.connect(lfg); lfg.connect(lp.frequency);
    var wp = ctx.createStereoPanner ? ctx.createStereoPanner() : null; s.connect(lp); lp.connect(pk); pk.connect(wg); if (wp){ wg.connect(wp); wp.connect(ambBus); } else wg.connect(ambBus);
    s.start(); lfo.start(); amb.wind = { g: wg, lp: lp, p: wp };
    var h = ctx.createBufferSource(); h.buffer = NB; h.loop = true; var hf = ctx.createBiquadFilter(); hf.type = 'highpass'; hf.frequency.value = 5200; var hg = ctx.createGain(); hg.gain.value = 0.0001; h.connect(hf); hf.connect(hg); hg.connect(ambBus); h.start(); amb.hiss = hg;
    var fr = ctx.createBufferSource(); fr.buffer = BB; fr.loop = true; var ff = ctx.createBiquadFilter(); ff.type = 'lowpass'; ff.frequency.value = 180; var fg = ctx.createGain(); fg.gain.value = 0.0001; fr.connect(ff); ff.connect(fg); fg.connect(ambBus); fr.start(); amb.fire = fg;
    var t = ctx.currentTime; amb.next = { cricket: t, owl: t + R(12, 30), cow: t + R(3, 8), camel: t + R(20, 40), crackle: t };
    setInterval(schedule, 120);
  }
  function schedule(){
    if (!on || !ctx || ctx.state !== 'running' || !amb) return;
    var t = ctx.currentTime, th = theme(), w = where(), lit = root.classList.contains('trail-done'), ahead = t + 0.25, N = amb.next, i;
    speed *= 0.82;
    var wind = (0.03 + 0.09 * w.alt + Math.min(0.12, speed / 30000)) * (th === 'dusk' ? 0.8 : 1);
    amb.wind.g.gain.setTargetAtTime(wind, t, 0.4); amb.wind.lp.frequency.setTargetAtTime(380 + 700 * w.alt + Math.min(900, speed / 6), t, 0.5);
    if (amb.wind.p) amb.wind.p.pan.setTargetAtTime(Math.sin(t * 0.13) * 0.4, t, 1);
    amb.hiss.gain.setTargetAtTime(th === 'dusk' ? 0.012 + 0.02 * w.alt : 0.0001, t, 0.6);
    amb.fire.gain.setTargetAtTime(0.0001 + w.fire * (lit ? 0.05 : 0.025), t, 0.5);
    if (th === 'night'){
      while (N.cricket < ahead){ var ct = Math.max(t, N.cricket), cp = Math.random() < 0.5 ? -0.55 : 0.5, cf = cp < 0 ? 4400 : 4750;
        for (i = 0; i < 3; i++) tone(ct + i * 0.045, { f: cf, d: 0.018, a: 0.004, g: 0.006 * (1 - w.alt * 0.7), pan: cp, bus: ambBus }); N.cricket = ct + R(0.32, 0.6); }
      if (N.owl < ahead){ hoot(Math.max(t, N.owl)); N.owl = t + R(28, 60); }
    } else N.cricket = t;
    if (th === 'morning' && N.cow < ahead){ var n = 1 + (Math.random() * 3 | 0), bt = Math.max(t, N.cow), f0 = R(560, 760), p = R(-0.7, 0.7);
      for (i = 0; i < n; i++) ring(bt + i * R(0.28, 0.55), [f0, f0 * 1.5, f0 * 2.35, f0 * 3.9], 0.012 * (1 - w.alt * 0.5), 0.8, p, 0.5, ambBus, 2600); N.cow = bt + R(5, 13); }
    if (th === 'dusk' && N.camel < ahead){ ring(Math.max(t, N.camel), [340, 512, 800, 1260], 0.01, 1.4, R(-0.6, 0.6), 0.6, ambBus, 2200); N.camel = t + R(25, 50); }
    if (w.fire > 0.02){ var rate = w.fire * (lit ? 9 : 4);
      while (N.crackle < ahead){ var cr = Math.max(t, N.crackle); noise(cr, { d: R(0.004, 0.02), a: 0.001, g: R(0.02, 0.09) * w.fire, type: 'highpass', f: R(1500, 4500), q: 0.7, pan: R(-0.3, 0.3), bus: ambBus }); N.crackle = cr - Math.log(1 - Math.random()) / rate; } }
    else N.crackle = t;
  }

  /* ---------- on and off ---------- */
  function label(v){ if (!btn) return; btn.setAttribute('aria-pressed', v ? 'true' : 'false'); btn.setAttribute('aria-label', v ? 'Sound is on. Turn it off' : 'Sound is off. Turn it on'); btn.title = v ? 'Sound on' : 'Sound off'; }
  function setOn(v, persist){
    if (persist) try { localStorage.setItem('av-sound', v ? '1' : '0'); } catch (e){}
    label(v);
    if (v){ if (!init()){ label(false); return; } on = true;
      var go = function(){ ambient(); var t = ctx.currentTime; master.gain.cancelScheduledValues(t); master.gain.setValueAtTime(Math.max(0.0001, master.gain.value), t); master.gain.exponentialRampToValueAtTime(1, t + 0.8); };
      if (ctx.state !== 'running'){ var pr = ctx.resume(); if (pr && pr.then) pr.then(go, function(){}); else go(); } else go();
      if (persist) S.track('sound', { on: true }); }
    else { on = false; stopSteps(); if (ctx){ var t = ctx.currentTime; master.gain.cancelScheduledValues(t); master.gain.setValueAtTime(Math.max(0.0001, master.gain.value), t); master.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
      setTimeout(function(){ if (!on && ctx.state === 'running') ctx.suspend(); }, 400); } if (persist) S.track('sound', { on: false }); }
  }
  if (btn){ btn.hidden = false; label(want);
    btn.addEventListener('click', function(){ setOn(btn.getAttribute('aria-pressed') !== 'true', true); }); }
  /* it was on last time: pick up again at the first touch or key press, since browsers only allow audio after one */
  if (want){ var first = function(e){ if (btn && e && btn.contains(e.target)) return; ['pointerup', 'keydown', 'touchend'].forEach(function(n){ document.removeEventListener(n, first, true); });
      if (!btn || btn.getAttribute('aria-pressed') === 'true') setOn(true, false); };
    ['pointerup', 'keydown', 'touchend'].forEach(function(n){ document.addEventListener(n, first, true); }); }
  document.addEventListener('visibilitychange', function(){ if (!ctx) return; if (document.hidden){ if (ctx.state === 'running') ctx.suspend(); } else if (on) ctx.resume(); });

  function play(n, o){ if (!on || !ctx || ctx.state !== 'running') return false; var f = SND[n]; if (!f) return false; try { f(ctx.currentTime + 0.01, o || {}); return true; } catch (e){ return false; } }
  /* moments the page announces as events */
  document.addEventListener('env:crack', function(){ play('crack'); });
  document.addEventListener('timechange', function(){ play('time'); });
  document.addEventListener('summit:reached', function(){ play('summit'); });
  if (window.MutationObserver){ var wasLit = root.classList.contains('trail-done'); new MutationObserver(function(){ var lit = root.classList.contains('trail-done'); if (lit && !wasLit) play('lantern'); wasLit = lit; }).observe(root, { attributes: true, attributeFilter: ['class'] }); }

  window.__sound = { play: play, on: function(){ return on; }, set: function(v){ setOn(!!v, true); }, names: Object.keys(SND), state: function(){ return ctx ? ctx.state : 'none'; },
    peak: function(){ if (!an) return 0; var a = new Float32Array(an.fftSize), m = 0; an.getFloatTimeDomainData(a); for (var i = 0; i < a.length; i++){ var v = Math.abs(a[i]); if (v > m) m = v; } return m; } };
})();
