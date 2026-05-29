<script setup>
import { ref, computed, onMounted } from "vue";
import Sidebar from "../../components/AppSidebar.vue";
import Navbar from "../../components/AppNavbar.vue";
import AppFooter from "../../components/AppFooter.vue";
import api from "@/plugins/axios";
import Swal from "sweetalert2";
import { useAppearanceStore } from "@/stores/useAppearanceStore";

// ============================================================================
// STORE & THEME
// ============================================================================
const appearanceStore = useAppearanceStore();
const sidebarOpen = ref(false);

const pageTheme = computed(() => appearanceStore.resolvedTheme || "light");
const isEn = computed(() => appearanceStore.language === "en");

// ============================================================================
// I18N
// ============================================================================
const t = computed(() =>
  isEn.value
    ? {
        title: "Class Schedule",
        sub: "Loading class…",
        subLoaded: (kelas, semester) => (semester ? `${kelas} · ${semester}` : kelas),
        jamPelajaran: "Lesson Hours",
        mataPlajaran: "subjects",
        noSchedule: (label) => `No schedule for ${label}.`,
        loading: "Loading schedule…",
        loadingDate: "Loading schedule for this date…",
        error: "Failed to load schedule.",
        alertTitle: "Failed to Load Schedule",
        alertConfirm: "Understood",
        errorDateMsg: "Schedule for this date failed to load.",
        noConnection: "Unable to connect to server. Please try again.",
        break: "Break",
      }
    : {
        title: "Jadwal Pelajaran",
        sub: "Memuat kelas…",
        subLoaded: (kelas, semester) => (semester ? `${kelas} · ${semester}` : kelas),
        jamPelajaran: "Jam Pelajaran",
        mataPlajaran: "mata pelajaran",
        noSchedule: (label) => `Tidak ada jadwal untuk ${label}.`,
        loading: "Memuat jadwal…",
        loadingDate: "Memuat jadwal tanggal ini…",
        error: "Tidak dapat terhubung ke server. Silakan coba lagi.",
        alertTitle: "Gagal Memuat Jadwal",
        alertConfirm: "Mengerti",
        errorDateMsg: "Jadwal pada tanggal ini gagal dimuat.",
        noConnection: "Tidak dapat terhubung ke server. Silakan coba lagi.",
        break: "Istirahat",
      },
);

// ============================================================================
// DATE UTILS
// ============================================================================
const now = new Date();

