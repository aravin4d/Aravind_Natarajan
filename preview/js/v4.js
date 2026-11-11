/* v4 (11 Nov 2026): the interactive layer. Nothing here runs per scroll frame; every piece answers something the
   reader does. Each piece is wrapped, so one failing never touches the rest. Switch all of it off with ?v4=off. */
(function(){
  'use strict';
  var S = window.__site; if (!S || /[?&]v4=off/.test(location.search)) return;
  var $ = S.$, $$ = S.$$, root = document.documentElement, reduce = S.reduce, fine = S.fine;
  function safe(fn){ try { fn(); } catch (e){ if (window.console) console.warn('v4:', e); } }
  function clamp(v, a, b){ return v < a ? a : v > b ? b : v; }
  function typing(e){ var t = e.target; return !!(t && (/INPUT|TEXTAREA|SELECT/.test(t.tagName) || t.isContentEditable)); }
  function dlg(){ return !!document.querySelector('dialog[open]'); }

  /* ---------- 1 · explored: a running count of the parts of the page that respond, and a way to jump to each ---------- */
  safe(function(){
    var T = [
      { id: 'mk', l: 'Results markers', hint: 'point at a marker', at: '#proof .mk', on: '#proof .mk', hover: true },
      { id: 'cc', l: 'Command Center views', hint: 'switch a view', at: '#command-center [role="tablist"]', on: '#command-center button, #command-center [role="tab"]' },
      { id: 'rc', l: 'Release Check', hint: 'change an answer', at: '.rc', on: '.rc' },
      { id: 'case', l: 'A case study', hint: 'open one', at: '#cases .cs-rows', on: '[data-open^="case-"]' },
      { id: 'route', l: 'The route', hint: 'pick a camp', at: '#route', on: '.rt-camp' },
      { id: 'tool', l: 'A tool, up close', hint: 'point at one', at: '#built .tools', on: '.tool-vis', hover: true },
      { id: 'letter', l: 'The letter', hint: 'open it', at: '#letter-sec', on: '#letter-sec, .h-peek' },
      { id: 'tod', l: 'Time of day', hint: 'change the light', at: '.hdr .tod', on: '.tod button' }
    ].filter(function(t){ return !!$(t.at); });
    if (T.length < 3) return;
    var done = {}; try { (sessionStorage.getItem('cov') || '').split(',').forEach(function(k){ if (k) done[k] = 1; }); } catch (e){}
    function n(){ return T.filter(function(t){ return done[t.id]; }).length; }

    var box = document.createElement('div'); box.className = 'cov';
    box.innerHTML = '<button type="button" class="cov-b" aria-expanded="false" aria-controls="covPop"><svg viewBox="0 0 24 24" aria-hidden="true"><circle class="cov-r0" cx="12" cy="12" r="9"/><circle class="cov-r1" cx="12" cy="12" r="9"/></svg><span class="cov-t"></span></button>' +
      '<div class="cov-pop" id="covPop" hidden><p class="cov-h">This page responds. <b></b></p><ul></ul><p class="cov-f"><kbd>J</kbd> <kbd>K</kbd> next and previous section<br>Drag the trail on the right edge to scrub the climb</p></div>';
    document.body.appendChild(box);
    var btn = $('.cov-b', box), txt = $('.cov-t', box), ring = $('.cov-r1', box), pop = $('.cov-pop', box), ul = $('ul', pop), hb = $('.cov-h b', pop), C = 2 * Math.PI * 9, hintT = 0;
    ring.style.strokeDasharray = C.toFixed(2);
    T.forEach(function(t){ var li = document.createElement('li'); li.innerHTML = '<button type="button" data-k="' + t.id + '"><i aria-hidden="true"></i><span>' + t.l + '</span><em>' + t.hint + '</em></button>'; ul.appendChild(li); t.li = li; });
    function label(){ var k = n(); return k >= T.length ? 'All ' + T.length + ' explored' : k + ' of ' + T.length + ' explored'; }
    function paint(){ var k = n(); txt.textContent = label(); ring.style.strokeDashoffset = (C * (1 - k / T.length)).toFixed(2);
      hb.textContent = k >= T.length ? 'You found all of it.' : (T.length - k) + ' left to try.';
      T.forEach(function(t){ t.li.classList.toggle('ok', !!done[t.id]); }); box.classList.toggle('full', k >= T.length); }
    function mark(t){ if (done[t.id]) return; done[t.id] = 1; try { sessionStorage.setItem('cov', Object.keys(done).join(',')); } catch (e){}
      paint(); clearTimeout(hintT); txt.textContent = '+1 · ' + t.l; box.classList.remove('bump'); void box.offsetWidth; box.classList.add('bump');
      hintT = setTimeout(function(){ txt.textContent = label(); }, 1900); S.track('explored', { id: t.id, n: n() });
      if (n() >= T.length && window.__cursorFX && !reduce){ var r = btn.getBoundingClientRect(); window.__cursorFX.burst(r.left + 16, r.top + 12, 30, 200); } }
    function hit(e, hover){ var el = e.target; if (!el || !el.closest) return; for (var i = 0; i < T.length; i++){ var t = T[i]; if (done[t.id] || (hover && !t.hover)) continue; if (el.closest(t.on)) mark(t); } }
    document.addEventListener('click', function(e){ if (!box.contains(e.target)) hit(e, false); }, true);
    document.addEventListener('change', function(e){ hit(e, false); }, true);
    if (fine) document.addEventListener('mouseover', function(e){ hit(e, true); }, { passive: true });
    document.addEventListener('timechange', function(){ var t = T.filter(function(x){ return x.id === 'tod'; })[0]; if (t && root.classList.contains('intro-done')) mark(t); });

    function open(v){ pop.hidden = !v; btn.setAttribute('aria-expanded', v ? 'true' : 'false'); box.classList.toggle('open', v); }
    btn.addEventListener('click', function(){ open(pop.hidden); });
    document.addEventListener('click', function(e){ if (!pop.hidden && !box.contains(e.target)) open(false); });
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && !pop.hidden){ open(false); btn.focus(); } });
    ul.addEventListener('click', function(e){ var b = e.target.closest('button[data-k]'); if (!b) return; var t = T.filter(function(x){ return x.id === b.getAttribute('data-k'); })[0], el = t && $(t.at); if (!el) return;
      open(false); try { el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' }); } catch (er){ el.scrollIntoView(); }
      setTimeout(function(){ el.classList.remove('cov-ping'); void el.offsetWidth; el.classList.add('cov-ping'); setTimeout(function(){ el.classList.remove('cov-ping'); }, 2600); }, reduce ? 0 : 700); });
    /* when an untried piece comes on screen, the chip names it for a moment */
    if ('IntersectionObserver' in window){ var io = new IntersectionObserver(function(es){ es.forEach(function(en){ if (!en.isIntersecting) return; var t = T.filter(function(x){ return x.el === en.target; })[0];
        if (!t || done[t.id] || t.said || !pop.hidden) return; t.said = true; clearTimeout(hintT); txt.textContent = 'Try it: ' + t.hint; box.classList.add('say'); hintT = setTimeout(function(){ txt.textContent = label(); box.classList.remove('say'); }, 3200); }); }, { threshold: 0.6 });
      T.forEach(function(t){ if (t.id === 'tod' || t.id === 'letter') return; t.el = $(t.at); if (t.el) io.observe(t.el); }); }
    paint();
  });

  /* ---------- 2 · scrub the climb: drag the trail on the right edge and the page, and the mountain, follow your hand ---------- */
  safe(function(){
    var ol = $('.alt ol'); if (!ol || !fine) return;
    var drag = false, moved = false, y0 = 0, raf = 0, want = 0, R = null;
    ol.classList.add('scrub'); ol.setAttribute('title', 'Drag to scrub the climb');
    function go(){ raf = 0; try { window.scrollTo({ top: want, behavior: 'instant' }); } catch (e){ window.scrollTo(0, want); } }
    function at(e){ var g = S.geo(), p = clamp((e.clientY - R.top - 5) / Math.max(1, R.height - 10), 0, 1); want = Math.round(p * g.max); if (!raf) raf = requestAnimationFrame(go); }
    ol.addEventListener('pointerdown', function(e){ if (e.button > 0) return; drag = true; moved = false; y0 = e.clientY; R = ol.getBoundingClientRect(); });
    window.addEventListener('pointermove', function(e){ if (!drag) return; if (!moved){ if (Math.abs(e.clientY - y0) < 5) return; moved = true; root.classList.add('scrubbing'); try { ol.setPointerCapture(e.pointerId); } catch (er){} S.track('scrub'); }
      e.preventDefault(); at(e); });
    function end(){ if (!drag) return; drag = false; if (moved) setTimeout(function(){ root.classList.remove('scrubbing'); }, 60); }
    window.addEventListener('pointerup', end); window.addEventListener('pointercancel', end);
    ol.addEventListener('click', function(e){ if (moved){ e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
    ol.addEventListener('dragstart', function(e){ e.preventDefault(); });
  });

  /* ---------- 3 · keys: J and K walk the camps ---------- */
  safe(function(){
    var camps = $$('main [data-camp], #summit[data-camp]').filter(function(s, i, a){ return a.indexOf(s) === i; });
    if (camps.length < 3) return;
    document.addEventListener('keydown', function(e){
      if (e.ctrlKey || e.metaKey || e.altKey || typing(e) || dlg()) return; var k = (e.key || '').toLowerCase(); if (k !== 'j' && k !== 'k') return;
      var vis = camps.filter(function(s){ return s.offsetParent !== null; }), g = S.geo(), cur = 0;
      vis.forEach(function(s, i){ if (S.box(s).top <= g.vh * 0.3) cur = i; });
      var to = vis[clamp(cur + (k === 'j' ? 1 : -1), 0, vis.length - 1)]; if (!to) return;
      if (k === 'k' && S.box(vis[cur]).top < -40) to = vis[cur];
      try { to.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); } catch (er){ to.scrollIntoView(); } S.track('key_nav');
    });
  });

  /* ---------- 4 · buttons lean toward the pointer ---------- */
  safe(function(){
    if (!fine || reduce) return;
    $$('.btn, .btn-cv, .brief-btn').forEach(function(b){ var r = null;
      b.addEventListener('pointerenter', function(){ r = b.getBoundingClientRect(); });
      b.addEventListener('pointermove', function(e){ if (!r) return; var dx = (e.clientX - (r.left + r.width / 2)) / r.width, dy = (e.clientY - (r.top + r.height / 2)) / r.height;
        b.style.transform = 'translate(' + (dx * 7).toFixed(1) + 'px,' + (dy * 5).toFixed(1) + 'px)'; });
      b.addEventListener('pointerleave', function(){ r = null; b.style.transform = ''; }); });
  });
})();
