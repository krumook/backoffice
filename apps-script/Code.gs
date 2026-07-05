/**
 * krumook — Apps Script API กลาง (อ่าน–เขียน Google Sheets)
 * ------------------------------------------------------------------
 * เป็นตัวเดียวที่แตะ Google Sheets โดยตรง ให้ 2 ฝั่งเรียก: บอท Discord + เว็บหลังบ้าน
 * spec ฉบับเต็มดูที่ DB-API-REFERENCE.md · สรุปฝั่งเว็บดูที่ UI-BRIEF.md
 *
 * วิธี deploy:
 *   1) สร้าง Google Sheet ชื่อ krumook-db (หรือรัน setupSheets() ให้สร้างแท็บ+หัวคอลัมน์ให้)
 *   2) Extensions → Apps Script → วางไฟล์นี้
 *   3) Project Settings → Script Properties:
 *        API_SECRET = <รหัสลับที่ครูจะกรอกในเว็บ>   (จำเป็น)
 *        SHEET_ID   = <id ของสเปรดชีต>              (ทางเลือก ถ้าไม่ตั้งใช้ Active)
 *   4) (ครั้งแรก) รันฟังก์ชัน setupSheets() 1 ครั้งเพื่อสร้างแท็บ + หัวคอลัมน์
 *   5) Deploy → New deployment → Web app · Execute as Me · Who has access Anyone
 *        → ได้ URL /exec ไปใส่ใน CONFIG.API_URL ของเว็บ และ .env ของบอท
 *
 * ⚠️ API_SECRET อยู่ใน Script Properties เท่านั้น — ไม่อยู่ในโค้ด/เว็บ (repo public ได้)
 */

// ---------- schema: ชื่อแท็บ + หัวคอลัมน์ (ห้ามแทรกกลาง เพิ่มได้เฉพาะท้าย) ----------
var SCHEMA = {
  codes:         ['code', 'product', 'status', 'used_by_discord', 'email', 'used_at', 'created_at'],
  registrations: ['timestamp', 'discord_id', 'name', 'nickname', 'age', 'school', 'email', 'code', 'product', 'status', 'link_sent', 'approved_at', 'note'],
  products:      ['product', 'product_name', 'youtube_link'],
  qa_quota:      ['discord_id', 'date', 'count', 'premium_until'],
  slips:         ['timestamp', 'discord_id', 'slip_url', 'amount', 'status', 'reviewed_at'],
  config:        ['key', 'value'],
};

var TZ = 'Asia/Bangkok';

// ==================================================================
//  Entry points
// ==================================================================

function doPost(e) {
  var action = '';
  try {
    var body = (e && e.postData && e.postData.contents) ? JSON.parse(e.postData.contents) : {};
    action = body.action || '';

    if (!verifyKey_(body.key)) return json_({ ok: false, reason: 'unauthorized' });

    return json_(route_(action, body));
  } catch (err) {
    return json_({ ok: false, reason: 'server_error', message: String(err && err.message || err) });
  }
}

function doGet() {
  return json_({ ok: true, service: 'krumook-api', ts: nowIso_() });
}

function route_(action, body) {
  switch (action) {
    // ฝั่งลงทะเบียน (บอท)
    case 'checkAndRegister': return checkAndRegister_(body);
    case 'addCode':          return addCode_(body);
    case 'pollApproved':     return pollApproved_();
    case 'markSent':         return markSent_(body);

    // ฝั่งเว็บ: คิว/อนุมัติ
    case 'listPending':      return listPending_();
    case 'listRegistrations': return listRegistrations_(body);
    case 'getRegistration':  return getRegistration_(body);
    case 'approve':          return approve_(body);
    case 'reject':           return reject_(body);

    // ฝั่งเว็บ: สินค้า
    case 'listProducts':     return listProducts_();
    case 'addProduct':       return addProduct_(body);
    case 'updateProduct':    return updateProduct_(body);

    // ฝั่งเว็บ: รหัส
    case 'generateCodes':    return generateCodes_(body);
    case 'addCodesBatch':    return addCodesBatch_(body);
    case 'listCodes':        return listCodes_(body);
    case 'getCodeInfo':      return getCodeInfo_(body);

    // เฟส C: โควต้า + สลิป
    case 'checkQuota':       return checkQuota_(body);
    case 'useQuota':         return useQuota_(body);
    case 'submitSlip':       return submitSlip_(body);
    case 'listSlips':        return listSlips_();
    case 'approveSlip':      return approveSlip_(body);

    default: return { ok: false, reason: 'unknown_action' };
  }
}

