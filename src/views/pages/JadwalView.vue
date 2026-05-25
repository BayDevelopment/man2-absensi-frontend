<script setup>
import { ref, computed, onMounted } from "vue";
import Sidebar from "../../components/AppSidebar.vue";
import Navbar from "../../components/AppNavbar.vue";
import AppFooter from "../../components/AppFooter.vue";
import api from "@/plugins/axios";
import Swal from "sweetalert2";

const sidebarOpen = ref(false);

const now = new Date();

const today = now.toLocaleDateString("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getHariIndonesia(date) {
  return date.toLocaleDateString("id-ID", {
    weekday: "long",
  });
}

// Ambil 6 hari sekolah mulai dari hari ini.
// Minggu dilewati.
function getSchoolDates(totalHari = 6) {
  const dates = [];
  const cursor = new Date(now);

  while (dates.length < totalHari) {
    const hari = cursor.getDay();

    // 0 = Minggu, dilewati
    if (hari !== 0) {
      dates.push({
        tanggalKey: formatDateKey(cursor),
        tanggal: new Date(cursor),
        hari: getHariIndonesia(cursor),
      });
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

const weekDates = getSchoolDates(6);
const activeTanggal = ref(weekDates[0]?.tanggalKey ?? formatDateKey(now));

const jadwalData = ref({});
const kelasNama = ref("");
const semesterNama = ref("");
const totalJamPelajaranGlobal = ref(0);
const ruangUtama = ref("");
const jamOperasional = ref("");
const isLoading = ref(true);
const isLoadingTanggal = ref(false);
const errorMsg = ref("");

const activeDateObj = computed(() => {
  const item = weekDates.find((data) => data.tanggalKey === activeTanggal.value);
  return item?.tanggal ?? now;
});

const activeHari = computed(() => {
  const item = weekDates.find((data) => data.tanggalKey === activeTanggal.value);
  return item?.hari ?? getHariIndonesia(activeDateObj.value);
});

const activeDateLabel = computed(() =>
  activeDateObj.value.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }),
);

const mapelStyle = {
  Matematika: {
    bg: "#eff6ff",
    border: "#93c5fd",
    text: "#1d4ed8",
    icon: "📐",
  },
  "Bahasa Indonesia": {
    bg: "#fdf4ff",
    border: "#d8b4fe",
    text: "#7e22ce",
    icon: "📝",
  },
  Fisika: {
    bg: "#fff7ed",
    border: "#fed7aa",
    text: "#c2410c",
    icon: "⚛️",
  },
  Kimia: {
    bg: "#fefce8",
    border: "#fde047",
    text: "#a16207",
    icon: "🧪",
  },
  Biologi: {
    bg: "#f0fdf4",
    border: "#86efac",
    text: "#15803d",
    icon: "🌿",
  },
  Sejarah: {
    bg: "#fef2f2",
    border: "#fca5a5",
    text: "#b91c1c",
    icon: "🏛️",
  },
  "Bahasa Inggris": {
    bg: "#ecfeff",
    border: "#67e8f9",
    text: "#0e7490",
    icon: "🌐",
  },
  Ekonomi: {
    bg: "#fff7ed",
    border: "#fdba74",
    text: "#ea580c",
    icon: "📊",
  },
  Geografi: {
    bg: "#f0fdf4",
    border: "#6ee7b7",
    text: "#065f46",
    icon: "🗺️",
  },
  "Pendidikan Agama": {
    bg: "#fffbeb",
    border: "#fcd34d",
    text: "#92400e",
    icon: "📖",
  },
  Olahraga: {
    bg: "#fdf4ff",
    border: "#c4b5fd",
    text: "#6d28d9",
    icon: "⚽",
  },
  "Seni Budaya": {
    bg: "#fef2f2",
    border: "#fca5a5",
    text: "#be123c",
    icon: "🎨",
  },
  PKN: {
    bg: "#eff6ff",
    border: "#93c5fd",
    text: "#1e40af",
    icon: "🏛️",
  },
  BK: {
    bg: "#f0fdf4",
    border: "#86efac",
    text: "#166534",
    icon: "💬",
  },
};

function getStyle(matpel) {
  return (
    mapelStyle[matpel] ?? {
      bg: "#f9fafb",
      border: "#e5e7eb",
      text: "#374151",
      icon: "📚",
    }
  );
}

function showErrorAlert(message = "Terjadi kesalahan saat memuat jadwal.") {
  Swal.fire({
    icon: "error",
    title: "Gagal Memuat Jadwal",
    text: message,
    confirmButtonText: "Mengerti",
    confirmButtonColor: "#16a34a",
  });
}

async function fetchJadwalRange() {
  isLoading.value = true;
  errorMsg.value = "";

  try {
    const { data } = await api.get("/api/jadwal", {
      params: {
        start_date: weekDates[0]?.tanggalKey,
      },
    });

    if (data.status === "success") {
      jadwalData.value = data.jadwal ?? {};
      kelasNama.value = data.kelas ?? "";
      semesterNama.value = data.semester ?? "";
      totalJamPelajaranGlobal.value = data.total_jam_pelajaran ?? 0;
      ruangUtama.value = data.ruang_utama ?? "";
      jamOperasional.value = data.jam_operasional ?? "";
      return;
    }

    errorMsg.value = data.message ?? "Gagal memuat jadwal.";
    showErrorAlert(errorMsg.value);
  } catch (err) {
    errorMsg.value =
      err.response?.data?.message ?? "Tidak dapat terhubung ke server. Silakan coba lagi.";

    showErrorAlert(errorMsg.value);
    console.error("Fetch jadwal error:", err);
  } finally {
    isLoading.value = false;
  }
}

async function fetchJadwalByTanggal(tanggalKey) {
  activeTanggal.value = tanggalKey;

  // Kalau data tanggal sudah ada dari /api/jadwal, tidak perlu request ulang.
  if (jadwalData.value[tanggalKey]) {
    return;
  }

  isLoadingTanggal.value = true;

  try {
    const { data } = await api.get(`/api/jadwal/tanggal/${tanggalKey}`);

    if (data.status === "success") {
      jadwalData.value[tanggalKey] = {
        tanggal: data.tanggal,
        hari: data.hari,
        jam_pelajaran: data.jam_pelajaran,
        jam_mulai: data.jam_mulai,
        jam_selesai: data.jam_selesai,
        items: data.data ?? [],
      };

      return;
    }

    showErrorAlert(data.message ?? "Jadwal pada tanggal ini gagal dimuat.");
  } catch (err) {
    showErrorAlert(err.response?.data?.message ?? "Tidak dapat memuat jadwal pada tanggal ini.");

    console.error("Fetch jadwal tanggal error:", err);
  } finally {
    isLoadingTanggal.value = false;
  }
}

onMounted(() => {
  fetchJadwalRange();
});

const hariPayload = computed(() => {
  return (
    jadwalData.value[activeTanggal.value] ?? {
      tanggal: activeTanggal.value,
      hari: activeHari.value,
      jam_pelajaran: 0,
      jam_mulai: null,
      jam_selesai: null,
      items: [],
    }
  );
});

const jadwalHariIni = computed(() => {
  return hariPayload.value.items ?? [];
});

const infoJP = computed(() => {
  return hariPayload.value.jam_pelajaran ?? 0;
});

const infoRuang = computed(() => {
  const item = jadwalHariIni.value.find((jadwal) => {
    return !jadwal.is_break && jadwal.ruang;
  });

  return item?.ruang ?? "–";
});

const infoJam = computed(() => {
  if (!jadwalHariIni.value.length) {
    return "–";
  }

  const mulai = hariPayload.value.jam_mulai;
  const selesai = hariPayload.value.jam_selesai;

  if (mulai && selesai) {
    return `${mulai} – ${selesai} WIB`;
  }

  return "–";
});

function getDotsForTanggal(tanggalKey) {
  return (jadwalData.value[tanggalKey]?.items ?? []).slice(0, 5);
}
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
            <h1 class="dash-title">Jadwal Pelajaran</h1>
            <!-- Kelas & semester dari API -->
            <p class="dash-sub">
              {{ kelasNama || "Memuat kelas…" }}
              <template v-if="semesterNama"> · {{ semesterNama }}</template>
            </p>
          </div>
          <span class="dash-date">{{ today }}</span>
        </div>

        <!-- Info strip — dinamis per hari dipilih -->
        <div class="info-strip">
          <div class="info-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
              />
            </svg>
            <!-- JP dari hari aktif, bukan hardcode 0 -->
            <span>{{ infoJP }} Jam Pelajaran</span>
          </div>
          <div class="info-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
            <!-- Ruang dari hari aktif, bukan hardcode -->
            <span>{{ infoRuang }}</span>
          </div>
          <div class="info-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <!-- Jam operasional dari hari aktif, bukan hardcode -->
            <span>{{ infoJam }}</span>
          </div>
        </div>

        <!-- ── Kalender mini mingguan ── -->
        <div class="week-calendar">
          <div
            v-for="item in weekDates"
            :key="item.tanggalKey"
            class="cal-day"
            :class="{
              'cal-active': activeTanggal === item.tanggalKey,
              'cal-today': item.tanggalKey === formatDateKey(now),
            }"
            @click="fetchJadwalByTanggal(item.tanggalKey)"
          >
            <span class="cal-day-name">{{ item.hari.substring(0, 3) }}</span>

            <span
              class="cal-date-num"
              :class="{ 'is-today': item.tanggalKey === formatDateKey(now) }"
            >
              {{ item.tanggal.getDate() }}
            </span>

            <div class="cal-dots">
              <span
                v-for="(dot, di) in getDotsForTanggal(item.tanggalKey).slice(0, 4)"
                :key="di"
                class="cal-dot"
                :class="{ 'dot-break': dot.is_break }"
              ></span>
            </div>
          </div>
        </div>

        <!-- Loading state -->
        <div v-if="isLoading" class="state-box">
          <div class="spinner"></div>
          <span>Memuat jadwal…</span>
        </div>

        <!-- Error state -->
        <div v-else-if="errorMsg" class="state-box error">
          <span>⚠️ {{ errorMsg }}</span>
        </div>

        <div v-else-if="isLoadingTanggal" class="state-box">
          <div class="spinner"></div>
          <span>Memuat jadwal tanggal ini…</span>
        </div>

        <!-- Jadwal card -->
        <div v-else class="jadwal-card">
          <div class="jadwal-header">
            <div>
              <h3 class="jadwal-title">{{ activeHari }}</h3>
              <!-- Tanggal lengkap hari aktif — tidak ada ambiguitas hari mana -->
              <p class="jadwal-date-label">{{ activeDateLabel }}</p>
            </div>
            <span class="jadwal-sub">
              {{ jadwalHariIni.filter((j) => !j.is_break).length }} mata pelajaran
            </span>
          </div>

          <!-- Kosong -->
          <div v-if="jadwalHariIni.length === 0" class="state-box">
            <span>Tidak ada jadwal untuk {{ activeDateLabel }}.</span>
          </div>

          <!-- List jadwal -->
          <div v-else class="jadwal-list">
            <div
              v-for="(item, i) in jadwalHariIni"
              :key="i"
              :class="item.is_break ? 'jadwal-break' : 'jadwal-item'"
              :style="
                !item.is_break
                  ? { '--ib': getStyle(item.matpel).border, '--ibg': getStyle(item.matpel).bg }
                  : {}
              "
            >
              <!-- Break slot -->
              <template v-if="item.is_break">
                <span class="break-time">{{ item.jam }}</span>
                <span class="break-label">☕ {{ item.label }}</span>
              </template>

              <!-- Pelajaran slot -->
              <template v-else>
                <div class="ji-time">{{ item.jam }}</div>
                <div class="ji-icon">{{ getStyle(item.matpel).icon }}</div>
                <div class="ji-info">
                  <div class="ji-mapel" :style="{ color: getStyle(item.matpel).text }">
                    {{ item.matpel }}
                  </div>
                  <div class="ji-meta">{{ item.guru }}</div>
                </div>
                <div v-if="item.ruang" class="ji-ruang">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819"
                    />
                  </svg>
                  {{ item.ruang }}
                </div>
              </template>
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
.dash-date {
  font-size: 12px;
  font-weight: 600;
  color: #16a34a;
  background: #dcfce7;
  padding: 5px 12px;
  border-radius: 20px;
  white-space: nowrap;
  align-self: flex-start;
}

