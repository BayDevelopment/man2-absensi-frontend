<script setup>
import { ref, computed } from "vue";
// import { useAuthStore } from "../../stores/auth";
import Sidebar from "../../components/AppSidebar.vue";
import Navbar from "../../components/AppNavbar.vue";
import AppFooter from "../../components/AppFooter.vue";

// const authStore = useAuthStore();
const sidebarOpen = ref(false);

const activeHari = ref("Senin");
const hariList = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];

const today = new Date().toLocaleDateString("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

// Deteksi hari aktif otomatis
const hariMap = { 1: "Senin", 2: "Selasa", 3: "Rabu", 4: "Kamis", 5: "Jumat" };
const todayKey = hariMap[new Date().getDay()];
if (todayKey) activeHari.value = todayKey;

// ── Warna per mapel ────────────────────────────────────────────────────────
const mapelColor = {
  Matematika: { bg: "#eff6ff", border: "#93c5fd", text: "#1d4ed8", icon: "📐" },
  "Bahasa Indonesia": { bg: "#fdf4ff", border: "#d8b4fe", text: "#7e22ce", icon: "📝" },
  Fisika: { bg: "#fff7ed", border: "#fed7aa", text: "#c2410c", icon: "⚛️" },
  Kimia: { bg: "#fefce8", border: "#fde047", text: "#a16207", icon: "🧪" },
  Biologi: { bg: "#f0fdf4", border: "#86efac", text: "#15803d", icon: "🌿" },
  Sejarah: { bg: "#fef2f2", border: "#fca5a5", text: "#b91c1c", icon: "🏛️" },
  "Bahasa Inggris": { bg: "#ecfeff", border: "#67e8f9", text: "#0e7490", icon: "🌐" },
  Ekonomi: { bg: "#fff7ed", border: "#fdba74", text: "#ea580c", icon: "📊" },
  Geografi: { bg: "#f0fdf4", border: "#6ee7b7", text: "#065f46", icon: "🗺️" },
  "Pendidikan Agama": { bg: "#fffbeb", border: "#fcd34d", text: "#92400e", icon: "🕌" },
  Olahraga: { bg: "#fdf4ff", border: "#c4b5fd", text: "#6d28d9", icon: "⚽" },
  "Seni Budaya": { bg: "#fef2f2", border: "#fca5a5", text: "#be123c", icon: "🎨" },
  PKN: { bg: "#eff6ff", border: "#93c5fd", text: "#1e40af", icon: "🏛️" },
  BK: { bg: "#f0fdf4", border: "#86efac", text: "#166534", icon: "💬" },
};
function getColor(matpel) {
  return mapelColor[matpel] ?? { bg: "#f9fafb", border: "#e5e7eb", text: "#374151", icon: "📚" };
}

// ── Jadwal lengkap ────────────────────────────────────────────────────────
const jadwal = {
  Senin: [
    { jam: "07:00–08:30", matpel: "Matematika", guru: "Bpk. Andi Wibowo", ruang: "R.101" },
    { jam: "08:30–10:00", matpel: "Bahasa Indonesia", guru: "Ibu Sri Wahyuni", ruang: "R.101" },
    { jam: "10:00–10:15", matpel: "", guru: "", ruang: "", isBreak: true, label: "Istirahat" },
    { jam: "10:15–11:45", matpel: "Fisika", guru: "Bpk. Rudi Hartono", ruang: "R.Lab.Fisika" },
    {
      jam: "11:45–13:00",
      matpel: "",
      guru: "",
      ruang: "",
      isBreak: true,
      label: "Istirahat & Sholat",
    },
    { jam: "13:00–14:30", matpel: "Kimia", guru: "Ibu Dewi Rahayu", ruang: "R.Lab.Kimia" },
    { jam: "14:30–16:00", matpel: "Bahasa Inggris", guru: "Ibu Nadia Putri", ruang: "R.102" },
  ],
  Selasa: [
    { jam: "07:00–08:30", matpel: "Biologi", guru: "Bpk. Hendra Saputra", ruang: "R.Lab.Bio" },
    { jam: "08:30–10:00", matpel: "Ekonomi", guru: "Ibu Laras Pertiwi", ruang: "R.103" },
    { jam: "10:00–10:15", matpel: "", guru: "", ruang: "", isBreak: true, label: "Istirahat" },
    { jam: "10:15–11:45", matpel: "Geografi", guru: "Bpk. Fajar Nugroho", ruang: "R.104" },
    {
      jam: "11:45–13:00",
      matpel: "",
      guru: "",
      ruang: "",
      isBreak: true,
      label: "Istirahat & Sholat",
    },
    { jam: "13:00–14:30", matpel: "Matematika", guru: "Bpk. Andi Wibowo", ruang: "R.101" },
  ],
  Rabu: [
    { jam: "07:00–08:30", matpel: "Sejarah", guru: "Ibu Fitri Handayani", ruang: "R.105" },
    { jam: "08:30–10:00", matpel: "PKN", guru: "Bpk. Usman Hadi", ruang: "R.105" },
    { jam: "10:00–10:15", matpel: "", guru: "", ruang: "", isBreak: true, label: "Istirahat" },
    { jam: "10:15–11:45", matpel: "Fisika", guru: "Bpk. Rudi Hartono", ruang: "R.Lab.Fisika" },
    {
      jam: "11:45–13:00",
      matpel: "",
      guru: "",
      ruang: "",
      isBreak: true,
      label: "Istirahat & Sholat",
    },
    { jam: "13:00–14:30", matpel: "Seni Budaya", guru: "Ibu Mega Lestari", ruang: "R.Seni" },
  ],
  Kamis: [
    { jam: "07:00–08:30", matpel: "Bahasa Inggris", guru: "Ibu Nadia Putri", ruang: "R.102" },
    { jam: "08:30–10:00", matpel: "Kimia", guru: "Ibu Dewi Rahayu", ruang: "R.Lab.Kimia" },
    { jam: "10:00–10:15", matpel: "", guru: "", ruang: "", isBreak: true, label: "Istirahat" },
    { jam: "10:15–11:45", matpel: "Biologi", guru: "Bpk. Hendra Saputra", ruang: "R.Lab.Bio" },
    {
      jam: "11:45–13:00",
      matpel: "",
      guru: "",
      ruang: "",
      isBreak: true,
      label: "Istirahat & Sholat",
    },
    { jam: "13:00–14:00", matpel: "BK", guru: "Ibu Ratna Dewi", ruang: "R.BK" },
  ],
  Jumat: [
    { jam: "07:00–08:30", matpel: "Pendidikan Agama", guru: "Bpk. Usman Hadi", ruang: "R.106" },
    { jam: "08:30–10:00", matpel: "Olahraga", guru: "Bpk. Fajar Nugroho", ruang: "Lapangan" },
    { jam: "10:00–10:15", matpel: "", guru: "", ruang: "", isBreak: true, label: "Istirahat" },
    { jam: "10:15–11:30", matpel: "Matematika", guru: "Bpk. Andi Wibowo", ruang: "R.101" },
  ],
};

const jadwalHariIni = computed(() => jadwal[activeHari.value] ?? []);

const totalJP = computed(() => jadwalHariIni.value.filter((j) => !j.isBreak).length);
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
            <p class="dash-sub">Kelas XII IPA 1 · Semester Ganjil 2025/2026</p>
          </div>
          <span class="dash-date">{{ today }}</span>
        </div>

        <!-- Info strip -->
        <div class="info-strip">
          <div class="info-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
              />
            </svg>
            <span>{{ totalJP }} Jam Pelajaran</span>
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
            <span>Gedung A – Lantai 1</span>
          </div>
          <div class="info-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>07:00 – 16:00 WIB</span>
          </div>
        </div>

        <!-- Hari tabs -->
        <div class="hari-tabs">
          <button
            v-for="h in hariList"
            :key="h"
            class="hari-tab"
            :class="{ active: activeHari === h, today: h === todayKey }"
            @click="activeHari = h"
          >
            {{ h }}
            <span v-if="h === todayKey" class="today-dot"></span>
          </button>
        </div>

        <!-- Jadwal list -->
        <div class="jadwal-card">
          <div class="jadwal-header">
            <h3 class="jadwal-title">{{ activeHari }}</h3>
            <span class="jadwal-sub"
              >{{ jadwalHariIni.filter((j) => !j.isBreak).length }} mata pelajaran</span
            >
          </div>

          <div class="jadwal-list">
            <div
              v-for="(item, i) in jadwalHariIni"
              :key="i"
              :class="item.isBreak ? 'jadwal-break' : 'jadwal-item'"
              :style="
                !item.isBreak
                  ? { '--ib': getColor(item.matpel).border, '--ibg': getColor(item.matpel).bg }
                  : {}
              "
            >
              <!-- Break slot -->
              <template v-if="item.isBreak">
                <span class="break-time">{{ item.jam }}</span>
                <span class="break-label">{{ item.label }}</span>
              </template>

              <!-- Pelajaran slot -->
              <template v-else>
                <div class="ji-time">{{ item.jam }}</div>
                <div class="ji-icon">{{ getColor(item.matpel).icon }}</div>
                <div class="ji-info">
                  <div class="ji-mapel" :style="{ color: getColor(item.matpel).text }">
                    {{ item.matpel }}
                  </div>
                  <div class="ji-meta">{{ item.guru }}</div>
                </div>
                <div class="ji-ruang">
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
}

.hari-tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.hari-tab {
  position: relative;
  padding: 8px 20px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  border: 1.5px solid #e5e7eb;
  background: white;
  color: #6b7280;
  font-family: "Poppins", sans-serif;
  transition: all 0.15s;
}
.hari-tab:hover {
  border-color: #16a34a;
  color: #16a34a;
  background: #f0fdf4;
}
.hari-tab.active {
  background: #16a34a;
  color: white;
  border-color: #16a34a;
}
.hari-tab.today:not(.active) {
  border-color: #16a34a;
  color: #16a34a;
}
.today-dot {
  position: absolute;
  top: 5px;
  right: 5px;
  width: 6px;
  height: 6px;
  background: #16a34a;
  border-radius: 50%;
}
.hari-tab.active .today-dot {
  background: white;
}

.jadwal-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  overflow: hidden;
}
.jadwal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid #f3f4f6;
}
.jadwal-title {
  font-size: 14px;
  font-weight: 700;
  color: #111827;
  margin: 0;
}
.jadwal-sub {
  font-size: 11.5px;
  color: #9ca3af;
}

.jadwal-list {
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

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
}
</style>
