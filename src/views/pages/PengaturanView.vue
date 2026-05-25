<script setup>
import { ref, onMounted, computed } from "vue";
import { useAuthStore } from "../../stores/auth";
import Sidebar from "../../components/AppSidebar.vue";
import Navbar from "../../components/AppNavbar.vue";
import AppFooter from "../../components/AppFooter.vue";
import api from "../../plugins/axios";

const authStore = useAuthStore();
const sidebarOpen = ref(false);
const activeTab = ref("akun");
const showSuccessToast = ref(false);
const toastMsg = ref("Pengaturan berhasil disimpan!");
const loading = ref(true);

const savingPassword = ref(false);
const savingNotif = ref(false);
const savingKeamanan = ref(false);
const savingTampilan = ref(false);

const today = new Date().toLocaleDateString("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

// ── State ──────────────────────────────────────────────────────────────────
const akunData = ref({
  nama: "",
  nis: "",
  nisn: "",
  email: "",
  jenisKelamin: "",
  noTelp: "",
  foto: null,
});

const pwLama = ref("");
const pwBaru = ref("");
const pwKonfirmasi = ref("");
const showPwLama = ref(false);
const showPwBaru = ref(false);
const showPwKonfirmasi = ref(false);

const notifApp = ref({ kehadiran: false, pengumuman: false, jadwal: false });
const keamanan = ref({ twoFactor: false, notifLogin: false, logoutOtomatis: false });

const temaOptions = [
  { val: "light", label: "Terang (Light)" },
  { val: "dark", label: "Gelap (Dark)" },
  { val: "system", label: "Otomatis (Ikuti Sistem)" },
];
const bahasaOptions = [
  { val: "id", label: "Bahasa Indonesia" },
  { val: "en", label: "English" },
];
const teksOptions = [
  { val: "small", label: "Kecil" },
  { val: "normal", label: "Normal" },
  { val: "large", label: "Besar" },
];

const tampilanData = ref({ tema: "light", bahasa: "id", ukuranTeks: "normal" });
const sessions = ref([]);

// ── Fetch ──────────────────────────────────────────────────────────────────
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

    tampilanData.value = {
      tema: d.tampilan?.tema ?? "light",
      bahasa: d.tampilan?.bahasa ?? "id",
      ukuranTeks: d.tampilan?.ukuran_teks ?? "normal",
    };

    sessions.value = d.sesi ?? [];
  } catch (e) {
    console.error("fetchSettings error:", e);
    showToast("Gagal memuat pengaturan.", "error");
  } finally {
    loading.value = false;
  }
}

onMounted(fetchSettings);

// ── Toast ──────────────────────────────────────────────────────────────────
const toastType = ref("success");
function showToast(msg = "Berhasil disimpan!", type = "success") {
  toastMsg.value = msg;
  toastType.value = type;
  showSuccessToast.value = true;
  setTimeout(() => (showSuccessToast.value = false), 3000);
}

function showError(err) {
  const msg = err.response?.data?.message ?? "Gagal menyimpan. Coba lagi.";
  showToast(msg, "error");
}

// ── Save Handlers ──────────────────────────────────────────────────────────
async function saveNotifikasi() {
  if (savingNotif.value) return;
  savingNotif.value = true;
  try {
    await api.put("/api/settings/notifikasi", {
      kehadiran: notifApp.value.kehadiran,
      pengumuman: notifApp.value.pengumuman,
      jadwal: notifApp.value.jadwal,
    });
    showToast("Notifikasi berhasil disimpan!");
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
    showToast("Pengaturan keamanan disimpan!");
  } catch (e) {
    showError(e);
  } finally {
    savingKeamanan.value = false;
  }
}

async function saveTampilan() {
  if (savingTampilan.value) return;
  savingTampilan.value = true;
  try {
    await api.put("/api/settings/tampilan", {
      tema: tampilanData.value.tema,
      bahasa: tampilanData.value.bahasa,
      ukuran_teks: tampilanData.value.ukuranTeks,
    });
    showToast("Tampilan berhasil disimpan!");
  } catch (e) {
    showError(e);
  } finally {
    savingTampilan.value = false;
  }
}

