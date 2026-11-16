/**
 * 나의 가계부 (bina) — Google Sheets 동기화 API
 * ------------------------------------------------------------------
 * 이 파일은 가계부 스프레드시트에 붙여서 쓰는 Apps Script입니다.
 *
 *  설치 (한 번만)
 *   1. 가계부 스프레드시트를 엽니다.
 *   2. 확장 프로그램 → Apps Script 를 누르고, 기본 코드(Code.gs)를 모두 지운 뒤
 *      이 파일 내용 전체를 붙여넣고 저장(Ctrl+S)합니다.
 *   3. 오른쪽 위 배포 → 새 배포 → 유형 '웹 앱'
 *        · 설명: bina sync
 *        · 다음 사용자로 실행: 나
 *        · 액세스 권한: 모든 사용자
 *      → 배포 → 권한 승인 → 나오는 '웹 앱 URL'(…/exec)을 복사합니다.
 *   4. 가계부 앱 https://eblovekk-blip.github.io/bina/ → 설정(⚙) →
 *      '구글 시트 연동' 칸에 그 URL을 붙여넣고 [연결 및 동기화]를 누릅니다.
 *
 *  코드를 고친 뒤에는 배포 → 배포 관리 → 수정(연필) → 버전 '새 버전' → 배포
 *  로 다시 배포해야 웹 앱 URL에 반영됩니다. (URL은 그대로 유지됩니다)
 *
 *  시트 규격
 *   · entries : id | date | type | amount | category | method | memo | createdAt
 *       - id: 문자열 고유값, date: 'YYYY-MM-DD', type: 'expense' | 'income'
 *       - amount: 원 단위 정수, category/method 는 앱의 허용 목록 참고
 *       - createdAt: 밀리초 타임스탬프(숫자)
 *   · budgets : month | amount
 *       - month: 'YYYY-MM', amount: 원 단위 정수 (0 이하이거나 비우면 예산 없음)
 *   열 순서가 달라도 머리글 이름을 보고 읽고 씁니다.
 *
 *  응답 (모두 JSON)
 *   · GET  ?action=list  → { ok:true, entries:[…], budgets:{…}, count, updatedAt }
 *   · POST { action:'upsertEntry', entry:{…} }
 *          { action:'upsertEntries', entries:[…] }
 *          { action:'deleteEntry', id:'…' }
 *          { action:'setBudget', month:'2026-11', amount:1200000 }
 *          { action:'bulkSync', entries:[…], budgets:{…} }
 *      → { ok:true, action:'…', …결과 }
 *   · 실패는 { ok:false, error:'…' } 로 돌려줍니다.
 */

var ENTRIES_SHEET = 'entries';
var BUDGETS_SHEET = 'budgets';
var ENTRY_HEADER = ['id', 'date', 'type', 'amount', 'category', 'method', 'memo', 'createdAt'];
var BUDGET_HEADER = ['month', 'amount'];

/* =========================================================
   진입점
========================================================= */
function doGet(e) {
  try {
    var action = ((e && e.parameter && e.parameter.action) || 'list').toString();
    if (action === 'list' || action === 'ping') {
      var snap = readAll_();
      return json_({
        ok: true,
        action: 'list',
        count: snap.entries.length,
        entries: snap.entries,
        budgets: snap.budgets,
        updatedAt: new Date().toISOString()
      });
    }
    return json_({ ok: false, error: '알 수 없는 action: ' + action });
  } catch (err) {
    return json_({ ok: false, error: errText_(err) });
  }
}

function doPost(e) {
  var lock = null;
  try {
    var body = {};
    if (e && e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    } else if (e && e.parameter && e.parameter.payload) {
      body = JSON.parse(e.parameter.payload);
    }
    var action = (body.action || (e && e.parameter && e.parameter.action) || '').toString();
    if (!action) throw new Error('action이 없어요');

    lock = LockService.getScriptLock();
    lock.waitLock(30000);

    var out;
    switch (action) {
      case 'upsertEntry':
        out = upsertEntry_(body.entry);
        break;
      case 'upsertEntries':
        out = bulkSync_({ entries: body.entries });
        break;
      case 'deleteEntry':
        out = deleteEntry_(body.id);
        break;
      case 'setBudget':
        out = setBudget_(body.month, body.amount);
        break;
      case 'bulkSync':
        out = bulkSync_(body);
        break;
      case 'list':
        var snap = readAll_();
        out = { count: snap.entries.length, entries: snap.entries, budgets: snap.budgets };
        break;
      default:
        throw new Error('알 수 없는 action: ' + action);
    }
    return json_(merge_({ ok: true, action: action, at: new Date().toISOString() }, out));
  } catch (err) {
    return json_({ ok: false, error: errText_(err) });
  } finally {
    if (lock) {
      try { lock.releaseLock(); } catch (ignore) {}
    }
  }
}

