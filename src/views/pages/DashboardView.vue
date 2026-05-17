<script setup>
import { ref } from "vue";
import { useAuthStore } from "../../stores/auth";
import Sidebar from "../../components/AppSidebar.vue";
import Navbar from "../../components/AppNavbar.vue";
import AppFooter from "../../components/AppFooter.vue";

const authStore = useAuthStore();
const sidebarOpen = ref(false);

// Data dummy — ganti dengan API call nanti
const stats = [
  {
    label: "Hadir Bulan Ini",
    value: "24",
    suffix: "",
    trend: "+2%",
    trendUp: true,
    color: "#16a34a",
    bg: "#f0fdf4",
    icon: `<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>`,
  },
  {
    label: "Kehadiran",
    value: "96",
    suffix: "%",
    trend: "96%",
    trendUp: true,
    color: "#2563eb",
    bg: "#eff6ff",
    icon: `<path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>`,
  },
  {
    label: "Izin / Sakit",
    value: "1",
    suffix: "",
    badge: "1 izin",
    badgeColor: "#f59e0b",
    color: "#d97706",
    bg: "#fffbeb",
    icon: `<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/>`,
  },
  {
    label: "Tidak Hadir",
    value: "0",
    suffix: "",
    badge: "0 alfa",
    badgeColor: "#ef4444",
    color: "#dc2626",
    bg: "#fef2f2",
    icon: `<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>`,
  },
];

const recentAttendance = [
  {
    name: "Ahmad Rafi",
    time: "07:15",
    subject: "Matematika",
    status: "Hadir",
    statusColor: "#16a34a",
    statusBg: "#f0fdf4",
    initials: "AR",
    avatarColor: "#16a34a",
  },
  {
    name: "Siti Rahayu",
    time: "07:20",
    subject: "Bahasa Indonesia",
    status: "Izin",
    statusColor: "#d97706",
    statusBg: "#fffbeb",
    initials: "SR",
    avatarColor: "#2563eb",
  },
  {
    name: "Budi Kurniawan",
    time: "07:10",
    subject: "Fisika",
    status: "Hadir",
    statusColor: "#16a34a",
    statusBg: "#f0fdf4",
    initials: "BK",
    avatarColor: "#7c3aed",
  },
  {
    name: "Dewi Lestari",
    time: "07:30",
    subject: "Kimia",
    status: "Hadir",
    statusColor: "#16a34a",
    statusBg: "#f0fdf4",
    initials: "DL",
    avatarColor: "#db2777",
  },
];

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
            <h1 class="dash-title">Dashboard</h1>
            <p class="dash-sub">Selamat datang kembali, {{ authStore.user?.name }} 👋</p>
          </div>
          <span class="dash-date">{{ today }}</span>
        </div>

        <!-- Stats cards -->
        <div class="stats-grid">
          <div
            v-for="stat in stats"
            :key="stat.label"
            class="stat-card"
            :style="{ '--card-color': stat.color, '--card-bg': stat.bg }"
          >
            <div class="stat-top">
              <div class="stat-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                  v-html="stat.icon"
                />
              </div>
              <span
                v-if="stat.badge"
                class="stat-badge"
                :style="{
                  color: stat.badgeColor,
                  background: stat.bg,
                  border: `1px solid ${stat.badgeColor}33`,
                }"
              >
                {{ stat.badge }}
              </span>
              <span v-else class="stat-trend" :class="{ up: stat.trendUp }">
                ↑ {{ stat.trend }}
              </span>
            </div>
            <div class="stat-value">
              {{ stat.value }}<span class="stat-suffix">{{ stat.suffix }}</span>
            </div>
            <div class="stat-label">{{ stat.label }}</div>
          </div>
        </div>

        <!-- Bottom grid -->
        <div class="bottom-grid">
          <!-- Kehadiran Terkini -->
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">Kehadiran Terkini</h3>
              <a href="#" class="card-link">Lihat semua →</a>
            </div>
            <div class="attendance-list">
              <div v-for="item in recentAttendance" :key="item.name" class="attendance-item">
                <div class="att-avatar" :style="{ background: item.avatarColor }">
                  {{ item.initials }}
                </div>
                <div class="att-info">
                  <span class="att-name">{{ item.name }}</span>
                  <span class="att-meta">{{ item.time }} · {{ item.subject }}</span>
                </div>
                <span
                  class="att-status"
                  :style="{ color: item.statusColor, background: item.statusBg }"
                >
                  {{ item.status }}
                </span>
              </div>
            </div>
          </div>

          <!-- Rekap Kehadiran -->
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">Rekap Kehadiran</h3>
              <a href="#" class="card-link">Detail →</a>
            </div>

            <div class="rekap-list">
              <div class="rekap-item">
                <div class="rekap-row">
                  <span class="rekap-label">Hadir</span>
                  <span class="rekap-pct" style="color: #16a34a">96%</span>
                </div>
                <div class="rekap-bar-bg">
                  <div class="rekap-bar-fill" style="width: 96%; background: #16a34a" />
                </div>
              </div>
              <div class="rekap-item">
                <div class="rekap-row">
                  <span class="rekap-label">Izin / Sakit</span>
                  <span class="rekap-pct" style="color: #d97706">3%</span>
                </div>
                <div class="rekap-bar-bg">
                  <div class="rekap-bar-fill" style="width: 3%; background: #d97706" />
                </div>
              </div>
              <div class="rekap-item">
                <div class="rekap-row">
                  <span class="rekap-label">Alfa</span>
                  <span class="rekap-pct" style="color: #ef4444">1%</span>
                </div>
                <div class="rekap-bar-bg">
                  <div class="rekap-bar-fill" style="width: 1%; background: #ef4444" />
                </div>
              </div>
            </div>

            <!-- Status -->
            <div class="status-box">
              <p class="status-label">Status Kehadiran</p>
              <p class="status-value">Sangat Baik</p>
              <p class="status-desc">Pertahankan kehadiran kamu! 🎉</p>
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
  gap: 24px;
}

