window.ViewCatalogo = (function () {
  var tableContainer, countEl;

  function init() {
    var container = document.getElementById('view-catalogo');
    container.innerHTML =
      '<div class="card-header">' +
        '<h2 class="section-title" style="margin-bottom:0">Catálogo</h2>' +
        '<button class="btn btn-primary btn-sm" id="btn-add-product">' +
          '+ Producto' +
        '</button>' +
      '</div>' +
      '<div id="catalogo-count" class="table-count"></div>' +
      '<div id="catalogo-table"></div>';

    tableContainer = document.getElementById('catalogo-table');
    countEl = document.getElementById('catalogo-count');

    document.getElementById('btn-add-product').addEventListener('click', showAddModal);

    AppState.subscribe('catalogo', renderTable);
  }

  function renderTable() {
    var catalogo = AppState.get('catalogo');

    countEl.textContent = catalogo.length + ' producto' + (catalogo.length !== 1 ? 's' : '');

    if (catalogo.length === 0) {
      tableContainer.innerHTML =
        '<div class="empty-state">' +
          '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>' +
          '<p>No hay productos en el catálogo</p>' +
        '</div>';
      return;
    }

    // Ordenar por código
    var sorted = catalogo.slice().sort(function (a, b) {
      return String(a.codigo).localeCompare(String(b.codigo));
    });

    var html = '<div class="table-wrapper"><table class="data-table">' +
      '<thead><tr>' +
        '<th>Código</th>' +
        '<th>Nombre</th>' +
        '<th>Precio</th>' +
        '<th>Vendedora</th>' +
        '<th></th>' +
      '</tr></thead><tbody>';

    sorted.forEach(function (p) {
      var vendedora = Utils.sellerFromCode(String(p.codigo)) || p.vendedora || '';
      var rowClass = Utils.sellerRowClass(vendedora);
      var cod = Utils.escapeHtml(String(p.codigo || ''));
      html += '<tr class="' + rowClass + '">' +
        '<td data-label="Código">' + cod + '</td>' +
        '<td data-label="Nombre">' + Utils.escapeHtml(String(p.nombre || '')) + '</td>' +
        '<td data-label="Precio" class="amount">' + Utils.formatCurrency(p.precio) + '</td>' +
        '<td data-label="Vendedora">' + Utils.sellerBadge(vendedora) + '</td>' +
        '<td class="actions-cell">' +
          '<button class="btn-action btn-edit" data-codigo="' + cod + '">Editar</button>' +
          '<button class="btn-action btn-delete" data-codigo="' + cod + '">Eliminar</button>' +
        '</td>' +
      '</tr>';
    });

    html += '</tbody></table></div>';
    tableContainer.innerHTML = html;

    tableContainer.querySelectorAll('.btn-edit').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var codigo = btn.getAttribute('data-codigo');
        var producto = AppState.get('catalogoMap')[codigo];
        if (producto) showEditModal(producto);
      });
    });

    tableContainer.querySelectorAll('.btn-delete').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var codigo = btn.getAttribute('data-codigo');
        showDeleteModal(codigo);
      });
    });
  }

  function showAddModal() {
    var html =
      '<div class="form-group">' +
        '<label class="form-label">Código (empieza con E, V o EV)</label>' +
        '<input class="form-input" type="text" id="modal-cat-codigo" placeholder="Ej: E001, V015, EV010">' +
      '</div>' +
      '<div class="form-group">' +
        '<label class="form-label">Nombre del Producto</label>' +
        '<input class="form-input" type="text" id="modal-cat-nombre" placeholder="Nombre">' +
      '</div>' +
      '<div class="form-group">' +
        '<label class="form-label">Precio</label>' +
        '<input class="form-input" type="number" id="modal-cat-precio" min="0" step="1" placeholder="0" inputmode="numeric">' +
      '</div>';

    Modal.show('Agregar Producto', html, function () {
      var codigo = Utils.normalizeCode(document.getElementById('modal-cat-codigo').value);
      var nombre = document.getElementById('modal-cat-nombre').value.trim();
      var precio = document.getElementById('modal-cat-precio').value;

      if (!codigo) {
        Toast.show('Ingresa un código', 'error');
        return;
      }

      var seller = Utils.sellerFromCode(codigo);
      if (!seller) {
        Toast.show('El código debe empezar con E, V o EV', 'error');
        return;
      }

      if (!nombre) {
        Toast.show('Ingresa el nombre del producto', 'error');
        return;
      }

      if (!precio) {
        Toast.show('Ingresa el precio', 'error');
        return;
      }

      Api.addProducto({ codigo: codigo, nombre: nombre, precio: parseFloat(precio) })
        .then(function () {
          Modal.hide();
          Toast.show('Producto agregado', 'success');
          return Api.getCatalogo();
        })
        .catch(function () {
          // Error shown by Api
        });
    });
  }

  function showEditModal(producto) {
    var html =
      '<div class="form-group">' +
        '<label class="form-label">Código</label>' +
        '<input class="form-input" type="text" value="' + Utils.escapeHtml(String(producto.codigo)) + '" readonly>' +
      '</div>' +
      '<div class="form-group">' +
        '<label class="form-label">Nombre del Producto</label>' +
        '<input class="form-input" type="text" id="modal-edit-nombre" value="' + Utils.escapeHtml(String(producto.nombre)) + '">' +
      '</div>' +
      '<div class="form-group">' +
        '<label class="form-label">Precio</label>' +
        '<input class="form-input" type="number" id="modal-edit-precio" min="0" step="1" value="' + (parseFloat(producto.precio) || 0) + '" inputmode="numeric">' +
      '</div>';

    Modal.show('Editar Producto', html, function () {
      var nombre = document.getElementById('modal-edit-nombre').value.trim();
      var precio = document.getElementById('modal-edit-precio').value;

      if (!nombre) { Toast.show('Ingresa el nombre', 'error'); return; }
      if (!precio) { Toast.show('Ingresa el precio', 'error'); return; }

      Api.updateProducto({ codigo: producto.codigo, nombre: nombre, precio: parseFloat(precio) })
        .then(function () {
          Modal.hide();
          Toast.show('Producto actualizado', 'success');
          return Api.getCatalogo();
        })
        .catch(function () {});
    });
  }

  function showDeleteModal(codigo) {
    var html =
      '<p style="margin:0">¿Eliminar el producto <strong>' + Utils.escapeHtml(codigo) + '</strong> del catálogo?</p>' +
      '<p style="margin:8px 0 0;color:var(--color-text-muted);font-size:var(--font-size-sm)">Esta acción no se puede deshacer.</p>';

    Modal.show('Eliminar Producto', html, function () {
      Api.deleteProducto(codigo)
        .then(function () {
          Modal.hide();
          Toast.show('Producto eliminado', 'success');
          return Api.getCatalogo();
        })
        .catch(function () {});
    }, 'Eliminar', true);
  }

  function onActivate() {
    Api.getCatalogo();
  }

  return { init: init, onActivate: onActivate };
})();
