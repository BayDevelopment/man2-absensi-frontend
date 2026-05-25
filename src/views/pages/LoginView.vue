<script setup>
import { ref, computed, onMounted, nextTick } from "vue";
import { useAuthStore } from "../../stores/auth";
import { useRouter } from "vue-router";
import Swal from "sweetalert2";

// ---------------------------
// Refs & Reactive State
// ---------------------------
const nisn = ref("");
const password = ref("");
const showPassword = ref(false);
const isLoading = ref(false);
const mounted = ref(false);
const rememberMe = ref(false);
const isLoadingPengaturan = ref(true); // ← true dulu, baru false setelah fetch

const errorMsg = ref("");
const nisnError = ref("");
const passwordError = ref("");

const authStore = useAuthStore();
const router = useRouter();

// ---------------------------
// Data Sekolah (Pengaturan)
// ---------------------------
const pengaturan = ref(null);

// ✅ FIX: fallback null bukan string — supaya v-else-if bisa bedakan "belum ada data" vs "data kosong"
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

  if (!logo || typeof logo !== "string") {
    return null;
  }

  const value = logo.trim();

  const isSafe =
    value.startsWith("/") || value.startsWith("http://") || value.startsWith("https://");

  return isSafe ? value : null;
});

// ---------------------------
// SweetAlert2 Toast Config
// ---------------------------
const toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 2500,
  timerProgressBar: true,
  iconColor: "white",
  customClass: { popup: "colored-toast" },
  didOpen: (toastEl) => {
    toastEl.addEventListener("mouseenter", Swal.stopTimer);
    toastEl.addEventListener("mouseleave", Swal.resumeTimer);
  },
});

const showToast = (icon, title) => toast.fire({ icon, title });

// ---------------------------
// Validasi Input
// ---------------------------
const validateNisn = () => {
  if (!nisn.value) {
    nisnError.value = "";
    return;
  }
  if (!/^\d+$/.test(nisn.value)) {
    nisnError.value = "NISN hanya boleh berisi angka";
  } else if (nisn.value.length !== 10) {
    nisnError.value = `NISN harus 10 digit (sekarang ${nisn.value.length} digit)`;
  } else {
    nisnError.value = "";
  }
};

const validatePassword = () => {
  if (!password.value) {
    passwordError.value = "";
    return;
  }
  passwordError.value = password.value.length < 6 ? "Password minimal 6 karakter" : "";
};

// ---------------------------
// Login Function
// ---------------------------
const handleLogin = async () => {
  errorMsg.value = "";
  nisnError.value = "";
  passwordError.value = "";

  if (!/^\d{10}$/.test(nisn.value)) {
    nisnError.value = "NISN harus berupa 10 digit angka";
    return;
  }
  if (!password.value) {
    passwordError.value = "Password tidak boleh kosong";
    return;
  }
  if (isLoading.value) return;

  isLoading.value = true;

  try {
    const data = await authStore.login(nisn.value, password.value, rememberMe.value);
    const user = data.data?.user;
    const roles = user?.roles ?? [];

    if (!roles.includes("siswa")) {
      await authStore.logout();
      errorMsg.value = "Akses ditolak. Hanya siswa yang dapat login di sini.";
      return;
    }

    showToast("success", "Login berhasil!");
    router.replace("/dashboard");
  } catch (err) {
    const status = err.response?.status;
    const message = err.response?.data?.message;

    if (status === 401) {
      if (
        message?.toLowerCase().includes("nisn") ||
        message?.toLowerCase().includes("tidak ditemukan")
      ) {
        nisnError.value = "NISN tidak terdaftar dalam sistem";
        showToast("error", "NISN tidak ditemukan!");
      } else {
        passwordError.value = "Password salah. Silakan coba lagi";
        showToast("error", "Password salah!");
      }
    } else if (status === 403) {
      errorMsg.value = message || "Email belum diverifikasi";
      showToast("warning", "Email belum diverifikasi!");
    } else if (status === 422) {
      nisnError.value = message ?? "Data tidak valid";
      showToast("warning", "Data tidak valid!");
    } else {
      errorMsg.value = message ?? "Terjadi kesalahan, coba lagi";
      showToast("error", "Terjadi kesalahan!");
    }
  } finally {
    isLoading.value = false;
  }
};

// ---------------------------
// Logout Toast
// ---------------------------
const showLogoutToast = () => showToast("success", "Berhasil logout!");

// ---------------------------
// Lifecycle Hook (SATU onMounted)
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
    showLogoutToast();
    authStore.justLoggedOut = false;
  }
});

// ---------------------------
// Keyboard Submit
// ---------------------------
const handleKeydown = (e) => {
  if (e.key === "Enter" && !isLoading.value) handleLogin();
};
</script>

