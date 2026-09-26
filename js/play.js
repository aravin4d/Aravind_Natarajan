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

  /* ---------- Play my career: four levels, one per chapter ---------- */
  safe(function(){
    var sc = $('.pl-scene'); if (!sc) return;
    var svg = $('svg', sc), layers = $$('[data-depth]', sc), lens = $('#hsLensCircle', sc), rim = $('.hs-rim', sc), layer = $('.hs-bugs', sc);
    var elLevel = $('.hg-level', sc), elCount = $('.hg-count', sc), elFact = $('.hg-fact', sc), card = $('.hg-card', sc), cardK = $('.hg-card-k', sc), cardT = $('.hg-card h3', sc), cardP = $('.hg-card p', sc), cardB = $('.hg-go', sc);
    var VW = 640, VH = 520, lx = 430, ly = 300, tx = lx, ty = ly, px = 0, py = 0, tpx = 0, tpy = 0, user = false, running = false, t0 = performance.now();
    function toSvg(e){ var r = svg.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * VW, y: (e.clientY - r.top) / r.height * VH, nx: (e.clientX - r.left) / r.width - 0.5, ny: (e.clientY - r.top) / r.height - 0.5 }; }
    function aim(e){ var p = toSvg(e); tx = clamp(p.x, 70, VW - 70); ty = clamp(p.y, 70, VH - 70); tpx = clamp(p.nx, -0.8, 0.8); tpy = clamp(p.ny, -0.8, 0.8); user = true; }
    sc.addEventListener('pointermove', aim); sc.addEventListener('pointerdown', aim);
    sc.addEventListener('pointerleave', function(){ user = false; tpx = 0; tpy = 0; });
    var LEVELS = [
      { year: '2017', role: 'Amazon, the Alexa app', labels: ['crash on update', 'typo', 'broken link'],
        facts: ['I tested the Alexa app on Android, iOS and Fire tablets, every single week.', 'Nine company awards in two and a half years, then a fast track promotion.', 'A clear bug report saves a developer an hour. I learned that in my first week.'] },
      { year: '2019', role: 'Amazon, Alexa Identity', labels: ['locale mismatch', 'voice timeout', 'enrolment fail', 'device crash'],
        facts: ['Zero launch blocking defects across 18 locales.', 'Tested on 20+ device types, from Fire TV to Echo Auto.', 'I redesigned the regression suite from 1,100 test cases to 180.', 'Invalid defects brought under 1% across 950+ critical bugs.'] },
      { year: '2021', role: 'Brightcove, all of APAC', labels: ['buffering', 'caption drift', 'DRM error', 'login loop', 'CDN timeout'],
        facts: ['I led APAC QA with three contractors across ten enterprise accounts.', 'Regression time went from 10 hours to 4.', 'A root cause process I built cut recurring issues by over half.', 'Preproduction test gates saved more than $40,000 a year.', 'Production rollbacks fell by over half, and CSAT rose 20%.'] },
      { year: '2025', role: 'Buncha, QA from zero', labels: ['race condition', 'double charge', 'wrong ETA', 'clock out bug', '404', 'P0 outage'],
        facts: ['Daily hotfixes became releases every two weeks.', 'SOS escalations went from 4 to 6 a week to 3 to 4 a month.', 'About 100K redundant daily service calls, gone.', 'Test orders went from 18 minutes to under one.', 'Bytecast and Forgeflow gave back 1,300+ engineering hours a year.', 'The Meijer launch shipped on schedule, about 370 orders a day.'] }
    ];
    var lv = 0, bugs = [], found = 0, active = false;
    function rects(){ return $$('g[clip-path] g[data-depth="26"] > g rect', sc).map(function(r){ return { x: +r.getAttribute('x'), y: +r.getAttribute('y'), w: +r.getAttribute('width'), h: +r.getAttribute('height') }; }).filter(function(r){ return r.x > 40 && r.x + r.w < 610 && r.w > 20 && r.y < 360; }); }
    function offset(){ var m = /translate\(([-\d.]+)[ ,]+([-\d.]+)\)/.exec(layer.parentNode.getAttribute('transform') || ''); return m ? { x: +m[1], y: +m[2] } : { x: 0, y: 0 }; }
    function place(){
      layer.innerHTML = ''; bugs = []; found = 0;
      var L = LEVELS[lv], rs = rects(), tries = 0;
      while (bugs.length < L.labels.length && tries++ < 400){
        var r = rs[(Math.random() * rs.length) | 0]; if (!r) break;
        var x = r.x + 8 + Math.random() * (r.w - 16), y = Math.max(r.y + 14, Math.min(420, r.y + 14 + Math.random() * Math.min(120, r.h - 24)));
        if (bugs.some(function(b){ return Math.hypot(b.x - x, b.y - y) < 70; })) continue;
        var g = document.createElementNS(NS, 'g'); g.setAttribute('class', 'hg-bug'); g.setAttribute('transform', 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ')');
        g.innerHTML = '<circle class="hg-ring" r="10"/><circle class="hg-dot" r="3.4"/><text x="14" y="4">' + L.labels[bugs.length] + '</text>';
        layer.appendChild(g); bugs.push({ x: x, y: y, el: g, found: false });
      }
      hud();
    }
    function hud(){ var L = LEVELS[lv]; elLevel.textContent = 'Level ' + (lv + 1) + ' of 4 · ' + L.year + ' · ' + L.role; elCount.textContent = 'Bugs found ' + found + ' of ' + bugs.length; }
    function show(k, t, p, b, fn){ cardK.textContent = k; cardT.textContent = t; cardP.textContent = p; cardB.textContent = b; cardB.onclick = fn; card.hidden = false; }
    function intro(){
      active = false; var L = LEVELS[lv]; place();
      show('Level ' + (lv + 1) + ' of 4 · ' + L.year, L.role, 'Bugs are hiding in the city, and only the lens can see them. Move it around and tap a bug when you spot it. The lens glows when you are close.', 'Start level ' + (lv + 1),
        function(){ card.hidden = true; active = true; elFact.textContent = ''; if (lv === 0) track('game_start'); });
    }
    function complete(){
      active = false; track('game_level', { level: lv + 1 });
      if (lv < LEVELS.length - 1){ var nx = LEVELS[lv + 1]; show('Level ' + (lv + 1) + ' complete', 'On to ' + nx.year, 'Next chapter: ' + nx.role + '. More bugs, harder to spot.', 'Next level', function(){ lv++; intro(); }); }
      else { track('game_complete'); show('Career complete', 'Every level was a real chapter', 'Ten years of finding what others miss. The case studies show how I turned that into a system.', 'Play again', function(){ lv = 0; intro(); }); }
    }
    sc.addEventListener('click', function(e){
      if (!active || e.target.closest('.hg-card')) return;
      var p = toSvg(e), o = offset(), tol = (e.pointerType === 'touch' || !e.pointerType) ? 34 : 28, hit = null;
      bugs.forEach(function(b){ if (!b.found && Math.hypot(b.x + o.x - p.x, b.y + o.y - p.y) < tol) hit = b; });
      if (hit){
        hit.found = true; hit.el.setAttribute('class', 'hg-bug found'); found++; if (window.__site && window.__site.sfx) window.__site.sfx('pop');
        elFact.textContent = LEVELS[lv].facts[found - 1] || ''; elFact.classList.remove('pop'); void elFact.offsetWidth; elFact.classList.add('pop');
        hud(); if (found === bugs.length) setTimeout(complete, 1400);
      } else { rim.classList.remove('miss'); void rim.getBoundingClientRect(); rim.classList.add('miss'); elFact.textContent = 'Nothing there. Keep looking.'; }
    });
    function loop(now){
      if (!running) return;
      if (!user && !reduce){ var t = (now - t0) / 1000; tx = 400 + Math.cos(t * 0.45) * 150; ty = 290 + Math.sin(t * 0.8) * 70; }
      lx += (tx - lx) * 0.14; ly += (ty - ly) * 0.14; px += (tpx - px) * 0.08; py += (tpy - py) * 0.08;
      lens.setAttribute('cx', lx.toFixed(1)); lens.setAttribute('cy', ly.toFixed(1));
      rim.setAttribute('transform', 'translate(' + lx.toFixed(1) + ' ' + ly.toFixed(1) + ')');
      if (!reduce) layers.forEach(function(l){ var d = +l.getAttribute('data-depth'); l.setAttribute('transform', 'translate(' + (-px * d).toFixed(1) + ' ' + (-py * d * 0.6).toFixed(1) + ')'); });
      if (active){ var o = offset(), near = false; bugs.forEach(function(b){ if (!b.found && Math.hypot(b.x + o.x - lx, b.y + o.y - ly) < 95) near = true; }); if (near) rim.classList.add('hot'); else rim.classList.remove('hot'); }
      requestAnimationFrame(loop);
    }
    whenVisible(sc, function(v){ if (v && !running){ running = true; requestAnimationFrame(loop); } else if (!v) running = false; });
    intro();
  });

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
  safe(function(){
    var btn = $('.serve-btn'), court = $('.serve-court'), count = $('.serve-count'); if (!btn || !court) return;
    var n = 0, lastT = 0, s = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 3 L14 8.5 L8.5 14 Z" fill="#FFFFFF" stroke="#9AA6C4" stroke-width="1"/><circle cx="14.6" cy="14.6" r="3.1" fill="#E9B872"/></svg>';
    btn.addEventListener('click', function(){
      var now = Date.now(); n = (now - lastT < 1400) ? n + 1 : 1; lastT = now; count.textContent = n > 1 ? 'Rally: ' + n : 'Nice serve';
      court.style.setProperty('--cw', (court.clientWidth * 0.8) + 'px');
      var el = document.createElement('span'); el.className = 'shuttle' + (n % 2 ? '' : ' back'); el.innerHTML = s; court.appendChild(el);
      setTimeout(function(){ if (el.parentNode) el.parentNode.removeChild(el); }, 1200);
    });
  });
  safe(function(){ var g = $('.gopuram'); if (g) onceVisible(g, function(){ g.classList.add('drawn'); }, 0.5); });
})();
