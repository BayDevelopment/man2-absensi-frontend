// src/main.js
import { createApp } from "vue";
import { createPinia } from "pinia";
import "./assets/main.css";
import App from "./App.vue";
import router from "./router";
import "./assets/css/theme.css";
import i18n from "./plugins/i18n";
import { useAppearanceStore } from "@/stores/useAppearanceStore";

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.use(i18n);

// ✅ Init appearance SEBELUM mount supaya tidak ada flash/flicker
const appearanceStore = useAppearanceStore();
appearanceStore.init();

// Click outside directive
app.directive("click-outside", {
  mounted(el, binding) {
    el._clickOutside = (e) => {
      if (!el.contains(e.target)) binding.value();
    };
    document.addEventListener("click", el._clickOutside);
  },
  unmounted(el) {
    document.removeEventListener("click", el._clickOutside);
  },
});

app.mount("#app");
