<script setup>
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "../stores/auth";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

defineProps({
  open: { type: Boolean, default: false },
});
const emit = defineEmits(["close"]);

const navGroups = [
  {
    label: "Utama",
    items: [
      {
        label: "Dashboard",
        path: "/dashboard",
        icon: `<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"/>`,
      },
      {
        label: "Absensi",
        path: "/absensi",
        badge: "Hari ini",
        icon: `<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>`,
      },
      {
        label: "Riwayat",
        path: "/riwayat",
        icon: `<path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>`,
      },
    ],
  },
  {
    label: "Informasi",
    items: [
      {
        label: "Rekap Nilai",
        path: "/rekap",
        icon: `<path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"/>`,
      },
      {
        label: "Jadwal",
        path: "/jadwal",
        icon: `<path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5"/>`,
      },
    ],
  },
  {
    label: "Akun",
    items: [
      {
        label: "Profil",
        path: "/profil",
        icon: `<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/>`,
      },
      {
        label: "Pengaturan",
        path: "/pengaturan",
        icon: `<path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>`,
      },
    ],
  },
];

const handleLogout = async () => {
  await authStore.logout();
  router.push("/login");
};

const isActive = (path) => route.path === path;
</script>

<template>
  <!-- Overlay mobile -->
  <transition name="sb-overlay">
    <div v-if="open" class="sb-overlay" @click="emit('close')" aria-hidden="true" />
  </transition>

  <!-- Sidebar -->
  <aside class="sb-root" :class="{ 'sb-open': open }">
    <!-- Brand -->
    <div class="sb-brand">
      <div class="sb-logo">
        <svg viewBox="0 0 32 32" fill="none">
          <rect width="32" height="32" rx="9" fill="#16a34a" />
          <rect
            x="8"
            y="9"
            width="16"
            height="17"
            rx="2"
            fill="none"
            stroke="white"
            stroke-width="1.5"
          />
          <rect
            x="12"
            y="6"
            width="8"
            height="5"
            rx="1.5"
            fill="none"
            stroke="white"
            stroke-width="1.5"
          />
          <line
            x1="11"
            y1="16"
            x2="21"
            y2="16"
            stroke="rgba(255,255,255,0.6)"
            stroke-width="1.2"
            stroke-linecap="round"
          />
          <line
            x1="11"
            y1="19.5"
            x2="21"
            y2="19.5"
            stroke="rgba(255,255,255,0.6)"
            stroke-width="1.2"
            stroke-linecap="round"
          />
          <line
            x1="11"
            y1="23"
            x2="17"
            y2="23"
            stroke="rgba(255,255,255,0.6)"
            stroke-width="1.2"
            stroke-linecap="round"
          />
        </svg>
      </div>
      <div class="sb-brand-text">
        <span class="sb-brand-name">MAN 2 Cilegon</span>
        <span class="sb-brand-sub">Absensi Digital</span>
      </div>
      <button class="sb-close" @click="emit('close')" aria-label="Tutup sidebar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Nav -->
    <nav class="sb-nav">
      <div v-for="group in navGroups" :key="group.label" class="sb-group">
        <p class="sb-group-label">{{ group.label }}</p>
        <RouterLink
          v-for="item in group.items"
          :key="item.path"
          :to="item.path"
          class="sb-item"
          :class="{ 'sb-item-active': isActive(item.path) }"
          @click="emit('close')"
        >
          <span class="sb-item-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              v-html="item.icon"
            />
          </span>
          <span class="sb-item-label">{{ item.label }}</span>
          <span v-if="item.badge" class="sb-item-badge">{{ item.badge }}</span>
          <span v-if="isActive(item.path)" class="sb-item-dot" />
        </RouterLink>
      </div>
    </nav>

    <div style="flex: 1" />

    <!-- Footer -->
    <div class="sb-footer">
      <button class="sb-logout" @click="handleLogout">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
          />
        </svg>
        <span>Keluar</span>
      </button>
      <p class="sb-version">v1.0.0 · 2026</p>
    </div>
  </aside>
</template>

<style scoped>
.sb-root {
  --sb-width: 240px;
  --sb-bg: #ffffff;
  --sb-border: #e5e7eb;
  --sb-green: #16a34a;
  --sb-green-dark: #15803d;
  --sb-green-light: #f0fdf4;
  --sb-green-mid: #dcfce7;
  --sb-text: #166534;
  --sb-muted: #9ca3af;
}

