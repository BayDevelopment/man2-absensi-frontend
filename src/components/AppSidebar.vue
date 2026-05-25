<script setup>
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "../stores/auth";
import { computed } from "vue";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

defineProps({
  open: { type: Boolean, default: false },
});
const emit = defineEmits(["close"]);

// ✅ Data dinamis dari authStore (hasil fetch Api/AuthController -> me)
const user = computed(() => authStore.user);
const schoolName = computed(() => user.value?.school_name ?? "MAN 2 Cilegon");
const appName = computed(() => user.value?.app_name ?? "Absensi Digital");

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
    <!-- ═══ BRAND ═══ -->
    <div class="sb-brand">
      <div class="sb-logo">
        <!--
          ✅ LOGO DINAMIS:
          - Kalau user.logo_url ada → tampilkan <img> dari URL (hasil fetch /me)
          - Fallback → SVG clipboard hijau default
        -->
        <img v-if="user?.logo_url" :src="user.logo_url" :alt="schoolName" class="sb-logo-img" />
        <svg v-else viewBox="0 0 32 32" fill="none">
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
        <!-- ✅ Nama sekolah & sub-label dari API /me -->
        <span class="sb-brand-name">{{ schoolName }}</span>
        <span class="sb-brand-sub">{{ appName }}</span>
      </div>

      <button class="sb-close" @click="emit('close')" aria-label="Tutup sidebar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- ═══ NAV — hanya area ini yang scroll ═══ -->
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

    <!-- ═══ FOOTER ═══ -->
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
/* ════════════════════════════
   CSS VARIABLES
════════════════════════════ */
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

/* ════════════════════════════
   OVERLAY (mobile)
════════════════════════════ */
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

/* ════════════════════════════
   SIDEBAR ROOT
   ✅ overflow: hidden agar konten tidak bocor keluar sidebar
════════════════════════════ */
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
  overflow: hidden; /* ✅ KRITIS: cegah sidebar ikut scroll */
  font-family: "Poppins", sans-serif;
  box-shadow: 4px 0 24px rgba(0, 0, 0, 0.06);
  transform: translateX(0);
  transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
}

/* ════════════════════════════
   BRAND
════════════════════════════ */
.sb-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px 16px;
  border-bottom: 1px solid var(--sb-border);
  flex-shrink: 0; /* ✅ brand tidak ikut menyusut/scroll */
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

/* ✅ Logo gambar dari URL (user.logo_url) */
.sb-logo-img {
  width: 36px;
  height: 36px;
  border-radius: 9px;
  object-fit: cover;
  display: block;
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
  margin-top: 2px;
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

/* ════════════════════════════
   NAV
   ✅ KUNCI SCROLL TERBATAS:
   - flex: 1       → ambil sisa ruang di antara brand & footer
   - min-height: 0 → tanpa ini flexbox TIDAK akan membatasi tinggi,
                     nav akan melar dan mendorong footer keluar layar
   - overflow-y: auto → scroll hanya di dalam area nav
════════════════════════════ */
.sb-nav {
  flex: 1;
  min-height: 0; /* ✅ KRITIS */
  overflow-y: auto;
  padding: 20px 12px 8px;
  display: flex;
  flex-direction: column;
  gap: 28px;
  scrollbar-width: thin;
  scrollbar-color: #e5e7eb transparent;
}
.sb-nav::-webkit-scrollbar {
  width: 4px;
}
.sb-nav::-webkit-scrollbar-track {
  background: transparent;
}
.sb-nav::-webkit-scrollbar-thumb {
  background: #e5e7eb;
  border-radius: 99px;
}

.sb-group {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.sb-group-label {
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: #d1d5db;
  padding: 0 8px;
  margin-bottom: 8px;
}

/* ════════════════════════════
   NAV ITEM
════════════════════════════ */
.sb-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 10px;
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

/* ════════════════════════════
   FOOTER
   ✅ flex-shrink: 0 → footer tidak pernah tersembunyi
════════════════════════════ */
.sb-footer {
  padding: 20px 16px;
  border-top: 1px solid var(--sb-border);
  flex-shrink: 0; /* ✅ KRITIS: footer selalu terlihat di bawah */
}
.sb-logout {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 11px 12px;
  border-radius: 10px;
  border: 1px solid #fecaca;
  background: #fef2f2;
  color: #dc2626;
  font-size: 13px;
  font-weight: 600;
  font-family: "Poppins", sans-serif;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 12px;
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
  padding-top: 4px;
}

/* ════════════════════════════
   RESPONSIVE
════════════════════════════ */
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
