window.Utils = (function () {

  function formatDate(dateStr) {
    if (!dateStr) return '';
    var d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    var dd = String(d.getDate()).padStart(2, '0');
    var mm = String(d.getMonth() + 1).padStart(2, '0');
    var yyyy = d.getFullYear();
    return dd + '/' + mm + '/' + yyyy;
  }

  function formatCurrency(num) {
    var n = parseFloat(num) || 0;
    return '$' + n.toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  function sellerFromCode(code) {
    if (!code) return null;
    var upper = code.trim().toUpperCase();
    if (upper.length >= 2 && APP_CONFIG.SELLERS[upper.slice(0, 2)]) {
      return APP_CONFIG.SELLERS[upper.slice(0, 2)];
    }
    return APP_CONFIG.SELLERS[upper.charAt(0)] || null;
  }

  function normalizeCode(code) {
    return (code || '').trim().toUpperCase();
  }

  function debounce(fn, ms) {
    var timer;
    return function () {
      var args = arguments;
      var ctx = this;
      clearTimeout(timer);
      timer = setTimeout(function () { fn.apply(ctx, args); }, ms);
    };
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function todayISO() {
    var d = new Date();
    var yyyy = d.getFullYear();
    var mm = String(d.getMonth() + 1).padStart(2, '0');
    var dd = String(d.getDate()).padStart(2, '0');
    return yyyy + '-' + mm + '-' + dd;
  }

  function todayDateTime() {
    var d = new Date();
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0') + ' ' +
      String(d.getHours()).padStart(2, '0') + ':' +
      String(d.getMinutes()).padStart(2, '0') + ':' +
      String(d.getSeconds()).padStart(2, '0');
  }

  function sellerBadge(vendedora) {
    var cls = vendedora === 'Erica' ? 'badge-erica' : vendedora === 'Ambas' ? 'badge-ambas' : 'badge-veronica';
    return '<span class="badge ' + cls + '">' + escapeHtml(vendedora) + '</span>';
  }

  function sellerRowClass(vendedora) {
    return vendedora === 'Erica' ? 'row-erica' : vendedora === 'Ambas' ? 'row-ambas' : 'row-veronica';
  }

  return {
    formatDate: formatDate,
    formatCurrency: formatCurrency,
    sellerFromCode: sellerFromCode,
    normalizeCode: normalizeCode,
    debounce: debounce,
    escapeHtml: escapeHtml,
    todayISO: todayISO,
    todayDateTime: todayDateTime,
    sellerBadge: sellerBadge,
    sellerRowClass: sellerRowClass
  };
})();