// ==================================================================
//  คิว / อนุมัติ (เว็บ)
// ==================================================================

function listPending_() {
  var rows = readTable_('registrations');
  var items = rows.filter(function (r) { return r.status === 'pending'; }).map(function (r) {
    return {
      row: r._row, timestamp: r.timestamp, name: r.name, nickname: r.nickname,
      school: r.school, email: r.email, code: r.code, product: r.product,
    };
  });
  return { ok: true, items: items };
}

function listRegistrations_(body) {
  var search = String(body.search || '').trim().toLowerCase();
  var status = body.status || '';
  var approvedFrom = body.approved_from || '';
  var approvedTo = body.approved_to || '';

  var productNames = {};
  readTable_('products').forEach(function (p) { productNames[p.product] = p.product_name; });

  var rows = readTable_('registrations').filter(function (r) { return r.timestamp !== '' || r.code !== ''; });
  if (status) rows = rows.filter(function (r) { return r.status === status; });
  if (approvedFrom || approvedTo) {
    rows = rows.filter(function (r) {
      if (!r.approved_at) return false;
      var d = String(r.approved_at).slice(0, 10);
      if (approvedFrom && d < approvedFrom) return false;
      if (approvedTo && d > approvedTo) return false;
      return true;
    });
  }
  if (search) {
    rows = rows.filter(function (r) {
      var hay = [r.name, r.nickname, r.email, r.code, r.discord_id, r.school, r.product].join(' ').toLowerCase();
      return hay.indexOf(search) !== -1;
    });
  }

  var items = rows.map(function (r) {
    return {
      row: r._row, timestamp: r.timestamp, discord_id: r.discord_id,
      name: r.name, nickname: r.nickname, age: r.age, school: r.school,
      email: r.email, code: r.code, product: r.product,
      product_name: productNames[r.product] || '',
      status: r.status, link_sent: r.link_sent, approved_at: r.approved_at, note: r.note,
    };
  });
  items.sort(function (a, b) { return String(b.timestamp).localeCompare(String(a.timestamp)); });
  return { ok: true, count: items.length, items: items };
}

function getRegistration_(body) {
  var row = Number(body.row);
  if (!row) return { ok: false, reason: 'bad_request' };
  var r = getRowObj_('registrations', row);
  if (!r || r.timestamp === '' && r.code === '') return { ok: false, reason: 'notfound' };
  var prod = findRow_('products', 'product', r.product);
  return {
    ok: true, item: {
      row: row, timestamp: r.timestamp, discord_id: r.discord_id,
      name: r.name, nickname: r.nickname, age: r.age, school: r.school,
      email: r.email, code: r.code, product: r.product,
      product_name: prod ? prod.product_name : '',
      youtube_link: prod ? prod.youtube_link : '',
      status: r.status, link_sent: r.link_sent, approved_at: r.approved_at, note: r.note,
    },
  };
}

function approve_(body) {
  var row = Number(body.row);
  if (!row) return { ok: false, reason: 'bad_request' };
  var r = getRowObj_('registrations', row);
  if (!r) return { ok: false, reason: 'notfound' };
  var at = nowIso_();
  updateRow_('registrations', row, { status: 'approved', approved_at: at });
  return { ok: true, status: 'approved', approved_at: at };
}

