(function () {
  var VERSION = '0.1.0-skeleton';

  var existing = document.getElementById('archie-override-panel');
  if (existing) {
    existing.parentNode.removeChild(existing);
    return;
  }

  function init() {
    // Panel UI — populated in Phase 2
  }

  init();

  console.log('[Archie Override v' + VERSION + '] loaded');
})();
