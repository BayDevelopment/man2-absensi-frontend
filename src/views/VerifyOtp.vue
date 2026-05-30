<!-- src/views/VerifyOtp.vue -->
<script setup>
import { ref, computed, onMounted, nextTick } from "vue";
import { storeToRefs } from "pinia";
import { useAppearanceStore } from "@/stores/useAppearanceStore";
import { useAuthStore } from "@/stores/auth";
import { useRouter } from "vue-router";
import Swal from "sweetalert2";

// ---------------------------
// Theme & Language — dari store
// ---------------------------
const appearanceStore = useAppearanceStore();
const { theme: themeMode, resolvedTheme, language } = storeToRefs(appearanceStore);

const isDark = computed(() => resolvedTheme.value === "dark");
const isEn = computed(() => language.value === "en");

// ---------------------------
// i18n
// ---------------------------
const t = computed(() =>
  isEn.value
    ? {
        pageTitle: "Security Verification",
        pageSubtitle: "Two-Factor Authentication",
        cardTitle: "Enter OTP Code",
        cardSubtitle: "A 6-digit code has been sent to your email",
        infoBanner: "Check your inbox or spam folder",
        otpLabel: "OTP Code",
        otpPlaceholder: "Enter 6-digit code",
        submit: "Verify OTP",
        submitting: "Verifying...",
        back: "Back to Login",
        footer: "© 2026 MAN 2 Kota Cilegon · Digital Attendance System",
        errDefault: "Invalid or expired OTP",
        toastSuccess: "Login successful!",
        themeLight: "Light",
        themeDark: "Dark",
        themeSystem: "System",
        mobileTitle: "OTP Verification",
        mobileSub: "Digital Attendance System",
      }
    : {
        pageTitle: "Verifikasi Keamanan",
        pageSubtitle: "Two-Factor Authentication",
        cardTitle: "Masukkan Kode OTP",
        cardSubtitle: "Kode 6 digit telah dikirim ke email kamu",
        infoBanner: "Cek inbox atau folder spam email kamu",
        otpLabel: "Kode OTP",
        otpPlaceholder: "Masukkan 6 digit kode",
        submit: "Verifikasi OTP",
        submitting: "Memverifikasi...",
        back: "Kembali ke Login",
        footer: "© 2026 MAN 2 Kota Cilegon · Sistem Absensi Digital",
        errDefault: "OTP salah atau kadaluarsa",
        toastSuccess: "Login berhasil!",
        themeLight: "Terang",
        themeDark: "Gelap",
        themeSystem: "Sistem",
        mobileTitle: "Verifikasi OTP",
        mobileSub: "Sistem Absensi Digital",
      },
);

// ---------------------------
// Refs & State
// ---------------------------
const auth = useAuthStore();
const router = useRouter();
const otp = ref("");
const error = ref("");
const loading = ref(false);
const mounted = ref(false);

// ---------------------------
// Toast
// ---------------------------
const toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 2000,
  timerProgressBar: true,
  iconColor: "white",
  customClass: { popup: "colored-toast" },
  didOpen: (toastEl) => {
    toastEl.addEventListener("mouseenter", Swal.stopTimer);
    toastEl.addEventListener("mouseleave", Swal.resumeTimer);
  },
});

// ---------------------------
// Submit
// ---------------------------
async function submit() {
  if (otp.value.length < 6) return;
  loading.value = true;
  error.value = "";

  try {
    await auth.verifyOtp(otp.value);
  } catch (e) {
    error.value = e.response?.data?.message ?? t.value.errDefault;
    loading.value = false;
    return;
  }

  loading.value = false;
  toast.fire({ icon: "success", title: t.value.toastSuccess });
  router.push({ name: "Dashboard" });
}

// ---------------------------
// Lifecycle
// ---------------------------
onMounted(async () => {
  await nextTick();
  mounted.value = true;
  // ✅ Tidak perlu init theme/lang di sini — sudah dihandle main.js
});
</script>

