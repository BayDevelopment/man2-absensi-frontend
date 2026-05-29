<script setup>
import { ref, computed, onMounted, nextTick, watch } from "vue";
import { useAuthStore } from "../../stores/auth";
import { useRouter } from "vue-router";
import Swal from "sweetalert2";

// ---------------------------
// Theme & Language State
// ---------------------------
const themeMode = ref("system"); // 'light' | 'dark' | 'system'
const language = ref("id"); // 'id' | 'en'

const systemDark = ref(window.matchMedia("(prefers-color-scheme: dark)").matches);

onMounted(() => {
  // Persist preferences
  const savedTheme = localStorage.getItem("login_theme") || "system";
  const savedLang = localStorage.getItem("login_lang") || "id";
  themeMode.value = savedTheme;
  language.value = savedLang;

  // Watch system preference
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", (e) => {
    systemDark.value = e.matches;
  });
});

watch(themeMode, (v) => localStorage.setItem("login_theme", v));
watch(language, (v) => localStorage.setItem("login_lang", v));

const isDark = computed(() => {
  if (themeMode.value === "dark") return true;
  if (themeMode.value === "light") return false;
  return systemDark.value; // system
});

const isEn = computed(() => language.value === "en");

// ---------------------------
// i18n
// ---------------------------
const t = computed(() =>
  isEn.value
    ? {
        welcome: "Welcome Back",
        subtitle: "Sign in with your student account",
        nisnLabel: "NISN",
        nisnPlaceholder: "10-digit NISN",
        passLabel: "Password",
        passPlaceholder: "Enter password",
        remember: "Remember me",
        forgot: "Forgot password?",
        submit: "Sign In",
        submitting: "Verifying...",
        forgotMsg: "Please contact your school administrator.",
        errNisnDigit: "NISN must contain only digits",
        errNisnLen: (n) => `NISN must be 10 digits (currently ${n})`,
        errNisnReq: "NISN must be 10 digits",
        errPassEmpty: "Password is required",
        errPassMin: "Password must be at least 6 characters",
        errNisnNotFound: "NISN not registered in the system",
        errPassWrong: "Wrong password. Please try again",
        errUnverified: "Email not verified",
        errInvalid: "Invalid data",
        errGeneral: "An error occurred, please try again",
        errAccessDenied: "Access denied. Only students can log in here.",
        toastNisnNotFound: "NISN not found!",
        toastPassWrong: "Wrong password!",
        toastUnverified: "Email not verified!",
        toastInvalid: "Invalid data!",
        toastError: "An error occurred!",
        toastOtp: "OTP code has been sent to your email!",
        toastLogout: "Successfully logged out!",
        schoolDefault: "School Name",
        addressDefault: "School Address",
        footer: "© 2026 MAN 2 Kota Cilegon · Digital Attendance System",
        themeLight: "Light",
        themeDark: "Dark",
        themeSystem: "System",
      }
    : {
        welcome: "Selamat Datang",
        subtitle: "Masuk dengan akun siswa Anda",
        nisnLabel: "NISN",
        nisnPlaceholder: "10 digit NISN",
        passLabel: "Kata Sandi",
        passPlaceholder: "Masukkan kata sandi",
        remember: "Ingat saya",
        forgot: "Lupa kata sandi?",
        submit: "Masuk",
        submitting: "Memverifikasi...",
        forgotMsg: "Silakan hubungi admin sekolah.",
        errNisnDigit: "NISN hanya boleh berisi angka",
        errNisnLen: (n) => `NISN harus 10 digit (sekarang ${n} digit)`,
        errNisnReq: "NISN harus berupa 10 digit angka",
        errPassEmpty: "Password tidak boleh kosong",
        errPassMin: "Password minimal 6 karakter",
        errNisnNotFound: "NISN tidak terdaftar dalam sistem",
        errPassWrong: "Password salah. Silakan coba lagi",
        errUnverified: "Email belum diverifikasi",
        errInvalid: "Data tidak valid",
        errGeneral: "Terjadi kesalahan, coba lagi",
        errAccessDenied: "Akses ditolak. Hanya siswa yang dapat login di sini.",
        toastNisnNotFound: "NISN tidak ditemukan!",
        toastPassWrong: "Password salah!",
        toastUnverified: "Email belum diverifikasi!",
        toastInvalid: "Data tidak valid!",
        toastError: "Terjadi kesalahan!",
        toastOtp: "Kode OTP telah dikirim ke email kamu!",
        toastLogout: "Berhasil logout!",
        schoolDefault: "Nama Sekolah",
        addressDefault: "Alamat Sekolah",
        footer: "© 2026 MAN 2 Kota Cilegon · Sistem Absensi Digital",
        themeLight: "Terang",
        themeDark: "Gelap",
        themeSystem: "Sistem",
      },
);

