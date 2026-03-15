window.Api = (function () {
  var baseUrl = APP_CONFIG.APPS_SCRIPT_URL;

  function apiCall(action, data) {
    var url = baseUrl + '?action=' + encodeURIComponent(action);
    if (data) {
      url += '&data=' + encodeURIComponent(JSON.stringify(data));
    }

    AppState.set('loading', true);

    return fetch(url)
      .then(function (res) {
        if (!res.ok) throw new Error('Error de red: ' + res.status);
        return res.json();
      })
      .then(function (json) {
        AppState.set('loading', false);
        if (!json.success) {
          throw new Error(json.error || 'Error desconocido');
        }
        return json;
      })
      .catch(function (err) {
        AppState.set('loading', false);
        Toast.show(err.message, 'error');
        throw err;
      });
  }

  function getVentas() {
    return apiCall('getVentas').then(function (json) {
      AppState.set('ventas', json.data || []);
      return json.data;
    });
  }

  function getCatalogo() {
    return apiCall('getCatalogo').then(function (json) {
      AppState.set('catalogo', json.data || []);
      return json.data;
    });
  }

  function addVenta(ventaObj) {
    return apiCall('addVenta', ventaObj);
  }

  function addProducto(prodObj) {
    return apiCall('addProducto', prodObj);
  }

  return {
    getVentas: getVentas,
    getCatalogo: getCatalogo,
    addVenta: addVenta,
    addProducto: addProducto
  };
})();
