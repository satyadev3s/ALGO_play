# AlgoPlay multilingual support

The `multilingual` directory contains the six supported dictionaries:

| Code | Language | File |
| --- | --- | --- |
| `en` | English | [en.json](./en.json) |
| `te` | Telugu | [te.json](./te.json) |
| `hi` | Hindi | [hi.json](./hi.json) |
| `ta` | Tamil | [ta.json](./ta.json) |
| `or` | Odia | [or.json](./or.json) |
| `ml` | Malayalam | [ml.json](./ml.json) |

## Site-wide integration

Every HTML page loads [site-i18n.js](./site-i18n.js). It loads all six dictionaries, adds a language picker where a page does not already provide one, translates `data-i18n`, `data-i18n-placeholder`, and `data-i18n-title` attributes, and translates matching static English labels on legacy pages that do not yet have markers. Scripts, styles, inputs, and dynamic content are excluded from the fallback pass.

The public landing page keeps its navigation picker and richer section-specific translator in [landing-i18n.js](./landing-i18n.js). Both translators use the shared `algoplay_lang` preference, so navigation between pages keeps the selected language.

If a dictionary cannot be loaded, the page keeps its English markup instead of breaking navigation or authentication.

All pages also load [app-theme.css](./app-theme.css), which provides shared design tokens, keyboard focus states, mobile tap targets, and a site-wide `prefers-reduced-motion` rule without replacing page-specific layouts.

## Compatibility with `lang.js`

`lang.js` is a compatibility bridge for older pages. The shared loader owns dictionary loading and DOM translation, while `lang.js` preserves the `window.setLanguage()` API for existing page code.

The selected language is saved under `localStorage.getItem('algoplay_lang')`, synchronized across open tabs, and applied to the document `lang` attribute. To update translations, edit the corresponding language JSON file.