// ---------------------------
// Refs & Reactive State
// ---------------------------
const nisn = ref("");
const password = ref("");
const showPassword = ref(false);
const isLoading = ref(false);
const mounted = ref(false);
const rememberMe = ref(false);
const isLoadingPengaturan = ref(true);

const errorMsg = ref("");
const nisnError = ref("");
const passwordError = ref("");

const authStore = useAuthStore();
const router = useRouter();

// ---------------------------
// Data Sekolah
// ---------------------------
const pengaturan = ref(null);

const namaSekolah = computed(() => {
  const nama = pengaturan.value?.nama_sekolah;
  return typeof nama === "string" && nama.trim() ? nama.trim() : null;
});
const subSekolah = computed(() => {
  const alamat = pengaturan.value?.alamat;
  return typeof alamat === "string" && alamat.trim() ? alamat.trim() : null;
});
const logoSekolah = computed(() => {
  const logo = pengaturan.value?.logo;
  if (!logo || typeof logo !== "string") return null;
  const value = logo.trim();
  const isSafe =
    value.startsWith("/") || value.startsWith("http://") || value.startsWith("https://");
  return isSafe ? value : null;
});

const toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 2500,
  timerProgressBar: true,
  iconColor: "white",
  didOpen: (toastEl) => {
    toastEl.addEventListener("mouseenter", Swal.stopTimer);
    toastEl.addEventListener("mouseleave", Swal.resumeTimer);
  },
});

const showToast = (icon, title) =>
  toast.fire({
    icon,
    title,
    customClass: {
      popup: `colored-toast ${isDark.value ? "toast-dark" : "toast-light"}`,
      title: "colored-toast-title",
      timerProgressBar: "colored-toast-progress",
    },
  });

const validateNisn = () => {
  if (!nisn.value) {
    nisnError.value = "";
    return;
  }
  if (!/^\d+$/.test(nisn.value)) {
    nisnError.value = t.value.errNisnDigit;
  } else if (nisn.value.length !== 10) {
    nisnError.value = t.value.errNisnLen(nisn.value.length);
  } else {
    nisnError.value = "";
  }
};
const validatePassword = () => {
  if (!password.value) {
    passwordError.value = "";
    return;
  }
  passwordError.value = password.value.length < 6 ? t.value.errPassMin : "";
};

// ---------------------------
// Login
// ---------------------------
const handleLogin = async () => {
  errorMsg.value = "";
  nisnError.value = "";
  passwordError.value = "";

  if (!/^\d{10}$/.test(nisn.value)) {
    nisnError.value = t.value.errNisnReq;
    return;
  }
  if (!password.value) {
    passwordError.value = t.value.errPassEmpty;
    return;
  }
  if (isLoading.value) return;

  isLoading.value = true;
  try {
    const data = await authStore.login(nisn.value, password.value, rememberMe.value);

    if (data?.require_otp) {
      showToast("info", t.value.toastOtp);
      router.push({ name: "VerifyOtp" });
      return;
    }

    const user = data.data?.user;
    const roles = user?.roles ?? [];
    if (!roles.includes("siswa")) {
      await authStore.logout();
      errorMsg.value = t.value.errAccessDenied;
      return;
    }

    showToast("success", isEn.value ? "Login successful!" : "Login berhasil!");
    router.replace("/dashboard");
  } catch (err) {
    const status = err.response?.status;
    const message = err.response?.data?.message;

    if (status === 401) {
      if (
        message?.toLowerCase().includes("nisn") ||
        message?.toLowerCase().includes("tidak ditemukan")
      ) {
        nisnError.value = t.value.errNisnNotFound;
        showToast("error", t.value.toastNisnNotFound);
      } else {
        passwordError.value = t.value.errPassWrong;
        showToast("error", t.value.toastPassWrong);
      }
    } else if (status === 403) {
      errorMsg.value = message || t.value.errUnverified;
      showToast("warning", t.value.toastUnverified);
    } else if (status === 422) {
      nisnError.value = message ?? t.value.errInvalid;
      showToast("warning", t.value.toastInvalid);
    } else {
      errorMsg.value = message ?? t.value.errGeneral;
      showToast("error", t.value.toastError);
    }
  } finally {
    isLoading.value = false;
  }
};

