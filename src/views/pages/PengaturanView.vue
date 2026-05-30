<script setup>
import { ref, onMounted, computed } from "vue";
import { useAuthStore } from "../../stores/auth";
import Sidebar from "../../components/AppSidebar.vue";
import Navbar from "../../components/AppNavbar.vue";
import AppFooter from "../../components/AppFooter.vue";
import api from "../../plugins/axios";
import { useAppearanceStore } from "@/stores/useAppearanceStore";

const appearanceStore = useAppearanceStore();
const authStore = useAuthStore();

// ── UI state ────────────────────────────────────────────────────────────────
const sidebarOpen = ref(false);
const activeTab = ref("akun");
const loading = ref(true);
const showToastFlag = ref(false);
const toastMsg = ref("");
const toastType = ref("success");

// ── Saving flags ────────────────────────────────────────────────────────────
const savingPassword = ref(false);
const savingNotif = ref(false);
const savingKeamanan = ref(false);
const savingTampilan = ref(false);

// ── Account data ────────────────────────────────────────────────────────────
const akunData = ref({
  nama: "",
  nis: "",
  nisn: "",
  email: "",
  jenisKelamin: "",
  noTelp: "",
  foto: null,
});

// ── Password fields ─────────────────────────────────────────────────────────
const pwLama = ref("");
const pwBaru = ref("");
const pwKonfirmasi = ref("");
const showPwLama = ref(false);
const showPwBaru = ref(false);
const showPwKonfirmasi = ref(false);
const pwSubmitAttempted = ref(false);

// ── Notification & security ────────────────────────────────────────────────
const notifApp = ref({
  kehadiran: false,
  pengumuman: false,
  jadwal: false,
});
const keamanan = ref({
  twoFactor: false,
  notifLogin: false,
  logoutOtomatis: false,
});
const sessions = ref([]);

// ── Appearance options ──────────────────────────────────────────────────────
const temaOptions = [
  { val: "light", labelId: "Terang (Light)", labelEn: "Light" },
  { val: "dark", labelId: "Gelap (Dark)", labelEn: "Dark" },
  { val: "system", labelId: "Otomatis (Ikuti Sistem)", labelEn: "Auto (System)" },
];
const bahasaOptions = [
  { val: "id", labelId: "Bahasa Indonesia", labelEn: "Indonesian" },
  { val: "en", labelId: "English", labelEn: "English" },
];

