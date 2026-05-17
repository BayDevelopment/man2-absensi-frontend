import { createApp } from "vue";
import { createPinia } from "pinia";
import "./assets/main.css";
import App from "./App.vue";
import router from "./router";

const app = createApp(App);

app.use(createPinia());
app.use(router);

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
