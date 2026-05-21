<script setup>
import { ref, computed } from "vue";
import { useAuthStore } from "../../stores/auth";
import Sidebar from "../../components/AppSidebar.vue";
import Navbar from "../../components/AppNavbar.vue";
import AppFooter from "../../components/AppFooter.vue";

const authStore = useAuthStore();
const sidebarOpen = ref(false);

const selectedBulan = ref("2025-07");
const filterStatus = ref("");

const bulanOptions = [
  { value: "2025-07", label: "Juli 2025" },
  { value: "2025-06", label: "Juni 2025" },
  { value: "2025-05", label: "Mei 2025" },
  { value: "2025-04", label: "April 2025" },
  { value: "2025-03", label: "Maret 2025" },
  { value: "2025-02", label: "Februari 2025" },
  { value: "2025-01", label: "Januari 2025" },
];

// ── Data dummy per bulan ──────────────────────────────────────────────────
const allRiwayat = ref([
  // Juli 2025
  {
    id: 1,
    bulan: "2025-07",
    tanggal: "2025-07-07",
    hari: "Senin",
    matpel: "Matematika",
    status: "Hadir",
    jam: "07:05",
    ket: "—",
  },
  {
    id: 2,
    bulan: "2025-07",
    tanggal: "2025-07-07",
    hari: "Senin",
    matpel: "Bahasa Indonesia",
    status: "Hadir",
    jam: "09:00",
    ket: "—",
  },
  {
    id: 3,
    bulan: "2025-07",
    tanggal: "2025-07-08",
    hari: "Selasa",
    matpel: "Fisika",
    status: "Terlambat",
    jam: "07:42",
    ket: "Macet",
  },
  {
    id: 4,
    bulan: "2025-07",
    tanggal: "2025-07-08",
    hari: "Selasa",
    matpel: "Kimia",
    status: "Izin",
    jam: "—",
    ket: "Acara keluarga",
  },
  {
    id: 5,
    bulan: "2025-07",
    tanggal: "2025-07-09",
    hari: "Rabu",
    matpel: "Biologi",
    status: "Hadir",
    jam: "07:08",
    ket: "—",
  },
  {
    id: 6,
    bulan: "2025-07",
    tanggal: "2025-07-09",
    hari: "Rabu",
    matpel: "Sejarah",
    status: "Hadir",
    jam: "09:00",
    ket: "—",
  },
  {
    id: 7,
    bulan: "2025-07",
    tanggal: "2025-07-10",
    hari: "Kamis",
    matpel: "Matematika",
    status: "Sakit",
    jam: "—",
    ket: "Demam",
  },
  {
    id: 8,
    bulan: "2025-07",
    tanggal: "2025-07-11",
    hari: "Jumat",
    matpel: "Pendidikan Agama",
    status: "Hadir",
    jam: "07:00",
    ket: "—",
  },
  {
    id: 9,
    bulan: "2025-07",
    tanggal: "2025-07-14",
    hari: "Senin",
    matpel: "Ekonomi",
    status: "Hadir",
    jam: "07:10",
    ket: "—",
  },
  {
    id: 10,
    bulan: "2025-07",
    tanggal: "2025-07-14",
    hari: "Senin",
    matpel: "Geografi",
    status: "Hadir",
    jam: "09:00",
    ket: "—",
  },
  {
    id: 11,
    bulan: "2025-07",
    tanggal: "2025-07-15",
    hari: "Selasa",
    matpel: "Bahasa Inggris",
    status: "Hadir",
    jam: "07:05",
    ket: "—",
  },
  {
    id: 12,
    bulan: "2025-07",
    tanggal: "2025-07-15",
    hari: "Selasa",
    matpel: "Seni Budaya",
    status: "Alfa",
    jam: "—",
    ket: "Tanpa keterangan",
  },
  // Juni 2025
  {
    id: 13,
    bulan: "2025-06",
    tanggal: "2025-06-02",
    hari: "Senin",
    matpel: "Matematika",
    status: "Hadir",
    jam: "07:03",
    ket: "—",
  },
  {
    id: 14,
    bulan: "2025-06",
    tanggal: "2025-06-02",
    hari: "Senin",
    matpel: "Fisika",
    status: "Hadir",
    jam: "09:00",
    ket: "—",
  },
  {
    id: 15,
    bulan: "2025-06",
    tanggal: "2025-06-03",
    hari: "Selasa",
    matpel: "Kimia",
    status: "Izin",
    jam: "—",
    ket: "Lomba sekolah",
  },
  {
    id: 16,
    bulan: "2025-06",
    tanggal: "2025-06-03",
    hari: "Selasa",
    matpel: "Biologi",
    status: "Hadir",
    jam: "07:12",
    ket: "—",
  },
  {
    id: 17,
    bulan: "2025-06",
    tanggal: "2025-06-04",
    hari: "Rabu",
    matpel: "Sejarah",
    status: "Hadir",
    jam: "07:05",
    ket: "—",
  },
  {
    id: 18,
    bulan: "2025-06",
    tanggal: "2025-06-05",
    hari: "Kamis",
    matpel: "Ekonomi",
    status: "Terlambat",
    jam: "07:50",
    ket: "Ban bocor",
  },
  // Mei 2025
  {
    id: 19,
    bulan: "2025-05",
    tanggal: "2025-05-05",
    hari: "Senin",
    matpel: "Matematika",
    status: "Hadir",
    jam: "07:04",
    ket: "—",
  },
  {
    id: 20,
    bulan: "2025-05",
    tanggal: "2025-05-06",
    hari: "Selasa",
    matpel: "Fisika",
    status: "Sakit",
    jam: "—",
    ket: "Flu berat",
  },
  {
    id: 21,
    bulan: "2025-05",
    tanggal: "2025-05-07",
    hari: "Rabu",
    matpel: "Kimia",
    status: "Hadir",
    jam: "07:08",
    ket: "—",
  },
]);

