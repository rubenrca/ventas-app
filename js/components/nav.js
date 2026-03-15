window.Nav = (function () {
  function init() {
    var nav = document.getElementById('bottom-nav');
    nav.addEventListener('click', function (e) {
      var btn = e.target.closest('.nav-btn');
      if (!btn) return;

      var view = btn.dataset.view;
      if (view) Router.navigate(view);
    });
  }

  function setActive(viewName) {
    var buttons = document.querySelectorAll('.nav-btn');
    buttons.forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.view === viewName);
    });
  }

  return { init: init, setActive: setActive };
})();
