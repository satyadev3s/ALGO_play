(function () {
  "use strict";

  const LANGUAGE_KEY = "algoplay_lang";
  const languages = ["en", "te", "hi", "ta", "or", "ml"];
  const languageNames = {
    en: "English",
    te: "Telugu",
    hi: "Hindi",
    ta: "Tamil",
    or: "Odia",
    ml: "Malayalam"
  };

  const selectorMap = {
    nav_features: ["[data-i18n='nav_features']"],
    nav_tracks: ["[data-i18n='nav_tracks']"],
    nav_how: ["[data-i18n='nav_how']"],
    nav_educators: ["[data-i18n='nav_educators']"],
    nav_teacher_hub: ["[data-i18n='nav_teacher_hub']"],
    nav_sign_in: ["[data-i18n='nav_sign_in']"],
    nav_get_started: ["[data-i18n='nav_get_started']"],
    hero_badge: [".inline-flex.items-center.gap-2 span:last-child"],
    hero_title: ["h1"],
    hero_subtitle: ["h1 + p"],
    btn_start_quest: ["a[href='Loginpage.html'] span"],
    btn_educator_portal: ["a[href='teacherlogin.html'] span"],
    btn_quick_demo: ["a[href='fraction_mission.html'] span"],
    stat_active_students: [".counter[data-target='2500'] + *"],
    stat_missions: [".counter[data-target='15200'] + *"],
    stat_concept_mastery: [".counter[data-target='98'] + *"],
    stat_interactive_labs: [".counter[data-target='50'] + *"],
    features_title: ["#features h2"],
    features_subtitle: ["#features h2 + p"],
    tracks_title: ["#tracks h2"],
    tracks_subtitle: ["#tracks h2 + p"],
    how_title: ["#how h2"],
    how_subtitle: ["#how h2 + p"],
    cta_title: ["section:last-of-type h2"],
    cta_subtitle: ["section:last-of-type h2 + p"],
    cta_btn_student: ["section:last-of-type a[href='signuppage.html']"],
    cta_btn_teacher: ["section:last-of-type a[href='teacherlogin.html']"],
    footer_tagline: ["footer p"],
    footer_copyright: ["footer .max-w-7xl > div:last-child > div:first-child"],
    footer_tech_stack: ["footer .max-w-7xl > div:last-child > div:last-child"]
  };

  const indexedMappings = [
    ["feat_1_title", "#features .card-clickable h3"],
    ["feat_2_title", "#features .card-clickable h3"],
    ["feat_3_title", "#features .card-clickable h3"],
    ["feat_4_title", "#features .card-clickable h3"],
    ["feat_1_desc", "#features .card-clickable p"],
    ["feat_2_desc", "#features .card-clickable p"],
    ["feat_3_desc", "#features .card-clickable p"],
    ["feat_4_desc", "#features .card-clickable p"]
  ];

  function setValue(element, value) {
    if (!element) return;
    if (/<[a-z][\s\S]*>/i.test(value)) element.innerHTML = value;
    else element.textContent = value;
  }

  function applyDictionary(dictionary, language) {
    Object.entries(selectorMap).forEach(([key, selectors]) => {
      const value = dictionary[key];
      if (!value) return;
      selectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(element => setValue(element, value));
      });
    });

    indexedMappings.forEach(([key, selector], index) => {
      const value = dictionary[key];
      if (!value) return;
      const element = document.querySelectorAll(selector)[index % 4];
      setValue(element, value);
    });

    const trackKeys = [
      ["track_math_title", "track_math_sub", "track_math_badge", "track_math_desc", "track_math_dur"],
      ["track_tech_title", "track_tech_sub", "track_tech_badge", "track_tech_desc", "track_tech_dur"],
      ["track_phy_title", "track_phy_sub", "track_phy_badge", "track_phy_desc", "track_phy_dur"],
      ["track_bio_title", "track_bio_sub", "track_bio_badge", "track_bio_desc", "track_bio_dur"],
      ["track_lang_title", "track_lang_sub", "track_lang_badge", "track_lang_desc", "track_lang_dur"],
      ["track_vid_title", "track_vid_sub", "track_vid_badge", "track_vid_desc", "track_vid_dur"]
    ];
    document.querySelectorAll("#tracks .card-clickable").forEach((card, index) => {
      const keys = trackKeys[index];
      if (!keys) return;
      setValue(card.querySelector("h3"), dictionary[keys[0]]);
      setValue(card.querySelector("h3 + p"), dictionary[keys[1]]);
      setValue(card.querySelector("h3 + p + *"), dictionary[keys[2]]);
      setValue(card.querySelector("p.text-xs.text-gray-300"), dictionary[keys[3]]);
      setValue(card.querySelector(".text-gray-400 span:first-child"), dictionary[keys[4]]);
    });

    document.documentElement.lang = language;
    document.title = `AlgoPlay — ${dictionary.hero_badge || languageNames[language]}`;
  }

  async function loadLanguage(language) {
    const selected = languages.includes(language) ? language : "en";
    const response = await fetch(`multilingual/${selected}.json`, { cache: "no-cache" });
    if (!response.ok) throw new Error(`Unable to load ${selected} translations`);
    const dictionary = await response.json();
    applyDictionary(dictionary, selected);
    localStorage.setItem(LANGUAGE_KEY, selected);
    window.dispatchEvent(new CustomEvent("algoplay:language-requested", {
      detail: { language: selected }
    }));
    const select = document.getElementById("languageSelect");
    if (select) select.value = selected;
  }

  document.addEventListener("DOMContentLoaded", () => {
    const select = document.getElementById("languageSelect");
    if (!select) return;
    select.value = localStorage.getItem(LANGUAGE_KEY) || "en";
    select.addEventListener("change", async () => {
      select.disabled = true;
      try {
        await loadLanguage(select.value);
      } catch (error) {
        console.error("Language switch failed:", error);
        select.value = localStorage.getItem(LANGUAGE_KEY) || "en";
      } finally {
        select.disabled = false;
      }
    });
    loadLanguage(select.value).catch(error => console.error("Language load failed:", error));
  });
}());
