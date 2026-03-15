window.Toast = (function () {
  var toastEl;
  var timer;

  function init() {
    toastEl = document.getElementById('toast');
  }

  function show(message, type) {
    type = type || 'info';
    clearTimeout(timer);

    toastEl.textContent = message;
    toastEl.className = 'toast show ' + type;

    timer = setTimeout(function () {
      toastEl.className = 'toast';
    }, 3000);
  }

  return { init: init, show: show };
})();