async function savePassword() {
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
    showToast("Kata sandi berhasil diperbarui!");
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
    showToast("Sesi berhasil dikeluarkan!");
  } catch (e) {
    showError(e);
  }
}

async function removeAllSessions() {
  try {
    await api.delete("/api/settings/sesi");
    sessions.value = sessions.value.filter((s) => s.is_current);
    showToast("Semua sesi lain telah dikeluarkan!");
  } catch (e) {
    showError(e);
  }
}

const tabs = [
  { key: "akun", label: "Akun" },
  { key: "notifikasi", label: "Notifikasi" },
  { key: "privasi", label: "Privasi & Keamanan" },
  { key: "tampilan", label: "Tampilan" },
];

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

// label jenis kelamin
const jenisKelaminLabel = computed(() => {
  const v = akunData.value.jenisKelamin?.toLowerCase();
  if (v === "l" || v === "laki-laki") return "Laki-laki";
  if (v === "p" || v === "perempuan") return "Perempuan";
  return akunData.value.jenisKelamin || "-";
});
</script>

<template>
  <div class="layout-root">
    <Sidebar :open="sidebarOpen" @close="sidebarOpen = false" />
    <div class="layout-main">
      <Navbar @toggle-sidebar="sidebarOpen = !sidebarOpen" />
      <main class="layout-content">
        <!-- Header -->
        <div class="dash-header">
          <div>
            <h1 class="dash-title">Pengaturan</h1>
            <p class="dash-sub">Kelola preferensi dan keamanan akun</p>
          </div>
          <span class="dash-date">{{ today }}</span>
        </div>

        <!-- Tab Nav -->
        <div class="tab-nav">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            class="tab-btn"
            :class="{ active: activeTab === tab.key }"
            @click="activeTab = tab.key"
          >
            <!-- Icon Akun -->
            <svg
              v-if="tab.key === 'akun'"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              class="tab-icon"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <!-- Icon Notifikasi -->
            <svg
              v-else-if="tab.key === 'notifikasi'"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              class="tab-icon"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
              />
            </svg>
            <!-- Icon Privasi -->
            <svg
              v-else-if="tab.key === 'privasi'"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              class="tab-icon"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
              />
            </svg>
            <!-- Icon Tampilan -->
            <svg
              v-else
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              class="tab-icon"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z"
              />
            </svg>
            {{ tab.label }}
          </button>
        </div>

        <!-- ══════════════════════════════════════════════════════════════ -->
        <!-- SKELETON — tampil saat loading                                -->
        <!-- ══════════════════════════════════════════════════════════════ -->
        <template v-if="loading">
          <div class="info-card full-width skeleton-card">
            <div class="sk-head">
              <div class="sk-line sk-title"></div>
              <div class="sk-line sk-sub"></div>
            </div>
            <div class="sk-avatar-row">
              <div class="sk-circle"></div>
              <div class="sk-lines">
                <div class="sk-line sk-btn-w"></div>
                <div class="sk-line sk-btn-w" style="width: 90px"></div>
              </div>
            </div>
            <div class="sk-grid">
              <div v-for="i in 6" :key="i" class="sk-field">
                <div class="sk-line sk-label"></div>
                <div class="sk-line sk-input"></div>
              </div>
            </div>
          </div>

          <div class="body-grid">
            <div class="info-card sk-pw-card">
              <div class="sk-head">
                <div class="sk-line sk-title"></div>
                <div class="sk-line sk-sub"></div>
              </div>
              <div class="sk-pw-rows">
                <div v-for="i in 3" :key="i" class="sk-field" style="padding: 0 18px 14px">
                  <div class="sk-line sk-label"></div>
                  <div class="sk-line sk-input"></div>
                </div>
              </div>
            </div>
            <div class="info-card sk-sesi-card">
              <div class="sk-head">
                <div class="sk-line sk-title"></div>
                <div class="sk-line sk-sub"></div>
              </div>
              <div v-for="i in 2" :key="i" class="sk-sesi-row">
                <div class="sk-circle-sm"></div>
                <div class="sk-lines" style="flex: 1">
                  <div class="sk-line" style="width: 60%; height: 12px; border-radius: 6px"></div>
                  <div
                    class="sk-line"
                    style="width: 40%; height: 10px; border-radius: 6px; margin-top: 6px"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- ══════════════════════════════════════════════════════════════ -->
        <!-- TAB: AKUN                                                     -->
        <!-- ══════════════════════════════════════════════════════════════ -->
        <template v-else-if="activeTab === 'akun'">
          <!-- Biodata -->
          <div class="info-card full-width">
            <div class="card-head">
              <div>
                <h3 class="card-title">Foto &amp; Identitas</h3>
                <p class="card-desc">Informasi dasar akun kamu</p>
              </div>
              <span class="badge badge-info">Hanya bisa diedit di halaman Profil</span>
            </div>
            <div class="avatar-section">
              <div class="avatar-lg">
                <img
                  v-if="akunData.foto"
                  :src="akunData.foto"
                  alt="Foto Profil"
                  style="width: 100%; height: 100%; object-fit: cover; border-radius: 11px"
                />
                <span v-else>{{ initials }}</span>
              </div>
              <div class="avatar-info">
                <p class="avatar-name">{{ akunData.nama || "—" }}</p>
                <p class="avatar-nis">NIS {{ akunData.nis || "—" }}</p>
                <a
                  href="/profil"
                  class="btn btn-ghost btn-sm"
                  style="margin-top: 6px; text-decoration: none"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    class="btn-icon"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125"
                    />
                  </svg>
                  Edit Profil
                </a>
              </div>
            </div>
            <div class="field-grid">
              <div class="field-group">
                <label class="field-label">Nama Lengkap</label>
                <input :value="akunData.nama" class="field-input field-readonly" readonly />
              </div>
              <div class="field-group">
                <label class="field-label">NIS</label>
                <input :value="akunData.nis" class="field-input field-readonly" readonly />
              </div>
              <div class="field-group">
                <label class="field-label">NISN</label>
                <input :value="akunData.nisn" class="field-input field-readonly" readonly />
              </div>
              <div class="field-group">
                <label class="field-label">Email</label>
                <input :value="akunData.email" class="field-input field-readonly" readonly />
              </div>
              <div class="field-group">
                <label class="field-label">No. HP</label>
                <input :value="akunData.noTelp" class="field-input field-readonly" readonly />
              </div>
              <div class="field-group">
                <label class="field-label">Jenis Kelamin</label>
                <input :value="jenisKelaminLabel" class="field-input field-readonly" readonly />
              </div>
            </div>
          </div>

          <div class="body-grid">
            <!-- Ubah Kata Sandi -->
            <div class="info-card">
              <div class="card-head">
                <div>
                  <h3 class="card-title">Ubah Kata Sandi</h3>
                  <p class="card-desc">Perbarui password akun kamu</p>
                </div>
              </div>
              <div class="field-list">
                <div class="pw-row">
                  <label class="field-label">Kata Sandi Lama</label>
                  <div class="pw-wrap">
                    <input
                      v-model="pwLama"
                      :type="showPwLama ? 'text' : 'password'"
                      class="field-input"
                      placeholder="Masukkan kata sandi lama"
                    />
                    <button class="pw-eye" @click="showPwLama = !showPwLama" type="button">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        style="width: 16px; height: 16px"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          :d="
                            showPwLama
                              ? 'M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88'
                              : 'M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z'
                          "
                        />
                      </svg>
                    </button>
                  </div>
                </div>
                <div class="pw-row">
                  <label class="field-label">Kata Sandi Baru</label>
                  <div class="pw-wrap">
                    <input
                      v-model="pwBaru"
                      :type="showPwBaru ? 'text' : 'password'"
                      class="field-input"
                      placeholder="Min. 8 karakter"
                    />
                    <button class="pw-eye" @click="showPwBaru = !showPwBaru" type="button">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        style="width: 16px; height: 16px"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
                <div class="pw-row">
                  <label class="field-label">Konfirmasi Kata Sandi Baru</label>
                  <div class="pw-wrap">
                    <input
                      v-model="pwKonfirmasi"
                      :type="showPwKonfirmasi ? 'text' : 'password'"
                      class="field-input"
                      placeholder="Ulangi kata sandi baru"
                    />
                    <button
                      class="pw-eye"
                      @click="showPwKonfirmasi = !showPwKonfirmasi"
                      type="button"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        style="width: 16px; height: 16px"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              <div class="action-row">
                <button class="btn btn-primary" :disabled="savingPassword" @click="savePassword">
                  <svg
                    v-if="savingPassword"
                    class="spin"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    style="width: 14px; height: 14px"
                  >
                    <path stroke-linecap="round" d="M12 2a10 10 0 0 1 10 10" />
                  </svg>
                  <svg
                    v-else
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    class="btn-icon"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                    />
                  </svg>
                  {{ savingPassword ? "Memperbarui…" : "Perbarui Kata Sandi" }}
                </button>
              </div>
            </div>

            <!-- Sesi Aktif -->
            <div class="info-card">
              <div class="card-head">
                <div>
                  <h3 class="card-title">Sesi Aktif</h3>
                  <p class="card-desc">Perangkat yang sedang login</p>
                </div>
                <span class="badge badge-green">{{ sessions.length }} Sesi</span>
              </div>
              <div class="session-list">
                <div v-if="sessions.length === 0" class="empty-state">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                    style="width: 32px; height: 32px; color: #d1d5db"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25z"
                    />
                  </svg>
                  <p>Tidak ada sesi aktif</p>
                </div>
                <div v-for="s in sessions" :key="s.id" class="session-row">
                  <div class="session-left">
                    <div class="session-icon">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        style="width: 18px; height: 18px"
                      >
                        <path
                          v-if="
                            (s.os && s.os.toLowerCase().includes('android')) ||
                            (s.device && s.device.toLowerCase().includes('mobile'))
                          "
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18h3"
                        />
                        <path
                          v-else
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25z"
                        />
                      </svg>
                    </div>
                    <div class="session-info">
                      <div class="si-name">
                        {{ s.browser ?? "Browser" }} · {{ s.os ?? "OS" }}
                        <span v-if="s.is_current" class="badge badge-green">Perangkat ini</span>
                      </div>
                      <div class="si-sub">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          style="width: 11px; height: 11px; display: inline"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                          />
                        </svg>
                        {{ s.location ?? "-" }} · {{ s.last_active }}
                      </div>
                    </div>
                  </div>
                  <button
                    v-if="!s.is_current"
                    class="btn btn-danger btn-sm"
                    @click="removeSession(s.id)"
                  >
                    Keluarkan
                  </button>
                </div>
              </div>
              <div class="action-row" v-if="sessions.filter((s) => !s.is_current).length > 0">
                <button class="btn btn-danger btn-sm" @click="removeAllSessions">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    class="btn-icon"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
                    />
                  </svg>
                  Keluarkan Semua Sesi Lain
                </button>
              </div>
            </div>
          </div>
        </template>

        <!-- ══════════════════════════════════════════════════════════════ -->
        <!-- TAB: NOTIFIKASI                                               -->
        <!-- ══════════════════════════════════════════════════════════════ -->
        <template v-else-if="activeTab === 'notifikasi'">
          <div class="info-card full-width">
            <div class="card-head">
              <div>
                <h3 class="card-title">Notifikasi Aplikasi</h3>
                <p class="card-desc">Atur notifikasi yang kamu terima</p>
              </div>
            </div>
            <div class="toggle-list">
              <div class="toggle-row">
                <div class="toggle-info">
                  <div class="tl">Kehadiran &amp; Absensi</div>
                  <div class="ts">Notifikasi status kehadiran harian</div>
                </div>
                <label class="toggle-switch">
                  <input type="checkbox" v-model="notifApp.kehadiran" />
                  <span class="slider"></span>
                </label>
              </div>
              <div class="toggle-row">
                <div class="toggle-info">
                  <div class="tl">Pengumuman Sekolah</div>
                  <div class="ts">Info penting dari pihak sekolah</div>
                </div>
                <label class="toggle-switch">
                  <input type="checkbox" v-model="notifApp.pengumuman" />
                  <span class="slider"></span>
                </label>
              </div>
              <div class="toggle-row">
                <div class="toggle-info">
                  <div class="tl">Jadwal &amp; Kegiatan</div>
                  <div class="ts">Pengingat jadwal pelajaran &amp; ujian</div>
                </div>
                <label class="toggle-switch">
                  <input type="checkbox" v-model="notifApp.jadwal" />
                  <span class="slider"></span>
                </label>
              </div>
            </div>
            <div class="action-row">
              <button
                class="btn btn-primary btn-sm"
                :disabled="savingNotif"
                @click="saveNotifikasi"
              >
                <svg
                  v-if="savingNotif"
                  class="spin"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  style="width: 14px; height: 14px"
                >
                  <path stroke-linecap="round" d="M12 2a10 10 0 0 1 10 10" />
                </svg>
                <svg
                  v-else
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  class="btn-icon"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                {{ savingNotif ? "Menyimpan…" : "Simpan Notifikasi" }}
              </button>
            </div>
          </div>
        </template>

        <!-- ══════════════════════════════════════════════════════════════ -->
        <!-- TAB: PRIVASI & KEAMANAN                                       -->
        <!-- ══════════════════════════════════════════════════════════════ -->
        <template v-else-if="activeTab === 'privasi'">
          <div class="info-card full-width">
            <div class="card-head">
              <div>
                <h3 class="card-title">Keamanan Login</h3>
                <p class="card-desc">Tingkatkan keamanan akunmu</p>
              </div>
            </div>
            <div class="toggle-list">
              <div class="toggle-row">
                <div class="toggle-info">
                  <div class="tl">Verifikasi 2 Langkah</div>
                  <div class="ts">OTP via email setiap kali login</div>
                </div>
                <label class="toggle-switch">
                  <input type="checkbox" v-model="keamanan.twoFactor" />
                  <span class="slider"></span>
                </label>
              </div>
              <div class="toggle-row">
                <div class="toggle-info">
                  <div class="tl">Notifikasi Login Baru</div>
                  <div class="ts">Kirim email saat ada login dari perangkat baru</div>
                </div>
                <label class="toggle-switch">
                  <input type="checkbox" v-model="keamanan.notifLogin" />
                  <span class="slider"></span>
                </label>
              </div>
              <div class="toggle-row">
                <div class="toggle-info">
                  <div class="tl">Logout Otomatis</div>
                  <div class="ts">Keluar otomatis setelah 30 menit tidak aktif</div>
                </div>
                <label class="toggle-switch">
                  <input type="checkbox" v-model="keamanan.logoutOtomatis" />
                  <span class="slider"></span>
                </label>
              </div>
            </div>
            <div class="action-row">
              <button
                class="btn btn-primary btn-sm"
                :disabled="savingKeamanan"
                @click="saveKeamanan"
              >
                <svg
                  v-if="savingKeamanan"
                  class="spin"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  style="width: 14px; height: 14px"
                >
                  <path stroke-linecap="round" d="M12 2a10 10 0 0 1 10 10" />
                </svg>
                <svg
                  v-else
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  class="btn-icon"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                {{ savingKeamanan ? "Menyimpan…" : "Simpan Keamanan" }}
              </button>
            </div>
          </div>
        </template>

        <!-- ══════════════════════════════════════════════════════════════ -->
        <!-- TAB: TAMPILAN                                                 -->
        <!-- ══════════════════════════════════════════════════════════════ -->
        <template v-else-if="activeTab === 'tampilan'">
          <div class="info-card full-width">
            <div class="card-head">
              <div>
                <h3 class="card-title">Tema &amp; Tampilan</h3>
                <p class="card-desc">Sesuaikan tampilan aplikasi</p>
              </div>
            </div>
            <div class="field-list">
              <div class="field-group">
                <label class="field-label">Tema Aplikasi</label>
                <select v-model="tampilanData.tema" class="field-input field-select">
                  <option v-for="o in temaOptions" :key="o.val" :value="o.val">
                    {{ o.label }}
                  </option>
                </select>
              </div>
              <div class="field-group">
                <label class="field-label">Bahasa</label>
                <select v-model="tampilanData.bahasa" class="field-input field-select">
                  <option v-for="o in bahasaOptions" :key="o.val" :value="o.val">
                    {{ o.label }}
                  </option>
                </select>
              </div>
              <div class="field-group">
                <label class="field-label">Ukuran Teks</label>
                <select v-model="tampilanData.ukuranTeks" class="field-input field-select">
                  <option v-for="o in teksOptions" :key="o.val" :value="o.val">
                    {{ o.label }}
                  </option>
                </select>
              </div>
            </div>
            <div class="action-row">
              <button
                class="btn btn-primary btn-sm"
                :disabled="savingTampilan"
                @click="saveTampilan"
              >
                <svg
                  v-if="savingTampilan"
                  class="spin"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  style="width: 14px; height: 14px"
                >
                  <path stroke-linecap="round" d="M12 2a10 10 0 0 1 10 10" />
                </svg>
                <svg
                  v-else
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  class="btn-icon"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                {{ savingTampilan ? "Menyimpan…" : "Simpan Tampilan" }}
              </button>
            </div>
          </div>
        </template>
      </main>
      <AppFooter />
    </div>

    <!-- Toast -->
    <Transition name="toast">
      <div
        v-if="showSuccessToast"
        class="toast"
        :class="toastType === 'error' ? 'toast-error' : ''"
      >
        <svg
          v-if="toastType === 'success'"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          style="width: 18px; height: 18px; flex-shrink: 0"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <svg
          v-else
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          style="width: 18px; height: 18px; flex-shrink: 0"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
          />
        </svg>
        {{ toastMsg }}
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* ── Base ────────────────────────────────────────────────────────────────── */
.layout-root {
  display: flex;
  min-height: 100vh;
  background: #f0fdf4;
  font-family: "Poppins", sans-serif;
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

/* ── Header ──────────────────────────────────────────────────────────────── */
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
  color: #166534;
  margin: 0;
}
.dash-sub {
  font-size: 13px;
  color: #6b7280;
  margin: 2px 0 0;
}
.dash-date {
  font-size: 12px;
  font-weight: 600;
  color: #16a34a;
  background: #dcfce7;
  padding: 5px 12px;
  border-radius: 20px;
  white-space: nowrap;
}