function reject_(body) {
  var row = Number(body.row);
  if (!row) return { ok: false, reason: 'bad_request' };
  var r = getRowObj_('registrations', row);
  if (!r) return { ok: false, reason: 'notfound' };
  updateRow_('registrations', row, { status: 'rejected', note: body.reason || '', approved_at: nowIso_() });
  // คืนรหัสในแท็บ codes กลับเป็น unused
  if (r.code) {
    var c = findRow_('codes', 'code', String(r.code).toUpperCase());
    if (c) updateRow_('codes', c._row, { status: 'unused', used_by_discord: '', email: '', used_at: '' });
  }
  return { ok: true };
}

// ==================================================================
//  สินค้า (เว็บ)
// ==================================================================

function listProducts_() {
  var rows = readTable_('products');
  var items = rows.filter(function (r) { return r.product !== ''; }).map(function (r) {
    return { row: r._row, product: r.product, product_name: r.product_name, youtube_link: r.youtube_link };
  });
  return { ok: true, items: items };
}

function addProduct_(body) {
  var product = String(body.product || '').trim().toUpperCase();
  if (!product) return { ok: false, reason: 'bad_request' };
  if (findRow_('products', 'product', product)) return { ok: false, reason: 'duplicate' };
  appendRow_('products', { product: product, product_name: body.product_name || '', youtube_link: body.youtube_link || '' });
  return { ok: true, product: product };
}

function updateProduct_(body) {
  var row = Number(body.row);
  if (!row) return { ok: false, reason: 'bad_request' };
  var changes = {};
  if (body.product_name != null) changes.product_name = body.product_name;
  if (body.youtube_link != null) changes.youtube_link = body.youtube_link;
  updateRow_('products', row, changes);
  return { ok: true };
}

// ==================================================================
//  รหัส (เว็บ)
// ==================================================================

function generateCodes_(body) {
  var product = String(body.product || '').trim().toUpperCase();
  var amount = Number(body.amount);
  if (!product || !amount) return { ok: false, reason: 'bad_request' };
  if (amount < 1 || amount > 500) return { ok: false, reason: 'bad_request' };
  if (!findRow_('products', 'product', product)) return { ok: false, reason: 'product_notfound' };

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sh = getSheet_('codes');
    var existing = {};
    readTable_('codes').forEach(function (r) { existing[String(r.code).toUpperCase()] = true; });

    var codes = [];
    var guard = 0;
    while (codes.length < amount && guard < amount * 50) {
      guard++;
      var c = product + '-' + randBlock_() + '-' + randBlock_();
      if (existing[c]) continue;
      existing[c] = true;
      codes.push(c);
    }
    var now = nowIso_();
    var rows = codes.map(function (c) { return [c, product, 'unused', '', '', '', now]; });
    if (rows.length) sh.getRange(sh.getLastRow() + 1, 1, rows.length, SCHEMA.codes.length).setValues(rows);
    return { ok: true, product: product, amount: codes.length, codes: codes };
  } finally {
    lock.releaseLock();
  }
}

function addCodesBatch_(body) {
  var product = String(body.product || '').trim().toUpperCase();
  var codes = body.codes || [];
  if (!product || !codes.length) return { ok: false, reason: 'bad_request' };
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var existing = {};
    readTable_('codes').forEach(function (r) { existing[String(r.code).toUpperCase()] = true; });
    var now = nowIso_();
    var rows = [];
    codes.forEach(function (raw) {
      var c = String(raw).trim().toUpperCase();
      if (!c || existing[c]) return;
      existing[c] = true;
      rows.push([c, product, 'unused', '', '', '', now]);
    });
    if (rows.length) getSheet_('codes').getRange(getSheet_('codes').getLastRow() + 1, 1, rows.length, SCHEMA.codes.length).setValues(rows);
    return { ok: true, added: rows.length };
  } finally {
    lock.releaseLock();
  }
}

