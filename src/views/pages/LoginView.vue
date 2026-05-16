<script setup>
import { ref, onMounted } from "vue";
import { useAuthStore } from "../../stores/auth";
import { useRouter } from "vue-router";

const nisn = ref("");
const password = ref("");
const showPassword = ref(false);
const isLoading = ref(false);
const mounted = ref(false);
const rememberMe = ref(false);

const authStore = useAuthStore();
const router = useRouter();
const errorMsg = ref("");
const nisnError = ref("");
const passwordError = ref("");

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
  if (password.value.length < 6) {
    passwordError.value = "Password minimal 6 karakter";
  } else {
    passwordError.value = "";
  }
};

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

    const role = data.user.role;
    const roles = data.user.roles || [];

    const isSiswa =
      role === "siswa" || roles === "siswa" || (Array.isArray(roles) && roles.includes("siswa"));

    if (!isSiswa) {
      if (typeof authStore.logout === "function") {
        await authStore.logout();
      }

      errorMsg.value = "Akses ditolak. Hanya siswa yang dapat login di sini.";
      return;
    }

    router.push("/dashboard");
  } catch (err) {
    const status = err.response?.status;
    const message = err.response?.data?.message;

    if (status === 401) {
      if (
        message?.toLowerCase().includes("nisn") ||
        message?.toLowerCase().includes("tidak ditemukan")
      ) {
        nisnError.value = "NISN tidak terdaftar dalam sistem";
      } else {
        passwordError.value = "Password salah. Silakan coba lagi";
      }
    } else if (status === 422) {
      nisnError.value = message ?? "Data tidak valid";
    } else {
      errorMsg.value = message ?? "Terjadi kesalahan, coba lagi";
    }
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  requestAnimationFrame(() => {
    setTimeout(() => {
      mounted.value = true;
    }, 50);
  });
});

const handleKeydown = (e) => {
  if (e.key === "Enter" && !isLoading.value) handleLogin();
};
</script>