/* ── Tab Nav ─────────────────────────────────────────────────────────────── */
.tab-nav {
  display: flex;
  gap: 4px;
  background: white;
  border: 1px solid #e5e7eb;
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
  font-family: "Poppins", sans-serif;
  transition: all 0.15s;
  background: transparent;
  color: #6b7280;
}
.tab-icon {
  width: 15px;
  height: 15px;
}
.tab-btn.active {
  background: #16a34a;
  color: white;
}
.tab-btn:not(.active):hover {
  background: #f0fdf4;
  color: #166534;
}

/* ── Grid ────────────────────────────────────────────────────────────────── */
.body-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.full-width {
  grid-column: 1/-1;
}

/* ── Cards ───────────────────────────────────────────────────────────────── */
.info-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  overflow: hidden;
}
.card-head {
  padding: 14px 18px;
  border-bottom: 1px solid #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.card-title {
  font-size: 13px;
  font-weight: 700;
  color: #111827;
  margin: 0;
}
.card-desc {
  font-size: 11px;
  color: #9ca3af;
  margin-top: 2px;
}

/* ── Avatar ──────────────────────────────────────────────────────────────── */
.avatar-section {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 18px 8px;
}
.avatar-lg {
  width: 64px;
  height: 64px;
  border-radius: 14px;
  background: #16a34a;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 800;
  color: white;
  border: 3px solid #dcfce7;
  flex-shrink: 0;
  overflow: hidden;
}
.avatar-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.avatar-name {
  font-size: 14px;
  font-weight: 700;
  color: #111827;
  margin: 0;
}
.avatar-nis {
  font-size: 11.5px;
  color: #6b7280;
  margin: 0;
}

