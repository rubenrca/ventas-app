window.ViewHistorial = (function () {
  var tableContainer, countEl;
  var filterVendedora, filterDesde, filterHasta, filterSearch;

  function init() {
    var container = document.getElementById('view-historial');
    container.innerHTML =
      '<h2 class="section-title">Historial de Ventas</h2>' +

      '<div class="filter-bar">' +
        '<select class="form-select" id="filter-vendedora">' +
          '<option value="">Todas</option>' +
          '<option value="Erica">Erica</option>' +
          '<option value="Verónica">Verónica</option>' +
        '</select>' +
        '<div class="filter-row">' +
          '<input class="form-input" type="date" id="filter-desde" placeholder="Desde">' +
          '<input class="form-input" type="date" id="filter-hasta" placeholder="Hasta">' +
        '</div>' +
        '<div class="search-input-wrapper">' +
          '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>' +
          '<input class="form-input" type="text" id="filter-search" placeholder="Buscar clienta o código...">' +
        '</div>' +
      '</div>' +

      '<div id="historial-count" class="table-count"></div>' +
      '<div id="historial-table"></div>';

    filterVendedora = document.getElementById('filter-vendedora');
    filterDesde = document.getElementById('filter-desde');
    filterHasta = document.getElementById('filter-hasta');
    filterSearch = document.getElementById('filter-search');
    tableContainer = document.getElementById('historial-table');
    countEl = document.getElementById('historial-count');

    filterVendedora.addEventListener('change', renderTable);
    filterDesde.addEventListener('change', renderTable);
    filterHasta.addEventListener('change', renderTable);
    filterSearch.addEventListener('input', Utils.debounce(renderTable, 300));

    AppState.subscribe('ventas', renderTable);
  }

  function getFilteredVentas() {
    var ventas = AppState.get('ventas');
    var vendedora = filterVendedora.value;
    var desde = filterDesde.value;
    var hasta = filterHasta.value;
    var search = filterSearch.value.trim().toLowerCase();

    return ventas.filter(function (v) {
      if (vendedora && v.vendedora !== vendedora) return false;

      if (desde) {
        var fechaVenta = String(v.fecha).slice(0, 10);
        if (fechaVenta < desde) return false;
      }

      if (hasta) {
        var fechaVenta2 = String(v.fecha).slice(0, 10);
        if (fechaVenta2 > hasta) return false;
      }

      if (search) {
        var haystack = (
          String(v.nombre_clienta || '') + ' ' +
          String(v.codigo_producto || '') + ' ' +
          String(v.nombre_producto || '')
        ).toLowerCase();
        if (haystack.indexOf(search) === -1) return false;
      }

      return true;
    });
  }

  function renderTable() {
    var filtered = getFilteredVentas();

    // Ordenar por fecha descendente
    filtered.sort(function (a, b) {
      return String(b.fecha || '').localeCompare(String(a.fecha || ''));
    });

    countEl.textContent = filtered.length + ' venta' + (filtered.length !== 1 ? 's' : '');

    if (filtered.length === 0) {
      tableContainer.innerHTML =
        '<div class="empty-state">' +
          '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>' +
          '<p>No hay ventas registradas</p>' +
        '</div>';
      return;
    }

    var html = '<div class="table-wrapper"><table class="data-table">' +
      '<thead><tr>' +
        '<th>Fecha</th>' +
        '<th>Código</th>' +
        '<th>Producto</th>' +
        '<th>Vendedora</th>' +
        '<th>Clienta</th>' +
        '<th>Pagado</th>' +
        '<th>Deuda</th>' +
        '<th>Método</th>' +
      '</tr></thead><tbody>';

    filtered.forEach(function (v) {
      var rowClass = Utils.sellerRowClass(v.vendedora);
      html += '<tr class="' + rowClass + '">' +
        '<td data-label="Fecha">' + Utils.escapeHtml(Utils.formatDate(v.fecha)) + '</td>' +
        '<td data-label="Código">' + Utils.escapeHtml(String(v.codigo_producto || '')) + '</td>' +
        '<td data-label="Producto">' + Utils.escapeHtml(String(v.nombre_producto || '')) + '</td>' +
        '<td data-label="Vendedora">' + Utils.sellerBadge(v.vendedora) + '</td>' +
        '<td data-label="Clienta">' + Utils.escapeHtml(String(v.nombre_clienta || '')) + '</td>' +
        '<td data-label="Pagado" class="amount paid">' + Utils.formatCurrency(v.monto_pagado) + '</td>' +
        '<td data-label="Deuda" class="amount' + (parseFloat(v.monto_deuda) > 0 ? ' debt' : '') + '">' + Utils.formatCurrency(v.monto_deuda) + '</td>' +
        '<td data-label="Método">' + Utils.escapeHtml(String(v.metodo_pago || '')) + '</td>' +
      '</tr>';
    });

    html += '</tbody></table></div>';
    tableContainer.innerHTML = html;
  }

  function onActivate() {
    Api.getVentas();
  }

  return { init: init, onActivate: onActivate };
})();
