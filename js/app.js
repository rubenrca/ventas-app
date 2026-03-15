document.addEventListener('DOMContentLoaded', function () {
  // Init components
  Toast.init();
  Modal.init();
  Loader.init();

  // Init views
  ViewRegistrar.init();
  ViewHistorial.init();
  ViewCatalogo.init();
  ViewExportar.init();
  ViewDashboard.init();

  // Init navigation & router
  Nav.init();
  Router.init();

  // Load initial data
  Promise.all([
    Api.getCatalogo(),
    Api.getVentas()
  ]).catch(function (err) {
    console.error('Error cargando datos iniciales:', err);
  });
});
