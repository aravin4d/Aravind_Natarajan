/**
 * Summit register backend: Google Apps Script + a Google Sheet. Free, and you can moderate from the Sheet.
 *
 * Setup (about five minutes, full notes in README.md):
 *   1. Create a Google Sheet. Extensions → Apps Script. Replace the code with this file. Save.
 *   2. Run setup() once from the editor and allow access. It creates the "Register" tab.
 *   3. Deploy → New deployment → Web app. Execute as: Me. Who has access: Anyone. Deploy.
 *   4. Copy the web app URL (it ends in /exec) into data-endpoint on <div id="reg"> in index.html.
 *
 * Moderation: every signature is a row. Untick "show" (or delete the row) to hide one.
 * Set AUTO_APPROVE to false if you'd rather approve each signature by ticking "show" yourself.
 */
var SHEET = 'Register';
var AUTO_APPROVE = true;
var LIMIT = 30, MAX_NAME = 40, MAX_FROM = 40, MAX_NOTE = 120, MIN_MS = 2500, PER_MINUTE = 12;

function setup(){
  var ss = SpreadsheetApp.getActiveSpreadsheet(), sh = ss.getSheetByName(SHEET) || ss.insertSheet(SHEET);
  if (sh.getLastRow() === 0) sh.appendRow(['when', 'name', 'from', 'note', 'show']);
  sh.setFrozenRows(1);
  sh.getRange('E2:E').insertCheckboxes();
}

function doGet(e){
  var lim = Math.min(LIMIT, Math.max(1, parseInt((e && e.parameter && e.parameter.limit) || LIMIT, 10) || LIMIT));
  var cache = CacheService.getScriptCache(), hit = cache.get('list'), data = hit ? JSON.parse(hit) : null;
  if (!data){ data = read(); cache.put('list', JSON.stringify(data), 60); }
  return json({ ok: true, entries: data.entries.slice(0, lim), count: data.count });
}

function read(){
  var sh = sheet(), n = sh.getLastRow() - 1, out = [], count = 0;
  if (n > 0){
    var rows = sh.getRange(2, 1, n, 5).getValues();
    for (var i = rows.length - 1; i >= 0; i--){
      var r = rows[i]; if (!(r[4] === true || String(r[4]).toUpperCase() === 'TRUE')) continue;
      count++;
      if (out.length < LIMIT) out.push({ ts: new Date(r[0]).toISOString(), name: String(r[1]), from: String(r[2] || ''), note: String(r[3] || '') });
    }
  }
  return { entries: out, count: count };
}

function doPost(e){
  var b;
  try { b = JSON.parse((e && e.postData && e.postData.contents) || '{}'); } catch (x){ return json({ ok: false, error: 'bad_json' }); }
  if (b.website) return json({ ok: true, entry: null });            // the honeypot: bots get a polite nothing
  if (!(Number(b.t) >= MIN_MS)) return json({ ok: false, error: 'too_fast' });
  var name = clean(b.name, MAX_NAME), from = clean(b.from, MAX_FROM), note = clean(b.note, MAX_NOTE);
  if (!name) return json({ ok: false, error: 'name' });
  if (/(https?:|www\.|\.[a-z]{2,}\/)/i.test(name + ' ' + from + ' ' + note)) return json({ ok: false, error: 'links' });
  var cache = CacheService.getScriptCache(), k = 'rl' + Math.floor(Date.now() / 60000), c = parseInt(cache.get(k) || '0', 10);
  if (c >= PER_MINUTE) return json({ ok: false, error: 'rate' });
  cache.put(k, String(c + 1), 120);
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return json({ ok: false, error: 'busy' });
  try {
    var now = new Date();
    sheet().appendRow([now, cell(name), cell(from), cell(note), AUTO_APPROVE]);
    cache.remove('list');
    var total = read().count;
    return json({ ok: true, pending: !AUTO_APPROVE, count: total, entry: AUTO_APPROVE ? { ts: now.toISOString(), name: name, from: from, note: note } : null });
  } finally { lock.releaseLock(); }
}

function clean(s, n){ return String(s == null ? '' : s).replace(/[\u0000-\u001F\u007F\u200B-\u200F\u2028-\u202E\u2066-\u2069]/g, '').replace(/\s+/g, ' ').trim().slice(0, n); }
/* a value starting with = + - or @ would run as a formula in the Sheet, so it's stored as plain text */
function cell(s){ return /^[=+\-@]/.test(s) ? "'" + s : s; }
function sheet(){ var ss = SpreadsheetApp.getActiveSpreadsheet(), sh = ss.getSheetByName(SHEET); if (!sh){ setup(); sh = ss.getSheetByName(SHEET); } return sh; }
function json(o){ return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
