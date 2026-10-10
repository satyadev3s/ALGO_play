(function () {
  "use strict";

  const STORAGE_KEY = "algoplay_lang";
  const CODES = ["en", "te", "hi", "ta", "or", "ml"];
  const NAMES = {
    en: "English",
    te: "తెలుగు",
    hi: "हिन्दी",
    ta: "தமிழ்",
    or: "ଓଡ଼ିଆ",
    ml: "മലയാളം"
  };
  let dictionaries = {};
  let activeLanguage = "en";
  let englishValues = new Map();
  const originalText = new WeakMap();
  let translationTimer;

  function normalize(value) {
    return value.replace(/\s+/g, " ").trim();
  }

  function rememberEnglishValues(dictionary) {
    englishValues = new Map();
    Object.entries(dictionary).forEach(([key, value]) => {
      if (typeof value !== "string" || /<[^>]+>/.test(value)) return;
      const normalized = normalize(value);
      if (normalized) englishValues.set(normalized, key);
    });
  }

  function setElementValue(element, value) {
    if (!element || typeof value !== "string") return;
    if (/<[a-z][\s\S]*>/i.test(value)) element.innerHTML = value;
    else element.textContent = value;
  }

  function translateMarkedElements(dictionary) {
    document.querySelectorAll("[data-i18n]").forEach(element => {
      const value = dictionary[element.getAttribute("data-i18n")];
      if (value) setElementValue(element, value);
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(element => {
      const value = dictionary[element.getAttribute("data-i18n-placeholder")];
      if (value) element.setAttribute("placeholder", value);
    });
    document.querySelectorAll("[data-i18n-title]").forEach(element => {
      const value = dictionary[element.getAttribute("data-i18n-title")];
      if (value) element.setAttribute("title", normalize(value));
    });
  }

  function translateKnownText(dictionary) {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
    const elements = [];
    while (walker.nextNode()) elements.push(walker.currentNode);
    elements.forEach(element => {
      if (element.matches("script, style, select, option, textarea, input, [data-i18n]")) return;
      if (element.children.length > 0) return;
      if (!originalText.has(element)) {
        originalText.set(element, normalize(element.textContent || ""));
      }
      const source = originalText.get(element);
      const key = englishValues.get(source);
      if (key && dictionary[key]) setElementValue(element, dictionary[key]);
    });
  }

  function translatePage(dictionary) {
    translateMarkedElements(dictionary);
    translateKnownText(dictionary);
  }

  function updateLanguageControl() {
    const select = document.querySelector(".algoplay-language-control select, #languageSelect");
    if (select) select.value = activeLanguage;
    document.documentElement.lang = activeLanguage;
  }

  function applyLanguage(code) {
    const dictionary = dictionaries[code] || dictionaries.en;
    if (!dictionary) return;
    activeLanguage = dictionaries[code] ? code : "en";
    translatePage(dictionary);
    updateLanguageControl();
    localStorage.setItem(STORAGE_KEY, activeLanguage);
    window.dispatchEvent(new CustomEvent("algoplay:language-changed", {
      detail: { language: activeLanguage }
    }));
  }

  function createControl() {
    let select = document.querySelector("#languageSelect");
    const hasLandingTranslator = Boolean(
      document.querySelector('script[src*="multilingual/landing-i18n.js"]')
    );
    if (select && hasLandingTranslator) return select;
    if (!select) {
      const wrapper = document.createElement("div");
      wrapper.className = "algoplay-language-control";
      wrapper.innerHTML = `
        <span aria-hidden="true">文</span>
        <label>
          <span class="sr-only">Choose language</span>
          <select aria-label="Choose language">
            ${CODES.map(code => `<option value="${code}">${NAMES[code]}</option>`).join("")}
          </select>
        </label>`;
      document.body.appendChild(wrapper);
      select = wrapper.querySelector("select");
    }
    if (select.dataset.algoplayI18nBound === "true") return select;
    select.dataset.algoplayI18nBound = "true";
    select.addEventListener("change", () => applyLanguage(select.value));
    return select;
  }

  async function load() {
    const responses = await Promise.all(CODES.map(async code => {
      const response = await fetch(`multilingual/${code}.json`, { cache: "no-cache" });
      if (!response.ok) throw new Error(`Unable to load ${code}.json`);
      return [code, await response.json()];
    }));
    dictionaries = Object.fromEntries(responses);
    rememberEnglishValues(dictionaries.en);
    createControl();
    applyLanguage(localStorage.getItem(STORAGE_KEY) || "en");
    const observer = new MutationObserver(() => {
      window.clearTimeout(translationTimer);
      translationTimer = window.setTimeout(() => {
        translatePage(dictionaries[activeLanguage] || dictionaries.en);
      }, 50);
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-i18n", "data-i18n-placeholder", "data-i18n-title"]
    });
  }

  window.setLanguage = function (language) {
    if (dictionaries[language]) applyLanguage(language);
    else localStorage.setItem(STORAGE_KEY, language);
  };

  document.addEventListener("DOMContentLoaded", () => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "multilingual/site-i18n.css";
    document.head.appendChild(link);
    load().catch(error => console.error("AlgoPlay multilingual setup failed:", error));
  });
  window.addEventListener("algoplay:language-requested", event => {
    if (event.detail && event.detail.language) window.setLanguage(event.detail.language);
  });
  window.addEventListener("storage", event => {
    if (event.key === STORAGE_KEY && event.newValue && dictionaries[event.newValue]) {
      applyLanguage(event.newValue);
    }
  });
}());