// ---------------------------
// Lifecycle
// ---------------------------
onMounted(async () => {
  await nextTick();
  mounted.value = true;

  try {
    isLoadingPengaturan.value = true;
    pengaturan.value = await authStore.fetchPengaturan();
  } finally {
    isLoadingPengaturan.value = false;
  }

  if (authStore.justLoggedOut) {
    showToast("success", t.value.toastLogout);
    authStore.justLoggedOut = false;
  }
});

const handleKeydown = (e) => {
  if (e.key === "Enter" && !isLoading.value) handleLogin();
};
</script>

<template>
  <main class="login-root" :class="isDark ? 'theme-dark' : 'theme-light'" @keydown="handleKeydown">
    <!-- ── Controls bar (top-right) ── -->
    <div class="controls-bar">
      <!-- Language toggle -->
      <div class="lang-switcher">
        <button class="lang-btn" :class="{ active: language === 'id' }" @click="language = 'id'">
          <span class="flag">🇮🇩</span> ID
        </button>
        <button class="lang-btn" :class="{ active: language === 'en' }" @click="language = 'en'">
          <span class="flag">🇬🇧</span> EN
        </button>
      </div>

      <!-- Theme switcher -->
      <div class="theme-switcher">
        <!-- Light -->
        <button
          class="theme-btn"
          :class="{ active: themeMode === 'light' }"
          :title="t.themeLight"
          @click="themeMode = 'light'"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="4" />
            <path
              stroke-linecap="round"
              d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
            />
          </svg>
        </button>
        <!-- Dark -->
        <button
          class="theme-btn"
          :class="{ active: themeMode === 'dark' }"
          :title="t.themeDark"
          @click="themeMode = 'dark'"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z"
            />
          </svg>
        </button>
        <!-- System -->
        <button
          class="theme-btn"
          :class="{ active: themeMode === 'system' }"
          :title="t.themeSystem"
          @click="themeMode = 'system'"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <path stroke-linecap="round" d="M8 21h8M12 17v4" />
          </svg>
        </button>
      </div>
    </div>

    <!-- ── Left branding panel ── -->
    <aside class="login-side-panel" aria-hidden="true">
      <div class="login-side-content">
        <div class="login-side-logo">
          <template v-if="isLoadingPengaturan">
            <div class="skeleton skeleton-logo" />
          </template>
          <template v-else-if="logoSekolah">
            <img :src="logoSekolah" :alt="namaSekolah" class="login-side-logo-img" />
          </template>
          <template v-else>
            <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="40" cy="40" r="38" stroke="rgba(255,255,255,0.25)" stroke-width="1.5" />
              <circle cx="40" cy="40" r="32" stroke="rgba(255,255,255,0.15)" stroke-width="1" />
              <rect
                x="22"
                y="24"
                width="36"
                height="42"
                rx="4"
                fill="rgba(255,255,255,0.12)"
                stroke="rgba(255,255,255,0.7)"
                stroke-width="1.5"
              />
              <rect
                x="32"
                y="20"
                width="16"
                height="8"
                rx="3"
                fill="rgba(255,255,255,0.15)"
                stroke="rgba(255,255,255,0.7)"
                stroke-width="1.5"
              />
              <line
                x1="30"
                y1="38"
                x2="50"
                y2="38"
                stroke="rgba(255,255,255,0.5)"
                stroke-width="1.5"
                stroke-linecap="round"
              />
              <line
                x1="30"
                y1="45"
                x2="50"
                y2="45"
                stroke="rgba(255,255,255,0.5)"
                stroke-width="1.5"
                stroke-linecap="round"
              />
              <line
                x1="30"
                y1="52"
                x2="44"
                y2="52"
                stroke="rgba(255,255,255,0.5)"
                stroke-width="1.5"
                stroke-linecap="round"
              />
              <circle
                cx="27"
                cy="38"
                r="3"
                fill="rgba(255,255,255,0.15)"
                stroke="rgba(255,255,255,0.7)"
                stroke-width="1.2"
              />
              <path
                d="M25.5 38l1.2 1.2 2-2"
                stroke="white"
                stroke-width="1.2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <circle
                cx="27"
                cy="45"
                r="3"
                fill="rgba(255,255,255,0.15)"
                stroke="rgba(255,255,255,0.7)"
                stroke-width="1.2"
              />
              <path
                d="M25.5 45l1.2 1.2 2-2"
                stroke="white"
                stroke-width="1.2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <circle
                cx="27"
                cy="52"
                r="3"
                fill="rgba(255,255,255,0.15)"
                stroke="rgba(255,255,255,0.7)"
                stroke-width="1.2"
              />
              <path
                d="M25.8 50.8l2.4 2.4M28.2 50.8l-2.4 2.4"
                stroke="rgba(255,255,255,0.6)"
                stroke-width="1.2"
                stroke-linecap="round"
              />
              <g transform="translate(46, 52) rotate(-45)">
                <rect
                  x="-3"
                  y="-10"
                  width="6"
                  height="12"
                  rx="1"
                  fill="rgba(255,255,255,0.2)"
                  stroke="white"
                  stroke-width="1.2"
                />
                <path d="M-3 2 L0 7 L3 2" fill="white" opacity="0.8" />
                <line
                  x1="-3"
                  y1="-2"
                  x2="3"
                  y2="-2"
                  stroke="rgba(255,255,255,0.5)"
                  stroke-width="1"
                />
              </g>
            </svg>
          </template>
        </div>

        <template v-if="isLoadingPengaturan">
          <div class="skeleton skeleton-title" />
          <div class="skeleton skeleton-sub" />
        </template>
        <template v-else-if="namaSekolah">
          <h2 class="login-side-title mt-4">{{ namaSekolah }}</h2>
          <p class="login-side-sub">{{ subSekolah }}</p>
        </template>
        <template v-else>
          <h2 class="login-side-title mt-4">{{ t.schoolDefault }}</h2>
          <p class="login-side-sub">{{ t.addressDefault }}</p>
        </template>

        <div class="login-side-divider"></div>
        <p class="login-side-desc">
          {{ isEn ? "Digital Attendance System" : "Sistem Absensi Digital" }}<br />
          {{ isEn ? "for students & teaching staff" : "untuk siswa &amp; tenaga pengajar" }}
        </p>

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
          <!-- Mobile logo -->
          <div class="login-mobile-logo">
            <div class="login-mobile-logo-ring">
              <template v-if="isLoadingPengaturan">
                <div class="skeleton skeleton-mobile-logo-ring" />
              </template>
              <template v-else-if="logoSekolah">
                <img
                  :src="logoSekolah"
                  :alt="namaSekolah"
                  style="width: 40px; height: 40px; object-fit: contain; border-radius: 8px"
                />
              </template>
              <template v-else>
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
                    d="M14 36 Q28 20 42 36"
                    fill="none"
                    stroke="#16a34a"
                    stroke-width="2"
                    stroke-linecap="round"
                  />
                  <path d="M28 20 L28 38" fill="none" stroke="#16a34a" stroke-width="1.5" />
                  <polygon points="28,8 30,15 28,13 26,15" fill="#16a34a" />
                  <circle cx="28" cy="17" r="2.5" fill="#16a34a" />
                </svg>
              </template>
            </div>
            <div>
              <template v-if="isLoadingPengaturan">
                <div class="skeleton skeleton-mobile-name" />
              </template>
              <template v-else-if="namaSekolah">
                <p class="login-mobile-school-name">{{ namaSekolah }}</p>
              </template>
              <template v-else>
                <p class="login-mobile-school-name">{{ t.schoolDefault }}</p>
              </template>
              <p class="login-mobile-school-sub">
                {{ isEn ? "Digital Attendance System" : "Sistem Absensi Digital" }}
              </p>
            </div>
          </div>

          <!-- Card header -->
          <div class="login-card-header">
            <h1 class="login-card-title">{{ t.welcome }}</h1>
            <p class="login-card-subtitle">{{ t.subtitle }}</p>
          </div>

          <!-- Form -->
          <form @submit.prevent="handleLogin" class="login-form">
            <!-- NISN -->
            <div class="login-field-wrap">
              <label class="login-field-label">{{ t.nisnLabel }}</label>
              <div
                class="login-input-group"
                :class="{ 'input-active': nisn, 'input-error': nisnError }"
              >
                <span class="login-input-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z"
                    />
                  </svg>
                </span>
                <input
                  v-model="nisn"
                  type="text"
                  inputmode="numeric"
                  maxlength="10"
                  :placeholder="t.nisnPlaceholder"
                  class="login-input-field"
                  autocomplete="off"
                  @input="validateNisn"
                />
                <span v-if="nisn.length === 10 && !nisnError" class="login-input-valid">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
              </div>
              <transition name="err-slide">
                <div v-if="nisnError" class="login-field-error">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                    />
                  </svg>
                  {{ nisnError }}
                </div>
              </transition>
            </div>

            <!-- Password -->
            <div class="login-field-wrap">
              <label class="login-field-label">{{ t.passLabel }}</label>
              <div
                class="login-input-group"
                :class="{ 'input-active': password, 'input-error': passwordError }"
              >
                <span class="login-input-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                    />
                  </svg>
                </span>
                <input
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  :placeholder="t.passPlaceholder"
                  class="login-input-field"
                  autocomplete="current-password"
                  @input="validatePassword"
                />
                <button
                  type="button"
                  class="login-eye-btn"
                  @click="showPassword = !showPassword"
                  :aria-label="
                    showPassword ? (isEn ? 'Hide' : 'Sembunyikan') : isEn ? 'Show' : 'Tampilkan'
                  "
                >
                  <svg
                    v-if="!showPassword"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                    />
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <svg
                    v-else
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                    />
                  </svg>
                </button>
              </div>
              <transition name="err-slide">
                <div v-if="passwordError" class="login-field-error">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                    />
                  </svg>
                  {{ passwordError }}
                </div>
              </transition>
            </div>

            <!-- Remember & Forgot -->
            <div class="login-remember-row">
              <label class="login-remember-label">
                <span class="login-check-box" :class="{ checked: rememberMe }">
                  <svg
                    v-if="rememberMe"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="3"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <input v-model="rememberMe" type="checkbox" class="sr-only" />
                <span>{{ t.remember }}</span>
              </label>
              <button
                type="button"
                class="login-forgot-link"
                @click="showToast('info', t.forgotMsg)"
              >
                {{ t.forgot }}
              </button>
            </div>

            <!-- Global error -->
            <transition name="err-slide">
              <div v-if="errorMsg" class="login-global-error">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                  />
                </svg>
                {{ errorMsg }}
              </div>
            </transition>

            <!-- Submit -->
            <button type="submit" class="login-btn" :disabled="isLoading || !nisn || !password">
              <span v-if="!isLoading" class="login-btn-inner">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
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
          </form>

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
  --btn-active-bg: #f0fdf4;
  --btn-active-txt: #15803d;
  --btn-active-bdr: #bbf7d0;
  --lang-bg: #f3f4f6;
  --lang-active-bg: #16a34a;
  --lang-active-txt: #ffffff;
  --theme-btn-bg: #f3f4f6;
  --theme-btn-active: #16a34a;
  --shadow-card: 0 4px 24px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.04);
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
  --btn-active-bg: rgba(74, 222, 128, 0.1);
  --btn-active-txt: #4ade80;
  --btn-active-bdr: rgba(74, 222, 128, 0.3);
  --lang-bg: #21262d;
  --lang-active-bg: #238636;
  --lang-active-txt: #ffffff;
  --theme-btn-bg: #21262d;
  --theme-btn-active: #238636;
  --shadow-card: 0 4px 32px rgba(0, 0, 0, 0.5), 0 1px 4px rgba(0, 0, 0, 0.3);
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
   CONTROLS BAR (top-right floating)
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

