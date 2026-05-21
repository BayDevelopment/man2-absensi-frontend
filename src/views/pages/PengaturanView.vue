<script setup>
import { ref } from "vue";
import { useAuthStore } from "../../stores/auth";
import Sidebar from "../../components/AppSidebar.vue";
import Navbar from "../../components/AppNavbar.vue";
import AppFooter from "../../components/AppFooter.vue";

const authStore = useAuthStore();
const sidebarOpen = ref(false);
const activeTab = ref("akun");
const showSuccessToast = ref(false);

const today = new Date().toLocaleDateString("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

// ── Data akun ──────────────────────────────────────────────────────────────
const akunData = ref({
  nama: authStore.user?.name ?? "Ahmad Rafi Pratama",
  nis: "2024001",
  email: "ahmadrafi@student.sch.id",
  noTelp: "0812-3456-7890",
  alamat: "Jl. Mawar No. 10, Tangerang Selatan",
  agama: "Islam",
});

// ── Password ───────────────────────────────────────────────────────────────
const pwLama = ref("");
const pwBaru = ref("");
const pwKonfirmasi = ref("");
const showPwLama = ref(false);
const showPwBaru = ref(false);
const showPwKonfirmasi = ref(false);

// ── Notifikasi ─────────────────────────────────────────────────────────────
const notifApp = ref({
  kehadiran: true,
  pengumuman: true,
  jadwal: false,
  nilai: true,
});

// ── Privasi ────────────────────────────────────────────────────────────────
const keamanan = ref({
  twoFactor: false,
  notifLogin: true,
  logoutOtomatis: false,
});

// ── Tampilan ───────────────────────────────────────────────────────────────
const tampilanData = ref({
  tema: "Terang (Light)",
  bahasa: "Bahasa Indonesia",
  ukuranTeks: "Normal",
});

// ── Sesi aktif ─────────────────────────────────────────────────────────────
const sessions = ref([
  {
    id: 1,
    icon: "laptop",
    device: "Chrome · Windows 11",
    loc: "Tangerang · Aktif sekarang",
    current: true,
  },
  {
    id: 2,
    icon: "mobile",
    device: "Safari · iPhone 14",
    loc: "Tangerang · 2 jam lalu",
    current: false,
  },
  { id: 3, icon: "tablet", device: "Chrome · iPad", loc: "Jakarta · 1 hari lalu", current: false },
]);

function removeSession(id) {
  sessions.value = sessions.value.filter((s) => s.id !== id);
}
function removeAllSessions() {
  sessions.value = sessions.value.filter((s) => s.current);
}

const tabs = [
  { key: "akun", label: "Akun", icon: "user-circle" },
  { key: "notifikasi", label: "Notifikasi", icon: "bell" },
  { key: "privasi", label: "Privasi & Keamanan", icon: "shield-check" },
  { key: "tampilan", label: "Tampilan", icon: "palette" },
];

function saveSettings() {
  showSuccessToast.value = true;
  setTimeout(() => (showSuccessToast.value = false), 3000);
}

const initials = "AR";
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
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              class="tab-icon"
            >
              <template v-if="tab.key === 'akun'">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </template>
              <template v-else-if="tab.key === 'notifikasi'">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
                />
              </template>
              <template v-else-if="tab.key === 'privasi'">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                />
              </template>
              <template v-else>
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z"
                />
              </template>
            </svg>
            {{ tab.label }}
          </button>
        </div>

        <!-- ═══ TAB: AKUN ═══════════════════════════════════════════════════ -->
        <template v-if="activeTab === 'akun'">
          <!-- Foto & Identitas -->
          <div class="info-card full-width">
            <div class="card-head">
              <div>
                <h3 class="card-title">Foto & Identitas</h3>
                <p class="card-desc">Ubah foto profil dan informasi dasar</p>
              </div>
            </div>
            <div class="avatar-section">
              <div class="avatar-lg">{{ initials }}</div>
              <div class="avatar-btns">
                <button class="btn btn-ghost btn-sm">
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
                      d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                    />
                  </svg>
                  Upload Foto
                </button>
                <button class="btn btn-danger btn-sm">
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
                      d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                    />
                  </svg>
                  Hapus Foto
                </button>
                <span class="avatar-hint">JPG/PNG, maks. 2MB</span>
              </div>
            </div>
            <div class="field-grid">
              <div class="field-group">
                <label class="field-label">Nama Lengkap</label>
                <input v-model="akunData.nama" class="field-input" />
              </div>
              <div class="field-group">
                <label class="field-label">NIS (tidak dapat diubah)</label>
                <input v-model="akunData.nis" class="field-input" disabled style="opacity: 0.5" />
              </div>
              <div class="field-group">
                <label class="field-label">Email</label>
                <input v-model="akunData.email" class="field-input" />
              </div>
              <div class="field-group">
                <label class="field-label">No. Telepon</label>
                <input v-model="akunData.noTelp" class="field-input" />
              </div>
              <div class="field-group">
                <label class="field-label">Alamat</label>
                <input v-model="akunData.alamat" class="field-input" />
              </div>
              <div class="field-group">
                <label class="field-label">Agama</label>
                <input v-model="akunData.agama" class="field-input" />
              </div>
            </div>
            <div class="action-row">
              <button class="btn btn-ghost">Batal</button>
              <button class="btn btn-primary" @click="saveSettings">
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
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                  />
                </svg>
                Simpan Perubahan
              </button>
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
                    />
                    <button class="pw-eye" @click="showPwLama = !showPwLama">
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
                    <button class="pw-eye" @click="showPwBaru = !showPwBaru">
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
                    <button class="pw-eye" @click="showPwKonfirmasi = !showPwKonfirmasi">
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
                <button class="btn btn-primary" @click="saveSettings">Perbarui Kata Sandi</button>
              </div>
            </div>

            <!-- Sesi Aktif -->
            <div class="info-card">
              <div class="card-head">
                <div>
                  <h3 class="card-title">Sesi Aktif</h3>
                  <p class="card-desc">Perangkat yang sedang login</p>
                </div>
              </div>
              <div class="session-list">
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
                          v-if="s.icon === 'laptop'"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25z"
                        />
                        <path
                          v-else-if="s.icon === 'mobile'"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18h3"
                        />
                        <path
                          v-else
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M10.5 19.5h3m-6.75 2.25h10.5a2.25 2.25 0 002.25-2.25v-15a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 4.5v15a2.25 2.25 0 002.25 2.25z"
                        />
                      </svg>
                    </div>
                    <div class="session-info">
                      <div class="si-name">
                        {{ s.device }}
                        <span v-if="s.current" class="badge badge-green">Perangkat ini</span>
                      </div>
                      <div class="si-sub">{{ s.loc }}</div>
                    </div>
                  </div>
                  <button
                    v-if="!s.current"
                    class="btn btn-danger btn-sm"
                    @click="removeSession(s.id)"
                  >
                    Keluarkan
                  </button>
                </div>
              </div>
              <div class="action-row">
                <button class="btn btn-danger btn-sm" @click="removeAllSessions">
                  Keluarkan Semua Sesi Lain
                </button>
              </div>
            </div>
          </div>
        </template>

        <!-- ═══ TAB: NOTIFIKASI ════════════════════════════════════════════ -->
        <template v-else-if="activeTab === 'notifikasi'">
          <div class="body-grid">
            <div class="info-card full-width">
              <div class="card-head">
                <div>
                  <h3 class="card-title">Notifikasi Aplikasi</h3>
                  <p class="card-desc">Atur notifikasi dalam aplikasi</p>
                </div>
              </div>
              <div class="toggle-list">
                <div class="toggle-row">
                  <div class="toggle-info">
                    <div class="tl">Kehadiran & Absensi</div>
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
                    <div class="tl">Jadwal & Kegiatan</div>
                    <div class="ts">Pengingat jadwal pelajaran & ujian</div>
                  </div>
                  <label class="toggle-switch">
                    <input type="checkbox" v-model="notifApp.jadwal" />
                    <span class="slider"></span>
                  </label>
                </div>
              </div>
              <div class="action-row">
                <button class="btn btn-primary btn-sm" @click="saveSettings">Simpan</button>
              </div>
            </div>
          </div>
        </template>

        <!-- ═══ TAB: PRIVASI & KEAMANAN ═══════════════════════════════════ -->
        <template v-else-if="activeTab === 'privasi'">
          <div class="body-grid">
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
                    <div class="ts">OTP via email saat login</div>
                  </div>
                  <label class="toggle-switch">
                    <input type="checkbox" v-model="keamanan.twoFactor" />
                    <span class="slider"></span>
                  </label>
                </div>
                <div class="toggle-row">
                  <div class="toggle-info">
                    <div class="tl">Notifikasi Login Baru</div>
                    <div class="ts">Email saat ada login dari perangkat baru</div>
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
                <button class="btn btn-primary btn-sm" @click="saveSettings">Simpan</button>
              </div>
            </div>
          </div>
        </template>

        <!-- ═══ TAB: TAMPILAN ═════════════════════════════════════════════ -->
        <template v-else-if="activeTab === 'tampilan'">
          <div class="body-grid">
            <div class="info-card full-width">
              <div class="card-head">
                <div>
                  <h3 class="card-title">Tema & Warna</h3>
                  <p class="card-desc">Sesuaikan tampilan aplikasi</p>
                </div>
              </div>
              <div class="field-list">
                <div class="field-group">
                  <label class="field-label">Tema</label>
                  <select v-model="tampilanData.tema" class="field-input field-select">
                    <option>Terang (Light)</option>
                    <option>Gelap (Dark)</option>
                    <option>Otomatis (Ikuti Sistem)</option>
                  </select>
                </div>
                <div class="field-group">
                  <label class="field-label">Bahasa</label>
                  <select v-model="tampilanData.bahasa" class="field-input field-select">
                    <option>Bahasa Indonesia</option>
                    <option>English</option>
                  </select>
                </div>
                <div class="field-group">
                  <label class="field-label">Ukuran Teks</label>
                  <select v-model="tampilanData.ukuranTeks" class="field-input field-select">
                    <option>Normal</option>
                    <option>Kecil</option>
                    <option>Besar</option>
                  </select>
                </div>
              </div>
              <div class="action-row">
                <button class="btn btn-primary btn-sm" @click="saveSettings">Simpan</button>
              </div>
            </div>
          </div>
        </template>
      </main>
      <AppFooter />
    </div>

    <!-- Toast notifikasi -->
    <Transition name="toast">
      <div v-if="showSuccessToast" class="toast">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          style="width: 18px; height: 18px"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        Pengaturan berhasil disimpan!
      </div>
    </Transition>
  </div>
</template>

<style scoped>
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

/* ── Header ─────────────────────────────────────────────────────────────── */
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

/* ── Grid ───────────────────────────────────────────────────────────────── */
.body-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.full-width {
  grid-column: 1 / -1;
}

/* ── Cards ──────────────────────────────────────────────────────────────── */
.info-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  overflow: hidden;
}
.card-head {
  padding: 14px 18px;
  border-bottom: 1px solid #f3f4f6;
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

/* ── Avatar Section ─────────────────────────────────────────────────────── */
.avatar-section {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px 4px;
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
}
.avatar-btns {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.avatar-hint {
  font-size: 10.5px;
  color: #9ca3af;
}

/* ── Field Grid & Groups ─────────────────────────────────────────────────── */
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
}
.field-input:focus {
  border-color: #16a34a;
}
.field-select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  padding-right: 30px;
  cursor: pointer;
}

