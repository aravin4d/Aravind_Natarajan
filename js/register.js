/* Wave 4 · the summit register, rethought.
   It isn't a sign in and it isn't a guestbook. At the top you write your name into the ground of whichever
   world you're in (snow, sand, or the night sky), and it goes straight to my Google Sheet. The page never
   lists anyone's name and the backend never hands names out: the only name you ever see here is your own,
   remembered on your device. Everything typed is treated as text, never as HTML. */
(function(){
  'use strict';
  var S = window.__site; if (!S) return;
  var $ = S.$, box = document.getElementById('reg'); if (!box) return;
  var root = document.documentElement, reduce = S.reduce;
  var EP = (box.getAttribute('data-endpoint') || '').trim();
  var local = location.protocol === 'file:' || /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  var force = /[?&]register\b/.test(location.search), preview = !EP;
  if (preview && !local && !force) return;
  var book = $('.reg-book', box), tin = $('.reg-tin', box), cta = $('.reg-cta', box), form = $('.reg-f', box), st = $('.reg-st', box), sub = $('.reg-sub', box),
    done = $('.reg-done', box), cv = $('.reg-cv', box), go = form && $('button[type="submit"]', form);
  if (!book || !tin || !form || !cv) return;
  var opened = 0, busy = false, ME = 'av-reg-me', DAY = 'av-reg-day';
  var WORDS = {
    morning: { cta: 'Write your name in the snow', back: 'Your name’s in the snow up here', sub: 'Press it into the snow', ok: 'Pressed into the snow, {n}. It’ll keep, and I’ll see it.', again: 'Still in the snow, {n}. Thanks for coming back up.' },
    dusk: { cta: 'Write your name in the sand', back: 'Your name’s in the sand up here', sub: 'Trace it in the sand', ok: 'Traced in the sand, {n}. I’ll read it before the wind does.', again: 'Still in the sand, {n}. Thanks for coming back up.' },
    night: { cta: 'Write your name in the stars', back: 'Your name’s up with the stars', sub: 'Put it up with the stars', ok: 'Up with the stars now, {n}. I’ll look for it.', again: 'Still up there, {n}. Thanks for coming back up.' }
  };
  var MSG = { too_fast: 'That was quick. Give it a second and try again.', links: 'No links, please. Just a name and a note.', rate: 'Busy up here right now. Try again in a minute.',
    name: 'Add your name first.', busy: 'Busy up here right now. Try again in a moment.', server: 'That didn’t go through. Try again in a bit.', today: 'You’ve left your name today already. Come back tomorrow.' };
  function theme(){ var t = root.getAttribute('data-time'); return t === 'night' || t === 'morning' ? t : 'dusk'; }
  function clean(s, n){ return String(s || '').replace(/[\u0000-\u001F\u007F\u200B-\u200F\u2028-\u202E\u2066-\u2069]/g, '').replace(/\s+/g, ' ').trim().slice(0, n); }
  function today(){ var d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function get(k){ try { return localStorage.getItem(k); } catch (e){ return null; } }
  function put(k, v){ try { localStorage.setItem(k, v); } catch (e){} }
  function me(){ try { return JSON.parse(get(ME) || 'null'); } catch (e){ return null; } }
  function signedToday(){ return !!me() && get(DAY) === today(); }
  function status(t){ if (st) st.textContent = t; }
  function secrets(){ try { return window.__eggs ? window.__eggs.count() : 0; } catch (e){ return 0; } }
  function words(){ var w = WORDS[theme()]; if (cta) cta.textContent = signedToday() ? w.back : w.cta; if (sub) sub.textContent = w.sub; }

  /* ---------- the ground: a patch of snow, sand or night sky, and your name written into it ---------- */
  var G = { name: '', prog: 1, raf: 0, w: 0, h: 0, dpr: 1, bg: null, key: '' };
  function rnd(seed){ var s = seed; return function(){ s = (s * 16807) % 2147483647; return s / 2147483647; }; }
  function paintGround(c, w, h, t){
    var r = rnd(11), g, i, x, y;
    if (t === 'morning'){
      g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#FCFEFF'); g.addColorStop(0.6, '#EEF4FA'); g.addColorStop(1, '#DCE7F3'); c.fillStyle = g; c.fillRect(0, 0, w, h);
      c.lineCap = 'round'; for (i = 0; i < 34; i++){ y = r() * h; x = r() * w; var L = 70 + r() * 190;
        c.strokeStyle = 'rgba(112,146,198,' + (0.05 + r() * 0.07).toFixed(3) + ')'; c.lineWidth = 1 + r() * 2.4; c.beginPath(); c.moveTo(x - L / 2, y); c.quadraticCurveTo(x, y - 5 - r() * 9, x + L / 2, y + (r() - 0.5) * 7); c.stroke();
        c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 1; c.beginPath(); c.moveTo(x - L / 2, y + 1.6); c.quadraticCurveTo(x, y - 3.4 - r() * 8, x + L / 2, y + 1.6); c.stroke(); }
      for (i = 0; i < w * h / 900; i++){ c.fillStyle = r() < 0.5 ? 'rgba(255,255,255,.95)' : 'rgba(136,166,214,' + (0.14 + r() * 0.2).toFixed(2) + ')'; c.fillRect(r() * w, r() * h, 1.1, 1.1); }
    } else if (t === 'dusk'){
      /* a dune face at sunset: lit from the upper right, with wind ripples that wander, fork and fade */
      g = c.createLinearGradient(w, 0, 0, h); g.addColorStop(0, '#C07444'); g.addColorStop(0.5, '#93492B'); g.addColorStop(1, '#5C2819'); c.fillStyle = g; c.fillRect(0, 0, w, h);
      var sl = -0.08 + r() * 0.05;
      for (y = -30; y < h + 40; y += 15 + r() * 10){ var p1 = r() * 6.3, p2 = r() * 6.3, k1 = 0.008 + r() * 0.008, k2 = 0.03 + r() * 0.03, a1 = 3 + r() * 5, a2 = 0.6 + r() * 1.4, x0 = -20 + r() * w * 0.3, x1 = w * (0.7 + r() * 0.5);
        var pts = []; for (x = x0; x <= x1; x += 5) pts.push([x, y + Math.sin(x * k1 + p1) * a1 + Math.sin(x * k2 + p2) * a2 + x * sl]);
        for (var pass = 0; pass < 2; pass++){ c.beginPath(); pts.forEach(function(q, n){ var yy = q[1] + (pass ? 2.2 : 0); if (!n) c.moveTo(q[0], yy); else c.lineTo(q[0], yy); });
          var lg = c.createLinearGradient(x0, 0, x1, 0), col = pass ? '40,12,5,' : '255,196,140,', al = pass ? 0.34 : 0.26;
          lg.addColorStop(0, 'rgba(' + col + '0)'); lg.addColorStop(0.2 + r() * 0.2, 'rgba(' + col + al + ')'); lg.addColorStop(0.65 + r() * 0.2, 'rgba(' + col + al + ')'); lg.addColorStop(1, 'rgba(' + col + '0)');
          c.strokeStyle = lg; c.lineWidth = pass ? 2.6 : 1.1; c.stroke(); } }
      for (i = 0; i < w * h / 260; i++){ c.fillStyle = r() < 0.55 ? 'rgba(255,206,150,.22)' : 'rgba(40,10,4,.2)'; c.fillRect(r() * w, r() * h, 1, 1); }
      g = c.createRadialGradient(w * 0.92, -h * 0.1, 0, w * 0.92, -h * 0.1, w * 0.9); g.addColorStop(0, 'rgba(255,170,100,.28)'); g.addColorStop(1, 'rgba(255,170,100,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h);
    } else {
      g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#15204A'); g.addColorStop(1, '#070C1F'); c.fillStyle = g; c.fillRect(0, 0, w, h);
      g = c.createLinearGradient(0, h, w, 0); g.addColorStop(0.3, 'rgba(120,140,220,0)'); g.addColorStop(0.5, 'rgba(150,170,240,.1)'); g.addColorStop(0.7, 'rgba(120,140,220,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h);
      for (i = 0; i < w * h / 700; i++){ var a = r(), s2 = a > 0.96 ? 1.5 : a > 0.8 ? 1 : 0.6; c.fillStyle = 'rgba(235,240,255,' + (0.25 + r() * 0.6).toFixed(2) + ')'; c.beginPath(); c.arc(r() * w, r() * h, s2 * 0.6, 0, 6.3); c.fill(); }
    }
  }
  function mask(name, w, h, dpr){ var m = document.createElement('canvas'); m.width = Math.ceil(w * dpr); m.height = Math.ceil(h * dpr); var c = m.getContext('2d'), fs = Math.min(h * 0.44, 96);
    c.scale(dpr, dpr); c.textAlign = 'center'; c.textBaseline = 'middle';
    do { c.font = '700 ' + fs + 'px Caveat, "Segoe Script", cursive'; if (c.measureText(name).width < w * 0.82) break; fs -= 4; } while (fs > 22);
    c.fillStyle = '#000'; c.fillText(name, w / 2, h * 0.42); var tw = c.measureText(name).width; return { c: m, x0: w / 2 - tw / 2, x1: w / 2 + tw / 2, fs: fs, dpr: dpr }; }
  function tint(m, col){ var t = document.createElement('canvas'); t.width = m.width; t.height = m.height; var c = t.getContext('2d'); c.drawImage(m, 0, 0); c.globalCompositeOperation = 'source-in'; c.fillStyle = col; c.fillRect(0, 0, t.width, t.height); return t; }
  function starsOf(M){ var c = M.c.getContext('2d'), W2 = M.c.width, d = c.getImageData(0, 0, W2, M.c.height).data, step = Math.max(3, Math.round(M.fs / 12)), sd = Math.max(1, Math.round(step * M.dpr)), out = [], r = rnd(5);
    for (var y = 0; y < M.c.height; y += sd) for (var x = 0; x < W2; x += sd){ if (d[(y * W2 + x) * 4 + 3] > 140) out.push({ x: x / M.dpr + (r() - 0.5) * step * 0.7, y: y / M.dpr + (r() - 0.5) * step * 0.7, s: 0.6 + r() * 1.1, a: 0.55 + r() * 0.45 }); }
    out.sort(function(a, b){ return a.x - b.x; }); return { pts: out, step: step }; }
  function draw(){
    var c = cv.getContext('2d'), t = theme(), w = G.w, h = G.h; if (!w || !h) return;
    c.setTransform(G.dpr, 0, 0, G.dpr, 0, 0); c.clearRect(0, 0, w, h);
    if (!G.bg || G.key !== t + w + 'x' + h){ G.bg = document.createElement('canvas'); G.bg.width = Math.ceil(w * G.dpr); G.bg.height = Math.ceil(h * G.dpr); var bc = G.bg.getContext('2d'); bc.scale(G.dpr, G.dpr); paintGround(bc, w, h, t); G.key = t + w + 'x' + h; G.M = null; G.stars = null; }
    c.drawImage(G.bg, 0, 0, w, h);
    if (!G.name) return;
    if (!G.M || G.M.n !== G.name){ G.M = mask(G.name, w, h, G.dpr); G.M.n = G.name; G.hol = null; G.stars = null; G.glow = null; }
    var M = G.M, cut = M.x0 - 6 + (M.x1 - M.x0 + 12) * G.prog;
    c.save(); c.beginPath(); c.rect(0, 0, cut, h); c.clip();
    if (t === 'night'){
      if (!G.stars) G.stars = starsOf(M); var P = G.stars.pts, lim = G.stars.step * 1.7;
      /* the name itself glows faintly behind its stars, so it reads as a name and not as scattered sky */
      if (!G.glow) G.glow = tint(M.c, 'rgba(176,200,255,.3)'); c.save(); c.shadowColor = 'rgba(150,180,255,.55)'; c.shadowBlur = 12; c.drawImage(G.glow, 0, 0, w, h); c.restore();
      c.lineWidth = 0.6; c.strokeStyle = 'rgba(190,210,255,.16)'; c.beginPath();
      for (var i = 1; i < P.length; i++){ var a = P[i - 1], b = P[i]; if (Math.hypot(a.x - b.x, a.y - b.y) < lim){ c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); } } c.stroke();
      P.forEach(function(p){ c.fillStyle = 'rgba(236,242,255,' + p.a.toFixed(2) + ')'; c.beginPath(); c.arc(p.x, p.y, p.s * 0.8, 0, 6.3); c.fill(); if (p.s > 1.4){ c.fillStyle = 'rgba(200,220,255,.18)'; c.beginPath(); c.arc(p.x, p.y, p.s * 3.2, 0, 6.3); c.fill(); } });
    } else {
      if (!G.hol){ G.hol = t === 'morning' ? [tint(M.c, 'rgba(255,255,255,.95)'), tint(M.c, 'rgba(78,112,168,.42)'), tint(M.c, 'rgba(40,70,130,.3)')] : [tint(M.c, 'rgba(255,178,120,.5)'), tint(M.c, 'rgba(36,10,4,.55)'), tint(M.c, 'rgba(20,4,2,.4)')]; }
      c.drawImage(G.hol[0], 1.2, 1.8, w, h); c.drawImage(G.hol[1], 0, 0, w, h); c.globalAlpha = 0.8; c.drawImage(G.hol[2], -0.8, -1.1, w, h); c.globalAlpha = 1;
    }
    c.restore();
  }
  function size(){ var r = book.getBoundingClientRect(); G.w = Math.round(r.width); G.h = Math.round(r.height); G.dpr = Math.min(2, window.devicePixelRatio || 1); cv.width = Math.ceil(G.w * G.dpr); cv.height = Math.ceil(G.h * G.dpr); draw(); }
  function write(name, anim){ G.name = name; if (!anim || reduce){ G.prog = 1; size(); return; }
    G.prog = 0; size(); var t0 = performance.now(), D = 1500 + Math.min(900, name.length * 60);
    cancelAnimationFrame(G.raf); (function step(now){ var u = Math.min(1, (now - t0) / D); G.prog = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2; draw(); if (u < 1) G.raf = requestAnimationFrame(step); })(t0); }

  /* ---------- states: the form, or your own name already in the ground ---------- */
  function view(){ var m = me(), on = signedToday(); book.classList.toggle('signed', on);
    if (on && m){ if (done){ done.hidden = false; done.textContent = WORDS[theme()].again.replace('{n}', m.n); } write(m.n, false); }
    else { if (done) done.hidden = true; G.name = ''; size(); } }
  function open(v){
    tin.setAttribute('aria-expanded', v ? 'true' : 'false'); book.hidden = !v; box.classList.toggle('open', v);
    if (v){ opened = Date.now(); view(); S.sfx('unfold', { n: 2, at: 0, st: 90, u: 260 }); S.track('register_open'); if (!signedToday()) setTimeout(function(){ try { form.elements.name.focus({ preventScroll: true }); } catch (e){} }, 420); }
  }
  tin.addEventListener('click', function(){ open(book.hidden); });
  function send(b){
    if (preview) return new Promise(function(res){ setTimeout(function(){ res({ ok: true, preview: true }); }, 450); });
    return fetch(EP, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(b) })
      .then(function(r){ return r.text(); }).then(function(tx){ try { return JSON.parse(tx); } catch (e){ return { ok: false, error: 'server' }; } });
  }
  function finish(name){ book.classList.add('signed'); if (done){ done.hidden = false; done.textContent = WORDS[theme()].ok.replace('{n}', name); } write(name, true); words();
    S.sfx(theme() === 'night' ? 'egg' : 'pen', { plan: [[0, 520, 0], [560, 380, 0]] }); }
  form.addEventListener('submit', function(e){
    e.preventDefault(); if (busy) return;
    var name = clean(form.elements.name.value, 40), from = clean(form.elements.from.value, 40), note = clean(form.elements.note.value, 140), hp = form.elements.website ? form.elements.website.value : '';
    if (!name){ status(MSG.name); form.elements.name.focus(); return; }
    if (hp){ form.reset(); finish(name); return; }
    if (signedToday()){ status(MSG.today); return; }
    busy = true; if (go) go.disabled = true; status(preview ? 'Preview: this stays on your device.' : 'Sending it up…');
    send({ name: name, from: from, note: note, website: hp, t: Date.now() - opened, theme: theme(), secrets: secrets(), page: location.pathname }).then(function(j){
      busy = false; if (go) go.disabled = false;
      if (j && j.ok){ put(DAY, today()); put(ME, JSON.stringify({ n: name, ts: Date.now(), t: theme() })); form.reset(); status(''); finish(name); S.track('register_sign'); }
      else status((j && MSG[j.error]) || MSG.server);
    }, function(){ busy = false; if (go) go.disabled = false; status('Couldn’t reach me just now. Try again in a bit.'); });
  });
  function show(){ box.hidden = false; words(); requestAnimationFrame(function(){ box.classList.add('live'); }); }
  var sm = document.getElementById('summit');
  if (force || (sm && sm.classList.contains('made'))) show(); else document.addEventListener('summit:reached', function(){ setTimeout(show, 60); });
  document.addEventListener('timechange', function(){ words(); if (!book.hidden) view(); });
  window.addEventListener('resize', function(){ if (!book.hidden) size(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ if (!book.hidden && G.name){ G.M = null; draw(); } });
  window.__register = { open: open, preview: preview, endpoint: EP, state: function(){ return { signed: signedToday(), me: me(), name: G.name, prog: G.prog }; } };
})();