/* Divider */
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
.login-side-logo-img {
  width: 80px;
  height: 80px;
  object-fit: contain;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.1);
  padding: 8px;
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
  padding-top: 64px; /* room for controls bar */
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

/* ── Fields ── */
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
.login-input-field::placeholder {
  color: var(--border);
  font-weight: 400;
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

.login-eye-btn {
  display: flex;
  align-items: center;
  padding: 0 12px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-secondary);
  transition: color 0.2s;
}
.login-eye-btn:hover {
  color: var(--text-primary);
}
.login-eye-btn svg {
  width: 17px;
  height: 17px;
}

/* ── Remember & Forgot ── */
.login-remember-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  gap: 8px;
}
.login-remember-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 0.82rem;
  color: var(--text-secondary);
  user-select: none;
  transition: color 0.3s;
}
.login-check-box {
  width: 18px;
  height: 18px;
  border: 1.5px solid var(--border);
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-check);
  transition: all 0.2s;
  flex-shrink: 0;
}
.login-check-box.checked {
  background: #16a34a;
  border-color: #16a34a;
}
.login-check-box svg {
  width: 11px;
  height: 11px;
  color: white;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
}

.login-forgot-link {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 600;
  color: #16a34a;
  font-family: "Poppins", sans-serif;
  transition: color 0.2s;
}
.login-forgot-link:hover {
  color: #15803d;
}