/* ── Info strip ── */
.info-strip {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}
.info-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  color: #6b7280;
  font-weight: 500;
}
.info-item svg {
  width: 15px;
  height: 15px;
  stroke: #16a34a;
  flex-shrink: 0;
}

/* ── Kalender mini mingguan ── */
.week-calendar {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  overflow: hidden;
}
.cal-day {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 8px;
  cursor: pointer;
  border-right: 1px solid #f3f4f6;
  transition: background 0.13s;
  gap: 4px;
  user-select: none;
}
.cal-day:last-child {
  border-right: none;
}
.cal-day:hover {
  background: #f9fafb;
}
.cal-day.cal-active {
  background: #f0fdf4;
}
.cal-day-name {
  font-size: 10.5px;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.cal-day.cal-active .cal-day-name {
  color: #15803d;
}
.cal-date-num {
  font-size: 17px;
  font-weight: 600;
  color: #374151;
  line-height: 1;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}
.cal-day.cal-active .cal-date-num:not(.is-today) {
  color: #166534;
}
.cal-date-num.is-today {
  background: #16a34a;
  color: white;
}
/* Dots indikator jadwal */
.cal-dots {
  display: flex;
  gap: 3px;
  height: 6px;
  align-items: center;
  margin-top: 2px;
}
.cal-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #86efac;
}
.cal-dot.dot-break {
  background: #fde68a;
}