/* ── Password ───────────────────────────────────────────────────────────── */
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

/* ── Toggle ─────────────────────────────────────────────────────────────── */
.toggle-list {
  padding: 8px 18px;
}
.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
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
}
input:checked + .slider {
  background: #16a34a;
}
input:checked + .slider:before {
  transform: translateX(18px);
}

/* ── Sessions ───────────────────────────────────────────────────────────── */
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
  margin-top: 1px;
}

/* ── Badges ─────────────────────────────────────────────────────────────── */
.badge {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 20px;
}
.badge-green {
  background: #dcfce7;
  color: #166534;
}

/* ── Danger Zone ────────────────────────────────────────────────────────── */
.danger-zone {
  border: 1.5px solid #fee2e2 !important;
}
.danger-title {
  color: #dc2626 !important;
}
.danger-body {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding: 14px 18px;
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
.btn-primary:hover {
  background: #15803d;
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

/* ── Action Row ─────────────────────────────────────────────────────────── */
.action-row {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 18px;
  border-top: 1px solid #f3f4f6;
}

/* ── Toast ──────────────────────────────────────────────────────────────── */
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

/* ── Responsive ─────────────────────────────────────────────────────────── */
@media (max-width: 900px) {
  .body-grid {
    grid-template-columns: 1fr;
  }
  .field-grid {
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
  }
  .hero-body {
    padding: 0 16px 14px;
  }
}
</style>
