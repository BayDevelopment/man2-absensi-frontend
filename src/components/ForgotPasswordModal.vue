<script setup>
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { useAppearanceStore } from "@/stores/useAppearanceStore";

// ── Props & Emits ─────────────────────────────────────────────────────────
const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  // Opsional: nama & nomor kontak admin sekolah dari pengaturan
  adminName: {
    type: String,
    default: null,
  },
  adminPhone: {
    type: String,
    default: null,
  },
  adminEmail: {
    type: String,
    default: null,
  },
});

const emit = defineEmits(["close"]);

// ── Theme & Language ───────────────────────────────────────────────────────
const appearanceStore = useAppearanceStore();
const { resolvedTheme, language } = storeToRefs(appearanceStore);

const isDark = computed(() => resolvedTheme.value === "dark");
const isEn = computed(() => language.value === "en");

// ── i18n ───────────────────────────────────────────────────────────────────
const t = computed(() =>
  isEn.value
    ? {
        title: "Forgot Password?",
        subtitle:
          "Don't worry! Please contact your school's admin or operator to reset your password.",
        steps: [
          "Find your school's admin or operator",
          "Tell them your full name and NISN",
          "They will reset your password for you",
        ],
        contactTitle: "Contact Information",
        noContact: "Contact info not available",
        adminLabel: "Admin / Operator",
        phoneLabel: "Phone / WhatsApp",
        emailLabel: "Email",
        close: "Got it, thanks!",
        note: "For security reasons, passwords can only be reset by the school administrator.",
      }
    : {
        title: "Lupa Kata Sandi?",
        subtitle:
          "Jangan khawatir! Silahkan hubungi admin atau operator sekolah Anda untuk mereset kata sandi.",
        steps: [
          "Temui admin atau operator sekolahmu",
          "Sampaikan nama lengkap dan NISN kamu",
          "Admin akan mereset kata sandimu",
        ],
        contactTitle: "Informasi Kontak",
        noContact: "Informasi kontak belum tersedia",
        adminLabel: "Admin / Operator",
        phoneLabel: "Telepon / WhatsApp",
        emailLabel: "Email",
        close: "Mengerti, terima kasih!",
        note: "Demi keamanan, kata sandi hanya dapat direset oleh administrator sekolah.",
      },
);

const hasContact = computed(() => props.adminName || props.adminPhone || props.adminEmail);
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="show"
        class="fp-backdrop"
        :class="isDark ? 'fp-dark' : 'fp-light'"
        @click.self="emit('close')"
        role="dialog"
        aria-modal="true"
        :aria-label="t.title"
      >
        <Transition name="modal-slide">
          <div v-if="show" class="fp-modal">
            <!-- ── Decorative header strip ──────────────────────────── -->
            <div class="fp-header-strip">
              <div class="fp-strip-dots" aria-hidden="true">
                <span v-for="i in 12" :key="i" class="fp-strip-dot" />
              </div>
              <div class="fp-header-icon" aria-hidden="true">
                <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="24" cy="24" r="22" class="fp-icon-circle" stroke-width="1.5" />
                  <path
                    d="M24 14a5 5 0 015 5v3H19v-3a5 5 0 015-5z"
                    class="fp-icon-path"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <rect
                    x="15"
                    y="22"
                    width="18"
                    height="13"
                    rx="3"
                    class="fp-icon-rect"
                    stroke-width="1.8"
                  />
                  <circle cx="24" cy="28.5" r="2" class="fp-icon-dot" />
                  <path
                    d="M24 28.5v2.5"
                    class="fp-icon-path"
                    stroke-width="1.8"
                    stroke-linecap="round"
                  />
                  <!-- small question mark -->
                  <path
                    d="M36 10c1.8 0 3 1.1 3 2.6 0 1-.5 1.7-1.3 2.1l-.4.2c-.4.2-.6.5-.6.9v.4"
                    class="fp-icon-q"
                    stroke-width="1.4"
                    stroke-linecap="round"
                  />
                  <circle cx="36.7" cy="17.6" r=".7" class="fp-icon-q-dot" />
                </svg>
              </div>
            </div>

            <!-- ── Body ─────────────────────────────────────────────── -->
            <div class="fp-body">
              <h2 class="fp-title">{{ t.title }}</h2>
              <p class="fp-subtitle">{{ t.subtitle }}</p>

              <!-- Steps -->
              <div class="fp-steps">
                <div v-for="(step, idx) in t.steps" :key="idx" class="fp-step">
                  <div class="fp-step-num">{{ idx + 1 }}</div>
                  <p class="fp-step-text">{{ step }}</p>
                </div>
              </div>

              <!-- Contact info card -->
              <div class="fp-contact-card">
                <p class="fp-contact-title">
                  <svg
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                    aria-hidden="true"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"
                    />
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"
                    />
                  </svg>
                  {{ t.contactTitle }}
                </p>

                <template v-if="hasContact">
                  <div v-if="adminName" class="fp-contact-row">
                    <span class="fp-contact-label">{{ t.adminLabel }}</span>
                    <span class="fp-contact-value">{{ adminName }}</span>
                  </div>
                  <div v-if="adminPhone" class="fp-contact-row">
                    <span class="fp-contact-label">{{ t.phoneLabel }}</span>
                    <a
                      :href="`https://wa.me/${adminPhone.replace(/\D/g, '')}`"
                      target="_blank"
                      rel="noopener"
                      class="fp-contact-link"
                    >
                      <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path
                          d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"
                        />
                      </svg>
                      {{ adminPhone }}
                    </a>
                  </div>
                  <div v-if="adminEmail" class="fp-contact-row">
                    <span class="fp-contact-label">{{ t.emailLabel }}</span>
                    <a :href="`mailto:${adminEmail}`" class="fp-contact-link">
                      <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path
                          d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"
                        />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                      {{ adminEmail }}
                    </a>
                  </div>
                </template>
                <p v-else class="fp-no-contact">
                  <svg
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                    aria-hidden="true"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {{ t.noContact }}
                </p>
              </div>

              <!-- Security note -->
              <p class="fp-note">
                <svg
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                {{ t.note }}
              </p>

              <!-- Close button -->
              <button class="fp-close-btn" @click="emit('close')">
                {{ t.close }}
              </button>
            </div>

            <!-- ── X button ──────────────────────────────────────────── -->
            <button class="fp-x-btn" @click="emit('close')" :aria-label="isEn ? 'Close' : 'Tutup'">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* ── Variables: sinkron dengan tema login ─────────────────────────────────── */
