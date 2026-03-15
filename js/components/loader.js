window.Loader = (function () {
  var loaderEl;

  function init() {
    loaderEl = document.getElementById('loader-overlay');
    AppState.subscribe('loading', function (isLoading) {
      if (isLoading) {
        loaderEl.classList.add('show');
      } else {
        loaderEl.classList.remove('show');
      }
    });
  }

  return { init: init };
})();
