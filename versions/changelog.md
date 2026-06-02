# Changelog

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
