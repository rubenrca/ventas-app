window.Modal = (function () {
  var overlay, titleEl, bodyEl, confirmBtn, cancelBtn;
  var onConfirmCallback;

  function init() {
    overlay = document.getElementById('modal-overlay');
    titleEl = document.getElementById('modal-title');
    bodyEl = document.getElementById('modal-body');
    confirmBtn = document.getElementById('modal-confirm');
    cancelBtn = document.getElementById('modal-cancel');

    cancelBtn.addEventListener('click', hide);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) hide();
    });

    confirmBtn.addEventListener('click', function () {
      if (onConfirmCallback) onConfirmCallback();
    });
  }

  function show(title, contentHtml, onConfirm, confirmLabel, danger) {
    titleEl.textContent = title;
    bodyEl.innerHTML = contentHtml;
    onConfirmCallback = onConfirm;
    confirmBtn.textContent = confirmLabel || 'Guardar';
    confirmBtn.className = 'btn ' + (danger ? 'btn-danger' : 'btn-primary');
    overlay.classList.add('show');
    // Focus first input if present
    var firstInput = bodyEl.querySelector('input, select');
    if (firstInput) setTimeout(function () { firstInput.focus(); }, 100);
  }

  function hide() {
    overlay.classList.remove('show');
    onConfirmCallback = null;
  }

  return { init: init, show: show, hide: hide };
})();