// ── i18n ────────────────────────────────────────────────────────────────────
const uiText = computed(() => {
  const isEn = appearanceStore.language === "en";
  return isEn
    ? {
        pageTitle: "Settings",
        pageSubtitle: "Manage account preferences and security",
        tabs: {
          akun: "Account",
          notifikasi: "Notifications",
          privasi: "Privacy & Security",
          tampilan: "Appearance",
        },
        labels: {
          fullName: "Full Name",
          nis: "Student ID",
          nisn: "NISN",
          email: "Email",
          phone: "Phone Number",
          gender: "Gender",
          oldPassword: "Current Password",
          newPassword: "New Password",
          confirmPassword: "Confirm New Password",
          activeSessions: "Active Sessions",
          theme: "App Theme",
          language: "Language",
        },
        texts: {
          onlyEditable: "Only editable on the Profile page",
          passwordTitle: "Change Password",
          passwordDesc: "Update your account password",
          attendance: "Attendance notifications",
          announcement: "Announcement notifications",
          schedule: "Schedule notifications",
          notifTitle: "App Notifications",
          notifDesc: "Manage notifications you receive",
          twoFactor: "Two-Factor Authentication",
          notifLogin: "Login activity notifications",
          logoutAuto: "Automatic logout",
          securityTitle: "Login Security",
          securityDesc: "Improve your account security",
          appearanceTitle: "Theme & Appearance",
          appearanceDesc: "Customize app appearance",
          emptySession: "No active sessions",
          thisDevice: "This device",
          remove: "Remove",
          removeAll: "Remove All Other Sessions",
          removeAllConfirm:
            "Are you sure you want to remove all other sessions? They will be logged out immediately.",
          editProfile: "Edit Profile",
          savePassword: "Update Password",
          saveNotif: "Save Notifications",
          saveSecurity: "Save Security",
          saveAppearance: "Save Appearance",
          saving: "Saving…",
          updating: "Updating…",
          male: "Male",
          female: "Female",
          other: "-",
          pwMinLength: "At least 8 characters",
          pwUppercase: "At least 1 uppercase letter",
          pwNumber: "At least 1 number",
          pwMatch: "Passwords do not match",
          pwStrengthWeak: "Weak",
          pwStrengthMedium: "Medium",
          pwStrengthStrong: "Strong",
        },
        toasts: {
          notif: "Notifications saved!",
          security: "Security settings saved!",
          password: "Password updated!",
          removeSession: "Session removed!",
          removeAll: "All other sessions removed!",
          loadError: "Failed to load settings.",
          appearance: "Appearance saved!",
        },
      }
    : {
        pageTitle: "Pengaturan",
        pageSubtitle: "Kelola preferensi dan keamanan akun",
        tabs: {
          akun: "Akun",
          notifikasi: "Notifikasi",
          privasi: "Privasi & Keamanan",
          tampilan: "Tampilan",
        },
        labels: {
          fullName: "Nama Lengkap",
          nis: "NIS",
          nisn: "NISN",
          email: "Email",
          phone: "No. HP",
          gender: "Jenis Kelamin",
          oldPassword: "Kata Sandi Lama",
          newPassword: "Kata Sandi Baru",
          confirmPassword: "Konfirmasi Kata Sandi Baru",
          activeSessions: "Sesi Aktif",
          theme: "Tema Aplikasi",
          language: "Bahasa",
        },
        texts: {
          onlyEditable: "Hanya bisa diedit di halaman Profil",
          passwordTitle: "Ubah Kata Sandi",
          passwordDesc: "Perbarui password akun kamu",
          attendance: "Notifikasi kehadiran",
          announcement: "Notifikasi pengumuman",
          schedule: "Notifikasi jadwal",
          notifTitle: "Notifikasi Aplikasi",
          notifDesc: "Atur notifikasi yang kamu terima",
          twoFactor: "Autentikasi Dua Faktor",
          notifLogin: "Notifikasi aktivitas login",
          logoutAuto: "Logout otomatis",
          securityTitle: "Keamanan Login",
          securityDesc: "Tingkatkan keamanan akunmu",
          appearanceTitle: "Tema & Tampilan",
          appearanceDesc: "Sesuaikan tampilan aplikasi",
          emptySession: "Tidak ada sesi aktif",
          thisDevice: "Perangkat ini",
          remove: "Keluarkan",
          removeAll: "Keluarkan Semua Sesi Lain",
          removeAllConfirm:
            "Yakin ingin mengeluarkan semua sesi lain? Mereka akan langsung logout.",
          editProfile: "Edit Profil",
          savePassword: "Perbarui Kata Sandi",
          saveNotif: "Simpan Notifikasi",
          saveSecurity: "Simpan Keamanan",
          saveAppearance: "Simpan Tampilan",
          saving: "Menyimpan…",
          updating: "Memperbarui…",
          male: "Laki-laki",
          female: "Perempuan",
          other: "-",
          pwMinLength: "Minimal 8 karakter",
          pwUppercase: "Minimal 1 huruf kapital",
          pwNumber: "Minimal 1 angka",
          pwMatch: "Kata sandi tidak cocok",
          pwStrengthWeak: "Lemah",
          pwStrengthMedium: "Sedang",
          pwStrengthStrong: "Kuat",
        },
        toasts: {
          notif: "Notifikasi berhasil disimpan!",
          security: "Pengaturan keamanan disimpan!",
          password: "Kata sandi berhasil diperbarui!",
          removeSession: "Sesi berhasil dikeluarkan!",
          removeAll: "Semua sesi lain telah dikeluarkan!",
          loadError: "Gagal memuat pengaturan.",
          appearance: "Tampilan berhasil disimpan!",
        },
      };
});