<template>
  <main class="login-root" @keydown="handleKeydown">
    <!-- Layered background -->
    <div class="bg-layer" aria-hidden="true">
      <div class="blob blob-1" />
      <div class="blob blob-2" />
      <div class="blob blob-3" />
      <div class="grid-pattern" />
      <!-- Islamic geometric border top -->
      <div class="geo-top" />
      <div class="geo-bottom" />
    </div>

    <!-- Gold particles -->
    <div class="particles" aria-hidden="true">
      <span v-for="i in 14" :key="i" class="particle" :style="{ '--i': i }" />
    </div>

    <!-- Card wrapper -->
    <div class="card-wrapper" :class="mounted ? 'card-visible' : 'card-hidden'">
      <div class="glass-card">
        <!-- Logo area -->
        <div class="logo-area">
          <!-- Logo ring -->
          <div class="logo-ring">
            <div class="logo-inner">
              <!-- Logo MAN 2 sebagai teks badge karena img path beda per environment -->
              <svg viewBox="0 0 56 56" class="logo-svg" aria-hidden="true">
                <!-- Outer circle -->
                <circle
                  cx="28"
                  cy="28"
                  r="26"
                  fill="none"
                  stroke="#d4a017"
                  stroke-width="1.5"
                  opacity="0.6"
                />
                <!-- Book shape -->
                <path
                  d="M14 36 Q28 20 42 36"
                  fill="none"
                  stroke="#f0c040"
                  stroke-width="2"
                  stroke-linecap="round"
                />
                <path d="M28 20 L28 38" fill="none" stroke="#f0c040" stroke-width="1.5" />
                <!-- Flame/star top -->
                <polygon points="28,8 30,15 28,13 26,15" fill="#f0c040" />
                <circle cx="28" cy="17" r="2.5" fill="#f0c040" opacity="0.9" />
                <!-- Crescent hint -->
                <path
                  d="M20 24 Q18 28 20 32"
                  fill="none"
                  stroke="#d4a017"
                  stroke-width="1.2"
                  opacity="0.7"
                />
                <path
                  d="M36 24 Q38 28 36 32"
                  fill="none"
                  stroke="#d4a017"
                  stroke-width="1.2"
                  opacity="0.7"
                />
              </svg>
            </div>
            <div class="ping-ring" />
            <div class="ping-ring ping-ring-2" />
          </div>

          <div class="school-title">
            <h1>Madrasah Aliyah Negeri 2</h1>
            <p>Kota Cilegon · Sistem Absensi Digital</p>
          </div>
        </div>

        <!-- Divider -->
        <div class="divider">
          <span class="divider-line" />
          <span class="divider-text">Login Siswa</span>
          <span class="divider-line" />
        </div>

        <!-- Form -->
        <form @submit.prevent="handleLogin" class="form">
          <!-- NISN -->
          <div class="field-wrap">
            <div
              class="input-group"
              :class="{
                'input-active': nisn,
                'input-error': nisnError,
                'input-focus': false,
              }"
            >
              <span class="input-icon">
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
                placeholder="Nomor Induk Siswa Nasional"
                class="input-field"
                autocomplete="off"
                @input="validateNisn"
              />
              <!-- tick saat valid -->
              <span v-if="nisn.length === 10 && !nisnError" class="input-valid">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <div class="input-line" :class="{ 'line-error': nisnError }" />
            </div>
            <!-- Error NISN langsung di bawah input -->
            <transition name="err-slide">
              <div v-if="nisnError" class="field-error">
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
          <div class="field-wrap">
            <div
              class="input-group"
              :class="{
                'input-active': password,
                'input-error': passwordError,
              }"
            >
              <span class="input-icon">
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
                placeholder="Kata Sandi"
                class="input-field"
                autocomplete="current-password"
                @input="validatePassword"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="eye-btn"
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
                <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                  />
                </svg>
              </button>
              <div class="input-line" :class="{ 'line-error': passwordError }" />
            </div>
            <!-- Error Password langsung di bawah input -->
            <transition name="err-slide">
              <div v-if="passwordError" class="field-error">
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
          <div class="remember-row">
            <label class="remember-label">
              <div class="custom-check">
                <input v-model="rememberMe" type="checkbox" class="sr-only" />
                <div class="check-box" :class="{ checked: rememberMe }">
                  <svg
                    v-if="rememberMe"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="3"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <span>Ingat saya</span>
            </label>
            <a href="#" class="forgot-link">Lupa kata sandi?</a>
          </div>

          <!-- Global error (misal: akses ditolak / server error) -->
          <transition name="err-slide">
            <div v-if="errorMsg" class="global-error">
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

          <!-- Submit button -->
          <button type="submit" :disabled="isLoading || !nisn || !password" class="login-btn">
            <span v-if="!isLoading" class="btn-inner">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
                />
              </svg>
              Masuk
            </span>
            <span v-else class="btn-inner">
              <svg
                class="spin"
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

        <p class="footer-text">© 2026 MAN 2 Kota Cilegon · Sistem Absensi Digital</p>
      </div>
    </div>
  </main>
</template>

<style scoped>
/* ── Palette dari logo MAN 2 ──
   Hijau tua  : #1a5c1a / #1e6b1e
   Hijau muda : #2d8a2d
   Emas/Gold  : #d4a017 / #f0c040
   BG gelap   : #071207
*/

/* ── Root ── */
.login-root {
  min-height: 100vh;
  width: 100%;
  background: #071207;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
  font-family: "Poppins", sans-serif;
}