// ── Computed ──────────────────────────────────────────────────────────────
const filtered = computed(() =>
  allRiwayat.value.filter((r) => {
    const matchBulan = r.bulan === selectedBulan.value;
    const matchStatus = !filterStatus.value || r.status === filterStatus.value;
    return matchBulan && matchStatus;
  }),
);

const rekap = computed(() => {
  const data = filtered.value;
  const total = data.length;
  const hadir = data.filter((r) => r.status === "Hadir").length;
  const terlambat = data.filter((r) => r.status === "Terlambat").length;
  const izin = data.filter((r) => r.status === "Izin").length;
  const sakit = data.filter((r) => r.status === "Sakit").length;
  const alfa = data.filter((r) => r.status === "Alfa").length;
  const persen = total ? Math.round(((hadir + terlambat) / total) * 100) : 0;
  return { total, hadir, terlambat, izin, sakit, alfa, persen };
});

// ── Group by tanggal ──────────────────────────────────────────────────────
const groupedByDate = computed(() => {
  const groups = {};
  filtered.value.forEach((r) => {
    if (!groups[r.tanggal]) groups[r.tanggal] = { tanggal: r.tanggal, hari: r.hari, items: [] };
    groups[r.tanggal].items.push(r);
  });
  return Object.values(groups).sort((a, b) => b.tanggal.localeCompare(a.tanggal));
});

// ── Helpers ───────────────────────────────────────────────────────────────
const statusConfig = {
  Hadir: { cls: "badge-hadir", dot: "#16a34a" },
  Terlambat: { cls: "badge-terlambat", dot: "#9333ea" },
  Izin: { cls: "badge-izin", dot: "#d97706" },
  Sakit: { cls: "badge-sakit", dot: "#2563eb" },
  Alfa: { cls: "badge-alfa", dot: "#dc2626" },
};
function sc(s) {
  return statusConfig[s] ?? statusConfig.Hadir;
}

function formatTgl(str) {
  return new Date(str).toLocaleDateString("id-ID", {
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
        <!-- Header -->
        <div class="dash-header">
          <div>
            <h1 class="dash-title">Riwayat Absensi</h1>
            <p class="dash-sub">Rekap kehadiran per bulan · {{ authStore.user?.name }}</p>
          </div>
          <div class="header-right">
            <span class="dash-date">{{ today }}</span>
            <button class="btn btn-outline">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                />
              </svg>
              Ekspor PDF
            </button>
          </div>
        </div>

        <!-- Filter bar -->
        <div class="filter-bar">
          <select v-model="selectedBulan" class="filter-select">
            <option v-for="b in bulanOptions" :key="b.value" :value="b.value">{{ b.label }}</option>
          </select>
          <select v-model="filterStatus" class="filter-select">
            <option value="">Semua Status</option>
            <option>Hadir</option>
            <option>Terlambat</option>
            <option>Izin</option>
            <option>Sakit</option>
            <option>Alfa</option>
          </select>
          <span class="rec-badge">{{ filtered.length }} catatan</span>
        </div>

        <!-- Rekap cards -->
        <div class="rekap-grid">
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

        <!-- Timeline riwayat -->
        <div class="timeline-card">
          <div class="table-head-bar">
            <h3 class="table-title">Detail Per Hari</h3>
          </div>

          <div v-if="groupedByDate.length === 0" class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5"
              />
            </svg>
            <p>Tidak ada data untuk bulan ini</p>
          </div>

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
                      Jam masuk: <b>{{ item.jam }}</b>
                    </div>
                  </div>
                </div>
                <div class="item-right">
                  <span class="badge" :class="sc(item.status).cls">{{ item.status }}</span>
                  <span v-if="item.ket !== '—'" class="item-ket">{{ item.ket }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
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
  flex-wrap: wrap;
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

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  border: 1.5px solid #d1fae5;
  background: white;
  color: #374151;
  font-family: "Poppins", sans-serif;
  transition: all 0.15s;
}
.btn svg {
  width: 14px;
  height: 14px;
}
.btn-outline:hover {
  background: #f0fdf4;
}

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