/* ── Errors ── */
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
.login-global-error {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 0.82rem;
  font-weight: 500;
  color: #ef4444;
  margin-bottom: 16px;
}
.login-global-error svg {
  width: 15px;
  height: 15px;
  flex-shrink: 0;
  margin-top: 1px;
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
  margin-bottom: 0;
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

/* ── Footer ── */
.login-footer-text {
  text-align: center;
  font-size: 0.72rem;
  color: var(--text-footer);
  margin: 20px 0 0;
  transition: color 0.3s;
}

/* ── Skeleton ── */
.skeleton {
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.08) 25%,
    rgba(255, 255, 255, 0.18) 50%,
    rgba(255, 255, 255, 0.08) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 6px;
  display: block;
}
.skeleton-logo {
  width: 80px;
  height: 80px;
  border-radius: 12px;
}
.skeleton-title {
  width: 180px;
  height: 24px;
  margin-top: 16px;
  margin-bottom: 8px;
}
.skeleton-sub {
  width: 120px;
  height: 16px;
}
.skeleton-mobile-logo-ring {
  width: 40px;
  height: 40px;
  border-radius: 50%;
}
.skeleton-mobile-name {
  width: 130px;
  height: 14px;
  margin-bottom: 4px;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
/* ── SweetAlert2 Toast Theme Fix ── */
:global(.swal2-popup.colored-toast) {
  border-radius: 12px !important;
  font-family: "Poppins", sans-serif !important;
  padding: 12px 16px !important;
}

:global(.swal2-popup.colored-toast.toast-dark) {
  background: #161b22 !important;
  color: #e6edf3 !important;
  border: 1px solid #30363d !important;
  box-shadow: 0 4px 32px rgba(0, 0, 0, 0.5) !important;
}

:global(.swal2-popup.colored-toast.toast-light) {
  background: #ffffff !important;
  color: #111827 !important;
  border: 1px solid #e5e7eb !important;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08) !important;
}

:global(.swal2-popup.colored-toast .swal2-title) {
  color: inherit !important;
  font-size: 0.88rem !important;
  font-weight: 600 !important;
  font-family: "Poppins", sans-serif !important;
}

:global(.swal2-popup.colored-toast.toast-dark .swal2-timer-progress-bar) {
  background: #4ade80 !important;
}

:global(.swal2-popup.colored-toast.toast-light .swal2-timer-progress-bar) {
  background: #16a34a !important;
}

/* ── Input Error tetap mengikuti dark mode ── */
.theme-dark .login-input-group.input-error {
  background: #161b22 !important;
  border-color: #ef4444 !important;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.16) !important;
}

.theme-dark .login-input-group.input-error:focus-within {
  background: #161b22 !important;
}

.theme-dark .login-input-group.input-error .login-input-field {
  background: transparent !important;
  color: #e6edf3 !important;
  -webkit-text-fill-color: #e6edf3 !important;
  caret-color: #e6edf3 !important;
}

.theme-dark .login-input-group.input-error .login-input-field::placeholder {
  color: #484f58 !important;
  -webkit-text-fill-color: #484f58 !important;
}

.theme-dark .login-input-group.input-error .login-input-icon,
.theme-dark .login-input-group.input-error .login-eye-btn {
  color: #ef4444 !important;
}

/* ── Fix Chrome autofill agar tidak berubah putih ── */
.theme-dark .login-input-field:-webkit-autofill,
.theme-dark .login-input-field:-webkit-autofill:hover,
.theme-dark .login-input-field:-webkit-autofill:focus,
.theme-dark .login-input-field:-webkit-autofill:active {
  -webkit-box-shadow: 0 0 0 1000px #161b22 inset !important;
  -webkit-text-fill-color: #e6edf3 !important;
  caret-color: #e6edf3 !important;
  border: none !important;
  transition: background-color 9999s ease-in-out 0s !important;
}

/* ── Fix autofill khusus saat field error ── */
.theme-dark .login-input-group.input-error .login-input-field:-webkit-autofill,
.theme-dark .login-input-group.input-error .login-input-field:-webkit-autofill:hover,
.theme-dark .login-input-group.input-error .login-input-field:-webkit-autofill:focus,
.theme-dark .login-input-group.input-error .login-input-field:-webkit-autofill:active {
  -webkit-box-shadow: 0 0 0 1000px #161b22 inset !important;
  -webkit-text-fill-color: #e6edf3 !important;
  caret-color: #e6edf3 !important;
}
</style>