const today = computed(() =>
  now.toLocaleDateString(isEn.value ? "en-US" : "id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }),
);

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getHariLabel(date) {
  return date.toLocaleDateString(isEn.value ? "en-US" : "id-ID", {
    weekday: "long",
  });
}

function getSchoolDates(totalHari = 6) {
  const dates = [];
  const cursor = new Date(now);

  while (dates.length < totalHari) {
    const hari = cursor.getDay();
    if (hari !== 0) {
      dates.push({
        tanggalKey: formatDateKey(cursor),
        tanggal: new Date(cursor),
        hari: getHariLabel(cursor),
      });
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

// ============================================================================
// STATE
// ============================================================================
const weekDates = computed(() => getSchoolDates(6));
const activeTanggal = ref(formatDateKey(now));

const jadwalData = ref({});
const kelasNama = ref("");
const semesterNama = ref("");
const totalJamPelajaranGlobal = ref(0);
const ruangUtama = ref("");
const jamOperasional = ref("");
const isLoading = ref(true);
const isLoadingTanggal = ref(false);
const errorMsg = ref("");

// ============================================================================
// COMPUTED — ACTIVE DATE
// ============================================================================
const activeDateObj = computed(() => {
  const item = weekDates.value.find((d) => d.tanggalKey === activeTanggal.value);
  return item?.tanggal ?? now;
});

const activeHari = computed(() => {
  const item = weekDates.value.find((d) => d.tanggalKey === activeTanggal.value);
  return item?.hari ?? getHariLabel(activeDateObj.value);
});

const activeDateLabel = computed(() =>
  activeDateObj.value.toLocaleDateString(isEn.value ? "en-US" : "id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }),
);

// ============================================================================
// MAPEL STYLE
// ============================================================================
const mapelStyle = {
  Matematika: { bg: "#eff6ff", border: "#93c5fd", text: "#1d4ed8", icon: "📐" },
  "Bahasa Indonesia": { bg: "#fdf4ff", border: "#d8b4fe", text: "#7e22ce", icon: "📝" },
  Fisika: { bg: "#fff7ed", border: "#fed7aa", text: "#c2410c", icon: "⚛️" },
  Kimia: { bg: "#fefce8", border: "#fde047", text: "#a16207", icon: "🧪" },
  Biologi: { bg: "#f0fdf4", border: "#86efac", text: "#15803d", icon: "🌿" },
  Sejarah: { bg: "#fef2f2", border: "#fca5a5", text: "#b91c1c", icon: "🏛️" },
  "Bahasa Inggris": { bg: "#ecfeff", border: "#67e8f9", text: "#0e7490", icon: "🌐" },
  Ekonomi: { bg: "#fff7ed", border: "#fdba74", text: "#ea580c", icon: "📊" },
  Geografi: { bg: "#f0fdf4", border: "#6ee7b7", text: "#065f46", icon: "🗺️" },
  "Pendidikan Agama": { bg: "#fffbeb", border: "#fcd34d", text: "#92400e", icon: "📖" },
  Olahraga: { bg: "#fdf4ff", border: "#c4b5fd", text: "#6d28d9", icon: "⚽" },
  "Seni Budaya": { bg: "#fef2f2", border: "#fca5a5", text: "#be123c", icon: "🎨" },
  PKN: { bg: "#eff6ff", border: "#93c5fd", text: "#1e40af", icon: "🏛️" },
  BK: { bg: "#f0fdf4", border: "#86efac", text: "#166534", icon: "💬" },
};

function getStyle(matpel) {
  return mapelStyle[matpel] ?? { bg: "#f9fafb", border: "#e5e7eb", text: "#374151", icon: "📚" };
}

// ============================================================================
// SWEETALERT — THEME AWARE
// ============================================================================
function showErrorAlert(message) {
  const isDark = pageTheme.value === "dark";
  Swal.fire({
    icon: "error",
    title: t.value.alertTitle,
    text: message,
    confirmButtonText: t.value.alertConfirm,
    confirmButtonColor: "#16a34a",
    background: isDark ? "#1a1d2e" : undefined,
    color: isDark ? "#e8eaf6" : undefined,
  });
}

// ============================================================================
// FETCH
// ============================================================================
async function fetchJadwalRange() {
  isLoading.value = true;
  errorMsg.value = "";

  try {
    const { data } = await api.get("/api/jadwal", {
      params: { start_date: weekDates.value[0]?.tanggalKey },
    });

    if (data.status === "success") {
      jadwalData.value = data.jadwal ?? {};
      kelasNama.value = data.kelas ?? "";
      semesterNama.value = data.semester ?? "";
      totalJamPelajaranGlobal.value = data.total_jam_pelajaran ?? 0;
      ruangUtama.value = data.ruang_utama ?? "";
      jamOperasional.value = data.jam_operasional ?? "";

      // set active ke hari pertama minggu jika belum ada
      if (!activeTanggal.value && weekDates.value.length > 0) {
        activeTanggal.value = weekDates.value[0].tanggalKey;
      }
      return;
    }

    errorMsg.value = data.message ?? t.value.error;
    showErrorAlert(errorMsg.value);
  } catch (err) {
    errorMsg.value = err.response?.data?.message ?? t.value.noConnection;
    showErrorAlert(errorMsg.value);
    console.error("Fetch jadwal error:", err);
  } finally {
    isLoading.value = false;
  }
}

async function fetchJadwalByTanggal(tanggalKey) {
  activeTanggal.value = tanggalKey;

  if (jadwalData.value[tanggalKey]) return;

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

    showErrorAlert(data.message ?? t.value.errorDateMsg);
  } catch (err) {
    showErrorAlert(err.response?.data?.message ?? t.value.errorDateMsg);
    console.error("Fetch jadwal tanggal error:", err);
  } finally {
    isLoadingTanggal.value = false;
  }
}

onMounted(() => {
  activeTanggal.value = formatDateKey(now);
  fetchJadwalRange();
});

// ============================================================================
// COMPUTED — HARI AKTIF
// ============================================================================
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

const jadwalHariIni = computed(() => hariPayload.value.items ?? []);

const infoJP = computed(() => hariPayload.value.jam_pelajaran ?? 0);

const infoRuang = computed(() => {
  const item = jadwalHariIni.value.find((j) => !j.is_break && j.ruang);
  return item?.ruang ?? "–";
});

const infoJam = computed(() => {
  if (!jadwalHariIni.value.length) return "–";
  const mulai = hariPayload.value.jam_mulai;
  const selesai = hariPayload.value.jam_selesai;
  return mulai && selesai ? `${mulai} – ${selesai} WIB` : "–";
});

function getDotsForTanggal(tanggalKey) {
  return (jadwalData.value[tanggalKey]?.items ?? []).slice(0, 5);
}

// Short day name (3 chars, language-aware)
function shortDayName(hariStr) {
  return hariStr.substring(0, 3);
}
</script>

<template>
  <div class="layout-root" :data-theme="pageTheme">
    <Sidebar :open="sidebarOpen" @close="sidebarOpen = false" />
    <div class="layout-main">
      <Navbar @toggle-sidebar="sidebarOpen = !sidebarOpen" />
      <main class="layout-content">
        <!-- ── Header ── -->
        <div class="dash-header">
          <div>
            <h1 class="dash-title">{{ t.title }}</h1>
            <p class="dash-sub">
              <template v-if="kelasNama">
                {{ t.subLoaded(kelasNama, semesterNama) }}
              </template>
              <template v-else>{{ t.sub }}</template>
            </p>
          </div>
          <span class="dash-date">{{ today }}</span>
        </div>

        <!-- ── Info Strip ── -->
        <div class="info-strip">
          <div class="info-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
              />
            </svg>
            <span>{{ infoJP }} {{ t.jamPelajaran }}</span>
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
            <span>{{ infoJam }}</span>
          </div>
        </div>

        <!-- ── Kalender Mini Mingguan ── -->
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
            <span class="cal-day-name">{{ shortDayName(item.hari) }}</span>
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

        <!-- ── Loading State ── -->
        <div v-if="isLoading" class="state-box">
          <div class="spinner"></div>
          <span>{{ t.loading }}</span>
        </div>

        <!-- ── Error State ── -->
        <div v-else-if="errorMsg" class="state-box error">
          <span>⚠️ {{ errorMsg }}</span>
        </div>

        <!-- ── Loading Tanggal ── -->
        <div v-else-if="isLoadingTanggal" class="state-box">
          <div class="spinner"></div>
          <span>{{ t.loadingDate }}</span>
        </div>

        <!-- ── Jadwal Card ── -->
        <div v-else class="jadwal-card">
          <div class="jadwal-header">
            <div>
              <h3 class="jadwal-title">{{ activeHari }}</h3>
              <p class="jadwal-date-label">{{ activeDateLabel }}</p>
            </div>
            <span class="jadwal-sub">
              {{ jadwalHariIni.filter((j) => !j.is_break).length }} {{ t.mataPlajaran }}
            </span>
          </div>

          <!-- Kosong -->
          <div v-if="jadwalHariIni.length === 0" class="state-box">
            <span>{{ t.noSchedule(activeDateLabel) }}</span>
          </div>

          <!-- List -->
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
                <span class="break-label">☕ {{ t.break }}</span>
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
/* ============================================================================
   BASE
============================================================================ */
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

/* ── Kalender mini ── */
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

/* Break */
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

/* Pelajaran */
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

/* ============================================================================
   DARK MODE
============================================================================ */
.layout-root[data-theme="dark"] {
  background: #10111a;
  color: #e8eaf6;
}
.layout-root[data-theme="dark"] .layout-content {
  background: #10111a;
}

/* Header */
.layout-root[data-theme="dark"] .dash-title {
  color: #4ade80;
}
.layout-root[data-theme="dark"] .dash-sub {
  color: #9ca3af;
}
.layout-root[data-theme="dark"] .dash-date {
  background: #14532d;
  color: #4ade80;
}

/* Info strip */
.layout-root[data-theme="dark"] .info-item {
  color: #9ca3af;
}
.layout-root[data-theme="dark"] .info-item svg {
  stroke: #4ade80;
}

/* Week calendar */
.layout-root[data-theme="dark"] .week-calendar {
  background: #1a1d2e;
  border-color: #2c2f45;
}
.layout-root[data-theme="dark"] .cal-day {
  border-right-color: #2c2f45;
}
.layout-root[data-theme="dark"] .cal-day:hover {
  background: #1f2235;
}
.layout-root[data-theme="dark"] .cal-day.cal-active {
  background: #1e2d1e;
}
.layout-root[data-theme="dark"] .cal-day-name {
  color: #6b7280;
}
.layout-root[data-theme="dark"] .cal-day.cal-active .cal-day-name {
  color: #4ade80;
}
.layout-root[data-theme="dark"] .cal-date-num {
  color: #c7d2fe;
}
.layout-root[data-theme="dark"] .cal-day.cal-active .cal-date-num:not(.is-today) {
  color: #4ade80;
}
.layout-root[data-theme="dark"] .cal-date-num.is-today {
  background: #16a34a;
  color: white;
}
.layout-root[data-theme="dark"] .cal-dot {
  background: #166534;
}
.layout-root[data-theme="dark"] .cal-dot.dot-break {
  background: #78350f;
}

/* State box */
.layout-root[data-theme="dark"] .state-box {
  background: #1a1d2e;
  border-color: #2c2f45;
  color: #6b7280;
}
.layout-root[data-theme="dark"] .state-box.error {
  background: rgba(220, 38, 38, 0.1);
  border-color: rgba(220, 38, 38, 0.3);
  color: #f87171;
}
.layout-root[data-theme="dark"] .spinner {
  border-color: #1e2d1e;
  border-top-color: #4ade80;
}

/* Jadwal card */
.layout-root[data-theme="dark"] .jadwal-card {
  background: #1a1d2e;
  border-color: #2c2f45;
}
.layout-root[data-theme="dark"] .jadwal-header {
  border-bottom-color: #2c2f45;
}
.layout-root[data-theme="dark"] .jadwal-title {
  color: #e8eaf6;
}
.layout-root[data-theme="dark"] .jadwal-date-label {
  color: #6b7280;
}
.layout-root[data-theme="dark"] .jadwal-sub {
  color: #6b7280;
}

/* Break dark */
.layout-root[data-theme="dark"] .jadwal-break {
  background: #14162a;
}
.layout-root[data-theme="dark"] .break-time {
  color: #6b7280;
}
.layout-root[data-theme="dark"] .break-label {
  color: #fbbf24;
}

/* Pelajaran dark — overlay gelap di atas warna bg terang */
.layout-root[data-theme="dark"] .jadwal-item {
  background: rgba(255, 255, 255, 0.04);
  border-left-color: var(--ib);
}
.layout-root[data-theme="dark"] .jadwal-item:hover {
  background: rgba(255, 255, 255, 0.07);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}
.layout-root[data-theme="dark"] .ji-time {
  color: #6b7280;
}
.layout-root[data-theme="dark"] .ji-meta {
  color: #6b7280;
}
.layout-root[data-theme="dark"] .ji-ruang {
  color: #9ca3af;
}
.layout-root[data-theme="dark"] .ji-ruang svg {
  stroke: #4ade80;
}

/* ============================================================================
   RESPONSIVE
============================================================================ */
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
  .week-calendar {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
