# Changelog

## v0.2.0 — 2026-06-02
- Phase 2 PoC: CSS injection validated on live Archie CRM
- `panel.js`: injectStyle, buildOriginalCSS, buildProposalCSS, buildToggleButton, startObserver
- `panel.css`: minimal floating toggle button, all selectors under #archie-override-panel
- Toggle: "Voorstel" switches --v-theme-primary to archiePurple (89,43,89), adds focus ring, cards 12px → 16px
- MutationObserver for SPA navigation durability
- IIFE guard: second bookmarklet click removes panel + style + disconnects observer

## v0.1.0 — 2026-06-02
- Initial skeleton: GitHub Pages wired up, placeholder files created
- Bookmarklet loader installed at docs/index.html
- Project structure: bookmarklet/, override/, docs/, versions/
