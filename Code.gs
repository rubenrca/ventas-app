// ============================================
// Sistema de Gestión de Ventas — Backend
// Google Apps Script (Web App)
// ============================================

const SPREADSHEET_ID = '1-5yGnFyaqVRXFw_SCylWXRo8pWU7rYxgioU9_hk4BfI';

// Nombres de las hojas
const SHEET_VENTAS = 'Ventas';
const SHEET_CATALOGO = 'Catalogo';

// Mapeo de prefijo a vendedora
const SELLERS = { E: 'Erica', V: 'Verónica', EV: 'Ambas' };

function sellerFromCode(codigo) {
  if (codigo.length >= 2 && SELLERS[codigo.slice(0, 2)]) {
    return SELLERS[codigo.slice(0, 2)];
  }
  return SELLERS[codigo.charAt(0)] || null;
}

// ---- Entry Point ----

function doGet(e) {
  const action = e.parameter.action;
  const data = e.parameter.data;

  try {
    switch (action) {
      case 'getVentas':
        return jsonResponse({ success: true, data: getVentas() });
      case 'getCatalogo':
        return jsonResponse({ success: true, data: getCatalogo() });
      case 'addVenta':
        return jsonResponse(addVenta(data));
      case 'addProducto':
        return jsonResponse(addProducto(data));
      case 'updateProducto':
        return jsonResponse(updateProducto(data));
      case 'deleteProducto':
        return jsonResponse(deleteProducto(data));
      default:
        return errorResponse('Acción no válida: ' + action);
    }
  } catch (err) {
    return errorResponse(err.message);
  }
}

// ---- Read Operations ----

function getVentas() {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_VENTAS);
  return sheetToJson(sheet);
}

function getCatalogo() {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_CATALOGO);
  return sheetToJson(sheet);
}

// ---- Write Operations ----

function addVenta(dataJson) {
  if (!dataJson) return { success: false, error: 'No se recibieron datos' };

  const d = JSON.parse(decodeURIComponent(dataJson));

  // Validar campos requeridos
  if (!d.codigo_producto || !d.nombre_clienta || d.monto_pagado === undefined || !d.metodo_pago) {
    return { success: false, error: 'Faltan campos requeridos' };
  }

  const codigo = d.codigo_producto.trim().toUpperCase();
  const vendedora = sellerFromCode(codigo);

  if (!vendedora) {
    return { success: false, error: 'Código debe empezar con E, V o EV' };
  }

  const fecha = d.fecha || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
  const montoPagado = parseFloat(d.monto_pagado) || 0;
  const montoDeuda = parseFloat(d.monto_deuda) || 0;

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_VENTAS);
    sheet.appendRow([
      fecha,
      codigo,
      d.nombre_producto || '',
      vendedora,
      d.nombre_clienta.trim(),
      montoPagado,
      montoDeuda,
      d.metodo_pago
    ]);
  } finally {
    lock.releaseLock();
  }

  return { success: true };
}

function addProducto(dataJson) {
  if (!dataJson) return { success: false, error: 'No se recibieron datos' };

  const d = JSON.parse(decodeURIComponent(dataJson));

  if (!d.codigo || !d.nombre || d.precio === undefined) {
    return { success: false, error: 'Faltan campos requeridos (codigo, nombre, precio)' };
  }

  const codigo = d.codigo.trim().toUpperCase();
  const vendedora = sellerFromCode(codigo);

  if (!vendedora) {
    return { success: false, error: 'Código debe empezar con E, V o EV' };
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_CATALOGO);
    const data = sheet.getDataRange().getValues();

    // Verificar duplicado
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim().toUpperCase() === codigo) {
        return { success: false, error: 'El código ' + codigo + ' ya existe en el catálogo' };
      }
    }

    sheet.appendRow([
      codigo,
      d.nombre.trim(),
      parseFloat(d.precio) || 0,
      vendedora
    ]);
  } finally {
    lock.releaseLock();
  }

  return { success: true };
}

function updateProducto(dataJson) {
  if (!dataJson) return { success: false, error: 'No se recibieron datos' };

  const d = JSON.parse(decodeURIComponent(dataJson));

  if (!d.codigo || !d.nombre || d.precio === undefined) {
    return { success: false, error: 'Faltan campos requeridos' };
  }

  const codigo = d.codigo.trim().toUpperCase();
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_CATALOGO);
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim().toUpperCase() === codigo) {
        sheet.getRange(i + 1, 2).setValue(d.nombre.trim());
        sheet.getRange(i + 1, 3).setValue(parseFloat(d.precio) || 0);
        return { success: true };
      }
    }

    return { success: false, error: 'Producto no encontrado' };
  } finally {
    lock.releaseLock();
  }
}

function deleteProducto(dataJson) {
  if (!dataJson) return { success: false, error: 'No se recibieron datos' };

  const d = JSON.parse(decodeURIComponent(dataJson));

  if (!d.codigo) return { success: false, error: 'Falta el código' };

  const codigo = d.codigo.trim().toUpperCase();
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_CATALOGO);
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim().toUpperCase() === codigo) {
        sheet.deleteRow(i + 1);
        return { success: true };
      }
    }

    return { success: false, error: 'Producto no encontrado' };
  } finally {
    lock.releaseLock();
  }
}

// ---- Helpers ----

function sheetToJson(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];

  const headers = data[0].map(h => String(h).trim().toLowerCase());
  const rows = [];

  for (let i = 1; i < data.length; i++) {
    const row = {};
    for (let j = 0; j < headers.length; j++) {
      let val = data[i][j];
      // Convertir fechas de Google Sheets a string
      if (val instanceof Date) {
        val = Utilities.formatDate(val, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
      }
      row[headers[j]] = val;
    }
    rows.push(row);
  }

  return rows;
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function errorResponse(msg) {
  return jsonResponse({ success: false, error: msg });
}