const today = computed(() => {
  const locale = appearanceStore.language === "en" ? "en-US" : "id-ID";
  return new Date().toLocaleDateString(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
});

const tabs = computed(() => [
  { key: "akun", label: uiText.value.tabs.akun },
  { key: "notifikasi", label: uiText.value.tabs.notifikasi },
  { key: "privasi", label: uiText.value.tabs.privasi },
  { key: "tampilan", label: uiText.value.tabs.tampilan },
]);

const initials = computed(() => {
  const name = akunData.value.nama || authStore.user?.name || "";
  return (
    name
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "??"
  );
});

const jenisKelaminLabel = computed(() => {
  const v = akunData.value.jenisKelamin?.toLowerCase();
  if (v === "l" || v === "laki-laki") return uiText.value.texts.male;
  if (v === "p" || v === "perempuan") return uiText.value.texts.female;
  return uiText.value.texts.other;
});

// ── Password validation (FIX #1 — regex + danger input) ────────────────────
const pwRules = computed(() => [
  { key: "minLength", label: uiText.value.texts.pwMinLength, valid: pwBaru.value.length >= 8 },
  { key: "uppercase", label: uiText.value.texts.pwUppercase, valid: /[A-Z]/.test(pwBaru.value) },
  { key: "number", label: uiText.value.texts.pwNumber, valid: /[0-9]/.test(pwBaru.value) },
  {
    key: "match",
    label: uiText.value.texts.pwMatch,
    valid: pwKonfirmasi.value.length > 0 && pwKonfirmasi.value === pwBaru.value,
  },
]);

const pwStrengthScore = computed(() => {
  if (!pwBaru.value) return 0;
  let score = 0;
  if (pwBaru.value.length >= 8) score++;
  if (pwBaru.value.length >= 12) score++;
  if (/[A-Z]/.test(pwBaru.value)) score++;
  if (/[0-9]/.test(pwBaru.value)) score++;
  if (/[^A-Za-z0-9]/.test(pwBaru.value)) score++;
  return score;
});

const pwStrengthLabel = computed(() => {
  const s = pwStrengthScore.value;
  if (!pwBaru.value) return "";
  if (s <= 2) return uiText.value.texts.pwStrengthWeak;
  if (s <= 3) return uiText.value.texts.pwStrengthMedium;
  return uiText.value.texts.pwStrengthStrong;
});

const pwStrengthClass = computed(() => {
  const s = pwStrengthScore.value;
  if (!pwBaru.value) return "";
  if (s <= 2) return "strength-weak";
  if (s <= 3) return "strength-medium";
  return "strength-strong";
});

const isPwBaruError = computed(
  () => pwSubmitAttempted.value && pwBaru.value && pwRules.value.slice(0, 3).some((r) => !r.valid),
);
const isPwKonfirmError = computed(
  () => pwSubmitAttempted.value && pwKonfirmasi.value && !pwRules.value[3].valid,
);
const isPwFormValid = computed(
  () => pwLama.value.length > 0 && pwRules.value.every((r) => r.valid),
);

// ── Toast ────────────────────────────────────────────────────────────────────
let toastTimer = null;
function showToast(msg, type = "success") {
  // FIX #2 — tidak ada race condition, hanya satu timer aktif
  clearTimeout(toastTimer);
  toastMsg.value = msg;
  toastType.value = type;
  showToastFlag.value = true;
  toastTimer = setTimeout(() => {
    showToastFlag.value = false;
  }, 3000);
}

function showError(err) {
  showToast(err?.response?.data?.message ?? "Gagal menyimpan. Coba lagi.", "error");
}

// ── Fetch ────────────────────────────────────────────────────────────────────
async function fetchSettings() {
  loading.value = true;
  try {
    const { data } = await api.get("/api/settings");
    const d = data.data;

    akunData.value = {
      nama: d.akun?.nama_lengkap ?? "",
      nis: d.akun?.nis ?? "",
      nisn: d.akun?.nisn ?? "",
      email: d.akun?.email ?? "",
      jenisKelamin: d.akun?.jenis_kelamin ?? "",
      noTelp: d.akun?.no_hp ?? "",
      foto: d.akun?.foto ?? null,
    };

    notifApp.value = {
      kehadiran: d.notifikasi?.kehadiran ?? false,
      pengumuman: d.notifikasi?.pengumuman ?? false,
      jadwal: d.notifikasi?.jadwal ?? false,
    };

    keamanan.value = {
      twoFactor: d.keamanan?.two_factor ?? false,
      notifLogin: d.keamanan?.notif_login ?? false,
      logoutOtomatis: d.keamanan?.logout_otomatis ?? false,
    };

    appearanceStore.setTheme(d.tampilan?.tema ?? "system");
    appearanceStore.setLanguage(d.tampilan?.bahasa ?? "id");

    sessions.value = d.sesi ?? [];
  } catch {
    // FIX #3 — hanya satu toast saat load error
    showToast(uiText.value.toasts.loadError, "error");
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  appearanceStore.init();
  fetchSettings();
});

// ── Save handlers ───────────────────────────────────────────────────────────
async function saveNotifikasi() {
  if (savingNotif.value) return;
  savingNotif.value = true;
  try {
    await api.put("/api/settings/notifikasi", {
      kehadiran: notifApp.value.kehadiran,
      pengumuman: notifApp.value.pengumuman,
      jadwal: notifApp.value.jadwal,
    });
    showToast(uiText.value.toasts.notif);
  } catch (e) {
    showError(e);
  } finally {
    savingNotif.value = false;
  }
}

async function saveKeamanan() {
  if (savingKeamanan.value) return;
  savingKeamanan.value = true;
  try {
    await api.put("/api/settings/keamanan", {
      two_factor: keamanan.value.twoFactor,
      notif_login: keamanan.value.notifLogin,
      logout_otomatis: keamanan.value.logoutOtomatis,
    });
    showToast(uiText.value.toasts.security);
  } catch (e) {
    showError(e);
  } finally {
    savingKeamanan.value = false;
  }
}

// FIX #4 — tampilan disimpan ke backend
async function saveTampilanToServer(tema, bahasa) {
  if (savingTampilan.value) return;
  savingTampilan.value = true;
  try {
    await api.put("/api/settings/tampilan", {
      tema: tema,
      bahasa: bahasa,
      ukuran_teks: "normal",
    });
    showToast(uiText.value.toasts.appearance);
  } catch (e) {
    showError(e);
  } finally {
    savingTampilan.value = false;
  }
}

async function handleSetTheme(val) {
  appearanceStore.setTheme(val);
  await saveTampilanToServer(val, appearanceStore.language);
}

async function handleSetLanguage(val) {
  appearanceStore.setLanguage(val);
  await saveTampilanToServer(appearanceStore.theme, val);
}

// FIX #5 — validasi regex di frontend sebelum hit API
async function savePassword() {
  pwSubmitAttempted.value = true;
  if (!isPwFormValid.value) return;
  if (savingPassword.value) return;
  savingPassword.value = true;
  try {
    await api.put("/api/settings/password", {
      password_lama: pwLama.value,
      password_baru: pwBaru.value,
      password_konfirmasi: pwKonfirmasi.value,
    });
    pwLama.value = "";
    pwBaru.value = "";
    pwKonfirmasi.value = "";
    pwSubmitAttempted.value = false;
    showToast(uiText.value.toasts.password);
  } catch (e) {
    showError(e);
  } finally {
    savingPassword.value = false;
  }
}

async function removeSession(id) {
  try {
    await api.delete(`/api/settings/sesi/${id}`);
    sessions.value = sessions.value.filter((s) => s.id !== id);
    showToast(uiText.value.toasts.removeSession);
  } catch (e) {
    showError(e);
  }
}

// FIX #6 — konfirmasi sebelum hapus semua sesi
async function removeAllSessions() {
  if (!confirm(uiText.value.texts.removeAllConfirm)) return;
  try {
    await api.delete("/api/settings/sesi");
    sessions.value = sessions.value.filter((s) => s.is_current);
    showToast(uiText.value.toasts.removeAll);
  } catch (e) {
    showError(e);
  }
}
</script>

<template>
  <div class="layout-root">
    <Sidebar :open="sidebarOpen" @close="sidebarOpen = false" />

    <div class="layout-main">
      <Navbar @toggle-sidebar="sidebarOpen = !sidebarOpen" />

      <main class="layout-content">
        <!-- ─── SKELETON ──────────────────────────────────────────────── -->
        <template v-if="loading">
          <div class="dash-header">
            <div class="sk-stack">
              <div class="skeleton skeleton-title"></div>
              <div class="skeleton skeleton-subtitle"></div>
            </div>
            <div class="skeleton skeleton-pill"></div>
          </div>
          <div class="tab-nav sk-tab-nav">
            <div v-for="n in 4" :key="n" class="skeleton skeleton-tab"></div>
          </div>
          <div class="sk-card">
            <div class="skeleton skeleton-card-head"></div>
            <div class="sk-card-body">
              <div class="skeleton skeleton-avatar"></div>
              <div class="sk-lines">
                <div class="skeleton skeleton-line w-60"></div>
                <div class="skeleton skeleton-line w-40"></div>
              </div>
              <div class="skeleton skeleton-button w-28"></div>
            </div>
          </div>
          <div class="sk-card">
            <div class="skeleton skeleton-card-head"></div>
            <div class="sk-grid">
              <div v-for="n in 6" :key="`f-${n}`" class="sk-field">
                <div class="skeleton skeleton-label"></div>
                <div class="skeleton skeleton-input"></div>
              </div>
            </div>
          </div>
          <div class="sk-card">
            <div class="skeleton skeleton-card-head"></div>
            <div class="sk-grid">
              <div v-for="n in 3" :key="`p-${n}`" class="sk-field">
                <div class="skeleton skeleton-label"></div>
                <div class="skeleton skeleton-input"></div>
              </div>
            </div>
          </div>
        </template>

        <!-- ─── CONTENT ──────────────────────────────────────────────── -->
        <template v-else>
          <div class="dash-header">
            <div>
              <h1 class="dash-title">{{ uiText.pageTitle }}</h1>
              <p class="dash-sub">{{ uiText.pageSubtitle }}</p>
            </div>
            <span class="dash-date">{{ today }}</span>
          </div>

          <div class="tab-nav">
            <button
              v-for="tab in tabs"
              :key="tab.key"
              class="tab-btn"
              :class="{ active: activeTab === tab.key }"
              @click="activeTab = tab.key"
            >
              {{ tab.label }}
            </button>
          </div>

          <!-- ═══ TAB: AKUN ════════════════════════════════════════════ -->
          <div v-if="activeTab === 'akun'" class="tab-body">
            <div class="info-card avatar-card">
              <div class="avatar-lg">{{ initials }}</div>
              <div>
                <p class="avatar-name">{{ akunData.nama || "—" }}</p>
                <p class="avatar-nis">NIS: {{ akunData.nis || "—" }}</p>
              </div>
              <router-link to="/profil" class="btn btn-outline ml-auto">
                {{ uiText.texts.editProfile }}
              </router-link>
            </div>

            <div class="info-card">
              <div class="card-head">
                <div>
                  <h3 class="card-title">{{ uiText.tabs.akun }}</h3>
                  <p class="card-desc">{{ uiText.texts.onlyEditable }}</p>
                </div>
              </div>
              <div class="field-grid">
                <div class="field-item">
                  <label class="field-label">{{ uiText.labels.fullName }}</label>
                  <div class="field-readonly">{{ akunData.nama || "—" }}</div>
                </div>
                <div class="field-item">
                  <label class="field-label">{{ uiText.labels.nis }}</label>
                  <div class="field-readonly">{{ akunData.nis || "—" }}</div>
                </div>
                <div class="field-item">
                  <label class="field-label">{{ uiText.labels.nisn }}</label>
                  <div class="field-readonly">{{ akunData.nisn || "—" }}</div>
                </div>
                <div class="field-item">
                  <label class="field-label">{{ uiText.labels.email }}</label>
                  <div class="field-readonly">{{ akunData.email || "—" }}</div>
                </div>
                <div class="field-item">
                  <label class="field-label">{{ uiText.labels.phone }}</label>
                  <div class="field-readonly">{{ akunData.noTelp || "—" }}</div>
                </div>
                <div class="field-item">
                  <label class="field-label">{{ uiText.labels.gender }}</label>
                  <div class="field-readonly">{{ jenisKelaminLabel }}</div>
                </div>
              </div>
            </div>

            <!-- ── Password card ─────────────────────────────────────── -->
            <div class="info-card">
              <div class="card-head">
                <div>
                  <h3 class="card-title">{{ uiText.texts.passwordTitle }}</h3>
                  <p class="card-desc">{{ uiText.texts.passwordDesc }}</p>
                </div>
              </div>

              <div class="field-grid">
                <!-- Kata Sandi Lama -->
                <div class="field-item field-full">
                  <label class="field-label">{{ uiText.labels.oldPassword }}</label>
                  <div class="pw-wrap">
                    <input
                      v-model="pwLama"
                      :type="showPwLama ? 'text' : 'password'"
                      class="field-input"
                      autocomplete="current-password"
                    />
                    <button type="button" class="pw-eye" @click="showPwLama = !showPwLama">
                      <span>{{ showPwLama ? "🙈" : "👁" }}</span>
                    </button>
                  </div>
                </div>

                <!-- Kata Sandi Baru -->
                <div class="field-item">
                  <label class="field-label">{{ uiText.labels.newPassword }}</label>
                  <div class="pw-wrap">
                    <input
                      v-model="pwBaru"
                      :type="showPwBaru ? 'text' : 'password'"
                      :class="['field-input', { 'field-input--error': isPwBaruError }]"
                      autocomplete="new-password"
                    />
                    <button type="button" class="pw-eye" @click="showPwBaru = !showPwBaru">
                      <span>{{ showPwBaru ? "🙈" : "👁" }}</span>
                    </button>
                  </div>

                  <!-- Strength bar -->
                  <div v-if="pwBaru" class="pw-strength">
                    <div class="pw-strength-bar">
                      <div
                        class="pw-strength-fill"
                        :class="pwStrengthClass"
                        :style="{ width: (pwStrengthScore / 5) * 100 + '%' }"
                      ></div>
                    </div>
                    <span class="pw-strength-label" :class="pwStrengthClass">
                      {{ pwStrengthLabel }}
                    </span>
                  </div>

                  <!-- Rules checklist -->
                  <ul v-if="pwBaru || pwSubmitAttempted" class="pw-rules">
                    <li
                      v-for="rule in pwRules.slice(0, 3)"
                      :key="rule.key"
                      :class="rule.valid ? 'rule-ok' : 'rule-err'"
                    >
                      <span class="rule-icon">{{ rule.valid ? "✓" : "✕" }}</span>
                      {{ rule.label }}
                    </li>
                  </ul>
                </div>

                <!-- Konfirmasi Kata Sandi Baru -->
                <div class="field-item">
                  <label class="field-label">{{ uiText.labels.confirmPassword }}</label>
                  <div class="pw-wrap">
                    <input
                      v-model="pwKonfirmasi"
                      :type="showPwKonfirmasi ? 'text' : 'password'"
                      :class="['field-input', { 'field-input--error': isPwKonfirmError }]"
                      autocomplete="new-password"
                    />
                    <button
                      type="button"
                      class="pw-eye"
                      @click="showPwKonfirmasi = !showPwKonfirmasi"
                    >
                      <span>{{ showPwKonfirmasi ? "🙈" : "👁" }}</span>
                    </button>
                  </div>
                  <p v-if="isPwKonfirmError" class="field-error-msg">
                    {{ uiText.texts.pwMatch }}
                  </p>
                </div>
              </div>

              <div class="card-foot">
                <button class="btn btn-primary" :disabled="savingPassword" @click="savePassword">
                  {{ savingPassword ? uiText.texts.updating : uiText.texts.savePassword }}
                </button>
              </div>
            </div>
          </div>

          <!-- ═══ TAB: NOTIFIKASI ══════════════════════════════════════ -->
          <div v-if="activeTab === 'notifikasi'" class="tab-body">
            <div class="info-card">
              <div class="card-head">
                <div>
                  <h3 class="card-title">{{ uiText.texts.notifTitle }}</h3>
                  <p class="card-desc">{{ uiText.texts.notifDesc }}</p>
                </div>
              </div>
              <div class="toggle-list">
                <div class="toggle-row">
                  <span class="tl">{{ uiText.texts.attendance }}</span>
                  <label class="switch">
                    <input type="checkbox" v-model="notifApp.kehadiran" />
                    <span class="slider"></span>
                  </label>
                </div>
                <div class="toggle-row">
                  <span class="tl">{{ uiText.texts.announcement }}</span>
                  <label class="switch">
                    <input type="checkbox" v-model="notifApp.pengumuman" />
                    <span class="slider"></span>
                  </label>
                </div>
                <div class="toggle-row">
                  <span class="tl">{{ uiText.texts.schedule }}</span>
                  <label class="switch">
                    <input type="checkbox" v-model="notifApp.jadwal" />
                    <span class="slider"></span>
                  </label>
                </div>
              </div>
              <div class="card-foot">
                <button class="btn btn-primary" :disabled="savingNotif" @click="saveNotifikasi">
                  {{ savingNotif ? uiText.texts.saving : uiText.texts.saveNotif }}
                </button>
              </div>
            </div>
          </div>

          <!-- ═══ TAB: PRIVASI ═════════════════════════════════════════ -->
          <div v-if="activeTab === 'privasi'" class="tab-body">
            <div class="info-card">
              <div class="card-head">
                <div>
                  <h3 class="card-title">{{ uiText.texts.securityTitle }}</h3>
                  <p class="card-desc">{{ uiText.texts.securityDesc }}</p>
                </div>
              </div>
              <div class="toggle-list">
                <div class="toggle-row">
                  <span class="tl">{{ uiText.texts.twoFactor }}</span>
                  <label class="switch">
                    <input type="checkbox" v-model="keamanan.twoFactor" />
                    <span class="slider"></span>
                  </label>
                </div>
                <div class="toggle-row">
                  <span class="tl">{{ uiText.texts.notifLogin }}</span>
                  <label class="switch">
                    <input type="checkbox" v-model="keamanan.notifLogin" />
                    <span class="slider"></span>
                  </label>
                </div>
                <div class="toggle-row">
                  <span class="tl">{{ uiText.texts.logoutAuto }}</span>
                  <label class="switch">
                    <input type="checkbox" v-model="keamanan.logoutOtomatis" />
                    <span class="slider"></span>
                  </label>
                </div>
              </div>
              <div class="card-foot">
                <button class="btn btn-primary" :disabled="savingKeamanan" @click="saveKeamanan">
                  {{ savingKeamanan ? uiText.texts.saving : uiText.texts.saveSecurity }}
                </button>
              </div>
            </div>

            <!-- Sesi Aktif -->
            <div class="info-card">
              <div class="card-head">
                <div>
                  <h3 class="card-title">{{ uiText.labels.activeSessions }}</h3>
                </div>
                <button
                  v-if="sessions.filter((s) => !s.is_current).length"
                  class="btn btn-danger-outline btn-sm"
                  @click="removeAllSessions"
                >
                  {{ uiText.texts.removeAll }}
                </button>
              </div>

              <div v-if="sessions.length === 0" class="empty-state">
                {{ uiText.texts.emptySession }}
              </div>
              <div v-else class="session-list">
                <div v-for="s in sessions" :key="s.id" class="session-row">
                  <div class="session-icon">💻</div>
                  <div class="session-info">
                    <p class="si-name">{{ s.device ?? "Unknown device" }}</p>
                    <p class="si-sub">{{ s.ip_address }} · {{ s.last_active }}</p>
                  </div>
                  <span v-if="s.is_current" class="badge-green">{{ uiText.texts.thisDevice }}</span>
                  <button v-else class="btn btn-danger-outline btn-sm" @click="removeSession(s.id)">
                    {{ uiText.texts.remove }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- ═══ TAB: TAMPILAN ════════════════════════════════════════ -->
          <div v-if="activeTab === 'tampilan'" class="tab-body">
            <div class="info-card">
              <div class="card-head">
                <div>
                  <h3 class="card-title">{{ uiText.texts.appearanceTitle }}</h3>
                  <p class="card-desc">{{ uiText.texts.appearanceDesc }}</p>
                </div>
              </div>
              <div class="appearance-grid">
                <div class="ap-group">
                  <label class="field-label">{{ uiText.labels.theme }}</label>
                  <div class="seg-control">
                    <button
                      v-for="opt in temaOptions"
                      :key="opt.val"
                      class="seg-btn"
                      :class="{ active: appearanceStore.theme === opt.val }"
                      :disabled="savingTampilan"
                      @click="handleSetTheme(opt.val)"
                    >
                      <span class="seg-icon">
                        {{ opt.val === "light" ? "☀️" : opt.val === "dark" ? "🌙" : "⚙️" }}
                      </span>
                      {{ appearanceStore.language === "en" ? opt.labelEn : opt.labelId }}
                    </button>
                  </div>
                </div>

                <div class="ap-group">
                  <label class="field-label">{{ uiText.labels.language }}</label>
                  <div class="seg-control">
                    <button
                      v-for="opt in bahasaOptions"
                      :key="opt.val"
                      class="seg-btn"
                      :class="{ active: appearanceStore.language === opt.val }"
                      :disabled="savingTampilan"
                      @click="handleSetLanguage(opt.val)"
                    >
                      <span class="seg-icon">{{ opt.val === "id" ? "🇮🇩" : "🇬🇧" }}</span>
                      {{ appearanceStore.language === "en" ? opt.labelEn : opt.labelId }}
                    </button>
                  </div>
                </div>

                <p v-if="savingTampilan" class="saving-hint">{{ uiText.texts.saving }}</p>
              </div>
            </div>
          </div>
        </template>
      </main>

      <AppFooter />
    </div>

    <!-- ── Toast ─────────────────────────────────────────────────────── -->
    <Transition name="toast">
      <div
        v-if="showToastFlag"
        class="toast"
        :class="toastType === 'error' ? 'toast-error' : 'toast-success'"
      >
        {{ toastMsg }}
      </div>
    </Transition>
  </div>
</template>

<style scoped>
:global(:root),
:global([data-theme="light"]) {
  --color-bg: #f5f6fa;
  --color-surface: #ffffff;
  --color-border: #e4e7ef;
  --color-text-primary: #1a1d2e;
  --color-text-muted: #7b8099;
  --color-primary: #16a34a;
  --color-primary-hover: #15803d;
  --color-primary-soft: #ecfdf3;
  --color-danger: #e74c3c;
  --color-danger-soft: #fdf0ef;
  --color-warning: #d97706;
  --color-warning-soft: #fffbeb;
  --color-success-soft: #ecfdf3;
}

:global([data-theme="dark"]) {
  --color-bg: #10111a;
  --color-surface: #1a1d2e;
  --color-border: #2c2f45;
  --color-text-primary: #e8eaf6;
  --color-text-muted: #7b8099;
  --color-primary: #22c55e;
  --color-primary-hover: #16a34a;
  --color-primary-soft: #1b2f22;
  --color-danger: #ff6b6b;
  --color-danger-soft: #2a1a1a;
  --color-warning: #fbbf24;
  --color-warning-soft: #2a2000;
  --color-success-soft: #1b2f22;
}

/* ── Layout ──────────────────────────────────────────────────────────── */
.layout-root {
  display: flex;
  min-height: 100vh;
  background: var(--color-bg);
  font-family: "Poppins", sans-serif;
  font-size: var(--base-font-size, 15px);
}
.layout-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.layout-content {
  flex: 1;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ── Header ──────────────────────────────────────────────────────────── */
.dash-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
}
.dash-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-primary);
  margin: 0;
}
.dash-sub {
  font-size: 13px;
  color: var(--color-text-muted);
  margin: 2px 0 0;
}
.dash-date {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-primary);
  background: var(--color-primary-soft);
  padding: 5px 12px;
  border-radius: 20px;
  white-space: nowrap;
}

