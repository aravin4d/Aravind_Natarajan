/* Wave 2 motion: small physical answers to whatever the reader does, section headings that each
   arrive in their own way, previews on the altimeter, and margin notes that change as the air thins.
   Everything here respects reduced motion, and none of it moves the layout. */
(function(){
  'use strict';
  var S = window.__site; if (!S) return;
  var root = document.documentElement, reduce = S.reduce, fine = S.fine, $ = S.$, $$ = S.$$, safe = S.safe, NS = 'http://www.w3.org/2000/svg';
  function clamp(v, a, b){ return v < a ? a : v > b ? b : v; }
  if (!reduce) root.classList.add('mx');

  /* ---------- a tiny spring engine: translate and scale, on their own properties ----------
     Using `translate` and `scale` keeps these out of the way of every `transform` the page already animates. */
  var active = [], raf = 0, lastT = 0;
  function sp(el){ return el.__sp || (el.__sp = { el: el, x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0, sx: 1, sy: 1, vsx: 0, vsy: 0, tsx: 1, tsy: 1, k: 190, c: 14, ks: 420, cs: 13, on: false }); }
  function wake(s){ if (!s.on){ s.on = true; active.push(s); } if (!raf) raf = requestAnimationFrame(tick); }
  function tick(now){
    raf = 0; var dt = Math.min(0.032, Math.max(0.004, (now - (lastT || now)) / 1000 || 0.016)); lastT = now;
    for (var i = active.length - 1; i >= 0; i--){ var s = active[i];
      s.vx += (s.k * (s.tx - s.x) - s.c * s.vx) * dt; s.vy += (s.k * (s.ty - s.y) - s.c * s.vy) * dt; s.x += s.vx * dt; s.y += s.vy * dt;
      s.vsx += (s.ks * (s.tsx - s.sx) - s.cs * s.vsx) * dt; s.vsy += (s.ks * (s.tsy - s.sy) - s.cs * s.vsy) * dt; s.sx += s.vsx * dt; s.sy += s.vsy * dt;
      var rest = Math.abs(s.tx - s.x) < 0.04 && Math.abs(s.ty - s.y) < 0.04 && Math.abs(s.vx) + Math.abs(s.vy) < 0.08 && Math.abs(s.tsx - s.sx) < 0.0006 && Math.abs(s.tsy - s.sy) < 0.0006 && Math.abs(s.vsx) + Math.abs(s.vsy) < 0.003;
      if (rest){ s.x = s.tx; s.y = s.ty; s.sx = s.tsx; s.sy = s.tsy; s.vx = s.vy = s.vsx = s.vsy = 0; }
      s.el.style.translate = (Math.abs(s.x) < 0.02 && Math.abs(s.y) < 0.02) ? '' : s.x.toFixed(2) + 'px ' + s.y.toFixed(2) + 'px';
      s.el.style.scale = (Math.abs(s.sx - 1) < 0.0004 && Math.abs(s.sy - 1) < 0.0004) ? '' : s.sx.toFixed(4) + ' ' + s.sy.toFixed(4);
      if (rest){ s.on = false; active.splice(i, 1); }
    }
    if (active.length) raf = requestAnimationFrame(tick); else lastT = 0;
  }
  window.__spring = { get: sp, wake: wake };

  /* ---------- W2-01: magnetic pills and buttons, press-squish, jelly on enter, a spotlight on cards ---------- */
  var MAG = '.btn, .btn-cv, .tod button, .snd, .dlg-x, .cs-go, .chip';
  var SQ = '.btn, .btn-cv, .tod button, .snd, .reg-tin, .dlg-x, .af-card, .cs-row a, .xs-m button, .cs-next button, .env, .h-peek, .mk-card, .trail-btn, .run-btn';
  var JEL = '.mk-card, .xs-m, .oc-card, .ld-block, .ld-story, .cs-card, .cs-stat2, .future, .xp-end, .af-card, .rh-card';
  var LIT = '.mk-card, .xs-m, .oc-card, .ld-block, .cs-card, .cs-stat2, .future, .xp-end, .rh-card';
  var ptr = { x: 0, y: 0, vx: 0, vy: 0, t: 0 };
  safe(function(){
    if (reduce) return;
    var magEl = null, litEl = null;
    function release(el){ var s = sp(el); s.tx = 0; s.ty = 0; wake(s); }
    document.addEventListener('pointermove', function(e){
      var t = performance.now(), dtm = Math.max(8, t - ptr.t); ptr.vx = ptr.vx * 0.6 + (e.clientX - ptr.x) / dtm * 1000 * 0.4; ptr.vy = ptr.vy * 0.6 + (e.clientY - ptr.y) / dtm * 1000 * 0.4; ptr.x = e.clientX; ptr.y = e.clientY; ptr.t = t;
      if (e.pointerType && e.pointerType !== 'mouse') return;
      var tg = e.target && e.target.closest ? e.target : null;
      /* magnetic: the pill leans toward the cursor; gear chips on the rope are left to swing */
      var m = tg ? tg.closest(MAG) : null; if (m && m.closest('.gear, .fold-ghost')) m = null;
      if (magEl && magEl !== m){ release(magEl); magEl = null; }
      if (m){ magEl = m; var s = sp(m), r = m.getBoundingClientRect(), cx = r.left + r.width / 2 - s.x, cy = r.top + r.height / 2 - s.y, chip = m.classList.contains('chip'), k = chip ? 0.14 : 0.3, cap = chip ? 3 : 8;
        s.tx = clamp((e.clientX - cx) * k, -cap, cap); s.ty = clamp((e.clientY - cy) * k * 1.15, -cap, cap); wake(s); }
      /* spotlight: light follows the cursor across the card and along its edge */
      var c = tg ? tg.closest(LIT) : null;
      if (litEl && litEl !== c){ litEl.classList.remove('lit'); litEl = null; }
      if (c){ var cr = c.getBoundingClientRect(); c.style.setProperty('--lx', (e.clientX - cr.left).toFixed(0) + 'px'); c.style.setProperty('--ly', (e.clientY - cr.top).toFixed(0) + 'px'); if (litEl !== c){ c.classList.add('lit'); litEl = c; } }
    }, { passive: true });
    document.documentElement.addEventListener('mouseleave', function(){ if (magEl){ release(magEl); magEl = null; } if (litEl){ litEl.classList.remove('lit'); litEl = null; } });

    /* jelly: a card wobbles when the cursor walks in, squashed from the side it came in on */
    document.addEventListener('pointerover', function(e){
      if (e.pointerType && e.pointerType !== 'mouse') return;
      var c = e.target.closest ? e.target.closest(JEL) : null; if (!c || (e.relatedTarget && c.contains(e.relatedTarget))) return;
      if (c.closest('.fold-ghost')) return;
      var r = c.getBoundingClientRect(), nx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2), ny = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
      var speed = clamp(Math.sqrt(ptr.vx * ptr.vx + ptr.vy * ptr.vy) / 1400, 0.35, 1.4), amp = 0.05 * Math.min(1, 320 / Math.max(r.width, r.height)) * speed, s = sp(c);
      s.ks = 380; s.cs = 9;
      if (Math.abs(nx) > Math.abs(ny)){ s.vsx -= amp * 14; s.vsy += amp * 12; s.vx -= (nx > 0 ? 1 : -1) * amp * 90; }
      else { s.vsy -= amp * 14; s.vsx += amp * 12; s.vy -= (ny > 0 ? 1 : -1) * amp * 90; }
      wake(s);
    });

    /* press-squish: pressing flattens it, letting go bounces it back */
    document.addEventListener('pointerdown', function(e){
      var t = e.target.closest ? e.target.closest(SQ) : null; if (!t || t.disabled || t.closest('.fold-ghost')) return;
      var s = sp(t), big = t.offsetWidth > 280 || t.offsetHeight > 120; s.ks = 520; s.cs = 15;
      s.tsx = big ? 0.988 : 1.06; s.tsy = big ? 0.978 : 0.9; wake(s);
      function up(){ document.removeEventListener('pointerup', up); document.removeEventListener('pointercancel', up); s.tsx = 1; s.tsy = 1; s.ks = 360; s.cs = 10; s.vsx -= big ? 0.2 : 1.2; s.vsy += big ? 0.35 : 1.9; wake(s); }
      document.addEventListener('pointerup', up); document.addEventListener('pointercancel', up);
    });
  });

  /* ---------- W2-02: section headings arrive in their own way, and replay cleanly either way you scroll ----------
     rise: each word rises out of a mask (or drops in, coming from above) · scramble: letters decode into place
     ink: a brush stroke paints itself under the last line · slice: the two halves of a cut meet and weld
     glitch: it flickers in like a bug being found · every section marker ticks in, one character at a time */
  safe(function(){
    if (reduce) return;
    var FX = [['#letter-sec .s-h', 'ink'], ['#story .story .lead', 'rise'], ['#proof .s-h', 'rise'], ['#cases .s-h', 'ink'], ['#experience .s-h', 'slice'], ['#built .s-h', 'scramble'],
              ['#leadership .s-h', 'rise'], ['#skills .s-h', 'scramble'], ['#summit h2', 'rise'], ['#play .s-h', 'glitch'], ['#offclock .s-h', 'ink'], ['#contact .s-h', 'rise']];
    var LO = 'abcdefghijklmnopqrstuvwxyz', UP = 'ABCDEFGHJKLMNOPRSTUVWXYZ', GL = '/\\|<>_-=+*#', items = [], inkN = 0;
    function srSpan(txt){ var s = document.createElement('span'); s.className = 'sr'; s.textContent = txt; return s; }
    function split(el, chars){
      var txt = el.textContent.replace(/\s+/g, ' ').trim(), box = document.createElement('span'), words = [], cs = [];
      box.setAttribute('aria-hidden', 'true');
      txt.split(' ').forEach(function(w, i, all){
        var o = document.createElement('span');
        if (chars){ o.className = 'hs'; w.split('').forEach(function(ch){ var c = document.createElement('span'); c.className = 'hc'; c.textContent = ch; c.__ch = ch; o.appendChild(c); cs.push(c); }); }
        else { o.className = 'hw'; var inn = document.createElement('span'); inn.className = 'hw-i'; inn.textContent = w; inn.style.setProperty('--w', i); o.appendChild(inn); }
        box.appendChild(o); words.push(o); if (i < all.length - 1) box.appendChild(document.createTextNode(' '));
      });
      el.textContent = ''; el.appendChild(srSpan(txt)); el.appendChild(box);
      return { words: words, chars: cs, text: txt };
    }
    function overlay(el, cls){ var t = el.textContent.trim(), o = document.createElement('span'); o.className = 'hx ' + cls; o.setAttribute('aria-hidden', 'true'); o.textContent = t; el.appendChild(o); return o; }

    function mkRise(el){
      var W = split(el, false), t = 0; el.classList.add('fx-rise');
      return { play: function(dir){ clearTimeout(t); el.classList.remove('fx-go', 'fx-done'); el.classList.toggle('fx-dn', dir < 0); void el.offsetWidth; el.classList.add('fx-go');
                 t = setTimeout(function(){ el.classList.add('fx-done'); }, 950 + W.words.length * 55); },
               reset: function(){ clearTimeout(t); el.classList.remove('fx-go', 'fx-done'); } };
    }
    function mkScramble(el){
      var W = split(el, true), cs = W.chars, rq = 0; el.classList.add('fx-scr', 'fx-off');
      function pick(ch){ if (/[a-z]/.test(ch)) return LO[Math.random() * 26 | 0]; if (/[A-Z]/.test(ch)) return UP[Math.random() * UP.length | 0]; return ch; }
      function settle(){ el.classList.remove('fx-fix'); cs.forEach(function(c){ c.textContent = c.__ch; c.style.width = ''; c.classList.remove('hx-r', 'hx-v'); }); }
      return { play: function(dir){
                 cancelAnimationFrame(rq); settle(); el.classList.remove('fx-off');
                 cs.forEach(function(c){ c.__w = c.getBoundingClientRect().width; });
                 cs.forEach(function(c){ c.style.width = c.__w.toFixed(2) + 'px'; c.__done = 0; c.__on = 0; c.__t = 0; });
                 el.classList.add('fx-fix');
                 var t0 = performance.now(), N = cs.length, D = 560;
                 function f(now){ var t = now - t0, all = true;
                   for (var i = 0; i < N; i++){ var c = cs[i], k = dir < 0 ? N - 1 - i : i, at = 300 + k / N * D, on = at - 300;
                     if (t >= at){ if (!c.__done){ c.__done = 1; c.textContent = c.__ch; c.classList.remove('hx-r'); c.classList.add('hx-v'); } continue; }
                     all = false;
                     if (t >= on){ if (!c.__on){ c.__on = 1; c.classList.add('hx-v'); } if (now - c.__t > 50){ c.__t = now; c.textContent = pick(c.__ch); c.classList.add('hx-r'); } } }
                   if (!all) rq = requestAnimationFrame(f); else settle(); }
                 rq = requestAnimationFrame(f); },
               reset: function(){ cancelAnimationFrame(rq); settle(); el.classList.add('fx-off'); } };
    }
    function brush(w, h, id){
      var n = 30, top = [], bot = [], cl = [], mid = h * 0.52, amp = h * 0.12;
      for (var i = 0; i <= n; i++){ var t = i / n, x = 3 + t * (w - 6), y = mid - Math.sin(t * Math.PI * 0.95 + 0.25) * amp + (t > 0.86 ? (t - 0.86) * -h * 0.7 : 0);
        var th = h * 0.19 * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.06 + 0.015)), 0.5) * (1 - t * 0.38) + 0.7; top.push([x, y - th]); bot.push([x, y + th * 0.8]); cl.push([x, y]); }
      function P(a, m){ return a.map(function(p, i){ return (i || !m ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(''); }
      var shape = P(top, true) + P(bot.reverse(), false) + 'Z', end = cl[cl.length - 1];
      return '<defs><filter id="' + id + 'f" x="-4%" y="-60%" width="108%" height="220%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="' + (3 + inkN) + '"/><feDisplacementMap in="SourceGraphic" scale="2.6"/></filter>' +
        '<mask id="' + id + '" maskUnits="userSpaceOnUse" x="-4" y="-20" width="' + (w + 8) + '" height="' + (h + 40) + '"><path class="ink-m" d="' + P(cl, true) + '" pathLength="1" fill="none" stroke="#fff" stroke-width="' + (h * 0.95).toFixed(1) + '" stroke-linecap="round"/></mask></defs>' +
        '<g mask="url(#' + id + ')"><path class="ink-b" d="' + shape + '" filter="url(#' + id + 'f)"/></g>' +
        '<circle class="ink-dot" cx="' + (end[0] + h * 0.42).toFixed(1) + '" cy="' + (end[1] - h * 0.22).toFixed(1) + '" r="' + (h * 0.075 + 1.1).toFixed(1) + '"/>';
    }
    function mkInk(el){
      el.classList.add('fx-ink'); var id = 'inkM' + (inkN++), svg = document.createElementNS(NS, 'svg'); svg.setAttribute('class', 'ink-u'); svg.setAttribute('aria-hidden', 'true'); el.appendChild(svg);
      function geom(){
        svg.style.display = 'none';
        var er = el.getBoundingClientRect(), rg = document.createRange(); rg.selectNodeContents(el);
        var rs = Array.prototype.filter.call(rg.getClientRects(), function(r){ return r.width > 6 && r.height > 6; });
        svg.style.display = '';
        if (!rs.length) return;
        var lastTop = rs[rs.length - 1].top, L = Infinity, Rr = -Infinity, B = 0;
        rs.forEach(function(r){ if (Math.abs(r.top - lastTop) < r.height * 0.5){ L = Math.min(L, r.left); Rr = Math.max(Rr, r.right); B = Math.max(B, r.bottom); } });
        var fs = parseFloat(getComputedStyle(el).fontSize) || 40, w = Rr - L + fs * 0.12, hh = Math.max(14, fs * 0.34);
        svg.style.left = (L - er.left - fs * 0.05).toFixed(1) + 'px'; svg.style.top = (B - er.top - fs * 0.17).toFixed(1) + 'px';
        svg.setAttribute('width', w.toFixed(0)); svg.setAttribute('height', hh.toFixed(0)); svg.setAttribute('viewBox', '0 0 ' + w.toFixed(0) + ' ' + hh.toFixed(0));
        svg.innerHTML = brush(w, hh, id);
      }
      var rz = 0; window.addEventListener('resize', function(){ clearTimeout(rz); rz = setTimeout(geom, 200); });
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(geom);
      geom();
      return { play: function(){ el.classList.remove('fx-go'); geom(); void el.offsetWidth; el.classList.add('fx-go'); }, reset: function(){ el.classList.remove('fx-go'); } };
    }
    function mkSlice(el){
      var a = overlay(el, 'hx-a'), b = overlay(el, 'hx-b'), st = document.createElement('span'), an = [], t = 0;
      st.className = 'hx-st'; st.setAttribute('aria-hidden', 'true'); el.appendChild(st); el.classList.add('fx-slice');
      function stop(){ an.forEach(function(x){ x.cancel(); }); an = []; clearTimeout(t); }
      return { play: function(dir){
                 stop(); el.classList.remove('hx-wait'); el.classList.add('hx-on');
                 var W = el.offsetWidth, H = el.offsetHeight, ang = Math.atan2(-0.32 * H, W) * 180 / Math.PI, len = Math.sqrt(W * W + 0.1 * H * H), sd = dir < 0 ? -1 : 1;
                 st.style.width = len.toFixed(0) + 'px'; st.style.top = (H * 0.68).toFixed(0) + 'px';
                 an.push(a.animate([{ transform: 'translate(' + (-26 * sd) + 'px,-12px) rotate(-1.5deg)', opacity: 0 }, { opacity: 1, offset: 0.3 }, { transform: 'translate(' + (2 * sd) + 'px,1px)', offset: 0.7 }, { transform: 'none', opacity: 1 }], { duration: 640, easing: 'cubic-bezier(.2,.8,.3,1)', fill: 'both' }));
                 an.push(b.animate([{ transform: 'translate(' + (26 * sd) + 'px,12px) rotate(1.5deg)', opacity: 0 }, { opacity: 1, offset: 0.3 }, { transform: 'translate(' + (-2 * sd) + 'px,-1px)', offset: 0.7 }, { transform: 'none', opacity: 1 }], { duration: 640, easing: 'cubic-bezier(.2,.8,.3,1)', fill: 'both' }));
                 an.push(st.animate([{ transform: 'rotate(' + ang.toFixed(2) + 'deg) scaleX(0)', opacity: 0 }, { transform: 'rotate(' + ang.toFixed(2) + 'deg) scaleX(0)', opacity: 1, offset: 0.55 }, { transform: 'rotate(' + ang.toFixed(2) + 'deg) scaleX(1)', opacity: 1, offset: 0.78 }, { transform: 'rotate(' + ang.toFixed(2) + 'deg) scaleX(1)', opacity: 0 }], { duration: 820, easing: 'ease-out', fill: 'both' }));
                 t = setTimeout(function(){ el.classList.remove('hx-on'); }, 700); },
               reset: function(){ stop(); el.classList.remove('hx-on'); el.classList.add('hx-wait'); } };
    }
    function mkGlitch(el){
      var a = overlay(el, 'hg-a'), b = overlay(el, 'hg-b'), timer = 0; el.classList.add('fx-glitch');
      function clean(){ clearInterval(timer); el.classList.remove('hg-on'); el.style.removeProperty('--gj'); [a, b].forEach(function(x){ x.style.clipPath = ''; x.style.transform = ''; }); }
      return { play: function(){ clean(); el.classList.remove('hx-wait'); el.classList.add('hg-on'); var n = 0;
                 timer = setInterval(function(){ n++;
                   [a, b].forEach(function(x){ var tp = Math.random() * 70, hh = 8 + Math.random() * 28; x.style.clipPath = 'inset(' + tp.toFixed(0) + '% -4% ' + Math.max(0, 100 - tp - hh).toFixed(0) + '% -4%)'; x.style.transform = 'translate(' + ((Math.random() - 0.5) * 16).toFixed(1) + 'px,' + ((Math.random() - 0.5) * 3).toFixed(1) + 'px)'; });
                   el.style.setProperty('--gj', ((Math.random() - 0.5) * 5).toFixed(1) + 'px'); if (n > 10) clean(); }, 46); },
               reset: function(){ clean(); el.classList.add('hx-wait'); } };
    }
    function mkTick(el){
      var txt = el.textContent, box = document.createElement('span'), cs = [], tm = [];
      box.setAttribute('aria-hidden', 'true');
      txt.split('').forEach(function(ch){ var c = document.createElement('span'); c.className = 'tk'; c.textContent = ch; c.__ch = ch; box.appendChild(c); cs.push(c); });
      el.textContent = ''; el.appendChild(srSpan(txt)); el.appendChild(box); el.classList.add('fx-tick', 'fx-off');
      function clear(){ tm.forEach(clearTimeout); tm = []; cs.forEach(function(c){ c.classList.remove('on', 'cur', 'blink'); c.textContent = c.__ch; }); }
      return { play: function(){ clear(); el.classList.remove('fx-off');
                 cs.forEach(function(c, i){ var t = 40 + i * 24;
                   tm.push(setTimeout(function(){ if (c.__ch !== ' ') c.textContent = GL[Math.random() * GL.length | 0]; c.classList.add('on', 'cur'); if (i) cs[i - 1].classList.remove('cur'); }, t));
                   tm.push(setTimeout(function(){ c.textContent = c.__ch; }, t + 48)); });
                 var end = 40 + cs.length * 24 + 40, last = cs[cs.length - 1];
                 tm.push(setTimeout(function(){ last.classList.add('blink'); }, end)); tm.push(setTimeout(function(){ last.classList.remove('cur', 'blink'); }, end + 1000)); },
               reset: function(){ clear(); el.classList.add('fx-off'); } };
    }
    var MK = { rise: mkRise, scramble: mkScramble, ink: mkInk, slice: mkSlice, glitch: mkGlitch };
    FX.forEach(function(f){ var el = $(f[0]); if (!el) return; var m = MK[f[1]](el); m.el = el; m.on = false; m.reset(); items.push(m); });
    $$('main .s-k, #summit .alt-big').forEach(function(el){ var m = mkTick(el); m.el = el; m.on = false; items.push(m); });
    function check(){ var vh = window.innerHeight;
      items.forEach(function(it){ var r = it.el.getBoundingClientRect();
        if (r.bottom < -40 || r.top > vh + 40){ if (it.on){ it.on = false; it.reset(); } return; }
        if (!it.on && r.top < vh * 0.9 && r.bottom > vh * 0.06){ it.on = true; it.play(r.top > vh * 0.42 ? 1 : -1); } }); }
    S.onScroll(check); window.addEventListener('resize', check); setTimeout(check, 80);
    window.__headFX = { check: check, items: items };
  });

  /* ---------- where on the climb a scroll position sits ---------- */
  function zoneOf(pr){ var sp0 = S.summitP ? S.summitP() : 0.62; if (Math.abs(pr - sp0) < 0.035) return 'Summit';
    if (pr < sp0){ var f = pr / sp0; return f < 0.3 ? 'Base camp' : f < 0.88 ? 'Thin air' : 'Nearly there'; }
    return (pr - sp0) / (1 - sp0) < 0.78 ? 'The way down' : 'Camp'; }
  function sectionY(el){ var top = el.getBoundingClientRect().top + window.pageYOffset, max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight), vh = window.innerHeight;
    var y = el.id === 'top' ? 0 : el.id === 'summit' ? top + el.offsetHeight / 2 - vh / 2 : top - vh * 0.3; y = clamp(y, 0, max); return { y: y, pr: y / max }; }
  window.__zoneOf = zoneOf;

  /* ---------- W2-04: altimeter previews, a real view of the climb at each stop ---------- */
  safe(function(){
    var nav = $('.alt'); if (!nav || !fine) return;
    var lis = $$('.alt li'), links = $$('.alt li a'); if (!links.length) return;
    var IC = {
      top: 'M3 20L12 5l9 15zM12 5v15M9 20l3-6 3 6',
      'letter-sec': 'M3 6.5h18v11H3zM3 7l9 6.5L21 7',
      story: 'M8.2 13.6c-1.7 0-2.6-2-2.6-4.3S6.7 4.5 8.2 4.5s2.4 2.7 2.4 4.9-.7 4.2-2.4 4.2zM6.8 16.3h2.9M15.8 19.5c-1.7 0-2.6-2-2.6-4.3s1.1-4.8 2.6-4.8 2.4 2.7 2.4 4.9-.7 4.2-2.4 4.2z',
      proof: 'M3 19l5-6 4 3 6-9 3 3M3 21h18',
      cases: 'M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM15.4 15.4L21 21',
      experience: 'M4.5 19.5L17 7M15 5l4 4M5.8 16.2l2 2M3 21l2.5-2.5',
      built: 'M14.7 6.3a4 4 0 0 0 5 5L11 20a2.1 2.1 0 0 1-3-3l8.7-8.7a4 4 0 0 0-2-2z',
      leadership: 'M8 10.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM16 10.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3 20c0-3 2.4-5 5-5s5 2 5 5M11 20c0-3 2.4-5 5-5s5 2 5 5M8 15h8',
      summit: 'M6 21V3.5M6.6 4H18l-2.6 4 2.6 4H6.6',
      play: 'M9 9.5a3 3 0 0 1 6 0v5a3 3 0 0 1-6 0zM12 9.5v8M5 10.5l4 1.8M19 10.5l-4 1.8M5 17l4-1.5M19 17l-4-1.5M10 6.5L8.6 4.5M14 6.5l1.4-2',
      offclock: 'M12 8.5c-4 0-6 3-6 6.3S8.4 21 12 21s6-2.9 6-6.2-2-6.3-6-6.3zM12 8.5c0-2.2 1-3.8 3-5M12 8.5C10.6 6.8 8.5 6.4 7 7',
      contact: 'M12 3.5c2 2.8 4 4.4 4 7.2a4 4 0 0 1-8 0c0-2.8 2-4.4 4-7.2zM4.5 21l15-3.8M4.5 17.2l15 3.8'
    };
    var pv = document.createElement('div'); pv.className = 'alt-pv'; pv.setAttribute('aria-hidden', 'true');
    pv.innerHTML = '<div class="pv-card"><div class="pv-img"><canvas></canvas><canvas></canvas><span class="pv-t"><b></b><i></i></span></div><span class="pv-g"></span></div>';
    document.body.appendChild(pv);
    var cvs = $$('canvas', pv), glyph = $('.pv-g', pv), altB = $('.pv-t b', pv), zoneI = $('.pv-t i', pv), front = 0, curI = -1, hideT = 0, shown = false, PW = 196, PH = 118, DPR = Math.min(2, window.devicePixelRatio || 1);
    cvs.forEach(function(c){ c.width = Math.round(PW * DPR); c.height = Math.round(PH * DPR); });
    function paint(ctx, w, h, pr){
      var cs = getComputedStyle(root), g = ctx.createLinearGradient(0, 0, 0, h), sp0 = S.summitP ? S.summitP() : 0.6, f = pr <= sp0 ? pr / sp0 : 1 - (pr - sp0) / (1 - sp0) * 0.55;
      g.addColorStop(0, cs.getPropertyValue('--p1').trim() || '#223'); g.addColorStop(0.62, cs.getPropertyValue('--p2').trim() || '#556'); g.addColorStop(1, cs.getPropertyValue('--p3').trim() || '#889');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      ['--pfar', '--pmid', '--pnear'].forEach(function(v, n){ ctx.fillStyle = cs.getPropertyValue(v).trim() || '#333'; ctx.beginPath(); var base = h * (0.46 + n * 0.14 + f * 0.2 * (n + 1) / 3); ctx.moveTo(0, h);
        for (var x = 0; x <= w + 1; x += w / 28){ ctx.lineTo(x, base - Math.abs(Math.sin(x / w * (5 + n * 2.3) + n * 1.7 + pr * 9)) * h * (0.17 - n * 0.035)); } ctx.lineTo(w, h); ctx.closePath(); ctx.fill(); });
    }
    function draw(i){
      var id = links[i].getAttribute('href').slice(1), el = document.getElementById(id); if (!el) return;
      var sy = sectionY(el), c = cvs[1 - front], ctx = c.getContext('2d'), snap = null;
      try { snap = window.__world && window.__world.snapshot ? window.__world.snapshot(sy.y, c.width, c.height) : null; } catch (e){ snap = null; }
      ctx.clearRect(0, 0, c.width, c.height);
      if (snap) ctx.drawImage(snap, 0, 0, c.width, c.height); else paint(ctx, c.width, c.height, sy.pr);
      front = 1 - front; cvs[front].classList.add('on'); cvs[1 - front].classList.remove('on');
      glyph.innerHTML = '<svg viewBox="0 0 24 24"><path d="' + (IC[id] || IC.top) + '"/></svg>';
      altB.textContent = Math.round(S.altitude(sy.pr)).toLocaleString('en-US') + ' m'; zoneI.textContent = zoneOf(sy.pr);
    }
    function place(i){ var a = links[i], lab = $('.alt-l', a), r = lab.getBoundingClientRect(), ar = a.getBoundingClientRect(), labW = lab.offsetWidth;
      var x = ar.right - 22 - labW - 14 - 220, y = clamp(ar.top + ar.height / 2 - 65, 10, window.innerHeight - 150);
      pv.style.transform = 'translate(' + x.toFixed(0) + 'px,' + y.toFixed(0) + 'px)'; }
    function show(i){ clearTimeout(hideT); if (i === curI && shown) return; curI = i; draw(i);
      if (!shown){ pv.classList.add('snap'); place(i); void pv.offsetWidth; pv.classList.remove('snap'); pv.classList.add('show'); shown = true; } else place(i); }
    function hide(){ clearTimeout(hideT); hideT = setTimeout(function(){ pv.classList.remove('show'); shown = false; curI = -1; }, 160); }
    links.forEach(function(a, i){ a.addEventListener('pointerenter', function(){ show(i); }); a.addEventListener('focus', function(){ show(i); }); a.addEventListener('blur', hide); a.addEventListener('click', hide); });
    nav.addEventListener('pointerleave', hide);
    var idle = window.requestIdleCallback ? function(f){ window.requestIdleCallback(f, { timeout: 2000 }); } : function(f){ setTimeout(f, 250); };
    function warm(){ if (!window.__world || !window.__world.snapshot) return; var k = 0;
      (function next(){ if (k >= links.length || document.hidden) return; var el = document.getElementById(links[k].getAttribute('href').slice(1)); k++;
        if (el){ try { window.__world.snapshot(sectionY(el).y, cvs[0].width, cvs[0].height); } catch (e){} } idle(next); })(); }
    /* the views are rendered the first time someone reaches for the altimeter, then kept */
    var warmed = false; nav.addEventListener('pointerenter', function(){ if (!warmed){ warmed = true; setTimeout(warm, 400); } });
    document.addEventListener('timechange', function(){ if (warmed) setTimeout(warm, 4500); });
    window.__preview = { show: show, hide: hide };
  });

  /* ---------- W2-11: altitude notes, scribbled in the margin; the handwriting changes as the air thins ---------- */
  safe(function(){
    var NOTES = [['letter-sec', 'Base camp. Grab the letter before we head up.'], ['story', 'Everyone starts somewhere. Mine was a buggy phone.'], ['proof', 'Pace yourself. The numbers get steep.'],
                 ['cases', 'Air’s thinner up here. Worth the detour.'], ['experience', 'Thin air. Shorter sentences.'], ['built', 'Built these. On the way up.'],
                 ['leadership', 'Roped in. Nobody summits alone.'], ['skills', 'Gear check. Almost…'], ['play', 'Downhill now. Time to play.'],
                 ['offclock', 'Boots off. The fun stuff.'], ['contact', 'Camp’s set. The fire’s on.']];
    var defs = document.createElementNS(NS, 'svg'); defs.setAttribute('width', '0'); defs.setAttribute('height', '0'); defs.setAttribute('aria-hidden', 'true'); defs.style.position = 'absolute';
    defs.innerHTML = '<filter id="anShake1"><feTurbulence type="fractalNoise" baseFrequency=".06" numOctaves="2" seed="3"/><feDisplacementMap in="SourceGraphic" scale="1.8"/></filter><filter id="anShake2"><feTurbulence type="fractalNoise" baseFrequency=".09" numOctaves="2" seed="8"/><feDisplacementMap in="SourceGraphic" scale="3.2"/></filter>';
    document.body.appendChild(defs);
    var notes = [];
    NOTES.forEach(function(n){ var sec = document.getElementById(n[0]); if (!sec) return; var mk = $('.s-k', sec); if (!mk) return;
      var el = document.createElement('p'); el.className = 'an'; el.setAttribute('aria-hidden', 'true'); el.innerHTML = n[1] + '<small></small>'; sec.appendChild(el);
      notes.push({ sec: sec, mk: mk, el: el });
      S.onView(sec, function(){ el.classList.add('in'); }, 0.18); });
    function tone(pr){ var z = zoneOf(pr); return z === 'Base camp' ? 'an-base' : z === 'Thin air' ? 'an-thin' : z === 'Nearly there' || z === 'Summit' ? 'an-high' : z === 'The way down' ? 'an-down' : 'an-camp'; }
    function layout(){ var W = document.documentElement.clientWidth;
      notes.forEach(function(n){ var sr = n.sec.getBoundingClientRect(), rg = document.createRange(); rg.selectNodeContents(n.mk); var rs = rg.getClientRects(), last = null;
        for (var i = 0; i < rs.length; i++) if (rs[i].width > 2 && (!last || rs[i].right > last.right)) last = rs[i];
        if (!last){ n.el.style.display = 'none'; return; }
        var wrapR = Math.min(W - 24, (W + Math.min(1160, W - 48)) / 2), left = last.right - sr.left + 30, room = wrapR - sr.left - left - (W > 1180 ? 150 : 20);
        if (room < 170){ n.el.style.display = 'none'; return; }
        n.el.style.display = ''; n.el.style.left = left.toFixed(0) + 'px'; n.el.style.maxWidth = Math.min(300, room).toFixed(0) + 'px'; n.el.style.top = (last.bottom - sr.top - n.el.offsetHeight + 4).toFixed(0) + 'px';
        var sy = sectionY(n.sec); n.el.className = 'an ' + tone(sy.pr) + (n.el.classList.contains('in') ? ' in' : '');
        $('small', n.el).textContent = Math.round(S.altitude(sy.pr)).toLocaleString('en-US') + ' m'; }); }
    var rz = 0; function later(){ clearTimeout(rz); rz = setTimeout(layout, 180); }
    window.addEventListener('resize', later); window.addEventListener('load', later); document.addEventListener('timechange', later);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(later);
    setTimeout(layout, 300); setTimeout(layout, 2500);
  });
})();