<template>
  <main class="login-root" :class="isDark ? 'theme-dark' : 'theme-light'">
    <!-- ── Controls bar (top-right) ── -->
    <div class="controls-bar">
      <!-- Language toggle -->
      <div class="lang-switcher">
        <button
          class="lang-btn"
          :class="{ active: language === 'id' }"
          @click="appearanceStore.setLanguage('id')"
        >
          <span class="flag">🇮🇩</span> ID
        </button>
        <button
          class="lang-btn"
          :class="{ active: language === 'en' }"
          @click="appearanceStore.setLanguage('en')"
        >
          <span class="flag">🇬🇧</span> EN
        </button>
      </div>

      <!-- Theme switcher -->
      <div class="theme-switcher">
        <button
          class="theme-btn"
          :class="{ active: themeMode === 'light' }"
          :title="t.themeLight"
          @click="appearanceStore.setTheme('light')"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="4" />
            <path
              stroke-linecap="round"
              d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
            />
          </svg>
        </button>
        <button
          class="theme-btn"
          :class="{ active: themeMode === 'dark' }"
          :title="t.themeDark"
          @click="appearanceStore.setTheme('dark')"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z"
            />
          </svg>
        </button>
        <button
          class="theme-btn"
          :class="{ active: themeMode === 'system' }"
          :title="t.themeSystem"
          @click="appearanceStore.setTheme('system')"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <path stroke-linecap="round" d="M8 21h8M12 17v4" />
          </svg>
        </button>
      </div>
    </div>

    <!-- ── Left branding panel (desktop only) ── -->
    <aside class="login-side-panel" aria-hidden="true">
      <div class="login-side-content">
        <div class="login-side-logo">
          <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="40" cy="40" r="38" stroke="rgba(255,255,255,0.25)" stroke-width="1.5" />
            <circle cx="40" cy="40" r="32" stroke="rgba(255,255,255,0.15)" stroke-width="1" />
            <path
              d="M40 18 L56 25 L56 40 C56 50 40 60 40 60 C40 60 24 50 24 40 L24 25 Z"
              fill="rgba(255,255,255,0.12)"
              stroke="rgba(255,255,255,0.7)"
              stroke-width="1.5"
              stroke-linejoin="round"
            />
            <path
              d="M33 40 L37.5 44.5 L48 34"
              stroke="white"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>

        <h2 class="login-side-title mt-4">{{ t.pageTitle }}</h2>
        <p class="login-side-sub">{{ t.pageSubtitle }}</p>

        <div class="login-side-divider"></div>
        <p class="login-side-desc">{{ t.cardSubtitle }}</p>

        <div class="login-dot-grid" aria-hidden="true">
          <span v-for="i in 24" :key="i" class="login-dot" />
        </div>
        <div class="login-side-circle c1" />
        <div class="login-side-circle c2" />
      </div>
    </aside>

    <!-- ── Right form panel ── -->
    <div class="login-form-panel">
      <div class="login-card-wrapper" :class="mounted ? 'login-card-visible' : 'login-card-hidden'">
        <div class="login-card">
          <!-- Mobile header -->
          <div class="login-mobile-logo">
            <div class="login-mobile-logo-ring">
              <svg viewBox="0 0 56 56">
                <circle
                  cx="28"
                  cy="28"
                  r="26"
                  fill="none"
                  stroke="rgba(22,163,74,0.4)"
                  stroke-width="1.5"
                />
                <path
                  d="M28 10 L40 16 L40 28 C40 36 28 44 28 44 C28 44 16 36 16 28 L16 16 Z"
                  fill="none"
                  stroke="#16a34a"
                  stroke-width="1.8"
                  stroke-linejoin="round"
                />
                <path
                  d="M22 28 L26.5 32.5 L35 24"
                  stroke="#16a34a"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>
            <div>
              <p class="login-mobile-school-name">{{ t.mobileTitle }}</p>
              <p class="login-mobile-school-sub">{{ t.mobileSub }}</p>
            </div>
          </div>

          <!-- Card header -->
          <div class="login-card-header">
            <h1 class="login-card-title">{{ t.cardTitle }}</h1>
            <p class="login-card-subtitle">{{ t.cardSubtitle }}</p>
          </div>

          <!-- OTP Info Banner -->
          <div class="otp-info-banner">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
              />
            </svg>
            <span>{{ t.infoBanner }}</span>
          </div>

          <!-- OTP Input -->
          <div class="login-field-wrap">
            <label class="login-field-label">{{ t.otpLabel }}</label>
            <div class="login-input-group" :class="{ 'input-active': otp, 'input-error': error }">
              <span class="login-input-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M7.864 4.243A7.5 7.5 0 0119.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 004.5 10.5a7.464 7.464 0 01-1.15 3.993m1.989 3.559A11.209 11.209 0 008.25 10.5a3.75 3.75 0 117.5 0c0 .527-.021 1.049-.064 1.565M12 10.5a14.94 14.94 0 01-3.6 9.75m6.633-4.596a18.666 18.666 0 01-2.485 5.33"
                  />
                </svg>
              </span>
              <input
                v-model="otp"
                type="text"
                inputmode="numeric"
                maxlength="6"
                :placeholder="t.otpPlaceholder"
                class="login-input-field otp-input"
                autocomplete="one-time-code"
                @keyup.enter="submit"
              />
              <span v-if="otp.length === 6 && !error" class="login-input-valid">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </span>
            </div>
            <transition name="err-slide">
              <div v-if="error" class="login-field-error">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                  />
                </svg>
                {{ error }}
              </div>
            </transition>
          </div>

          <!-- Submit -->
          <button class="login-btn" :disabled="loading || otp.length < 6" @click="submit">
            <span v-if="!loading" class="login-btn-inner">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                />
              </svg>
              {{ t.submit }}
            </span>
            <span v-else class="login-btn-inner">
              <svg
                class="login-spin"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path stroke-linecap="round" d="M12 3a9 9 0 109 9" />
              </svg>
              {{ t.submitting }}
            </span>
          </button>

          <!-- Back to login -->
          <button class="otp-back-btn" @click="router.push({ name: 'Login' })">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
              />
            </svg>
            {{ t.back }}
          </button>

          <p class="login-footer-text">{{ t.footer }}</p>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
