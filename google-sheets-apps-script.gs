const SHEET_NAME = 'Assignments';
const CHECKS_SHEET_NAME = 'Checks';

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
    } else if (op === 'setDone') {
      const id = String(params.id || '').trim();
      const done = parseDone(params.done);
      if (!id) throw new Error('Missing id.');
      setDone(id, done);
      payload = { ok: true, id, done };
    } else if (op === 'ensureDoneRows') {
      const ids = String(params.ids || '')
        .split(',')
        .map(id => id.trim())
        .filter(Boolean);
      ensureDoneRows(ids);
      payload = { ok: true, count: ids.length };
    } else {
      payload = { ok: true, assignments: getAssignments(), done: getDone() };
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
  return getOrCreateSheet(SHEET_NAME, ['id', 'who', 'updated_at']);
}

function getChecksSheet() {
  return getOrCreateSheet(CHECKS_SHEET_NAME, ['id', 'done', 'updated_at']);
}

function getOrCreateSheet(name, headers) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(name);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(name);
    sheet.appendRow(headers);
  } else if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
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
    if (id) assignments[id] = who;
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

function getDone() {
  const sheet = getChecksSheet();
  const values = sheet.getDataRange().getValues();
  const done = {};

  for (let i = 1; i < values.length; i++) {
    const id = String(values[i][0] || '').trim();
    if (id) done[id] = parseDone(values[i][1]);
  }

  return done;
}

function setDone(id, done) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const sheet = getChecksSheet();
    const values = sheet.getDataRange().getValues();
    const now = new Date();
    const stored = done ? 'checked' : 'not checked';

    for (let i = 1; i < values.length; i++) {
      if (String(values[i][0] || '').trim() === id) {
        sheet.getRange(i + 1, 2, 1, 2).setValues([[stored, now]]);
        return;
      }
    }

    sheet.appendRow([id, stored, now]);
  } finally {
    lock.releaseLock();
  }
}

function ensureDoneRows(ids) {
  if (!ids.length) return;

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const sheet = getChecksSheet();
    const values = sheet.getDataRange().getValues();
    const existing = {};
    const now = new Date();

    for (let i = 1; i < values.length; i++) {
      const id = String(values[i][0] || '').trim();
      if (id) existing[id] = true;
    }

    const rows = ids
      .filter(id => !existing[id])
      .map(id => [id, 'not checked', now]);

    if (rows.length) {
      sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, 3).setValues(rows);
    }
  } finally {
    lock.releaseLock();
  }
}

function safeCallback(raw) {
  const callback = String(raw || '').trim();
  return /^[A-Za-z_$][A-Za-z0-9_$.]*$/.test(callback) ? callback : '';
}

function parseDone(raw) {
  const value = String(raw || '').trim().toLowerCase();
  return value === 'checked' || value === 'true' || value === '1';
}