/* ── Fields ──────────────────────────────────────────────────────────────── */
.field-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  padding: 12px 18px;
}
.field-list {
  padding: 12px 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.field-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.field-label {
  font-size: 11.5px;
  color: #6b7280;
  font-weight: 600;
}
.field-input {
  padding: 8px 11px;
  border: 1.5px solid #e5e7eb;
  border-radius: 8px;
  font-size: 12.5px;
  font-family: "Poppins", sans-serif;
  color: #111827;
  outline: none;
  width: 100%;
  transition: border-color 0.15s;
  box-sizing: border-box;
}
.field-input:focus {
  border-color: #16a34a;
}
.field-readonly {
  background: #f9fafb;
  color: #6b7280;
  cursor: default;
}
.field-select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  padding-right: 30px;
  cursor: pointer;
}

/* ── Password ────────────────────────────────────────────────────────────── */
.pw-row {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.pw-wrap {
  position: relative;
}
.pw-wrap .field-input {
  padding-right: 36px;
}
.pw-eye {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: #9ca3af;
  padding: 0;
  display: flex;
  align-items: center;
}
.pw-eye:hover {
  color: #16a34a;
}

/* ── Toggle ──────────────────────────────────────────────────────────────── */
.toggle-list {
  padding: 8px 18px;
}
.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #f9fafb;
  gap: 12px;
}
.toggle-row:last-child {
  border-bottom: none;
}
.toggle-info .tl {
  font-size: 12.5px;
  font-weight: 600;
  color: #111827;
}
.toggle-info .ts {
  font-size: 11px;
  color: #9ca3af;
  margin-top: 2px;
}
.toggle-switch {
  position: relative;
  width: 40px;
  height: 22px;
  flex-shrink: 0;
  cursor: pointer;
}
.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}
.slider {
  position: absolute;
  inset: 0;
  background: #e5e7eb;
  border-radius: 22px;
  cursor: pointer;
  transition: 0.2s;
}
.slider:before {
  content: "";
  position: absolute;
  width: 16px;
  height: 16px;
  left: 3px;
  bottom: 3px;
  background: white;
  border-radius: 50%;
  transition: 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
}
input:checked + .slider {
  background: #16a34a;
}
input:checked + .slider:before {
  transform: translateX(18px);
}

