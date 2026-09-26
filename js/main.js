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

  /* ---------- experience: four cuts, each one starting where the last one left off ----------
     1: right to left, going down   2: left to right, going down
     3: a steep cut from the top right to the bottom   4: near vertical, from the top down
     The blade, the glowing streak and the split all follow the same line. */
  var CUTS = [[1, 0.3, 0, 0.66], [0, 0.3, 1, 0.7], [1, 0.04, 0.2, 1], [0.32, 0, 0.54, 1]], CORN = [[0, 0], [1, 0], [1, 1], [0, 1]];
  function perim(x, y){ if (y <= 0.0001) return x; if (x >= 0.9999) return 1 + y; if (y >= 0.9999) return 3 - x; return 4 - y; }
  function arcBetween(sa, sb){ var span = ((sb - sa) % 4 + 4) % 4, out = []; for (var c = 0; c < 4; c++){ var d = ((c - sa) % 4 + 4) % 4; if (d > 0.0001 && d < span - 0.0001) out.push([d, c]); } out.sort(function(a, b){ return a[0] - b[0]; }); return out.map(function(o){ return CORN[o[1]]; }); }
  function polyStr(pts){ return 'polygon(' + pts.map(function(p){ return (p[0] * 100).toFixed(2) + '% ' + (p[1] * 100).toFixed(2) + '%'; }).join(', ') + ')'; }
  function cutGeom(cv, k){
    var c = CUTS[k % CUTS.length], A = [c[0], c[1]], B = [c[2], c[3]], sa = perim(A[0], A[1]), sb = perim(B[0], B[1]);
    var p1 = [A].concat(arcBetween(sa, sb), [B]), p2 = [B].concat(arcBetween(sb, sa), [A]);
    var top = p1.some(function(q){ return q[0] === 0 && q[1] === 0; }) ? p1 : p2, bot = top === p1 ? p2 : p1;
    var W = cv.clientWidth || 1000, H = cv.clientHeight || 600, dx = (B[0] - A[0]) * W, dy = (B[1] - A[1]) * H, len = Math.sqrt(dx * dx + dy * dy) || 1, ux = dx / len, uy = dy / len, nx = -uy, ny = ux;
    function side(p){ var x = 0, y = 0; p.forEach(function(q){ x += q[0] * W; y += q[1] * H; }); x /= p.length; y /= p.length; return (x - A[0] * W) * nx + (y - A[1] * H) * ny >= 0 ? 1 : -1; }
    var sT = side(top), dist = 0.8 * (Math.abs(nx) * W + Math.abs(ny) * H);
    function tf(sg, slide){ var tx = (nx * sg * dist + ux * slide * W * 0.05) / W * 100, ty = (ny * sg * dist + uy * slide * H * 0.05) / H * 100; return 'translate(' + tx.toFixed(2) + '%,' + ty.toFixed(2) + '%) rotate(' + (sg * slide * 3).toFixed(1) + 'deg)'; }
    cv.style.setProperty('--pa', polyStr(top)); cv.style.setProperty('--pb', polyStr(bot));
    cv.style.setProperty('--ta', tf(sT, -1)); cv.style.setProperty('--tb', tf(-sT, 1));
    return { A: [A[0] * W, A[1] * H], B: [B[0] * W, B[1] * H], W: W, H: H, len: len, ux: ux, uy: uy, nx: nx, ny: ny, ang: Math.atan2(dy, dx) * 180 / Math.PI };
  }
  function debris(cv, g, DUR, tA, tB, SPLIT){
    var frag = document.createDocumentFragment(), jobs = [], i;
    for (i = 0; i < 24; i++){ var s = Math.random(), x = g.A[0] + (g.B[0] - g.A[0]) * s, y = g.A[1] + (g.B[1] - g.A[1]) * s, sd = Math.random() < 0.5 ? -1 : 1, sp = 70 + Math.random() * 170, fw = 50 + Math.random() * 150;
      var vx = g.nx * sd * sp + g.ux * fw, vy = g.ny * sd * sp + g.uy * fw, el = document.createElement('i'); el.className = 'xc-spark'; el.style.left = x.toFixed(1) + 'px'; el.style.top = y.toFixed(1) + 'px'; frag.appendChild(el);
      var an = Math.atan2(vy, vx) * 180 / Math.PI, fall = 120 + Math.random() * 160;
      jobs.push([el, [{ transform: 'rotate(' + an.toFixed(0) + 'deg) scaleX(.2)', opacity: 0 }, { transform: 'rotate(' + an.toFixed(0) + 'deg) scaleX(1.6)', opacity: 1, offset: 0.06 }, { transform: 'translate(' + vx.toFixed(0) + 'px,' + (vy + fall).toFixed(0) + 'px) rotate(' + (an + sd * 50).toFixed(0) + 'deg) scaleX(.2)', opacity: 0 }],
        { duration: 420 + Math.random() * 420, delay: DUR * (tA + s * (tB - tA)) * 0.85, easing: 'cubic-bezier(.2,.7,.4,1)', fill: 'both' }]); }
    for (i = 0; i < 8; i++){ var s2 = 0.08 + Math.random() * 0.84, x2 = g.A[0] + (g.B[0] - g.A[0]) * s2, y2 = g.A[1] + (g.B[1] - g.A[1]) * s2, sz = 9 + Math.random() * 16, sh = document.createElement('i'); sh.className = 'xc-shard' + (Math.random() < 0.5 ? ' alt' : '');
      sh.style.width = sz.toFixed(0) + 'px'; sh.style.height = (sz * (0.55 + Math.random() * 0.6)).toFixed(0) + 'px'; sh.style.left = x2.toFixed(0) + 'px'; sh.style.top = y2.toFixed(0) + 'px';
      sh.style.clipPath = 'polygon(' + (Math.random() * 40).toFixed(0) + '% 0, 100% ' + (Math.random() * 60).toFixed(0) + '%, ' + (30 + Math.random() * 50).toFixed(0) + '% 100%, 0 ' + (50 + Math.random() * 50).toFixed(0) + '%)'; frag.appendChild(sh);
      var floor = g.H - 8 - Math.random() * 16 - y2, dr = (Math.random() - 0.5) * 180, rot = (Math.random() - 0.5) * 760;
      jobs.push([sh, [{ transform: 'translate(0,0) rotate(0deg)', opacity: 0, easing: 'cubic-bezier(.2,.8,.4,1)' },
        { transform: 'translate(' + (dr * 0.15).toFixed(0) + 'px,' + (-18 - Math.random() * 40).toFixed(0) + 'px) rotate(' + (rot * 0.15).toFixed(0) + 'deg)', opacity: 1, offset: 0.16, easing: 'cubic-bezier(.55,0,1,.55)' },
        { transform: 'translate(' + dr.toFixed(0) + 'px,' + floor.toFixed(0) + 'px) rotate(' + rot.toFixed(0) + 'deg)', opacity: 1, offset: 0.76, easing: 'cubic-bezier(.2,.8,.4,1)' },
        { transform: 'translate(' + (dr * 1.07).toFixed(0) + 'px,' + (floor - 12).toFixed(0) + 'px) rotate(' + (rot * 1.03).toFixed(0) + 'deg)', opacity: 1, offset: 0.87, easing: 'cubic-bezier(.55,0,1,.55)' },
        { transform: 'translate(' + (dr * 1.12).toFixed(0) + 'px,' + floor.toFixed(0) + 'px) rotate(' + (rot * 1.05).toFixed(0) + 'deg)', opacity: 0.92 }],
        { duration: 1000 + Math.random() * 500, delay: SPLIT + Math.random() * 140, fill: 'both' }]); }
    cv.appendChild(frag); jobs.forEach(function(j){ j[0].animate(j[1], j[2]); });
    setTimeout(function(){ $$('.xc-spark', cv).forEach(function(e){ e.parentNode.removeChild(e); }); }, 2600);
  }
  function cut(cv, k){
    var g = cutGeom(cv, k), top = $('.xc-top', cv), bot = $('.xc-bot', cv), under = $('.xc-under', cv), kat = $('.xc-katana', cv), line = $('.xc-slash', cv);
    if (reduce || !cv.animate || !kat){ cv.classList.add('cut'); return; }
    var diag = Math.sqrt(g.W * g.W + g.H * g.H), ext = diag * 0.24, cx = g.W / 2, cy = g.H / 2, a = g.ang, DUR = 440, EZ = 'cubic-bezier(.5,.02,.24,1)';
    window.__site.sfx('cut', { dur: DUR, k: k });
    var S = [g.A[0] - g.ux * ext - cx, g.A[1] - g.uy * ext - cy], E = [g.B[0] + g.ux * ext - cx, g.B[1] + g.uy * ext - cy], travel = g.len + ext * 2, tA = ext / travel, tB = (ext + g.len) / travel;
    function kf(t, rot, sc, o){ var x = S[0] + (E[0] - S[0]) * t, y = S[1] + (E[1] - S[1]) * t; return { offset: t, transform: 'translate(-50%,-50%) translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) rotate(' + rot.toFixed(1) + 'deg) scale(' + sc + ')', opacity: o }; }
    /* the blade leads with its tip, swinging a little through the cut */
    kat.animate([kf(0, a - 24, 0.92, 0), kf(tA * 0.6, a - 17, 1, 1), kf(0.5, a - 3, 1.05, 1), kf(tB + (1 - tB) * 0.4, a + 11, 1.1, 1), kf(1, a + 17, 1.12, 0)], { duration: DUR, easing: EZ, fill: 'forwards' });
    /* the streak grows from the start of the cut to its end, right behind the blade */
    line.style.width = g.len.toFixed(1) + 'px'; line.style.left = g.A[0].toFixed(1) + 'px'; line.style.top = (g.A[1] - 1.5).toFixed(1) + 'px';
    var R0 = 'rotate(' + a.toFixed(2) + 'deg) scaleX(';
    line.animate([{ offset: 0, transform: R0 + '0)', opacity: 1 }, { offset: tA, transform: R0 + '0)', opacity: 1 }, { offset: tB, transform: R0 + '1)', opacity: 1 }, { offset: 1, transform: R0 + '1)', opacity: 1 }], { duration: DUR, easing: EZ, fill: 'forwards' });
    line.animate([{ opacity: 1, filter: 'brightness(1)' }, { opacity: 1, filter: 'brightness(2)', offset: 0.25 }, { opacity: 0, filter: 'brightness(1)' }], { duration: 560, delay: DUR, easing: 'ease-out', fill: 'forwards' });
    var SPLIT = DUR * 0.92;
    cv.animate([{ transform: 'none' }, { transform: 'translate(' + (g.nx * 4).toFixed(1) + 'px,' + (g.ny * 4).toFixed(1) + 'px)' }, { transform: 'translate(' + (-g.nx * 2.5).toFixed(1) + 'px,' + (-g.ny * 2.5).toFixed(1) + 'px)' }, { transform: 'none' }], { duration: 240, delay: DUR * tB * 0.85, easing: 'ease-out' });
    var opening = top.animate([{ transform: 'none' }, { transform: cv.style.getPropertyValue('--ta') }], { duration: 640, delay: SPLIT, easing: 'cubic-bezier(.7,0,.25,1)', fill: 'forwards' });
    bot.animate([{ transform: 'none' }, { transform: cv.style.getPropertyValue('--tb') }], { duration: 640, delay: SPLIT, easing: 'cubic-bezier(.7,0,.25,1)', fill: 'forwards' });
    under.animate([{ opacity: 0, transform: 'scale(.96)' }, { opacity: 1, transform: 'none' }], { duration: 480, delay: SPLIT + 130, easing: 'cubic-bezier(.23,1,.32,1)', fill: 'forwards' });
    debris(cv, g, DUR, tA, tB, SPLIT);
    var finish = function(){ cv.classList.add('cut'); }; if (opening.finished) opening.finished.then(finish, finish); else setTimeout(finish, SPLIT + 760);
  }
  safe(function(){
    var covers = $$('.xc');
    covers.forEach(function(cv, k){ cutGeom(cv, k); if (!reduce) cv.classList.add('cut-ready'); onView(cv, function(){ cut(cv, k); track('chapter_open', { id: cv.id }); }, 0.5); });
    var rz = 0; window.addEventListener('resize', function(){ clearTimeout(rz); rz = setTimeout(function(){ covers.forEach(function(cv, k){ cutGeom(cv, k); }); }, 200); });
  });

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

  /* ---------- the trail: one line from my name to my LinkedIn, drawn as you climb ----------
     It swoops across the gaps between sections, ties a knot beside each heading, bends away
     from the cursor like a plucked string, leaves footprints behind its tip, and ends by
     buzzing at my LinkedIn. It runs behind the content, so text always stays on top. */
  safe(function(){
    var svg = document.createElementNS(NS, 'svg'); svg.setAttribute('class', 'trail'); svg.setAttribute('aria-hidden', 'true');
    /* W3-11: never letterbox. If the page width changes after the trail is built (a scrollbar gutter settling, say), the base
       svg{max-width:100%} rule shrinks this page-sized SVG, and the default aspect ratio then drew the whole trail smaller and up to
       ~110px off the content. Now it only stretches sideways for a moment, and rebuilds at the new width. */
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.innerHTML = '<defs><linearGradient id="trG" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="1000"><stop offset="0" class="tg1"/><stop offset=".5" class="tg2"/><stop offset="1" class="tg1"/></linearGradient>' +
      '<symbol id="trBoot" overflow="visible"><path d="M-3.2 -7.4 C-3.7 -3 -3 .8 -2.1 2.4 L2.3 2.4 C3.1 0 3.5 -4 2.9 -7.4 C1.9 -9.3 -2.3 -9.3 -3.2 -7.4Z M-2.2 4.2 L2.1 4.2 L1.9 7.3 C.9 8.3 -.9 8.3 -1.9 7.3Z"/></symbol>' +
      '<symbol id="trCamel" overflow="visible"><path d="M-.5 -6.8 C-3.8 -6.4 -4.3 -1.8 -3.4 1.7 C-2.8 4.6 -.7 4.9 -.5 3Z M.5 -6.8 C3.8 -6.4 4.3 -1.8 3.4 1.7 C2.8 4.6 .7 4.9 .5 3Z"/></symbol></defs>' +
      '<path class="trail-ghost"/><path class="trail-glow"/><path class="trail-done"/><path class="trail-live"/><g class="trail-knots"></g><g class="trail-prints"></g>';
    document.body.insertBefore(svg, $('main') || document.body.firstChild);
    /* W3-11: the tip and its pulsing halo live in a small layer of their own, so pulsing and buzzing never repaint the page-sized SVG */
    var tipEl = document.createElement('div'); tipEl.className = 'trail-tip'; tipEl.setAttribute('aria-hidden', 'true'); tipEl.innerHTML = '<i class="tt-halo"></i><i class="tt-dot"></i>'; tipEl.style.opacity = '0';
    /* the tip sits in a full-width box that clips sideways, so a halo near the edge never widens the page on phones */
    var tipBox = document.createElement('div'); tipBox.className = 'trail-tips'; tipBox.setAttribute('aria-hidden', 'true'); tipBox.appendChild(tipEl); svg.parentNode.insertBefore(tipBox, svg.nextSibling);
    var ghost = $('.trail-ghost', svg), glowP = $('.trail-glow', svg), doneP = $('.trail-done', svg), liveP = $('.trail-live', svg), knotsG = $('.trail-knots', svg), printsG = $('.trail-prints', svg), dot = $('.tt-dot', tipEl), grad = svg.querySelector('#trG'), wLd = null, wDone = null, wTip = '', wR = '', wVis = null, tipNow = { x: 0, y: 0, vis: false, i: 0, done: false }, perch = null, pAct = 0;
    var SX, SY, NXs, NYs, CM, OFF, VEL, N = 0, KN = [], endEl = null, built = false, tipF = 0, introOK = reduce, introCap = reduce ? 1e9 : 0, introAt = 0, staticEnd = -1, PR = 14, prints = [], printId = '#trBoot', mob = false;
    var cur = { x: -9999, y: -9999, on: false, speed: 0, lx: 0, ly: 0, lt: 0 }, raf = 0, lastT = 0, tipPrev = 0;
    for (var p0 = 0; p0 < PR; p0++){ var us = document.createElementNS(NS, 'use'); us.setAttribute('href', printId); printsG.appendChild(us); prints.push(us); }
    function f1(v){ return v.toFixed(1); }

    /* catmull-rom through the waypoints, sampled every ~5px by arc length */
    function sampleSpline(pts){
      var xs = [], ys = [], d = 'M' + f1(pts[0][0]) + ' ' + f1(pts[0][1]), ptIdx = [0];
      xs.push(pts[0][0]); ys.push(pts[0][1]);
      for (var i = 0; i < pts.length - 1; i++){
        var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
        var c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6, c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
        d += ' C' + f1(c1x) + ' ' + f1(c1y) + ' ' + f1(c2x) + ' ' + f1(c2y) + ' ' + f1(p2[0]) + ' ' + f1(p2[1]);
        var est = 0, px = p1[0], py = p1[1];
        for (var e = 1; e <= 10; e++){ var t = e / 10, mt = 1 - t, x = mt * mt * mt * p1[0] + 3 * mt * mt * t * c1x + 3 * mt * t * t * c2x + t * t * t * p2[0], y = mt * mt * mt * p1[1] + 3 * mt * mt * t * c1y + 3 * mt * t * t * c2y + t * t * t * p2[1]; est += Math.sqrt((x - px) * (x - px) + (y - py) * (y - py)); px = x; py = y; }
        var n = Math.max(1, Math.round(est / 5));
        for (var k = 1; k <= n; k++){ var t2 = k / n, m2 = 1 - t2; xs.push(m2 * m2 * m2 * p1[0] + 3 * m2 * m2 * t2 * c1x + 3 * m2 * t2 * t2 * c2x + t2 * t2 * t2 * p2[0]); ys.push(m2 * m2 * m2 * p1[1] + 3 * m2 * m2 * t2 * c1y + 3 * m2 * t2 * t2 * c2y + t2 * t2 * t2 * p2[1]); }
        ptIdx.push(xs.length - 1);
      }
      return { d: d, xs: xs, ys: ys, ptIdx: ptIdx };
    }
    function loop(pts, r, dir){ var p = pts[pts.length - 1], cx = p[0] + r * dir, cy = p[1], a0 = Math.atan2(p[1] - cy, p[0] - cx), at = pts.length - 1;
      for (var k = 1; k <= 8; k++){ var a = a0 - dir * k * Math.PI / 4; pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } return { cx: cx, cy: cy, r: r, at: at }; }

    function build(){
      var W = Math.min(document.documentElement.clientWidth, document.body.clientWidth || 1e9), H = document.documentElement.scrollHeight, vh = window.innerHeight, y0 = window.pageYOffset;
      mob = W < 900 || !fine;
      svg.setAttribute('width', W); svg.setAttribute('height', H); svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H); grad.setAttribute('y2', H);
      var wrapW = Math.min(1160, W - 48), gut = (W - wrapW) / 2, gl = mob ? 10 : Math.max(20, gut * 0.46), gr = mob ? W - 10 : W - Math.max(20, gut * 0.46), kr = mob ? 6 : Math.max(12, Math.min(26, gut * 0.2));
      /* resting positions, ignoring any animation that is moving an element right now */
      function R(el){ var t = 0, l = 0, e = el; while (e){ t += e.offsetTop || 0; l += e.offsetLeft || 0; e = e.offsetParent; }
        var w = el.offsetWidth, h = el.offsetHeight, px = parseFloat(getComputedStyle(el).getPropertyValue('--px')) || 0;
        if (!w && !h){ var b = el.getBoundingClientRect(); t = b.top + y0; l = b.left; w = b.width; h = b.height; }
        l += w * px / 100; return { t: t, b: t + h, l: l, r: l + w, w: w, h: h, cx: l + w / 2, cy: t + h / 2 }; }
      var pts = [], kn = [], side = 1, letters = $$('.h-name .nl'), lastL = letters[letters.length - 1];
      var nr = lastL ? R(lastL) : { r: W * 0.4, t: vh * 0.45, h: 90 };
      /* 1. it starts at the end of my name, and swirls up around the letter peeking in */
      pts.push([nr.r + 4, nr.t + nr.h * 0.7]);
      var hero = R($('.hero')), peek = $('.h-peek');
      if (!mob){
        pts.push([nr.r + 54, nr.t + nr.h * 0.38]);
        /* the envelope sits on the line, as if it were tied to it */
        if (peek && peek.offsetWidth){ var pr = R(peek); pts.push([pr.l - 40, pr.cy + pr.h * 0.35]); pts.push([pr.cx, pr.cy + pr.h * 0.1]); pts.push([pr.r - 10, pr.b + 30]); kn.push(loop(pts, 22, -1)); }
        pts.push([gr, hero.b - vh * 0.12]);
      } else { pts.push([Math.min(W - 14, nr.r + 20), nr.t + nr.h * 0.3]); pts.push([gr, nr.b + 30]); pts.push([gr, hero.b - 20]); }
      side = 1;
      /* 2. down through every section: across the gap, a knot by the heading, a gentle wave */
      $$('main > section').slice(1).forEach(function(sec){
        var r = R(sec); if (r.h < 40) return;
        var last = sec.id === 'contact';
        side = mob ? 1 : (last ? 1 : -side);
        var X = side > 0 ? gr : gl, pad = parseFloat(getComputedStyle(sec).paddingTop) || 90;
        pts.push([X, r.t + pad * 0.5]);
        var head = $('.s-h', sec) || $('h2', sec) || $('.story .lead', sec) || $('.s-k', sec);
        if (head){ var hr = R(head), ky = hr.t + Math.min(hr.h, 90) * 0.5; pts.push([X, ky - kr]); kn.push(loop(pts, kr, side > 0 ? -1 : 1)); }
        if (last) return;
        var inner = r.h - pad * 1.3, steps = Math.floor(inner / 540), amp = mob ? 3 : Math.min(16, gut * 0.16);
        for (var k = 1; k <= steps; k++) pts.push([X + (k % 2 ? 1 : -1) * amp * -side, r.t + pad * 0.7 + inner * k / (steps + 1)]);
        pts.push([X, r.b - pad * 0.42]);
      });
      /* 3. it ends at basecamp: tied to the lantern's handle beside my LinkedIn */
      endEl = $('#contact a[href*="linkedin.com"]'); var lan = $('#contact .lantern');
      if (endEl){ var er = R(endEl), lr = lan && lan.offsetWidth ? R(lan) : null;
        if (lr){ var hx = lr.cx, hy = lr.t + 2;
          if (!mob){ pts.push([gr, hy - 120]); pts.push([Math.min(gr - 20, hx + 96), hy - 58]); pts.push([hx + 20, hy - 20]); pts.push([hx, hy]); }
          else { pts.push([gr, hy - 52]); pts.push([Math.min(gr - 6, hx + 16), hy - 14]); pts.push([hx, hy]); } }
        else if (!mob){ pts.push([gr, er.cy - 90]); pts.push([Math.min(gr - 20, er.r + 120), er.cy - 22]); pts.push([er.r + 42, er.cy - 3]); pts.push([er.r + 14, er.cy]); }
        else { pts.push([gr, er.cy - 46]); pts.push([Math.min(gr - 6, er.r + 26), er.cy - 6]); pts.push([er.r + 9, er.cy]); } }
      var S = sampleSpline(pts); N = S.xs.length;
      SX = new Float32Array(S.xs); SY = new Float32Array(S.ys); NXs = new Float32Array(N); NYs = new Float32Array(N); CM = new Float32Array(N); OFF = new Float32Array(N); VEL = new Float32Array(N);
      for (var i = 0; i < N; i++){ var a = Math.max(0, i - 1), b = Math.min(N - 1, i + 1), tx = SX[b] - SX[a], ty = SY[b] - SY[a], l = Math.sqrt(tx * tx + ty * ty) || 1; NXs[i] = -ty / l; NYs[i] = tx / l; CM[i] = i ? Math.max(CM[i - 1], SY[i]) : SY[i]; }
      ghost.setAttribute('d', S.d);
      knotsG.innerHTML = ''; KN = kn.map(function(k){ var at = S.ptIdx[Math.min(S.ptIdx.length - 1, k.at + 8)] || 0, ring = document.createElementNS(NS, 'circle'), pin = document.createElementNS(NS, 'circle');
        ring.setAttribute('class', 'trail-knot'); ring.setAttribute('cx', f1(k.cx)); ring.setAttribute('cy', f1(k.cy)); ring.setAttribute('r', f1(k.r));
        pin.setAttribute('class', 'trail-pin'); pin.setAttribute('cx', f1(k.cx)); pin.setAttribute('cy', f1(k.cy)); pin.setAttribute('r', '2.4');
        knotsG.appendChild(ring); knotsG.appendChild(pin); return { at: at, ring: ring, pin: pin, hit: false }; });
      built = true; staticEnd = -1; tipF = Math.min(tipF, N - 1);
      kick();
    }

    function targetIdx(){ var y = window.pageYOffset, max = document.documentElement.scrollHeight - window.innerHeight; if (y >= max - 4) return N - 1;
      var vh = window.innerHeight, rest = max - y, nearEnd = rest < vh * 0.6 ? 1 - rest / (vh * 0.6) : 0, ty = y + vh * (0.62 + 0.38 * nearEnd), lo = 0, hi = N - 1; if (CM[hi] <= ty) return hi; if (CM[0] > ty) return 0; while (hi - lo > 1){ var m = (lo + hi) >> 1; if (CM[m] <= ty) lo = m; else hi = m; } return lo; }
    function firstAbove(y){ var lo = 0, hi = N - 1; if (CM[0] > y) return 0; while (hi - lo > 1){ var m = (lo + hi) >> 1; if (CM[m] <= y) lo = m; else hi = m; } return lo; }
    function P(i){ return f1(SX[i] + NXs[i] * OFF[i]) + ' ' + f1(SY[i] + NYs[i] * OFF[i]); }
    function seg(a, b){ if (b <= a) return ''; var s = 'M' + P(a); for (var i = a + 1; i <= b; i++) s += 'L' + P(i); return s; }

    /* a string that springs back: the cursor pushes it, the neighbours pull it straight */
    function physics(a, b, tipI, dt){
      var act = false, i, RC = 96, sy = window.pageYOffset, pushing = false;
      if (cur.on && !mob){ var cx = cur.x, cy = cur.y + sy, RC2 = RC * RC, push = 1700 + Math.min(4000, cur.speed * 3);
        for (i = a; i <= b && i <= tipI; i++){ var dx = SX[i] + NXs[i] * OFF[i] - cx, dy = SY[i] + NYs[i] * OFF[i] - cy, d2 = dx * dx + dy * dy;
          if (d2 < RC2){ pushing = true; var d = Math.sqrt(d2) || 1, fo = 1 - d / RC; VEL[i] += ((dx * NXs[i] + dy * NYs[i]) >= 0 ? 1 : -1) * fo * fo * push * dt; } } }
      for (var s = 0; s < 2; s++){
        for (i = Math.max(1, a); i <= Math.min(N - 2, b); i++){ VEL[i] = (VEL[i] + (-70 * OFF[i] + 820 * (OFF[i - 1] + OFF[i + 1] - 2 * OFF[i])) * dt * 0.5) * 0.955; }
        for (i = Math.max(1, a); i <= Math.min(N - 2, b); i++){ OFF[i] += VEL[i] * dt * 0.5; if (OFF[i] > 46) OFF[i] = 46; else if (OFF[i] < -46) OFF[i] = -46; }
      }
      if (perch && perch.i >= a && perch.i <= b){ for (i = Math.max(1, perch.i - 7); i <= Math.min(N - 2, perch.i + 7); i++){ var wv = 1 - Math.abs(i - perch.i) / 8; VEL[i] += NYs[i] * perch.f * wv * wv * dt; } act = true; }
      var vMax = 0; for (i = a; i <= b; i++){ var av = Math.abs(VEL[i]); if (av > vMax) vMax = av; if (!act && Math.abs(OFF[i]) > 0.06 && !(pushing && performance.now() - cur.lt > 250)) act = true; }
      return act || vMax > 0.6;
    }

    function frame(now){
      raf = 0; if (!built || !N) return;
      var dt = Math.min(0.034, Math.max(0.008, (now - (lastT || now)) / 1000)); lastT = now;
      var tgt = targetIdx(), goal = introOK ? Math.min(tgt, introCap) : 0, moving = false;
      if (introOK && introCap < N){ introCap = (now - introAt) * 0.26; if (introCap >= tgt) introCap = 1e9; else moving = true; }
      var diff = goal - tipF; if (Math.abs(diff) > 0.4){ tipF += diff * (reduce ? 1 : Math.min(1, dt * 9)); moving = true; } else tipF = goal;
      var tipI = Math.max(0, Math.min(N - 1, Math.floor(tipF))), sy = window.pageYOffset, vh = window.innerHeight;
      var a = firstAbove(sy - 320), b = Math.min(N - 1, firstAbove(sy + vh + 320) + 1);
      if (!mob){ var tipMove = Math.abs(tipF - tipPrev) / dt; if (tipMove > 60 && tipI > 4){ for (var j = 1; j < 9; j++) VEL[Math.max(1, tipI - j)] += Math.sin(now / 90) * Math.min(tipMove, 700) * 0.015 * (1 - j / 9); } }
      tipPrev = tipF;
      var act = physics(a, Math.min(b, tipI + 2), tipI, dt);
      /* the drawn line: a static part far above, a live part near the screen */
      var se = Math.max(0, Math.min(tipI, Math.floor(a / 200) * 200));
      if (se !== staticEnd){ staticEnd = se; doneP.setAttribute('d', se > 0 ? seg(0, se) : ''); }
      var ld = seg(se, tipI); if (ld !== wLd){ wLd = ld; liveP.setAttribute('d', ld); glowP.setAttribute('d', ld); }
      /* the tip, curious about the cursor */
      var fr = tipF - tipI, i2 = Math.min(N - 1, tipI + 1), tx = lerp2(SX[tipI] + NXs[tipI] * OFF[tipI], SX[i2] + NXs[i2] * OFF[i2], fr), ty = lerp2(SY[tipI] + NYs[tipI] * OFF[tipI], SY[i2] + NYs[i2] * OFF[i2], fr), rr = 5;
      if (cur.on && !mob){ var ddx = cur.x - tx, ddy = cur.y + sy - ty, dd = Math.sqrt(ddx * ddx + ddy * ddy); if (dd < 150){ var pull = (1 - dd / 150) * 0.14; tx += ddx * pull; ty += ddy * pull; rr = 5 + (1 - dd / 150) * 3; } }
      var tt = 'translate(' + f1(tx) + 'px,' + f1(ty) + 'px)', rs = (rr / 5).toFixed(2); if (tt !== wTip){ wTip = tt; tipEl.style.transform = tt; } if (rs !== wR){ wR = rs; dot.style.scale = rs === '1.00' ? '' : rs; }
      var vis = introOK && tipF > 1; if (vis !== wVis){ wVis = vis; tipEl.style.opacity = vis ? '' : '0'; }
      tipNow.x = tx; tipNow.y = ty; tipNow.vis = vis; tipNow.i = tipI;
      /* footprints walking behind the tip */
      for (var k = 0; k < PR; k++){ var pi = tipI - 4 - k * 5, us = prints[k]; if (pi < 2 || !vis){ us.style.opacity = '0'; continue; }
        var ax = SX[pi + 1] - SX[pi - 1], ay = SY[pi + 1] - SY[pi - 1], an = Math.atan2(ay, ax) * 180 / Math.PI + 90, sd = (k % 2 ? 1 : -1) * 4.6;
        var px = SX[pi] + NXs[pi] * (OFF[pi] + sd), py = SY[pi] + NYs[pi] * (OFF[pi] + sd);
        us.setAttribute('transform', 'translate(' + f1(px) + ' ' + f1(py) + ') rotate(' + an.toFixed(0) + ') scale(' + (mob ? 0.62 : 0.78) + ')'); us.style.opacity = ((1 - k / PR) * 0.62).toFixed(2); }
      /* knots pulse once as the line reaches them, and again if you come back */
      KN.forEach(function(kk){ var hit = tipI >= kk.at; if (hit !== kk.hit){ kk.hit = hit; kk.ring.classList.toggle('hit', hit); kk.pin.classList.toggle('hit', hit); } });
      var done = tipI >= N - 2 && introOK; tipNow.done = done; if (done !== wDone){ wDone = done; svg.classList.toggle('done', done); tipEl.classList.toggle('done', done); root.classList.toggle('trail-done', done); if (endEl) endEl.classList.toggle('is-called', done); }
      if (moving || act || (cur.on && now - cur.lt < 250)) kick();
    }
    function lerp2(a, b, t){ return a + (b - a) * t; }
    function kick(){ if (!raf) raf = requestAnimationFrame(frame); }
    onScroll.push(kick);
    /* for the idle moments in sparkle.js: where the tip is, where any drawn point of the rope is right now, a weight to hang on it, a tap */
    window.__trail = {
      tip: function(){ return tipNow; }, mobile: function(){ return mob; }, size: function(){ return N; },
      at: function(i){ if (!N) return null; i = Math.max(1, Math.min(N - 2, i | 0)); var x = SX[i] + NXs[i] * OFF[i], y = SY[i] + NYs[i] * OFF[i], xa = SX[i + 1] + NXs[i + 1] * OFF[i + 1] - (SX[i - 1] + NXs[i - 1] * OFF[i - 1]), ya = SY[i + 1] + NYs[i + 1] * OFF[i + 1] - (SY[i - 1] + NYs[i - 1] * OFF[i - 1]); return { x: x, y: y, ang: Math.atan2(ya, xa), rest: { x: SX[i], y: SY[i] } }; },
      drawn: function(){ return Math.floor(tipF); },
      perch: function(i, f){ perch = i == null ? null : { i: i | 0, f: f || 900 }; kick(); },
      pluck: function(i, v){ if (!N) return; for (var j = Math.max(1, i - 6); j <= Math.min(N - 2, i + 6); j++) VEL[j] += v * (1 - Math.abs(j - i) / 7); kick(); },
      tap: function(){ if (!tipNow.vis) return false; tipEl.classList.remove('tap'); void tipEl.offsetWidth; tipEl.classList.add('tap'); return true; },
      kick: kick
    };
    tipEl.addEventListener('animationend', function(e){ if (e.animationName === 'ttTap') tipEl.classList.remove('tap'); });
    window.addEventListener('pointermove', function(e){ if (e.pointerType && e.pointerType !== 'mouse') return; var t = performance.now(), dtm = Math.max(1, t - cur.lt); cur.speed = cur.speed * 0.7 + Math.sqrt((e.clientX - cur.lx) * (e.clientX - cur.lx) + (e.clientY - cur.ly) * (e.clientY - cur.ly)) / dtm * 1000 * 0.3;
      cur.x = e.clientX; cur.y = e.clientY; cur.lx = e.clientX; cur.ly = e.clientY; cur.lt = t; cur.on = true; kick(); }, { passive: true });
    document.addEventListener('pointerleave', function(){ cur.on = false; kick(); });
    document.documentElement.addEventListener('mouseleave', function(){ cur.on = false; kick(); });
    function land(){ if (introOK) return; introOK = true; introCap = 0; introAt = performance.now(); kick(); }
    document.addEventListener('intro:landed', land); setTimeout(land, 3400);
    function setPrints(){ printId = root.getAttribute('data-time') === 'dusk' ? '#trCamel' : '#trBoot'; prints.forEach(function(us){ us.setAttribute('href', printId); }); }
    setPrints(); document.addEventListener('timechange', setPrints);
    var rt = 0; function later(){ clearTimeout(rt); rt = setTimeout(build, 180); }
    window.addEventListener('resize', later); window.addEventListener('load', later);
    if (window.ResizeObserver) new ResizeObserver(function(){ var a = +svg.getAttribute('width') || 0; if (a && Math.abs(svg.getBoundingClientRect().width - a) > 1) later(); }).observe(svg);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(later);
    if ('ResizeObserver' in window) new ResizeObserver(later).observe(document.body);
    if (document.fonts && document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', later);
    var sig = ''; function signature(){ var n = $$('.h-name .nl'), x = n.length ? n[n.length - 1] : null, t = x ? x.offsetLeft + ',' + x.offsetTop + ',' + x.offsetParent.offsetHeight : ''; $$('main > section').forEach(function(sec){ t += '|' + sec.offsetTop; }); return t + '|' + document.documentElement.clientWidth; }
    setInterval(function(){ var s2 = signature(); if (s2 !== sig){ sig = s2; later(); } }, 1200);
    later();
  });

  /* ---------- painted fallback moves gently when there's no 3D ---------- */
  safe(function(){
    var paint = $('.env-paint'); if (!paint) return;
    onScroll.push(function(){ if (!root.classList.contains('no-3d')) return; var max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight); paint.style.setProperty('--sp', Math.min(1, window.pageYOffset / max).toFixed(4)); });
  });
})();