/* ── Tabs ────────────────────────────────────────────────────────────── */
.tab-nav {
  display: flex;
  gap: 4px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  padding: 6px;
  width: fit-content;
  flex-wrap: wrap;
}
.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 16px;
  border-radius: 10px;
  font-size: 12.5px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
  background: transparent;
  color: var(--color-text-muted);
}
.tab-btn.active {
  background: var(--color-primary);
  color: #fff;
}
.tab-btn:not(.active):hover {
  background: var(--color-primary-soft);
  color: var(--color-primary);
}
.tab-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ── Card ────────────────────────────────────────────────────────────── */
.info-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 10px 24px rgba(14, 18, 32, 0.04);
}
.card-head {
  padding: 14px 18px;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.card-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}
.card-desc {
  font-size: 11px;
  color: var(--color-text-muted);
  margin-top: 2px;
}
.card-foot {
  padding: 14px 18px;
  border-top: 1px solid var(--color-border);
  display: flex;
  justify-content: flex-end;
}

/* ── Avatar card ─────────────────────────────────────────────────────── */
.avatar-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 18px;
}
.avatar-lg {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--color-primary-soft);
  color: var(--color-primary);
  font-size: 20px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.avatar-name {
  font-size: 15px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}
.avatar-nis {
  font-size: 12px;
  color: var(--color-text-muted);
  margin: 2px 0 0;
}
.ml-auto {
  margin-left: auto;
}

