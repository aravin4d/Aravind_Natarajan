/* The letter: a theme seal that splits and scatters wax when it breaks, a signature that writes
   itself stroke by stroke, and a reply that folds into a paper plane and flies off. The paper
   itself (theme colours, moonlit sheen, crisp white or sun-bleached sepia) lives in the CSS. */
(function(){
  'use strict';
  var S = window.__site; if (!S) return;
  var root = document.documentElement, reduce = S.reduce, $ = S.$, $$ = S.$$, safe = S.safe, NS = 'http://www.w3.org/2000/svg';
  var dlg = document.getElementById('letter'), env = $('.env'); if (!dlg) return;

  /* ---------- W2-16: the seal splits along a crack and scatters flecks of wax ---------- */
  safe(function(){
    if (!env) return; var seal = $('.env-seal', env); if (!seal) return;
    var CUT = ['polygon(-5% -5%, 53% -5%, 45% 28%, 56% 50%, 43% 73%, 51% 105%, -5% 105%)', 'polygon(53% -5%, 105% -5%, 105% 105%, 51% 105%, 43% 73%, 56% 50%, 45% 28%)'];
    document.addEventListener('env:crack', function(){
      if (reduce) return;
      var svg = $('svg', seal); if (!svg) return;
      var r = seal.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, halves = [];
      seal.classList.add('split');
      CUT.forEach(function(cp, i){ var h = document.createElement('span'); h.className = 'seal-h'; h.innerHTML = svg.outerHTML; h.style.clipPath = cp; seal.appendChild(h); halves.push(h);
        var sd = i ? 1 : -1; h.animate([{ transform: 'none', opacity: 1 }, { transform: 'translate(' + (sd * 7) + 'px,-3px) rotate(' + (sd * 16) + 'deg)', opacity: 1, offset: 0.35 }, { transform: 'translate(' + (sd * 16) + 'px,26px) rotate(' + (sd * 38) + 'deg)', opacity: 0 }], { duration: 620, easing: 'cubic-bezier(.3,.1,.6,1)', fill: 'forwards' }); });
      var cs = getComputedStyle(root), cols = [cs.getPropertyValue('--wx1').trim(), cs.getPropertyValue('--wx2').trim(), cs.getPropertyValue('--wx3').trim()];
      var box = document.createElement('div'); box.className = 'wax-fx'; box.setAttribute('aria-hidden', 'true'); document.body.appendChild(box);
      for (var i = 0; i < 24; i++){ (function(i){ var f = document.createElement('i'), sz = 2.5 + Math.random() * 7; f.className = 'wax-f'; f.style.width = sz.toFixed(1) + 'px'; f.style.height = (sz * (0.55 + Math.random() * 0.6)).toFixed(1) + 'px'; f.style.background = cols[i % 3] || '#A3261C';
        f.style.clipPath = 'polygon(' + (Math.random() * 30).toFixed(0) + '% 0, 100% ' + (Math.random() * 40).toFixed(0) + '%, ' + (60 + Math.random() * 40).toFixed(0) + '% 100%, 0 ' + (50 + Math.random() * 50).toFixed(0) + '%)'; box.appendChild(f);
        var a = Math.random() * Math.PI * 2, v = 70 + Math.random() * 190, vx = Math.cos(a) * v, vy = Math.sin(a) * v - 110, T = 0.8 + Math.random() * 0.55, rot = (Math.random() - 0.5) * 1000, G = 720, kf = [];
        for (var k = 0; k <= 6; k++){ var t = T * k / 6; kf.push({ transform: 'translate(' + (cx + vx * t).toFixed(1) + 'px,' + (cy + vy * t + 0.5 * G * t * t).toFixed(1) + 'px) translate(-50%,-50%) rotate(' + (rot * k / 6).toFixed(0) + 'deg)', opacity: k < 5 ? 1 : 0 }); }
        f.animate(kf, { duration: T * 1000, delay: Math.random() * 40, easing: 'linear', fill: 'both' }); })(i); }
      setTimeout(function(){ if (box.parentNode) box.parentNode.removeChild(box); }, 1600);
      setTimeout(function(){ halves.forEach(function(h){ if (h.parentNode) h.parentNode.removeChild(h); }); seal.classList.remove('split'); }, 1420);
    });
    /* when the letter folds back into the envelope, the envelope takes it with a little bounce */
    dlg.addEventListener('close', function(){ if (reduce) return; env.classList.remove('tuck'); void env.offsetWidth; env.classList.add('tuck'); });
    env.addEventListener('animationend', function(e){ if (e.animationName === 'envTuck') env.classList.remove('tuck'); });
  });

  /* ---------- W2-17: the signature writes itself, stroke by stroke, with the pen lifting between strokes ---------- */
  var SIG = ["M9.2 5.1 L8.3 -0.2 L16.4 -16.2 L18.6 -22.2 L21.7 -25.3 L24.9 -27.2","M24.9 -27.2 L25.1 -27.2","M25.1 -27.2 L25.1 -27.3","M25.1 -27.3 L24.9 -27.2","M25.1 -27.2 L25.4 -26.8 L31.9 -27.2 L41.6 -28.4","M48.6 -27.8 L49.2 -28.4 L50.2 -36.9 L51.9 -58.2 L50.6 -62.6 L46.4 -63.6 L44.9 -63.1 L41.9 -59.6 L30.4 -41.3 L26.3 -33.8 L25.1 -27.3","M41.6 -28.4 L41.7 -28.6","M41.7 -28.6 L41.7 -28.4","M41.7 -28.4 L41.6 -28.4","M41.7 -28.4 L47.9 -28.3 L48.4 -27.8","M48.4 -27.8 L48.6 -27.8","M48.6 -27.8 L48.6 -27.7","M48.6 -27.7 L47.8 -3.9 L49.1 -1.3","M48.6 -27.7 L48.4 -27.8","M67.1 -19.3 L65.6 -16.1 L63.7 -8.7 L63.9 -5.1","M67.1 -19.3 L66.7 -20.2 L67.7 -26.6 L72.4 -36.6","M67.1 -19.3 L72.7 -21.3 L76.7 -24.9 L85.8 -30.6 L89.2 -31.6 L92.1 -30.8 L94.7 -31.1","M124.8 -28.1 L123.9 -30.6 L120.7 -33.9 L117.2 -35.1 L113.8 -34.1 L108.7 -29.3 L105.2 -24.6 L100.7 -17.3 L98.7 -11.9 L98.2 -8.8 L99.1 -6.9 L101.6 -6.3 L105.2 -7.1 L110.1 -10.1 L117.9 -17.6 L123.2 -19.6","M123.2 -19.6 L123.3 -19.6","M123.3 -19.6 L123.3 -19.7","M123.3 -19.7 L123.2 -19.6","M123.3 -19.6 L124.1 -18.8 L125.2 -13.6 L127.2 -9.8 L130.2 -7.4 L133.1 -7.2","M123.3 -19.7 L124.8 -27.9","M124.8 -27.9 L124.8 -28.1","M124.8 -28.1 L124.9 -28.1","M124.9 -28.1 L124.8 -27.9","M144.9 -33.7 L146.1 -29.9 L145.9 -19.1 L146.6 -11.4 L147.2 -9.9 L149.3 -8.8","M149.3 -8.8 L149.4 -8.8","M149.4 -8.8 L149.4 -8.7","M149.4 -8.7 L149.3 -8.8","M149.4 -8.8 L149.6 -8.8","M149.6 -8.8 L149.4 -8.7","M149.6 -8.8 L152.9 -10.1 L154.6 -11.8 L166.4 -29.2 L167.6 -29.9","M180.3 -31.6 L181.2 -27.2 L178.4 -17.2 L177.3 -10.8 L177.7 -6.7 L178.8 -2.4","M197.7 -11.4 L197.2 -12.2 L198.2 -19.1 L201.9 -27.9 L205.2 -33.8 L204.7 -37.1","M197.7 -11.4 L203.8 -13.3 L212.7 -22.1 L217.3 -23.7 L219.1 -23.2 L219.7 -22.1 L220.1 -14.1 L220.9 -9.3 L223.2 -8.7 L225.9 -9.6 L232.3 -14.3","M263.2 -15.3 L257.4 -13.2 L249.7 -7.4 L244.9 -6.3 L242.7 -6.8 L241.4 -7.8 L240.6 -11.9 L241.6 -16.7 L243.8 -21.9 L247.2 -26.6 L249.9 -29.2 L252.4 -30.4 L254.9 -30.7 L261.3 -29.6 L264.3 -28.2","M264.3 -28.2 L264.4 -28.1","M264.4 -28.1 L263.3 -15.4","M263.3 -15.4 L263.2 -15.3","M263.2 -15.3 L263.3 -15.2","M263.3 -15.2 L263.3 -15.3","M263.3 -15.3 L263.2 -15.3","M263.3 -15.3 L263.3 -15.4","M263.3 -15.2 L263.3 -8.1 L264.3 -2.3","M264.4 -28.1 L264.4 -28.2","M264.4 -28.2 L264.3 -28.2","M264.4 -28.2 L266.2 -29.7 L271.9 -47.2 L277.6 -59.8","M188.1 -46.6 L187.2 -48.7 L187.2 -50.7"];
  safe(function(){
    var svg = $('.sig-svg', dlg); if (!svg || reduce) return; var g = $('.sig-m', svg), ink = $('.sig-ink', svg); if (!g || !ink) return;
    g.innerHTML = SIG.map(function(d){ return '<path d="' + d + '"/>'; }).join('');
    var ps = $$('path', g), plan = [], t = 0, prevEnd = null, sumL = 0;
    ps.forEach(function(p){ sumL += p.getTotalLength ? p.getTotalLength() : 20; });
    /* about two seconds of ink in all, at an even pace, with a short pause wherever the pen lifts */
    ps.forEach(function(p){ var L = p.getTotalLength ? p.getTotalLength() : 20, a = p.getPointAtLength(0), b = p.getPointAtLength(L);
      if (prevEnd){ var gap = Math.hypot(a.x - prevEnd.x, a.y - prevEnd.y); t += gap > 6 ? 50 + Math.min(60, gap * 0.8) : 0; }
      var dur = Math.max(16, L / Math.max(1, sumL) * 2000); plan.push({ p: p, L: L, at: t, dur: dur }); t += dur; prevEnd = b; });
    var total = t, anims = [], drawn = false;
    function hide(){ anims.forEach(function(a){ a.cancel(); }); anims = []; plan.forEach(function(q){ q.p.style.strokeDasharray = (q.L + 2).toFixed(1) + ' ' + (q.L + 40).toFixed(1); q.p.style.strokeDashoffset = (q.L + 2).toFixed(1); }); drawn = false; }
    function draw(){ if (drawn) return; drawn = true; hide(); drawn = true;
      if (S.sfx) S.sfx('pen', { plan: plan.map(function(q){ return [q.at + 150, q.dur, q.L]; }) });
      plan.forEach(function(q){ anims.push(q.p.animate([{ strokeDashoffset: (q.L + 2).toFixed(1) }, { strokeDashoffset: '0' }], { duration: q.dur, delay: q.at + 150, easing: 'cubic-bezier(.35,.1,.55,1)', fill: 'both' })); }); }
    ink.setAttribute('mask', 'url(#sigM)'); hide();
    var io = 'IntersectionObserver' in window ? new IntersectionObserver(function(es){ if (es[0].isIntersecting && dlg.open) draw(); }, { root: dlg, threshold: 0.9 }) : null;
    document.addEventListener('dlg:shown', function(e){ if (e.detail !== 'letter') return; if (io){ io.disconnect(); io.observe(svg); } else draw(); });
    dlg.addEventListener('close', function(){ if (io) io.disconnect(); hide(); });
    window.__sig = { draw: draw, hide: hide, total: function(){ return total; } };
  });

  /* ---------- W2-18: write back. The reply folds into a paper plane and flies to email or LinkedIn ---------- */
  safe(function(){
    var note = $('.wb-note', dlg);
    var SHAPES = {
      a: ['polygon(0% 0%, 100% 0%, 100% 50%, 50% 50%, 0% 50%)', 'polygon(0% 0%, 58% 0%, 100% 50%, 50% 50%, 0% 50%)', 'polygon(0% 12%, 34% 22%, 100% 50%, 40% 50%, 6% 50%)', 'polygon(0% 0%, 22% 14%, 100% 50%, 30% 45%, 14% 42%)'],
      b: ['polygon(0% 50%, 50% 50%, 100% 50%, 100% 100%, 0% 100%)', 'polygon(0% 50%, 50% 50%, 100% 50%, 58% 100%, 0% 100%)', 'polygon(6% 50%, 40% 50%, 100% 50%, 34% 78%, 0% 88%)', 'polygon(14% 58%, 30% 55%, 100% 50%, 22% 86%, 0% 100%)'] };
    function bez(p0, p1, p2, p3, t){ var m = 1 - t; return [m * m * m * p0[0] + 3 * m * m * t * p1[0] + 3 * m * t * t * p2[0] + t * t * t * p3[0], m * m * m * p0[1] + 3 * m * m * t * p1[1] + 3 * m * t * t * p2[1] + t * t * t * p3[1]]; }
    function go(a){
      var kind = a.getAttribute('data-wb'), href = a.getAttribute('href'), r = a.getBoundingClientRect(), W = window.innerWidth, H = window.innerHeight;
      var p0 = [r.left + r.width / 2, r.top - 34], p3 = [W + 120, -120], p1 = [p0[0] + 60, p0[1] - 150], p2 = [W * 0.55, H * 0.55];
      if (p0[0] > W * 0.6) p2 = [p0[0] - 160, H * 0.2];
      var pl = document.createElement('div'); pl.className = 'plane'; pl.setAttribute('aria-hidden', 'true'); pl.innerHTML = '<i class="pl-b"></i><i class="pl-a"></i>'; dlg.appendChild(pl);
      var A = $('.pl-a', pl), B = $('.pl-b', pl), tr = document.createElementNS(NS, 'svg'); tr.setAttribute('class', 'pl-trail'); tr.setAttribute('aria-hidden', 'true');
      var pd = 'M' + p0[0].toFixed(0) + ' ' + p0[1].toFixed(0) + ' C' + p1.join(' ') + ' ' + p2.join(' ') + ' ' + p3.join(' ');
      tr.innerHTML = '<defs><mask id="plM" maskUnits="userSpaceOnUse" x="-200" y="-200" width="' + (W + 400) + '" height="' + (H + 400) + '"><path d="' + pd + '" fill="none" stroke="#fff" stroke-width="8" pathLength="1" stroke-dasharray="1 1.02" stroke-dashoffset="1.01" class="pl-m"/></mask></defs><path class="pt-d" d="' + pd + '" mask="url(#plM)"/>';
      dlg.appendChild(tr);
      /* fold: sheet, corners in, dart, plane */
      var F = [0, 170, 320, 460], dur = 150;
      pl.style.transform = 'translate(' + p0[0].toFixed(0) + 'px,' + p0[1].toFixed(0) + 'px)';
      pl.animate([{ transform: 'translate(' + p0[0].toFixed(0) + 'px,' + (p0[1] + 30).toFixed(0) + 'px) scale(.3) rotate(-8deg)', opacity: 0 }, { transform: 'translate(' + p0[0].toFixed(0) + 'px,' + p0[1].toFixed(0) + 'px) scale(1) rotate(0deg)', opacity: 1 }], { duration: 180, easing: 'cubic-bezier(.3,1.4,.5,1)', fill: 'backwards' });
      [A, B].forEach(function(el, n){ var set = n ? SHAPES.b : SHAPES.a; el.style.clipPath = set[0];
        for (var s = 1; s < 4; s++) el.animate([{ clipPath: set[s - 1] }, { clipPath: set[s] }], { duration: dur, delay: F[s] - dur + 20, easing: 'cubic-bezier(.5,0,.3,1)', fill: 'forwards' }); });
      B.animate([{ filter: 'brightness(1)' }, { filter: 'brightness(.82)' }], { duration: 300, delay: 200, fill: 'forwards' });
      /* flight along a curve, nose along the tangent, leaving a dashed trail like the one on the page */
      var kf = [], N = 16, FLY = 700;
      for (var k = 0; k <= N; k++){ var t = k / N, e = t * t * (1.6 - 0.6 * t), q = bez(p0, p1, p2, p3, e), q2 = bez(p0, p1, p2, p3, Math.min(1, e + 0.02)), ang = Math.atan2(q2[1] - q[1], q2[0] - q[0]) * 180 / Math.PI;
        kf.push({ transform: 'translate(' + q[0].toFixed(1) + 'px,' + q[1].toFixed(1) + 'px) rotate(' + ang.toFixed(1) + 'deg) scale(' + (1 - t * 0.45).toFixed(3) + ')', opacity: t > 0.92 ? 0 : 1 }); }
      pl.animate(kf, { duration: FLY, delay: F[3] + 60, easing: 'linear', fill: 'forwards' });
      S.sfx && S.sfx('plane', { fold: F, fly: FLY, at: F[3] + 60, x: p0[0] / W });
      $('.pl-m', tr).animate([{ strokeDashoffset: 1.01 }, { strokeDashoffset: 0 }], { duration: FLY, delay: F[3] + 60, easing: 'cubic-bezier(.6,.1,.9,.6)', fill: 'forwards' });
      tr.animate([{ opacity: 1 }, { opacity: 1, offset: 0.7 }, { opacity: 0 }], { duration: FLY + 700, delay: F[3] + 60, fill: 'forwards' });
      S.track(kind === 'mail' ? 'write_back_email' : 'write_back_linkedin');
      setTimeout(function(){
        if (kind === 'mail'){ window.location.href = href; if (note) note.textContent = 'Your mail app should open with a reply started.'; }
        else { var w = null; try { w = window.open(href, '_blank'); if (w) w.opener = null; } catch (e){}
          if (note) note.innerHTML = w ? 'Opening LinkedIn in a new tab.' : 'Your browser blocked the new tab. <a href="' + href + '" target="_blank" rel="noopener">Open LinkedIn</a>'; }
      }, F[3] + 240);
      setTimeout(function(){ [pl, tr].forEach(function(x){ if (x.parentNode) x.parentNode.removeChild(x); }); }, F[3] + FLY + 900);
    }
    $$('.wb-b', dlg).forEach(function(a){ a.addEventListener('click', function(e){ if (reduce) return; e.preventDefault(); go(a); }); });
  });
})();