/* ── State box ── */
.state-box {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 40px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  color: #9ca3af;
  font-size: 13px;
  font-weight: 500;
}
.state-box.error {
  color: #b91c1c;
  background: #fef2f2;
  border-color: #fca5a5;
}
.spinner {
  width: 18px;
  height: 18px;
  border: 2.5px solid #d1fae5;
  border-top-color: #16a34a;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ── Jadwal card ── */
.jadwal-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  overflow: hidden;
}
.jadwal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid #f3f4f6;
}
.jadwal-title {
  font-size: 14px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 2px;
}
/* Tanggal lengkap hari aktif — menghilangkan ambiguitas */
.jadwal-date-label {
  font-size: 11.5px;
  color: #9ca3af;
  margin: 0;
}
.jadwal-sub {
  font-size: 11.5px;
  color: #9ca3af;
  white-space: nowrap;
}
.jadwal-list {
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Break slot */
.jadwal-break {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 12px;
  background: #f9fafb;
  border-radius: 8px;
}
.break-time {
  font-size: 11px;
  color: #9ca3af;
  font-weight: 600;
  min-width: 100px;
}
.break-label {
  font-size: 11.5px;
  color: #d97706;
  font-weight: 600;
}

/* Pelajaran slot */
.jadwal-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border-radius: 12px;
  border-left: 4px solid var(--ib);
  background: var(--ibg);
  transition: all 0.15s;
}
.jadwal-item:hover {
  transform: translateX(3px);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
}
.ji-time {
  font-size: 11px;
  color: #9ca3af;
  font-weight: 600;
  min-width: 100px;
  white-space: nowrap;
}
.ji-icon {
  font-size: 20px;
  flex-shrink: 0;
}
.ji-info {
  flex: 1;
  min-width: 0;
}
.ji-mapel {
  font-size: 13.5px;
  font-weight: 700;
}
.ji-meta {
  font-size: 11.5px;
  color: #9ca3af;
  margin-top: 2px;
}
.ji-ruang {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11.5px;
  color: #6b7280;
  font-weight: 600;
  white-space: nowrap;
}
.ji-ruang svg {
  width: 13px;
  height: 13px;
  stroke: #16a34a;
  flex-shrink: 0;
}

@media (max-width: 640px) {
  .layout-content {
    padding: 14px;
    gap: 14px;
  }
  .dash-date {
    display: none;
  }
  .ji-time {
    min-width: 80px;
    font-size: 10px;
  }
  .jadwal-item {
    gap: 8px;
    padding: 10px 12px;
  }
  .ji-ruang {
    display: none;
  }
  .cal-day-name {
    font-size: 9px;
  }
  .cal-date-num {
    font-size: 14px;
    width: 26px;
    height: 26px;
  }
}
@media (max-width: 640px) {
  .week-calendar {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
