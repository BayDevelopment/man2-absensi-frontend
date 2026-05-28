<!-- src/views/VerifyOtp.vue -->
<script setup>
import { ref, onMounted, nextTick } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useRouter } from "vue-router";
import Swal from "sweetalert2";

const auth = useAuthStore();
const router = useRouter();
const otp = ref("");
const error = ref("");
const loading = ref(false);
const mounted = ref(false);

onMounted(async () => {
  await nextTick();
  mounted.value = true;
});

const toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 2000,
  timerProgressBar: true,
  iconColor: "white",
  customClass: { popup: "colored-toast" },
});

async function submit() {
  if (otp.value.length < 6) return;
  loading.value = true;
  error.value = "";

  try {
    await auth.verifyOtp(otp.value);
  } catch (e) {
    error.value = e.response?.data?.message ?? "OTP salah atau kadaluarsa";
    loading.value = false;
    return;
  }

  loading.value = false;
  toast.fire({ icon: "success", title: "Login berhasil!" });
  router.push({ name: "Dashboard" });
}
</script>

<template>
  <main class="login-root">
    <!-- ── Left branding panel (desktop only) ── -->
    <aside class="login-side-panel" aria-hidden="true">
      <div class="login-side-content">
        <div class="login-side-logo">
          <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="40" cy="40" r="38" stroke="rgba(255,255,255,0.25)" stroke-width="1.5" />
            <circle cx="40" cy="40" r="32" stroke="rgba(255,255,255,0.15)" stroke-width="1" />
            <!-- Shield icon untuk keamanan -->
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

        <h2 class="login-side-title mt-4">Verifikasi Keamanan</h2>
        <p class="login-side-sub">Two-Factor Authentication</p>

        <div class="login-side-divider"></div>
        <p class="login-side-desc">Masukkan kode OTP yang<br />telah dikirim ke email kamu</p>

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
              <p class="login-mobile-school-name">Verifikasi OTP</p>
              <p class="login-mobile-school-sub">Sistem Absensi Digital</p>
            </div>
          </div>

          <!-- Card header -->
          <div class="login-card-header">
            <h1 class="login-card-title">Masukkan Kode OTP</h1>
            <p class="login-card-subtitle">Kode 6 digit telah dikirim ke email kamu</p>
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
            <span>Cek inbox atau folder spam email kamu</span>
          </div>

          <!-- OTP Input -->
          <div class="login-field-wrap">
            <label class="login-field-label">Kode OTP</label>
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
                placeholder="Masukkan 6 digit kode"
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
              Verifikasi OTP
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

          <!-- Back to login -->
          <button class="otp-back-btn" @click="router.push({ name: 'Login' })">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
              />
            </svg>
            Kembali ke Login
          </button>

          <p class="login-footer-text">© 2026 MAN 2 Kota Cilegon · Sistem Absensi Digital</p>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
/* ── Reuse semua class dari LoginView ── */
.login-root {
  display: flex;
  min-height: 100vh;
  background: #f0fdf4;
}

/* ── Side Panel ── */
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

/* ── Form Panel ── */
.login-form-panel {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
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
  background: #fff;
  border-radius: 20px;
  padding: 36px 32px 28px;
  box-shadow:
    0 4px 24px rgba(0, 0, 0, 0.08),
    0 1px 4px rgba(0, 0, 0, 0.04);
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
  color: #15803d;
  margin: 0 0 2px;
}

.login-mobile-school-sub {
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0;
}

/* ── Card Header ── */
.login-card-header {
  margin-bottom: 24px;
}

.login-card-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 6px;
  letter-spacing: -0.02em;
}

.login-card-subtitle {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

/* ── OTP Info Banner ── */
.otp-info-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 10px;
  padding: 12px 14px;
  margin-bottom: 20px;
  color: #15803d;
  font-size: 0.82rem;
  font-weight: 500;
}

.otp-info-banner svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  color: #16a34a;
}

/* ── Field ── */
.login-field-wrap {
  margin-bottom: 20px;
}

.login-field-label {
  display: block;
  font-size: 0.82rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 6px;
  letter-spacing: 0.01em;
}

.login-input-group {
  display: flex;
  align-items: center;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  background: #fafafa;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
  overflow: hidden;
}

.login-input-group:focus-within {
  border-color: #16a34a;
  box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1);
  background: #fff;
}

.login-input-group.input-active {
  border-color: #d1d5db;
  background: #fff;
}
.login-input-group.input-error {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.08);
}

.login-input-icon {
  display: flex;
  align-items: center;
  padding: 0 12px;
  color: #9ca3af;
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
  color: #111827;
  padding: 11px 0;
}

.otp-input {
  font-size: 1.1rem;
  font-weight: 600;
  letter-spacing: 0.2em;
}

.login-input-field::placeholder {
  color: #d1d5db;
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

/* ── Button ── */
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
  color: #6b7280;
  border: 1.5px solid #e5e7eb;
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
}

.otp-back-btn svg {
  width: 15px;
  height: 15px;
}

.otp-back-btn:hover {
  border-color: #16a34a;
  color: #16a34a;
  background: #f0fdf4;
}

/* ── Footer ── */
.login-footer-text {
  text-align: center;
  font-size: 0.72rem;
  color: #d1d5db;
  margin: 0;
}
</style>
