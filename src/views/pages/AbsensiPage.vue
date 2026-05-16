<script setup>
import { ref, onMounted, onUnmounted, nextTick } from "vue";
import { useAuthStore } from "../../stores/auth";
import AppNavbar from "../../components/AppNavbar.vue";
import AppFooter from "../../components/AppFooter.vue";
import api from "../../plugins/axios";

const authStore = useAuthStore();
const isScanning = ref(false);
const scanResult = ref(null);
const errorMsg = ref("");
const riwayat = ref([]);
const stats = ref({ hadir: 0, izin: 0, alpha: 0, total: 0 });
const isLoadingData = ref(true);

let videoStream = null; // simpan stream agar bisa dihentikan saat unmount

// ── Data fetching ────────────────────────────────────────
const fetchData = async () => {
  isLoadingData.value = true;
  try {
    const [statsRes, riwayatRes] = await Promise.all([
      api.get("/api/absensi/stats"),
      api.get("/api/absensi/riwayat"),
    ]);
    stats.value = statsRes.data;
    riwayat.value = riwayatRes.data;
  } catch {
    errorMsg.value = "Gagal memuat data absensi.";
  } finally {
    isLoadingData.value = false;
  }
};

// ── Submit absensi (dipanggil dari startScan) ─────────────
const submitAbsensi = async (faceDescriptor) => {
  try {
    await api.post("/api/absensi/check-in", {
      face_descriptor: faceDescriptor,
      siswa_id: authStore.user?.id,
    });
    scanResult.value = "success";
    await fetchData();
  } catch (err) {
    scanResult.value = "failed";
    errorMsg.value = err.response?.data?.message ?? "Verifikasi wajah gagal.";
  } finally {
    isScanning.value = false;
  }
};

// ── Start kamera + deteksi ────────────────────────────────
const startScan = async () => {
  isScanning.value = true;
  scanResult.value = null;
  errorMsg.value = "";

  await nextTick(); // tunggu <video> muncul di DOM

  try {
    const video = document.getElementById("video");
    videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = videoStream;

    // Jalankan submitAbsensi dengan descriptor dari face-api.js
    // Ganti baris di bawah saat face-api.js sudah diintegrasikan:
    //   const detections = await faceapi
    //     .detectSingleFace(video)
    //     .withFaceLandmarks()
    //     .withFaceDescriptor();
    //   await submitAbsensi(Array.from(detections.descriptor));

    // Placeholder — kirim array kosong sampai model siap
    // Hapus baris ini dan uncomment blok di atas saat model sudah ada
    await submitAbsensi([]);
  } catch (err) {
    errorMsg.value = err.message ?? "Gagal mengakses kamera.";
    isScanning.value = false;
  }
};

// ── Stop kamera saat komponen di-unmount ──────────────────
onUnmounted(() => {
  videoStream?.getTracks().forEach((t) => t.stop());
});

const badgeClass = (status) =>
  ({ hadir: "badge-hadir", izin: "badge-izin", alpha: "badge-alpha" })[status] ?? "";

onMounted(fetchData);
</script>

