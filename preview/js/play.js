(function(){
  'use strict';
  var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var NS = 'http://www.w3.org/2000/svg';
  function $(s, r){ return (r || document).querySelector(s); }
  function $$(s, r){ return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function safe(fn){ try { fn(); } catch (e){ if (window.console) console.warn('play:', e); } }
  function track(n, d){ if (window.__track) window.__track(n, d); }
  function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }
  function whenVisible(el, cb){ if (!('IntersectionObserver' in window)){ cb(true); return; } new IntersectionObserver(function(es){ cb(es[0].isIntersecting); }, { threshold: 0.05 }).observe(el); }
  function onceVisible(el, cb, th){ if (!('IntersectionObserver' in window)){ cb(); return; } var io = new IntersectionObserver(function(es){ if (es[0].isIntersecting){ io.disconnect(); cb(); } }, { threshold: th || 0.4 }); io.observe(el); }

  /* ---------- fruit catch: shake a fruit loose, catch it in the basket ---------- */
  safe(function(){
    var box = $('.fc'); if (!box) return;
    var els = $$('.fc-fruit', box), basket = $('.fc-basket', box), status = $('.fc-status', box), tray = $('.fc-tray', box), resetB = $('.fc-reset', box);
    var W = 500, H = 180, FW = 40, BW = 78, bx = 250, tbx = 250, items = [], caught = 0, running = false, last = 0;
    function size(){ W = box.clientWidth || 500; H = box.clientHeight || 180; items.forEach(function(it, i){ it.hx = (i + 1) * W / (items.length + 1); if (it.state === 'hang') it.x = it.hx; }); }
    els.forEach(function(el){ items.push({ el: el, hx: 0, x: 0, y: 30, vy: 0, vx: 0, state: 'hang', t: 0, sw: Math.random() * 6 }); });
    size(); bx = tbx = W / 2;
    function say(t){ status.textContent = t; }
    function paint(now){
      items.forEach(function(it){ var rot = it.state === 'hang' ? Math.sin(now / 650 + it.sw) * 7 : it.y * 1.6;
        it.el.style.transform = 'translate(' + (it.x - FW / 2).toFixed(1) + 'px,' + (it.y - FW / 2).toFixed(1) + 'px) rotate(' + rot.toFixed(1) + 'deg)';
        it.el.style.visibility = it.state === 'caught' ? 'hidden' : 'visible'; });
      basket.style.transform = 'translateX(' + (bx - BW / 2).toFixed(1) + 'px)';
    }
    function catchIt(it){
      it.state = 'caught'; caught++;
      var mini = document.createElement('span'); mini.className = 'fc-mini'; mini.innerHTML = it.el.innerHTML; tray.appendChild(mini);
      say(it.el.getAttribute('data-note')); basket.classList.remove('bump'); void basket.offsetWidth; basket.classList.add('bump');
      if (caught === items.length){ track('fruit_harvest'); setTimeout(function(){ say('Full harvest. Everything here grew in my garden, even the longan, for a while. Still counts.'); resetB.hidden = false; }, 1600); }
    }
    function step(now){
      if (!running) return;
      var dt = Math.min(0.033, (now - last) / 1000 || 0.016); last = now;
      bx += (tbx - bx) * Math.min(1, dt * 12);
      var rimY = H - 46;
      items.forEach(function(it){
        if (it.state === 'fall'){ it.vy += 520 * dt; it.y += it.vy * dt; it.x += it.vx * dt;
          if (it.y >= rimY && it.y <= rimY + 20 && Math.abs(it.x - bx) < BW / 2) catchIt(it);
          else if (it.y > H - FW / 2){ it.y = H - FW / 2; it.state = 'ground'; it.t = 0; it.vx = (it.x < W / 2 ? -1 : 1) * 70; say('Missed. It grows back, like anything in a garden.'); } }
        else if (it.state === 'ground'){ it.t += dt; it.x += it.vx * dt; if (it.t > 0.7){ it.state = 'regrow'; it.t = 0; it.x = it.hx; it.y = 30; } }
        else if (it.state === 'regrow'){ it.t += dt; it.el.style.scale = String(Math.min(1, it.t / 0.5)); if (it.t > 0.5){ it.state = 'hang'; it.el.style.scale = ''; } }
      });
      paint(now); requestAnimationFrame(step);
    }
    els.forEach(function(el, i){ el.addEventListener('click', function(e){ e.stopPropagation(); var it = items[i]; if (it.state !== 'hang') return; it.state = 'fall'; it.vy = 0; it.vx = (Math.random() - 0.5) * 30; say('Catch it. Move the basket under it.'); }); });
    function aimB(e){ var r = box.getBoundingClientRect(); tbx = clamp(e.clientX - r.left, BW / 2, W - BW / 2); }
    box.addEventListener('pointermove', aimB);
    box.addEventListener('pointerdown', function(e){ if (!e.target.closest('.fc-fruit, .fc-reset')) aimB(e); });
    box.addEventListener('keydown', function(e){ if (e.key === 'ArrowLeft'){ tbx = Math.max(BW / 2, tbx - 50); e.preventDefault(); } else if (e.key === 'ArrowRight'){ tbx = Math.min(W - BW / 2, tbx + 50); e.preventDefault(); } });
    resetB.addEventListener('click', function(){ caught = 0; tray.innerHTML = ''; resetB.hidden = true; items.forEach(function(it){ it.state = 'hang'; it.x = it.hx; it.y = 30; }); say('Tap a fruit to shake it loose, then catch it in the basket.'); });
    window.addEventListener('resize', size);
    paint(performance.now());
    whenVisible(box, function(v){ if (v && !running){ running = true; last = performance.now(); requestAnimationFrame(step); } else if (!v) running = false; });
  });

  /* ---------- anime cards flip; badminton serve; the temple draws itself ---------- */
  safe(function(){ $$('.af-card').forEach(function(c){ c.addEventListener('click', function(){ var on = c.classList.toggle('flip'); c.setAttribute('aria-pressed', on ? 'true' : 'false'); }); }); });
  /* W4: badminton, a real little rally. You serve, I return, and you hit it back when it reaches your side.
     Too early and you swing at air; too late and it drops. I miss now and then once a rally gets long. */
  safe(function(){
    var box = $('.serve'), btn = $('.serve-btn', box), count = $('.serve-count', box), court = $('.court', box); if (!btn || !court) return;
    var sh = $('.ct-sh', court), shd = $('.ct-shd', court), you = $('.ct-you .ct-arm', court), me = $('.ct-me .ct-arm', court);
    var RY = { x: 80, y: 50 }, RM = { x: 320, y: 50 }, st = 'idle', fl = null, rally = 0, raf = 0, best = 0, early = false, ready = false, WIN = 0.64, GRACE = 0.16;
    function say(t){ count.textContent = t; }
    /* whose shot it is, on the court and on the button, so nobody ends up playing both sides */
    function turn(w){ court.classList.toggle('t-me', w === 'me'); court.classList.toggle('t-you', w === 'you'); }
    function swing(arm){ if (!arm) return; arm.classList.remove('sw'); void arm.getBoundingClientRect(); arm.classList.add('sw'); }
    function place(x, y, ang){ sh.setAttribute('transform', 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') rotate(' + ang.toFixed(0) + ')');
      var hgt = Math.max(0, 100 - y), k = Math.max(0.35, 1 - hgt / 110); shd.setAttribute('cx', x.toFixed(1)); shd.setAttribute('rx', (5.5 * k + 1).toFixed(2)); shd.style.opacity = (0.25 + 0.6 * k).toFixed(2); }
    function fly(from, to, dur, h, then, t0){ fl = { a: from, b: to, d: dur, h: h, t0: t0 || performance.now(), then: then }; if (!raf) raf = requestAnimationFrame(step); }
    function prog(now){ return fl ? (now - fl.t0) / fl.d : 0; }
    /* the hit window is judged by the clock, not by frames, so a slow phone never skips it */
    function step(now){ raf = 0; if (!fl) return; var u0 = prog(now), u = Math.min(1, u0), x = fl.a.x + (fl.b.x - fl.a.x) * u, y = fl.a.y + (fl.b.y - fl.a.y) * u - 4 * fl.h * u * (1 - u);
      var dx = fl.b.x - fl.a.x, dy = (fl.b.y - fl.a.y) - 4 * fl.h * (1 - 2 * u), ang = Math.atan2(dy, dx) * 180 / Math.PI; place(x, y, ang);
      if (st === 'toYou'){ var wn = u0 > WIN && !early; court.classList.toggle('win', wn); if (wn && !ready){ ready = true; btn.textContent = 'Hit it now!'; } }
      var g = st === 'toYou' ? GRACE : 0; if (u0 >= 1 + g){ var f = fl.then, endT = fl.t0 + fl.d * (1 + g); fl = null; if (f) f(endT); return; } raf = requestAnimationFrame(step); }
    function speed(){ return Math.max(620, 1150 - rally * 55); }
    function toMe(){ st = 'toMe'; court.classList.remove('win'); turn('me'); btn.textContent = 'My shot…'; fly(RY, RM, speed(), rally % 3 === 2 ? 22 : 40, function(at){
      var miss = rally >= 7 && Math.random() < Math.min(0.5, (rally - 6) * 0.09);
      if (miss){ drop(RM, 1, function(){ end(true); }, at); return; }
      swing(me); toYou(at); }); }
    function toYou(at){ st = 'toYou'; early = false; ready = false; turn('you'); btn.textContent = 'Your shot…'; say('Rally: ' + rally + '. Your shot.'); fly(RM, RY, speed(), rally % 4 === 3 ? 20 : 40, function(at2){ if (st === 'toYou') drop({ x: RY.x - 8, y: RY.y + 6 }, -1, function(){ end(false); }, at2); }, at); }
    function drop(p, dir, then, at){ st = 'drop'; court.classList.remove('win'); turn(null); fly(p, { x: p.x - dir * 40, y: 99 }, 520, 6, then, at); }
    function end(won){ st = 'idle'; turn(null); best = Math.max(best, rally); btn.textContent = 'Serve again';
      say(won ? 'Point to you. That was a ' + rally + ' shot rally.' : early ? 'Too early. You swung at air after ' + rally + (rally === 1 ? ' shot.' : ' shots.') : rally ? 'It dropped. A ' + rally + ' shot rally' + (rally === best && rally > 2 ? ', your best yet.' : '.') : 'It dropped. Wait for it to come to you, then hit.'); }
    function hit(){
      if (st === 'idle'){ rally = 0; early = false; place(RY.x, RY.y, 0); swing(you); say('Nice serve.'); btn.textContent = 'Wait for it'; rally = 1; toMe(); return; }
      if (st === 'toMe'){ say('That one’s mine. Wait for it to come back to your side.'); return; }
      if (st !== 'toYou' || early) return;
      var u = prog(performance.now());
      if (u < WIN){ early = true; swing(you); court.classList.remove('win'); btn.textContent = 'Too early'; return; }
      fl = null; court.classList.remove('win'); swing(you); rally++; say('Rally: ' + rally); btn.textContent = 'Wait for it'; toMe();
    }
    btn.addEventListener('click', hit); court.addEventListener('click', hit);
    place(RY.x, RY.y, 0);
  });
  /* W4: the divergence meter. One small change shifts the world line; keep trying and it can land on the one where everything holds */
  safe(function(){
    var box = $('.af-dm'); if (!box) return;
    var ds = $$('.dm-d', box), say = $('.dm-say', box), HOME = '1.048596', busy = false, spins = 0;
    var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function show(v){ for (var i = 0; i < ds.length; i++) ds[i].textContent = v.charAt(i); }
    function pick(){ var v = (Math.random() < 0.5 ? '0' : '1') + '.'; for (var i = 0; i < 6; i++) v += Math.floor(Math.random() * 10); return v === HOME ? '0.337187' : v; }
    box.addEventListener('click', function(){
      if (busy) return; busy = true; spins++;
      var goal = spins >= 3 && Math.random() < 0.34 ? HOME : pick(), home = goal === HOME;
      function done(){ show(goal); busy = false; box.classList.remove('spin'); box.classList.toggle('home', home);
        say.textContent = home ? 'Steins;Gate. The world line where every test passes.' : 'A different world line. Tap again.';
        box.setAttribute('aria-label', 'Divergence meter, reading ' + goal + '. Press to shift the world line.');
        if (window.__site && window.__site.sfx) window.__site.sfx('pop'); track('toy', { name: 'divergence', home: home }); }
      if (still){ done(); return; }
      box.classList.add('spin'); var t0 = performance.now(), D = 950;
      (function tick(now){ var u = (now - t0) / D; if (u >= 1){ done(); return; }
        var v = ''; for (var i = 0; i < ds.length; i++) v += i === 1 ? '.' : (u > 0.3 + i * 0.08 ? goal.charAt(i) : String(Math.floor(Math.random() * 10)));
        show(v); requestAnimationFrame(tick); })(t0);
    });
  });
  safe(function(){ var g = $('.gopuram'); if (g) onceVisible(g, function(){ g.classList.add('drawn'); }, 0.5); });
})();
