# pyRevit Website

## Paper logo backdrop

The home page has the folded-paper pyRevit logo standing in a small WebGL studio behind the content.

- It stands exactly where the avatar image is and folds itself up on load. Other pages are untouched and load none of it.
- The studio follows the theme's light/dark switch.
- The yellow button at the bottom right opens its controls (replay, fold, view, turn, light, fold pattern).
- Without WebGL, or with software-only WebGL, nothing loads and the site looks as it did before.

The scene is `assets/js/paper-logo.js`, styled by `assets/css/paper-logo.css` and wired in through
`layouts/partials/head/extensions.html` and `layouts/partials/body/extensions.html`. It uses three.js r147,
vendored under `assets/js/vendor` (MIT, see `three.LICENSE`).

To switch it off, set `paperLogoBackdrop = false` under `[params]` in `hugo.toml`.