<template>
  <div class="page-wrap">
    <AppNavbar />

    <main class="main-content">
      <!-- Header -->
      <div class="page-header">
        <h1 class="page-title">Absensi Hari Ini</h1>
        <p class="page-sub">
          {{
            new Date().toLocaleDateString("id-ID", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })
          }}
          · Semester 2 2025/2026
        </p>
      </div>

      <!-- Stats -->
      <div class="stats-grid">
        <template v-if="isLoadingData">
          <div v-for="i in 4" :key="i" class="stat-card skeleton" />
        </template>
        <template v-else>
          <div class="stat-card hadir">
            <div class="stat-label">Hadir</div>
            <div class="stat-value">{{ stats.hadir }}</div>
          </div>
          <div class="stat-card izin">
            <div class="stat-label">Izin</div>
            <div class="stat-value">{{ stats.izin }}</div>
          </div>
          <div class="stat-card alpha">
            <div class="stat-label">Alpha</div>
            <div class="stat-value">{{ stats.alpha }}</div>
          </div>
          <div class="stat-card total">
            <div class="stat-label">Total Hari</div>
            <div class="stat-value">{{ stats.total }}</div>
          </div>
        </template>
      </div>

      <!-- Face Recognition -->
      <div class="face-card">
        <div class="camera-box">
          <div v-if="!isScanning" class="camera-placeholder">
            <svg
              class="cam-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
            <span class="cam-text">Klik scan untuk aktifkan kamera</span>
          </div>
          <video v-else id="video" autoplay muted playsinline class="camera-video" />
        </div>

        <div class="face-info">
          <h2 class="face-title">Absensi via Face Recognition</h2>
          <p class="face-desc">
            Arahkan wajah ke kamera. Sistem akan mendeteksi dan memverifikasi identitas kamu secara
            otomatis.
          </p>
          <p v-if="errorMsg" class="face-error">{{ errorMsg }}</p>
          <div v-if="scanResult === 'success'" class="scan-success">
            ✓ Absensi berhasil dicatat!
          </div>
          <button v-else @click="startScan" :disabled="isScanning" class="btn-scan">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            {{ isScanning ? "Mendeteksi..." : "Mulai Scan" }}
          </button>
        </div>
      </div>

      <!-- Riwayat Table -->
      <div class="table-card">
        <div class="table-header">
          <h2 class="table-title">Riwayat Absensi</h2>
          <span class="table-period">Bulan ini</span>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Mata Pelajaran</th>
                <th>Jam</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="isLoadingData">
                <td colspan="4" class="td-center">Memuat data...</td>
              </tr>
              <tr v-else-if="riwayat.length === 0">
                <td colspan="4" class="td-center">Belum ada riwayat absensi.</td>
              </tr>
              <tr v-else v-for="(row, i) in riwayat" :key="i">
                <td>{{ row.tanggal }}</td>
                <td>{{ row.mapel }}</td>
                <td>{{ row.jam }}</td>
                <td>
                  <span class="badge" :class="badgeClass(row.status)">{{ row.status }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>

    <AppFooter />
  </div>
</template>

<style scoped>
.page-wrap {
  min-height: 100vh;
  background: #0a0f1e;
  display: flex;
  flex-direction: column;
}
.main-content {
  flex: 1;
  padding: 24px 20px;
  max-width: 900px;
  width: 100%;
  margin: 0 auto;
}
.page-header {
  margin-bottom: 20px;
}
.page-title {
  font-size: 20px;
  font-weight: 700;
  color: #f1f5f9;
}
.page-sub {
  font-size: 12px;
  color: #475569;
  margin-top: 4px;
}

/* Stats */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-bottom: 20px;
}
@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
.stat-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 14px;
}
.stat-label {
  font-size: 10px;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 6px;
}
.stat-value {
  font-size: 24px;
  font-weight: 700;
}
.stat-card.hadir .stat-value {
  color: #10b981;
}
.stat-card.izin .stat-value {
  color: #f59e0b;
}
.stat-card.alpha .stat-value {
  color: #ef4444;
}
.stat-card.total .stat-value {
  color: #22d3ee;
}

/* Skeleton */
.skeleton {
  min-height: 72px;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.04) 25%,
    rgba(255, 255, 255, 0.08) 50%,
    rgba(255, 255, 255, 0.04) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* Face Card */
.face-card {
  display: flex;
  gap: 20px;
  align-items: flex-start;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 14px;
  padding: 20px;
  margin-bottom: 20px;
}
@media (max-width: 540px) {
  .face-card {
    flex-direction: column;
  }
}
.camera-box {
  width: 160px;
  min-height: 120px;
  border-radius: 10px;
  flex-shrink: 0;
  background: rgba(6, 182, 212, 0.04);
  border: 1px solid rgba(6, 182, 212, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
@media (max-width: 540px) {
  .camera-box {
    width: 100%;
    min-height: 180px;
  }
}
.camera-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
}
.cam-icon {
  width: 32px;
  height: 32px;
  color: #22d3ee;
  opacity: 0.5;
}
.cam-text {
  font-size: 10px;
  color: #475569;
  text-align: center;
  line-height: 1.5;
}
.camera-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.face-info {
  flex: 1;
}
.face-title {
  font-size: 15px;
  font-weight: 600;
  color: #f1f5f9;
  margin-bottom: 8px;
}
.face-desc {
  font-size: 12px;
  color: #64748b;
  line-height: 1.6;
  margin-bottom: 14px;
}
.face-error {
  font-size: 12px;
  color: #f87171;
  margin-bottom: 10px;
}
.scan-success {
  font-size: 13px;
  color: #10b981;
  font-weight: 600;
}
.btn-scan {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 18px;
  border-radius: 10px;
  background: linear-gradient(135deg, #06b6d4, #3b82f6);
  color: white;
  font-size: 13px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition:
    opacity 0.2s,
    transform 0.2s;
}
.btn-scan:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
}
.btn-scan:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Table */
.table-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 14px;
  overflow: hidden;
}
.table-header {
  padding: 14px 18px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.table-title {
  font-size: 14px;
  font-weight: 600;
  color: #f1f5f9;
}
.table-period {
  font-size: 11px;
  color: #475569;
}
.table-wrap {
  overflow-x: auto;
}
table {
  width: 100%;
  border-collapse: collapse;
}
th {
  font-size: 10px;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 10px 18px;
  text-align: left;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  white-space: nowrap;
}
td {
  font-size: 13px;
  color: #cbd5e1;
  padding: 12px 18px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}
tr:last-child td {
  border-bottom: none;
}
.td-center {
  text-align: center;
  color: #475569;
  padding: 24px;
  font-size: 13px;
}
.badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 10px;
  font-weight: 600;
  text-transform: capitalize;
}
.badge-hadir {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
}
.badge-izin {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
}
.badge-alpha {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}
</style>
