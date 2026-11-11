/* Portfolio v3 · the design pass.
   Ten pieces of decoration and motion on top of the climb. Each one stands alone: it runs inside its
   own safe() block and sits behind its own class on <html>, so one failing or switched off changes
   nothing else. To switch pieces off, list them in OFF below, or open the page with ?fx=-sky,-tour
   (or ?fx=off for none of them). Names: sky, hero, tour, log, climber, profile, flags, contour, summit, decks. */
(function(){
  'use strict';
  var S = window.__site; if (!S) return;
  var OFF = ['hero', 'sky', 'story'];   /* hero: the contour map read as a loading glitch over the 3D mountain. sky: full-screen layers over the 3D canvas cost frames, and the world already has its own light and weather. */
  var root = document.documentElement, $ = S.$, $$ = S.$$, safe = S.safe, reduce = S.reduce, NS = 'http://www.w3.org/2000/svg';
  function clamp(v, a, b){ return v < a ? a : v > b ? b : v; }
  function svgEl(n, at){ var e = document.createElementNS(NS, n); for (var k in at) e.setAttribute(k, at[k]); return e; }
  var q = /[?&]fx=([^&#]*)/.exec(location.search), all = false;
  if (q){ decodeURIComponent(q[1]).split(',').forEach(function(t){ t = t.trim(); if (t === 'off') all = true; else if (t.charAt(0) === '-') OFF.push(t.slice(1)); }); }
  /* phones get the light version: no giant numerals, no looping decoration, no autoplaying clips */
  var LITE = !!(window.matchMedia && window.matchMedia('(max-width: 820px), (pointer: coarse)').matches), HEAVY = ['camps', 'climber', 'profile', 'flags', 'contour', 'replay', 'nudge', 'summit'];
  if (LITE) root.classList.add('lite');
  function fx(name, fn){
    if (all || OFF.indexOf(name) > -1 || (LITE && HEAVY.indexOf(name) > -1)) return;
    try { root.classList.add('fx-' + name); fn(); } catch (e){ root.classList.remove('fx-' + name); if (window.console) console.warn('fx ' + name + ':', e); }
  }
  function docMax(){ return Math.max(1, document.documentElement.scrollHeight - window.innerHeight); }

  /* ---------- 1 · sky: aurora at night, light shafts in the morning, heat haze at dusk, thin air up high ----------
     The 3D world already changes its light, cloud and weather with the climb. These layers sit between it and
     the page and follow the same altitude: 0 in the valley, 1 at the Summit section, back down to camp after it. */
  fx('sky', function(){
    var sky = document.createElement('div'); sky.className = 'sky'; sky.setAttribute('aria-hidden', 'true');
    ['sky-aurora', 'sky-rays', 'sky-haze', 'sky-thin'].forEach(function(c){ var i = document.createElement('i'); i.className = c; sky.appendChild(i); });
    document.body.insertBefore(sky, document.body.firstChild);
    var sm = document.getElementById('summit'), last = -1;
    function alt(){
      var y = window.pageYOffset, max = docMax(), top = sm ? clamp(y + sm.getBoundingClientRect().top - window.innerHeight * 0.25, 1, max) : max;
      var a = y <= top ? y / top : 1 - 0.7 * (y - top) / Math.max(1, max - top);
      a = Math.round(clamp(a, 0, 1) * 100) / 100;
      if (a !== last){ last = a; sky.style.setProperty('--alt', a); }   /* on the layer itself: a variable on <html> would restyle the whole page on every scroll step */
    }
    S.onScroll(alt); window.addEventListener('resize', alt); alt();
  });

  /* ---------- 2 · hero: a contour map draws itself behind the name; a lens lights its route to the peak ---------- */
  fx('hero', function(){
    var hero = document.getElementById('top'); if (!hero) return;
    var W = 600, H = 600, cx = 318, cy = 236, svg = svgEl('svg', { 'class': 'h-topo', viewBox: '0 0 ' + W + ' ' + H, 'aria-hidden': 'true' }), i, k;
    /* seven rings around the peak, each a little less round than the last */
    for (i = 0; i < 7; i++){
      var r = 34 + i * 38, d = '', n = 48;
      for (k = 0; k <= n; k++){
        var a = k / n * Math.PI * 2, wob = 1 + 0.085 * Math.sin(a * 3 + i * 0.9) + 0.05 * Math.sin(a * 5 - i * 1.7) + 0.03 * i * Math.cos(a * 2 + 1),
          x = cx + Math.cos(a) * r * wob * 1.18, y = cy + Math.sin(a) * r * wob * 0.86;
        d += (k ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1) + ' ';
      }
      var p = svgEl('path', { 'class': 'h-ct', d: d + 'Z' }); p.style.setProperty('--k', i); svg.appendChild(p);
    }
    /* three routes up the same mountain */
    [['quality', 'M96 600 C120 500 190 430 232 352 C262 300 290 276 318 236'], ['delivery', 'M330 600 C312 520 356 452 338 372 C328 318 326 280 318 236'], ['program', 'M560 600 C540 510 470 452 420 372 C388 320 350 276 318 236']].forEach(function(rt){
      svg.appendChild(svgEl('path', { 'class': 'h-rt', 'data-r': rt[0], d: rt[1] }));
    });
    svg.appendChild(svgEl('path', { 'class': 'h-pk', d: 'M' + cx + ' ' + (cy - 15) + ' l11 6 l-11 6 z M' + cx + ' ' + (cy - 15) + ' v22', style: 'stroke:var(--accent);stroke-width:1.6' }));
    hero.insertBefore(svg, hero.firstChild);
    $$('path', svg).forEach(function(p){ var L = 0; try { L = p.getTotalLength(); } catch (e){} if (L) p.style.setProperty('--l', Math.ceil(L)); });
    requestAnimationFrame(function(){ requestAnimationFrame(function(){ svg.classList.add('go'); }); });
  });

  /* ---------- 3 · command center: "Play the tour" walks the eight views pin by pin; the dial gets a needle ---------- */
  fx('tour', function(){
    var tour = document.getElementById('cc-tour'); if (!tour) return;
    var tabs = $$('[role="tab"]', tour), panels = $$('[role="tabpanel"]', tour), head = $('.cc-bh', tour), win = $('.cc-win', tour); if (!tabs.length || !head || !win) return;
    var steps = [];
    panels.forEach(function(p, v){
      var lis = $$('.cc-pins li', p), pins = $$('.cc-pin', p);
      if (!lis.length){ steps.push({ v: v }); return; }
      lis.forEach(function(li, n){ var pin = pins.filter(function(x){ return parseInt(x.textContent, 10) === n + 1; })[0] || null; steps.push({ v: v, li: li, pin: pin }); });
    });
    var btn = document.createElement('button'), cap = document.createElement('p'), capK = document.createElement('b'), capT = document.createElement('span'), at = -1, timer = 0, DUR = 3400;
    btn.type = 'button'; btn.className = 'cc-play'; btn.innerHTML = '<i aria-hidden="true"></i><span>Play the tour</span>';
    cap.className = 'cc-tourcap'; cap.hidden = true; cap.setAttribute('role', 'status'); cap.style.setProperty('--dur', DUR + 'ms'); cap.appendChild(capK); cap.appendChild(capT);
    head.appendChild(btn); win.parentNode.insertBefore(cap, win);
    function clear(){ $$('.hot', tour).forEach(function(e){ e.classList.remove('hot'); }); }
    function stop(){
      if (at < 0) return; clearTimeout(timer); at = -1; clear(); cap.hidden = true; cap.classList.remove('tick');
      btn.classList.remove('on'); $('span', btn).textContent = 'Play the tour';
    }
    function show(){
      var s = steps[at]; if (!s){ stop(); return; }
      var p = panels[s.v], wait = 0; clear();
      if (p.hidden){ tabs[s.v].click(); wait = 260; }
      timer = setTimeout(function(){
        if (at < 0) return;
        var shots = $('.cc-shots', p);
        if (s.pin && shots){ var fig = s.pin.closest('.cc-shot'); shots.scrollTop = Math.max(0, (fig ? fig.offsetTop : 0) + s.pin.offsetTop - shots.clientHeight * 0.38); s.pin.classList.add('hot'); }
        else if (shots && s.li && !s.pin) shots.scrollTop = shots.scrollHeight;
        if (s.li) s.li.classList.add('hot');
        capK.textContent = (s.v + 1) + ' of ' + panels.length + ' · ' + tabs[s.v].textContent.trim();
        capT.textContent = s.li ? s.li.textContent.trim() : '';
        cap.classList.remove('tick'); void cap.offsetWidth; if (!reduce) cap.classList.add('tick');
        timer = setTimeout(function(){ at++; show(); }, DUR);
      }, wait);
    }
    function play(){
      at = 0; cap.hidden = false; btn.classList.add('on'); $('span', btn).textContent = 'Stop the tour';
      try { win.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' }); } catch (e){}
      show(); S.track('cc_tour');
    }
    btn.addEventListener('click', function(e){ e.stopPropagation(); if (at < 0) play(); else stop(); });
    /* the moment you touch the tour yourself, it hands over */
    tour.addEventListener('pointerdown', function(e){ if (at > -1 && !btn.contains(e.target)) stop(); });
    tour.addEventListener('keydown', function(e){ if (at > -1 && e.target !== btn) stop(); });
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape') stop(); });
    if ('IntersectionObserver' in window) new IntersectionObserver(function(es){ if (!es[0].isIntersecting) stop(); }, { threshold: 0 }).observe(tour);
    /* a line in "Worth noticing" is a button too: it takes the sheet to its pin */
    steps.forEach(function(s){
      if (!s.li || !s.pin) return; s.li.style.cursor = 'pointer';
      s.li.addEventListener('click', function(){ if (at > -1) return; var shots = s.pin.closest('.cc-shots'), fig = s.pin.closest('.cc-shot'); clear(); if (shots) shots.scrollTop = Math.max(0, (fig ? fig.offsetTop : 0) + s.pin.offsetTop - shots.clientHeight * 0.38); s.pin.classList.add('hot'); s.li.classList.add('hot'); });
    });
    /* the release dial: a needle that follows the score the page already sets as --s */
    var dial = $('.rc-dial'); if (dial){ dial.appendChild(svgEl('line', { 'class': 'rc-needle', x1: 60, y1: 21, x2: 60, y2: 3 }));   /* a marker riding the arc, clear of the number inside it */ }
  });

  /* ---------- 3b · zoom: click any workbook screenshot to read it full size ---------- */
  fx('zoom', function(){
    var imgs = $$('.cc-shot img'); if (!imgs.length) return;
    var d = document.createElement('dialog'), im = document.createElement('img'), x = document.createElement('button');
    if (typeof d.showModal !== 'function') return;
    d.className = 'zm'; d.setAttribute('aria-label', 'Screenshot, full size'); x.type = 'button'; x.className = 'dlg-x zm-x'; x.setAttribute('aria-label', 'Close'); x.textContent = '×';
    d.appendChild(x); d.appendChild(im); document.body.appendChild(d);
    function shut(){ if (d.open) d.close(); }
    x.addEventListener('click', shut); d.addEventListener('click', function(e){ if (e.target !== im) shut(); });
    imgs.forEach(function(i){ i.addEventListener('click', function(){ im.src = i.currentSrc || i.src; im.alt = i.alt; d.showModal(); d.scrollTop = 0; d.scrollLeft = 0; S.track('cc_zoom'); }); });
  });

  /* ---------- 3c · nudges: the things you can play with say so, until you have ---------- */
  fx('nudge', function(){
    function hint(text){ var p = document.createElement('p'); p.className = 'nudge'; p.innerHTML = '<i aria-hidden="true"></i>'; p.appendChild(document.createTextNode(text)); return p; }
    var rc = $('.rc'), moves = rc && $('.rc-moves', rc);
    if (moves){ var h = hint('Try it: flip a switch and watch the score move'); moves.parentNode.insertBefore(h, moves); rc.addEventListener('change', function(){ rc.classList.add('used'); h.classList.add('done'); }); }
    var map = $('.rt-map'), rt = $('.rt');
    if (map && rt){ var h2 = hint(window.matchMedia && window.matchMedia('(max-width: 900px)').matches ? 'Four roles: swipe the cards' : 'Four roles: pick a camp, or keep scrolling'); h2.classList.add('nudge-rt'); map.insertBefore(h2, map.firstChild); }
  });

  /* ---------- 3d · tools: every tool keeps its full story, and leads with its result in large type ---------- */
  fx('toolstat', function(){
    var STAT = [['1 click', 'for a complete bug report, where the team retyped up to forty a day'], ['18 min to under 1', 'to create a test order, with about $30 saved on each'], ['~4 hours', 'of QA time back every week, and no more after-hours escalations'], ['Record once', 'and get pytest and Appium 2 scripts in the Page Object pattern'], ['100,000', 'redundant calls a day found and fixed, along with two runaway services']];
    $$('#built .tool').forEach(function(t, i){
      var h = $('h3', t), tag = $('.tool-tag', t), at = tag || h; if (!at || !STAT[i]) return;
      var st = document.createElement('p'); st.className = 'tool-stat'; st.innerHTML = '<b></b><span></span>'; st.firstChild.textContent = STAT[i][0]; st.lastChild.textContent = STAT[i][1];
      at.parentNode.insertBefore(st, at.nextSibling);
    });
  });

  /* ---------- 3f · story: a result's story opens in one panel under the ridge, so cards never grow over each other ---------- */
  fx('story', function(){
    var climb = $('#proof .climb'), mks = $$('#proof .mk'); if (!climb || !mks.length || !('MutationObserver' in window)) return;
    if (!(window.matchMedia && window.matchMedia('(min-width: 901px)').matches)){ root.classList.remove('fx-story'); return; }
    var box = document.createElement('div'), idle = 'Hover or tap a result for the story behind it.'; box.className = 'mk-story'; box.setAttribute('aria-live', 'polite');
    box.innerHTML = '<p class="mk-story-idle"></p>'; box.firstChild.textContent = idle; climb.parentNode.insertBefore(box, climb.nextSibling);
    var cur = null;
    function show(m){
      if (m === cur) return; cur = m;
      var n = $('.mk-n', m), t = $('.mk-t', m), d = $('.mk-d', m), c = $('.mk-c', m);
      box.innerHTML = '<b class="mk-story-n"></b><div><p class="mk-story-t"></p><p class="mk-story-d"></p></div>';
      box.children[0].textContent = (n && (n.getAttribute('aria-label') || n.textContent)) || ''; $('.mk-story-t', box).textContent = (t ? t.textContent : '') + (c ? ' · ' + c.textContent : '');
      if (d) $('.mk-story-d', box).innerHTML = d.innerHTML;
      box.classList.remove('in'); void box.offsetWidth; box.classList.add('in');
    }
    var mo = new MutationObserver(function(rs){ rs.forEach(function(r){ if (r.target.classList.contains('on')) show(r.target); }); });
    mks.forEach(function(m){ mo.observe(m, { attributes: true, attributeFilter: ['class'] }); m.addEventListener('focus', function(){ show(m); }); });
  });

  /* ---------- 3g · views: the eight workbook views are named up front, with a Next button on every one ---------- */
  fx('ccnav', function(){
    var tour = document.getElementById('cc-tour'); if (!tour) return;
    var tabs = $$('[role="tab"]', tour), panels = $$('[role="tabpanel"]', tour), win = $('.cc-win', tour); if (tabs.length < 2 || !win) return;
    var rail = document.createElement('div'); rail.className = 'cc-top'; rail.setAttribute('role', 'group'); rail.setAttribute('aria-label', 'The eight views');
    var pills = tabs.map(function(t, i){ var b = document.createElement('button'); b.type = 'button'; b.innerHTML = '<small></small><span></span>'; b.firstChild.textContent = i + 1; b.lastChild.textContent = t.textContent.trim(); b.addEventListener('click', function(){ t.click(); }); rail.appendChild(b); return b; });
    win.parentNode.insertBefore(rail, win);
    panels.forEach(function(p, i){
      var pane = $('.cc-pane', p) || p, j = (i + 1) % tabs.length, b = document.createElement('button'); b.type = 'button'; b.className = 'cc-next';
      b.innerHTML = '<small></small><span></span>'; b.firstChild.textContent = 'View ' + (i + 1) + ' of ' + tabs.length + ' · next'; b.lastChild.textContent = tabs[j].textContent.trim() + ' →';
      b.addEventListener('click', function(){ tabs[j].click(); }); pane.appendChild(b);
    });
    function sync(){ tabs.forEach(function(t, i){ pills[i].setAttribute('aria-pressed', t.getAttribute('aria-selected') === 'true' ? 'true' : 'false'); }); }
    if ('MutationObserver' in window) tabs.forEach(function(t){ new MutationObserver(sync).observe(t, { attributes: true, attributeFilter: ['aria-selected'] }); });
    sync();
  });

  /* ---------- 3h · lead: the long grids in How I lead answer the reader. Tiles open on hover or tap, stories take turns. ---------- */
  fx('lead', function(){
    /* the tiles hold still: titles in a grid, and the one you point at reads out in a panel that never moves them */
    var mg = $('#leadership .mg');
    if (mg){
      var tiles = $$(':scope > div', mg).filter(function(t){ return $('dt', t) && $('dd', t); }), panel = document.createElement('div'), pk = document.createElement('p'), pd = document.createElement('div'), lock = -1;
      panel.className = 'mg-panel'; panel.setAttribute('aria-live', 'polite'); pk.className = 'mg-pk'; pd.className = 'mg-pd'; panel.appendChild(pk); panel.appendChild(pd);
      mg.classList.add('mg-x'); mg.parentNode.insertBefore(panel, mg.nextSibling);
      function pick(i){ tiles.forEach(function(t, k){ t.classList.toggle('on', k === i); t.setAttribute('aria-pressed', k === i ? 'true' : 'false'); }); pk.textContent = $('dt', tiles[i]).textContent; pd.innerHTML = $('dd', tiles[i]).innerHTML; pd.classList.remove('in'); void pd.offsetWidth; pd.classList.add('in'); }
      tiles.forEach(function(t, i){
        t.tabIndex = 0; t.setAttribute('role', 'button');
        t.addEventListener('pointerenter', function(e){ if (e.pointerType === 'mouse') pick(i); });
        t.addEventListener('focus', function(){ pick(i); });
        t.addEventListener('click', function(){ lock = i; pick(i); if (S.sfx) S.sfx('tap'); });
        t.addEventListener('keydown', function(e){ if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); pick(i); } });
      });
      if (tiles.length){ pick(0); var mh = 0; tiles.forEach(function(t, k){ pd.innerHTML = $('dd', t).innerHTML; mh = Math.max(mh, panel.offsetHeight); }); panel.style.minHeight = mh + 'px'; pick(0); }
    }
    /* the first 90 days: the day count runs up and the bar fills as the cards arrive */
    var nd = $('#leadership .nd');
    if (nd){ S.onView(nd, function(){ nd.classList.add('go'); $$('.nd-day', nd).forEach(function(d, i){ setTimeout(function(){ if (window.__count) window.__count(d, 1100); }, 250 + i * 320); }); }, 0.2); }
    var st = $('#leadership .ld-stories'), stories = st ? $$(':scope > .ld-story', st) : [];
    if (stories.length > 1 && stories.every(function(x){ return $('h3, h4', x); })){
      var rail = document.createElement('div'), tabs = [], cur = 0, timer = 0, auto = !reduce, near = false; rail.className = 'ld-rail'; rail.setAttribute('role', 'tablist');
      function show(i, user){
        cur = i; stories.forEach(function(x, k){ x.classList.toggle('on', k === i); }); tabs.forEach(function(b, k){ b.setAttribute('aria-selected', k === i ? 'true' : 'false'); b.classList.remove('run'); });
        try { window.dispatchEvent(new Event('scroll')); } catch (e){}
        clearTimeout(timer); if (auto && near){ void tabs[i].offsetWidth; tabs[i].classList.add('run'); timer = setTimeout(function(){ show((cur + 1) % stories.length); }, 8000); }
        if (user && S.sfx) S.sfx('tap');
      }
      stories.forEach(function(x, i){ var b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'tab'); b.innerHTML = '<span></span><i aria-hidden="true"></i>'; b.firstChild.textContent = $('h3, h4', x).textContent; b.addEventListener('click', function(){ auto = false; show(i, true); }); rail.appendChild(b); tabs.push(b); });
      st.parentNode.insertBefore(rail, st); st.classList.add('ld-x'); show(0);
      st.addEventListener('pointerdown', function(){ auto = false; clearTimeout(timer); tabs.forEach(function(b){ b.classList.remove('run'); }); });
      if ('IntersectionObserver' in window) new IntersectionObserver(function(es){ near = es[0].isIntersecting; if (near && auto) show(cur); else clearTimeout(timer); }, { threshold: 0.3 }).observe(st);
    }
  });

  /* ---------- 3i · skills: one group at a time, the group that matters for the lens first; "All" shows everything ---------- */
  fx('skills', function(){
    var sk = $('#skills .sk'); if (!sk) return;
    var groups = $$(':scope > div', sk).filter(function(g){ return $('h3', g); }); if (groups.length < 3) return;
    var rail = document.createElement('div'), tabs = [], all = document.createElement('button'); rail.className = 'sk-rail'; rail.setAttribute('role', 'tablist'); rail.setAttribute('aria-label', 'Skill groups');
    function show(i){ sk.classList.toggle('sk-all', i < 0); groups.forEach(function(g, k){ g.classList.toggle('on', k === i); }); tabs.forEach(function(b, k){ b.setAttribute('aria-selected', k === i ? 'true' : 'false'); }); all.setAttribute('aria-selected', i < 0 ? 'true' : 'false'); try { window.dispatchEvent(new Event('scroll')); } catch (e){}
      if (i > -1) $$('.chip', groups[i]).forEach(function(c, n){ c.style.setProperty('--ci', n); }); }
    groups.forEach(function(g, i){ var b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'tab'); b.innerHTML = '<span></span><small></small>'; b.firstChild.textContent = $('h3', g).textContent; b.lastChild.textContent = $$('.chip', g).length; b.addEventListener('click', function(){ show(i); if (S.sfx) S.sfx('tap'); }); rail.appendChild(b); tabs.push(b); });
    all.type = 'button'; all.setAttribute('role', 'tab'); all.className = 'sk-allb'; all.innerHTML = '<span>All skills</span><small></small>'; all.lastChild.textContent = $$('.chip', sk).length; all.addEventListener('click', function(){ show(-1); }); rail.appendChild(all);
    sk.parentNode.insertBefore(rail, sk); sk.classList.add('sk-x');
    function first(){ var best = 0, bo = Infinity; groups.forEach(function(g, k){ var o = g.style.order === '' ? k : parseFloat(g.style.order); if (o < bo){ bo = o; best = k; } }); tabs.forEach(function(b, k){ b.style.order = groups[k].style.order; }); show(best); }
    first(); setTimeout(first, 600);
    if ('MutationObserver' in window) new MutationObserver(function(){ setTimeout(first, 30); }).observe(root, { attributes: true, attributeFilter: ['data-lens'] });
  });

  /* ---------- 3j · small motion: before/after tiles replay on hover; the system flow passes a signal along while on screen ---------- */
  fx('replay', function(){
    $$('.ba-i').forEach(function(t){
      t.addEventListener('pointerenter', function(e){
        if (reduce || e.pointerType !== 'mouse') return; var b = $('b[data-count]', t);
        t.classList.add('replay'); void t.offsetWidth; requestAnimationFrame(function(){ t.classList.remove('replay'); if (b && window.__count) window.__count(b, 900); });
      });
    });
    var flow = $('.cc-flow');
    if (flow){ $$('li', flow).forEach(function(li, i){ li.style.setProperty('--n', i); }); if (!reduce && 'IntersectionObserver' in window) new IntersectionObserver(function(es){ flow.classList.toggle('live', es[0].isIntersecting); }, { threshold: 0.3 }).observe(flow); }
  });

  /* ---------- 3e · camps: each section shows its camp number, large and outlined (styling and drift are in v3.css) ---------- */
  fx('camps', function(){
    $$('main [data-camp]').forEach(function(s, i){
      if (!i || s.id === 'summit' || !s.classList.contains('s')) return;
      var w = $('.wrap', s); if (!w) return;
      var n = document.createElement('span'); n.className = 'camp-no'; n.setAttribute('aria-hidden', 'true'); n.textContent = (i < 10 ? '0' : '') + i; w.insertBefore(n, w.firstChild);
    });
  });

  /* ---------- 4 · case studies: a progress line as you read, the spine follows, results stamp in ---------- */
  fx('log', function(){
    $$('dialog.dlg').forEach(function(d){
      if (d.classList.contains('dlg-letter')) return;
      var bar = document.createElement('div'), fill = document.createElement('i'); bar.className = 'cs-prog'; bar.setAttribute('aria-hidden', 'true'); bar.appendChild(fill); d.insertBefore(bar, d.firstChild);
      var raf = 0;
      function upd(){ var max = d.scrollHeight - d.clientHeight, p = max > 0 ? clamp(d.scrollTop / max, 0, 1) : 0; fill.style.setProperty('--p', p.toFixed(3)); d.setAttribute('data-stage', p < 0.3 ? '1' : p < 0.72 ? '2' : '3');
        if (p > 0.92) $$('.cs-stat2.sw', d).forEach(function(s){ s.classList.remove('sw'); }); }   /* nothing stays hidden once you reach the end */
      d.addEventListener('scroll', function(){ cancelAnimationFrame(raf); raf = requestAnimationFrame(upd); }, { passive: true });
      if (!reduce && 'IntersectionObserver' in window){
        var io = new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.isIntersecting){ io.unobserve(e.target); e.target.classList.remove('sw'); e.target.classList.add('stamp'); } }); }, { root: d, threshold: 0.25 });
        $$('.cs-stat2', d).forEach(function(s, i){ s.style.animationDelay = (i % 5) * 70 + 'ms'; s.classList.add('sw'); io.observe(s); });
      }
      upd();
    });
    /* all eight as one read: previous and next at the top of every case, arrow keys, and a rail of the steps */
    var cases = $$('dialog.dlg').filter(function(d){ return /^case-/.test(d.id); });
    cases.forEach(function(d, i){
      var inn = $('.dlg-in', d), title = $('.cs-title', d); if (!inn || !title) return;
      var prev = cases[(i - 1 + cases.length) % cases.length], next = cases[(i + 1) % cases.length], nav = document.createElement('div'), dots = '';
      cases.forEach(function(c, k){ dots += '<button type="button" class="cs-dot' + (k === i ? ' on' : '') + '" data-open="' + c.id + '" aria-label="Case ' + (k + 1) + '"' + (k === i ? ' aria-current="true" disabled' : '') + '></button>'; });
      nav.className = 'cs-nav'; nav.innerHTML = '<button type="button" class="cs-pn" data-open="' + prev.id + '" aria-label="Previous case study">‹</button><span class="cs-at">Case ' + (i + 1) + ' of ' + cases.length + '</span><span class="cs-dots">' + dots + '</span><button type="button" class="cs-pn" data-open="' + next.id + '" aria-label="Next case study">›</button>';
      var kick = $('.cs-kick', d); inn.insertBefore(nav, kick || inn.firstChild.nextSibling);
      d.addEventListener('keydown', function(e){ if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return; var b = e.key === 'ArrowRight' ? nav.lastChild : e.key === 'ArrowLeft' ? nav.firstChild : null; if (b){ e.preventDefault(); b.click(); } });
      var steps = $$('.cs-step', d); if (steps.length < 2 || !('IntersectionObserver' in window)) return;
      var rail = document.createElement('ol'); rail.className = 'cs-rail'; rail.setAttribute('aria-label', 'Steps in this case');
      steps.forEach(function(st, k){ var h = $('h3', st), li = document.createElement('li'), b = document.createElement('button'); b.type = 'button'; b.textContent = h ? h.textContent : 'Step ' + (k + 1); b.addEventListener('click', function(){ st.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); }); li.appendChild(b); rail.appendChild(li); });
      d.appendChild(rail); d.classList.add('cs-dim'); steps[0].classList.add('seen');
      var io = new IntersectionObserver(function(es){ es.forEach(function(e){ var k = steps.indexOf(e.target); if (e.isIntersecting){ e.target.classList.add('seen'); $$('li', rail).forEach(function(li, n){ li.classList.toggle('on', n === k); }); } }); }, { root: d, rootMargin: '-25% 0px -45% 0px', threshold: 0 });
      steps.forEach(function(st){ io.observe(st); });
      d.addEventListener('scroll', function(){ if (d.scrollTop + d.clientHeight > d.scrollHeight - 80) steps.forEach(function(st){ st.classList.add('seen'); }); }, { passive: true });
    });
  });

  /* ---------- 5 · the route: a climber walks the line to the camp you pick ---------- */
  fx('climber', function(){
    var svg = $('.rt-svg'), prog = $('.rt-prog'); if (!svg || !prog || !('MutationObserver' in window)) return;
    var halo = svgEl('circle', { 'class': 'rt-halo', r: 9 }), dot = svgEl('circle', { 'class': 'rt-climber', r: 6 }), cur = -1, raf = 0;
    halo.style.display = dot.style.display = 'none'; svg.appendChild(halo); svg.appendChild(dot);
    function place(L){ var pt; try { pt = prog.getPointAtLength(L); } catch (e){ return; } [halo, dot].forEach(function(c){ c.setAttribute('cx', pt.x.toFixed(1)); c.setAttribute('cy', pt.y.toFixed(1)); c.style.display = ''; }); }
    function target(){ var v = parseFloat(prog.style.getPropertyValue('--len')); return isNaN(v) ? -1 : v; }
    function go(){
      var to = target(); if (to < 0) return;
      cancelAnimationFrame(raf);
      if (cur < 0 || reduce){ cur = to; place(to); return; }
      var from = cur, t0 = 0;
      (function step(t){ if (!t0) t0 = t; var p = clamp((t - t0) / 900, 0, 1), e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; cur = from + (to - from) * e; place(cur); if (p < 1) raf = requestAnimationFrame(step); })(performance.now());
    }
    new MutationObserver(go).observe(prog, { attributes: true, attributeFilter: ['style', 'd'] });
    go();
  });

  /* ---------- 6 · altimeter: the page as a mountain profile, with you on it ---------- */
  fx('profile', function(){
    var box = $('.alt-read'), sm = document.getElementById('summit'); if (!box) return;
    var W = 104, H = 44, svg = svgEl('svg', { 'class': 'alt-prof', viewBox: '0 0 ' + W + ' ' + H, 'aria-hidden': 'true' }),
      fill = svgEl('path', { 'class': 'ap-fill' }), line = svgEl('path', { 'class': 'ap-line' }), done = svgEl('path', { 'class': 'ap-done' }), camps = svgEl('g', {}), you = svgEl('circle', { 'class': 'ap-you', r: 3 }), pts = [], lastH = 0;
    [fill, line, camps, done, you].forEach(function(e){ svg.appendChild(e); }); box.insertBefore(svg, box.firstChild);
    var maxY = 1;
    function build(){
      var max = maxY = docMax(), secs = $$('main [data-camp]'), top = sm ? clamp((window.pageYOffset + sm.getBoundingClientRect().top) / max, 0.05, 0.98) : 0.8;
      lastH = document.documentElement.scrollHeight; pts = [[0, H - 3]];
      secs.forEach(function(s, i){
        var u = clamp((window.pageYOffset + s.getBoundingClientRect().top) / max, 0, 1); if (u <= 0.005) return;
        var y = u <= top ? (H - 3) - (H - 9) * (u / top) : 6 + (H - 22) * ((u - top) / (1 - top));
        pts.push([u * W, s === sm ? 5 : y + (i % 2 ? 2.2 : -2.2)]);
      });
      pts.push([W, H - 12]); pts.sort(function(a, b){ return a[0] - b[0]; });
      var d = pts.map(function(p, i){ return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' ');
      line.setAttribute('d', d); fill.setAttribute('d', d + ' L' + W + ' ' + H + ' L0 ' + H + ' Z');
      while (camps.firstChild) camps.removeChild(camps.firstChild);
      pts.slice(1, -1).forEach(function(p){ camps.appendChild(svgEl('circle', { 'class': 'ap-camp', cx: p[0].toFixed(1), cy: p[1].toFixed(1), r: 1.2 })); });
    }
    function at(x){ for (var i = 1; i < pts.length; i++) if (x <= pts[i][0]){ var a = pts[i - 1], b = pts[i], t = (x - a[0]) / Math.max(0.001, b[0] - a[0]); return [x, a[1] + (b[1] - a[1]) * t, i]; } var l = pts[pts.length - 1]; return [l[0], l[1], pts.length - 1]; }
    function upd(){
      var p = at(clamp(window.pageYOffset / maxY, 0, 1) * W);
      you.setAttribute('cx', p[0].toFixed(1)); you.setAttribute('cy', p[1].toFixed(1));
      done.setAttribute('d', pts.slice(0, p[2]).map(function(q, i){ return (i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1); }).join(' ') + ' L' + p[0].toFixed(1) + ' ' + p[1].toFixed(1));
    }
    build(); upd(); S.onScroll(upd); window.addEventListener('resize', function(){ build(); upd(); });
    setInterval(function(){ if (Math.abs(document.documentElement.scrollHeight - lastH) > 40){ build(); upd(); } }, 3000);
  });

  /* ---------- 7 · results: each marker plants a small flag on the ridge as it arrives ---------- */
  fx('flags', function(){
    $$('#proof .mk').forEach(function(m){ var f = document.createElement('i'); f.className = 'mk-flag'; f.setAttribute('aria-hidden', 'true'); m.appendChild(f); });
  });

  /* ---------- 8 · contour lines on the panels: styling only (v3fx.css), switched by the class ---------- */
  fx('contour', function(){});

  /* ---------- 9 · summit: a burst of snow, and how far you climbed to get here ---------- */
  fx('summit', function(){
    var sm = document.getElementById('summit'), rd = sm && $('.sm-made', sm); if (!rd || !('MutationObserver' in window)) return;
    var t0 = Date.now(), fired = false, stat = document.createElement('p'); stat.className = 'sm-stat'; rd.parentNode.insertBefore(stat, rd.nextSibling);
    function snow(){
      if (reduce) return;
      var cv = document.createElement('canvas'), r = sm.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1), w = r.width, h = r.height, ctx, parts = [], i, start = 0;
      cv.className = 'sm-snow'; cv.setAttribute('aria-hidden', 'true'); cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); sm.appendChild(cv);
      ctx = cv.getContext('2d'); if (!ctx){ sm.removeChild(cv); return; } ctx.scale(dpr, dpr);
      for (i = 0; i < 110; i++){ var a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2, v = 2 + Math.random() * 7; parts.push({ x: w / 2 + (Math.random() - 0.5) * 60, y: h * 0.52, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: 1 + Math.random() * 2.4, o: 0.5 + Math.random() * 0.5 }); }
      var morning = root.getAttribute('data-time') === 'morning';
      (function frame(t){
        if (!start) start = t; var k = (t - start) / 2800; ctx.clearRect(0, 0, w, h);
        if (k >= 1){ if (cv.parentNode) cv.parentNode.removeChild(cv); return; }
        parts.forEach(function(p){ p.vy += 0.09; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; ctx.globalAlpha = p.o * (1 - k); ctx.fillStyle = morning ? '#8FA6C8' : '#FFFFFF'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill(); });
        requestAnimationFrame(frame);
      })(performance.now());
    }
    function made(){
      if (fired || !sm.classList.contains('made')) return; fired = true;
      var s = Math.max(1, Math.round((Date.now() - t0) / 1000)), m = Math.floor(s / 60), alt = ($('.sm-alt', rd) || {}).textContent || '';
      stat.textContent = (alt ? alt + ' climbed' : 'Climbed') + ' in ' + (m ? m + ' min ' : '') + (s % 60) + ' s.';
      requestAnimationFrame(function(){ stat.classList.add('in'); }); snow();
    }
    new MutationObserver(made).observe(sm, { attributes: true, attributeFilter: ['class'] }); made();
  });

  /* ---------- 10 · phone: Off the clock and the long grids in How I lead become decks you swipe ---------- */
  fx('decks', function(){
    if (!(window.matchMedia && window.matchMedia('(max-width: 700px)').matches)) return;
    $$('main .oc, main .ld-stories, main .nd, main .mg').forEach(function(el){
      if (el.children.length < 2) return;
      var h = document.createElement('small'); h.className = 'deck-hint'; h.setAttribute('aria-hidden', 'true'); h.textContent = 'Swipe · ' + el.children.length + ' cards';
      el.parentNode.insertBefore(h, el.nextSibling);
    });
  });
})();