/* ============================================================================
   CSS VARIABLES — Light & Dark
============================================================================ */
.theme-light {
  --bg-root: #f0fdf4;
  --bg-card: #ffffff;
  --bg-input: #fafafa;
  --bg-input-focus: #ffffff;
  --bg-check: #f3f4f6;
  --bg-controls: rgba(255, 255, 255, 0.85);
  --border: #e5e7eb;
  --border-focus: #16a34a;
  --text-primary: #111827;
  --text-secondary: #6b7280;
  --text-label: #374151;
  --text-footer: #d1d5db;
  --text-school: #15803d;
  --lang-bg: #f3f4f6;
  --lang-active-bg: #16a34a;
  --lang-active-txt: #ffffff;
  --theme-btn-bg: #f3f4f6;
  --theme-btn-active: #16a34a;
  --shadow-card: 0 4px 24px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.04);
  --banner-bg: #f0fdf4;
  --banner-border: #bbf7d0;
  --banner-color: #15803d;
}

.theme-dark {
  --bg-root: #0d1117;
  --bg-card: #161b22;
  --bg-input: #0d1117;
  --bg-input-focus: #161b22;
  --bg-check: #21262d;
  --bg-controls: rgba(22, 27, 34, 0.92);
  --border: #30363d;
  --border-focus: #4ade80;
  --text-primary: #e6edf3;
  --text-secondary: #8b949e;
  --text-label: #c9d1d9;
  --text-footer: #484f58;
  --text-school: #4ade80;
  --lang-bg: #21262d;
  --lang-active-bg: #238636;
  --lang-active-txt: #ffffff;
  --theme-btn-bg: #21262d;
  --theme-btn-active: #238636;
  --shadow-card: 0 4px 32px rgba(0, 0, 0, 0.5), 0 1px 4px rgba(0, 0, 0, 0.3);
  --banner-bg: rgba(74, 222, 128, 0.07);
  --banner-border: rgba(74, 222, 128, 0.25);
  --banner-color: #4ade80;
}

/* ============================================================================
   BASE
============================================================================ */
.login-root {
  display: flex;
  min-height: 100vh;
  background: var(--bg-root);
  transition: background 0.3s ease;
  position: relative;
  font-family: "Poppins", sans-serif;
}

/* ============================================================================
   CONTROLS BAR
============================================================================ */
.controls-bar {
  position: fixed;
  top: 14px;
  right: 16px;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--bg-controls);
  backdrop-filter: blur(12px);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 6px 10px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  transition:
    background 0.3s,
    border-color 0.3s;
}