.fp-light {
  --fp-bg: rgba(0, 0, 0, 0.45);
  --fp-modal-bg: #ffffff;
  --fp-modal-border: #e4e7ef;
  --fp-strip-bg: #16a34a;
  --fp-strip-dot: rgba(255, 255, 255, 0.35);
  --fp-icon-stroke: #ffffff;
  --fp-icon-fill: rgba(255, 255, 255, 0.15);
  --fp-title-color: #1a1d2e;
  --fp-sub-color: #7b8099;
  --fp-step-num-bg: #ecfdf3;
  --fp-step-num-text: #16a34a;
  --fp-step-num-border: #bbf7d0;
  --fp-step-text: #374151;
  --fp-card-bg: #f5f6fa;
  --fp-card-border: #e4e7ef;
  --fp-card-title: #6b7280;
  --fp-label-color: #9ca3af;
  --fp-value-color: #1a1d2e;
  --fp-link-color: #16a34a;
  --fp-link-hover: #15803d;
  --fp-note-color: #9ca3af;
  --fp-note-bg: #f9fafb;
  --fp-btn-bg: #16a34a;
  --fp-btn-hover: #15803d;
  --fp-btn-text: #ffffff;
  --fp-x-color: #9ca3af;
  --fp-x-hover: #1a1d2e;
  --fp-x-hover-bg: #f3f4f6;
  --fp-no-contact: #9ca3af;
  --fp-shadow: 0 20px 60px rgba(0, 0, 0, 0.15), 0 4px 16px rgba(0, 0, 0, 0.08);
}

.fp-dark {
  --fp-bg: rgba(0, 0, 0, 0.65);
  --fp-modal-bg: #1a1d2e;
  --fp-modal-border: #2c2f45;
  --fp-strip-bg: #15803d;
  --fp-strip-dot: rgba(255, 255, 255, 0.2);
  --fp-icon-stroke: #ffffff;
  --fp-icon-fill: rgba(255, 255, 255, 0.12);
  --fp-title-color: #e8eaf6;
  --fp-sub-color: #7b8099;
  --fp-step-num-bg: #1b2f22;
  --fp-step-num-text: #22c55e;
  --fp-step-num-border: #166534;
  --fp-step-text: #c9cad6;
  --fp-card-bg: #10111a;
  --fp-card-border: #2c2f45;
  --fp-card-title: #6b7280;
  --fp-label-color: #4b5563;
  --fp-value-color: #e8eaf6;
  --fp-link-color: #22c55e;
  --fp-link-hover: #16a34a;
  --fp-note-color: #4b5563;
  --fp-note-bg: #10111a;
  --fp-btn-bg: #22c55e;
  --fp-btn-hover: #16a34a;
  --fp-btn-text: #ffffff;
  --fp-x-color: #4b5563;
  --fp-x-hover: #e8eaf6;
  --fp-x-hover-bg: #2c2f45;
  --fp-no-contact: #4b5563;
  --fp-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 0 4px 16px rgba(0, 0, 0, 0.3);
}

