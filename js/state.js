window.AppState = (function () {
  const state = {
    ventas: [],
    catalogo: [],
    catalogoMap: {},
    currentView: 'registrar',
    loading: false,
    filters: {
      vendedora: '',
      fechaDesde: '',
      fechaHasta: '',
      search: ''
    }
  };

  const listeners = {};

  function set(key, value) {
    state[key] = value;

    // Derivar catalogoMap cuando cambia el catálogo
    if (key === 'catalogo') {
      const map = {};
      value.forEach(function (item) {
        const code = String(item.codigo).trim().toUpperCase();
        map[code] = item;
      });
      state.catalogoMap = map;
      notify('catalogoMap');
    }

    notify(key);
  }

  function get(key) {
    return state[key];
  }

  function subscribe(key, callback) {
    if (!listeners[key]) listeners[key] = [];
    listeners[key].push(callback);
  }

  function notify(key) {
    if (listeners[key]) {
      listeners[key].forEach(function (cb) {
        cb(state[key]);
      });
    }
  }

  return { set: set, get: get, subscribe: subscribe };
})();
