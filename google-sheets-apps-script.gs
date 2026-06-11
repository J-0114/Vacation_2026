const SHEET_NAME = 'Assignments';

function doGet(e) {
  const params = e && e.parameter ? e.parameter : {};
  const callback = safeCallback(params.callback);
  const op = params.op || 'list';
  let payload;

  try {
    if (op === 'set') {
      const id = String(params.id || '').trim();
      const who = String(params.who || '').trim();
      if (!id) throw new Error('Missing id.');
      setAssignment(id, who);
      payload = { ok: true, id, who };
    } else {
      payload = { ok: true, assignments: getAssignments() };
    }
  } catch (err) {
    payload = { ok: false, error: err && err.message ? err.message : String(err) };
  }

  const body = callback
    ? callback + '(' + JSON.stringify(payload) + ');'
    : JSON.stringify(payload);
  const mime = callback
    ? ContentService.MimeType.JAVASCRIPT
    : ContentService.MimeType.JSON;

  return ContentService.createTextOutput(body).setMimeType(mime);
}

function getSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
    sheet.appendRow(['id', 'who', 'updated_at']);
  }
  return sheet;
}

function getAssignments() {
  const sheet = getSheet();
  const values = sheet.getDataRange().getValues();
  const assignments = {};

  for (let i = 1; i < values.length; i++) {
    const id = String(values[i][0] || '').trim();
    const who = String(values[i][1] || '').trim();
    if (id && who) assignments[id] = who;
  }

  return assignments;
}

function setAssignment(id, who) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const sheet = getSheet();
    const values = sheet.getDataRange().getValues();
    const now = new Date();

    for (let i = 1; i < values.length; i++) {
      if (String(values[i][0] || '').trim() === id) {
        sheet.getRange(i + 1, 2, 1, 2).setValues([[who, now]]);
        return;
      }
    }

    sheet.appendRow([id, who, now]);
  } finally {
    lock.releaseLock();
  }
}

function safeCallback(raw) {
  const callback = String(raw || '').trim();
  return /^[A-Za-z_$][A-Za-z0-9_$.]*$/.test(callback) ? callback : '';
}