.sb-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(2px);
  z-index: 49;
}
.sb-overlay-enter-active,
.sb-overlay-leave-active {
  transition: opacity 0.25s ease;
}
.sb-overlay-enter-from,
.sb-overlay-leave-to {
  opacity: 0;
}

.sb-root {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: var(--sb-width);
  background: var(--sb-bg);
  border-right: 1px solid var(--sb-border);
  display: flex;
  flex-direction: column;
  z-index: 50;
  overflow: hidden;
  font-family: "Poppins", sans-serif;
  box-shadow: 4px 0 24px rgba(0, 0, 0, 0.06);
  transform: translateX(0);
  transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Brand */
.sb-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 16px 14px;
  border-bottom: 1px solid var(--sb-border);
  flex-shrink: 0;
}
.sb-logo {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
}
.sb-logo svg {
  width: 36px;
  height: 36px;
}
.sb-brand-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  line-height: 1.2;
  min-width: 0;
}
.sb-brand-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--sb-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.sb-brand-sub {
  font-size: 10px;
  color: var(--sb-muted);
}
.sb-close {
  display: none;
  width: 28px;
  height: 28px;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 7px;
  color: var(--sb-muted);
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition:
    background 0.2s,
    color 0.2s;
}
.sb-close:hover {
  background: #fee2e2;
  color: #dc2626;
}
.sb-close svg {
  width: 16px;
  height: 16px;
}

/* Nav */
.sb-nav {
  flex: 1;
  overflow-y: auto;
  padding: 12px 12px 4px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  scrollbar-width: thin;
  scrollbar-color: #e5e7eb transparent;
}
.sb-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.sb-group-label {
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: #d1d5db;
  padding: 0 8px;
  margin-bottom: 4px;
}

.sb-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  border-radius: 10px;
  text-decoration: none;
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
  border: 1px solid transparent;
  transition: all 0.18s ease;
  position: relative;
}
.sb-item:hover {
  background: var(--sb-green-light);
  color: var(--sb-green);
  border-color: var(--sb-green-mid);
}
.sb-item-active {
  background: var(--sb-green-light);
  color: var(--sb-green);
  border-color: var(--sb-green-mid);
  font-weight: 600;
}
.sb-item-active .sb-item-icon {
  background: var(--sb-green);
  color: white;
}
.sb-item-icon {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition:
    background 0.18s,
    color 0.18s;
}
.sb-item-icon svg {
  width: 15px;
  height: 15px;
}
.sb-item:hover .sb-item-icon {
  background: var(--sb-green-mid);
  color: var(--sb-green);
}
.sb-item-label {
  flex: 1;
}
.sb-item-badge {
  font-size: 9.5px;
  font-weight: 600;
  color: var(--sb-green);
  background: var(--sb-green-mid);
  padding: 2px 7px;
  border-radius: 9999px;
}
.sb-item-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--sb-green);
  flex-shrink: 0;
}

/* Footer */
.sb-footer {
  padding: 12px 16px;
  border-top: 1px solid var(--sb-border);
  flex-shrink: 0;
}
.sb-logout {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 9px 12px;
  border-radius: 10px;
  border: 1px solid #fecaca;
  background: #fef2f2;
  color: #dc2626;
  font-size: 13px;
  font-weight: 600;
  font-family: "Poppins", sans-serif;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 8px;
}
.sb-logout:hover {
  background: #fee2e2;
  border-color: #fca5a5;
}
.sb-logout svg {
  width: 15px;
  height: 15px;
}
.sb-version {
  text-align: center;
  font-size: 10px;
  color: #d1d5db;
}

/* Responsive */
@media (max-width: 768px) {
  .sb-root {
    transform: translateX(-100%);
    box-shadow: none;
  }
  .sb-root.sb-open {
    transform: translateX(0);
    box-shadow: 8px 0 32px rgba(0, 0, 0, 0.15);
  }
  .sb-close {
    display: flex;
  }
}
@media (min-width: 769px) {
  .sb-root {
    position: sticky;
    top: 0;
    height: 100vh;
    flex-shrink: 0;
  }
}
</style>
