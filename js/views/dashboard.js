window.ViewDashboard = (function () {
  var container;

  function init() {
    container = document.getElementById('view-dashboard');
    AppState.subscribe('ventas', render);
  }

  function render() {
    var ventas = AppState.get('ventas');

    // Calcular métricas
    var totalErica = 0, totalVeronica = 0;
    var cobradoTotal = 0, deudaTotal = 0;
    var countErica = 0, countVeronica = 0;
    var debtMap = {}; // clienta -> { total, vendedora }

    ventas.forEach(function (v) {
      var pagado = parseFloat(v.monto_pagado) || 0;
      var deuda = parseFloat(v.monto_deuda) || 0;

      cobradoTotal += pagado;
      deudaTotal += deuda;

      if (v.vendedora === 'Erica') {
        totalErica += pagado;
        countErica++;
      } else {
        totalVeronica += pagado;
        countVeronica++;
      }

      if (deuda > 0) {
        var key = String(v.nombre_clienta || '').trim().toLowerCase();
        if (!debtMap[key]) {
          debtMap[key] = { nombre: v.nombre_clienta, total: 0, vendedora: v.vendedora };
        }
        debtMap[key].total += deuda;
      }
    });

    // Ordenar deudas por monto descendente
    var debtList = Object.values(debtMap).sort(function (a, b) {
      return b.total - a.total;
    });

    container.innerHTML =
      '<h2 class="section-title">Dashboard</h2>' +

      '<div class="metrics-grid">' +
        metricCard('blue',
          '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/></svg>',
          Utils.formatCurrency(totalErica),
          'Ventas Erica (' + countErica + ')'
        ) +
        metricCard('purple',
          '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/></svg>',
          Utils.formatCurrency(totalVeronica),
          'Ventas Verónica (' + countVeronica + ')'
        ) +
        metricCard('green',
          '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
          Utils.formatCurrency(cobradoTotal),
          'Total Cobrado'
        ) +
        metricCard('red',
          '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>',
          Utils.formatCurrency(deudaTotal),
          'Total Deuda'
        ) +
      '</div>';

    // Lista de deudas
    if (debtList.length > 0) {
      var debtHtml = '<div class="debt-list card">' +
        '<div class="debt-list-title">Clientas con Deuda Pendiente</div>';

      debtList.forEach(function (d) {
        debtHtml +=
          '<div class="debt-item">' +
            '<div>' +
              '<div class="debt-item-name">' + Utils.escapeHtml(d.nombre || 'Sin nombre') + '</div>' +
              '<div class="debt-item-seller">' + Utils.escapeHtml(d.vendedora || '') + '</div>' +
            '</div>' +
            '<div class="debt-item-amount">' + Utils.formatCurrency(d.total) + '</div>' +
          '</div>';
      });

      debtHtml += '</div>';
      container.innerHTML += debtHtml;
    } else if (ventas.length > 0) {
      container.innerHTML += '<div class="card" style="text-align:center;color:var(--color-success);padding:var(--spacing-lg);">Sin deudas pendientes</div>';
    }

    if (ventas.length === 0) {
      container.innerHTML += '<div class="empty-state"><p>No hay datos para mostrar. Registra ventas primero.</p></div>';
    }
  }

  function metricCard(colorClass, iconSvg, value, label) {
    return '<div class="metric-card">' +
      '<div class="metric-icon ' + colorClass + '">' + iconSvg + '</div>' +
      '<div class="metric-value">' + value + '</div>' +
      '<div class="metric-label">' + Utils.escapeHtml(label) + '</div>' +
    '</div>';
  }

  function onActivate() {
    Api.getVentas();
  }

  return { init: init, onActivate: onActivate };
})();
