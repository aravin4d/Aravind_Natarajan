/**
 * Summit register backend: Google Apps Script + a Google Sheet. Private by design.
 *
 * What changed in Wave 4: the register is no longer a public guestbook. Visitors write their name at the
 * summit and it comes to this Sheet only. doGet() returns nothing but { ok: true }, so nobody can read
 * the names back out through the web app URL, and doPost() never echoes a name or a count.
 *
 * Setup, or updating an existing deployment (full notes in README.md):
 *   1. Open your Sheet → Extensions → Apps Script. Replace all the code with this file. Save.
 *   2. Run setup() once from the editor (pick it in the function menu, press Run, allow access).
 *      It creates the "Register" tab if needed, moves it to the front, and logs the Sheet's link.
 *   3. Run testWrite() once. A test row appears on the Register tab. Delete it afterwards.
 *   4. Deploy → Manage deployments → pencil icon (Edit) → Version: New version → Deploy.
 *      Editing the existing deployment keeps the same /exec URL. "New deployment" would give you a new URL.
 *
 * Working from a standalone script (script.google.com) instead of one opened from the Sheet?
 *   Paste the Sheet's ID (the long part of its URL between /d/ and /edit) into SHEET_ID below.
 */
var SHEET_ID = '';            // leave empty when the script was opened from the Sheet itself
var SHEET = 'Register';
var MAX_NAME = 40, MAX_FROM = 40, MAX_NOTE = 140, MIN_MS = 2500, PER_MINUTE = 20;
var HEAD = ['when', 'name', 'from', 'note', 'theme', 'secrets found', 'page'];

function book_(){
  var ss = SHEET_ID ? SpreadsheetApp.openById(SHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('No spreadsheet. Open this script from the Sheet (Extensions → Apps Script), or set SHEET_ID.');
  return ss;
}
function sheet_(){
  var ss = book_(), sh = ss.getSheetByName(SHEET);
  if (!sh){ sh = ss.insertSheet(SHEET, 0); }
  if (sh.getLastRow() === 0){ sh.appendRow(HEAD); sh.setFrozenRows(1); sh.getRange(1, 1, 1, HEAD.length).setFontWeight('bold'); }
  return sh;
}

function setup(){
  var ss = book_(), sh = sheet_();
  ss.setActiveSheet(sh); ss.moveActiveSheet(1);
  Logger.log('Signatures go to the "%s" tab (now the first tab) of %s', SHEET, ss.getUrl());
}

/* run this from the editor to check that rows really land, then delete the test row */
function testWrite(){
  var sh = sheet_();
  sh.appendRow([new Date(), 'Test from the editor', '', 'Delete me', '', '', '']);
  Logger.log('Wrote a test row to "%s" in %s. Delete it when you have seen it.', SHEET, book_().getUrl());
}

/* nothing personal ever leaves the Sheet */
function doGet(){ return json_({ ok: true }); }

function doPost(e){
  try {
    var b;
    try { b = JSON.parse((e && e.postData && e.postData.contents) || '{}'); } catch (x){ return json_({ ok: false, error: 'bad_json' }); }
    if (b.website) return json_({ ok: true });                  // the honeypot: bots get a polite nothing
    if (!(Number(b.t) >= MIN_MS)) return json_({ ok: false, error: 'too_fast' });
    var name = clean_(b.name, MAX_NAME), from = clean_(b.from, MAX_FROM), note = clean_(b.note, MAX_NOTE);
    if (!name) return json_({ ok: false, error: 'name' });
    if (/(https?:|www\.|\.[a-z]{2,}\/)/i.test(name + ' ' + from + ' ' + note)) return json_({ ok: false, error: 'links' });
    var theme = /^(night|morning|dusk)$/.test(String(b.theme)) ? String(b.theme) : '';
    var secrets = Math.max(0, Math.min(9, parseInt(b.secrets, 10) || 0)), page = clean_(b.page, 80);
    var cache = CacheService.getScriptCache(), k = 'rl' + Math.floor(Date.now() / 60000), c = parseInt(cache.get(k) || '0', 10);
    if (c >= PER_MINUTE) return json_({ ok: false, error: 'rate' });
    cache.put(k, String(c + 1), 120);
    var lock = LockService.getScriptLock();
    if (!lock.tryLock(5000)) return json_({ ok: false, error: 'busy' });
    try { sheet_().appendRow([new Date(), cell_(name), cell_(from), cell_(note), theme, secrets, cell_(page)]); }
    finally { lock.releaseLock(); }
    return json_({ ok: true });
  } catch (err){
    console.error(err);
    return json_({ ok: false, error: 'server' });
  }
}

function clean_(s, n){ return String(s == null ? '' : s).replace(/[\u0000-\u001F\u007F\u200B-\u200F\u2028-\u202E\u2066-\u2069]/g, '').replace(/\s+/g, ' ').trim().slice(0, n); }
/* a value starting with = + - or @ would run as a formula in the Sheet, so it's stored as plain text */
function cell_(s){ return /^[=+\-@]/.test(s) ? "'" + s : s; }
function json_(o){ return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
