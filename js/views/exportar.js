window.ViewExportar = (function () {

  function init() {
    var container = document.getElementById('view-exportar');
    container.innerHTML =
      '<h2 class="section-title">Exportar Datos</h2>' +
      '<p class="section-subtitle">Descarga un archivo Excel con las ventas separadas por vendedora y un resumen general.</p>' +

      '<div class="card">' +
        '<div style="text-align:center; padding: var(--spacing-md) 0;">' +
          '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width:48px;height:48px;margin:0 auto 16px;color:var(--color-success);"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>' +
          '<p style="margin-bottom:16px;color:var(--color-text-muted);font-size:var(--font-size-sm);">El archivo incluirá 3 hojas:<br><strong>Ventas Erica</strong> · <strong>Ventas Verónica</strong> · <strong>Resumen General</strong></p>' +
          '<button class="btn btn-success btn-block" id="btn-exportar">' +
            'Descargar Excel (.xlsx)' +
          '</button>' +
        '</div>' +
      '</div>';

    document.getElementById('btn-exportar').addEventListener('click', exportData);
  }

  function exportData() {
    var ventas = AppState.get('ventas');

    if (!ventas || ventas.length === 0) {
      Toast.show('No hay ventas para exportar', 'error');
      return;
    }

    var ventasErica = [];
    var ventasVeronica = [];
    var totalErica = { count: 0, cobrado: 0, deuda: 0 };
    var totalVeronica = { count: 0, cobrado: 0, deuda: 0 };

    ventas.forEach(function (v) {
      var row = {
        'Fecha': v.fecha || '',
        'Código': v.codigo_producto || '',
        'Producto': v.nombre_producto || '',
        'Vendedora': v.vendedora || '',
        'Clienta': v.nombre_clienta || '',
        'Monto Pagado': parseFloat(v.monto_pagado) || 0,
        'Monto Deuda': parseFloat(v.monto_deuda) || 0,
        'Método Pago': v.metodo_pago || ''
      };

      if (v.vendedora === 'Erica') {
        ventasErica.push(row);
        totalErica.count++;
        totalErica.cobrado += row['Monto Pagado'];
        totalErica.deuda += row['Monto Deuda'];
      } else {
        ventasVeronica.push(row);
        totalVeronica.count++;
        totalVeronica.cobrado += row['Monto Pagado'];
        totalVeronica.deuda += row['Monto Deuda'];
      }
    });

    var resumen = [
      {
        'Vendedora': 'Erica',
        'Total Ventas': totalErica.count,
        'Total Cobrado': totalErica.cobrado,
        'Total Deuda': totalErica.deuda
      },
      {
        'Vendedora': 'Verónica',
        'Total Ventas': totalVeronica.count,
        'Total Cobrado': totalVeronica.cobrado,
        'Total Deuda': totalVeronica.deuda
      },
      {
        'Vendedora': 'TOTAL',
        'Total Ventas': totalErica.count + totalVeronica.count,
        'Total Cobrado': totalErica.cobrado + totalVeronica.cobrado,
        'Total Deuda': totalErica.deuda + totalVeronica.deuda
      }
    ];

    // Crear workbook
    var wb = XLSX.utils.book_new();

    // Hoja 1: Ventas Erica
    var ws1 = XLSX.utils.json_to_sheet(ventasErica);
    ws1['!cols'] = [
      { wch: 20 }, { wch: 10 }, { wch: 25 }, { wch: 12 },
      { wch: 20 }, { wch: 14 }, { wch: 14 }, { wch: 18 }
    ];
    XLSX.utils.book_append_sheet(wb, ws1, 'Ventas Erica');

    // Hoja 2: Ventas Verónica
    var ws2 = XLSX.utils.json_to_sheet(ventasVeronica);
    ws2['!cols'] = ws1['!cols'];
    XLSX.utils.book_append_sheet(wb, ws2, 'Ventas Verónica');

    // Hoja 3: Resumen General
    var ws3 = XLSX.utils.json_to_sheet(resumen);
    ws3['!cols'] = [
      { wch: 15 }, { wch: 14 }, { wch: 16 }, { wch: 14 }
    ];
    XLSX.utils.book_append_sheet(wb, ws3, 'Resumen General');

    // Descargar
    var fileName = 'ventas_' + Utils.todayISO() + '.xlsx';
    XLSX.writeFile(wb, fileName);

    Toast.show('Archivo descargado: ' + fileName, 'success');
  }

  function onActivate() {
    if (AppState.get('ventas').length === 0) {
      Api.getVentas();
    }
  }

  return { init: init, onActivate: onActivate };
})();
