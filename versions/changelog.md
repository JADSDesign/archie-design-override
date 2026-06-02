# Changelog

## v1.0.0 — 2026-06-02
- Phase 3: full control panel — replaces the v0.2.0 toggle PoC with the v13 config sidebar
- `panel.js`: ports `makeConfigSidebar(id, title, opts, onChange)` from archie-input-reference-v13.0.html, converted from ES6 to ES5 (var/function only — no const/let/arrow/template literals) for Chrome bookmarklet compatibility
- Sidebar mounted in `<div id="archie-override-panel">`, opened at init; `showSlots:false` (no "Zichtbare elementen")
- Controls:
  - **Veldtype** — 6 variants: outlined, outlined-filled, filled, filled-underline, underline, borderless (class-swap on every `.v-field` + per-variant CSS)
  - **Labelpositie (beta)** — top / links / rechts / zwevend — best-effort CSS, FAILS SILENTLY when Vuetify resists (fragile/beta)
  - **Hoekradius** — geen / boven / beneden / beide + radius chips (0–24)
  - **Grootte** — compact 38px / standaard 48px / large 58px / custom (slider)
  - **Kleuren ×4** — Rand / Vulling / Label / Tekst — native color picker + synced hex input each
  - **Stroke-dikte** — range 0–4px + Npx readout
- `buildCSSFromConfig(cfg)` maps the full config to one `!important` CSS string; `buildVariantCSS(variant)` for the 6 variants; `applyVariantClasses(variant)` swaps variant classes and stores `dataset.originalVariant`
- "Huidig" footer button resets to measured Archie defaults (variant outlined, radius 8, size standard, original colors), restores original variant classes, removes injected style
- `startObserver()` re-applies variant classes + CSS on new `.v-field` nodes (SPA durability), reuses `window._archieObserver`
- IIFE guard: second bookmarklet click restores variant classes, removes panel + style + css link, disconnects observer
- `presets/proposal.json`: added borderColor #B3C0DD, fillColor #FFFFFF, labelColor #464646, textColor #1A1A2E, strokeWidth 1
- Synced `override/panel.{js,css}` → `docs/override/` (GitHub Pages serves docs/ only)
- ⚠️ labelPos is fragile/beta — Vuetify's internal label positioning may override the injected CSS; the panel does not throw if so

### Live test — 2026-06-02 (crmonline.archie.nu, Organisatie-aanmaken formulier)
- ✅ Paneel rendert links met alle secties (Veldtype, Labelpositie beta, Hoekradius, Grootte, Kleuren ×4, Stroke)
- ✅ Randkleur #FF0000 → rode randen op alle `.v-field__outline` velden (kleur-picker + hex-sync bewezen)
- ✅ Hoekradius 24 zichtbaar op alle velden
- ✅ Veldtype class-swap naar Filled verandert veldstijl zichtbaar
- ✅ "Huidig"-reset herstelt variant, radius, kleuren naar Archie-default
- ✅ MutationObserver: bij heropenen formulier krijgen nieuwe velden direct de actieve override (SPA-durability)
- ✅ Tweede bookmarklet-klik: paneel + override volledig verwijderd, Archie hersteld
- ⏳ Niet apart getest (wiring identiek aan randkleur, hoge zekerheid): fillColor, labelColor, textColor, stroke-dikte
- ⚠️ labelPos (beta) niet apart geverifieerd — fragiel by design

## v0.2.0 — 2026-06-02
- Phase 2 PoC: CSS injection validated on live Archie CRM
- `panel.js`: injectStyle, buildOriginalCSS, buildProposalCSS, buildToggleButton, startObserver
- `panel.css`: minimal floating toggle button, all selectors under #archie-override-panel
- Toggle: "Voorstel" switches --v-theme-primary to archiePurple (89,43,89), adds focus ring, cards 12px → 16px
- MutationObserver for SPA navigation durability
- IIFE guard: second bookmarklet click removes panel + style + disconnects observer

### Live test — 2026-06-02 (crmonline.archie.nu)
- ✅ Toggle button appears bottom-right after bookmarklet click
- ✅ "Voorstel" → proposal CSS injected, primary color + card radius visible
- ✅ "← Huidig" → original CSS restored
- ✅ SPA navigation: button + style survive route change
- ✅ Second bookmarklet click: panel removed, style removed, observer disconnected
- ✅ --v-theme-primary override works (CSS custom property on :root)
- ✅ .v-card border-radius override works
- ⚠️ panel.css had to be moved into docs/ (GitHub Pages serves docs/ only)

## v0.1.0 — 2026-06-02
- Initial skeleton: GitHub Pages wired up, placeholder files created
- Bookmarklet loader installed at docs/index.html
- Project structure: bookmarklet/, override/, docs/, versions/
