import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import vi from "./locales/vi";
import en from "./locales/en";

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: {
      vi: { translation: vi },
      en: { translation: en },
    },
    lng: typeof window !== "undefined" ? localStorage.getItem("lang") || "vi" : "vi",
    fallbackLng: "vi",
    interpolation: { escapeValue: false },
  });
}

export const setLanguage = (lng: "vi" | "en") => {
  i18n.changeLanguage(lng);
  if (typeof window !== "undefined") localStorage.setItem("lang", lng);
};

export default i18n;