/* Language switcher */
.lang-switcher {
  display: flex;
  background: var(--lang-bg);
  border-radius: 8px;
  padding: 2px;
  gap: 2px;
  transition: background 0.3s;
}

.lang-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border: none;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  background: transparent;
  color: var(--text-secondary);
  font-family: "Poppins", sans-serif;
  transition: all 0.2s;
}
.lang-btn.active {
  background: var(--lang-active-bg);
  color: var(--lang-active-txt);
}
.lang-btn:hover:not(.active) {
  background: var(--border);
  color: var(--text-primary);
}
.flag {
  font-size: 13px;
}

/* Divider antara lang & theme */
.controls-bar::before {
  content: "";
  width: 1px;
  height: 20px;
  background: var(--border);
  border-radius: 1px;
}

/* Theme switcher */
.theme-switcher {
  display: flex;
  background: var(--theme-btn-bg);
  border-radius: 8px;
  padding: 2px;
  gap: 2px;
  transition: background 0.3s;
}

.theme-btn {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  background: transparent;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.theme-btn svg {
  width: 14px;
  height: 14px;
}
.theme-btn.active {
  background: var(--theme-btn-active);
  color: white;
}
.theme-btn:hover:not(.active) {
  background: var(--border);
  color: var(--text-primary);
}

/* ============================================================================
   LEFT PANEL
============================================================================ */
.login-side-panel {
  display: none;
  width: 380px;
  flex-shrink: 0;
  background: linear-gradient(160deg, #15803d 0%, #166534 60%, #14532d 100%);
  position: relative;
  overflow: hidden;
}

@media (min-width: 900px) {
  .login-side-panel {
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.login-side-content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 48px 32px;
}

.login-side-logo svg {
  width: 80px;
  height: 80px;
}

.login-side-title {
  font-size: 1.35rem;
  font-weight: 700;
  color: #fff;
  margin: 0;
  letter-spacing: -0.01em;
}
.mt-4 {
  margin-top: 16px;
}
.login-side-sub {
  font-size: 0.82rem;
  color: rgba(255, 255, 255, 0.7);
  margin: 4px 0 0;
}
.login-side-divider {
  width: 40px;
  height: 2px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  margin: 20px auto;
}
.login-side-desc {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.65);
  line-height: 1.6;
  margin: 0;
}
.login-dot-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 10px;
  margin-top: 40px;
  opacity: 0.25;
}
.login-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: white;
  display: block;
}
.login-side-circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
}
.login-side-circle.c1 {
  width: 300px;
  height: 300px;
  bottom: -80px;
  right: -80px;
}
.login-side-circle.c2 {
  width: 180px;
  height: 180px;
  top: -40px;
  left: -60px;
}

/* ============================================================================
   RIGHT FORM PANEL
============================================================================ */
.login-form-panel {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  padding-top: 64px;
}

.login-card-wrapper {
  width: 100%;
  max-width: 420px;
  transition:
    opacity 0.4s ease,
    transform 0.4s ease;
}
.login-card-hidden {
  opacity: 0;
  transform: translateY(16px);
}
.login-card-visible {
  opacity: 1;
  transform: translateY(0);
}

.login-card {
  background: var(--bg-card);
  border-radius: 20px;
  padding: 36px 32px 28px;
  box-shadow: var(--shadow-card);
  border: 1px solid var(--border);
  transition:
    background 0.3s,
    border-color 0.3s,
    box-shadow 0.3s;
}

@media (max-width: 480px) {
  .login-card {
    padding: 28px 20px 24px;
    border-radius: 16px;
  }
}

/* ── Mobile Logo ── */
.login-mobile-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}
@media (min-width: 900px) {
  .login-mobile-logo {
    display: none;
  }
}

.login-mobile-logo-ring {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #dcfce7, #bbf7d0);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.login-mobile-logo-ring svg {
  width: 32px;
  height: 32px;
}
.login-mobile-school-name {
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--text-school);
  margin: 0 0 2px;
  transition: color 0.3s;
}
.login-mobile-school-sub {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin: 0;
  transition: color 0.3s;
}

