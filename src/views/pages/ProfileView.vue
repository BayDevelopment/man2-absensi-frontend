<script setup>
import { ref, computed, onMounted } from "vue";
import Sidebar from "../../components/AppSidebar.vue";
import Navbar from "../../components/AppNavbar.vue";
import AppFooter from "../../components/AppFooter.vue";
import api from "../../plugins/axios";

const sidebarOpen = ref(false);
const editMode = ref(false);
const showSuccessToast = ref(false);
const loading = ref(true);
const error = ref(null);
const saving = ref(false);

const angkatanOptions = ref([]);

const today = new Date().toLocaleDateString("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const profile = ref({
  nama: "",
  nis: "",
  kelas: "",
  jurusan: "",
  angkatanId: null,
  angkatan: "",
  ttl: "",
  tempatLahir: "",
  tanggalLahir: "",
  jenisKelamin: "",
  agama: "",
  alamat: "",
  noTelp: "",
  email: "",
  namaAyah: "",
  namaIbu: "",
  noWali: "",
  foto: null,
});

const statsRingkas = ref([
  { label: "Hadir", value: "-", color: "#16a34a", bg: "#f0fdf4" },
  { label: "Izin", value: "-", color: "#d97706", bg: "#fffbeb" },
  { label: "Sakit", value: "-", color: "#2563eb", bg: "#eff6ff" },
  { label: "Alfa", value: "-", color: "#dc2626", bg: "#fef2f2" },
]);

const editData = ref({ ...profile.value });

function normalizeDate(value) {
  if (!value) return "";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  if (typeof value === "string" && value.includes("T")) return value.split("T")[0];
  return "";
}

function cleanText(value) {
  return typeof value === "string" ? value.trim() : (value ?? "");
}

function getFirstValidationError(errors) {
  if (!errors || typeof errors !== "object") return null;
  const firstField = Object.values(errors)[0];
  return Array.isArray(firstField) ? firstField[0] : null;
}

function formatStat(value) {
  if (value === null || value === undefined || value === "") return "-";

  const text = String(value).trim();

  if (text === "") return "-";
  if (text.includes("%")) return text;

  const numeric = Number(text);
  if (!Number.isNaN(numeric)) return `${numeric}%`;

  return text;
}

function setAbsensiStats(absensi = {}) {
  statsRingkas.value = [
    {
      label: "Hadir",
      value: formatStat(absensi.persentase_hadir),
      color: "#16a34a",
      bg: "#f0fdf4",
    },
    {
      label: "Izin",
      value: formatStat(absensi.persentase_izin),
      color: "#d97706",
      bg: "#fffbeb",
    },
    {
      label: "Sakit",
      value: formatStat(absensi.persentase_sakit),
      color: "#2563eb",
      bg: "#eff6ff",
    },
    {
      label: "Alfa",
      value: formatStat(absensi.persentase_alfa),
      color: "#dc2626",
      bg: "#fef2f2",
    },
  ];
}

async function fetchProfile(showLoader = true) {
  if (showLoader) loading.value = true;
  error.value = null;

  try {
    const response = await api.get("/api/profil");

    const profil = response.data?.data?.profil ?? {};
    const absensi = response.data?.data?.absensi ?? {};

    angkatanOptions.value = Array.isArray(response.data?.data?.angkatan_options)
      ? response.data.data.angkatan_options
      : [];

    profile.value = {
      nama: profil.nama ?? "",
      nis: profil.nis ?? "",
      kelas: profil.kelas ?? "-",
      jurusan: profil.jurusan ?? "-",
      angkatanId: profil.angkatan_id ?? null,
      angkatan: profil.angkatan ?? "-",
      ttl: profil.ttl ?? "-",
      tempatLahir: profil.tempat_lahir ?? "",
      tanggalLahir: normalizeDate(profil.tanggal_lahir),
      jenisKelamin: profil.jenis_kelamin ?? "-",
      agama: profil.agama ?? "",
      alamat: profil.alamat ?? "",
      noTelp: profil.no_hp ?? profil.no_telp ?? "",
      email: profil.email ?? "",
      namaAyah: profil.nama_ayah ?? "",
      namaIbu: profil.nama_ibu ?? "",
      noWali: profil.no_wali ?? "",
      foto: profil.foto ?? null,
    };

    editData.value = { ...profile.value };

    setAbsensiStats(absensi);
  } catch (err) {
    console.error("Gagal mengambil profil:", err);

    if (err.response?.status === 401) {
      error.value = "Sesi login sudah habis. Silakan login ulang.";
    } else if (err.response?.status === 404) {
      error.value = "Data siswa tidak ditemukan untuk akun ini.";
    } else {
      error.value = err.response?.data?.message ?? "Gagal memuat profil. Silakan coba lagi.";
    }
  } finally {
    if (showLoader) loading.value = false;
  }
}

