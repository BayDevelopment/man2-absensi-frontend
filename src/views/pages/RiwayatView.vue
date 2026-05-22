<script setup>
import { ref, computed, onMounted } from "vue";
import { useAuthStore } from "../../stores/auth";
import Sidebar from "../../components/AppSidebar.vue";
import Navbar from "../../components/AppNavbar.vue";
import AppFooter from "../../components/AppFooter.vue";
import api from "../../plugins/axios";

// ============================================================================
// STORE & STATE
// ============================================================================
const authStore = useAuthStore();
const sidebarOpen = ref(false);

const selectedBulan = ref("");
const filterStatus = ref("");
const bulanOptions = ref([]);

const allRiwayat = ref([]);
const isLoading = ref(false);
const isError = ref(false);
const errorMsg = ref("");

// AbortController untuk cegah race condition saat filter berganti cepat
const abortController = ref(null);

// ============================================================================
// FETCH DATA DARI API
// ============================================================================
async function fetchRiwayat() {
  if (abortController.value) abortController.value.abort();
  abortController.value = new AbortController();

  isLoading.value = true;
  isError.value = false;
  errorMsg.value = "";

  try {
    const params = {};
    if (selectedBulan.value) params.bulan = selectedBulan.value;
    if (filterStatus.value) params.status = filterStatus.value;

    const res = await api.get("/api/riwayat", {
      params,
      signal: abortController.value.signal,
    });

    // Ambil opsi bulan dari meta jika tersedia
    if (Array.isArray(res.data.meta?.bulan_options)) {
      bulanOptions.value = res.data.meta.bulan_options;
      // Set default bulan ke yang pertama jika belum dipilih
      if (!selectedBulan.value && bulanOptions.value.length > 0) {
        selectedBulan.value = bulanOptions.value[0].value;
      }
    }

    allRiwayat.value = Array.isArray(res.data.data) ? res.data.data : [];
  } catch (err) {
    if (err.name === "CanceledError") return;
    console.error("[Riwayat] Gagal fetch:", err);
    isError.value = true;
    if (err.response?.status === 401) {
      errorMsg.value = "Sesi habis. Silakan login kembali.";
    } else if (err.response?.status >= 500) {
      errorMsg.value = "Server sedang bermasalah. Coba beberapa saat lagi.";
    } else if (!navigator.onLine) {
      errorMsg.value = "Tidak ada koneksi internet.";
    } else {
      errorMsg.value = "Gagal memuat data riwayat.";
    }
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  fetchRiwayat();
});

// Re-fetch saat filter berubah
// (bulan & status dikirim sebagai params, biarkan backend yang filter)
function onBulanChange() {
  fetchRiwayat();
}
function onStatusChange() {
  fetchRiwayat();
}

// ============================================================================
// COMPUTED — REKAP
// ============================================================================
const rekap = computed(() => {
  const data = allRiwayat.value;
  const total = data.length;
  const hadir = data.filter((r) => r.status === "Hadir").length;
  const terlambat = data.filter((r) => r.status === "Terlambat").length;
  const izin = data.filter((r) => r.status === "Izin").length;
  const sakit = data.filter((r) => r.status === "Sakit").length;
  const alfa = data.filter((r) => r.status === "Alfa").length;
  const persen = total ? Math.round(((hadir + terlambat) / total) * 100) : 0;
  return { total, hadir, terlambat, izin, sakit, alfa, persen };
});

// ============================================================================
// COMPUTED — GROUP BY TANGGAL
// ============================================================================
const groupedByDate = computed(() => {
  const groups = {};
  allRiwayat.value.forEach((r) => {
    const key = r.tanggal;
    if (!groups[key]) groups[key] = { tanggal: r.tanggal, hari: r.hari, items: [] };
    groups[key].items.push(r);
  });
  return Object.values(groups).sort((a, b) => b.tanggal.localeCompare(a.tanggal));
});

// ============================================================================
// SKELETON
// ============================================================================
const skeletonGroups = Array.from({ length: 3 });
const skeletonItems = Array.from({ length: 2 });

// ============================================================================
// HELPERS
// ============================================================================
const statusConfig = {
  Hadir: { cls: "badge-hadir", dot: "#16a34a" },
  Terlambat: { cls: "badge-terlambat", dot: "#9333ea" },
  Izin: { cls: "badge-izin", dot: "#d97706" },
  Sakit: { cls: "badge-sakit", dot: "#2563eb" },
  Alfa: { cls: "badge-alfa", dot: "#dc2626" },
};

function sc(s) {
  return statusConfig[s] ?? statusConfig.Alfa;
}