/* ── Background ── */
.bg-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(90px);
  opacity: 0.18;
  animation: blobFloat 10s ease-in-out infinite alternate;
  will-change: transform;
}
.blob-1 {
  width: min(500px, 80vw);
  height: min(500px, 80vw);
  background: radial-gradient(circle, #2d8a2d, #1a5c1a);
  top: -160px;
  left: -120px;
  animation-duration: 9s;
}
.blob-2 {
  width: min(380px, 70vw);
  height: min(380px, 70vw);
  background: radial-gradient(circle, #d4a017, #8b6800);
  bottom: -120px;
  right: -80px;
  animation-duration: 12s;
  animation-delay: -4s;
}
.blob-3 {
  width: min(280px, 50vw);
  height: min(280px, 50vw);
  background: radial-gradient(circle, #1e6b1e, #0a3a0a);
  top: 40%;
  left: 45%;
  animation-duration: 14s;
  animation-delay: -7s;
}

@keyframes blobFloat {
  from {
    transform: translate(0, 0) scale(1);
  }
  to {
    transform: translate(28px, 36px) scale(1.08);
  }
}

.grid-pattern {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(212, 160, 23, 0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(212, 160, 23, 0.06) 1px, transparent 1px);
  background-size: 44px 44px;
}

/* Islamic geometric accent bars */
.geo-top,
.geo-bottom {
  position: absolute;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    #d4a017 20%,
    #f0c040 35%,
    #2d8a2d 50%,
    #f0c040 65%,
    #d4a017 80%,
    transparent 100%
  );
  opacity: 0.5;
}
.geo-top {
  top: 0;
}
.geo-bottom {
  bottom: 0;
}

/* ── Particles ── */
.particles {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.particle {
  position: absolute;
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: #f0c040;
  opacity: 0;
  left: calc(var(--i) * 7.14%);
  animation: particleDrift calc(5s + var(--i) * 0.4s) ease-in-out infinite;
  animation-delay: calc(var(--i) * 0.35s);
  will-change: transform, opacity;
}
@keyframes particleDrift {
  0% {
    opacity: 0;
    transform: translateY(100vh) scale(0);
  }
  20% {
    opacity: 0.7;
  }
  80% {
    opacity: 0.3;
  }
  100% {
    opacity: 0;
    transform: translateY(-10vh) scale(1.4);
  }
}

/* ── Card ── */
.card-wrapper {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 440px;
  margin: 0 16px;
  transition:
    opacity 0.7s ease,
    transform 0.7s ease;
}
.card-hidden {
  opacity: 0;
  transform: translateY(24px);
}
.card-visible {
  opacity: 1;
  transform: translateY(0);
}

.glass-card {
  background: rgba(10, 30, 10, 0.6);
  backdrop-filter: blur(28px);
  -webkit-backdrop-filter: blur(28px);
  border: 1px solid rgba(212, 160, 23, 0.15);
  border-radius: 24px;
  padding: 36px 32px 28px;
  box-shadow:
    0 0 0 1px rgba(212, 160, 23, 0.08),
    0 32px 80px rgba(0, 0, 0, 0.6),
    inset 0 1px 0 rgba(240, 192, 64, 0.08);
}

/* ── Logo ── */
.logo-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
}

.logo-ring {
  position: relative;
  width: 72px;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 14px;
}

.logo-inner {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(45, 138, 45, 0.2), rgba(212, 160, 23, 0.2));
  border: 1.5px solid rgba(212, 160, 23, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.logo-svg {
  width: 40px;
  height: 40px;
}

.ping-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 1px solid rgba(212, 160, 23, 0.5);
  animation: pingRing 2.8s ease-out infinite;
}
.ping-ring-2 {
  animation-delay: 1.4s;
}

@keyframes pingRing {
  0% {
    transform: scale(1);
    opacity: 0.8;
  }
  100% {
    transform: scale(1.75);
    opacity: 0;
  }
}

.school-title {
  text-align: center;
}
.school-title h1 {
  font-family: "Poppins", sans-serif;
  font-size: 17px;
  font-weight: 700;
  color: #f0c040;
  margin: 0 0 3px;
  letter-spacing: 0.3px;
}
.school-title p {
  font-size: 11.5px;
  color: rgba(212, 160, 23, 0.6);
  margin: 0;
  letter-spacing: 0.5px;
}

/* ── Divider ── */
.divider {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}
.divider-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(212, 160, 23, 0.3), transparent);
}
.divider-text {
  font-size: 11px;
  font-weight: 600;
  color: rgba(212, 160, 23, 0.7);
  letter-spacing: 1.5px;
  text-transform: uppercase;
  white-space: nowrap;
}