onMounted(() => {
  fetchProfile(true);
});

function startEdit() {
  editData.value = { ...profile.value };
  editMode.value = true;
}

function cancelEdit() {
  editData.value = { ...profile.value };
  editMode.value = false;
}

async function saveEdit() {
  if (saving.value) return;

  saving.value = true;

  try {
    const payload = {
      nama: cleanText(editData.value.nama),
      angkatan_id: editData.value.angkatanId || null,
      agama: cleanText(editData.value.agama) || null,
      tempat_lahir: cleanText(editData.value.tempatLahir) || null,
      tanggal_lahir: normalizeDate(editData.value.tanggalLahir) || null,
      alamat: cleanText(editData.value.alamat) || null,
      no_hp: cleanText(editData.value.noTelp) || null,
      email: cleanText(editData.value.email),
      nama_ayah: cleanText(editData.value.namaAyah) || null,
      nama_ibu: cleanText(editData.value.namaIbu) || null,
      no_wali: cleanText(editData.value.noWali) || null,
    };

    await api.put("/api/profil", payload);
    await fetchProfile(false);

    editMode.value = false;
    showSuccessToast.value = true;

    setTimeout(() => {
      showSuccessToast.value = false;
    }, 3000);
  } catch (err) {
    console.error("Gagal menyimpan profil:", err);

    if (err.response?.status === 422) {
      const firstError = getFirstValidationError(err.response.data?.errors);
      alert(firstError ?? "Validasi gagal. Periksa kembali data profil.");
      return;
    }

    if (err.response?.status === 401) {
      alert("Sesi login sudah habis. Silakan login ulang.");
      return;
    }

    if (err.response?.status === 404) {
      alert("Data siswa tidak ditemukan untuk akun ini.");
      return;
    }

    alert(err.response?.data?.message ?? "Gagal menyimpan perubahan.");
  } finally {
    saving.value = false;
  }
}