/* =========================================================
   시트 읽기
========================================================= */
function readAll_() {
  var entries = [];
  var es = sheet_(ENTRIES_SHEET, ENTRY_HEADER);
  var em = headerMap_(es);
  var last = es.getLastRow();
  if (last > 1) {
    var width = Math.max(es.getLastColumn(), 1);
    var vals = es.getRange(2, 1, last - 1, width).getValues();
    for (var i = 0; i < vals.length; i++) {
      var row = vals[i];
      var id = trim_(cell_(row, em.id));
      if (!id) continue; // 빈 줄은 건너뛴다
      var date = ymd_(cell_(row, em.date));
      var amount = Math.round(Number(cell_(row, em.amount)) || 0);
      if (!date || amount <= 0) continue; // 값이 깨진 줄은 무시
      var createdAt = Number(cell_(row, em.createdAt)) || 0;
      if (!createdAt) createdAt = dateMs_(date);
      entries.push({
        id: id,
        date: date,
        type: trim_(cell_(row, em.type)) === 'income' ? 'income' : 'expense',
        amount: amount,
        category: trim_(cell_(row, em.category)) || '기타',
        method: trim_(cell_(row, em.method)) || '카드',
        memo: cell_(row, em.memo) == null ? '' : String(cell_(row, em.memo)),
        createdAt: createdAt
      });
    }
  }

  var budgets = {};
  var bs = sheet_(BUDGETS_SHEET, BUDGET_HEADER);
  var bm = headerMap_(bs);
  var blast = bs.getLastRow();
  if (blast > 1) {
    var bwidth = Math.max(bs.getLastColumn(), 1);
    var bvals = bs.getRange(2, 1, blast - 1, bwidth).getValues();
    for (var j = 0; j < bvals.length; j++) {
      var month = trim_(cell_(bvals[j], bm.month));
      if (!/^\d{4}-\d{2}$/.test(month)) continue;
      var amt = Math.round(Number(cell_(bvals[j], bm.amount)) || 0);
      if (amt > 0) budgets[month] = amt;
    }
  }
  return { entries: entries, budgets: budgets };
}

/* =========================================================
   시트 쓰기
========================================================= */
function upsertEntry_(entry) {
  if (!entry || !trim_(entry.id)) throw new Error('entry.id 가 필요해요');
  var sh = sheet_(ENTRIES_SHEET, ENTRY_HEADER);
  var map = headerMap_(sh);
  var e = normalizeEntry_(entry);
  var row = rowForEntry_(map, e);
  var target = idRowMap_(sh, map)[e.id];
  if (target) {
    sh.getRange(target, 1, 1, row.length).setValues([row]);
    return { written: 1, mode: 'update', row: target, id: e.id };
  }
  var start = Math.max(sh.getLastRow(), 1) + 1;
  sh.getRange(start, 1, 1, row.length).setValues([row]);
  return { written: 1, mode: 'append', row: start, id: e.id };
}

function deleteEntry_(id) {
  var key = trim_(id);
  if (!key) throw new Error('삭제할 id 가 필요해요');
  var sh = sheet_(ENTRIES_SHEET, ENTRY_HEADER);
  var map = headerMap_(sh);
  var target = idRowMap_(sh, map)[key];
  if (!target) return { deleted: 0, id: key };
  sh.deleteRow(target);
  return { deleted: 1, id: key };
}

function setBudget_(month, amount) {
  var m = trim_(month);
  if (!/^\d{4}-\d{2}$/.test(m)) throw new Error('month 는 2026-11 형식이어야 해요');
  var sh = sheet_(BUDGETS_SHEET, BUDGET_HEADER);
  var map = headerMap_(sh);
  var amt = Math.round(Number(amount) || 0);
  var target = monthRow_(sh, map, m);

  if (amt <= 0) {
    if (target) {
      sh.deleteRow(target);
      return { month: m, amount: 0, mode: 'deleted' };
    }
    return { month: m, amount: 0, mode: 'noop' };
  }
  if (target) {
    if (map.amount) sh.getRange(target, map.amount).setValue(amt);
    return { month: m, amount: amt, mode: 'update' };
  }
  var width = Math.max(widthOf_(map), 2);
  var row = blankRow_(width);
  set_(row, map.month, m);
  set_(row, map.amount, amt);
  var start = Math.max(sh.getLastRow(), 1) + 1;
  sh.getRange(start, 1, 1, width).setValues([row]);
  return { month: m, amount: amt, mode: 'append' };
}