/* ── Fields ──────────────────────────────────────────────────────────── */
.field-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 14px;
  padding: 16px 18px;
}
.field-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.field-full {
  grid-column: 1 / -1;
}
.field-label {
  font-size: 11.5px;
  font-weight: 600;
  color: var(--color-text-muted);
}
.field-readonly {
  padding: 9px 12px;
  border-radius: 8px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  font-size: 13px;
  color: var(--color-text-primary);
}
.field-input {
  width: 100%;
  padding: 9px 40px 9px 12px;
  border-radius: 8px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  font-size: 13px;
  color: var(--color-text-primary);
  outline: none;
  font-family: inherit;
  box-sizing: border-box;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
}
.field-input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-soft);
}

/* FIX: danger input state */
.field-input--error {
  border-color: var(--color-danger) !important;
}
.field-input--error:focus {
  box-shadow: 0 0 0 3px var(--color-danger-soft) !important;
}
.field-error-msg {
  font-size: 11px;
  color: var(--color-danger);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 4px;
}
.field-error-msg::before {
  content: "✕";
  font-size: 10px;
}

/* ── Password wrap ───────────────────────────────────────────────────── */
.pw-wrap {
  position: relative;
}
.pw-wrap .field-input {
  padding-right: 40px;
}
.pw-eye {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  font-size: 15px;
}

