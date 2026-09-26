/* W3-09 the summit register. Real summits keep a notebook in a tin at the top; this one does too.
   It appears once you reach the summit, and only when a backend is connected (data-endpoint on #reg):
   a Google Apps Script web app or a Cloudflare Worker, both in /backend. Without one it stays hidden,
   except locally (or with ?register), where it runs as a preview that saves to this browser only.
   Everything people write is shown with textContent, never as HTML. */
(function(){
  'use strict';
  var S = window.__site; if (!S) return;
  var $ = S.$, box = document.getElementById('reg'); if (!box) return;
  var EP = (box.getAttribute('data-endpoint') || '').trim();
  var local = location.protocol === 'file:' || /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || /[?&]register\b/.test(location.search);
  if (!EP && !local) return;
  var preview = !EP, book = $('.reg-book', box), tin = $('.reg-tin', box), list = $('.reg-list', box), form = $('.reg-f', box), st = $('.reg-st', box), cnt = $('.reg-n', box), go = form && $('button[type="submit"]', form);
  if (!book || !tin || !list || !form) return;
  var opened = 0, loaded = 0, busy = false, total = 0, DEMO = 'av-reg-demo', DAY = 'av-reg-day';
  var MSG = { too_fast: 'That was quick. Give it a second and try again.', links: 'No links in the register, please.', rate: 'The register’s busy. Try again in a minute.', name: 'Add your name first.', busy: 'The register’s busy. Try again in a moment.' };
  function clean(s, n){ return String(s || '').replace(/[\u0000-\u001F\u007F\u200B-\u200F\u2028-\u202E\u2066-\u2069]/g, '').replace(/\s+/g, ' ').trim().slice(0, n); }
  function today(){ var d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function fmt(ts){ var d = new Date(ts); if (isNaN(d)) return ''; return d.getDate() + ' ' + ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()] + ' ' + d.getFullYear(); }
  function status(t){ if (st) st.textContent = t; }
  function li(e, fresh){ var l = document.createElement('li'); if (fresh) l.className = 'new';
    var n = document.createElement('span'); n.className = 'rn'; n.textContent = e.name; l.appendChild(n);
    if (e.from){ var f = document.createElement('span'); f.className = 'rf'; f.textContent = ', ' + e.from; l.appendChild(f); }
    var d = document.createElement('small'); d.textContent = fmt(e.ts); l.appendChild(d);
    if (e.note){ var t = document.createElement('span'); t.className = 'rt'; t.textContent = e.note; l.appendChild(t); }
    return l; }
  function empty(){ var l = document.createElement('li'); l.className = 'empty'; l.textContent = 'Nobody has signed yet. Be the first.'; return l; }
  function counted(n){ total = n; if (cnt) cnt.textContent = n === 0 ? '' : n === 1 ? '1 person has signed this register' : n.toLocaleString('en-IN') + ' people have signed this register'; }
  function render(es){ list.textContent = ''; if (!es.length) list.appendChild(empty()); else es.forEach(function(e){ list.appendChild(li(e)); }); }
  function demo(){ try { return JSON.parse(localStorage.getItem(DEMO) || '[]') || []; } catch (e){ return []; } }
  function load(){
    loaded = Date.now();
    if (preview){ var d = demo(); render(d); counted(d.length); return; }
    list.setAttribute('aria-busy', 'true');
    fetch(EP + (EP.indexOf('?') < 0 ? '?' : '&') + 'limit=30', { cache: 'no-store' }).then(function(r){ return r.json(); }).then(function(j){
      list.removeAttribute('aria-busy'); if (!j || !j.ok) throw 0; render(j.entries || []); counted(j.count || (j.entries || []).length);
    }).catch(function(){ list.removeAttribute('aria-busy'); list.textContent = ''; var l = document.createElement('li'); l.className = 'empty'; l.textContent = 'The register is out of reach right now. Try again soon.'; list.appendChild(l); });
  }
  function send(b){
    if (preview){ var d = demo(); d.unshift({ ts: new Date().toISOString(), name: b.name, from: b.from, note: b.note }); try { localStorage.setItem(DEMO, JSON.stringify(d.slice(0, 30))); } catch (e){}
      return new Promise(function(res){ setTimeout(function(){ res({ ok: true, count: d.length }); }, 450); }); }
    return fetch(EP, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(b) }).then(function(r){ return r.json(); });
  }
  function open(v){
    tin.setAttribute('aria-expanded', v ? 'true' : 'false'); book.hidden = !v; box.classList.toggle('open', v);
    if (v){ opened = Date.now(); if (!loaded || Date.now() - loaded > 60000) load(); S.sfx('unfold', { n: 2, at: 0, st: 90, u: 260 }); S.track('register_open'); }
  }
  tin.addEventListener('click', function(){ open(book.hidden); });
  form.addEventListener('submit', function(e){
    e.preventDefault(); if (busy) return;
    var name = clean(form.elements.name.value, 40), from = clean(form.elements.from.value, 40), note = clean(form.elements.note.value, 120), hp = form.elements.website ? form.elements.website.value : '';
    if (!name){ status(MSG.name); form.elements.name.focus(); return; }
    if (hp){ status('Signed. See you at the top.'); form.reset(); return; }
    var day = ''; try { day = localStorage.getItem(DAY) || ''; } catch (x){}
    if (day === today()){ status('You’ve signed today already. Come back tomorrow.'); return; }
    var entry = { ts: new Date().toISOString(), name: name, from: from, note: note }, el = li(entry, true), emp = $('.empty', list);
    if (emp) emp.parentNode.removeChild(emp); list.insertBefore(el, list.firstChild); list.scrollTop = 0;
    busy = true; if (go) go.disabled = true; status('Signing…'); S.sfx('pen', { plan: [[0, 520, 0], [560, 380, 0]] });
    send({ name: name, from: from, note: note, website: hp, t: Date.now() - opened }).then(function(j){
      busy = false; if (go) go.disabled = false;
      if (j && j.ok){ try { localStorage.setItem(DAY, today()); } catch (x){} form.reset(); status(j.pending ? 'Signed. It’ll show up here soon.' : 'Signed. See you at the top.'); counted(j.count || total + 1); S.track('register_sign'); }
      else { if (el.parentNode) el.parentNode.removeChild(el); status((j && MSG[j.error]) || 'The register didn’t take it. Try again in a bit.'); }
    }, function(){ busy = false; if (go) go.disabled = false; if (el.parentNode) el.parentNode.removeChild(el); status('Couldn’t reach the register. Try again in a bit.'); });
  });
  function show(){ var pk = $('.sm-peak'), pn = $('.reg-peak', box), al = $('.sm-alt'), ra = $('.reg-alt', box);
    if (pk && pn && pk.textContent.trim()) pn.textContent = pk.textContent.trim(); if (al && ra) ra.textContent = al.textContent.trim();
    box.hidden = false; var pv = $('.reg-pv', box); if (pv) pv.hidden = !preview; requestAnimationFrame(function(){ box.classList.add('live'); }); }
  var sm = document.getElementById('summit');
  if (sm && sm.classList.contains('made')) show(); else document.addEventListener('summit:reached', function(){ setTimeout(show, 60); });
  document.addEventListener('timechange', function(){ if (!box.hidden) show(); });
  window.__register = { open: open, load: load, preview: preview };
})();
