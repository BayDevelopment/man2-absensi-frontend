import { createI18n } from "vue-i18n";

const savedLanguage = localStorage.getItem("app-language") || "id";

const messages = {
  id: {
    settings: "Pengaturan",
    subtitle: "Kelola preferensi dan keamanan akun",
  },
  en: {
    settings: "Settings",
    subtitle: "Manage preferences and account security",
  },
};

const i18n = createI18n({
  legacy: false,
  locale: savedLanguage,
  fallbackLocale: "id",
  messages,
});

export default i18n;