/* ── Password strength ───────────────────────────────────────────────── */
.pw-strength {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
}
.pw-strength-bar {
  flex: 1;
  height: 4px;
  border-radius: 99px;
  background: var(--color-border);
  overflow: hidden;
}
.pw-strength-fill {
  height: 100%;
  border-radius: 99px;
  transition:
    width 0.3s,
    background 0.3s;
}
.pw-strength-label {
  font-size: 11px;
  font-weight: 600;
  min-width: 46px;
}

.strength-weak .pw-strength-fill,
.strength-weak {
  background: var(--color-danger);
  color: var(--color-danger);
}
.strength-medium .pw-strength-fill,
.strength-medium {
  background: var(--color-warning);
  color: var(--color-warning);
}
.strength-strong .pw-strength-fill,
.strength-strong {
  background: var(--color-primary);
  color: var(--color-primary);
}

/* ── Password rules checklist ────────────────────────────────────────── */
.pw-rules {
  list-style: none;
  margin: 8px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.pw-rules li {
  font-size: 11.5px;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: color 0.2s;
}
.rule-icon {
  font-size: 10px;
  font-weight: 700;
}
.rule-ok {
  color: var(--color-primary);
}
.rule-err {
  color: var(--color-danger);
}

/* ── Toggles ─────────────────────────────────────────────────────────── */
.toggle-list {
  padding: 0 18px;
}
.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid var(--color-border);
}
.toggle-row:last-child {
  border-bottom: none;
}
.tl {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.switch {
  position: relative;
  display: inline-block;
  width: 42px;
  height: 24px;
  flex-shrink: 0;
}
.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}
.slider {
  position: absolute;
  inset: 0;
  background: #ccc;
  border-radius: 24px;
  transition: 0.3s;
  cursor: pointer;
}
.slider::before {
  content: "";
  position: absolute;
  width: 18px;
  height: 18px;
  left: 3px;
  bottom: 3px;
  background: #fff;
  border-radius: 50%;
  transition: 0.3s;
}
.switch input:checked + .slider {
  background: var(--color-primary);
}
.switch input:checked + .slider::before {
  transform: translateX(18px);
}