function listCodes_(body) {
  var product = body.product ? String(body.product).toUpperCase() : '';
  var status = body.status || '';
  var rows = readTable_('codes').filter(function (r) { return r.code !== ''; });
  if (product) rows = rows.filter(function (r) { return String(r.product).toUpperCase() === product; });
  if (status) rows = rows.filter(function (r) { return r.status === status; });
  var items = rows.map(function (r) {
    return { code: r.code, product: r.product, status: r.status, used_by_discord: r.used_by_discord, used_at: r.used_at };
  });
  return { ok: true, count: items.length, items: items };
}

function getCodeInfo_(body) {
  var code = String(body.code || '').trim().toUpperCase();
  if (!code) return { ok: false, reason: 'bad_request' };
  var c = findRow_('codes', 'code', code);
  if (!c) return { ok: false, reason: 'notfound' };
  var user = null;
  if (c.status === 'used') {
    var reg = findRow_('registrations', 'code', code);
    if (reg) user = {
      row: reg._row, name: reg.name, nickname: reg.nickname, school: reg.school,
      registration_status: reg.status, link_sent: reg.link_sent,
    };
  }
  return {
    ok: true, item: {
      code: c.code, product: c.product, status: c.status,
      used_by_discord: c.used_by_discord, email: c.email, used_at: c.used_at, user: user,
    },
  };
}

// ==================================================================
//  ลงทะเบียน (บอท)
// ==================================================================

function checkAndRegister_(body) {
  var code = String(body.code || '').trim().toUpperCase();
  if (!code) return { ok: false, reason: 'bad_request' };
  var c = findRow_('codes', 'code', code);
  if (!c) return { ok: false, reason: 'notfound' };
  if (c.status === 'used') return { ok: false, reason: 'used' };

  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    // อ่านซ้ำใน lock กัน race
    c = findRow_('codes', 'code', code);
    if (!c) return { ok: false, reason: 'notfound' };
    if (c.status === 'used') return { ok: false, reason: 'used' };

    updateRow_('codes', c._row, {
      status: 'used', used_by_discord: String(body.discord_id || ''), email: body.email || '', used_at: nowIso_(),
    });
    var newRow = appendRow_('registrations', {
      timestamp: nowIso_(), discord_id: String(body.discord_id || ''), name: body.name || '',
      nickname: body.nickname || '', age: String(body.age || ''), school: body.school || '',
      email: body.email || '', code: code, product: c.product, status: 'pending',
      link_sent: 'no', approved_at: '', note: '',
    });
    return { ok: true, product: c.product, row: newRow };
  } finally {
    lock.releaseLock();
  }
}

function addCode_(body) {
  var code = String(body.code || '').trim().toUpperCase();
  var discordId = String(body.discord_id || '');
  if (!code || !discordId) return { ok: false, reason: 'bad_request' };
  var prev = lastRegistrationOf_(discordId);
  if (!prev) return { ok: false, reason: 'no_profile' };

  var c = findRow_('codes', 'code', code);
  if (!c) return { ok: false, reason: 'notfound' };
  if (c.status === 'used') return { ok: false, reason: 'used' };

  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    c = findRow_('codes', 'code', code);
    if (c.status === 'used') return { ok: false, reason: 'used' };
    updateRow_('codes', c._row, { status: 'used', used_by_discord: discordId, email: prev.email, used_at: nowIso_() });
    var newRow = appendRow_('registrations', {
      timestamp: nowIso_(), discord_id: discordId, name: prev.name, nickname: prev.nickname,
      age: prev.age, school: prev.school, email: prev.email, code: code, product: c.product,
      status: 'pending', link_sent: 'no', approved_at: '', note: '',
    });
    return { ok: true, product: c.product, row: newRow };
  } finally {
    lock.releaseLock();
  }
}