/* ── Sessions ────────────────────────────────────────────────────────────── */
.session-list {
  padding: 8px 18px;
}
.session-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #f9fafb;
}
.session-row:last-child {
  border-bottom: none;
}
.session-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.session-icon {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: #f0fdf4;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #16a34a;
  flex-shrink: 0;
}
.session-info .si-name {
  font-size: 12.5px;
  font-weight: 600;
  color: #111827;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.session-info .si-sub {
  font-size: 11px;
  color: #9ca3af;
  margin-top: 2px;
  display: flex;
  align-items: center;
  gap: 4px;
}
.empty-state {
  padding: 20px 0;
  text-align: center;
  color: #9ca3af;
  font-size: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

/* ── Badges ──────────────────────────────────────────────────────────────── */
.badge {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 20px;
  white-space: nowrap;
}
.badge-green {
  background: #dcfce7;
  color: #166534;
}
.badge-info {
  background: #eff6ff;
  color: #1d4ed8;
}

/* ── Buttons ─────────────────────────────────────────────────────────────── */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 10px;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  font-family: "Poppins", sans-serif;
  transition: all 0.15s;
}
.btn-icon {
  width: 14px;
  height: 14px;
}
.btn-sm {
  padding: 6px 12px;
  font-size: 11.5px;
}
.btn-primary {
  background: #16a34a;
  color: white;
}
.btn-primary:hover:not(:disabled) {
  background: #15803d;
}
.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.btn-ghost {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #e5e7eb;
}
.btn-ghost:hover {
  background: #e5e7eb;
}
.btn-danger {
  background: #fef2f2;
  color: #dc2626;
  border: 1.5px solid #fecaca;
}
.btn-danger:hover {
  background: #fee2e2;
}

