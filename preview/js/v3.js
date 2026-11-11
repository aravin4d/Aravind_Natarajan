/* Portfolio v3 · one person, three lenses.
   The lens (Quality, Delivery & Release, Program) never hides anything. It changes which proof leads:
   the hero strip, the order of the case studies and skills, the four lines each camp shows first,
   the lines lit in the ledger, and which résumé the picker offers first.
   The choice lives in the URL (?lens=…) and in one variable. Nothing is stored. */
(function(){
  'use strict';
  var S = window.__site; if (!S) return;
  var root = document.documentElement, $ = S.$, $$ = S.$$, safe = S.safe, reduce = S.reduce;
  function clamp(v, a, b){ return v < a ? a : v > b ? b : v; }
  function mq(q){ return window.matchMedia ? window.matchMedia(q) : { matches: false }; }

  var LENSES = ['quality', 'delivery', 'program'];
  var NAME = { quality: 'Quality', delivery: 'Delivery & Release', program: 'Program' };
  var CV = {
    quality: { href: 'assets/Aravind_Natarajan_Resume.pdf', file: 'Aravind_Natarajan_QA_Manager_Resume.pdf' },
    delivery: { href: 'assets/Aravind_Natarajan_Delivery_Ops_Resume.pdf', file: 'Aravind_Natarajan_Delivery_Ops_Resume.pdf' },
    program: { href: 'assets/Aravind_Natarajan_Program_Delivery_Manager_Resume.pdf', file: 'Aravind_Natarajan_Program_Delivery_Manager_Resume.pdf' }
  };
  /* every figure below is on the résumés */
  var PROOF = {
    quality: [['Under 20%', 'defect leakage, from 75%+', 75], ['Over 80%', 'defect removal efficiency, from under 25%', 25], ['10h to 4h', 'regression cycle'], ['Under 1%', 'invalid defects']],
    delivery: [['150+', 'releases on a predictable cadence'], ['~80%', 'fewer SOS escalations'], ['30+', 'initiatives shipped'], ['85%', 'fewer app crashes']],
    program: [['3', 'stage gates on every release'], ['3 to 13', 'Meijer stores, launch to today'], ['35-person', 'tech org on one operating model'], ['$69K+', 'saved a year']]
  };
  var CASES = {
    '': ['governance', 'tracking', 'sos', 'product', 'tools', 'assign', 'meijer', 'flow'],
    quality: ['governance', 'tracking', 'product', 'tools', 'flow', 'sos', 'assign', 'meijer'],
    delivery: ['governance', 'sos', 'flow', 'tracking', 'meijer', 'assign', 'product', 'tools'],
    program: ['meijer', 'governance', 'flow', 'product', 'tracking', 'sos', 'assign', 'tools']
  };
  /* skills groups by heading, so the order survives edits to the page */
  var SKILLS = {
    '': [],
    quality: ['QA leadership', 'Testing and platforms', 'Delivery and release', 'People', 'Tools and observability', 'Program and delivery'],
    delivery: ['Delivery and release', 'Program and delivery', 'QA leadership', 'People', 'Tools and observability', 'Testing and platforms'],
    program: ['Program and delivery', 'Delivery and release', 'People', 'QA leadership', 'Tools and observability', 'Testing and platforms']
  };
  var lens = root.getAttribute('data-lens') || '';
  if (LENSES.indexOf(lens) < 0) lens = '';
  var hooks = [];

  /* ---------- numbers that count to their value (from zero, or from the old value) ---------- */
  function countUp(el, ms){
    var txt = el.__txt || el.textContent; el.__txt = txt;
    if (reduce){ el.textContent = txt; return; }
    var m = /(\d[\d,]*(?:\.\d+)?)/.exec(txt); if (!m) return;
    var raw = m[1], to = parseFloat(raw.replace(/,/g, '')), dec = raw.indexOf('.') > -1 ? raw.split('.')[1].length : 0, comma = raw.indexOf(',') > -1;
    var from = el.hasAttribute('data-from') ? parseFloat(el.getAttribute('data-from')) : 0, pre = txt.slice(0, m.index), post = txt.slice(m.index + raw.length), t0 = 0, run = (el.__run = (el.__run || 0) + 1);
    if (isNaN(to) || from === to) return;
    function fmt(v){ var s = v.toFixed(dec); if (comma) s = s.replace(/\B(?=(\d{3})+(?!\d))/g, ','); return s; }
    function step(t){
      if (el.__run !== run) return;
      if (!t0) t0 = t; var p = clamp((t - t0) / (ms || 1000), 0, 1), e = 1 - Math.pow(1 - p, 3);
      el.textContent = p < 1 ? pre + fmt(from + (to - from) * e) + post : txt;
      if (p < 1) requestAnimationFrame(step);
    }
    el.textContent = pre + fmt(from) + post; requestAnimationFrame(step);
  }
  window.__count = countUp;
  function countAll(scope){ $$('[data-count]', scope).forEach(function(b, i){ setTimeout(function(){ countUp(b, 1100); }, i * 120); }); }

  /* ---------- an SVG drawn in percentages, refitted to real pixels so strokes stay true ---------- */
  function fitSvg(svg){
    if (!svg) return false;
    var w = svg.clientWidth || (svg.getBoundingClientRect && svg.getBoundingClientRect().width) || 0, h = svg.clientHeight || (svg.getBoundingClientRect && svg.getBoundingClientRect().height) || 0;
    if (!w || !h) return false;
    if (!svg.__vb){ var vb = (svg.getAttribute('viewBox') || '0 0 100 100').split(/[\s,]+/).map(parseFloat); svg.__vb = [vb[2] || 100, vb[3] || 100]; $$('path', svg).forEach(function(p){ p.__d = p.getAttribute('d'); }); }
    var sx = w / svg.__vb[0], sy = h / svg.__vb[1];
    $$('path', svg).forEach(function(p){
      var k = 0; p.setAttribute('d', p.__d.replace(/-?\d*\.?\d+/g, function(n){ var v = parseFloat(n) * (k % 2 ? sy : sx); k++; return (Math.round(v * 10) / 10).toString(); }));
    });
    svg.setAttribute('viewBox', '0 0 ' + Math.round(w) + ' ' + Math.round(h));
    return true;
  }
  function lenAt(path, x, y){
    var L = 0, best = 0, bd = Infinity, i, n = 240, pt, d;
    try { L = path.getTotalLength(); } catch (e){ return 0; }
    for (i = 0; i <= n; i++){ pt = path.getPointAtLength(L * i / n); d = (pt.x - x) * (pt.x - x) + (pt.y - y) * (pt.y - y); if (d < bd){ bd = d; best = L * i / n; } }
    return best;
  }

  /* ---------- the lens ---------- */
  function setLens(l, user){
    lens = LENSES.indexOf(l) > -1 ? l : '';
    if (lens) root.setAttribute('data-lens', lens); else root.removeAttribute('data-lens');
    $$('.lens button').forEach(function(b){ b.setAttribute('aria-pressed', b.getAttribute('data-lens') === lens ? 'true' : 'false'); });
    hooks.forEach(function(f){ safe(function(){ f(!!user); }); });
    if (user){
      try {
        var q = location.search.replace(/^\?/, '').split('&').filter(function(p){ return p && p.indexOf('lens=') !== 0; });
        if (lens) q.push('lens=' + lens);
        history.replaceState(null, '', location.pathname + (q.length ? '?' + q.join('&') : '') + location.hash);
      } catch (e){}
      S.track('lens', { lens: lens || 'all' }); if (S.sfx) S.sfx('tap');
    }
  }
  safe(function(){
    $$('.lens button').forEach(function(b){
      b.addEventListener('click', function(){ var l = b.getAttribute('data-lens'); setLens(l === lens ? '' : l, true); });
    });
  });

  /* the hero proof strip */
  safe(function(){
    var ul = document.getElementById('hStats'); if (!ul) return;
    var base = $$('li', ul).map(function(li){ return [$('b', li).textContent, $('span', li).textContent]; });
    function paint(rows, anim){
      ul.innerHTML = '';
      rows.forEach(function(r, i){
        var li = document.createElement('li'), b = document.createElement('b'), s = document.createElement('span');
        b.textContent = r[0]; s.textContent = r[1]; if (r[2] != null) b.setAttribute('data-from', r[2]);
        li.style.setProperty('--k', i); li.appendChild(b); li.appendChild(s); ul.appendChild(li);
        if (anim) setTimeout(function(){ countUp(b, 900); }, i * 70);
      });
      if (anim && !reduce){ ul.classList.remove('swap'); void ul.offsetWidth; ul.classList.add('swap'); }
    }
    hooks.push(function(user){ paint(lens ? PROOF[lens] : base, user); });
    if (lens) paint(PROOF[lens], false);
    /* the staged entrance: once the name has landed, the strip counts up */
    if (!reduce){
      var tries = 0, t = setInterval(function(){
        if (root.classList.contains('intro-done') || ++tries > 50){ clearInterval(t); if (window.pageYOffset < window.innerHeight * 0.6) $$('b', ul).forEach(function(b, i){ setTimeout(function(){ countUp(b, 1000); }, i * 110); }); }
      }, 100);
    }
  });

  /* case studies and skills change their order, never their content */
  safe(function(){
    var rows = $$('#cases .cs-row');
    function order(){
      var o = CASES[lens] || CASES[''];
      rows.forEach(function(li){ var a = $('a[data-open]', li), id = a ? a.getAttribute('data-open').replace('case-', '') : '', i = o.indexOf(id); li.style.order = i < 0 ? 99 : i; });
    }
    hooks.push(order); order();
  });
  safe(function(){
    var groups = $$('#skills .sk > div').filter(function(d){ return $('h3', d); });
    function order(){
      var o = SKILLS[lens] || [];
      groups.forEach(function(g, n){
        var t = $('h3', g).textContent, i = -1;
        o.forEach(function(k, j){ if (i < 0 && t.indexOf(k) === 0) i = j; });
        g.style.order = o.length ? (i < 0 ? 50 + n : i) : '';
      });
    }
    hooks.push(order); order();
  });

  /* ---------- the route: four camps, one panel ---------- */
  safe(function(){
    var pin = document.getElementById('route'); if (!pin) return;
    var rt = $('.rt', pin), svg = $('.rt-svg', pin), prog = $('.rt-prog', pin), tabs = $$('.rt-camp', pin), box = $('.rt-panels', pin);
    var panels = tabs.map(function(t){ return document.getElementById(t.getAttribute('aria-controls')); });
    var cur = 0, seen = [], lens_ = [], narrow = mq('(max-width: 900px)'), pinned = false, inView = false, rz = 0, lock = 0, nav = null;
    if (!tabs.length || panels.indexOf(null) > -1) return;
    rt.classList.add('rt-js');

    /* the lens decides which four lines each camp shows first */
    function sortLines(){
      var k = lens ? 'data-' + lens.charAt(0) : 'data-o';
      panels.forEach(function(p){
        var ul = $('.rt-lines', p); if (!ul) return;
        $$('li', ul).map(function(li){ var v = parseFloat(li.getAttribute(k)); if (isNaN(v)) v = 50 + (parseFloat(li.getAttribute('data-o')) || 0); return [v, li]; })
          .sort(function(a, b){ return a[0] - b[0]; }).forEach(function(x){ ul.appendChild(x[1]); });
      });
    }
    hooks.push(sortLines); sortLines();

    function fit(){
      if (narrow.matches || !fitSvg(svg)) return;
      var bb = svg.getBoundingClientRect(), w = bb.width, h = bb.height;
      tabs.forEach(function(t, i){
        var x = parseFloat(t.style.getPropertyValue('--x')) / 100 * w, y = parseFloat(t.style.getPropertyValue('--y')) / 100 * h;
        lens_[i] = lenAt(prog, x, y);
      });
      prog.style.setProperty('--len', (lens_[cur] || 0).toFixed(1));
    }
    function select(i, o){
      o = o || {};
      var changed = i !== cur; cur = i;
      tabs.forEach(function(t, k){ var on = k === i; t.setAttribute('aria-selected', on ? 'true' : 'false'); t.tabIndex = on ? 0 : -1; panels[k].classList.toggle('on', on); });
      if (lens_.length) prog.style.setProperty('--len', (lens_[i] || 0).toFixed(1));
      if (changed && !reduce && !narrow.matches){ panels[i].classList.remove('rt-in'); void panels[i].offsetWidth; panels[i].classList.add('rt-in'); }
      if ((inView || o.user) && !seen[i]){ seen[i] = true; countAll(panels[i]); }
      if (o.focus) tabs[i].focus();
      if (o.click) rt.classList.add('rt-used');
      if (nav){ nav.prev.disabled = i === 0; nav.next.disabled = i === tabs.length - 1; nav.at.textContent = (tabs.length - i) + ' / ' + tabs.length; }
      if (changed && o.user){ S.track('route_camp', { id: panels[i].id }); if (o.click && S.sfx) S.sfx('tap'); }
    }
    function go(i, focus){
      if (narrow.matches){
        var p = panels[i]; select(i, { user: true, click: true, focus: focus });
        box.scrollTo({ left: p.offsetLeft - (box.clientWidth - p.offsetWidth) / 2, behavior: reduce ? 'auto' : 'smooth' });
      } else if (pinned){
        measure(); var r = { top: pTop - window.pageYOffset }, total = pH - window.innerHeight;
        /* jump there at once and hold the choice: a smooth scroll would pass the other camps on the way and the heading snap could pull it back */
        lock = Date.now() + 900; if (window.__snap && window.__snap.poke) window.__snap.poke();
        select(i, { user: true, click: true, focus: focus });
        try { window.scrollTo({ top: Math.round(window.pageYOffset + r.top + total * (i + 0.5) / tabs.length), behavior: 'instant' }); } catch (e){ window.scrollTo(0, Math.round(window.pageYOffset + r.top + total * (i + 0.5) / tabs.length)); }
      } else select(i, { user: true, click: true, focus: focus });
    }
    tabs.forEach(function(t, i){
      t.addEventListener('click', function(){ if (i !== cur) go(i, false); });
      t.addEventListener('keydown', function(e){
        var n = tabs.length, j = -1;
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') j = (i + 1) % n; else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') j = (i - 1 + n) % n; else if (e.key === 'Home') j = 0; else if (e.key === 'End') j = n - 1;
        if (j > -1){ e.preventDefault(); go(j, true); }
      });
    });
    /* arrows on the panel itself, where the eye already is: Earlier role, Later role */
    safe(function(){
      var box2 = document.createElement('div'), prev = document.createElement('button'), next = document.createElement('button'), at = document.createElement('span');
      box2.className = 'rt-nav'; prev.type = next.type = 'button'; prev.textContent = '‹'; next.textContent = '›';
      prev.setAttribute('aria-label', 'Later role'); next.setAttribute('aria-label', 'Earlier role'); prev.title = 'Later role'; next.title = 'Earlier role';
      box2.appendChild(prev); box2.appendChild(at); box2.appendChild(next); box.appendChild(box2);
      prev.addEventListener('click', function(){ if (cur > 0) go(cur - 1, false); }); next.addEventListener('click', function(){ if (cur < tabs.length - 1) go(cur + 1, false); });
      nav = { prev: prev, next: next, at: at }; prev.disabled = true; at.textContent = tabs.length + ' / ' + tabs.length;
    });
    /* on a phone the camps are cards you swipe; the dots follow the card in the middle */
    var st = 0;
    box.addEventListener('scroll', function(){
      if (!narrow.matches) return;
      cancelAnimationFrame(st); st = requestAnimationFrame(function(){
        var mid = box.scrollLeft + box.clientWidth / 2, best = 0, bd = Infinity;
        panels.forEach(function(p, k){ var d = Math.abs(p.offsetLeft + p.offsetWidth / 2 - mid); if (d < bd){ bd = d; best = k; } });
        if (best !== cur) select(best, { user: true });
      });
    }, { passive: true });

    /* on a laptop the section holds still while the scroll walks the camps.
       Only when it is safe: a fine pointer, motion allowed, room for the whole panel, and nothing above that breaks sticky. */
    function canPin(){
      if (reduce || !S.fine || narrow.matches || window.innerWidth < 1001 || window.innerHeight < 600) return false;
      if (!(window.CSS && CSS.supports && CSS.supports('position', 'sticky'))) return false;
      for (var el = pin.parentNode; el && el !== document.body && el.nodeType === 1; el = el.parentNode){
        var cs = getComputedStyle(el); if (/(auto|scroll|hidden)/.test(cs.overflowY + ' ' + cs.overflowX)) return false;
      }
      return true;
    }
    function setPin(){
      var want = canPin();
      root.classList.toggle('rt-pinned', want);
      if (want && rt.offsetHeight > window.innerHeight - 76){ want = false; root.classList.remove('rt-pinned'); }
      pinned = want;
    }
    /* the pin's place on the page is measured once per layout, not on every scroll step */
    var pTop = 0, pH = 0, wasLive = false;
    function measure(){ pTop = window.pageYOffset + pin.getBoundingClientRect().top; pH = pin.offsetHeight; }
    function onScroll(){
      if (!pinned){ if (wasLive){ wasLive = false; root.classList.remove('rt-live'); } return; }
      var top = pTop - window.pageYOffset, total = pH - window.innerHeight; if (total <= 0) return;
      var live = top <= 0 && top + pH >= window.innerHeight;
      if (live !== wasLive){ wasLive = live; root.classList.toggle('rt-live', live); }   /* while the route holds the screen, the résumé toast stays out of its corner */
      if (!live || Date.now() < lock) return;
      var i = clamp(Math.floor(clamp(-top / total, 0, 0.9999) * tabs.length), 0, tabs.length - 1);
      if (i !== cur) select(i, { user: true });
    }
    S.onScroll(onScroll);
    /* where the screen is too short to pin, the route walks the camps by itself until you take over */
    var autoT = 0, near = false, hover = false;
    function autoStep(){
      clearTimeout(autoT);
      if (pinned || narrow.matches || reduce || !near || rt.classList.contains('rt-used')) return;
      autoT = setTimeout(function(){ if (!hover && !pinned && !rt.classList.contains('rt-used')) select((cur + 1) % tabs.length, { user: true }); autoStep(); }, 6000);
    }
    rt.addEventListener('pointerenter', function(){ hover = true; }); rt.addEventListener('pointerleave', function(){ hover = false; });
    if ('IntersectionObserver' in window) new IntersectionObserver(function(es){ near = es[0].isIntersecting; root.classList.toggle('rt-near', near); autoStep(); }, { threshold: 0.2 }).observe(rt);
    function layout(){ setPin(); fit(); measure(); }
    setInterval(function(){ if (pinned) measure(); }, 2500);
    window.addEventListener('resize', function(){ cancelAnimationFrame(rz); rz = requestAnimationFrame(layout); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
    layout();
    S.onView(rt, function(){ inView = true; if (!seen[cur]){ seen[cur] = true; countAll(panels[cur]); } fit(); }, 0.25);
  });

  /* ---------- the ledger: every line, in a drawer ---------- */
  safe(function(){
    var d = document.getElementById('ledger'), btn = document.getElementById('lgOpen'); if (!d || !btn) return;
    var note = $('.lg-lens', d), n = $('.lg-n', btn), x = $('.lg-x', d), can = typeof d.showModal === 'function';
    if (n) n.textContent = $$('.wk-li', d).length;
    function kick(){ try { window.dispatchEvent(new Event('resize')); if (window.__reveal) window.__reveal.kick(); } catch (e){} }
    function open(target){
      if (!d.open){ if (can) d.showModal(); else d.setAttribute('open', ''); root.classList.add('lg-open'); d.scrollTop = 0; S.track('ledger_open'); }
      kick(); setTimeout(kick, 320);
      if (target) setTimeout(function(){ try { target.scrollIntoView({ block: 'start' }); } catch (e){} }, 80);
    }
    function shut(){
      if (!d.open) return;
      function done(){ d.classList.remove('lg-out'); if (can) d.close(); else d.removeAttribute('open'); root.classList.remove('lg-open'); btn.focus(); }
      if (reduce){ done(); return; }
      d.classList.add('lg-out'); setTimeout(done, 200);
    }
    btn.addEventListener('click', function(){ open(); if (S.sfx) S.sfx('tap'); });
    if (x) x.addEventListener('click', shut);
    d.addEventListener('click', function(e){
      if (e.target === d){ shut(); return; }
      var a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
      if (a){ d.classList.remove('lg-out'); if (can) d.close(); else d.removeAttribute('open'); root.classList.remove('lg-open'); }
    });
    d.addEventListener('cancel', function(e){ e.preventDefault(); shut(); });
    d.addEventListener('close', function(){ root.classList.remove('lg-open'); });
    d.addEventListener('scroll', function(){ if (window.__reveal) window.__reveal.kick(); }, { passive: true });
    function lensNote(){
      if (!note) return;
      note.hidden = !lens; note.textContent = '';
      if (lens){ note.appendChild(document.createTextNode('Marked: the lines that matter most for a ')); var b = document.createElement('b'); b.textContent = NAME[lens]; note.appendChild(b); note.appendChild(document.createTextNode(' role. Everything else is still here.')); }
    }
    hooks.push(lensNote); lensNote();
    /* old links to a theme card (…/#wk-governance) open the drawer at that card */
    function fromHash(){ var id = location.hash.slice(1); if (!/^wk-/.test(id)) return; var el = document.getElementById(id); if (el && d.contains(el)) open(el); }
    window.addEventListener('hashchange', fromHash); fromHash();
  });

  /* ---------- the résumé picker: one button everywhere, three routes ---------- */
  safe(function(){
    var d = document.getElementById('resumePick'); if (!d || typeof d.showModal !== 'function') return;
    var cards = $$('.rp-card', d), routes = $$('.rp-route', d), svg = $('.rp-svg', d), x = $('.rp-x', d), from = null, sel = '';
    function pick(r, draw){
      sel = r;
      cards.forEach(function(c){ var on = c.getAttribute('data-r') === r; c.classList.toggle('on', on); if (on) c.setAttribute('aria-current', 'true'); else c.removeAttribute('aria-current'); });
      routes.forEach(function(p){
        var on = p.getAttribute('data-r') === r, L = 0;
        if (on){ try { L = p.getTotalLength(); } catch (e){} }
        if (on && draw && !reduce){ p.classList.remove('on'); p.style.setProperty('--len', '0'); void p.getBoundingClientRect(); }
        p.classList.toggle('on', on); p.style.setProperty('--len', on ? L.toFixed(1) : '0');
      });
    }
    function open(r, src){
      from = src || null;
      if (!d.open) d.showModal();
      fitSvg(svg); pick(r, true);
      var c = cards.filter(function(k){ return k.getAttribute('data-r') === r; })[0], a = c ? $('a', c) : null; if (a) a.focus();
      S.track('resume_picker', { from: src ? src.getAttribute('data-cv') : '', route: r });
    }
    function shut(){ if (d.open) d.close(); }
    cards.forEach(function(c){
      var r = c.getAttribute('data-r');
      c.addEventListener('pointerenter', function(){ if (sel !== r) pick(r, true); });
      c.addEventListener('focusin', function(){ if (sel !== r) pick(r, true); });
      c.addEventListener('click', function(){ if (sel !== r) pick(r, true); });
    });
    if (x) x.addEventListener('click', shut);
    d.addEventListener('click', function(e){ if (e.target === d) shut(); });
    d.addEventListener('close', function(){ if (from && from.focus) try { from.focus(); } catch (e){} from = null; });
    window.addEventListener('resize', function(){ if (d.open){ fitSvg(svg); pick(sel, false); } });
    document.addEventListener('click', function(e){
      var a = e.target.closest ? e.target.closest('a[data-cv]') : null; if (!a || d.contains(a)) return;
      if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (a.hasAttribute('data-dl') && lens) return;            /* with a lens on, the hero's Download fetches that résumé directly */
      var h = a.getAttribute('href') || '', r = lens || (h.indexOf('Delivery_Ops') > -1 ? 'delivery' : h.indexOf('Program') > -1 ? 'program' : 'quality');
      e.preventDefault(); open(r, a);
    });
    /* the hero's buttons follow the lens */
    var dl = $('[data-dl="hero"]'), other = $('.h-lens-other');
    function hero(){
      var c = CV[lens || 'quality'];
      if (dl){ dl.setAttribute('href', c.href); dl.setAttribute('download', c.file); }
      if (other) other.hidden = !lens;
    }
    hooks.push(hero); hero();
  });

  /* ---------- results: each bar starts at the old value and settles at the new one ---------- */
  safe(function(){
    var ba = $('.ba'); if (!ba) return;
    S.onView(ba, function(){ ba.classList.add('ba-go'); countAll(ba); }, 0.3);
  });

  /* ---------- command center clips: play while on screen, tap to pause ---------- */
  safe(function(){
    var vids = $$('.cc-clip'); if (!vids.length) return;
    var lite = !!(window.matchMedia && window.matchMedia('(max-width: 820px), (pointer: coarse)').matches);
    if (reduce || lite || !('IntersectionObserver' in window)){ vids.forEach(function(v){ v.controls = true; }); return; }
    var io = new IntersectionObserver(function(es){
      es.forEach(function(e){ var v = e.target; if (e.isIntersecting && !v.__held){ var p = v.play(); if (p && p.catch) p.catch(function(){ v.controls = true; }); } else v.pause(); });
    }, { threshold: 0.6 });
    vids.forEach(function(v){
      io.observe(v);
      v.addEventListener('click', function(){ if (v.controls) return; if (v.paused){ v.__held = false; var p = v.play(); if (p && p.catch) p.catch(function(){}); } else { v.__held = true; v.pause(); } });
    });
  });

  /* ---------- the lens switch joins the header once the hero is behind you ---------- */
  safe(function(){
    var hero = document.getElementById('top'); if (!hero) return;
    var end = 0, was = null;
    function m(){ end = window.pageYOffset + hero.getBoundingClientRect().bottom - 90; f(); }
    function f(){ var p = window.pageYOffset > end; if (p !== was){ was = p; root.classList.toggle('past-hero', p); } }
    S.onScroll(f); window.addEventListener('resize', m); setTimeout(m, 1500); m();
  });

  /* ---------- phone: the longest blocks fold, and open with one tap ---------- */
  safe(function(){
    if (!mq('(max-width: 700px)').matches) return;
    var CLAMP = 360;
    function openFold(el){ if (!el.classList.contains('fd') || el.classList.contains('fd-open')) return; el.classList.add('fd-open'); if (el.__fb && el.__fb.parentNode) el.__fb.parentNode.removeChild(el.__fb); }
    $$('#leadership .ld-block, #skills .sk').forEach(function(el){
      if (el.scrollHeight < CLAMP + 220) return;
      var fade = document.createElement('span'), b = document.createElement('button');
      fade.className = 'fd-fade'; fade.setAttribute('aria-hidden', 'true');
      b.type = 'button'; b.className = 'fd-btn'; b.textContent = 'Show all of it';
      el.style.setProperty('--fdh', CLAMP + 'px'); el.classList.add('fd'); el.appendChild(fade);
      el.parentNode.insertBefore(b, el.nextSibling); el.__fb = b;
      b.addEventListener('click', function(){ openFold(el); });
      /* anything inside that takes focus opens the block, so the keyboard never lands on hidden content */
      el.addEventListener('focusin', function(){ openFold(el); });
    });
    function forHash(){ var id = location.hash.slice(1), t = id ? document.getElementById(id) : null, f = t && t.closest ? t.closest('.fd') : null; if (f){ openFold(f); setTimeout(function(){ try { t.scrollIntoView({ block: 'start' }); } catch (e){} }, 60); } }
    window.addEventListener('hashchange', forHash); forHash();
    /* the lens reorders the skills; open them so the new order is seen */
    hooks.push(function(user){ if (user){ var sk = $('#skills .sk'); if (sk) openFold(sk); } });
  });

  /* ---------- the 2-minute version: the same page with only the essentials showing. Nothing is removed. ---------- */
  safe(function(){
    var btns = $$('.brief-btn'), offs = $$('.brief-off'); if (!btns.length) return;
    function set(on, user){
      root.classList.toggle('brief', on);
      btns.forEach(function(b){ b.setAttribute('aria-pressed', on ? 'true' : 'false'); b.textContent = on ? 'Full version' : '2-minute version'; });
      try { window.dispatchEvent(new Event('resize')); window.dispatchEvent(new Event('scroll')); } catch (e){}
      if (user){
        if (on) window.scrollTo(0, 0);
        try { var q = location.search.replace(/^\?/, '').split('&').filter(function(p){ return p && p.indexOf('short') !== 0; }); if (on) q.push('short=1'); history.replaceState(null, '', location.pathname + (q.length ? '?' + q.join('&') : '') + location.hash); } catch (e){}
        S.track('brief', { on: on }); if (S.sfx) S.sfx('tap');
      }
    }
    btns.forEach(function(b){ b.addEventListener('click', function(){ set(!root.classList.contains('brief'), true); }); });
    offs.forEach(function(b){ b.addEventListener('click', function(){ var y = window.pageYOffset; set(false, true); var t = document.getElementById('leadership'); if (t) try { t.scrollIntoView({ block: 'start' }); } catch (e){ window.scrollTo(0, y); } }); });
    /* a link to something the short version hides brings the full version back first */
    document.addEventListener('click', function(e){
      if (!root.classList.contains('brief')) return;
      var a = e.target.closest ? e.target.closest('a[href^="#"]') : null; if (!a) return;
      var t = document.getElementById(a.getAttribute('href').slice(1)); if (!t || t.closest('dialog') || t.offsetParent !== null) return;
      set(false, false);
    }, true);
    if (/[?&]short(=1)?(&|$)/.test(location.search)) set(true, false);
  });

  /* start in the lens the link asked for */
  setLens(lens, false);
  window.__lens = { get: function(){ return lens; }, set: function(l){ setLens(l, true); } };
})();