function pollApproved_() {
  var rows = readTable_('registrations');
  var items = rows.filter(function (r) { return r.status === 'approved' && r.link_sent !== 'yes'; }).map(function (r) {
    var prod = findRow_('products', 'product', r.product);
    return { row: r._row, discord_id: r.discord_id, nickname: r.nickname, product: r.product, youtube_link: prod ? prod.youtube_link : '' };
  });
  return { ok: true, items: items };
}

function markSent_(body) {
  var row = Number(body.row);
  if (!row) return { ok: false, reason: 'bad_request' };
  updateRow_('registrations', row, { link_sent: 'yes' });
  return { ok: true };
}

// ==================================================================
//  โควต้า + สลิป (เฟส C)
// ==================================================================

function checkQuota_(body) {
  var id = String(body.discord_id || '');
  if (!id) return { ok: false, reason: 'bad_request' };
  var limit = Number(getConfig_('daily_quota') || 2);
  var today = todayStr_();
  var rows = readTable_('qa_quota');
  var count = 0, premium = false;
  rows.forEach(function (r) {
    if (String(r.discord_id) !== id) return;
    if (r.premium_until && new Date(r.premium_until).getTime() >= Date.now()) premium = true;
    if (r.date === today) count = Number(r.count) || 0;
  });
  return { ok: true, count: count, limit: limit, premium: premium };
}

function useQuota_(body) {
  var id = String(body.discord_id || '');
  if (!id) return { ok: false, reason: 'bad_request' };
  var today = todayStr_();
  var rows = readTable_('qa_quota');
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i].discord_id) === id && rows[i].date === today) {
      updateRow_('qa_quota', rows[i]._row, { count: (Number(rows[i].count) || 0) + 1 });
      return { ok: true };
    }
  }
  appendRow_('qa_quota', { discord_id: id, date: today, count: 1, premium_until: '' });
  return { ok: true };
}

function submitSlip_(body) {
  if (!body.discord_id) return { ok: false, reason: 'bad_request' };
  appendRow_('slips', {
    timestamp: nowIso_(), discord_id: String(body.discord_id), slip_url: body.slip_url || '',
    amount: body.amount || '', status: 'pending', reviewed_at: '',
  });
  return { ok: true };
}

function listSlips_() {
  var rows = readTable_('slips');
  var items = rows.filter(function (r) { return r.status === 'pending'; }).map(function (r) {
    return { row: r._row, timestamp: r.timestamp, discord_id: r.discord_id, slip_url: r.slip_url, amount: r.amount };
  });
  return { ok: true, items: items };
}

function approveSlip_(body) {
  var row = Number(body.row);
  if (!row) return { ok: false, reason: 'bad_request' };
  var s = getRowObj_('slips', row);
  if (!s) return { ok: false, reason: 'notfound' };
  updateRow_('slips', row, { status: 'approved', reviewed_at: nowIso_() });
  // เปิดสิทธิ์ถามเพิ่มถึงสิ้นเดือน
  appendRow_('qa_quota', { discord_id: String(s.discord_id), date: '', count: 0, premium_until: endOfMonthIso_() });
  return { ok: true };
}

// ==================================================================
//  Helpers: Sheets
// ==================================================================

function getSpreadsheet_() {
  var id = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  return id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActiveSpreadsheet();
}

function getSheet_(name) {
  var sh = getSpreadsheet_().getSheetByName(name);
  if (!sh) throw new Error('ไม่พบแท็บ "' + name + '" — รัน setupSheets() ก่อน');
  return sh;
}

/** อ่านทั้งตารางเป็น array ของ object + _row (เลขแถวจริง) */
function readTable_(name) {
  var sh = getSheet_(name);
  var last = sh.getLastRow();
  if (last < 2) return [];
  var headers = SCHEMA[name];
  var values = sh.getRange(2, 1, last - 1, headers.length).getValues();
  return values.map(function (rowVals, i) {
    var obj = { _row: i + 2 };
    headers.forEach(function (h, c) { obj[h] = normVal_(rowVals[c]); });
    return obj;
  });
}

