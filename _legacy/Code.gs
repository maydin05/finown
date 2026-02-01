/**
 * FinOwn - Apps Script Backend (TABLE MODE)
 * Each dataset is stored in its own sheet as rows/columns (header in row 1).
 */

function doGet() {
  return HtmlService.createHtmlOutputFromFile("index")
    .setTitle("FinOwn")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// -------------------- Public API --------------------
function getAllData() {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    return {
      banks: _readTable_("banks", _schema_banks()),
      products: _readTable_("products", _schema_products()),
      payments: _readTable_("payments", _schema_payments()),
      expenseSources: _readTable_("expenseSources", _schema_expenseSources()),
      subscriptionSources: _readTable_("subscriptionSources", _schema_subscriptionSources()),
      incomeSources: _readTable_("incomeSources", _schema_incomeSources()),
      statusTracker: _readKV_("statusTracker"),
      subscriptionTracker: _readKV_("subscriptionTracker"),
    };
  } finally {
    lock.releaseLock();
  }
}

function saveAllData(payload) {
  if (!payload) throw new Error("Payload boş geldi.");

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    payload.banks = payload.banks || [];
    payload.products = payload.products || [];
    payload.payments = payload.payments || [];
    payload.expenseSources = payload.expenseSources || [];
    payload.subscriptionSources = payload.subscriptionSources || [];
    payload.incomeSources = payload.incomeSources || [];
    payload.statusTracker = payload.statusTracker || {};
    payload.subscriptionTracker = payload.subscriptionTracker || {};

    _writeTable_("banks", _schema_banks(), payload.banks);
    _writeTable_("products", _schema_products(), payload.products);
    _writeTable_("payments", _schema_payments(), payload.payments);
    _writeTable_("expenseSources", _schema_expenseSources(), payload.expenseSources);
    _writeTable_("subscriptionSources", _schema_subscriptionSources(), payload.subscriptionSources);
    _writeTable_("incomeSources", _schema_incomeSources(), payload.incomeSources);

    _writeKV_("statusTracker", payload.statusTracker);
    _writeKV_("subscriptionTracker", payload.subscriptionTracker);

    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

// -------------------- Spreadsheet helpers --------------------
function _ss_() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function _getOrCreateSheet_(name) {
  var ss = _ss_();
  var sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  // TABLE MODE: gizleme yok.
  return sh;
}

// -------------------- Schemas (column order = header order) --------------------
function _schema_banks() {
  return [
    { key: "id", type: "number" },
    { key: "name", type: "string" },
    { key: "color", type: "string" },
  ];
}

function _schema_products() {
  return [
    { key: "id", type: "number" },
    { key: "bankId", type: "number" },
    { key: "type", type: "string" }, // card|loan
    { key: "name", type: "string" },

    // card fields
    { key: "cardType", type: "string" }, // physical|virtual
    { key: "last4Digits", type: "string" },
    { key: "limit", type: "number" },
    { key: "cutoffDay", type: "number" },
    { key: "paymentDueDay", type: "number" },

    // loan fields
    { key: "total", type: "number" },
    { key: "remaining", type: "number" },
    { key: "installment", type: "number" },
    { key: "totalInstallments", type: "number" },
    { key: "startDate", type: "string" },
  ];
}

function _schema_payments() {
  return [
    { key: "id", type: "number" },
    { key: "title", type: "string" },
    { key: "subtitle", type: "string" },
    { key: "amount", type: "number" },
    { key: "dueDate", type: "string" }, // ISO
    { key: "type", type: "string" }, // card|loan
    { key: "isPaid", type: "bool" },
    { key: "productId", type: "string" }, // keep string (some ids compared as String)
  ];
}

function _schema_expenseSources() {
  return [
    { key: "id", type: "number" },
    { key: "title", type: "string" },
    { key: "amount", type: "number" },
    { key: "type", type: "string" }, // recurring|one-time
    { key: "category", type: "string" },
    { key: "date", type: "string" }, // one-time ISO
    { key: "startDate", type: "string" }, // recurring YYYY-MM-DD
    { key: "dayOfMonth", type: "number" },
    { key: "endDate", type: "string" }, // YYYY-MM-DD
    { key: "note", type: "string" },
  ];
}

function _schema_incomeSources() {
  return [
    { key: "id", type: "number" },
    { key: "title", type: "string" },
    { key: "amount", type: "number" },
    { key: "type", type: "string" },
    { key: "category", type: "string" },
    { key: "date", type: "string" },
    { key: "startDate", type: "string" },
    { key: "dayOfMonth", type: "number" },
    { key: "endDate", type: "string" },
    { key: "note", type: "string" },
  ];
}

function _schema_subscriptionSources() {
  return [
    { key: "id", type: "number" },
    { key: "title", type: "string" },
    { key: "amount", type: "number" },
    { key: "type", type: "string" },
    { key: "date", type: "string" },
    { key: "startDate", type: "string" },
    { key: "dayOfMonth", type: "number" },
    { key: "endDate", type: "string" },
    // paymentMethod is object in UI; we flatten it:
    { key: "paymentMethodType", type: "string" },  // bank|manual
    { key: "paymentMethodValue", type: "string" }, // bankId or text
    { key: "relatedCardId", type: "string" },
    { key: "note", type: "string" },
  ];
}

// -------------------- Table read/write --------------------
function _ensureHeader_(sh, schema) {
  var header = schema.map(s => s.key);
  var existing = sh.getRange(1, 1, 1, Math.max(1, sh.getLastColumn())).getValues()[0];
  var same = header.length === existing.length && header.every((h, i) => String(existing[i] || "").trim() === h);

  if (!same) {
    sh.clearContents();
    sh.getRange(1, 1, 1, header.length).setValues([header]);
  }
}

function _readTable_(sheetName, schema) {
  var sh = _getOrCreateSheet_(sheetName);
  _ensureHeader_(sh, schema);

  var lastRow = sh.getLastRow();
  var lastCol = schema.length;
  if (lastRow < 2) return [];

  var values = sh.getRange(2, 1, lastRow - 1, lastCol).getValues();
  var out = [];

  values.forEach(row => {
    // empty row skip
    if (row.every(c => c === "" || c === null)) return;

    var obj = {};
    schema.forEach((col, idx) => {
      obj[col.key] = _coerceFromSheet_(row[idx], col.type);
    });

    // subscription: unflatten paymentMethod back to object so UI keeps working
    if (sheetName === "subscriptionSources") {
      obj.paymentMethod = { type: obj.paymentMethodType || "bank", value: obj.paymentMethodValue || "" };
      delete obj.paymentMethodType;
      delete obj.paymentMethodValue;
    }

    out.push(obj);
  });

  return out;
}

function _writeTable_(sheetName, schema, rows) {
  var sh = _getOrCreateSheet_(sheetName);
  _ensureHeader_(sh, schema);

  // normalize for subscriptionSources: flatten paymentMethod
  var normalized = (rows || []).map(obj => {
    var x = Object.assign({}, obj);

    if (sheetName === "subscriptionSources") {
      x.paymentMethodType = (x.paymentMethod && x.paymentMethod.type) ? x.paymentMethod.type : "bank";
      x.paymentMethodValue = (x.paymentMethod && x.paymentMethod.value) ? x.paymentMethod.value : "";
      delete x.paymentMethod;
    }

    return x;
  });

  // write data area
  sh.getRange(2, 1, Math.max(1, sh.getMaxRows() - 1), schema.length).clearContent();

  if (!normalized.length) return;

  var data = normalized.map(obj => schema.map(col => _coerceToSheet_(obj[col.key], col.type)));
  sh.getRange(2, 1, data.length, schema.length).setValues(data);

  // trim extra rows if too many
  var neededRows = data.length + 1;
  if (sh.getMaxRows() > neededRows) {
    sh.deleteRows(neededRows + 1, sh.getMaxRows() - neededRows);
  }
}

// -------------------- Key/Value tracker read/write --------------------
function _kvHeader_(sh) {
  var h = sh.getRange(1,1,1,2).getValues()[0];
  if (h[0] !== "key" || h[1] !== "value") {
    sh.clearContents();
    sh.getRange(1,1,1,2).setValues([["key","value"]]);
  }
}

function _readKV_(sheetName) {
  var sh = _getOrCreateSheet_(sheetName);
  _kvHeader_(sh);

  var lastRow = sh.getLastRow();
  if (lastRow < 2) return {};

  var values = sh.getRange(2,1,lastRow-1,2).getValues();
  var obj = {};
  values.forEach(r => {
    var k = String(r[0] || "").trim();
    if (!k) return;
    obj[k] = _coerceFromSheet_(r[1], "bool"); // stored as TRUE/FALSE
  });
  return obj;
}

function _writeKV_(sheetName, kvObj) {
  var sh = _getOrCreateSheet_(sheetName);
  _kvHeader_(sh);

  sh.getRange(2,1,Math.max(1, sh.getMaxRows()-1),2).clearContent();

  var keys = Object.keys(kvObj || {});
  if (!keys.length) return;

  var data = keys.map(k => [k, !!kvObj[k]]);
  sh.getRange(2,1,data.length,2).setValues(data);

  var neededRows = data.length + 1;
  if (sh.getMaxRows() > neededRows) {
    sh.deleteRows(neededRows + 1, sh.getMaxRows() - neededRows);
  }
}

// -------------------- Type coercion --------------------
function _coerceFromSheet_(v, type) {
  if (v === "" || v === null || typeof v === "undefined") {
    if (type === "number") return 0;
    if (type === "bool") return false;
    return "";
  }
  if (type === "number") return Number(v || 0);
  if (type === "bool") return v === true || String(v).toLowerCase() === "true" || String(v).toUpperCase() === "TRUE";
  return String(v);
}

function _coerceToSheet_(v, type) {
  if (type === "number") return Number(v || 0);
  if (type === "bool") return !!v;
  return v == null ? "" : String(v);
}
