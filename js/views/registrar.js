window.ViewRegistrar = (function () {
  var form, codeInput, nameInput, priceInput, sellerInput;
  var clientInput, paidInput, debtInput, methodSelect, dateInput;
  var submitBtn, autocompleteHint;
  var currentProduct = null;

  function init() {
    var container = document.getElementById('view-registrar');
    container.innerHTML =
      '<h2 class="section-title">Registrar Venta</h2>' +
      '<form id="form-venta" autocomplete="off">' +

        '<div class="form-group">' +
          '<label class="form-label" for="venta-codigo">Código Producto</label>' +
          '<input class="form-input" type="text" id="venta-codigo" placeholder="Ej: E001, V015" inputmode="text">' +
          '<div id="autocomplete-hint"></div>' +
        '</div>' +

        '<div class="form-row">' +
          '<div class="form-group">' +
            '<label class="form-label" for="venta-nombre">Producto</label>' +
            '<input class="form-input" type="text" id="venta-nombre" readonly placeholder="-">' +
          '</div>' +
          '<div class="form-group">' +
            '<label class="form-label" for="venta-precio">Precio</label>' +
            '<input class="form-input" type="text" id="venta-precio" readonly placeholder="-">' +
          '</div>' +
        '</div>' +

        '<div class="form-group">' +
          '<label class="form-label" for="venta-vendedora">Vendedora</label>' +
          '<input class="form-input" type="text" id="venta-vendedora" readonly placeholder="-">' +
        '</div>' +

        '<div class="form-group">' +
          '<label class="form-label" for="venta-clienta">Nombre Clienta</label>' +
          '<input class="form-input" type="text" id="venta-clienta" placeholder="Nombre de la clienta">' +
        '</div>' +

        '<div class="form-row">' +
          '<div class="form-group">' +
            '<label class="form-label" for="venta-pagado">Monto Pagado</label>' +
            '<input class="form-input" type="number" id="venta-pagado" min="0" step="1" placeholder="0" inputmode="numeric">' +
          '</div>' +
          '<div class="form-group">' +
            '<label class="form-label" for="venta-deuda">Monto Deuda</label>' +
            '<input class="form-input" type="number" id="venta-deuda" min="0" step="1" placeholder="0" inputmode="numeric">' +
          '</div>' +
        '</div>' +

        '<div class="form-row">' +
          '<div class="form-group">' +
            '<label class="form-label" for="venta-metodo">Método de Pago</label>' +
            '<select class="form-select" id="venta-metodo">' +
              APP_CONFIG.PAYMENT_METHODS.map(function (m) {
                return '<option value="' + m + '">' + m + '</option>';
              }).join('') +
            '</select>' +
          '</div>' +
          '<div class="form-group">' +
            '<label class="form-label" for="venta-fecha">Fecha</label>' +
            '<input class="form-input" type="date" id="venta-fecha">' +
          '</div>' +
        '</div>' +

        '<button type="submit" class="btn btn-primary btn-block" id="btn-registrar">' +
          'Registrar Venta' +
        '</button>' +
      '</form>';

    // Cache refs
    form = document.getElementById('form-venta');
    codeInput = document.getElementById('venta-codigo');
    nameInput = document.getElementById('venta-nombre');
    priceInput = document.getElementById('venta-precio');
    sellerInput = document.getElementById('venta-vendedora');
    clientInput = document.getElementById('venta-clienta');
    paidInput = document.getElementById('venta-pagado');
    debtInput = document.getElementById('venta-deuda');
    methodSelect = document.getElementById('venta-metodo');
    dateInput = document.getElementById('venta-fecha');
    submitBtn = document.getElementById('btn-registrar');
    autocompleteHint = document.getElementById('autocomplete-hint');

    dateInput.value = Utils.todayISO();

    // Events
    codeInput.addEventListener('input', Utils.debounce(onCodeInput, 200));
    paidInput.addEventListener('input', onPaidChange);
    form.addEventListener('submit', onSubmit);
  }

  function onCodeInput() {
    var code = Utils.normalizeCode(codeInput.value);
    if (code.length < 1) {
      clearAutocomplete();
      return;
    }

    var product = AppState.get('catalogoMap')[code];

    if (product) {
      currentProduct = product;
      nameInput.value = product.nombre;
      priceInput.value = Utils.formatCurrency(product.precio);
      sellerInput.value = Utils.sellerFromCode(code) || '';
      paidInput.value = product.precio;
      debtInput.value = 0;
      codeInput.classList.add('input-success');
      autocompleteHint.innerHTML = '<div class="autocomplete-info">' +
        Utils.escapeHtml(product.nombre) + ' — ' + Utils.formatCurrency(product.precio) +
        '</div>';
    } else {
      currentProduct = null;
      nameInput.value = '';
      priceInput.value = '';
      var seller = Utils.sellerFromCode(code);
      sellerInput.value = seller || '';
      paidInput.value = '';
      debtInput.value = '';
      codeInput.classList.remove('input-success');

      if (code.length >= 2) {
        autocompleteHint.innerHTML =
          '<div class="autocomplete-info not-found">' +
            'Producto no encontrado. ' +
            '<a href="#" id="link-add-product" style="color:inherit;text-decoration:underline;font-weight:600;">Agregar al catálogo</a>' +
          '</div>';
        var addLink = document.getElementById('link-add-product');
        if (addLink) {
          addLink.addEventListener('click', function (e) {
            e.preventDefault();
            showAddProductModal(code);
          });
        }
      } else {
        autocompleteHint.innerHTML = '';
      }
    }
  }

  function clearAutocomplete() {
    currentProduct = null;
    nameInput.value = '';
    priceInput.value = '';
    sellerInput.value = '';
    paidInput.value = '';
    debtInput.value = '';
    codeInput.classList.remove('input-success');
    autocompleteHint.innerHTML = '';
  }

  function onPaidChange() {
    if (!currentProduct) return;
    var precio = parseFloat(currentProduct.precio) || 0;
    var pagado = parseFloat(paidInput.value) || 0;
    var deuda = Math.max(0, precio - pagado);
    debtInput.value = deuda;
  }

  function onSubmit(e) {
    e.preventDefault();

    var code = Utils.normalizeCode(codeInput.value);

    if (!code) {
      Toast.show('Ingresa un código de producto', 'error');
      codeInput.focus();
      return;
    }

    if (!currentProduct) {
      Toast.show('El código no existe en el catálogo', 'error');
      codeInput.focus();
      return;
    }

    if (!clientInput.value.trim()) {
      Toast.show('Ingresa el nombre de la clienta', 'error');
      clientInput.focus();
      return;
    }

    if (paidInput.value === '' || paidInput.value === null) {
      Toast.show('Ingresa el monto pagado', 'error');
      paidInput.focus();
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Registrando...';

    var ventaData = {
      codigo_producto: code,
      nombre_producto: currentProduct.nombre,
      nombre_clienta: clientInput.value.trim(),
      monto_pagado: parseFloat(paidInput.value) || 0,
      monto_deuda: parseFloat(debtInput.value) || 0,
      metodo_pago: methodSelect.value,
      fecha: dateInput.value ? dateInput.value + ' ' + new Date().toTimeString().slice(0, 8) : ''
    };

    Api.addVenta(ventaData)
      .then(function () {
        Toast.show('Venta registrada correctamente', 'success');
        resetForm();
        Api.getVentas();
      })
      .catch(function () {
        // Error ya mostrado por Api
      })
      .finally(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Registrar Venta';
      });
  }

  function resetForm() {
    form.reset();
    currentProduct = null;
    clearAutocomplete();
    dateInput.value = Utils.todayISO();
    codeInput.focus();
  }

  function showAddProductModal(code) {
    var seller = Utils.sellerFromCode(code);
    var sellerText = seller ? ' (' + seller + ')' : '';

    var html =
      '<div class="form-group">' +
        '<label class="form-label">Código</label>' +
        '<input class="form-input" type="text" id="modal-prod-codigo" value="' + Utils.escapeHtml(code) + '" readonly>' +
      '</div>' +
      '<div class="form-group">' +
        '<label class="form-label">Vendedora</label>' +
        '<input class="form-input" type="text" value="' + Utils.escapeHtml(seller || 'N/A') + '" readonly>' +
      '</div>' +
      '<div class="form-group">' +
        '<label class="form-label">Nombre del Producto</label>' +
        '<input class="form-input" type="text" id="modal-prod-nombre" placeholder="Nombre del producto">' +
      '</div>' +
      '<div class="form-group">' +
        '<label class="form-label">Precio</label>' +
        '<input class="form-input" type="number" id="modal-prod-precio" min="0" step="1" placeholder="0" inputmode="numeric">' +
      '</div>';

    Modal.show('Agregar Producto al Catálogo' + sellerText, html, function () {
      var nombre = document.getElementById('modal-prod-nombre').value.trim();
      var precio = document.getElementById('modal-prod-precio').value;

      if (!nombre) {
        Toast.show('Ingresa el nombre del producto', 'error');
        return;
      }
      if (!precio) {
        Toast.show('Ingresa el precio', 'error');
        return;
      }

      Api.addProducto({ codigo: code, nombre: nombre, precio: parseFloat(precio) })
        .then(function () {
          Modal.hide();
          Toast.show('Producto agregado al catálogo', 'success');
          return Api.getCatalogo();
        })
        .then(function () {
          // Trigger autocomplete refresh
          onCodeInput();
        })
        .catch(function () {
          // Error shown by Api
        });
    });
  }

  function onActivate() {
    if (AppState.get('catalogo').length === 0) {
      Api.getCatalogo();
    }
  }

  return { init: init, onActivate: onActivate };
})();