function formatTgl(str) {
  if (!str) return "—";
  const [y, m, d] = str.split("-");
  return new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const today = new Date().toLocaleDateString("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});
</script>

<template>
  <div class="layout-root">
    <Sidebar :open="sidebarOpen" @close="sidebarOpen = false" />
    <div class="layout-main">
      <Navbar @toggle-sidebar="sidebarOpen = !sidebarOpen" />
      <main class="layout-content">
        <!-- ── Header ── -->
        <div class="dash-header">
          <div>
            <h1 class="dash-title">Riwayat Absensi</h1>
            <p class="dash-sub">Rekap kehadiran per bulan · {{ authStore.user?.name }}</p>
          </div>
          <div class="header-right">
            <span class="dash-date">{{ today }}</span>
          </div>
        </div>

        <!-- ── Filter Bar ── -->
        <div class="filter-bar">
          <select v-model="selectedBulan" class="filter-select" @change="onBulanChange">
            <option value="">Semua Bulan</option>
            <option v-for="b in bulanOptions" :key="b.value" :value="b.value">{{ b.label }}</option>
          </select>

          <select v-model="filterStatus" class="filter-select" @change="onStatusChange">
            <option value="">Semua Status</option>
            <option>Hadir</option>
            <option>Terlambat</option>
            <option>Izin</option>
            <option>Sakit</option>
            <option>Alfa</option>
          </select>

          <span class="rec-badge">
            {{ isLoading ? "…" : allRiwayat.length + " catatan" }}
          </span>
        </div>

        <!-- ── Error State ── -->
        <div v-if="isError" class="error-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
          <p>{{ errorMsg }}</p>
          <button class="btn btn-retry" @click="fetchRiwayat">Coba Lagi</button>
        </div>

        <template v-else>
          <!-- ── Rekap Cards — Skeleton ── -->
          <div class="rekap-grid" v-if="isLoading">
            <div v-for="i in 6" :key="i" class="rekap-card skeleton-card">
              <div class="skel skel-val"></div>
              <div class="skel skel-lbl"></div>
            </div>
          </div>

          <!-- ── Rekap Cards ── -->
          <div class="rekap-grid" v-else>
            <div class="rekap-card" style="--c: #16a34a; --bg: #f0fdf4">
              <div class="rekap-val">{{ rekap.hadir }}</div>
              <div class="rekap-lbl">Hadir</div>
            </div>
            <div class="rekap-card" style="--c: #9333ea; --bg: #fdf4ff">
              <div class="rekap-val">{{ rekap.terlambat }}</div>
              <div class="rekap-lbl">Terlambat</div>
            </div>
            <div class="rekap-card" style="--c: #d97706; --bg: #fffbeb">
              <div class="rekap-val">{{ rekap.izin }}</div>
              <div class="rekap-lbl">Izin</div>
            </div>
            <div class="rekap-card" style="--c: #2563eb; --bg: #eff6ff">
              <div class="rekap-val">{{ rekap.sakit }}</div>
              <div class="rekap-lbl">Sakit</div>
            </div>
            <div class="rekap-card" style="--c: #dc2626; --bg: #fef2f2">
              <div class="rekap-val">{{ rekap.alfa }}</div>
              <div class="rekap-lbl">Alfa</div>
            </div>
            <div
              class="rekap-card persen-card"
              :style="{
                '--c': rekap.persen >= 80 ? '#16a34a' : '#dc2626',
                '--bg': rekap.persen >= 80 ? '#f0fdf4' : '#fef2f2',
              }"
            >
              <div class="rekap-val">{{ rekap.persen }}<span style="font-size: 14px">%</span></div>
              <div class="rekap-lbl">Kehadiran</div>
              <div class="mini-bar-bg">
                <div
                  class="mini-bar-fill"
                  :style="{ width: rekap.persen + '%', background: 'var(--c)' }"
                />
              </div>
            </div>
          </div>

          <!-- ── Timeline ── -->
          <div class="timeline-card">
            <div class="table-head-bar">
              <h3 class="table-title">Detail Per Hari</h3>
            </div>

            <!-- Skeleton timeline -->
            <template v-if="isLoading">
              <div v-for="(_, gi) in skeletonGroups" :key="gi" class="day-group">
                <div class="day-header">
                  <div class="skel" style="width: 160px; height: 12px; border-radius: 6px"></div>
                  <div class="skel" style="width: 60px; height: 12px; border-radius: 6px"></div>
                </div>
                <div class="day-items">
                  <div v-for="(_, ii) in skeletonItems" :key="ii" class="day-item skeleton-item">
                    <div class="item-left">
                      <div class="skel" style="width: 8px; height: 8px; border-radius: 50%"></div>
                      <div>
                        <div
                          class="skel"
                          style="width: 120px; height: 12px; border-radius: 6px; margin-bottom: 6px"
                        ></div>
                        <div
                          class="skel"
                          style="width: 80px; height: 10px; border-radius: 6px"
                        ></div>
                      </div>
                    </div>
                    <div class="skel" style="width: 56px; height: 22px; border-radius: 20px"></div>
                  </div>
                </div>
              </div>
            </template>

            <!-- Empty state -->
            <div v-else-if="groupedByDate.length === 0" class="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5"
                />
              </svg>
              <p>Tidak ada data untuk filter ini</p>
            </div>

            <!-- Data -->
            <template v-else>
              <div v-for="group in groupedByDate" :key="group.tanggal" class="day-group">
                <div class="day-header">
                  <span class="day-label">{{ group.hari }}, {{ formatTgl(group.tanggal) }}</span>
                  <span class="day-count">{{ group.items.length }} pelajaran</span>
                </div>
                <div class="day-items">
                  <div v-for="item in group.items" :key="item.id" class="day-item">
                    <div class="item-left">
                      <span class="item-dot" :style="{ background: sc(item.status).dot }"></span>
                      <div>
                        <div class="item-mapel">{{ item.matpel }}</div>
                        <div class="item-jam">
                          Jam masuk: <b>{{ item.jam || "—" }}</b>
                        </div>
                      </div>
                    </div>
                    <div class="item-right">
                      <span class="badge" :class="sc(item.status).cls">{{ item.status }}</span>
                      <span v-if="item.ket && item.ket !== '—'" class="item-ket">{{
                        item.ket
                      }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </template>
      </main>
      <AppFooter />
    </div>
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

/* ── Header ── */
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
.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
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

/* ── Filter Bar ── */
.filter-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.filter-select {
  padding: 8px 12px;
  border: 1.5px solid #d1fae5;
  border-radius: 10px;
  font-size: 12px;
  font-family: "Poppins", sans-serif;
  background: white;
  color: #374151;
  outline: none;
  cursor: pointer;
}
.filter-select:focus {
  border-color: #16a34a;
}
.rec-badge {
  font-size: 11px;
  font-weight: 600;
  color: #16a34a;
  background: #dcfce7;
  padding: 4px 10px;
  border-radius: 20px;
  margin-left: auto;
}

/* ── Error Box ── */
.error-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 32px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 14px;
  color: #dc2626;
  text-align: center;
}
.error-box svg {
  width: 32px;
  height: 32px;
}
.error-box p {
  font-size: 13px;
  margin: 0;
}
.btn-retry {
  padding: 7px 18px;
  border-radius: 10px;
  border: 1.5px solid #fca5a5;
  background: white;
  color: #dc2626;
  font-size: 12px;
  font-weight: 600;
  font-family: "Poppins", sans-serif;
  cursor: pointer;
}
.btn-retry:hover {
  background: #fef2f2;
}

/* ── Rekap Grid ── */
.rekap-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
}
.rekap-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  border-top: 3px solid var(--c);
}
.rekap-val {
  font-size: 26px;
  font-weight: 800;
  color: var(--c);
  line-height: 1;
}
.rekap-lbl {
  font-size: 11px;
  color: #6b7280;
}
.mini-bar-bg {
  height: 5px;
  background: #f3f4f6;
  border-radius: 99px;
  overflow: hidden;
  margin-top: 6px;
}
.mini-bar-fill {
  height: 100%;
  border-radius: 99px;
  transition: width 0.8s ease;
}