/* ── Backdrop ─────────────────────────────────────────────────────────────── */
.fp-backdrop {
  position: fixed;
  inset: 0;
  background: var(--fp-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 16px;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

/* ── Modal ────────────────────────────────────────────────────────────────── */
.fp-modal {
  position: relative;
  width: 100%;
  max-width: 420px;
  background: var(--fp-modal-bg);
  border: 1px solid var(--fp-modal-border);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: var(--fp-shadow);
  font-family: "Poppins", sans-serif;
}

/* ── Header strip ─────────────────────────────────────────────────────────── */
.fp-header-strip {
  background: var(--fp-strip-bg);
  padding: 24px 24px 20px;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.fp-strip-dots {
  position: absolute;
  inset: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 8px;
  pointer-events: none;
}
.fp-strip-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--fp-strip-dot);
  flex-shrink: 0;
}

.fp-header-icon {
  position: relative;
  z-index: 1;
  width: 72px;
  height: 72px;
  background: rgba(255, 255, 255, 0.12);
  border: 1.5px solid rgba(255, 255, 255, 0.25);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fp-pulse 3s ease-in-out infinite;
}

.fp-header-icon svg {
  width: 44px;
  height: 44px;
}

.fp-icon-circle {
  stroke: rgba(255, 255, 255, 0.4);
  fill: none;
}
.fp-icon-path {
  stroke: white;
  fill: none;
}
.fp-icon-rect {
  stroke: white;
  fill: rgba(255, 255, 255, 0.15);
}
.fp-icon-dot {
  fill: white;
}
.fp-icon-q {
  stroke: rgba(255, 255, 255, 0.9);
  fill: none;
}
.fp-icon-q-dot {
  fill: rgba(255, 255, 255, 0.9);
}

@keyframes fp-pulse {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.15);
  }
  50% {
    box-shadow: 0 0 0 10px rgba(255, 255, 255, 0);
  }
}

/* ── Body ─────────────────────────────────────────────────────────────────── */
.fp-body {
  padding: 24px;
}

.fp-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--fp-title-color);
  margin: 0 0 6px;
  text-align: center;
}

.fp-subtitle {
  font-size: 13px;
  color: var(--fp-sub-color);
  text-align: center;
  line-height: 1.6;
  margin: 0 0 20px;
}

/* ── Steps ────────────────────────────────────────────────────────────────── */
.fp-steps {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 18px;
}

.fp-step {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.fp-step-num {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--fp-step-num-bg);
  border: 1.5px solid var(--fp-step-num-border);
  color: var(--fp-step-num-text);
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 1px;
}

.fp-step-text {
  font-size: 13px;
  color: var(--fp-step-text);
  line-height: 1.5;
  margin: 0;
  padding-top: 4px;
}

/* ── Contact card ─────────────────────────────────────────────────────────── */
.fp-contact-card {
  background: var(--fp-card-bg);
  border: 1px solid var(--fp-card-border);
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 16px;
}

.fp-contact-title {
  font-size: 11.5px;
  font-weight: 600;
  color: var(--fp-card-title);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0 0 10px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.fp-contact-title svg {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.fp-contact-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 0;
  border-bottom: 1px solid var(--fp-card-border);
}
.fp-contact-row:last-child {
  border-bottom: none;
}

.fp-contact-label {
  font-size: 11.5px;
  color: var(--fp-label-color);
  flex-shrink: 0;
}

.fp-contact-value {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--fp-value-color);
  text-align: right;
}

.fp-contact-link {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--fp-link-color);
  text-decoration: none;
  transition: color 0.15s;
}
.fp-contact-link:hover {
  color: var(--fp-link-hover);
  text-decoration: underline;
}
.fp-contact-link svg {
  width: 13px;
  height: 13px;
  flex-shrink: 0;
}

.fp-no-contact {
  font-size: 12.5px;
  color: var(--fp-no-contact);
  text-align: center;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 4px 0;
}
.fp-no-contact svg {
  width: 15px;
  height: 15px;
}

/* ── Security note ────────────────────────────────────────────────────────── */
.fp-note {
  font-size: 11.5px;
  color: var(--fp-note-color);
  background: var(--fp-note-bg);
  border-radius: 8px;
  padding: 10px 12px;
  margin: 0 0 18px;
  line-height: 1.5;
  display: flex;
  align-items: flex-start;
  gap: 7px;
}
.fp-note svg {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  margin-top: 1px;
}

/* ── Close button ─────────────────────────────────────────────────────────── */
.fp-close-btn {
  width: 100%;
  padding: 12px;
  border-radius: 10px;
  background: var(--fp-btn-bg);
  color: var(--fp-btn-text);
  font-family: inherit;
  font-size: 13.5px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition:
    background 0.15s,
    transform 0.1s;
  letter-spacing: 0.02em;
}
.fp-close-btn:hover {
  background: var(--fp-btn-hover);
}
.fp-close-btn:active {
  transform: scale(0.98);
}

/* ── X button ─────────────────────────────────────────────────────────────── */
.fp-x-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.15);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
  z-index: 2;
}
.fp-x-btn:hover {
  background: rgba(255, 255, 255, 0.25);
}
.fp-x-btn svg {
  width: 14px;
  height: 14px;
}

/* ── Transitions ──────────────────────────────────────────────────────────── */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.25s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-slide-enter-active {
  transition:
    opacity 0.25s ease,
    transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.modal-slide-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}
.modal-slide-enter-from {
  opacity: 0;
  transform: translateY(24px) scale(0.95);
}
.modal-slide-leave-to {
  opacity: 0;
  transform: translateY(12px) scale(0.97);
}
</style>
