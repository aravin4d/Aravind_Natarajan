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
  /* shared with motion.js, sections.js and letter.js */
  window.__site = { $: $, $$: $$, reduce: reduce, fine: fine, safe: safe, track: function(n, d){ if (window.__track) window.__track(n, d); }, onScroll: function(f){ onScroll.push(f); }, onView: function(el, cb, th){ onView(el, cb, th); } };
  window.__site.sfx = function(n, o){ try { if (window.__sound) window.__sound.play(n, o); } catch (e){} };

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
          vt.ready.then(function(){ root.animate({ clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + R + 'px at ' + x + 'px ' + y + 'px)'] }, { duration: 900, easing: 'cubic-bezier(.65,0,.35,1)', pseudoElement: '::view-transition-new(root)' }); }).catch(function(){});
          vt.finished.then(function(){ root.classList.remove('vt-running'); }, function(){ root.classList.remove('vt-running'); });
        } catch (e){ apply(); root.classList.remove('vt-running'); }
      });
    });
  });

  /* ---------- hello: the name drops in letter by letter, lands with a squash, and stays playful ---------- */
  function emit(name, detail){ var ev; try { ev = new CustomEvent(name, { detail: detail }); } catch (e){ ev = document.createEvent('CustomEvent'); ev.initCustomEvent(name, false, false, detail); } document.dispatchEvent(ev); }
  window.__emit = emit; window.__site.emit = emit;
  safe(function(){
    var nm = $('.h-name'); if (!nm) return;
    var txt = nm.textContent.trim(); nm.setAttribute('aria-label', txt); nm.textContent = '';
    var L = [], n = 0;
    txt.split(' ').forEach(function(word, wi){
      var w = document.createElement('span'); w.className = 'nw'; w.setAttribute('aria-hidden', 'true');
      word.split('').forEach(function(ch){ var s = document.createElement('span'); s.className = 'nl'; s.textContent = ch;
        s.style.setProperty('--d', (0.08 + n * 0.047 + Math.random() * 0.05).toFixed(3) + 's');
        s.style.setProperty('--r', ((Math.random() - 0.5) * 34).toFixed(1) + 'deg');
        s.style.setProperty('--h', (0.75 + Math.random() * 0.8).toFixed(2));
        w.appendChild(s); L.push(s); n++; });
      nm.appendChild(w); if (wi === 0) nm.appendChild(document.createTextNode(' '));
    });
    /* each letter keeps its resting width, so weight changes never shove its neighbours */
    var probe = document.createElement('span'); probe.className = 'nl-probe'; probe.setAttribute('aria-hidden', 'true'); nm.appendChild(probe);
    function fix(){ L.forEach(function(s){ probe.textContent = s.textContent; s.style.width = probe.getBoundingClientRect().width.toFixed(2) + 'px'; }); }
    var started = false;
    function start(){ if (started) return; started = true; fix();
      var lastD = parseFloat(L[L.length - 1].style.getPropertyValue('--d')) || 0.9;
      requestAnimationFrame(function(){ requestAnimationFrame(function(){
        root.classList.add('intro-go');
        setTimeout(function(){ emit('intro:landed'); }, reduce ? 0 : (lastD + 0.42) * 1000);
        setTimeout(function(){ root.classList.add('intro-done'); }, reduce ? 0 : (lastD + 1.15) * 1000);
      }); }); }
    if (document.fonts && document.fonts.load){ document.fonts.load('500 100px Newsreader').then(start, start); setTimeout(start, 900);
      document.fonts.addEventListener && document.fonts.addEventListener('loadingdone', function(){ setTimeout(fix, 30); }); } else start();
    var rz = 0; window.addEventListener('resize', function(){ clearTimeout(rz); rz = setTimeout(fix, 150); });
    /* the letters lean in and get bolder near the cursor */
    var st = L.map(function(){ return { w: 500, y: 0, r: 0 }; }), hx = 0, hy = 0, on = false, raf = 0;
    function tick(){ raf = 0; var busy = false, ready = root.classList.contains('intro-done');
      if (ready) L.forEach(function(s, i){ var r = s.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, dx = hx - cx, dy = (hy - cy) * 0.7, sg = r.height * 0.7, f = on ? Math.exp(-(dx * dx + dy * dy) / (2 * sg * sg)) : 0, S = st[i];
        var tw = 500 + 330 * f, ty = -0.07 * f, tr = (dx > 0 ? -1 : 1) * 5 * f;
        S.w += (tw - S.w) * 0.2; S.y += (ty - S.y) * 0.2; S.r += (tr - S.r) * 0.2;
        if (Math.abs(tw - S.w) > 0.8 || Math.abs(ty - S.y) > 0.001 || Math.abs(tr - S.r) > 0.02) busy = true;
        s.style.fontWeight = Math.round(S.w);
        s.style.transform = Math.abs(S.y) < 0.0005 && Math.abs(S.r) < 0.02 ? '' : 'translateY(' + S.y.toFixed(3) + 'em) rotate(' + S.r.toFixed(2) + 'deg)'; });
      if (busy || on) raf = requestAnimationFrame(tick); }
    if (fine && !reduce){
      nm.addEventListener('pointermove', function(e){ hx = e.clientX; hy = e.clientY; on = true; if (!raf) raf = requestAnimationFrame(tick); });
      nm.addEventListener('pointerleave', function(){ on = false; if (!raf) raf = requestAnimationFrame(tick); });
    }
    /* tap a letter and it jumps */
    L.forEach(function(s){ s.addEventListener('click', function(){ if (reduce) return; s.classList.remove('boing'); void s.offsetWidth; s.classList.add('boing'); }); });
    nm.addEventListener('animationend', function(e){ if (e.animationName === 'boing') e.target.classList.remove('boing'); });
    var hi = $('.h-hi'); if (hi && !reduce) hi.addEventListener('pointerenter', function(){ hi.classList.remove('wave-again'); void hi.offsetWidth; hi.classList.add('wave-again'); });
  });

  /* ---------- the letter peeks in from the edge of the first screen ---------- */
  safe(function(){
    var pk = $('.h-peek'), band = document.getElementById('letter-sec'); if (!pk || !band) return;
    pk.addEventListener('click', function(e){ e.preventDefault(); track('letter_peek'); window.__site.sfx('whoosh', { d: 0.9 });
      var y = band.getBoundingClientRect().top + window.pageYOffset - Math.max(0, (window.innerHeight - band.offsetHeight) / 2);
      window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' }); pk.classList.add('sent');
      setTimeout(function(){ window.__emit('env:greet'); }, reduce ? 0 : 800); });
    function upd(){ var r = band.getBoundingClientRect(); if (r.top < window.innerHeight * 0.86) pk.classList.add('gone'); else { pk.classList.remove('gone'); pk.classList.remove('sent'); } }
    onScroll.push(upd); upd();
    if (!reduce) setInterval(function(){ if (document.hidden || pk.classList.contains('gone') || pk.matches(':hover')) return; pk.classList.remove('nudge'); void pk.offsetWidth; pk.classList.add('nudge'); }, 6500);
    pk.addEventListener('animationend', function(e){ if (e.animationName === 'peekNudge') pk.classList.remove('nudge'); });
  });

  /* ---------- reveals ---------- */
  safe(function(){ $$('[data-reveal]').forEach(function(el){ reveal(el, 'in', parseFloat(el.getAttribute('data-reveal')) || 0.15); }); });

  /* ---------- the altimeter: where you are on the climb ---------- */
  /* the real mountain behind each theme: [peak, summit metres, start metres, camp metres] */
  var PEAKS = { night: ['Doddabetta', 2637, 330, 2240], morning: ['Mont Blanc', 4808, 1035, 1224], dusk: ['Emi Koussi', 3415, 900, 520] };
  window.__peaks = PEAKS;
  window.__site.peaks = PEAKS; window.__site.altitude = function(pr){ return altitude(pr); }; window.__site.summitP = function(){ return summitP(); };
  function summitP(){ var sm = document.getElementById('summit'), max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight); if (!sm) return 0.62;
    var r = sm.getBoundingClientRect(); return Math.min(0.95, Math.max(0.15, (r.top + window.pageYOffset + r.height / 2 - window.innerHeight / 2) / max)); }
  function ease2(t){ return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  function altitude(pr){ var P = PEAKS[root.getAttribute('data-time')] || PEAKS.morning, sp = summitP(); return pr <= sp ? P[2] + (P[1] - P[2]) * ease2(pr / sp) : P[1] - (P[1] - P[3]) * ease2((pr - sp) / (1 - sp)); }
  var camps = $$('[data-camp]');
  safe(function(){
    var nav = $('.alt'), items = $$('.alt li'), readM = $('#altM'), readC = $('#altCamp'), tb = $('.trail-btn'), sheet = $('#trailSheet'), tbl = $('.trail-btn .tb-l'), cur = -1;
    function setCamp(i){ if (i === cur) return; if (items[i]){ var d0 = $('.alt-dot', items[i]); if (d0 && !reduce){ d0.classList.remove('hop'); void d0.offsetWidth; d0.classList.add('hop');
      [i - 1, i + 1].forEach(function(k, n){ var dn = items[k] && $('.alt-dot', items[k]); if (dn) setTimeout(function(){ dn.classList.remove('nudge'); void dn.offsetWidth; dn.classList.add('nudge'); }, 80 + n * 50); }); } } cur = i; items.forEach(function(li, k){ if (k === i) li.classList.add('on'); else li.classList.remove('on'); }); var n = camps[i] ? camps[i].getAttribute('data-camp') : ''; if (readC) readC.textContent = n; if (tbl) tbl.textContent = n; }
    function update(){
      var mid = window.innerHeight * 0.45, best = 0;
      camps.forEach(function(s, i){ if (s.getBoundingClientRect().top <= mid) best = i; });
      setCamp(best);
      var max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight), pr = Math.min(1, window.pageYOffset / max);
      if (readM) readM.textContent = Math.round(altitude(pr)).toLocaleString('en-US') + ' m';
      if (readC && camps[best] && camps[best].id === 'summit'){ var pk = PEAKS[root.getAttribute('data-time')]; if (pk) readC.textContent = pk[0] + ' summit'; }
      if (nav) nav.style.setProperty('--pr', pr.toFixed(4));
    }
    onScroll.push(update); window.addEventListener('resize', update); document.addEventListener('timechange', function(){ cur = -1; update(); }); update();
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

  /* ---------- dialogs: a case study grows out of whatever opened it, then unfolds like a trail map ----------
     The folded copy is cut from the dialog's own content, so the page that unfolds is the page you read.
     Panels hinge on each other like a Z-folded map; the letter folds in thirds instead. Closing folds it
     back up and it shrinks into the tile it came from. */
  var openDlg = null;
  function inView(r){ return !!r && r.width > 4 && r.height > 4 && r.bottom > 0 && r.top < window.innerHeight && r.right > 0 && r.left < window.innerWidth; }
  function rectOf(el){ if (!el || !el.isConnected) return null; var r = el.getBoundingClientRect(); return inView(r) ? r : null; }
  function srcOf(a){ return a ? (a.closest('.cs-row a, .xs-m, .mk-card, .cs-next button') || a) : null; }
  function midRect(){ var w = Math.min(260, window.innerWidth * 0.5); return { left: (window.innerWidth - w) / 2, top: window.innerHeight * 0.4, width: w, height: w * 0.6 }; }
  function foldT(k, a){ var sg = k % 2 ? -1 : 1; return 'rotateX(' + (sg * 180 * a).toFixed(2) + 'deg) translateZ(' + (a > 0.5 ? -sg : 0) + 'px)'; }
  function buildFold(d, inner, n, kind){
    var R = inner.getBoundingClientRect(), vh = window.innerHeight, top = Math.max(0, R.top), bot = Math.min(vh, R.bottom), H = Math.max(90, bot - top);
    var N = n || Math.max(3, Math.min(5, Math.round(H / 200))), ph = H / N;
    var g = document.createElement('div'); g.className = 'fold-ghost fg-' + kind; g.setAttribute('aria-hidden', 'true');
    g.style.cssText = 'left:' + R.left.toFixed(1) + 'px;top:' + top.toFixed(1) + 'px;width:' + R.width.toFixed(1) + 'px;height:' + ph.toFixed(1) + 'px';
    var host = g, P = [], SH = [];
    for (var k = 0; k < N; k++){
      var p = document.createElement('div'), ff = document.createElement('div'), fb = document.createElement('div'), s1 = document.createElement('i'), s2 = document.createElement('i');
      p.className = 'fold'; p.style.height = ph.toFixed(1) + 'px'; ff.className = 'ff'; fb.className = 'fb'; s1.className = 'fsh'; s2.className = 'fsh';
      var c = inner.cloneNode(true); c.removeAttribute('id'); $$('[id]', c).forEach(function(e){ e.removeAttribute('id'); }); c.classList.add('fold-c'); c.style.cssText = 'position:absolute;left:0;margin:0;opacity:1;width:' + R.width.toFixed(1) + 'px;top:' + (R.top - top - k * ph).toFixed(1) + 'px';
      ff.appendChild(c); ff.appendChild(s1); fb.appendChild(s2); p.appendChild(ff); p.appendChild(fb); host.appendChild(p); host = p; P.push(p); SH.push([s1, s2]);
    }
    d.appendChild(g);
    return { g: g, P: P, SH: SH, N: N, ph: ph, R: R, top: top };
  }
  function flip(F, s){ return 'translate(' + (s.left - F.R.left).toFixed(1) + 'px,' + (s.top - F.top).toFixed(1) + 'px) scale(' + Math.max(0.02, s.width / F.R.width).toFixed(4) + ',' + Math.max(0.02, s.height / F.ph).toFixed(4) + ')'; }
  function clearFold(d){ clearTimeout(d.__ft); $$('.fold-ghost', d).forEach(function(x){ x.parentNode.removeChild(x); }); var inn = $('.dlg-in', d); if (inn) inn.style.opacity = ''; }
  function foldOpen(d, from, kind){
    var inner = $('.dlg-in', d); clearFold(d); inner.style.opacity = '0';
    var F = buildFold(d, inner, kind === 'letter' ? 3 : 0, kind), N = F.N, s = from || midRect(), letter = kind === 'letter';
    var A = letter ? 340 : 300, ST = letter ? 190 : 120, U = letter ? 420 : 330;
    for (var k = 1; k < N; k++) F.P[k].style.transform = foldT(k, 1);
    F.g.animate([{ transform: flip(F, s), opacity: 0.3 }, { opacity: 1, offset: 0.3 }, { transform: 'none', opacity: 1 }], { duration: A, easing: 'cubic-bezier(.2,.85,.25,1)', fill: 'both' });
    var tint = document.createElement('i'); tint.className = 'fg-tint'; F.P[0].firstChild.appendChild(tint);
    tint.animate([{ opacity: 1 }, { opacity: 1, offset: 0.35 }, { opacity: 0 }], { duration: A, easing: 'ease-in', fill: 'both' });
    for (k = 1; k < N; k++){ var del = A - 70 + (k - 1) * ST, sg = k % 2 ? -1 : 1;
      F.P[k].animate([{ transform: foldT(k, 1) }, { transform: 'rotateX(' + (-sg * 7) + 'deg) translateZ(0px)', offset: 0.78 }, { transform: 'rotateX(0deg) translateZ(0px)' }], { duration: U, delay: del, easing: 'cubic-bezier(.35,.6,.3,1)', fill: 'both' });
      F.SH[k].forEach(function(x){ x.animate([{ opacity: 0.6 }, { opacity: 0 }], { duration: U, delay: del, easing: 'ease-out', fill: 'both' }); }); }
    var total = A - 70 + (N - 2) * ST + U;
    if (letter) emit('dlg:folds', { id: d.id, top: F.top, ph: F.ph, n: N, x: F.R.left, w: F.R.width, a: A, st: ST, u: U });
    window.__site.sfx('unfold', { n: N, at: A - 70, st: ST, u: U, letter: letter });
    d.__ft = setTimeout(function(){ inner.style.opacity = ''; requestAnimationFrame(function(){ if (F.g.parentNode) F.g.parentNode.removeChild(F.g); }); emit('dlg:shown', d.id); }, total + 30);
  }
  function foldClose(d, to, kind, done){
    var inner = $('.dlg-in', d); clearFold(d);
    var F = buildFold(d, inner, kind === 'letter' ? 3 : 0, kind), N = F.N, ST = 75, U = 220; inner.style.opacity = '0'; window.__site.sfx('fold', { n: N, st: ST, u: U, letter: kind === 'letter' });
    for (var k = N - 1; k >= 1; k--){ var del = (N - 1 - k) * ST;
      F.P[k].animate([{ transform: 'rotateX(0deg) translateZ(0px)' }, { transform: foldT(k, 1) }], { duration: U, delay: del, easing: 'cubic-bezier(.55,0,.7,.4)', fill: 'both' });
      F.SH[k].forEach(function(x){ x.animate([{ opacity: 0 }, { opacity: 0.6 }], { duration: U, delay: del, fill: 'both' }); }); }
    var t1 = Math.max(0, N - 2) * ST + U - 40, s = to || midRect(), tint = document.createElement('i'); tint.className = 'fg-tint'; F.P[0].firstChild.appendChild(tint);
    tint.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, delay: t1, fill: 'both' });
    F.g.animate([{ transform: 'none', opacity: 1 }, { opacity: 1, offset: 0.75 }, { transform: flip(F, s), opacity: to ? 0.5 : 0 }], { duration: 260, delay: t1, easing: 'cubic-bezier(.5,0,.3,1)', fill: 'both' });
    d.__ft = setTimeout(done, t1 + 270);
  }
  function openDialog(d, from, srcEl){
    if (!d) return;
    if (openDlg && openDlg !== d) closeDialog(openDlg, true);
    var fresh = !d.open;
    if (fresh){ if (typeof d.showModal === 'function') d.showModal(); else d.setAttribute('open', ''); }
    openDlg = d; root.classList.add('dlg-open'); d.scrollTop = 0; d.__src = srcEl || null;
    requestAnimationFrame(function(){ d.classList.add('dlg-on'); });
    var inner = $('.dlg-in', d);
    if (fresh && inner && !reduce && inner.animate){
      if (srcEl && !srcEl.closest('dialog') && srcEl.matches && srcEl.matches('.cs-row a, .xs-m, .mk-card')) srcEl.classList.add('dlg-src');
      foldOpen(d, from, d.id === 'letter' ? 'letter' : 'map');
    } else emit('dlg:shown', d.id);
    track(d.id === 'letter' ? 'letter_read' : 'case_open', { id: d.id });
  }
  function closeDialog(d, instant){
    if (!d || !d.open || d.__closing) return;
    function done(){ d.__closing = false; clearFold(d); d.classList.remove('dlg-on'); if (typeof d.close === 'function') d.close(); else d.removeAttribute('open');
      if (openDlg === d) openDlg = null; if (!$('dialog[open]')) root.classList.remove('dlg-open'); if (d.__src) d.__src.classList.remove('dlg-src'); d.__src = null; }
    var inner = $('.dlg-in', d);
    if (instant || reduce || !inner || !inner.animate){ done(); return; }
    d.__closing = true;
    var src = d.__src, to = null;
    if (d.id === 'letter') to = rectOf($('.env'));
    else { if (src && !src.closest('dialog')) to = rectOf(src); if (!to){ var row = $('#cases a[data-open="' + d.id + '"]'); to = rectOf(row); if (to && src !== row){ if (src) src.classList.remove('dlg-src'); row.classList.add('dlg-src'); d.__src = row; } } }
    d.classList.remove('dlg-on');
    foldClose(d, to, d.id === 'letter' ? 'letter' : 'map', done);
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
      e.preventDefault(); var src = srcOf(a); openDialog(d, rectOf(src), src);
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
    document.addEventListener('env:greet', function(){ loadHand(); hovering = false; spin(); });
    function at(ms, fn){ timers.push(setTimeout(fn, ms)); }
    env.addEventListener('click', function(){
      if (busy) return; loadHand(); track('letter_open');
      if (reduce){ openDialog(dlg); return; }
      busy = true; env.classList.remove('spin'); env.classList.add('turn');
      at(300, function(){ env.classList.add('crack'); emit('env:crack'); });
      at(400, function(){ env.classList.add('lift'); });
      at(560, function(){ env.classList.add('rise'); });
      at(800, function(){ var sh = $('.env-sheet', env); openDialog(dlg, sh ? sh.getBoundingClientRect() : env.getBoundingClientRect(), env); });
      at(1400, function(){ ['turn', 'crack', 'lift', 'rise'].forEach(function(c){ env.classList.remove(c); }); busy = false; });
    });
  });

  /* ---------- experience: each chapter clears with its own world (mist, frost or sand) in reveal.js (Wave 4) ---------- */

  /* ---------- moments, growth paths, rhythm stack, chips ---------- */
  safe(function(){
    if (reduce) return;
    $$('.rh-card').forEach(function(c, i){ c.style.setProperty('--i', i); c.classList.add('rh-ready'); reveal(c, 'rh-in', 0.35); });
    $$('.chips').forEach(function(b){ $$('.chip', b).forEach(function(c, i){ c.style.setProperty('--i', i); }); b.classList.add('ch-ready'); reveal(b, 'ch-in', 0.3); });
  });

  /* built: the devices float, land, orbit and lean toward the cursor in sections.js */

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

  /* ---------- the journey: footprints now live in steps.js (Wave 4) ---------- */

  /* ---------- painted fallback moves gently when there's no 3D ---------- */
  safe(function(){
    var paint = $('.env-paint'); if (!paint) return;
    onScroll.push(function(){ if (!root.classList.contains('no-3d')) return; var max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight); paint.style.setProperty('--sp', Math.min(1, window.pageYOffset / max).toFixed(4)); });
  });
})();
