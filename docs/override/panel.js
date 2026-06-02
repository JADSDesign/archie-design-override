// Archie Design Override — full control panel
// v1.0.0
// Vanilla ES5 only (var/function) for Chrome bookmarklet compatibility.
(function () {
  var VERSION = '1.0.0';
  var PANEL_ID = 'archie-override-panel';
  var STYLE_ID = 'archie-override-style';
  var CSS_LINK_ID = 'archie-override-css';
  var BASE_URL = 'https://jadsdesign.github.io/archie-design-override/override/';

  var VARIANTS = ['outlined', 'outlined-filled', 'filled', 'filled-underline', 'underline', 'borderless'];

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
    restoreOriginalVariantClasses();
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

  // ── getAllFields ────────────────────────────────────────────────────────
  function getAllFields() {
    return Array.prototype.slice.call(document.querySelectorAll('.v-field'));
  }

  // ── applyVariantClasses — class-swap on every .v-field ──────────────────
  function applyVariantClasses(variant) {
    var fields = getAllFields();
    fields.forEach(function (field) {
      // Store original variant on first swap.
      if (!field.dataset.originalVariant) {
        var orig = null;
        var classes = field.className.split(/\s+/);
        classes.forEach(function (c) {
          if (c.indexOf('v-field--variant-') === 0) {
            orig = c.replace('v-field--variant-', '');
          }
        });
        if (orig) field.dataset.originalVariant = orig;
      }
      // Remove all known variant classes, plus any leftover v-field--variant-*.
      VARIANTS.forEach(function (v) {
        field.classList.remove('v-field--variant-' + v);
      });
      ['solo', 'plain'].forEach(function (v) {
        field.classList.remove('v-field--variant-' + v);
      });
      field.classList.add('v-field--variant-' + variant);
    });
  }

  function restoreOriginalVariantClasses() {
    var fields = getAllFields();
    fields.forEach(function (field) {
      VARIANTS.forEach(function (v) {
        field.classList.remove('v-field--variant-' + v);
      });
      field.classList.remove('v-field--variant-plain');
      var orig = field.dataset.originalVariant || 'outlined';
      field.classList.add('v-field--variant-' + orig);
    });
  }

  // ── buildVariantCSS — per-variant CSS, all rules retargeted ─────────────
  function buildVariantCSS(variant) {
    var lines = [];
    if (variant === 'outlined') {
      lines = [
        '.v-field--variant-outlined { background: transparent !important; }'
      ];
    } else if (variant === 'outlined-filled') {
      // outlined + filled background on .v-field
      lines = [
        '.v-field--variant-outlined-filled { background: var(--archie-fill) !important; }'
      ];
    } else if (variant === 'filled') {
      lines = [
        '.v-field--variant-filled {',
        '  background: var(--archie-fill) !important;',
        '  border-radius: 8px 8px 0 0 !important;',
        '  border-bottom: var(--archie-stroke) solid var(--archie-border) !important;',
        '}'
      ];
    } else if (variant === 'filled-underline') {
      // filled with only bottom border
      lines = [
        '.v-field--variant-filled-underline {',
        '  background: var(--archie-fill) !important;',
        '  border-radius: 0 !important;',
        '  border: none !important;',
        '  border-bottom: var(--archie-stroke) solid var(--archie-border) !important;',
        '}'
      ];
    } else if (variant === 'underline') {
      lines = [
        '.v-field--variant-underline {',
        '  background: transparent !important;',
        '  border-radius: 0 !important;',
        '  border: none !important;',
        '  border-bottom: var(--archie-stroke) solid var(--archie-border) !important;',
        '}'
      ];
    } else if (variant === 'borderless') {
      // .v-field--variant-plain: no border / no bg
      lines = [
        '.v-field--variant-borderless,',
        '.v-field--variant-plain {',
        '  background: transparent !important;',
        '  border: none !important;',
        '  box-shadow: none !important;',
        '}'
      ];
    }
    return lines.join('\n');
  }

  // ── buildCSSFromConfig — single CSS string from the full config ─────────
  function buildCSSFromConfig(cfg) {
    var border = cfg.borderColor || '#B3C0DD';
    var fill = cfg.fillColor || '#FFFFFF';
    var labelColor = cfg.labelColor || '#464646';
    var textColor = cfg.textColor || '#1A1A2E';
    var stroke = (cfg.strokeWidth === 0 || cfg.strokeWidth) ? cfg.strokeWidth : 1;

    // border-radius per corner.
    var radius = (cfg.radius === 0 || cfg.radius) ? cfg.radius : 8;
    var radiusPos = cfg.radiusPos || 'beide';
    var radiusValue;
    if (radiusPos === 'geen') {
      radiusValue = '0';
    } else if (radiusPos === 'boven') {
      radiusValue = radius + 'px ' + radius + 'px 0 0';
    } else if (radiusPos === 'beneden') {
      radiusValue = '0 0 ' + radius + 'px ' + radius + 'px';
    } else {
      radiusValue = radius + 'px';
    }

    // size → control height + min-height.
    var height;
    if (cfg.size === 'compact') {
      height = 38;
    } else if (cfg.size === 'large') {
      height = 58;
    } else if (cfg.size === 'custom') {
      height = cfg.customHeight || 48;
    } else {
      height = 48;
    }

    var lines = [
      '/* Archie Override v' + VERSION + ' */',
      // Helper vars consumed by buildVariantCSS rules (scoped to fields).
      '.v-field {',
      '  --archie-border: ' + border + ' !important;',
      '  --archie-fill: ' + fill + ' !important;',
      '  --archie-stroke: ' + stroke + 'px !important;',
      '  border-radius: ' + radiusValue + ' !important;',
      '  --v-input-control-height: ' + height + 'px !important;',
      '  min-height: ' + height + 'px !important;',
      '}',
      // Fill (background) on the field for non-outlined variants handled in variant CSS;
      // explicit fill mapping for the field itself.
      '.v-field { background: ' + fill + ' !important; }',
      // Label color.
      '.v-label {',
      '  color: ' + labelColor + ' !important;',
      '}',
      // Text color.
      '.v-field__input {',
      '  color: ' + textColor + ' !important;',
      '}',
      // Outlined border color + width (the outline pseudo-elements).
      '.v-field--variant-outlined .v-field__outline__start,',
      '.v-field--variant-outlined .v-field__outline__notch,',
      '.v-field--variant-outlined .v-field__outline__end,',
      '.v-field--variant-outlined-filled .v-field__outline__start,',
      '.v-field--variant-outlined-filled .v-field__outline__notch,',
      '.v-field--variant-outlined-filled .v-field__outline__end {',
      '  border-color: ' + border + ' !important;',
      '  border-width: ' + stroke + 'px !important;',
      '}'
    ];

    var variantCSS = buildVariantCSS(cfg.variant || 'outlined');

    // labelPos — best-effort, must fail silently if Vuetify resists.
    var labelCSS = '';
    var pos = cfg.labelPos || 'top';
    if (pos === 'top') {
      labelCSS = [
        '.v-input .v-label {',
        '  position: static !important;',
        '  transform: none !important;',
        '}'
      ].join('\n');
    } else if (pos === 'left') {
      labelCSS = [
        '.v-input { display: flex !important; align-items: center !important; }',
        '.v-input .v-label { position: static !important; transform: none !important; margin-right: 8px !important; }'
      ].join('\n');
    } else if (pos === 'right') {
      labelCSS = [
        '.v-input { display: flex !important; flex-direction: row-reverse !important; align-items: center !important; }',
        '.v-input .v-label { position: static !important; transform: none !important; margin-left: 8px !important; }'
      ].join('\n');
    }
    // pos === 'floating' leaves Vuetify's native floating behaviour untouched.

    return [lines.join('\n'), variantCSS, labelCSS].join('\n');
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
          if (opt.value === 'geen') _cfg.radius = 0;
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

      var customHeightWrap = document.createElement('div');
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
      restoreOriginalVariantClasses();
      removeStyle();
      _notify();
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

  // ── onChange wiring ─────────────────────────────────────────────────────
  function handleChange(cfg) {
    applyVariantClasses(cfg.variant);
    injectStyle(buildCSSFromConfig(cfg));
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
        setTimeout(function () {
          var cfg = sidebar.getConfig();
          applyVariantClasses(cfg.variant);
          injectStyle(buildCSSFromConfig(cfg));
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
