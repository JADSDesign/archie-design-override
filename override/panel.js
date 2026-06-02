// Archie Design Override — full control panel
// v2.0.0
// Vanilla ES5 only (var/function) for Chrome bookmarklet compatibility.
(function () {
  var VERSION = '2.0.0';
  var PANEL_ID = 'archie-override-panel';
  var STYLE_ID = 'archie-override-style';
  var CSS_LINK_ID = 'archie-override-css';
  var BASE_URL = 'https://jadsdesign.github.io/archie-design-override/override/';
  var _reskinTimer;
  var AO_FIELD_ATTR = 'data-ao-id';
  var _currentCfg = null; // used by startObserver (Task 5) to re-apply on DOM mutations

  // Measured Archie defaults — used by the "Huidig" reset button.
  var ORIGINAL = {
    variant: 'outlined',
    labelPos: 'top',
    radius: 8,
    radiusPos: 'beide',
    size: 'standard',
    customHeight: 48,
    borderColor: '#B3C0DD',
    fillColor: '#FFFFFF',
    labelColor: '#464646',
    textColor: '#1A1A2E',
    strokeWidth: 1
  };

  // ── IIFE guard — second click removes everything and exits ──────────────
  var existingPanel = document.getElementById(PANEL_ID);
  if (existingPanel) {
    // Relies on function-declaration hoisting: removeAOFields is defined below.
    removeAOFields();
    existingPanel.parentNode.removeChild(existingPanel);
    var existingStyle = document.getElementById(STYLE_ID);
    if (existingStyle) existingStyle.parentNode.removeChild(existingStyle);
    var existingCss = document.getElementById(CSS_LINK_ID);
    if (existingCss) existingCss.parentNode.removeChild(existingCss);
    if (window._archieObserver) {
      window._archieObserver.disconnect();
      window._archieObserver = null;
    }
    return;
  }

  // ── injectStyle ─────────────────────────────────────────────────────────
  function injectStyle(css) {
    var elNode = document.getElementById(STYLE_ID);
    if (!elNode) {
      elNode = document.createElement('style');
      elNode.id = STYLE_ID;
      document.head.appendChild(elNode);
    }
    elNode.textContent = css;
  }

  function removeStyle() {
    var elNode = document.getElementById(STYLE_ID);
    if (elNode) elNode.parentNode.removeChild(elNode);
  }

  // ── buildAOResetCSS — hides Vuetify .v-input elements that have been replaced ─
  function buildAOResetCSS() {
    return '.v-input[' + AO_FIELD_ATTR + '] { display: none !important; }';
  }

  // ── removeAOFields — remove all .ao-field elements and restore .v-input ──
  function removeAOFields() {
    var aoFields = Array.prototype.slice.call(document.querySelectorAll('.ao-field'));
    aoFields.forEach(function (aoField) {
      if (aoField.parentNode) aoField.parentNode.removeChild(aoField);
    });
    // Restore display on all hidden .v-input elements.
    var hiddenInputs = Array.prototype.slice.call(
      document.querySelectorAll('.v-input[' + AO_FIELD_ATTR + ']')
    );
    hiddenInputs.forEach(function (vInput) {
      vInput.style.display = '';
      vInput.removeAttribute(AO_FIELD_ATTR);
    });
  }

  // ── injectAOFields — inject in-flow .ao-field after each .v-input ─────────
  // Hides .v-input and inserts our own .ao-field directly after it in the DOM.
  // Vuetify's input stays in the DOM for future value-bridging.
  function injectAOFields(cfg) {
    removeAOFields();              // tear down first, always
    _currentCfg = cfg;

    var variant = (cfg && cfg.variant) || 'outlined';
    var labelPos = (cfg && cfg.labelPos) || 'top';
    var size = (cfg && cfg.size) || 'standard';

    var inputs = Array.prototype.slice.call(
      document.querySelectorAll('.v-input')
    );

    inputs.forEach(function (vInput) {
      // Only process .v-input elements that contain a .v-field (filters color pickers etc.)
      if (!vInput.querySelector('.v-field')) { return; }

      // Skip search inputs.
      if (vInput.className && vInput.className.indexOf('search-input-wrapper') !== -1) {
        return;
      }

      // Read label text from native .v-label; persist on .v-input for re-injection resilience.
      var nativeLabel = vInput.querySelector('.v-label');
      var text = '';
      if (nativeLabel && nativeLabel.textContent) {
        text = nativeLabel.textContent.trim();
      }
      if (text) {
        vInput.dataset.aoLabel = text;
      } else if (vInput.dataset.aoLabel) {
        text = vInput.dataset.aoLabel;
      }

      // Read optional prepend icon SVG from .v-field__prepend-inner.
      var prependInner = vInput.querySelector('.v-field__prepend-inner');
      var iconSVG = '';
      if (prependInner) {
        var svgEl = prependInner.querySelector('svg');
        if (svgEl) { iconSVG = svgEl.outerHTML; }
      }

      // Assign a unique ID to this .v-input for cross-referencing.
      if (!vInput.dataset.aoId) {
        vInput.dataset.aoId = 'ao-' + Math.random().toString(36).substr(2, 9);
      }
      var uid = vInput.dataset.aoId;

      // Hide the native .v-input.
      vInput.style.display = 'none'; // redundant with buildAOResetCSS, maar garandeert hide vóór style-tag geladen is

      // Build .ao-field.
      var aoField = document.createElement('div');
      aoField.className = 'ao-field';
      aoField.setAttribute('data-variant', variant);
      aoField.setAttribute('data-label-pos', labelPos);
      // floating: CSS-gedrag (label zweeft omhoog bij focus) wordt geïmplementeerd in Task 3 CSS
      aoField.setAttribute('data-size', size);
      aoField.setAttribute('data-ao-source-id', uid);

      // Build .ao-label.
      if (text) {
        var aoLabel = document.createElement('div');
        aoLabel.className = 'ao-label';
        aoLabel.textContent = text;
        aoField.appendChild(aoLabel);
      }

      // Build .ao-control.
      var aoControl = document.createElement('div');
      aoControl.className = 'ao-control';

      // Optionally build .ao-icon.
      if (iconSVG) {
        var aoIcon = document.createElement('span');
        aoIcon.className = 'ao-icon';
        aoIcon.innerHTML = iconSVG;
        aoControl.appendChild(aoIcon);
      }

      // Build input.ao-input.
      var aoInput = document.createElement('input');
      aoInput.className = 'ao-input';
      aoInput.type = 'text';
      aoControl.appendChild(aoInput);

      aoField.appendChild(aoControl);

      // Insert .ao-field directly after the hidden .v-input (in-flow).
      vInput.insertAdjacentElement('afterend', aoField);
    });
  }

  /**
   * bridgeValue(aoField)
   * A-bridge TODO: sync ao-input.value -> native input + dispatch events
   */
  function bridgeValue(aoField) { // eslint-disable-line no-unused-vars
  }

  /* ================================================================
     makeConfigSidebar(id, title, opts, onChange)
     Ported from archie-input-reference-v13.0.html (ES6 -> ES5).
  ================================================================ */
  function makeConfigSidebar(id, title, opts, onChange) {
    opts = opts || {};
    var showVariant = opts.showVariant !== false;
    var showLabelPos = opts.showLabelPos !== false;
    var showSize = opts.showSize !== false;
    var showSlots = opts.showSlots === true;

    var _cfg = {
      variant: 'outlined',
      labelPos: 'top',
      radius: 8,
      radiusPos: 'beide',
      size: 'standard',
      customHeight: 48,
      borderColor: '#B3C0DD',
      fillColor: '#FFFFFF',
      labelColor: '#464646',
      textColor: '#1A1A2E',
      strokeWidth: 1,
      slots: {
        prepend: false,
        prependInner: false,
        appendInner: false,
        append: false,
        messages: false,
        counter: false,
        loader: false
      }
    };

    function el(tag, cls) {
      var node = document.createElement(tag);
      if (cls) node.className = cls;
      return node;
    }

    function _notify() {
      if (typeof onChange === 'function') {
        onChange(getConfig());
      }
    }

    // Reachable from setConfig so it can toggle the custom-height slider wrapper.
    var customHeightWrap = null;

    var aside = el('aside', 'config-sidebar');
    aside.id = 'config-sidebar-' + id;
    aside.setAttribute('aria-hidden', 'true');

    var header = el('div', 'config-sidebar-header');
    var leftGroup = el('div', 'config-sidebar-header-left');
    var gearIconEl = el('span', 'config-sidebar-gear-icon');
    gearIconEl.innerHTML = '<svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M16.17 10c0-.29-.02-.58-.06-.86l1.86-1.45a.44.44 0 0 0 .11-.57l-1.76-3.05a.44.44 0 0 0-.54-.2l-2.2.88a6.4 6.4 0 0 0-1.49-.86l-.33-2.34A.44.44 0 0 0 11.3 1h-2.6a.44.44 0 0 0-.44.37l-.33 2.34c-.54.22-1.04.52-1.49.86l-2.2-.88a.44.44 0 0 0-.54.2L1.94 7.12a.43.43 0 0 0 .11.57l1.86 1.45A6.6 6.6 0 0 0 3.83 10c0 .29.02.58.06.86L2.05 12.31a.44.44 0 0 0-.11.57l1.76 3.05c.12.2.36.28.54.2l2.2-.88c.45.34.95.64 1.49.86l.33 2.34c.05.21.24.37.44.37h2.6c.21 0 .4-.16.44-.37l.33-2.34a6.4 6.4 0 0 0 1.49-.86l2.2.88c.2.08.43 0 .54-.2l1.76-3.05a.43.43 0 0 0-.11-.57l-1.86-1.45c.04-.28.06-.57.06-.86Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    var titleSpan = el('span', 'config-sidebar-title');
    titleSpan.textContent = title;
    leftGroup.appendChild(gearIconEl);
    leftGroup.appendChild(titleSpan);
    var closeBtn = el('button', 'config-close-btn');
    closeBtn.setAttribute('aria-label', 'Sluiten');
    closeBtn.textContent = '✕';
    closeBtn.addEventListener('click', function () { close(); });
    header.appendChild(leftGroup);
    header.appendChild(closeBtn);
    aside.appendChild(header);

    if (showVariant) {
      var sec = el('div', 'config-section');
      var secLabel = el('div', 'config-section-label');
      secLabel.textContent = 'Veldtype';
      sec.appendChild(secLabel);

      var group = el('div', 'config-radio-group');
      var variantOptions = [
        { value: 'outlined', label: 'Outlined' },
        { value: 'outlined-filled', label: 'Outlined + Fill' },
        { value: 'filled', label: 'Filled' },
        { value: 'filled-underline', label: 'Filled + Underline' },
        { value: 'underline', label: 'Underline only' },
        { value: 'borderless', label: 'No container' }
      ];
      variantOptions.forEach(function (opt) {
        var lbl = el('label');
        var inp = document.createElement('input');
        inp.type = 'radio';
        inp.name = 'variant-' + id;
        inp.value = opt.value;
        if (opt.value === _cfg.variant) inp.checked = true;
        inp.addEventListener('change', function () {
          _cfg.variant = opt.value;
          _notify();
        });
        lbl.appendChild(inp);
        lbl.appendChild(document.createTextNode(' ' + opt.label));
        group.appendChild(lbl);
      });
      sec.appendChild(group);
      aside.appendChild(sec);
    }

    if (showLabelPos) {
      var secL = el('div', 'config-section');
      var secLabelL = el('div', 'config-section-label');
      secLabelL.textContent = 'Labelpositie (beta)';
      secL.appendChild(secLabelL);

      var groupL = el('div', 'config-radio-group');
      [
        { value: 'top', label: 'Boven' },
        { value: 'left', label: 'Links' },
        { value: 'right', label: 'Rechts' },
        { value: 'floating', label: 'Zwevend' }
      ].forEach(function (opt) {
        var lbl = el('label');
        var inp = document.createElement('input');
        inp.type = 'radio';
        inp.name = 'labelPos-' + id;
        inp.value = opt.value;
        if (opt.value === _cfg.labelPos) inp.checked = true;
        inp.addEventListener('change', function () {
          _cfg.labelPos = opt.value;
          _notify();
        });
        lbl.appendChild(inp);
        lbl.appendChild(document.createTextNode(' ' + opt.label));
        groupL.appendChild(lbl);
      });
      secL.appendChild(groupL);
      aside.appendChild(secL);
    }

    if (opts.showRadius !== false) {
      var radiusSection = document.createElement('div');
      radiusSection.className = 'config-section';

      var radiusLabel = document.createElement('div');
      radiusLabel.className = 'config-section-label';
      radiusLabel.textContent = 'Hoekradius';
      radiusSection.appendChild(radiusLabel);

      var radiusPosGroup = document.createElement('div');
      radiusPosGroup.className = 'config-radio-group';
      var radiusPosOptions = [
        { value: 'geen', label: 'Geen' },
        { value: 'boven', label: 'Boven' },
        { value: 'beneden', label: 'Beneden' },
        { value: 'beide', label: 'Beide' }
      ];
      var chipsRow = document.createElement('div');
      radiusPosOptions.forEach(function (opt) {
        var lbl = document.createElement('label');
        lbl.className = 'config-radio-item';
        var inp = document.createElement('input');
        inp.type = 'radio';
        inp.name = 'radiusPos-' + id;
        inp.value = opt.value;
        if (opt.value === (_cfg.radiusPos || 'beide')) inp.checked = true;
        inp.addEventListener('change', function () {
          _cfg.radiusPos = opt.value;
          chipsRow.style.display = opt.value === 'geen' ? 'none' : 'flex';
          _notify();
        });
        lbl.appendChild(inp);
        lbl.appendChild(document.createTextNode(' ' + opt.label));
        radiusPosGroup.appendChild(lbl);
      });
      radiusSection.appendChild(radiusPosGroup);

      chipsRow.className = 'config-radius-chips';
      chipsRow.style.display = (_cfg.radiusPos === 'geen') ? 'none' : 'flex';
      chipsRow.style.flexWrap = 'wrap';
      chipsRow.style.gap = '4px';
      chipsRow.style.marginTop = '8px';
      [0, 2, 4, 6, 8, 12, 16, 24].forEach(function (r) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'config-radius-pill' + ((_cfg.radius || 8) === r ? ' active' : '');
        btn.textContent = r;
        btn.addEventListener('click', function () {
          _cfg.radius = r;
          chipsRow.querySelectorAll('.config-radius-pill').forEach(function (b) {
            b.classList.toggle('active', b === btn);
          });
          _notify();
        });
        chipsRow.appendChild(btn);
      });
      radiusSection.appendChild(chipsRow);
      aside.appendChild(radiusSection);
    }

    if (showSize) {
      var sizeSection = document.createElement('div');
      sizeSection.className = 'config-section';
      var sizeSectionLabel = document.createElement('div');
      sizeSectionLabel.className = 'config-section-label';
      sizeSectionLabel.textContent = 'Grootte';
      sizeSection.appendChild(sizeSectionLabel);

      var segBar = document.createElement('div');
      segBar.className = 'config-segmented';

      var SIZE_OPTIONS = ['Compact', 'Standaard', 'Large', 'Custom'];
      var SIZE_VALUES = ['compact', 'standard', 'large', 'custom'];
      var segBtns = [];

      customHeightWrap = document.createElement('div');
      customHeightWrap.style.display = (_cfg.size === 'custom') ? 'block' : 'none';
      customHeightWrap.style.marginTop = '10px';

      var customRow = document.createElement('div');
      customRow.style.cssText = 'display:flex;gap:8px;align-items:center;';

      var customSlider = document.createElement('input');
      customSlider.type = 'range';
      customSlider.min = 24;
      customSlider.max = 84;
      customSlider.step = 2;
      customSlider.value = _cfg.customHeight || 48;
      customSlider.style.cssText = 'flex:1;accent-color:var(--primary);cursor:pointer;';

      var customNumber = document.createElement('input');
      customNumber.type = 'number';
      customNumber.min = 24;
      customNumber.max = 84;
      customNumber.step = 2;
      customNumber.value = _cfg.customHeight || 48;
      customNumber.className = 'config-number-input';
      customNumber.style.cssText = 'width:56px;flex-shrink:0;padding:4px 6px;';

      customSlider.addEventListener('input', function () {
        var v = parseInt(customSlider.value, 10);
        customNumber.value = v;
        _cfg.customHeight = v;
        _notify();
      });
      customNumber.addEventListener('input', function () {
        var v = Math.max(24, Math.min(84, parseInt(customNumber.value, 10) || 48));
        customSlider.value = v;
        _cfg.customHeight = v;
        _notify();
      });

      customRow.appendChild(customSlider);
      customRow.appendChild(customNumber);
      customHeightWrap.appendChild(customRow);

      SIZE_VALUES.forEach(function (val, i) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'config-seg-btn' + (val === _cfg.size ? ' active' : '');
        btn.textContent = SIZE_OPTIONS[i];
        btn.addEventListener('click', function () {
          _cfg.size = val;
          segBtns.forEach(function (b) { b.classList.remove('active'); });
          btn.classList.add('active');
          customHeightWrap.style.display = val === 'custom' ? 'block' : 'none';
          _notify();
        });
        segBtns.push(btn);
        segBar.appendChild(btn);
      });

      sizeSection.appendChild(segBar);
      sizeSection.appendChild(customHeightWrap);
      aside.appendChild(sizeSection);
    }

    /* ── Kleuren section (Phase 3) ────────────────────────────── */
    var colorSection = document.createElement('div');
    colorSection.className = 'config-section';
    var colorLabel = document.createElement('div');
    colorLabel.className = 'config-section-label';
    colorLabel.textContent = 'Kleuren';
    colorSection.appendChild(colorLabel);

    var colorList = document.createElement('div');
    colorList.className = 'config-color-list';

    var colorRows = [
      { key: 'borderColor', label: 'Rand' },
      { key: 'fillColor', label: 'Vulling' },
      { key: 'labelColor', label: 'Label' },
      { key: 'textColor', label: 'Tekst' }
    ];
    colorRows.forEach(function (row) {
      var rowEl = document.createElement('div');
      rowEl.className = 'config-color-row';

      var rowLabel = document.createElement('span');
      rowLabel.className = 'config-color-row-label';
      rowLabel.textContent = row.label;

      var swatch = document.createElement('input');
      swatch.type = 'color';
      swatch.className = 'config-color-swatch';
      swatch.value = _cfg[row.key];
      swatch.dataset.colorKey = row.key;

      var hex = document.createElement('input');
      hex.type = 'text';
      hex.className = 'config-color-hex';
      hex.value = _cfg[row.key];
      hex.dataset.colorKey = row.key;

      swatch.addEventListener('input', function () {
        var v = swatch.value;
        hex.value = v;
        _cfg[row.key] = v;
        _notify();
      });
      hex.addEventListener('input', function () {
        var v = hex.value;
        if (/^#[0-9a-fA-F]{6}$/.test(v)) {
          swatch.value = v;
        }
        _cfg[row.key] = v;
        _notify();
      });

      rowEl.appendChild(rowLabel);
      rowEl.appendChild(swatch);
      rowEl.appendChild(hex);
      colorList.appendChild(rowEl);
    });
    colorSection.appendChild(colorList);
    aside.appendChild(colorSection);

    /* ── Stroke-dikte section (Phase 3) ───────────────────────── */
    var strokeSection = document.createElement('div');
    strokeSection.className = 'config-section';
    var strokeLabel = document.createElement('div');
    strokeLabel.className = 'config-section-label';
    strokeLabel.textContent = 'Stroke-dikte';
    strokeSection.appendChild(strokeLabel);

    var strokeRow = document.createElement('div');
    strokeRow.className = 'config-stroke-row';

    var strokeSlider = document.createElement('input');
    strokeSlider.type = 'range';
    strokeSlider.className = 'config-stroke-slider';
    strokeSlider.min = 0;
    strokeSlider.max = 4;
    strokeSlider.step = 1;
    strokeSlider.value = _cfg.strokeWidth;

    var strokeValue = document.createElement('span');
    strokeValue.className = 'config-stroke-value';
    strokeValue.textContent = _cfg.strokeWidth + 'px';

    strokeSlider.addEventListener('input', function () {
      var v = parseInt(strokeSlider.value, 10);
      _cfg.strokeWidth = v;
      strokeValue.textContent = v + 'px';
      _notify();
    });

    strokeRow.appendChild(strokeSlider);
    strokeRow.appendChild(strokeValue);
    strokeSection.appendChild(strokeRow);
    aside.appendChild(strokeSection);

    if (showSlots) {
      var secS = el('div', 'config-section');
      var secLabelS = el('div', 'config-section-label');
      secLabelS.textContent = 'Zichtbare elementen';
      secS.appendChild(secLabelS);

      var toggleList = el('div', 'config-toggle-list');
      toggleList.id = 'slot-toggles-' + id;

      var slotDefs = [
        { key: 'prepend', label: 'Prepend (buiten)' },
        { key: 'prependInner', label: 'Prepend inner' },
        { key: 'appendInner', label: 'Append inner' },
        { key: 'append', label: 'Append (buiten)' },
        { key: 'messages', label: 'Berichten' },
        { key: 'counter', label: 'Teller' },
        { key: 'loader', label: 'Loader' }
      ];

      slotDefs.forEach(function (def) {
        var row = el('div', 'config-toggle-row');
        var lbl = el('span', 'config-toggle-label');
        lbl.textContent = def.label;

        var toggleWrap = el('label', 'config-toggle');
        var inp = document.createElement('input');
        inp.type = 'checkbox';
        inp.dataset.slotKey = def.key;
        inp.checked = _cfg.slots[def.key] || false;
        inp.addEventListener('change', function () {
          _cfg.slots[def.key] = inp.checked;
          _notify();
        });
        var track = el('span', 'config-toggle-track');
        var thumb = el('span', 'config-toggle-thumb');

        toggleWrap.appendChild(inp);
        toggleWrap.appendChild(track);
        toggleWrap.appendChild(thumb);

        row.appendChild(lbl);
        row.appendChild(toggleWrap);
        toggleList.appendChild(row);
      });

      secS.appendChild(toggleList);
      aside.appendChild(secS);
    }

    /* ── Footer (Phase 3) — "Huidig" reset ────────────────────── */
    var footer = el('div', 'config-footer');
    var resetBtn = el('button', 'config-footer-btn');
    resetBtn.type = 'button';
    resetBtn.textContent = '↩ Huidig';
    resetBtn.addEventListener('click', function () {
      setConfig(ORIGINAL);
      removeStyle();
      removeAOFields();
    });
    footer.appendChild(resetBtn);
    aside.appendChild(footer);

    function open() {
      aside.classList.add('open');
      aside.setAttribute('aria-hidden', 'false');
    }

    function close() {
      aside.classList.remove('open');
      aside.setAttribute('aria-hidden', 'true');
    }

    function toggle() {
      if (aside.classList.contains('open')) { close(); } else { open(); }
    }

    function getConfig() {
      return {
        variant: _cfg.variant,
        labelPos: _cfg.labelPos,
        radius: _cfg.radius,
        radiusPos: _cfg.radiusPos,
        size: _cfg.size,
        customHeight: _cfg.customHeight,
        borderColor: _cfg.borderColor,
        fillColor: _cfg.fillColor,
        labelColor: _cfg.labelColor,
        textColor: _cfg.textColor,
        strokeWidth: _cfg.strokeWidth,
        slots: {
          prepend: _cfg.slots.prepend,
          prependInner: _cfg.slots.prependInner,
          appendInner: _cfg.slots.appendInner,
          append: _cfg.slots.append,
          messages: _cfg.slots.messages,
          counter: _cfg.slots.counter,
          loader: _cfg.slots.loader
        }
      };
    }

    function setConfig(newCfg) {
      if (newCfg.variant !== undefined) _cfg.variant = newCfg.variant;
      if (newCfg.labelPos !== undefined) _cfg.labelPos = newCfg.labelPos;
      if (newCfg.radius !== undefined) _cfg.radius = newCfg.radius;
      if (newCfg.radiusPos !== undefined) _cfg.radiusPos = newCfg.radiusPos;
      if (newCfg.size !== undefined) _cfg.size = newCfg.size;
      if (newCfg.customHeight !== undefined) _cfg.customHeight = newCfg.customHeight;
      if (newCfg.borderColor !== undefined) _cfg.borderColor = newCfg.borderColor;
      if (newCfg.fillColor !== undefined) _cfg.fillColor = newCfg.fillColor;
      if (newCfg.labelColor !== undefined) _cfg.labelColor = newCfg.labelColor;
      if (newCfg.textColor !== undefined) _cfg.textColor = newCfg.textColor;
      if (newCfg.strokeWidth !== undefined) _cfg.strokeWidth = newCfg.strokeWidth;
      if (newCfg.slots !== undefined) {
        for (var k in newCfg.slots) {
          if (Object.prototype.hasOwnProperty.call(newCfg.slots, k)) {
            _cfg.slots[k] = newCfg.slots[k];
          }
        }
      }

      aside.querySelectorAll('input[type="radio"]').forEach(function (inp) {
        if (inp.name === 'variant-' + id) inp.checked = inp.value === _cfg.variant;
        if (inp.name === 'labelPos-' + id) inp.checked = inp.value === _cfg.labelPos;
        if (inp.name === 'size-' + id) inp.checked = inp.value === _cfg.size;
        if (inp.name === 'radiusPos-' + id) inp.checked = inp.value === _cfg.radiusPos;
      });

      aside.querySelectorAll('.config-seg-btn').forEach(function (btn) {
        var labelMap = { 'Compact': 'compact', 'Standaard': 'standard', 'Large': 'large', 'Custom': 'custom' };
        btn.classList.toggle('active', labelMap[btn.textContent] === _cfg.size);
      });

      if (customHeightWrap) {
        customHeightWrap.style.display = (_cfg.size === 'custom') ? 'block' : 'none';
      }

      aside.querySelectorAll('.config-radius-pill').forEach(function (pill) {
        pill.classList.toggle('active', Number(pill.textContent) === _cfg.radius);
      });

      // Reset the 5 Phase-3 inputs (color swatches + hex + stroke).
      aside.querySelectorAll('.config-color-swatch').forEach(function (sw) {
        var key = sw.dataset.colorKey;
        if (_cfg[key] !== undefined) sw.value = _cfg[key];
      });
      aside.querySelectorAll('.config-color-hex').forEach(function (hx) {
        var key = hx.dataset.colorKey;
        if (_cfg[key] !== undefined) hx.value = _cfg[key];
      });
      aside.querySelectorAll('.config-stroke-slider').forEach(function (sl) {
        sl.value = _cfg.strokeWidth;
      });
      aside.querySelectorAll('.config-stroke-value').forEach(function (sv) {
        sv.textContent = _cfg.strokeWidth + 'px';
      });

      aside.querySelectorAll('#slot-toggles-' + id + ' input[type="checkbox"]').forEach(function (inp) {
        inp.checked = _cfg.slots[inp.dataset.slotKey] || false;
      });
    }

    return { el: aside, getConfig: getConfig, setConfig: setConfig, open: open, close: close, toggle: toggle };
  }

  // ── applyAOTokens — set CSS custom properties from config ────────────────
  function applyAOTokens(cfg) {
    var root = document.documentElement;

    root.style.setProperty('--ao-border-color', cfg.borderColor || '#B3C0DD');
    root.style.setProperty('--ao-fill', cfg.fillColor || '#FFFFFF');
    root.style.setProperty('--ao-label-color', cfg.labelColor || '#464646');
    root.style.setProperty('--ao-text-color', cfg.textColor || '#1A1A2E');
    root.style.setProperty('--ao-stroke', (cfg.strokeWidth || 1) + 'px');

    // Calculate --ao-radius-top based on radiusPos
    var radiusValue = cfg.radius || 8;
    var radiusPos = cfg.radiusPos || 'beide';
    var radiusTop = '0px';
    var radiusBottom = '0px';

    if (radiusPos === 'boven' || radiusPos === 'beide') {
      radiusTop = radiusValue + 'px';
    }
    if (radiusPos === 'beneden' || radiusPos === 'beide') {
      radiusBottom = radiusValue + 'px';
    }

    root.style.setProperty('--ao-radius-top', radiusTop);
    root.style.setProperty('--ao-radius-bottom', radiusBottom);
  }

  // ── applyConfig — shared apply path for handleChange + observer ─────────
  function applyConfig(cfg) {
    applyAOTokens(cfg);
    injectStyle(buildAOResetCSS());
    injectAOFields(cfg);
  }

  // ── onChange wiring ─────────────────────────────────────────────────────
  function handleChange(cfg) {
    applyConfig(cfg);
  }

  // ── startObserver ───────────────────────────────────────────────────────
  function startObserver(sidebar) {
    var observer = new MutationObserver(function (mutations) {
      var hasNewField = mutations.some(function (m) {
        return Array.prototype.some.call(m.addedNodes, function (node) {
          return node.nodeType === 1 && (
            (node.classList && node.classList.contains('v-field')) ||
            (node.querySelector && node.querySelector('.v-field'))
          );
        });
      });
      if (hasNewField) {
        clearTimeout(_reskinTimer);
        _reskinTimer = setTimeout(function () {
          applyConfig(sidebar.getConfig());
        }, 80);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    window._archieObserver = observer;
  }

  // ── Load panel.css ──────────────────────────────────────────────────────
  var link = document.createElement('link');
  link.id = CSS_LINK_ID;
  link.rel = 'stylesheet';
  link.href = BASE_URL + 'panel.css?v=' + Date.now();
  document.head.appendChild(link);

  // ── Mount ───────────────────────────────────────────────────────────────
  var wrapper = document.createElement('div');
  wrapper.id = PANEL_ID;
  document.body.appendChild(wrapper);

  var sidebar = makeConfigSidebar('archie', 'Archie Design Override', { showSlots: false }, handleChange);
  wrapper.appendChild(sidebar.el);
  sidebar.open();

  startObserver(sidebar);

  console.log('[Archie Override v' + VERSION + '] loaded');
})();
