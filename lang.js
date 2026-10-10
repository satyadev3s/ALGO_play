// Compatibility bridge for pages that previously loaded lang.js directly.
(function () {
  "use strict";

  window.setLanguage = function (language) {
    localStorage.setItem("algoplay_lang", language);
    window.dispatchEvent(new CustomEvent("algoplay:language-requested", {
      detail: { language: language }
    }));
  };
}());
