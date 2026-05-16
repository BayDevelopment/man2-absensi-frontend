<script setup>
import { ref, onMounted, computed } from "vue";
import { useAuthStore } from "../../stores/auth";
import AppNavbar from "../../components/AppNavbar.vue";
import AppFooter from "../../components/AppFooter.vue";
import api from "../../plugins/axios";

const authStore = useAuthStore();
const isLoading = ref(true);
const errorMsg = ref("");

const summary = ref({
  hadir: 0,
  izin: 0,
  alpha: 0,
  total: 0,
  persentase_hadir: 0,
});

const jadwalHariIni = ref([]);
const pengumuman = ref([]);

const fetchDashboard = async () => {
  isLoading.value = true;
  try {
    const [summaryRes, jadwalRes, pengumumanRes] = await Promise.all([
      api.get("/api/dashboard/summary"), // { hadir, izin, alpha, total, persentase_hadir }
      api.get("/api/dashboard/jadwal-hari-ini"), // [{ jam, mapel, guru, ruang }]
      api.get("/api/dashboard/pengumuman"), // [{ judul, isi, tanggal }]
    ]);
    summary.value = summaryRes.data;
    jadwalHariIni.value = jadwalRes.data;
    pengumuman.value = pengumumanRes.data;
  } catch {
    errorMsg.value = "Gagal memuat data dashboard.";
  } finally {
    isLoading.value = false;
  }
};

// Warna progress bar kehadiran
const progressColor = computed(() => {
  const p = summary.value.persentase_hadir;
  if (p >= 80) return "#10b981";
  if (p >= 60) return "#f59e0b";
  return "#ef4444";
});

const greeting = computed(() => {
  const h = new Date().getHours();
  if (h < 11) return "Selamat pagi";
  if (h < 15) return "Selamat siang";
  if (h < 18) return "Selamat sore";
  return "Selamat malam";
});