function bulkSync_(body) {
  body = body || {};
  var list = Array.isArray(body.entries) ? body.entries : [];
  var budgets = (body.budgets && typeof body.budgets === 'object') ? body.budgets : {};
  var added = 0;
  var updated = 0;

  if (list.length) {
    var sh = sheet_(ENTRIES_SHEET, ENTRY_HEADER);
    var map = headerMap_(sh);
    var rows = idRowMap_(sh, map);
    var width = Math.max(widthOf_(map), 1);
    var appends = [];
    for (var i = 0; i < list.length; i++) {
      var e = normalizeEntry_(list[i]);
      if (!e.amount) continue;
      var row = rowForEntry_(map, e);
      var rowIdx = rows[e.id];
      if (rowIdx > 0) {
        sh.getRange(rowIdx, 1, 1, width).setValues([padRow_(row, width)]);
        updated++;
      } else if (rowIdx === undefined) {
        appends.push(padRow_(row, width));
        rows[e.id] = -1; // 같은 요청 안에서 중복 추가 방지
      }
    }
    if (appends.length) {
      var start = Math.max(sh.getLastRow(), 1) + 1;
      sh.getRange(start, 1, appends.length, width).setValues(appends);
      added = appends.length;
    }
  }

  var months = Object.keys(budgets);
  var budgetDone = 0;
  for (var b = 0; b < months.length; b++) {
    try {
      setBudget_(months[b], budgets[months[b]]);
      budgetDone++;
    } catch (err) {
      // 한 달이 실패해도 나머지는 계속 진행한다
    }
  }
  return { added: added, updated: updated, budgets: budgetDone };
}

/* =========================================================
   시트 · 헤더 유틸
========================================================= */
function ss_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    throw new Error('스프레드시트에 연결되지 않았어요. 가계부 시트의 [확장 프로그램 → Apps Script]에서 만든 스크립트인지 확인해 주세요.');
  }
  return ss;
}

function tz_() {
  return ss_().getSpreadsheetTimeZone() || 'Asia/Seoul';
}

function sheet_(name, header) {
  var ss = ss_();
  var sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  var last = sh.getLastRow();
  var hasHeader = false;
  if (last >= 1 && sh.getLastColumn() >= 1) {
    var first = sh.getRange(1, 1, 1, Math.max(sh.getLastColumn(), 1)).getValues()[0];
    for (var i = 0; i < first.length; i++) {
      if (trim_(first[i])) { hasHeader = true; break; }
    }
  }
  if (!hasHeader) {
    sh.getRange(1, 1, 1, header.length).setValues([header]).setFontWeight('bold');
    try { sh.setFrozenRows(1); } catch (ignore) {}
    prepareColumns_(sh, header);
  }
  return sh;
}

/** 날짜·월 열을 문자 서식으로 두어 'YYYY-MM-DD' 가 날짜로 바뀌지 않게 한다. */
function prepareColumns_(sh, header) {
  var dateCols = [];
  for (var i = 0; i < header.length; i++) {
    if (header[i] === 'date' || header[i] === 'month') dateCols.push(i + 1);
  }
  for (var c = 0; c < dateCols.length; c++) {
    try {
      sh.getRange(2, dateCols[c], Math.max(sh.getMaxRows() - 1, 1), 1).setNumberFormat('@');
    } catch (ignore) {}
  }
}

function headerMap_(sh) {
  var map = {};
  var lastCol = sh.getLastColumn();
  if (lastCol < 1) return map;
  var head = sh.getRange(1, 1, 1, lastCol).getValues()[0];
  for (var i = 0; i < head.length; i++) {
    var key = trim_(head[i]);
    if (key && map[key] === undefined) map[key] = i + 1; // 1부터 시작하는 열 번호
  }
  return map;
}

function widthOf_(map) {
  var w = 0;
  for (var k in map) {
    if (Object.prototype.hasOwnProperty.call(map, k) && map[k] > w) w = map[k];
  }
  return w;
}

function idRowMap_(sh, map) {
  var out = {};
  var last = sh.getLastRow();
  if (last < 2 || !map.id) return out;
  var ids = sh.getRange(2, map.id, last - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    var id = trim_(ids[i][0]);
    if (id && out[id] === undefined) out[id] = i + 2;
  }
  return out;
}

function monthRow_(sh, map, month) {
  var last = sh.getLastRow();
  if (last < 2 || !map.month) return 0;
  var vals = sh.getRange(2, map.month, last - 1, 1).getValues();
  for (var i = 0; i < vals.length; i++) {
    if (trim_(vals[i][0]) === month) return i + 2;
  }
  return 0;
}

/* =========================================================
   값 유틸
========================================================= */
function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function errText_(err) {
  if (!err) return '알 수 없는 오류';
  return String(err.message || err);
}

