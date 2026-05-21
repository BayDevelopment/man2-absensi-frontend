<script setup>
import { ref, computed } from "vue";
import { useAuthStore } from "../../stores/auth";
import Sidebar from "../../components/AppSidebar.vue";
import Navbar from "../../components/AppNavbar.vue";
import AppFooter from "../../components/AppFooter.vue";

const authStore = useAuthStore();
const sidebarOpen = ref(false);
const editMode = ref(false);
const showSuccessToast = ref(false);

const today = new Date().toLocaleDateString("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

// ── Profil data (ganti dengan API call) ───────────────────────────────────
const profile = ref({
  nama: authStore.user?.name ?? "Ahmad Rafi Pratama",
  nis: "2024001",
  kelas: "XII IPA 1",
  jurusan: "Ilmu Pengetahuan Alam",
  angkatan: "2022",
  ttl: "Jakarta, 12 Maret 2007",
  jenisKelamin: "Laki-laki",
  agama: "Islam",
  alamat: "Jl. Mawar No. 10, Tangerang Selatan",
  noTelp: "0812-3456-7890",
  email: "ahmadrafi@student.sch.id",
  namaAyah: "Budi Pratama",
  namaIbu: "Siti Aminah",
  noWali: "0821-9876-5432",
  foto: null,
});

// Copy untuk edit — reset saat batal
const editData = ref({ ...profile.value });

function startEdit() {
  editData.value = { ...profile.value };
  editMode.value = true;
}
function cancelEdit() {
  editMode.value = false;
}
function saveEdit() {
  profile.value = { ...editData.value };
  editMode.value = false;
  showSuccessToast.value = true;
  setTimeout(() => (showSuccessToast.value = false), 3000);
}

const initials = computed(() => {
  return profile.value.nama
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
});

// ── Statistik ringkas ─────────────────────────────────────────────────────
const statsRingkas = [
  { label: "Kehadiran", value: "96%", color: "#16a34a", bg: "#f0fdf4" },
  { label: "Total Hadir", value: "112", color: "#2563eb", bg: "#eff6ff" },
  { label: "Izin/Sakit", value: "4", color: "#d97706", bg: "#fffbeb" },
  { label: "Alfa", value: "0", color: "#dc2626", bg: "#fef2f2" },
];
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

        <!-- Profile hero card -->
        <div class="hero-card">
          <div class="hero-bg"></div>
          <div class="hero-body">
            <div class="avatar-wrap">
              <div class="avatar-circle">{{ initials }}</div>
              <div class="avatar-status"></div>
            </div>
            <div class="hero-info">
              <h2 class="hero-name">{{ profile.nama }}</h2>
              <div class="hero-meta-row">
                <span class="hero-chip">NIS: {{ profile.nis }}</span>
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

          <!-- Stats ringkas -->
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
            <div class="card-head">
              <h3 class="card-title">Data Diri</h3>
            </div>
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
                  <span class="fl">Tempat, Tgl Lahir</span><span class="fv">{{ profile.ttl }}</span>
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
                  <input v-model="editData.nis" class="field-input" disabled style="opacity: 0.5" />
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
                  <label class="fl">Tempat, Tgl Lahir</label>
                  <input v-model="editData.ttl" class="field-input" />
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
                    <span class="fl">No. Telepon</span><span class="fv">{{ profile.noTelp }}</span>
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
                    <span class="fl">Nama Ayah</span><span class="fv">{{ profile.namaAyah }}</span>
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

            <!-- Tombol save/cancel -->
            <div v-if="editMode" class="edit-actions">
              <button class="btn btn-ghost" @click="cancelEdit">Batal</button>
              <button class="btn btn-primary" @click="saveEdit">Simpan Perubahan</button>
            </div>
          </div>
        </div>
      </main>
      <AppFooter />
    </div>

    <!-- Toast notifikasi -->
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

/* Hero card */
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

.stats-row {
  display: flex;
  gap: 0;
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

/* Body grid */
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

/* Toast */
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