/* Header */
.dash-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
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

/* Stats */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}
.stat-card {
  background: white;
  border-radius: 16px;
  padding: 16px;
  border: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition:
    box-shadow 0.2s,
    transform 0.2s;
}
.stat-card:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}
.stat-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.stat-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: var(--card-bg);
  display: flex;
  align-items: center;
  justify-content: center;
}
.stat-icon svg {
  width: 18px;
  height: 18px;
  stroke: var(--card-color);
}
.stat-trend {
  font-size: 11px;
  font-weight: 600;
  color: #16a34a;
  background: #f0fdf4;
  padding: 2px 7px;
  border-radius: 20px;
}
.stat-badge {
  font-size: 10.5px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 20px;
}
.stat-value {
  font-size: 28px;
  font-weight: 800;
  color: #111827;
  line-height: 1;
}
.stat-suffix {
  font-size: 16px;
  font-weight: 600;
  color: var(--card-color);
}
.stat-label {
  font-size: 12px;
  color: #6b7280;
}

/* Bottom grid */
.bottom-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.card {
  background: white;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.card-title {
  font-size: 14px;
  font-weight: 700;
  color: #111827;
  margin: 0;
}
.card-link {
  font-size: 12px;
  font-weight: 600;
  color: #16a34a;
  text-decoration: none;
}
.card-link:hover {
  text-decoration: underline;
}

/* Attendance list */
.attendance-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.attendance-item {
  display: flex;
  align-items: center;
  gap: 10px;
}
.att-avatar {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 800;
  color: white;
  flex-shrink: 0;
}
.att-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  line-height: 1.3;
  min-width: 0;
}
.att-name {
  font-size: 13px;
  font-weight: 600;
  color: #111827;
}
.att-meta {
  font-size: 11px;
  color: #9ca3af;
}
.att-status {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 20px;
  flex-shrink: 0;
}

/* Rekap */
.rekap-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.rekap-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.rekap-row {
  display: flex;
  justify-content: space-between;
}
.rekap-label {
  font-size: 12.5px;
  color: #374151;
  font-weight: 500;
}
.rekap-pct {
  font-size: 12.5px;
  font-weight: 700;
}
.rekap-bar-bg {
  height: 7px;
  background: #f3f4f6;
  border-radius: 99px;
  overflow: hidden;
}
.rekap-bar-fill {
  height: 100%;
  border-radius: 99px;
  transition: width 0.8s ease;
}

/* Status box */
.status-box {
  background: #f0fdf4;
  border: 1px solid #dcfce7;
  border-radius: 12px;
  padding: 14px 16px;
}
.status-label {
  font-size: 11px;
  color: #6b7280;
  margin: 0 0 4px;
}
.status-value {
  font-size: 20px;
  font-weight: 800;
  color: #16a34a;
  margin: 0;
}
.status-desc {
  font-size: 11.5px;
  color: #6b7280;
  margin: 4px 0 0;
}

/* Responsive */
@media (max-width: 900px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .bottom-grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .layout-content {
    padding: 14px;
    gap: 14px;
  }
  .dash-date {
    display: none;
  }
}
</style>