/* ── Action Row ──────────────────────────────────────────────────────────── */
.action-row {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 18px;
  border-top: 1px solid #f3f4f6;
}

/* ── Spinner ─────────────────────────────────────────────────────────────── */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.spin {
  animation: spin 0.7s linear infinite;
}

/* ── Toast ───────────────────────────────────────────────────────────────── */
.toast {
  position: fixed;
  bottom: 28px;
  right: 28px;
  background: #16a34a;
  color: white;
  font-size: 13px;
  font-weight: 600;
  padding: 12px 20px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 200;
  box-shadow: 0 8px 24px rgba(22, 163, 74, 0.3);
  font-family: "Poppins", sans-serif;
}
.toast-error {
  background: #dc2626;
  box-shadow: 0 8px 24px rgba(220, 38, 38, 0.3);
}
.toast-enter-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.toast-leave-active {
  transition: all 0.2s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(16px);
}

/* ── Skeleton ────────────────────────────────────────────────────────────── */
@keyframes shimmer {
  0% {
    background-position: -400px 0;
  }
  100% {
    background-position: 400px 0;
  }
}
.sk-line {
  border-radius: 6px;
  height: 12px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 800px 100%;
  animation: shimmer 1.4s infinite;
}
.sk-head {
  padding: 14px 18px;
  border-bottom: 1px solid #f3f4f6;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.sk-title {
  width: 160px;
  height: 13px;
}
.sk-sub {
  width: 220px;
  height: 10px;
}
.sk-btn-w {
  width: 110px;
  height: 30px;
  border-radius: 8px;
}
.sk-label {
  width: 80px;
  height: 10px;
}
.sk-input {
  width: 100%;
  height: 34px;
  border-radius: 8px;
  margin-top: 4px;
}
.sk-avatar-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px 8px;
}
.sk-circle {
  width: 64px;
  height: 64px;
  border-radius: 14px;
  flex-shrink: 0;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 800px 100%;
  animation: shimmer 1.4s infinite;
}
.sk-circle-sm {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  flex-shrink: 0;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 800px 100%;
  animation: shimmer 1.4s infinite;
}
.sk-lines {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.sk-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  padding: 12px 18px;
}
.sk-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.sk-sesi-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 18px;
  border-bottom: 1px solid #f9fafb;
}

/* ── Responsive ──────────────────────────────────────────────────────────── */
@media (max-width: 900px) {
  .body-grid {
    grid-template-columns: 1fr;
  }
  .field-grid {
    grid-template-columns: 1fr;
  }
  .sk-grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 640px) {
  .layout-content {
    padding: 14px;
    gap: 14px;
  }
  .tab-nav {
    width: 100%;
  }
  .tab-btn {
    flex: 1;
    justify-content: center;
    padding: 7px 10px;
    font-size: 11px;
  }
}
</style>