/* ── Card Header ── */
.login-card-header {
  margin-bottom: 24px;
}
.login-card-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 6px;
  letter-spacing: -0.02em;
  transition: color 0.3s;
}
.login-card-subtitle {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
  transition: color 0.3s;
}

/* ── OTP Info Banner ── */
.otp-info-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--banner-bg);
  border: 1px solid var(--banner-border);
  border-radius: 10px;
  padding: 12px 14px;
  margin-bottom: 20px;
  color: var(--banner-color);
  font-size: 0.82rem;
  font-weight: 500;
  transition:
    background 0.3s,
    border-color 0.3s,
    color 0.3s;
}
.otp-info-banner svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  color: var(--banner-color);
}

/* ── Field ── */
.login-field-wrap {
  margin-bottom: 20px;
}
.login-field-label {
  display: block;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-label);
  margin-bottom: 6px;
  letter-spacing: 0.01em;
  transition: color 0.3s;
}
.login-input-group {
  display: flex;
  align-items: center;
  border: 1.5px solid var(--border);
  border-radius: 10px;
  background: var(--bg-input);
  transition:
    border-color 0.2s,
    box-shadow 0.2s,
    background 0.3s;
  overflow: hidden;
}
.login-input-group:focus-within {
  border-color: var(--border-focus);
  box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1);
  background: var(--bg-input-focus);
}
.login-input-group.input-active {
  border-color: var(--border);
  background: var(--bg-input-focus);
}
.login-input-group.input-error {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.08);
}

.login-input-icon {
  display: flex;
  align-items: center;
  padding: 0 12px;
  color: var(--text-secondary);
  transition: color 0.3s;
}
.login-input-icon svg {
  width: 17px;
  height: 17px;
}

.login-input-field {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 0.925rem;
  color: var(--text-primary);
  padding: 11px 0;
  font-family: "Poppins", sans-serif;
  transition: color 0.3s;
}

.otp-input {
  font-size: 1.1rem;
  font-weight: 600;
  letter-spacing: 0.2em;
}

.login-input-field::placeholder {
  color: var(--border);
  font-weight: 400;
  letter-spacing: 0;
}

.login-input-valid {
  display: flex;
  align-items: center;
  padding: 0 12px;
  color: #16a34a;
}
.login-input-valid svg {
  width: 16px;
  height: 16px;
}

/* ── Error ── */
.login-field-error {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.78rem;
  color: #ef4444;
  margin-top: 5px;
  font-weight: 500;
}
.login-field-error svg {
  width: 13px;
  height: 13px;
  flex-shrink: 0;
}

.err-slide-enter-active,
.err-slide-leave-active {
  transition: all 0.2s ease;
}
.err-slide-enter-from,
.err-slide-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* ── Submit ── */
.login-btn {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #16a34a, #15803d);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 0.925rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    opacity 0.2s,
    transform 0.1s,
    box-shadow 0.2s;
  box-shadow: 0 2px 8px rgba(22, 163, 74, 0.3);
  margin-bottom: 12px;
  font-family: "Poppins", sans-serif;
}
.login-btn:hover:not(:disabled) {
  opacity: 0.92;
  box-shadow: 0 4px 16px rgba(22, 163, 74, 0.4);
  transform: translateY(-1px);
}
.login-btn:active:not(:disabled) {
  transform: translateY(0);
}
.login-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
}
.login-btn-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.login-btn-inner svg {
  width: 18px;
  height: 18px;
}

.login-spin {
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ── Back Button ── */
.otp-back-btn {
  width: 100%;
  padding: 10px;
  background: transparent;
  color: var(--text-secondary);
  border: 1.5px solid var(--border);
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition:
    border-color 0.2s,
    color 0.2s,
    background 0.2s;
  margin-bottom: 20px;
  font-family: "Poppins", sans-serif;
}
.otp-back-btn svg {
  width: 15px;
  height: 15px;
}
.otp-back-btn:hover {
  border-color: var(--border-focus);
  color: var(--border-focus);
  background: var(--banner-bg);
}

/* ── Footer ── */
.login-footer-text {
  text-align: center;
  font-size: 0.72rem;
  color: var(--text-footer);
  margin: 0;
  transition: color 0.3s;
}
</style>