const initials = computed(() => {
  if (!profile.value.nama) return "??";

  return profile.value.nama
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
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
            <h1 class="dash-title">Profil Saya</h1>
            <p class="dash-sub">Informasi data diri siswa</p>
          </div>
          <span class="dash-date">{{ today }}</span>
        </div>

        <!-- Loading state -->
        <div v-if="loading" class="loading-wrap">
          <div class="spinner"></div>
          <span>Memuat data profil…</span>
        </div>

        <!-- Error state -->
        <div v-else-if="error" class="error-box">
          <span>{{ error }}</span>
          <button class="btn btn-primary" @click="fetchProfile(true)">Coba Lagi</button>
        </div>

        <template v-else>
          <!-- Profile hero card -->
          <div class="hero-card">
            <div class="hero-bg"></div>
            <div class="hero-body">
              <div class="avatar-wrap">
                <img v-if="profile.foto" :src="profile.foto" class="avatar-img" alt="Foto profil" />
                <div v-else class="avatar-circle">{{ initials }}</div>
                <div class="avatar-status"></div>
              </div>
              <div class="hero-info">
                <h2 class="hero-name">{{ profile.nama }}</h2>
                <div class="hero-meta-row">
                  <span class="hero-chip">NIS: {{ profile.nis }}</span>
                  <span class="hero-chip">Angkatan: {{ profile.angkatan }}</span>
                  <span class="hero-chip">{{ profile.kelas }}</span>
                  <span class="hero-chip">{{ profile.jurusan }}</span>
                </div>
              </div>
              <button v-if="!editMode" class="btn btn-primary" @click="startEdit">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125"
                  />
                </svg>
                Edit Profil
              </button>
            </div>

            <!-- Stats absensi dari API -->
            <div class="stats-row">
              <div
                v-for="s in statsRingkas"
                :key="s.label"
                class="stat-pill"
                :style="{ '--c': s.color, '--bg': s.bg }"
              >
                <span class="spv">{{ s.value }}</span>
                <span class="spl">{{ s.label }}</span>
              </div>
            </div>
          </div>

          <!-- Body grid -->
          <div class="body-grid">
            <!-- Data diri -->
            <div class="info-card">
              <div class="card-head"><h3 class="card-title">Data Diri</h3></div>
              <div class="field-list">
                <template v-if="!editMode">
                  <div class="field-row">
                    <span class="fl">Nama Lengkap</span><span class="fv">{{ profile.nama }}</span>
                  </div>
                  <div class="field-row">
                    <span class="fl">NIS</span><span class="fv">{{ profile.nis }}</span>
                  </div>
                  <div class="field-row">
                    <span class="fl">Kelas</span><span class="fv">{{ profile.kelas }}</span>
                  </div>
                  <div class="field-row">
                    <span class="fl">Jurusan</span><span class="fv">{{ profile.jurusan }}</span>
                  </div>
                  <div class="field-row">
                    <span class="fl">Angkatan</span><span class="fv">{{ profile.angkatan }}</span>
                  </div>
                  <div class="field-row">
                    <span class="fl">Tempat, Tgl Lahir</span
                    ><span class="fv">{{ profile.ttl }}</span>
                  </div>
                  <div class="field-row">
                    <span class="fl">Jenis Kelamin</span
                    ><span class="fv">{{ profile.jenisKelamin }}</span>
                  </div>
                  <div class="field-row">
                    <span class="fl">Agama</span><span class="fv">{{ profile.agama }}</span>
                  </div>
                </template>

                <template v-else>
                  <div class="field-row edit">
                    <label class="fl">Nama Lengkap</label>
                    <input v-model="editData.nama" class="field-input" />
                  </div>

                  <div class="field-row edit">
                    <label class="fl">NIS</label>
                    <input
                      v-model="editData.nis"
                      class="field-input"
                      disabled
                      style="opacity: 0.5"
                    />
                  </div>

                  <div class="field-row edit">
                    <label class="fl">Kelas</label>
                    <input
                      v-model="editData.kelas"
                      class="field-input"
                      disabled
                      style="opacity: 0.5"
                    />
                  </div>

                  <div class="field-row edit">
                    <label class="fl">Angkatan</label>
                    <select v-model="editData.angkatanId" class="field-input">
                      <option :value="null">Pilih Angkatan</option>
                      <option v-for="a in angkatanOptions" :key="a.id" :value="a.id">
                        {{ a.nama }}
                      </option>
                    </select>
                  </div>

                  <div class="field-row edit">
                    <label class="fl">Tempat Lahir</label>
                    <input
                      v-model="editData.tempatLahir"
                      class="field-input"
                      placeholder="Contoh: Jakarta"
                    />
                  </div>

                  <div class="field-row edit">
                    <label class="fl">Tanggal Lahir</label>
                    <input v-model="editData.tanggalLahir" type="date" class="field-input" />
                  </div>

                  <div class="field-row edit">
                    <label class="fl">Agama</label>
                    <input v-model="editData.agama" class="field-input" />
                  </div>
                </template>
              </div>
            </div>

            <!-- Kontak & Wali -->
            <div class="right-col">
              <div class="info-card">
                <div class="card-head"><h3 class="card-title">Kontak</h3></div>
                <div class="field-list">
                  <template v-if="!editMode">
                    <div class="field-row">
                      <span class="fl">Alamat</span><span class="fv">{{ profile.alamat }}</span>
                    </div>
                    <div class="field-row">
                      <span class="fl">No. Telepon</span
                      ><span class="fv">{{ profile.noTelp }}</span>
                    </div>
                    <div class="field-row">
                      <span class="fl">Email</span><span class="fv link">{{ profile.email }}</span>
                    </div>
                  </template>
                  <template v-else>
                    <div class="field-row edit">
                      <label class="fl">Alamat</label
                      ><input v-model="editData.alamat" class="field-input" />
                    </div>
                    <div class="field-row edit">
                      <label class="fl">No. Telepon</label
                      ><input v-model="editData.noTelp" class="field-input" />
                    </div>
                    <div class="field-row edit">
                      <label class="fl">Email</label
                      ><input v-model="editData.email" class="field-input" />
                    </div>
                  </template>
                </div>
              </div>

              <div class="info-card">
                <div class="card-head"><h3 class="card-title">Data Orang Tua / Wali</h3></div>
                <div class="field-list">
                  <template v-if="!editMode">
                    <div class="field-row">
                      <span class="fl">Nama Ayah</span
                      ><span class="fv">{{ profile.namaAyah }}</span>
                    </div>
                    <div class="field-row">
                      <span class="fl">Nama Ibu</span><span class="fv">{{ profile.namaIbu }}</span>
                    </div>
                    <div class="field-row">
                      <span class="fl">No. Wali</span><span class="fv">{{ profile.noWali }}</span>
                    </div>
                  </template>
                  <template v-else>
                    <div class="field-row edit">
                      <label class="fl">Nama Ayah</label
                      ><input v-model="editData.namaAyah" class="field-input" />
                    </div>
                    <div class="field-row edit">
                      <label class="fl">Nama Ibu</label
                      ><input v-model="editData.namaIbu" class="field-input" />
                    </div>
                    <div class="field-row edit">
                      <label class="fl">No. Wali</label
                      ><input v-model="editData.noWali" class="field-input" />
                    </div>
                  </template>
                </div>
              </div>

              <div v-if="editMode" class="edit-actions">
                <button class="btn btn-ghost" :disabled="saving" @click="cancelEdit">Batal</button>
                <button class="btn btn-primary" :disabled="saving" @click="saveEdit">
                  <svg
                    v-if="saving"
                    class="btn-spinner"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                  >
                    <path stroke-linecap="round" d="M12 2a10 10 0 0 1 10 10" />
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
                      d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {{ saving ? "Menyimpan…" : "Simpan Perubahan" }}
                </button>
              </div>
            </div>
          </div>
        </template>
      </main>
      <AppFooter />
    </div>

    <!-- Toast -->
    <Transition name="toast">
      <div v-if="showSuccessToast" class="toast">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        Profil berhasil diperbarui!
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.btn-spinner {
  animation: spin 0.7s linear infinite;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
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

/* ── Loading / Error ─────────────────────────────────────────────────────── */
.loading-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: center;
  padding: 60px;
  color: #6b7280;
  font-size: 14px;
}
.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #bbf7d0;
  border-top-color: #16a34a;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.error-box {
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: center;
  padding: 24px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 12px;
  color: #dc2626;
  font-size: 13px;
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

/* ── Hero ────────────────────────────────────────────────────────────────── */
.hero-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  overflow: hidden;
}
.hero-bg {
  height: 80px;
  background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 50%, #86efac 100%);
}
.hero-body {
  display: flex;
  align-items: flex-end;
  gap: 16px;
  padding: 0 24px 16px;
  flex-wrap: wrap;
}
.avatar-wrap {
  position: relative;
  margin-top: -40px;
  flex-shrink: 0;
}
.avatar-circle {
  width: 76px;
  height: 76px;
  border-radius: 18px;
  background: #16a34a;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 800;
  color: white;
  border: 4px solid white;
  box-shadow: 0 4px 12px rgba(22, 163, 74, 0.25);
}
.avatar-img {
  width: 76px;
  height: 76px;
  border-radius: 18px;
  object-fit: cover;
  border: 4px solid white;
  box-shadow: 0 4px 12px rgba(22, 163, 74, 0.25);
}
.avatar-status {
  position: absolute;
  bottom: 4px;
  right: 4px;
  width: 14px;
  height: 14px;
  background: #16a34a;
  border-radius: 50%;
  border: 2px solid white;
}
.hero-info {
  flex: 1;
  padding-bottom: 4px;
}
.hero-name {
  font-size: 18px;
  font-weight: 800;
  color: #111827;
  margin: 0 0 6px;
}
.hero-meta-row {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.hero-chip {
  font-size: 11px;
  font-weight: 600;
  background: #f0fdf4;
  color: #166534;
  padding: 3px 10px;
  border-radius: 20px;
  border: 1px solid #bbf7d0;
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
.btn svg {
  width: 14px;
  height: 14px;
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

/* ── Stats ───────────────────────────────────────────────────────────────── */
.stats-row {
  display: flex;
  border-top: 1px solid #f3f4f6;
}
.stat-pill {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 8px;
  border-right: 1px solid #f3f4f6;
}
.stat-pill:last-child {
  border-right: none;
}
.spv {
  font-size: 18px;
  font-weight: 800;
  color: var(--c);
}
.spl {
  font-size: 10.5px;
  color: #9ca3af;
  margin-top: 2px;
}

/* ── Body grid ───────────────────────────────────────────────────────────── */
.body-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.right-col {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
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
.field-list {
  padding: 12px 18px;
  display: flex;
  flex-direction: column;
}
.field-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  padding: 9px 0;
  border-bottom: 1px solid #f9fafb;
}
.field-row:last-child {
  border-bottom: none;
}
.field-row.edit {
  flex-direction: column;
  gap: 4px;
}
.fl {
  font-size: 11.5px;
  color: #9ca3af;
  font-weight: 500;
  flex-shrink: 0;
  min-width: 130px;
}
.fv {
  font-size: 12.5px;
  font-weight: 600;
  color: #111827;
  text-align: right;
}
.fv.link {
  color: #16a34a;
}
.field-input {
  padding: 7px 10px;
  border: 1.5px solid #e5e7eb;
  border-radius: 8px;
  font-size: 12.5px;
  font-family: "Poppins", sans-serif;
  color: #111827;
  outline: none;
  width: 100%;
}
.field-input:focus {
  border-color: #16a34a;
}
.edit-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
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
.toast svg {
  width: 18px;
  height: 18px;
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

/* ── Responsive ──────────────────────────────────────────────────────────── */
@media (max-width: 900px) {
  .body-grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 640px) {
  .layout-content {
    padding: 14px;
    gap: 14px;
  }
  .stats-row {
    flex-wrap: wrap;
  }
  .stat-pill {
    min-width: 50%;
  }
  .hero-body {
    padding: 0 16px 14px;
  }
  .fl {
    min-width: 100px;
  }
}
</style>