function getRowObj_(name, row) {
  var sh = getSheet_(name);
  if (row < 2 || row > sh.getLastRow()) return null;
  var headers = SCHEMA[name];
  var vals = sh.getRange(row, 1, 1, headers.length).getValues()[0];
  var obj = { _row: row };
  headers.forEach(function (h, i) { obj[h] = normVal_(vals[i]); });
  return obj;
}

function appendRow_(name, obj) {
  var sh = getSheet_(name);
  var headers = SCHEMA[name];
  var row = headers.map(function (h) { return obj.hasOwnProperty(h) ? obj[h] : ''; });
  sh.appendRow(row);
  return sh.getLastRow();
}

function updateRow_(name, row, changes) {
  var sh = getSheet_(name);
  var headers = SCHEMA[name];
  Object.keys(changes).forEach(function (k) {
    var col = headers.indexOf(k);
    if (col >= 0) sh.getRange(row, col + 1).setValue(changes[k]);
  });
}

function findRow_(name, key, value) {
  var rows = readTable_(name);
  var target = String(value).trim().toLowerCase();
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i][key]).trim().toLowerCase() === target) return rows[i];
  }
  return null;
}

function lastRegistrationOf_(discordId) {
  var rows = readTable_('registrations');
  for (var i = rows.length - 1; i >= 0; i--) {
    if (String(rows[i].discord_id) === String(discordId)) return rows[i];
  }
  return null;
}

function getConfig_(key) {
  var r = findRow_('config', 'key', key);
  return r ? r.value : '';
}

// ==================================================================
//  Helpers: misc
// ==================================================================

function verifyKey_(key) {
  var secret = PropertiesService.getScriptProperties().getProperty('API_SECRET');
  return !!secret && !!key && String(key) === String(secret);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function normVal_(v) {
  if (v === null || v === undefined) return '';
  if (v instanceof Date) return v.toISOString();
  return v;
}

function nowIso_() { return new Date().toISOString(); }
function todayStr_() { return Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd'); }
function endOfMonthIso_() {
  var n = new Date();
  return new Date(n.getFullYear(), n.getMonth() + 1, 0, 23, 59, 59).toISOString();
}
function randBlock_() {
  var s = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // ตัด 0,O,1,I กันสับสนบนการ์ด
  var out = '';
  for (var i = 0; i < 4; i++) out += s.charAt(Math.floor(Math.random() * s.length));
  return out;
}

// ==================================================================
//  setup — รันครั้งเดียวจาก editor เพื่อสร้างแท็บ + หัวคอลัมน์
// ==================================================================

function setupSheets() {
  var ss = getSpreadsheet_();
  Object.keys(SCHEMA).forEach(function (name) {
    var sh = ss.getSheetByName(name) || ss.insertSheet(name);
    var headers = SCHEMA[name];
    sh.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
    sh.setFrozenRows(1);
    // ป้องกัน discord_id ถูกปัดเป็นเลขวิทยาศาสตร์: บังคับ Plain text
    ['registrations', 'codes', 'qa_quota', 'slips'].forEach(function () {});
  });
  // จัดคอลัมน์ discord_id เป็น Plain text
  forceTextColumn_('registrations', 'discord_id');
  forceTextColumn_('codes', 'used_by_discord');
  forceTextColumn_('qa_quota', 'discord_id');
  forceTextColumn_('slips', 'discord_id');
  // ค่า config เริ่มต้น
  if (!findRow_('config', 'key', 'daily_quota')) appendRow_('config', { key: 'daily_quota', value: '2' });
  SpreadsheetApp.getActiveSpreadsheet().toast('setupSheets เสร็จแล้ว');
}

function forceTextColumn_(name, col) {
  var sh = getSpreadsheet_().getSheetByName(name);
  if (!sh) return;
  var idx = SCHEMA[name].indexOf(col);
  if (idx >= 0) sh.getRange(1, idx + 1, sh.getMaxRows(), 1).setNumberFormat('@');
}
