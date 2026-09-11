import i18n from "i18next";
import vi from "./src/i18n/locales/vi.js"; // wait, ts file, let's use tsx

i18n.init({
  resources: {
    vi: { translation: vi },
  },
  lng: "vi",
  fallbackLng: "vi",
  interpolation: { escapeValue: false },
});

console.log("home.businessUnit:", i18n.t("home.businessUnit"));
console.log("home.tagline:", i18n.t("home.tagline"));