<template>
  <main class="login-root" @keydown="handleKeydown">
    <!-- ── Left branding panel (desktop only) ── -->
    <aside class="login-side-panel" aria-hidden="true">
      <div class="login-side-content">
        <!-- Logo -->
        <div class="login-side-logo">
          <!-- ✅ Loading: tampilkan skeleton logo -->
          <template v-if="isLoadingPengaturan">
            <div class="skeleton skeleton-logo" />
          </template>
          <!-- ✅ Ada logo dari API -->
          <template v-else-if="logoSekolah">
            <img :src="logoSekolah" :alt="namaSekolah" class="login-side-logo-img" />
          </template>
          <!-- ✅ Tidak ada logo: tampilkan SVG default -->
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

        <!-- ✅ FIX: Nama & Sub Sekolah — 3 state: loading | ada data | tidak ada data -->
        <template v-if="isLoadingPengaturan">
          <!-- Skeleton sesuai ukuran h2 dan p -->
          <div class="skeleton skeleton-title" />
          <div class="skeleton skeleton-sub" />
        </template>
        <template v-else-if="namaSekolah">
          <!-- Ada data dari API -->
          <h2 class="login-side-title mt-4">{{ namaSekolah }}</h2>
          <p class="login-side-sub">{{ subSekolah }}</p>
        </template>
        <template v-else>
          <!-- Tidak ada data sama sekali (API gagal / kosong) -->
          <h2 class="login-side-title mt-4">Nama Sekolah</h2>
          <p class="login-side-sub">Alamat Sekolah</p>
        </template>

        <div class="login-side-divider"></div>
        <p class="login-side-desc">Sistem Absensi Digital<br />untuk siswa &amp; tenaga pengajar</p>

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
          <!-- ✅ Mobile logo — satu tempat, bersih -->
          <div class="login-mobile-logo">
            <div class="login-mobile-logo-ring">
              <!-- ✅ Loading: skeleton ring -->
              <template v-if="isLoadingPengaturan">
                <div class="skeleton skeleton-mobile-logo-ring" />
              </template>
              <!-- ✅ Ada logo dari API -->
              <template v-else-if="logoSekolah">
                <img
                  :src="logoSekolah"
                  :alt="namaSekolah"
                  style="width: 40px; height: 40px; object-fit: contain; border-radius: 8px"
                />
              </template>
              <!-- ✅ Tidak ada logo: SVG default -->
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

            <!-- ✅ FIX: Nama sekolah mobile — 3 state -->
            <div>
              <template v-if="isLoadingPengaturan">
                <!-- Skeleton sesuai ukuran p.login-mobile-school-name -->
                <div class="skeleton skeleton-mobile-name" />
              </template>
              <template v-else-if="namaSekolah">
                <!-- Ada data dari API -->
                <p class="login-mobile-school-name">{{ namaSekolah }}</p>
              </template>
              <template v-else>
                <!-- Tidak ada data -->
                <p class="login-mobile-school-name">Nama Sekolah</p>
              </template>
              <p class="login-mobile-school-sub">Sistem Absensi Digital</p>
            </div>
          </div>

          <!-- Card header -->
          <div class="login-card-header">
            <h1 class="login-card-title">Selamat Datang</h1>
            <p class="login-card-subtitle">Masuk dengan akun siswa Anda</p>
          </div>

          <!-- Form -->
          <form @submit.prevent="handleLogin" class="login-form">
            <!-- NISN -->
            <div class="login-field-wrap">
              <label class="login-field-label">NISN</label>
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
                  placeholder="10 digit NISN"
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
              <label class="login-field-label">Kata Sandi</label>
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
                  placeholder="Masukkan kata sandi"
                  class="login-input-field"
                  autocomplete="current-password"
                  @input="validatePassword"
                />
                <button
                  type="button"
                  class="login-eye-btn"
                  @click="showPassword = !showPassword"
                  :aria-label="showPassword ? 'Sembunyikan' : 'Tampilkan'"
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
                <span>Ingat saya</span>
              </label>
              <button
                type="button"
                class="login-forgot-link"
                @click="showToast('info', 'Silakan hubungi admin sekolah.')"
              >
                Lupa kata sandi?
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
                Masuk
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
                Memverifikasi...
              </span>
            </button>
          </form>

          <p class="login-footer-text">© 2026 MAN 2 Kota Cilegon · Sistem Absensi Digital</p>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.login-side-logo-img {
  width: 80px;
  height: 80px;
  object-fit: contain;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.1);
  padding: 8px;
}

/* ─── Skeleton Base ─── */
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

/* ─── Skeleton Desktop Aside ─── */
/* Sesuaikan dengan ukuran login-side-logo (80x80) */
.skeleton-logo {
  width: 80px;
  height: 80px;
  border-radius: 12px;
}

/* Sesuaikan dengan ukuran h2.login-side-title */
.skeleton-title {
  width: 180px;
  height: 24px;
  margin-top: 16px; /* setara mt-4 */
  margin-bottom: 8px;
}

/* Sesuaikan dengan ukuran p.login-side-sub */
.skeleton-sub {
  width: 120px;
  height: 16px;
}

/* ─── Skeleton Mobile ─── */
/* Sesuaikan dengan ukuran login-mobile-logo-ring */
.skeleton-mobile-logo-ring {
  width: 40px;
  height: 40px;
  border-radius: 50%;
}

/* Sesuaikan dengan ukuran p.login-mobile-school-name */
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
</style>
