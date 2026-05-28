<script setup>
import { computed } from "vue";
import { useAppearanceStore } from "@/stores/useAppearanceStore";

const appearanceStore = useAppearanceStore();

const footerTheme = computed(() => appearanceStore.resolvedTheme || "light");

const uiText = computed(() => {
  const isEn = appearanceStore.language === "en";

  return isEn
    ? {
        appName: "Digital Attendance",
        help: "Help",
        privacy: "Privacy Policy",
        terms: "Terms & Conditions",
      }
    : {
        appName: "Absensi Digital",
        help: "Bantuan",
        privacy: "Kebijakan Privasi",
        terms: "Syarat & Ketentuan",
      };
});
</script>

<template>
  <footer class="ft-root" :data-theme="footerTheme">
    <div class="ft-left">
      <span class="ft-logo">
        <svg viewBox="0 0 20 20" fill="none">
          <rect width="20" height="20" rx="5" fill="#16a34a" />
          <rect
            x="5"
            y="6"
            width="10"
            height="10"
            rx="1.2"
            fill="none"
            stroke="white"
            stroke-width="1"
          />
          <rect
            x="7.5"
            y="4"
            width="5"
            height="3"
            rx="0.8"
            fill="none"
            stroke="white"
            stroke-width="1"
          />
          <line
            x1="7"
            y1="10"
            x2="13"
            y2="10"
            stroke="rgba(255,255,255,.6)"
            stroke-width="0.8"
            stroke-linecap="round"
          />
          <line
            x1="7"
            y1="12"
            x2="13"
            y2="12"
            stroke="rgba(255,255,255,.6)"
            stroke-width="0.8"
            stroke-linecap="round"
          />
        </svg>
      </span>

      <p class="ft-copy">
        © 2026 <span class="ft-school">MAN 2 Kota Cilegon</span> · {{ uiText.appName }}
      </p>
    </div>

    <div class="ft-right">
      <a href="#" class="ft-link">{{ uiText.help }}</a>
      <span class="ft-dot" />
      <a href="#" class="ft-link">{{ uiText.privacy }}</a>
      <span class="ft-dot" />
      <a href="#" class="ft-link">{{ uiText.terms }}</a>
      <span class="ft-dot" />
      <span class="ft-version">v1.0.0</span>
    </div>
  </footer>
</template>

<style scoped>
.ft-root {
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  background: #ffffff;
  border-top: 1px solid #e5e7eb;
  font-family: "Poppins", sans-serif;
  flex-shrink: 0;
  gap: 12px;
}

.ft-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ft-logo {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.ft-logo svg {
  width: 20px;
  height: 20px;
}

.ft-copy {
  font-size: 11.5px;
  color: #9ca3af;
  white-space: nowrap;
}

.ft-school {
  color: #16a34a;
  font-weight: 600;
}

.ft-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.ft-link {
  font-size: 11.5px;
  color: #9ca3af;
  text-decoration: none;
  transition: color 0.2s;
  white-space: nowrap;
}

.ft-link:hover {
  color: #16a34a;
}

.ft-dot {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: #d1d5db;
  flex-shrink: 0;
}

.ft-version {
  font-size: 11px;
  color: #d1d5db;
  font-weight: 500;
}

/* Dark mode */
.ft-root[data-theme="dark"] {
  background: #111827;
  border-top-color: #243044;
}

.ft-root[data-theme="dark"] .ft-copy,
.ft-root[data-theme="dark"] .ft-link {
  color: #94a3b8;
}

.ft-root[data-theme="dark"] .ft-school,
.ft-root[data-theme="dark"] .ft-link:hover {
  color: #22c55e;
}

.ft-root[data-theme="dark"] .ft-dot {
  background: #374151;
}

.ft-root[data-theme="dark"] .ft-version {
  color: #64748b;
}

@media (max-width: 640px) {
  .ft-root {
    height: auto;
    flex-direction: column;
    padding: 10px 16px;
    gap: 6px;
    text-align: center;
  }

  .ft-right {
    flex-wrap: wrap;
    justify-content: center;
    gap: 6px 10px;
  }
}
</style>