/* ── Form ── */
.form {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.field-wrap {
  margin-bottom: 14px;
}

/* ── Input Group ── */
.input-group {
  position: relative;
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 12px;
  transition:
    border-color 0.25s,
    background 0.25s;
  overflow: hidden;
}
.input-group:focus-within,
.input-group.input-active {
  border-color: rgba(212, 160, 23, 0.45);
  background: rgba(212, 160, 23, 0.04);
}
.input-group.input-error {
  border-color: rgba(239, 68, 68, 0.5) !important;
  background: rgba(239, 68, 68, 0.04) !important;
}

.input-icon {
  padding: 0 2px 0 14px;
  color: #4a6741;
  flex-shrink: 0;
  transition: color 0.25s;
}
.input-icon svg {
  width: 16px;
  height: 16px;
  display: block;
}
.input-group:focus-within .input-icon {
  color: #d4a017;
}
.input-group.input-error .input-icon {
  color: #ef4444;
}

.input-field {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: #e8f0e8;
  font-size: 13.5px;
  padding: 13px 10px;
  font-family: inherit;
  min-width: 0;
}
.input-field::placeholder {
  color: #3d5c3d;
}
.input-field:-webkit-autofill,
.input-field:-webkit-autofill:focus {
  -webkit-text-fill-color: #e8f0e8;
  -webkit-box-shadow: 0 0 0 1000px transparent inset;
  transition: background-color 5000s;
}

/* Valid tick */
.input-valid {
  padding: 0 12px 0 4px;
  color: #4ade80;
  flex-shrink: 0;
}
.input-valid svg {
  width: 15px;
  height: 15px;
  display: block;
}

/* Eye button */
.eye-btn {
  padding: 0 14px 0 4px;
  color: #3d5c3d;
  background: none;
  border: none;
  cursor: pointer;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  transition: color 0.2s;
}
.eye-btn svg {
  width: 16px;
  height: 16px;
}
.eye-btn:hover {
  color: #d4a017;
}

/* Underline accent */
.input-line {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 2px;
  width: 0;
  background: linear-gradient(90deg, #2d8a2d, #d4a017);
  border-radius: 0 0 12px 12px;
  transition: width 0.4s ease;
}
.input-group:focus-within .input-line {
  width: 100%;
}
.line-error {
  background: linear-gradient(90deg, #ef4444, #f87171) !important;
  width: 100% !important;
}

/* ── Field Error (inline di bawah input) ── */
.field-error {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 5px;
  padding: 6px 10px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 8px;
  color: #fca5a5;
  font-size: 11.5px;
  font-weight: 500;
}
.field-error svg {
  width: 13px;
  height: 13px;
  flex-shrink: 0;
  color: #f87171;
}

/* ── Global Error ── */
.global-error {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.25);
  border-radius: 10px;
  color: #fca5a5;
  font-size: 12.5px;
  font-weight: 500;
  margin-bottom: 14px;
}
.global-error svg {
  width: 15px;
  height: 15px;
  flex-shrink: 0;
  color: #f87171;
}

/* ── Error transition ── */
.err-slide-enter-active {
  transition: all 0.25s ease;
}
.err-slide-leave-active {
  transition: all 0.2s ease;
}
.err-slide-enter-from {
  opacity: 0;
  transform: translateY(-6px);
}
.err-slide-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* ── Remember row ── */
.remember-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  margin-top: 2px;
}

.remember-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
  font-size: 12px;
  color: #6b8f6b;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
}

.check-box {
  width: 16px;
  height: 16px;
  border: 1.5px solid #3d5c3d;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.check-box.checked {
  background: linear-gradient(135deg, #2d8a2d, #d4a017);
  border-color: transparent;
}
.check-box svg {
  width: 10px;
  height: 10px;
}

.forgot-link {
  font-size: 12px;
  color: #d4a017;
  text-decoration: none;
  transition: color 0.2s;
}
.forgot-link:hover {
  color: #f0c040;
}

/* ── Login Button ── */
.login-btn {
  width: 100%;
  padding: 13px;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  font-family: inherit;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: #071207;
  background: linear-gradient(135deg, #d4a017 0%, #f0c040 40%, #2d8a2d 100%);
  background-size: 200% 200%;
  animation: goldShift 3s ease infinite;
  box-shadow: 0 4px 24px rgba(212, 160, 23, 0.35);
  position: relative;
  overflow: hidden;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}
.login-btn::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.15), transparent);
  opacity: 0;
  transition: opacity 0.3s;
}
.login-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(212, 160, 23, 0.5);
}
.login-btn:hover:not(:disabled)::before {
  opacity: 1;
}
.login-btn:active:not(:disabled) {
  transform: translateY(0);
}
.login-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  animation: none;
}

@keyframes goldShift {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

.btn-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.btn-inner svg {
  width: 16px;
  height: 16px;
}

.spin {
  animation: spinAnim 0.8s linear infinite;
}
@keyframes spinAnim {
  to {
    transform: rotate(360deg);
  }
}

/* ── Footer ── */
.footer-text {
  text-align: center;
  font-size: 10.5px;
  color: #2d4a2d;
  margin-top: 20px;
  letter-spacing: 0.3px;
}

/* ── Reduced motion ── */
@media (prefers-reduced-motion: reduce) {
  .blob,
  .particle,
  .ping-ring,
  .login-btn {
    animation: none !important;
  }
}

/* ── Small screens ── */
@media (max-width: 380px) {
  .glass-card {
    padding: 28px 20px 22px;
    border-radius: 18px;
  }
  .input-field {
    font-size: 16px;
  }
}
</style>
