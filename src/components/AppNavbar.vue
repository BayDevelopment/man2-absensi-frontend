<script setup>
import { computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "../stores/auth";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const initials = computed(() => {
  const name = authStore.user?.name || "";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
});

const navItems = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: `<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"/>`,
  },
  {
    label: "Absensi",
    path: "/absensi",
    icon: `<path stroke-linecap="round" stroke-linejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"/><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z"/>`,
  },
  {
    label: "Riwayat",
    path: "/riwayat",
    icon: `<path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>`,
  },
];

const handleLogout = async () => {
  await authStore.logout();
  router.push("/login");
};
</script>

<template>
  <nav class="navbar">
    <!-- Brand -->
    <div class="nav-brand">
      <div class="nav-logo">
        <svg viewBox="0 0 32 32" fill="none" class="logo-svg" aria-hidden="true">
          <circle
            cx="16"
            cy="16"
            r="14"
            fill="none"
            stroke="#d4a017"
            stroke-width="1"
            opacity="0.5"
          />
          <path
            d="M8 20 Q16 10 24 20"
            fill="none"
            stroke="#f0c040"
            stroke-width="1.5"
            stroke-linecap="round"
          />
          <path d="M16 10 L16 21" fill="none" stroke="#f0c040" stroke-width="1.2" />
          <polygon points="16,4 17,8 16,7 15,8" fill="#f0c040" />
          <circle cx="16" cy="9" r="1.5" fill="#f0c040" />
        </svg>
      </div>
      <div>
        <div class="nav-title">MAN 2 Cilegon</div>
        <div class="nav-sub">Sistem Absensi Digital</div>
      </div>
    </div>

    <!-- Menu desktop (tengah) -->
    <div class="nav-menu">
      <RouterLink
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="nav-item"
        :class="{ active: route.path === item.path }"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          v-html="item.icon"
        />
        {{ item.label }}
      </RouterLink>
    </div>

    <!-- Right -->
    <div class="nav-right">
      <div class="nav-user-info">
        <div class="nav-avatar">{{ initials }}</div>
        <div class="nav-user-text">
          <span class="nav-user-name">{{ authStore.user?.name }}</span>
          <span class="nav-user-role">Siswa</span>
        </div>
      </div>
      <div class="nav-divider" />
      <button @click="handleLogout" class="logout-btn" title="Keluar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
          />
        </svg>
        <span class="logout-text">Keluar</span>
      </button>
    </div>
  </nav>
</template>

<style scoped>
.navbar {
  position: sticky;
  top: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 58px;
  background: rgba(5, 14, 5, 0.9);
  border-bottom: 1px solid rgba(212, 160, 23, 0.12);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow:
    0 1px 0 rgba(212, 160, 23, 0.06),
    0 4px 24px rgba(0, 0, 0, 0.4);
  font-family: "Plus Jakarta Sans", sans-serif;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.nav-logo {
  width: 34px;
  height: 34px;
  border-radius: 9px;
  background: linear-gradient(135deg, rgba(45, 138, 45, 0.2), rgba(212, 160, 23, 0.2));
  border: 1px solid rgba(212, 160, 23, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
}
.logo-svg {
  width: 20px;
  height: 20px;
}

.nav-title {
  font-size: 13px;
  font-weight: 700;
  color: #f0c040;
  line-height: 1.2;
}
.nav-sub {
  font-size: 9.5px;
  color: rgba(212, 160, 23, 0.45);
}

/* Menu tengah */
.nav-menu {
  display: flex;
  align-items: center;
  gap: 2px;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 9px;
  font-size: 12.5px;
  font-weight: 500;
  color: #4a6741;
  text-decoration: none;
  border: 1px solid transparent;
  transition: all 0.2s;
}
.nav-item svg {
  width: 15px;
  height: 15px;
  flex-shrink: 0;
}
.nav-item:hover {
  background: rgba(212, 160, 23, 0.06);
  color: #d4a017;
  border-color: rgba(212, 160, 23, 0.12);
}
.nav-item.active {
  background: rgba(212, 160, 23, 0.1);
  color: #f0c040;
  border-color: rgba(212, 160, 23, 0.2);
  font-weight: 600;
}

/* Right */
.nav-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}
.nav-user-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.nav-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: linear-gradient(135deg, #2d8a2d, #d4a017);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 800;
  color: #071207;
  border: 1.5px solid rgba(212, 160, 23, 0.3);
}

.nav-user-text {
  display: flex;
  flex-direction: column;
}
.nav-user-name {
  font-size: 12px;
  font-weight: 600;
  color: #c8d8c8;
  line-height: 1.2;
}
.nav-user-role {
  font-size: 9.5px;
  color: rgba(212, 160, 23, 0.5);
}

.nav-divider {
  width: 1px;
  height: 20px;
  background: rgba(212, 160, 23, 0.15);
}

.logout-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 9px;
  background: none;
  border: 1px solid rgba(255, 255, 255, 0.07);
  color: #4a6741;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  font-family: inherit;
  transition: all 0.2s;
}
.logout-btn svg {
  width: 14px;
  height: 14px;
}
.logout-btn:hover {
  border-color: rgba(239, 68, 68, 0.35);
  color: #f87171;
  background: rgba(239, 68, 68, 0.06);
}

@media (max-width: 768px) {
  .nav-menu {
    display: none;
  }
  .nav-user-text {
    display: none;
  }
  .logout-text {
    display: none;
  }
  .logout-btn {
    padding: 6px 8px;
  }
  .nav-divider {
    display: none;
  }
}
</style>
