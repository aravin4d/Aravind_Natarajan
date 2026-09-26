/* Wave 2 sections: each block gets its own personality.
   Proof numbers roll like an odometer, case rows are dealt like cards, moment cards open like doors,
   the built devices float in space and land, the three leadership stories grow their own paths,
   skills hang from a rope like climbing gear, the summit gets a flag, and contact gets a lantern. */
(function(){
  'use strict';
  var S = window.__site; if (!S) return;
  var root = document.documentElement, reduce = S.reduce, fine = S.fine, $ = S.$, $$ = S.$$, safe = S.safe, NS = 'http://www.w3.org/2000/svg';
  function clamp(v, a, b){ return v < a ? a : v > b ? b : v; }
  function inView(el, top, bot){ var r = el.getBoundingClientRect(), vh = window.innerHeight; return r.top < vh * (top || 0.8) && r.bottom > vh * (bot || 0.15); }
  function gone(el){ var r = el.getBoundingClientRect(); return r.bottom < -20 || r.top > window.innerHeight + 20; }

  /* ---------- odometer: every digit is a strip that rolls into place and overshoots a little ----------
     A hidden copy of the final digit keeps the width and the baseline exactly as they were. */
  function odo(el){
    if (el.__odo) return el.__odo;
    var txt = el.textContent, box = document.createElement('span'), cols = [], cs = getComputedStyle(el), lh = (parseFloat(cs.lineHeight) || parseFloat(cs.fontSize)) / (parseFloat(cs.fontSize) || 16);
    box.setAttribute('aria-hidden', 'true');
    /* each word stays on one line; only the spaces between words may wrap */
    txt.split(/( )/).forEach(function(tok){
      if (tok === ' ' || !tok){ if (tok) box.appendChild(document.createTextNode(' ')); return; }
      var wd = document.createElement('span'); wd.className = 'od-w'; box.appendChild(wd);
      tok.split('').forEach(function(ch){
        if (!/[0-9]/.test(ch)){ wd.appendChild(document.createTextNode(ch)); return; }
        var c = document.createElement('span'), g = document.createElement('span'), st = document.createElement('span'), h = '';
        c.className = 'od'; g.className = 'od-g'; g.textContent = ch; st.className = 'od-s';
        for (var k = 0; k < 30; k++) h += '<span>' + (k % 10) + '</span>'; st.innerHTML = h; c.appendChild(g); c.appendChild(st); wd.appendChild(c); cols.push({ el: c, s: st, d: +ch });
      });
    });
    var sr = document.createElement('span'); sr.className = 'sr'; sr.textContent = txt;
    el.textContent = ''; el.appendChild(sr); el.appendChild(box); el.style.setProperty('--lh', lh.toFixed(3) + 'em');
    cols.forEach(function(c, i){ c.spins = i === cols.length - 1 ? 2 : 1; c.f = c.spins * 10 + c.d; });
    var o = { el: el, cols: cols, lh: lh };
    rest(o, true); el.__odo = o; return o;
  }
  function rest(o, final){ o.cols.forEach(function(c){ if (c.an) c.an.cancel(); c.an = null; c.el.classList.remove('rolling'); c.s.style.transform = 'translateY(' + (-(final ? c.f : 0) * o.lh).toFixed(3) + 'em)'; }); }
  function roll(o, delay){
    o.cols.forEach(function(c, i){ if (c.an) c.an.cancel(); var L = o.lh, f = c.f;
      c.s.style.transform = 'translateY(' + (-f * L).toFixed(3) + 'em)';
      c.an = c.s.animate([{ transform: 'translateY(0em)', easing: 'cubic-bezier(.45,.05,.3,1)' }, { transform: 'translateY(' + (-(f + 0.34) * L).toFixed(3) + 'em)', offset: 0.74, easing: 'ease-in-out' },
        { transform: 'translateY(' + (-(f - 0.1) * L).toFixed(3) + 'em)', offset: 0.9, easing: 'ease-in-out' }, { transform: 'translateY(' + (-f * L).toFixed(3) + 'em)' }],
        { duration: 1150 + c.spins * 220, delay: (delay || 0) + i * 75, fill: 'backwards' });
      c.el.classList.add('rolling'); var me = c.an; me.onfinish = function(){ if (c.an === me){ c.el.classList.remove('rolling'); c.an = null; } }; });
  }
  function zero(o){ rest(o, false); }
  window.__odo = { odo: odo, roll: roll, zero: zero };

  /* ---------- W2-05: the climb in numbers rolls up as it comes into view, and sparks under the cursor ---------- */
  safe(function(){
    var sec = $('#proof'); if (!sec) return;
    var mks = $$('.mk', sec);
    function spark(m){ if (reduce) return; var card = $('.mk-card', m), n = $('.mk-n', m); if (!card || !n) return;
      var hr = card.getBoundingClientRect(), ar = n.getBoundingClientRect(), cx = ar.right - hr.left + 3, cy = ar.top - hr.top + ar.height * 0.32;
      for (var i = 0; i < 9; i++){ (function(){ var s = document.createElement('i'); s.className = 'spk'; s.style.left = cx.toFixed(1) + 'px'; s.style.top = cy.toFixed(1) + 'px'; card.appendChild(s);
        var a = -170 + Math.random() * 200, d = 14 + Math.random() * 22;
        var an = s.animate([{ transform: 'rotate(' + a + 'deg) translateX(0) scaleX(.3)', opacity: 1 }, { transform: 'rotate(' + a + 'deg) translateX(' + d.toFixed(0) + 'px) scaleX(1)', opacity: 1, offset: 0.45 }, { transform: 'rotate(' + (a + 12) + 'deg) translateX(' + (d * 1.5).toFixed(0) + 'px) scaleX(.2)', opacity: 0 }], { duration: 420 + Math.random() * 220, easing: 'cubic-bezier(.2,.7,.3,1)' });
        an.onfinish = function(){ if (s.parentNode) s.parentNode.removeChild(s); }; })(); } }
    mks.forEach(function(m){ var last = 0; function go(){ var t = Date.now(); if (t - last > 500){ last = t; spark(m); } } if (fine) m.addEventListener('mouseenter', go); m.addEventListener('focus', go); m.addEventListener('click', go); });
    if (reduce) return;
    function start(){
      var O = mks.map(function(m){ return odo($('.mk-n', m)); }), on = false;
      function check(){ if (!on && inView(sec, 0.72, 0.2)){ on = true; O.forEach(function(o, i){ roll(o, 380 + i * 110); }); } else if (on && gone(sec)){ on = false; O.forEach(zero); } }
      O.forEach(zero); S.onScroll(check); window.addEventListener('resize', check); check();
    }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(start, start); else start();
  });

  /* ---------- W2-06: case rows are dealt in like cards, tilt toward the cursor and catch the light ---------- */
  safe(function(){
    var list = $('.cs-rows'); if (!list) return; var rows = $$('.cs-row', list);
    rows.forEach(function(li){ var a = $('a', li), sh = document.createElement('span'); sh.className = 'cs-shine'; sh.setAttribute('aria-hidden', 'true'); a.appendChild(sh); });
    if (!reduce){
      rows.forEach(function(li){ li.classList.add('deal-wait'); });
      S.onView(list, function(){ rows.forEach(function(li, i){ li.classList.remove('deal-wait'); var tw = (Math.random() - 0.5) * 3;
        li.animate([{ opacity: 0, transform: 'perspective(1200px) translate3d(16vw, 90px, 0) rotate(' + (8 + tw).toFixed(1) + 'deg) rotateX(28deg)' }, { opacity: 1, offset: 0.28 },
          { transform: 'perspective(1200px) translate3d(-7px, -3px, 0) rotate(' + (-0.9 + tw * 0.1).toFixed(2) + 'deg)', offset: 0.76 }, { opacity: 1, transform: 'none' }], { duration: 860, delay: i * 140, easing: 'cubic-bezier(.2,.75,.25,1)', fill: 'backwards' });
        $('.cs-shine', li).animate([{ opacity: 0, transform: 'translateX(-130%) skewX(-18deg)' }, { opacity: 1, offset: 0.25 }, { opacity: 0, transform: 'translateX(380%) skewX(-18deg)' }], { duration: 950, delay: i * 140 + 560, easing: 'cubic-bezier(.4,0,.2,1)' }); }); }, 0.15);
    }
    if (!fine || reduce) return;
    rows.forEach(function(li){ var a = $('a', li);
      a.addEventListener('pointermove', function(e){ var r = a.getBoundingClientRect(), nx = (e.clientX - r.left) / r.width, ny = (e.clientY - r.top) / r.height;
        a.style.transform = 'perspective(1400px) rotateX(' + ((0.5 - ny) * 7).toFixed(2) + 'deg) rotateY(' + ((nx - 0.5) * 3.4).toFixed(2) + 'deg) translateZ(6px)';
        a.style.setProperty('--shx', (nx * 100).toFixed(1) + '%'); a.classList.add('tilting'); });
      a.addEventListener('pointerleave', function(){ a.style.transform = ''; a.classList.remove('tilting'); }); });
  });

  /* ---------- W2-06: moment cards are doors that swing open, then the number behind rolls ---------- */
  safe(function(){
    if (reduce) return;
    $$('.xs-grid').forEach(function(g){
      var cards = $$('.xs-m', g), open = false;
      cards.forEach(function(m){ var d = document.createElement('span'); d.className = 'door'; d.setAttribute('aria-hidden', 'true'); d.innerHTML = '<span class="door-p"></span><span class="door-p"></span><i class="door-k"></i>'; m.appendChild(d); m.__door = d; });
      function numbers(){ cards.forEach(function(m){ if (!m.__o){ var n = $('.xs-n', m); if (n && /[0-9]/.test(n.textContent)) m.__o = odo(n); } }); }
      function openAll(){ numbers(); S.sfx && S.sfx('doors', { n: cards.length, gap: 115 }); cards.forEach(function(m, i){ var d = m.__door, del = i * 115; if (d.__a) d.__a.cancel(); d.style.visibility = '';
        d.__a = d.animate([{ transform: 'perspective(1000px) rotateY(0deg)', filter: 'brightness(1)', opacity: 1 }, { transform: 'perspective(1000px) rotateY(-118deg)', filter: 'brightness(.6)', opacity: 1, offset: 0.62 },
          { transform: 'perspective(1000px) rotateY(-96deg)', opacity: 1, offset: 0.78 }, { transform: 'perspective(1000px) rotateY(-107deg)', opacity: 1, offset: 0.9 }, { transform: 'perspective(1000px) rotateY(-104deg)', filter: 'brightness(.6)', opacity: 0 }],
          { duration: 1050, delay: del, easing: 'cubic-bezier(.45,.05,.35,1)', fill: 'both' });
        var me = d.__a; me.onfinish = function(){ if (d.__a === me) d.style.visibility = 'hidden'; };
        if (m.__o) roll(m.__o, del + 360); }); }
      function closeAll(){ cards.forEach(function(m){ var d = m.__door; if (d.__a){ d.__a.cancel(); d.__a = null; } d.style.visibility = ''; if (m.__o) zero(m.__o); }); }
      function check(){ if (!open && inView(g, 0.8, 0.12)){ open = true; openAll(); } else if (open && gone(g)){ open = false; closeAll(); } }
      S.onScroll(check); window.addEventListener('resize', check); setTimeout(check, 120);
    });
  });

  /* ---------- the "where it landed" numbers in each case study roll when you reach them ---------- */
  safe(function(){
    if (reduce || !('IntersectionObserver' in window)) return;
    $$('dialog.dlg').forEach(function(d){ var bs = $$('.cs-stat2 b', d).filter(function(b){ return /[0-9]/.test(b.textContent); }); if (!bs.length) return; var O = [], io;
      function arm(){ if (io) return; io = new IntersectionObserver(function(es){ es.forEach(function(e){ var i = bs.indexOf(e.target); if (i < 0 || !e.isIntersecting || (O[i] && O[i].done)) return; if (!O[i]) O[i] = odo(bs[i]); O[i].done = true; roll(O[i], 120 + i * 120); }); }, { root: d, threshold: 0.7 });
        bs.forEach(function(b){ io.observe(b); }); }
      document.addEventListener('dlg:shown', function(e){ if (e.detail === d.id) arm(); });
      d.addEventListener('close', function(){ O.forEach(function(o){ if (o){ o.done = false; zero(o); } }); if (io){ io.disconnect(); io = null; } }); });
  });

  /* ---------- W2-07: built. The devices float in space among stars, orbit once as they pass the middle
     of the screen on the way down, lean toward the cursor, and land with a shadow that tightens. ---------- */
  safe(function(){
    var tools = $$('.tool'); if (!tools.length) return;
    var T = [];
    tools.forEach(function(t, i){ var vis = $('.tool-vis', t), fl = vis && $('.bv-float', vis), rig = vis && $('.bv-rig', vis); if (!rig) return;
      var o = { t: t, vis: vis, fl: fl, rig: rig, base: i % 2 ? 12 : -12, land: 0, landed: false, orbit: -1, lastC: 2, hx: 0, hy: 0, on: false, rx: 7, ry: i % 2 ? 12 : -12, ph: Math.random() * 6 };
      T.push(o);
      if (reduce) return;
      t.classList.add('bv-live');
      var st = document.createElement('span'), h = ''; st.className = 'bv-stars'; st.setAttribute('aria-hidden', 'true');
      for (var k = 0; k < 20; k++) h += '<i style="left:' + (3 + Math.random() * 94).toFixed(1) + '%;top:' + (2 + Math.random() * 82).toFixed(1) + '%;--s:' + (0.5 + Math.random() * 1.5).toFixed(2) + ';--d:-' + (Math.random() * 2.6).toFixed(2) + 's"></i>';
      st.innerHTML = h;
      var gl = document.createElement('span'); gl.className = 'bv-glow'; gl.setAttribute('aria-hidden', 'true');
      var sh = document.createElement('span'); sh.className = 'bv-shadow'; sh.setAttribute('aria-hidden', 'true');
      vis.insertBefore(sh, vis.firstChild); vis.insertBefore(st, vis.firstChild); vis.insertBefore(gl, vis.firstChild); o.sh = sh;
      if (fine){ vis.addEventListener('pointermove', function(e){ var r = vis.getBoundingClientRect(); o.hx = (e.clientX - (r.left + r.width / 2)) / r.width; o.hy = (e.clientY - (r.top + r.height / 2)) / r.height; o.on = true;
          vis.style.setProperty('--gx', (e.clientX - r.left).toFixed(0) + 'px'); vis.style.setProperty('--gy', (e.clientY - r.top).toFixed(0) + 'px'); vis.classList.add('glow'); });
        vis.addEventListener('pointerleave', function(){ o.on = false; vis.classList.remove('glow'); }); }
    });
    if (reduce || !T.length) return;
    function thud(o){
      if (o.fl.animate) o.fl.animate([{ scale: '1 1' }, { scale: '1.045 .95', offset: 0.3 }, { scale: '.985 1.02', offset: 0.65 }, { scale: '1 1' }], { duration: 520, easing: 'ease-out' });
      for (var i = 0; i < 8; i++){ (function(i){ var d = document.createElement('i'); d.className = 'bv-dust'; o.vis.appendChild(d); var side = i % 2 ? 1 : -1, dx = side * (30 + Math.random() * 90), dy = -(4 + Math.random() * 14);
        var an = d.animate([{ opacity: 0.45, transform: 'translate(' + (side * 30) + 'px,0) scale(.4)' }, { opacity: 0, transform: 'translate(' + dx.toFixed(0) + 'px,' + dy.toFixed(0) + 'px) scale(' + (1.2 + Math.random()).toFixed(2) + ')' }], { duration: 650 + Math.random() * 300, easing: 'cubic-bezier(.2,.7,.3,1)' });
        an.onfinish = function(){ if (d.parentNode) d.parentNode.removeChild(d); }; })(i); }
    }
    var run = false, lastY = window.pageYOffset, down = true;
    function frame(now){
      if (!run) return;
      var vh = window.innerHeight, y = window.pageYOffset; if (y !== lastY){ down = y > lastY; lastY = y; }
      T.forEach(function(o){ var r = o.vis.getBoundingClientRect(); if (r.bottom < -120 || r.top > vh + 120){ o.lastC = 2; return; }
        var c = (r.top + r.height / 2) / vh, L = clamp((1.02 - c) / 0.44, 0, 1); L = L * L * (3 - 2 * L); o.land += (L - o.land) * 0.16;
        if (!o.landed && o.land > 0.965 && down){ o.landed = true; thud(o); } else if (o.landed && o.land < 0.6) o.landed = false;
        if (down && o.lastC > 0.52 && c <= 0.52 && !o.on && o.orbit < 0) o.orbit = now;
        o.lastC = c;
        var t = now / 1000, sp = 1 - o.land, bob = Math.sin(t * 1.15 + o.ph) * (2.4 + sp * 9), drift = Math.sin(t * 0.7 + o.ph) * sp * 7, oy = -sp * 48 + bob, orx = 0, ory = 0;
        if (o.orbit >= 0){ var k = (now - o.orbit) / 2600; if (k >= 1 || o.on) o.orbit = -1; else { var e = Math.sin(k * Math.PI); ory = Math.sin(k * Math.PI * 2) * 36 * e; orx = Math.sin(k * Math.PI * 2 + 1.2) * 6 * e; } }
        var trx = o.on ? clamp(-o.hy * 16 + 5, -10, 16) : 7 + orx + Math.sin(t * 0.9 + o.ph) * sp * 5, tr = o.on ? clamp(o.hx * 28, -22, 22) : o.base + ory + Math.sin(t * 0.6 + o.ph) * sp * 10;
        o.rx += (trx - o.rx) * 0.12; o.ry += (tr - o.ry) * 0.12;
        o.fl.style.transform = 'translate3d(' + drift.toFixed(2) + 'px,' + oy.toFixed(2) + 'px,0)';
        o.rig.style.setProperty('--rx', o.rx.toFixed(2) + 'deg'); o.rig.style.setProperty('--ry', o.ry.toFixed(2) + 'deg');
        var hgt = Math.max(0, sp * 48 - bob + 3);
        o.sh.style.transform = 'scale(' + (0.84 + hgt * 0.011).toFixed(3) + ',' + (0.84 + hgt * 0.007).toFixed(3) + ')'; o.sh.style.opacity = clamp(0.62 - hgt * 0.008, 0.14, 0.62).toFixed(3); o.sh.style.filter = 'blur(' + (2.5 + hgt * 0.3).toFixed(1) + 'px)';
        o.vis.style.setProperty('--space', clamp(sp * 1.15, 0, 1).toFixed(3)); });
      requestAnimationFrame(frame);
    }
    var box = $('.tools');
    if ('IntersectionObserver' in window) new IntersectionObserver(function(es){ var v = es[0].isIntersecting; if (v && !run){ run = true; requestAnimationFrame(frame); } else if (!v) run = false; }, { rootMargin: '120px 0px' }).observe(box);
    else { run = true; requestAnimationFrame(frame); }
  });

  /* ---------- W2-08: how I lead. Three stories, each with its own number, icon, tint, entrance and path ---------- */
  safe(function(){
    var wrap = $('.ld-stories'); if (!wrap) return; var st = $$('.ld-story', wrap);
    var ICON = [
      '<svg viewBox="0 0 24 24"><path class="ic-draw" pathLength="1" d="M12 21v-9"/><path class="ic-pop" d="M12 13c-4.5 0-6.5-3-6.5-6.5 3.6 0 6.5 2.2 6.5 6.5z"/><path class="ic-pop" d="M12 11c.3-3.8 2.8-6.2 6.5-6.2 0 3.8-2.6 6.2-6.5 6.2z"/><path d="M7 21h10"/></svg>',
      '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><g class="ic-needle"><path d="M12 5.5l2.2 6.5L12 18.5 9.8 12z"/><path d="M12 5.5l2.2 6.5H9.8z" fill="currentColor"/></g></svg>',
      '<svg viewBox="0 0 24 24"><g class="ic-glass"><path d="M6.5 3h11M6.5 21h11M7.5 3c0 5 3.2 6.2 3.2 9S7.5 16 7.5 21M16.5 3c0 5-3.2 6.2-3.2 9s3.2 4 3.2 9"/><path class="ic-sand" d="M9.3 20.2c.6-2.4 1.6-3.4 2.7-3.4s2.1 1 2.7 3.4z" fill="currentColor" stroke="none"/></g></svg>'];
    function path(gp, i){
      gp.classList.add('gp-svg'); var svg = document.createElementNS(NS, 'svg'); svg.setAttribute('class', 'gp-line'); svg.setAttribute('aria-hidden', 'true'); gp.insertBefore(svg, gp.firstChild);
      function draw(){ var W = gp.clientWidth; if (!W) return; var p1 = [6, 32], p2 = [W / 2, 20], p3 = [W - 6, 6], d, extra = '';
        function pt(p){ return p[0].toFixed(1) + ' ' + p[1].toFixed(1); }
        if (i === 0){ d = 'M' + pt(p1) + ' C' + pt([W * 0.16, 46]) + ' ' + pt([W * 0.3, 8]) + ' ' + pt(p2) + ' S' + pt([W * 0.82, -2]) + ' ' + pt(p3);
          extra = '<path class="gp-leaf" style="--ld:.75s" d="M' + pt([W * 0.27, 23]) + ' q5 -9 12 -5 q-5 7 -12 5z"/><path class="gp-leaf" style="--ld:1.3s" d="M' + pt([W * 0.73, 8]) + ' q-4 -9 -12 -6 q4 8 12 6z"/>'; }
        else if (i === 1){ d = 'M' + pt(p1) + ' C' + pt([W * 0.14, 30]) + ' ' + pt([W * 0.27, 44]) + ' ' + pt([W * 0.25, 30]) + ' C' + pt([W * 0.23, 18]) + ' ' + pt([W * 0.14, 24]) + ' ' + pt([W * 0.2, 31]) + ' S' + pt([W * 0.38, 20]) + ' ' + pt(p2) + ' L' + pt(p3); }
        else { d = 'M' + pt(p1) + ' L' + pt([W * 0.08, 22]) + ' L' + pt([W * 0.14, 33]) + ' L' + pt([W * 0.22, 17]) + ' L' + pt([W * 0.3, 30]) + ' L' + pt([W * 0.39, 21]) + ' L' + pt(p2) + ' H' + (W * 0.7).toFixed(1) + ' Q' + pt([W * 0.86, 20]) + ' ' + pt(p3);
          extra = '<path class="gp-buf" d="M' + pt(p2) + ' H' + (W * 0.7).toFixed(1) + '"/>'; }
        svg.setAttribute('viewBox', '0 0 ' + W + ' 40'); svg.setAttribute('width', W); svg.setAttribute('height', 40);
        svg.innerHTML = '<path class="gp-ghost" d="' + d + '"/>' + extra + '<path class="gp-draw" pathLength="1" d="' + d + '"/>'; }
      draw(); if ('ResizeObserver' in window) new ResizeObserver(draw).observe(gp); else window.addEventListener('resize', draw);
    }
    st.forEach(function(s, i){ s.classList.add('ls', 'ls-' + (i + 1)); var hd = document.createElement('div'); hd.className = 'ls-head'; hd.setAttribute('aria-hidden', 'true');
      hd.innerHTML = '<span class="ls-no">' + (i + 1) + '</span><span class="ls-ic">' + (ICON[i] || '') + '</span>'; s.insertBefore(hd, s.firstChild); var gp = $('.gp', s); if (gp) path(gp, i); });
    if (reduce){ st.forEach(function(s){ s.classList.add('ls-in'); }); return; }
    var ENTRY = [
      { o: '50% 100%', k: [{ opacity: 0, transform: 'translateY(30px) scaleY(.8)' }, { opacity: 1, transform: 'translateY(-4px) scaleY(1.04)', offset: 0.68 }, { opacity: 1, transform: 'none' }] },
      { o: '0 0', k: [{ opacity: 0, transform: 'rotate(-7deg) translate(-18px, 10px)' }, { opacity: 1, transform: 'rotate(1.6deg)', offset: 0.68 }, { opacity: 1, transform: 'none' }] },
      { o: '50% 0', k: [{ opacity: 0, transform: 'perspective(800px) rotateX(72deg)' }, { opacity: 1, transform: 'perspective(800px) rotateX(-9deg)', offset: 0.7 }, { opacity: 1, transform: 'none' }] }];
    st.forEach(function(s){ s.style.opacity = '0'; });
    S.onView(wrap, function(){ st.forEach(function(s, i){ var E = ENTRY[i % 3], del = i * 180; s.style.opacity = ''; s.style.transformOrigin = E.o;
      s.animate(E.k, { duration: 900, delay: del, easing: 'cubic-bezier(.2,.8,.3,1)', fill: 'backwards' }); setTimeout(function(){ s.classList.add('ls-in'); }, del + 260); }); }, 0.3);
  });

  /* ---------- W2-09: skills hang from a rope like climbing gear. They sway, and jingle when touched ---------- */
  safe(function(){
    var sk = $('.sk'); if (!sk) return; var lists = $$('.chips', sk), C = [];
    lists.forEach(function(ul){ ul.classList.add('gear'); var svg = document.createElementNS(NS, 'svg'); svg.setAttribute('class', 'rope'); svg.setAttribute('aria-hidden', 'true'); ul.insertBefore(svg, ul.firstChild); ul.__svg = svg;
      $$('.chip', ul).forEach(function(li){ C.push({ el: li, ul: ul, a: 0, w: 0, dy: 0, vy: 0, x: 0, top: 0, ph: Math.random() * 6 }); }); });
    function layout(){ lists.forEach(function(ul){ var rows = {}; C.forEach(function(c){ if (c.ul !== ul) return; c.top = c.el.offsetTop; c.x = c.el.offsetLeft + c.el.offsetWidth / 2; var k = Math.round(c.top / 6); (rows[k] = rows[k] || []).push(c); });
      ul.__rows = Object.keys(rows).map(function(k){ return rows[k].sort(function(a, b){ return a.x - b.x; }); }); }); }
    function draw(){ lists.forEach(function(ul){ var s = ''; (ul.__rows || []).forEach(function(row){ var y = row[0].top - 16, x0 = row[0].el.offsetLeft - 16, px = x0, py = y - 4, d = 'M' + x0.toFixed(1) + ' ' + py.toFixed(1);
        row.forEach(function(c){ var cy = y + c.dy, sag = Math.min(10, 2 + (c.x - px) * 0.05); d += ' Q' + ((px + c.x) / 2).toFixed(1) + ' ' + (Math.max(py, cy) + sag).toFixed(1) + ' ' + c.x.toFixed(1) + ' ' + cy.toFixed(1); px = c.x; py = cy; });
        var last = row[row.length - 1], x1 = last.el.offsetLeft + last.el.offsetWidth + 16; d += ' Q' + ((px + x1) / 2).toFixed(1) + ' ' + (py + 6).toFixed(1) + ' ' + x1.toFixed(1) + ' ' + (y - 4).toFixed(1); s += d + ' '; });
      if (ul.__d !== s){ ul.__d = s; ul.__svg.innerHTML = '<path class="r1" d="' + s + '"/><path class="r2" d="' + s + '"/>'; } }); }
    function step(dt, t){
      C.forEach(function(c){ var wind = reduce ? 0 : Math.sin(t * 0.8 + c.x * 0.012) * 0.8 + Math.sin(t * 2.3 + c.ph) * 0.3;
        c.w += (-26 * c.a - 3.1 * c.w + wind * 9) * dt; c.a += c.w * dt; c.vy += (-150 * c.dy - 11 * c.vy) * dt; c.dy += c.vy * dt; });
      lists.forEach(function(ul){ (ul.__rows || []).forEach(function(row){ for (var i = 1; i < row.length; i++){ var a = row[i - 1], b = row[i], k = (b.dy - a.dy) * 55 * dt, kk = (b.a - a.a) * 4 * dt; a.vy += k; b.vy -= k; a.w += kk; b.w -= kk; } }); });
      C.forEach(function(c){ c.el.style.rotate = c.a.toFixed(2) + 'deg'; c.el.style.translate = Math.abs(c.dy) < 0.02 ? '' : '0 ' + c.dy.toFixed(2) + 'px'; });
      draw(); }
    function jingle(c, dir){ if (S.sfx){ var jr = c.el.getBoundingClientRect(); S.sfx('jingle', { x: (jr.left + jr.width / 2) / window.innerWidth }); } c.w += dir * (70 + Math.random() * 40); c.vy += 34; c.el.classList.remove('jing'); void c.el.offsetWidth; c.el.classList.add('jing'); kick(); }
    C.forEach(function(c){ var lastX = 0;
      c.el.addEventListener('pointerenter', function(e){ var r = c.el.getBoundingClientRect(), dir = e.clientX < r.left + r.width / 2 ? 1 : -1; if (Math.abs(e.clientX - lastX) < 1) dir = Math.random() < 0.5 ? -1 : 1; lastX = e.clientX; jingle(c, dir); });
      c.el.addEventListener('pointerdown', function(){ jingle(c, Math.random() < 0.5 ? -1 : 1); }); });
    var run = false, last = 0, vis = false;
    function frame(now){ if (!run) return; var dt = Math.min(0.033, (now - (last || now)) / 1000 || 0.016); last = now; step(dt, now / 1000); requestAnimationFrame(frame); }
    function kick(){ if (vis && !run){ run = true; last = 0; requestAnimationFrame(frame); } }
    layout(); draw();
    var rz = 0; window.addEventListener('resize', function(){ clearTimeout(rz); rz = setTimeout(function(){ layout(); draw(); }, 150); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ layout(); draw(); });
    if ('IntersectionObserver' in window) new IntersectionObserver(function(es){ vis = es[0].isIntersecting; if (vis) kick(); else run = false; }, { rootMargin: '80px 0px' }).observe(sk);
    else { vis = true; kick(); }
  });

  /* ---------- W2-10: reaching the summit plants a flag on the 3D peak and shows a "you made it" readout ---------- */
  safe(function(){
    var sm = $('#summit'), rd = sm && $('.sm-made', sm); if (!rd) return; var made = false;
    function text(){ var P = S.peaks[root.getAttribute('data-time')] || S.peaks.morning; $('b', rd).textContent = 'You made it.'; $('.sm-peak', rd).textContent = P[0]; $('.sm-alt', rd).textContent = P[1].toLocaleString('en-US') + ' m'; }
    function check(){ if (made) return; var r = sm.getBoundingClientRect(), c = (r.top + r.height / 2) / window.innerHeight; if (c > 0.22 && c < 0.74){ made = true; text(); sm.classList.add('made'); S.emit('summit:reached'); S.track('summit'); } }
    S.onScroll(check); setTimeout(check, 400); document.addEventListener('timechange', function(){ if (made) text(); });
  });

  /* ---------- off the clock: a run that goes a little further every time ---------- */
  safe(function(){
    var card = $$('.oc-card').filter(function(c){ var h = $('h3', c); return h && /slow, hard goals/i.test(h.textContent); })[0]; if (!card) return;
    var box = document.createElement('div'); box.className = 'run';
    box.innerHTML = '<div class="run-track" aria-hidden="true"><i class="run-fill"></i><i class="run-best"></i><span class="run-m" style="--p:.1667">5</span><span class="run-m" style="--p:.3333">10</span><span class="run-m" style="--p:.7033">21.1</span><span class="run-m end" style="--p:1">30 km</span>' +
      '<span class="run-guy"><svg viewBox="0 0 28 30"><circle cx="17" cy="4.5" r="2.6" fill="currentColor" stroke="none"/><path d="M16 8.5l-2.5 8M14.8 11l4.6 2.6 2.6-2.2M14.8 11l-4.2 2.4-2.8-1.2"/><g class="f1"><path d="M13.5 16.5l3.6 4.2-1.2 6M13.5 16.5l-3.2 4.4-4.6 1.2"/></g><g class="f2"><path d="M13.5 16.5l-.6 5.2 3.6 4.8M13.5 16.5l1.8 5-3.4 4.6"/></g></svg></span></div>' +
      '<div class="run-row"><button class="btn run-btn" type="button">Hold to run</button><span class="run-read">0.0 km</span><span class="run-say" aria-live="polite">A little further each time.</span></div>';
    card.appendChild(box);
    var btn = $('.run-btn', box), read = $('.run-read', box), say = $('.run-say', box), tries = 0, best = 0, km = 0, lim = 0, holding = false, raf = 0, last = 0;
    function show(){ box.style.setProperty('--p', (km / 30).toFixed(4)); read.textContent = km.toFixed(1) + ' km'; }
    function frame(now){ raf = 0; var dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
      if (holding && km < lim){ var tired = 1 - Math.pow(km / lim, 3) * 0.75; km = Math.min(lim, km + dt * 7.5 * tired); show(); if (km >= lim) finish(); else raf = requestAnimationFrame(frame); }
      else if (holding) finish(); }
    function start(e){ if (e) e.preventDefault(); if (holding) return; holding = true; tries++; km = 0; lim = Math.min(29.6, 9.5 + tries * 4.4); box.classList.add('go'); S.sfx && S.sfx('run', { on: true }); say.textContent = tries === 1 ? 'Keep holding.' : 'Further than last time. Keep going.'; last = 0; raf = requestAnimationFrame(frame); }
    function stop(){ if (!holding) return; holding = false; box.classList.remove('go'); S.sfx && S.sfx('run', { on: false }); if (raf){ cancelAnimationFrame(raf); raf = 0; }
      if (km < lim - 0.05) say.textContent = 'Rest day. ' + km.toFixed(1) + ' km still counts.'; best = Math.max(best, km); box.style.setProperty('--b', (best / 30).toFixed(4)); }
    function finish(){ holding = false; box.classList.remove('go'); S.sfx && S.sfx('run', { on: false }); best = Math.max(best, km); box.style.setProperty('--b', (best / 30).toFixed(4));
      say.textContent = km >= 29.5 ? km.toFixed(1) + ' km. Not there yet. I just keep showing up.' : km.toFixed(1) + ' km today. A little further next time.'; S.track('run', { km: Math.round(km) }); }
    btn.addEventListener('pointerdown', start); btn.addEventListener('pointerup', stop); btn.addEventListener('pointerleave', stop); btn.addEventListener('pointercancel', stop);
    btn.addEventListener('keydown', function(e){ if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) start(e); }); btn.addEventListener('keyup', function(e){ if (e.key === ' ' || e.key === 'Enter') stop(); });
    btn.addEventListener('contextmenu', function(e){ e.preventDefault(); });
  });

  /* ---------- off the clock: the gopuram's lamps light tier by tier, and a tap rings the bell ---------- */
  safe(function(){
    var g = $('.gopuram'); if (!g) return; var tiers = [[30, 130, 100], [38, 122, 84], [46, 114, 70], [54, 106, 58], [62, 98, 48], [70, 90, 40]], h = '';
    tiers.forEach(function(t, i){ var d = (i * 0.12).toFixed(2) + 's'; h += '<circle class="lamp" cx="' + (t[0] + 3.5) + '" cy="' + (t[2] - 3) + '" r="1.9" style="--ld:' + d + '"/><circle class="lamp" cx="' + (t[1] - 3.5) + '" cy="' + (t[2] - 3) + '" r="1.9" style="--ld:' + d + '"/>'; });
    h += '<circle class="bell" cx="80" cy="18" r="10"/>';
    g.insertAdjacentHTML('beforeend', h); var bell = $('.bell', g), card = g.closest('.oc-card') || g;
    card.addEventListener('pointerenter', function(){ g.classList.add('lit'); }); card.addEventListener('pointerleave', function(){ g.classList.remove('lit'); });
    g.addEventListener('click', function(){ g.classList.add('lit'); bell.classList.remove('ring'); void bell.getBoundingClientRect(); bell.classList.add('ring'); S.sfx && S.sfx('bell'); S.track('temple_bell'); });
    if (!fine) S.onView(g, function(){ setTimeout(function(){ g.classList.add('lit'); }, 1800); }, 0.6);
  });

  /* ---------- play: each chapter ticks off on the list as you finish its level ---------- */
  safe(function(){
    var lis = $$('.pl-side ol li'); if (!lis.length) return; var tr = window.__track;
    window.__track = function(n, d){ try { if (n === 'game_level' && d && lis[d.level - 1]) lis[d.level - 1].classList.add('done'); if (n === 'game_start') lis.forEach(function(l){ l.classList.remove('done'); }); } catch (e){} if (tr) return tr.apply(this, arguments); };
  });
})();