/* ── Skeleton ── */
.skel {
  background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
  display: block;
}
@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
.skeleton-card {
  opacity: 0.7;
}
.skel-val {
  width: 40px;
  height: 26px;
  border-radius: 6px;
}
.skel-lbl {
  width: 60px;
  height: 10px;
  border-radius: 4px;
}
.skeleton-item {
  opacity: 0.7;
}

/* ── Timeline ── */
.timeline-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  overflow: hidden;
}
.table-head-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid #f3f4f6;
}
.table-title {
  font-size: 13px;
  font-weight: 700;
  color: #111827;
  margin: 0;
}
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 40px;
  color: #9ca3af;
}
.empty-state svg {
  width: 36px;
  height: 36px;
}
.empty-state p {
  font-size: 13px;
}
.day-group {
  border-bottom: 1px solid #f3f4f6;
}
.day-group:last-child {
  border-bottom: none;
}
.day-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 18px;
  background: #f9fafb;
}
.day-label {
  font-size: 12px;
  font-weight: 700;
  color: #374151;
}
.day-count {
  font-size: 11px;
  color: #9ca3af;
}
.day-items {
  padding: 4px 18px 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.day-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-radius: 10px;
  background: #fafafa;
  border: 1px solid #f3f4f6;
  transition: background 0.15s;
}
.day-item:hover {
  background: #f0fdf4;
}
.item-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.item-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.item-mapel {
  font-size: 12.5px;
  font-weight: 600;
  color: #111827;
}
.item-jam {
  font-size: 11px;
  color: #9ca3af;
}
.item-jam b {
  color: #374151;
}
.item-right {
  display: flex;
  align-items: center;
  gap: 8px;
}
.item-ket {
  font-size: 11px;
  color: #9ca3af;
  font-style: italic;
}

/* ── Badge ── */
.badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 9px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
}
.badge-hadir {
  background: #f0fdf4;
  color: #16a34a;
}
.badge-terlambat {
  background: #fdf4ff;
  color: #9333ea;
}
.badge-izin {
  background: #fffbeb;
  color: #d97706;
}
.badge-sakit {
  background: #eff6ff;
  color: #2563eb;
}
.badge-alfa {
  background: #fef2f2;
  color: #dc2626;
}

/* ── Responsive ── */
@media (max-width: 900px) {
  .rekap-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
@media (max-width: 640px) {
  .layout-content {
    padding: 14px;
    gap: 14px;
  }
  .rekap-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .dash-date {
    display: none;
  }
  .day-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }
}
</style>