/* ── Appearance ──────────────────────────────────────────────────────── */
.appearance-grid {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 16px 18px;
}
.ap-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.seg-control {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.seg-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 7px 14px;
  border-radius: 8px;
  font-size: 12.5px;
  font-weight: 600;
  border: 1.5px solid var(--color-border);
  background: var(--color-bg);
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
}
.seg-btn.active {
  border-color: var(--color-primary);
  background: var(--color-primary-soft);
  color: var(--color-primary);
}
.seg-btn:not(.active):hover {
  background: var(--color-primary-soft);
  border-color: var(--color-primary);
  color: var(--color-primary);
}
.seg-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.seg-icon {
  font-size: 14px;
}
.saving-hint {
  font-size: 12px;
  color: var(--color-text-muted);
  margin: 0;
}

/* ── Sessions ────────────────────────────────────────────────────────── */
.session-list {
  padding: 0 18px;
}
.session-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--color-border);
}
.session-row:last-child {
  border-bottom: none;
}
.session-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: var(--color-primary-soft);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}
.session-info {
  flex: 1;
  min-width: 0;
}
.si-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}
.si-sub {
  font-size: 11px;
  color: var(--color-text-muted);
  margin: 2px 0 0;
}
.empty-state {
  padding: 24px 18px;
  text-align: center;
  color: var(--color-text-muted);
  font-size: 13px;
}
.badge-green {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 20px;
  background: var(--color-primary-soft);
  color: var(--color-primary);
  white-space: nowrap;
}

