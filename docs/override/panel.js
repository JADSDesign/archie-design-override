(function () {
  var VERSION = '0.2.0-poc';
  var PANEL_ID = 'archie-override-panel';
  var STYLE_ID = 'archie-override-style';
  var BASE_URL = 'https://jadsdesign.github.io/archie-design-override/override/';

  // IIFE guard — second click removes everything and exits
  var existingPanel = document.getElementById(PANEL_ID);
  if (existingPanel) {
    existingPanel.parentNode.removeChild(existingPanel);
    var existingStyle = document.getElementById(STYLE_ID);
    if (existingStyle) existingStyle.parentNode.removeChild(existingStyle);
    var existingCss = document.getElementById('archie-override-css');
    if (existingCss) existingCss.parentNode.removeChild(existingCss);
    if (window._archieObserver) {
      window._archieObserver.disconnect();
      window._archieObserver = null;
    }
    return;
  }

  var activeMode = 'original';

  function injectStyle(css) {
    var el = document.getElementById(STYLE_ID);
    if (!el) {
      el = document.createElement('style');
      el.id = STYLE_ID;
      document.head.appendChild(el);
    }
    el.textContent = css;
  }

  function buildOriginalCSS() {
    return [
      '/* Archie Override — Huidig */',
      ':root {',
      '  --v-theme-primary: 100,6,100 !important;',
      '}',
      '.v-field {',
      '  border-radius: 8px !important;',
      '}',
      '.v-field--variant-outlined:focus-within {',
      '  box-shadow: none !important;',
      '}',
      '.v-card {',
      '  border-radius: 16px !important;',
      '}',
    ].join('\n');
  }

  function buildProposalCSS() {
    return [
      '/* Archie Override — Voorstel v12.8 */',
      ':root {',
      '  --v-theme-primary: 89,43,89 !important;',
      '}',
      '.v-field {',
      '  border-radius: 8px !important;',
      '}',
      '.v-field--variant-outlined:focus-within {',
      '  box-shadow: 0 0 0 3px rgba(89,43,89,0.15) !important;',
      '}',
      '.v-field--variant-outlined:focus-within .v-field__outline__start,',
      '.v-field--variant-outlined:focus-within .v-field__outline__notch,',
      '.v-field--variant-outlined:focus-within .v-field__outline__end {',
      '  border-color: rgb(89,43,89) !important;',
      '  border-width: 2px !important;',
      '}',
      '.v-card {',
      '  border-radius: 12px !important;',
      '}',
    ].join('\n');
  }

  function applyMode(mode) {
    activeMode = mode;
    injectStyle(mode === 'proposal' ? buildProposalCSS() : buildOriginalCSS());
  }

  function buildToggleButton() {
    var btn = document.createElement('button');
    btn.id = PANEL_ID;
    btn.textContent = 'Voorstel';
    btn.setAttribute('data-mode', 'original');
    document.body.appendChild(btn);

    btn.addEventListener('click', function () {
      if (activeMode === 'original') {
        applyMode('proposal');
        btn.textContent = '← Huidig';
        btn.setAttribute('data-mode', 'proposal');
      } else {
        applyMode('original');
        btn.textContent = 'Voorstel';
        btn.setAttribute('data-mode', 'original');
      }
    });
  }

  function startObserver() {
    var observer = new MutationObserver(function (mutations) {
      var hasNewField = mutations.some(function (m) {
        return Array.prototype.some.call(m.addedNodes, function (node) {
          return node.nodeType === 1 && (
            (node.classList && node.classList.contains('v-field')) ||
            (node.querySelector && node.querySelector('.v-field'))
          );
        });
      });
      if (hasNewField && activeMode === 'proposal') {
        setTimeout(function () { injectStyle(buildProposalCSS()); }, 80);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    window._archieObserver = observer;
  }

  // Load panel.css
  var link = document.createElement('link');
  link.id = 'archie-override-css';
  link.rel = 'stylesheet';
  link.href = BASE_URL + 'panel.css?v=' + Date.now();
  document.head.appendChild(link);

  applyMode('original');
  buildToggleButton();
  startObserver();

  console.log('[Archie Override v' + VERSION + '] loaded');
})();
