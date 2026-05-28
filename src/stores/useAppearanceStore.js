import { defineStore } from "pinia";
import { ref } from "vue";

export const useAppearanceStore = defineStore("appearance", () => {
  const theme = ref("system");
  const resolvedTheme = ref("light");
  const language = ref("id");

  let media = null;
  let themeListener = null;

  function getResolvedTheme(val) {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    return val === "dark" || (val === "system" && prefersDark) ? "dark" : "light";
  }

  function applyTheme(val) {
    if (typeof window === "undefined") return;

    const resolved = getResolvedTheme(val);
    resolvedTheme.value = resolved;

    document.documentElement.setAttribute("data-theme", resolved);
    document.body.setAttribute("data-theme", resolved);
  }

  function setTheme(val) {
    theme.value = val;
    localStorage.setItem("app_theme", val);
    applyTheme(val);
  }

  function setLanguage(val) {
    language.value = val;
    localStorage.setItem("app_language", val);
  }

  function init() {
    if (typeof window === "undefined") return;

    const savedTheme = localStorage.getItem("app_theme") ?? "system";
    const savedLanguage = localStorage.getItem("app_language") ?? "id";

    theme.value = savedTheme;
    language.value = savedLanguage;

    applyTheme(savedTheme);

    media = window.matchMedia("(prefers-color-scheme: dark)");

    if (!themeListener) {
      themeListener = () => {
        if (theme.value === "system") applyTheme("system");
      };
      media.addEventListener("change", themeListener);
    }
  }

  return {
    theme,
    resolvedTheme,
    language,
    setTheme,
    setLanguage,
    init,
  };
});