/* ── Buttons ─────────────────────────────────────────────────────────── */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  border-radius: 8px;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  font-family: inherit;
  transition: all 0.15s;
}
.btn-primary {
  background: var(--color-primary);
  color: #fff;
}
.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-hover);
}
.btn-primary:disabled {
  opacity: 0.6;
  cursor: default;
}
.btn-outline {
  background: transparent;
  border: 1.5px solid var(--color-border);
  color: var(--color-text-primary);
}
.btn-outline:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}
.btn-danger-outline {
  background: transparent;
  border: 1.5px solid var(--color-danger);
  color: var(--color-danger);
}
.btn-danger-outline:hover {
  background: var(--color-danger-soft);
}
.btn-sm {
  padding: 5px 12px;
  font-size: 11.5px;
}

/* ── Toast ───────────────────────────────────────────────────────────── */
.toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  padding: 12px 20px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  z-index: 9999;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}
.toast-success {
  background: var(--color-primary);
}
.toast-error {
  background: var(--color-danger);
}
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

/* ── Skeleton ────────────────────────────────────────────────────────── */
.sk-stack {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.sk-tab-nav {
  gap: 8px;
}
.sk-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 10px 24px rgba(14, 18, 32, 0.04);
}
.sk-card-body {
  padding: 16px 18px;
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}
.sk-grid {
  padding: 16px 18px 18px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 14px;
}
.sk-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.sk-lines {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 180px;
  flex: 1;
}

.skeleton {
  position: relative;
  overflow: hidden;
  background: linear-gradient(
    90deg,
    rgba(22, 163, 74, 0.1) 0%,
    rgba(22, 163, 74, 0.22) 50%,
    rgba(22, 163, 74, 0.1) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.25s infinite linear;
  border-radius: 10px;
}
.skeleton-title {
  width: 220px;
  height: 28px;
}
.skeleton-subtitle {
  width: 320px;
  height: 14px;
}
.skeleton-pill {
  width: 160px;
  height: 28px;
  border-radius: 999px;
}
.skeleton-tab {
  width: 98px;
  height: 30px;
  border-radius: 10px;
}
.skeleton-card-head {
  width: 100%;
  height: 56px;
  border-radius: 0;
}
.skeleton-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  flex-shrink: 0;
}
.skeleton-line {
  height: 14px;
  border-radius: 8px;
}
.skeleton-button {
  height: 36px;
  border-radius: 8px;
}
.skeleton-label {
  width: 110px;
  height: 12px;
}
.skeleton-input {
  width: 100%;
  height: 38px;
  border-radius: 8px;
}
.w-28 {
  width: 112px;
}
.w-40 {
  width: 40%;
}
.w-60 {
  width: 60%;
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