const today = new Date().toLocaleDateString("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

onMounted(fetchDashboard);
</script>

<template>
  <div class="page-wrap">
    <AppNavbar />

    <main class="main-content">
      <!-- Greeting -->
      <div class="greeting-block">
        <div>
          <h1 class="greeting-text">
            {{ greeting }},
            <span class="greeting-name">{{ authStore.user?.name?.split(" ")[0] }}</span> 👋
          </h1>
          <p class="greeting-date">{{ today }}</p>
        </div>
        <div class="greeting-badge">
          <span class="badge-kelas">{{ authStore.user?.kelas ?? "XII IPA 1" }}</span>
        </div>
      </div>

      <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>

      <!-- Summary Stats -->
      <div class="stats-grid">
        <div class="stat-card hadir">
          <div class="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div class="stat-label">Hadir</div>
          <div class="stat-value hadir-val">{{ isLoading ? "–" : summary.hadir }}</div>
          <div class="stat-sub">hari</div>
        </div>
        <div class="stat-card izin">
          <div class="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
              />
            </svg>
          </div>
          <div class="stat-label">Izin</div>
          <div class="stat-value izin-val">{{ isLoading ? "–" : summary.izin }}</div>
          <div class="stat-sub">hari</div>
        </div>
        <div class="stat-card alpha">
          <div class="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              />
            </svg>
          </div>
          <div class="stat-label">Alpha</div>
          <div class="stat-value alpha-val">{{ isLoading ? "–" : summary.alpha }}</div>
          <div class="stat-sub">hari</div>
        </div>
        <div class="stat-card persen">
          <div class="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
              />
            </svg>
          </div>
          <div class="stat-label">Kehadiran</div>
          <div class="stat-value persen-val">{{ isLoading ? "–" : summary.persentase_hadir }}%</div>
          <div class="stat-sub">semester ini</div>
        </div>
      </div>

      <!-- Progress Kehadiran -->
      <div class="progress-card">
        <div class="progress-header">
          <span class="progress-label">Persentase Kehadiran</span>
          <span class="progress-val" :style="{ color: progressColor }">
            {{ summary.persentase_hadir }}%
          </span>
        </div>
        <div class="progress-track">
          <div
            class="progress-fill"
            :style="{ width: summary.persentase_hadir + '%', background: progressColor }"
          />
        </div>
        <div class="progress-info">
          <span>Total: {{ summary.total }} hari</span>
          <span :style="{ color: summary.persentase_hadir < 75 ? '#ef4444' : '#64748b' }">
            {{
              summary.persentase_hadir < 75 ? "⚠ Di bawah batas minimal 75%" : "✓ Memenuhi syarat"
            }}
          </span>
        </div>
      </div>

      <!-- Grid bawah: Jadwal + Pengumuman -->
      <div class="bottom-grid">
        <!-- Jadwal Hari Ini -->
        <div class="bottom-card">
          <div class="card-header">
            <h2 class="card-title">Jadwal Hari Ini</h2>
            <span class="card-badge">{{ jadwalHariIni.length }} sesi</span>
          </div>
          <div v-if="isLoading" class="card-empty">Memuat jadwal...</div>
          <div v-else-if="jadwalHariIni.length === 0" class="card-empty">
            Tidak ada jadwal hari ini.
          </div>
          <div v-else class="jadwal-list">
            <div v-for="(j, i) in jadwalHariIni" :key="i" class="jadwal-item">
              <div class="jadwal-jam">{{ j.jam }}</div>
              <div class="jadwal-detail">
                <div class="jadwal-mapel">{{ j.mapel }}</div>
                <div class="jadwal-meta">{{ j.guru }} · {{ j.ruang }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Pengumuman -->
        <div class="bottom-card">
          <div class="card-header">
            <h2 class="card-title">Pengumuman</h2>
          </div>
          <div v-if="isLoading" class="card-empty">Memuat pengumuman...</div>
          <div v-else-if="pengumuman.length === 0" class="card-empty">Tidak ada pengumuman.</div>
          <div v-else class="pengumuman-list">
            <div v-for="(p, i) in pengumuman" :key="i" class="pengumuman-item">
              <div class="peng-tanggal">{{ p.tanggal }}</div>
              <div class="peng-judul">{{ p.judul }}</div>
              <div class="peng-isi">{{ p.isi }}</div>
            </div>
          </div>
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

/* Greeting */
.greeting-block {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 24px;
  gap: 12px;
  flex-wrap: wrap;
}
.greeting-text {
  font-size: 20px;
  font-weight: 700;
  color: #f1f5f9;
}
.greeting-name {
  color: #22d3ee;
}
.greeting-date {
  font-size: 12px;
  color: #475569;
  margin-top: 4px;
}
.badge-kelas {
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  background: rgba(6, 182, 212, 0.1);
  color: #22d3ee;
  border: 1px solid rgba(6, 182, 212, 0.2);
}
.error-msg {
  font-size: 13px;
  color: #f87171;
  margin-bottom: 16px;
}

/* Stats */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-bottom: 16px;
}
@media (max-width: 540px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
.stat-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 16px 14px;
}
.stat-icon {
  width: 20px;
  height: 20px;
  margin-bottom: 10px;
  opacity: 0.5;
}
.stat-icon svg {
  width: 100%;
  height: 100%;
}
.stat-card.hadir .stat-icon svg {
  stroke: #10b981;
}
.stat-card.izin .stat-icon svg {
  stroke: #f59e0b;
}
.stat-card.alpha .stat-icon svg {
  stroke: #ef4444;
}
.stat-card.persen .stat-icon svg {
  stroke: #22d3ee;
}
.stat-label {
  font-size: 10px;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 4px;
}
.stat-value {
  font-size: 28px;
  font-weight: 700;
  line-height: 1;
}
.stat-sub {
  font-size: 10px;
  color: #475569;
  margin-top: 2px;
}
.hadir-val {
  color: #10b981;
}
.izin-val {
  color: #f59e0b;
}
.alpha-val {
  color: #ef4444;
}
.persen-val {
  color: #22d3ee;
}

/* Progress */
.progress-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 14px;
  padding: 16px 20px;
  margin-bottom: 20px;
}
.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
.progress-label {
  font-size: 13px;
  color: #94a3b8;
}
.progress-val {
  font-size: 15px;
  font-weight: 700;
}
.progress-track {
  height: 6px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 99px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  border-radius: 99px;
  transition: width 0.8s ease;
}
.progress-info {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 11px;
  color: #475569;
}

/* Bottom grid */
.bottom-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}
@media (max-width: 600px) {
  .bottom-grid {
    grid-template-columns: 1fr;
  }
}
.bottom-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 14px;
  overflow: hidden;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}
.card-title {
  font-size: 13px;
  font-weight: 600;
  color: #f1f5f9;
}
.card-badge {
  font-size: 10px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 20px;
  background: rgba(6, 182, 212, 0.1);
  color: #22d3ee;
}
.card-empty {
  padding: 24px 16px;
  text-align: center;
  font-size: 12px;
  color: #475569;
}

/* Jadwal */
.jadwal-list {
  display: flex;
  flex-direction: column;
}
.jadwal-item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}
.jadwal-item:last-child {
  border-bottom: none;
}
.jadwal-jam {
  font-size: 11px;
  color: #22d3ee;
  font-weight: 600;
  min-width: 44px;
  padding-top: 1px;
}
.jadwal-mapel {
  font-size: 13px;
  color: #e2e8f0;
  font-weight: 500;
}
.jadwal-meta {
  font-size: 11px;
  color: #475569;
  margin-top: 2px;
}

/* Pengumuman */
.pengumuman-list {
  display: flex;
  flex-direction: column;
}
.pengumuman-item {
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}
.pengumuman-item:last-child {
  border-bottom: none;
}
.peng-tanggal {
  font-size: 10px;
  color: #475569;
  margin-bottom: 4px;
}
.peng-judul {
  font-size: 13px;
  color: #f1f5f9;
  font-weight: 600;
  margin-bottom: 4px;
}
.peng-isi {
  font-size: 12px;
  color: #64748b;
  line-height: 1.5;
}
</style>