function merge_(a, b) {
  a = a || {};
  b = b || {};
  for (var k in b) {
    if (Object.prototype.hasOwnProperty.call(b, k)) a[k] = b[k];
  }
  return a;
}

function trim_(v) {
  return v == null ? '' : String(v).trim();
}

function pad2_(v) {
  var s = String(v);
  return s.length < 2 ? '0' + s : s;
}

function cell_(row, col) {
  return col ? row[col - 1] : undefined;
}

function set_(row, col, value) {
  if (col) row[col - 1] = value;
}

function blankRow_(width) {
  var row = [];
  for (var i = 0; i < width; i++) row.push('');
  return row;
}

function padRow_(row, width) {
  var out = row.slice(0, width);
  while (out.length < width) out.push('');
  return out;
}

/** 셀 값을 'YYYY-MM-DD' 문자열로. Date 객체·문자열·숫자(날짜 서식) 모두 처리. */
function ymd_(v) {
  if (v === null || v === undefined || v === '') return '';
  if (Object.prototype.toString.call(v) === '[object Date]') {
    if (isNaN(v.getTime())) return '';
    return Utilities.formatDate(v, tz_(), 'yyyy-MM-dd');
  }
  if (typeof v === 'number') {
    // 시트에서 숫자로 저장된 날짜(엑셀 직렬값)도 받아 준다
    var base = new Date(Date.UTC(1899, 11, 30));
    var d = new Date(base.getTime() + Math.round(v) * 86400000);
    if (isNaN(d.getTime())) return '';
    return Utilities.formatDate(d, 'Etc/UTC', 'yyyy-MM-dd');
  }
  var s = trim_(v);
  var m = s.match(/^(\d{4})\D{1,2}(\d{1,2})\D{1,2}(\d{1,2})/);
  if (m) return m[1] + '-' + pad2_(m[2]) + '-' + pad2_(m[3]);
  if (/^\d{8}$/.test(s)) return s.slice(0, 4) + '-' + s.slice(4, 6) + '-' + s.slice(6, 8);
  return '';
}

function dateMs_(ymd) {
  var p = String(ymd).split('-');
  if (p.length !== 3) return Date.now();
  return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]), 9, 0, 0).getTime();
}

function normalizeEntry_(e) {
  e = e || {};
  var date = ymd_(e.date) || Utilities.formatDate(new Date(), tz_(), 'yyyy-MM-dd');
  var amount = Math.round(Math.abs(Number(e.amount)) || 0);
  return {
    id: trim_(e.id) || ('gs_' + Utilities.getUuid().replace(/-/g, '').slice(0, 12)),
    date: date,
    type: trim_(e.type) === 'income' ? 'income' : 'expense',
    amount: amount,
    category: trim_(e.category) || '기타',
    method: trim_(e.method) || '카드',
    memo: e.memo == null ? '' : String(e.memo),
    createdAt: Number(e.createdAt) || dateMs_(date)
  };
}

function rowForEntry_(map, e) {
  var width = Math.max(widthOf_(map), ENTRY_HEADER.length);
  var row = blankRow_(width);
  set_(row, map.id, e.id);
  set_(row, map.date, e.date);
  set_(row, map.type, e.type);
  set_(row, map.amount, e.amount);
  set_(row, map.category, e.category);
  set_(row, map.method, e.method);
  set_(row, map.memo, e.memo);
  set_(row, map.createdAt, e.createdAt);
  return row;
}

/* =========================================================
   시트 메뉴 (선택 사항)
========================================================= */
function onOpen() {
  try {
    SpreadsheetApp.getUi()
      .createMenu('가계부 동기화')
      .addItem('시트 구조 점검 (헤더 만들기)', 'setupSheets')
      .addItem('웹 앱 URL 확인', 'showWebAppUrl')
      .addToUi();
  } catch (ignore) {}
}

function setupSheets() {
  sheet_(ENTRIES_SHEET, ENTRY_HEADER);
  sheet_(BUDGETS_SHEET, BUDGET_HEADER);
  ss_().toast('entries · budgets 탭과 머리글을 확인했어요.', '가계부 동기화', 4);
}

function showWebAppUrl() {
  var msg;
  try {
    var url = ScriptApp.getService().getUrl();
    msg = url ? url : '아직 웹 앱으로 배포되지 않았어요.\n배포 → 새 배포 → 유형 "웹 앱" 으로 배포해 주세요.';
  } catch (err) {
    msg = '웹 앱 URL을 읽지 못했어요: ' + errText_(err);
  }
  try {
    SpreadsheetApp.getUi().alert(msg);
  } catch (ignore) {}
}
