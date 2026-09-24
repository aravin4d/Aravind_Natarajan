(function(){
  'use strict';
  window.__mainReady = true;
  var root = document.documentElement;
  var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var fine = !!(window.matchMedia && window.matchMedia('(hover:hover) and (pointer:fine)').matches);
  var NS = 'http://www.w3.org/2000/svg';
  function $(s, r){ return (r || document).querySelector(s); }
  function $$(s, r){ return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function safe(fn){ try { fn(); } catch (e){ if (window.console) console.warn('main:', e); } }
  function track(name, data){ try { if (window.umami && typeof window.umami.track === 'function') window.umami.track(name, data); } catch (e){} }
  window.__track = track;

  /* one scroll loop for everything that follows the scroll */
  var onScroll = [], ticking = false;
  window.addEventListener('scroll', function(){ if (ticking) return; ticking = true; requestAnimationFrame(function(){ ticking = false; onScroll.forEach(function(f){ f(); }); }); }, { passive: true });
  function onView(el, cb, th){
    if (!('IntersectionObserver' in window)){ cb(el); return; }
    var io = new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.isIntersecting){ io.disconnect(); cb(el); } }); }, { threshold: th || 0.15 });
    io.observe(el);
  }
  var pend = [];
  function reveal(el, cls, th){ pend.push([el, cls]); onView(el, function(){ el.classList.add(cls); }, th); }
  function sweep(){ pend.forEach(function(p){ if (p[0].classList.contains(p[1])) return; var r = p[0].getBoundingClientRect(); if (r.top < window.innerHeight && r.bottom > 0) p[0].classList.add(p[1]); }); }
  var sweepT = 0; onScroll.push(function(){ clearTimeout(sweepT); sweepT = setTimeout(sweep, 400); }); setTimeout(sweep, 2500);

  /* ---------- time of day: the same mountain at morning, dusk or night ---------- */
  safe(function(){
    var btns = $$('.tod button');
    function mark(t){ btns.forEach(function(b){ b.setAttribute('aria-pressed', b.getAttribute('data-time') === t ? 'true' : 'false'); }); }
    mark(root.getAttribute('data-time'));
    btns.forEach(function(b){
      b.addEventListener('click', function(){
        var t = b.getAttribute('data-time'); if (root.getAttribute('data-time') === t) return;
        function apply(){
          root.setAttribute('data-time', t); mark(t);
          try { localStorage.setItem('av-time', t); } catch (e){}
          var ev; try { ev = new CustomEvent('timechange', { detail: t }); } catch (e){ ev = document.createEvent('CustomEvent'); ev.initCustomEvent('timechange', false, false, t); }
          document.dispatchEvent(ev);
        }
        track('time_change', { time: t });
        if (reduce || !document.startViewTransition){ apply(); return; }
        var r = b.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
        var R = Math.sqrt(Math.pow(Math.max(x, window.innerWidth - x), 2) + Math.pow(Math.max(y, window.innerHeight - y), 2));
        root.classList.add('vt-running');
        try {
          var vt = document.startViewTransition(apply);
          vt.ready.then(function(){ root.animate({ clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + R + 'px at ' + x + 'px ' + y + 'px)'] }, { duration: 700, easing: 'cubic-bezier(.65,0,.35,1)', pseudoElement: '::view-transition-new(root)' }); }).catch(function(){});
          vt.finished.then(function(){ root.classList.remove('vt-running'); }, function(){ root.classList.remove('vt-running'); });
        } catch (e){ apply(); root.classList.remove('vt-running'); }
      });
    });
  });

  /* ---------- the name emerges from the haze, on every load ---------- */
  safe(function(){
    var nm = $('.h-name'); if (!nm) return;
    var txt = nm.textContent.trim(); nm.setAttribute('aria-label', txt); nm.textContent = '';
    txt.split(' ').forEach(function(word, wi){
      var w = document.createElement('span'); w.className = 'nw'; w.setAttribute('aria-hidden', 'true');
      word.split('').forEach(function(ch){ var s = document.createElement('span'); s.className = 'nl'; s.textContent = ch; s.style.setProperty('--d', (0.1 + Math.random() * 0.8).toFixed(2) + 's'); w.appendChild(s); });
      nm.appendChild(w); if (wi === 0) nm.appendChild(document.createTextNode(' '));
    });
    requestAnimationFrame(function(){ requestAnimationFrame(function(){ root.classList.add('intro-go'); }); });
    setTimeout(function(){ root.classList.add('intro-done'); }, 3200);
  });

  /* ---------- reveals ---------- */
  safe(function(){ $$('[data-reveal]').forEach(function(el){ reveal(el, 'in', parseFloat(el.getAttribute('data-reveal')) || 0.15); }); });

  /* ---------- the altimeter: where you are on the climb ---------- */
  var camps = $$('[data-camp]');
  safe(function(){
    var nav = $('.alt'), items = $$('.alt li'), readM = $('#altM'), readC = $('#altCamp'), tb = $('.trail-btn'), sheet = $('#trailSheet'), tbl = $('.trail-btn .tb-l'), cur = -1;
    function setCamp(i){ if (i === cur) return; cur = i; items.forEach(function(li, k){ if (k === i) li.classList.add('on'); else li.classList.remove('on'); }); var n = camps[i] ? camps[i].getAttribute('data-camp') : ''; if (readC) readC.textContent = n; if (tbl) tbl.textContent = n; }
    function update(){
      var mid = window.innerHeight * 0.45, best = 0;
      camps.forEach(function(s, i){ if (s.getBoundingClientRect().top <= mid) best = i; });
      setCamp(best);
      var max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight), pr = Math.min(1, window.pageYOffset / max);
      if (readM) readM.textContent = Math.round(pr * 4808).toLocaleString('en-US') + ' m';
      if (nav) nav.style.setProperty('--pr', pr.toFixed(4));
    }
    onScroll.push(update); window.addEventListener('resize', update); update();
    if (tb && sheet){
      var openSheet = function(){ sheet.hidden = false; tb.setAttribute('aria-expanded', 'true'); requestAnimationFrame(function(){ sheet.classList.add('show'); }); };
      var closeSheet = function(){ sheet.classList.remove('show'); tb.setAttribute('aria-expanded', 'false'); setTimeout(function(){ sheet.hidden = true; }, 220); };
      tb.addEventListener('click', function(e){ e.stopPropagation(); if (sheet.hidden) openSheet(); else closeSheet(); });
      sheet.addEventListener('click', function(e){ if (e.target.closest('a')) closeSheet(); });
      document.addEventListener('click', function(e){ if (!sheet.hidden && !sheet.contains(e.target) && e.target !== tb) closeSheet(); });
      document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && !sheet.hidden) closeSheet(); });
    }
  });

  /* ---------- the climb in numbers: every marker visible, each one opens its story ---------- */
  safe(function(){
    var sec = $('#proof'); if (!sec) return;
    var mks = $$('.mk', sec), seen = {};
    if (!reduce) sec.classList.add('climb-ready');
    reveal(sec, 'climb-in', 0.2);
    function on(m){ mks.forEach(function(x){ if (x === m) x.classList.add('on'); else x.classList.remove('on'); }); sec.classList.add('has-on'); var id = m.getAttribute('data-id'); if (!seen[id]){ seen[id] = 1; track('proof_marker', { id: id }); } }
    function off(){ mks.forEach(function(x){ x.classList.remove('on'); }); sec.classList.remove('has-on'); }
    mks.forEach(function(m){
      if (fine) m.addEventListener('mouseenter', function(){ on(m); });
      m.addEventListener('focus', function(){ on(m); });
      m.addEventListener('click', function(e){ if (e.target.closest('[data-open]')) return; if (m.classList.contains('on') && !fine) off(); else on(m); });
    });
    if (fine) $('.climb', sec).addEventListener('mouseleave', off);
  });

  /* ---------- dialogs: case studies and the letter open over the page ---------- */
  var openDlg = null;
  function openDialog(d){
    if (!d) return;
    if (openDlg && openDlg !== d) closeDialog(openDlg, true);
    if (!d.open){ if (typeof d.showModal === 'function') d.showModal(); else d.setAttribute('open', ''); }
    openDlg = d; root.classList.add('dlg-open'); d.scrollTop = 0;
    var inner = $('.dlg-in', d);
    if (inner && !reduce && inner.animate) inner.animate([{ opacity: 0, transform: 'translateY(14px) scale(.975)' }, { opacity: 1, transform: 'none' }], { duration: 240, easing: 'cubic-bezier(.23,1,.32,1)' });
    track(d.id === 'letter' ? 'letter_read' : 'case_open', { id: d.id });
  }
  function closeDialog(d, instant){
    if (!d || !d.open) return;
    function done(){ if (typeof d.close === 'function') d.close(); else d.removeAttribute('open'); if (openDlg === d) openDlg = null; if (!$('dialog[open]')) root.classList.remove('dlg-open'); }
    var inner = $('.dlg-in', d);
    if (instant || reduce || !inner || !inner.animate){ done(); return; }
    var a = inner.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(10px) scale(.985)' }], { duration: 150, easing: 'ease-in' });
    a.onfinish = done;
  }
  window.__dlg = { open: openDialog, close: closeDialog };
  safe(function(){
    $$('dialog.dlg').forEach(function(d){
      d.addEventListener('click', function(e){ if (e.target === d) closeDialog(d); });
      d.addEventListener('cancel', function(e){ e.preventDefault(); closeDialog(d); });
      d.addEventListener('close', function(){ if (openDlg === d) openDlg = null; if (!$('dialog[open]')) root.classList.remove('dlg-open'); });
      $$('[data-close]', d).forEach(function(b){ b.addEventListener('click', function(){ closeDialog(d); }); });
    });
    document.addEventListener('click', function(e){
      var a = e.target.closest ? e.target.closest('[data-open]') : null; if (!a) return;
      var d = document.getElementById(a.getAttribute('data-open')); if (!d) return;
      e.preventDefault(); openDialog(d);
    });
  });

  /* ---------- the envelope: spins now and then; tap and it opens fast ---------- */
  safe(function(){
    var env = $('.env'), dlg = document.getElementById('letter'); if (!env || !dlg) return;
    var busy = false, visible = false, hovering = false, timers = [], handLoaded = false;
    function loadHand(){ if (handLoaded) return; handLoaded = true; var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?family=Caveat:wght@500;600&display=swap'; document.head.appendChild(l); }
    ['pointerenter', 'focus', 'touchstart'].forEach(function(ev){ env.addEventListener(ev, loadHand, { passive: true }); });
    function spin(){ if (reduce || hovering || busy) return; env.classList.remove('spin'); void env.offsetWidth; env.classList.add('spin'); }
    env.addEventListener('animationend', function(e){ if (e.animationName === 'envSpin') env.classList.remove('spin'); });
    env.addEventListener('pointerenter', function(){ hovering = true; env.classList.remove('spin'); });
    env.addEventListener('pointerleave', function(){ hovering = false; });
    if ('IntersectionObserver' in window) new IntersectionObserver(function(es){ var v = es[0].isIntersecting; if (v && !visible){ loadHand(); setTimeout(spin, 300); } visible = v; }, { threshold: 0.5 }).observe(env);
    setInterval(function(){ if (visible && !document.hidden) spin(); }, 7000);
    function at(ms, fn){ timers.push(setTimeout(fn, ms)); }
    env.addEventListener('click', function(){
      if (busy) return; loadHand(); track('letter_open');
      if (reduce){ openDialog(dlg); return; }
      busy = true; env.classList.remove('spin'); env.classList.add('turn');
      at(300, function(){ env.classList.add('crack'); });
      at(400, function(){ env.classList.add('lift'); });
      at(560, function(){ env.classList.add('rise'); });
      at(800, function(){ openDialog(dlg); });
      at(1400, function(){ ['turn', 'crack', 'lift', 'rise'].forEach(function(c){ env.classList.remove(c); }); busy = false; });
    });
  });

  /* ---------- experience: one swift cut from the right opens each chapter ---------- */
  function cut(cv){
    var top = $('.xc-top', cv), bot = $('.xc-bot', cv), under = $('.xc-under', cv), kat = $('.xc-katana', cv), line = $('.xc-slash', cv);
    if (reduce || !cv.animate || !kat){ cv.classList.add('cut'); return; }
    var W = cv.clientWidth, H = cv.clientHeight, len = Math.sqrt(W * W + Math.pow(0.26 * H, 2)), ang = Math.atan2(0.26 * H, W) * 180 / Math.PI;
    line.style.width = len + 'px'; line.style.left = (W - len) + 'px'; line.style.top = (0.38 * H) + 'px';
    function k(x, y, r, s, o){ return { transform: 'translate(-50%,-50%) translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) rotate(' + r + 'deg) scale(' + s + ')', opacity: o }; }
    kat.animate([k(W * 0.62, -H * 0.26, 160, 0.75, 0), k(W * 0.34, -H * 0.16, 20, 1, 1), k(-W * 0.1, H * 0.01, -120, 1.12, 1), k(-W * 0.62, H * 0.16, -200, 1.2, 0)],
      { duration: 640, easing: 'cubic-bezier(.33,.6,.25,1)', fill: 'forwards' });
    line.animate([{ transform: 'rotate(' + ang + 'deg) scaleX(0)', opacity: 1 }, { transform: 'rotate(' + ang + 'deg) scaleX(1)', opacity: 1, offset: 0.7 }, { transform: 'rotate(' + ang + 'deg) scaleX(1)', opacity: 0 }],
      { duration: 460, delay: 160, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' });
    top.animate([{ transform: 'none' }, { transform: 'translate(-5%,-72%) rotate(-3deg)' }], { duration: 540, delay: 380, easing: 'cubic-bezier(.7,0,.25,1)', fill: 'forwards' });
    bot.animate([{ transform: 'none' }, { transform: 'translate(5%,72%) rotate(3deg)' }], { duration: 540, delay: 380, easing: 'cubic-bezier(.7,0,.25,1)', fill: 'forwards' });
    under.animate([{ opacity: 0, transform: 'scale(.96)' }, { opacity: 1, transform: 'none' }], { duration: 440, delay: 500, easing: 'cubic-bezier(.23,1,.32,1)', fill: 'forwards' });
    setTimeout(function(){ cv.classList.add('cut'); }, 1000);
  }
  safe(function(){ $$('.xc').forEach(function(cv){ if (!reduce) cv.classList.add('cut-ready'); onView(cv, function(){ cut(cv); track('chapter_open', { id: cv.id }); }, 0.5); }); });

  /* ---------- moments, growth paths, rhythm stack, chips ---------- */
  safe(function(){
    if (reduce) return;
    $$('.xs-grid').forEach(function(g){ g.classList.add('m-ready'); reveal(g, 'm-in', 0.12); });
    $$('.gp').forEach(function(g){ g.classList.add('gp-ready'); reveal(g, 'gp-in', 0.6); });
    $$('.rh-card').forEach(function(c, i){ c.style.setProperty('--i', i); c.classList.add('rh-ready'); reveal(c, 'rh-in', 0.35); });
    $$('.chips').forEach(function(b){ $$('.chip', b).forEach(function(c, i){ c.style.setProperty('--i', i); }); b.classList.add('ch-ready'); reveal(b, 'ch-in', 0.3); });
    $$('.cs-row').forEach(function(r, i){ r.style.setProperty('--i', i); });
    var rows = $('.cs-rows'); if (rows){ rows.classList.add('rows-ready'); reveal(rows, 'rows-in', 0.15); }
  });

  /* ---------- built: each device leans toward the cursor ---------- */
  safe(function(){
    if (!fine || reduce) return;
    $$('.tool').forEach(function(t){
      var vis = $('.tool-vis', t), rig = vis && $('.bv-rig', vis); if (!rig) return;
      t.addEventListener('pointermove', function(e){ var r = vis.getBoundingClientRect(), px = (e.clientX - (r.left + r.width / 2)) / r.width, py = (e.clientY - (r.top + r.height / 2)) / r.height;
        rig.style.setProperty('--ry', Math.max(-22, Math.min(22, px * 28)).toFixed(1) + 'deg'); rig.style.setProperty('--rx', Math.max(-10, Math.min(16, -py * 16 + 5)).toFixed(1) + 'deg'); });
      t.addEventListener('pointerleave', function(){ rig.style.removeProperty('--ry'); rig.style.removeProperty('--rx'); });
    });
  });

  /* ---------- résumé: easy to find, with a quiet nudge ---------- */
  safe(function(){
    var hb = $('.btn-cv');
    function nudge(){ if (!hb || reduce || root.classList.contains('dlg-open')) return; hb.classList.remove('nudge'); void hb.offsetWidth; hb.classList.add('nudge'); }
    setTimeout(nudge, 8000); setInterval(nudge, 50000);
    var endX = document.getElementById('xp-end'), toast = document.getElementById('cvToast');
    function hide(){ if (!toast) return; toast.classList.remove('show'); setTimeout(function(){ toast.hidden = true; }, 260); }
    if (endX && toast){
      onView(endX, function(){
        var shown = false; try { shown = !!sessionStorage.getItem('av-cvt'); sessionStorage.setItem('av-cvt', '1'); } catch (e){}
        if (shown) return; toast.hidden = false; requestAnimationFrame(function(){ toast.classList.add('show'); }); setTimeout(hide, 9000);
      }, 0.6);
      var x = $('.cvt-x', toast); if (x) x.addEventListener('click', hide);
    }
    $$('[data-cv]').forEach(function(a){ a.addEventListener('click', function(){ track(a.hasAttribute('download') ? 'resume_download' : 'resume_view', { from: a.getAttribute('data-cv') }); }); });
    $$('a[href^="mailto:"]').forEach(function(a){ a.addEventListener('click', function(){ track('contact_email'); }); });
    $$('a[href*="linkedin.com"]').forEach(function(a){ a.addEventListener('click', function(){ track('contact_linkedin'); }); });
  });

  /* ---------- analytics: which parts of the climb people reach ---------- */
  safe(function(){ camps.forEach(function(s){ onView(s, function(){ track('section', { name: s.getAttribute('data-camp') }); }, 0.3); }); });

  /* ---------- the trail: a line that runs down the page gutters, never through text ---------- */
  safe(function(){
    if (!fine) return;
    var svg = document.createElementNS(NS, 'svg'); svg.setAttribute('class', 'trail'); svg.setAttribute('aria-hidden', 'true');
    svg.innerHTML = '<path class="trail-ghost"/><path class="trail-line"/><circle class="trail-dot" r="4.5"/>';
    document.body.appendChild(svg);
    var ghost = $('.trail-ghost', svg), line = $('.trail-line', svg), dot = $('.trail-dot', svg), total = 1, samples = [], built = false;
    function spline(pts){ var d = 'M' + pts[0][0].toFixed(1) + ' ' + pts[0][1].toFixed(1);
      for (var i = 0; i < pts.length - 1; i++){ var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
        d += ' C' + (p1[0] + (p2[0] - p0[0]) / 6).toFixed(1) + ' ' + (p1[1] + (p2[1] - p0[1]) / 6).toFixed(1) + ' ' + (p2[0] - (p3[0] - p1[0]) / 6).toFixed(1) + ' ' + (p2[1] - (p3[1] - p1[1]) / 6).toFixed(1) + ' ' + p2[0].toFixed(1) + ' ' + p2[1].toFixed(1); }
      return d; }
    function build(){
      var W = document.documentElement.clientWidth, H = document.documentElement.scrollHeight;
      if (W < 1180){ svg.style.display = 'none'; built = false; return; }
      svg.style.display = ''; svg.setAttribute('width', W); svg.setAttribute('height', H); svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      var wrapW = Math.min(1160, W - 64), gut = (W - wrapW) / 2, gl = Math.max(16, gut * 0.42), gr = W - gl, y0 = window.pageYOffset, pts = [[gl, window.innerHeight * 0.6]];
      $$('main > section').forEach(function(s, i){
        var r = s.getBoundingClientRect(); if (r.height < 40) return;
        var top = r.top + y0, bot = r.bottom + y0, x = i % 2 ? gr : gl, w = (i % 2 ? -1 : 1) * Math.min(22, gut * 0.22);
        if (i > 0) pts.push([x, top + 60]); pts.push([x + w, (top + bot) / 2], [x, bot - 40]);
      });
      var cv = $('#contact [data-cv]');
      if (cv){ var rr = cv.getBoundingClientRect(); pts.push([rr.left - 34, rr.top + y0 + rr.height / 2]); }
      var d = spline(pts); ghost.setAttribute('d', d); line.setAttribute('d', d);
      total = line.getTotalLength(); line.style.strokeDasharray = total.toFixed(1); samples = [];
      for (var k = 0; k <= 600; k++){ var L = total * k / 600, q = line.getPointAtLength(L); samples.push([L, q.x, q.y]); }
      built = true; draw();
    }
    function draw(){
      if (!built) return;
      var target = window.pageYOffset + window.innerHeight * 0.55, best = samples[0];
      for (var i = 0; i < samples.length; i++){ if (samples[i][2] <= target) best = samples[i]; else break; }
      line.style.strokeDashoffset = (total - best[0]).toFixed(1);
      dot.setAttribute('cx', best[1].toFixed(1)); dot.setAttribute('cy', best[2].toFixed(1));
      if (best[0] >= total - 2) svg.classList.add('done'); else svg.classList.remove('done');
    }
    var rt = 0; function later(){ clearTimeout(rt); rt = setTimeout(build, 180); }
    window.addEventListener('resize', later); window.addEventListener('load', later);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(later);
    if ('ResizeObserver' in window) new ResizeObserver(later).observe(document.body);
    onScroll.push(draw); later();
  });

  /* ---------- painted fallback moves gently when there's no 3D ---------- */
  safe(function(){
    var paint = $('.env-paint'); if (!paint) return;
    onScroll.push(function(){ if (!root.classList.contains('no-3d')) return; var max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight); paint.style.setProperty('--sp', Math.min(1, window.pageYOffset / max).toFixed(4)); });
  });
})();
