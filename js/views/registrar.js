window.ViewRegistrar = (function () {
  var form, codeInput, nameInput, priceInput, sellerInput;
  var clientInput, paidInput, debtInput, methodSelect, dateInput;
  var submitBtn, autocompleteHint, dropdown;
  var currentProduct = null;
  var highlightedIndex = -1;

  function init() {
    var container = document.getElementById('view-registrar');
    container.innerHTML =
      '<h2 class="section-title">Registrar Venta</h2>' +
      '<form id="form-venta" autocomplete="off">' +

        '<div class="form-group form-group-code">' +
          '<label class="form-label" for="venta-codigo">Código Producto</label>' +
          '<input class="form-input" type="text" id="venta-codigo" placeholder="Ej: E001, V015, EV010" inputmode="text">' +
          '<div id="autocomplete-dropdown" class="autocomplete-dropdown"></div>' +
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
    dropdown = document.getElementById('autocomplete-dropdown');

    dateInput.value = Utils.todayISO();

    // Events
    codeInput.addEventListener('input', Utils.debounce(onCodeInput, 150));
    codeInput.addEventListener('keydown', onKeyDown);
    paidInput.addEventListener('input', onPaidChange);
    form.addEventListener('submit', onSubmit);

    document.addEventListener('click', function (e) {
      if (!codeInput.parentNode.contains(e.target)) {
        closeSuggestions();
      }
    });
  }

  function onCodeInput() {
    var code = Utils.normalizeCode(codeInput.value);
    highlightedIndex = -1;

    if (code.length < 1) {
      clearAutocomplete();
      return;
    }

    var product = AppState.get('catalogoMap')[code];

    if (product) {
      // Coincidencia exacta
      closeSuggestions();
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

      var matches = getSuggestions(code);

      if (matches.length > 0) {
        autocompleteHint.innerHTML = '';
        renderSuggestions(matches);
      } else if (code.length >= 2) {
        closeSuggestions();
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
        closeSuggestions();
        autocompleteHint.innerHTML = '';
      }
    }
  }

  function getSuggestions(code) {
    var upper = code.toUpperCase();
    var catalogo = AppState.get('catalogo');
    return catalogo
      .filter(function (p) {
        return String(p.codigo).toUpperCase().startsWith(upper);
      })
      .sort(function (a, b) {
        return String(a.codigo).localeCompare(String(b.codigo));
      })
      .slice(0, 8);
  }

  function renderSuggestions(matches) {
    var html = '';
    matches.forEach(function (p, i) {
      html +=
        '<div class="autocomplete-item" data-index="' + i + '">' +
          '<span class="autocomplete-item-code">' + Utils.escapeHtml(String(p.codigo)) + '</span>' +
          '<span class="autocomplete-item-name">' + Utils.escapeHtml(String(p.nombre)) + '</span>' +
          '<span class="autocomplete-item-price">' + Utils.formatCurrency(p.precio) + '</span>' +
        '</div>';
    });
    dropdown.innerHTML = html;
    dropdown.classList.add('open');

    dropdown.querySelectorAll('.autocomplete-item').forEach(function (el, i) {
      el.addEventListener('mousedown', function (e) {
        e.preventDefault(); // evitar que el input pierda el foco antes del click
        selectSuggestion(matches[i]);
      });
    });
  }

  function closeSuggestions() {
    dropdown.classList.remove('open');
    dropdown.innerHTML = '';
    highlightedIndex = -1;
  }

  function selectSuggestion(product) {
    currentProduct = product;
    codeInput.value = String(product.codigo);
    nameInput.value = product.nombre;
    priceInput.value = Utils.formatCurrency(product.precio);
    sellerInput.value = Utils.sellerFromCode(String(product.codigo)) || '';
    paidInput.value = product.precio;
    debtInput.value = 0;
    codeInput.classList.add('input-success');
    autocompleteHint.innerHTML = '<div class="autocomplete-info">' +
      Utils.escapeHtml(product.nombre) + ' — ' + Utils.formatCurrency(product.precio) +
      '</div>';
    closeSuggestions();
    clientInput.focus();
  }

  function onKeyDown(e) {
    if (!dropdown.classList.contains('open')) return;

    var items = dropdown.querySelectorAll('.autocomplete-item');
    if (items.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      highlightedIndex = Math.min(highlightedIndex + 1, items.length - 1);
      updateHighlight(items);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      highlightedIndex = Math.max(highlightedIndex - 1, 0);
      updateHighlight(items);
    } else if (e.key === 'Enter') {
      if (highlightedIndex >= 0) {
        e.preventDefault();
        items[highlightedIndex].dispatchEvent(new MouseEvent('mousedown'));
      }
    } else if (e.key === 'Escape') {
      closeSuggestions();
    }
  }

  function updateHighlight(items) {
    items.forEach(function (el, i) {
      el.classList.toggle('highlighted', i === highlightedIndex);
    });
    if (highlightedIndex >= 0) {
      items[highlightedIndex].scrollIntoView({ block: 'nearest' });
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
    closeSuggestions();
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
