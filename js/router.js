window.Router = (function () {
  var views = {};

  function init() {
    // Map view names to modules
    views = {
      registrar: ViewRegistrar,
      historial: ViewHistorial,
      catalogo: ViewCatalogo,
      exportar: ViewExportar,
      dashboard: ViewDashboard
    };

    // Read hash or default
    var hash = location.hash.replace('#', '') || APP_CONFIG.DEFAULT_VIEW;
    navigate(hash);

    window.addEventListener('hashchange', function () {
      var h = location.hash.replace('#', '') || APP_CONFIG.DEFAULT_VIEW;
      navigate(h);
    });
  }

  function navigate(viewName) {
    if (APP_CONFIG.VIEWS.indexOf(viewName) === -1) {
      viewName = APP_CONFIG.DEFAULT_VIEW;
    }

    // Hide all views, show selected
    APP_CONFIG.VIEWS.forEach(function (v) {
      var el = document.getElementById('view-' + v);
      if (el) el.classList.toggle('active', v === viewName);
    });

    // Update nav
    Nav.setActive(viewName);

    // Update hash without triggering hashchange
    if (location.hash !== '#' + viewName) {
      history.replaceState(null, '', '#' + viewName);
    }

    // Call onActivate
    AppState.set('currentView', viewName);
    if (views[viewName] && views[viewName].onActivate) {
      views[viewName].onActivate();
    }
  }

  return { init: init, navigate: navigate };
})();
