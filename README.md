# Archie Design Override

Floating control panel for live design overrides on [crmonline.archie.nu](https://crmonline.archie.nu). Injected via bookmarklet, hosted on GitHub Pages — no changes to the Archie application.

## Install

**Drag this link to your bookmarks bar:**

[⚙ Archie Override](javascript:(function(){var s=document.createElement('script');s.src='https://jadsdesign.github.io/archie-design-override/override/panel.js?v='+Date.now();document.head.appendChild(s);})();)

Or open `docs/index.html` in a browser and drag the link from there.

## Use

1. Log in to [crmonline.archie.nu](https://crmonline.archie.nu)
2. Click the **⚙ Archie Override** bookmark
3. The control panel appears — adjust variant, radius, shadow, typography, button style
4. Click **✦ Voorstel** to apply the full design proposal in one step
5. Click **▾** to collapse the panel during a presentation
6. Click **✕** or click the bookmark again to remove all overrides

## Structure

```
bookmarklet/loader.js          — source of the bookmarklet loader
override/panel.js              — injected control panel
override/panel.css             — panel visual styles (isolated)
override/presets/original.json — Archie original token values
override/presets/proposal.json — design proposal token values
override/tokens/archie-tokens.json — CSS custom properties from live Archie
docs/index.html                — GitHub Pages entry, drag-install page
versions/changelog.md          — version history
```

## Development

Files are served from GitHub Pages at `https://jadsdesign.github.io/archie-design-override/`. The bookmarklet always loads the latest version because of the `?v=Date.now()` cache buster.

To update the panel: edit `override/panel.js`, commit and push to `main`. GitHub Pages propagates in ~1 minute.
