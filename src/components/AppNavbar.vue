<script setup>
import { computed, ref, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";
import { useNotificationStore } from "../stores/notification";
import { useAppearanceStore } from "@/stores/useAppearanceStore";

const authStore = useAuthStore();
const notifStore = useNotificationStore();
const appearanceStore = useAppearanceStore();
const router = useRouter();

const searchQuery = ref("");
const dropdownOpen = ref(false);
const notifOpen = ref(false);

const emit = defineEmits(["toggle-sidebar"]);

const navbarTheme = computed(() => appearanceStore.resolvedTheme || "light");

const uiText = computed(() => {
  const isEn = appearanceStore.language === "en";

  return isEn
    ? {
        openMenu: "Open menu",
        searchPlaceholder: "Search something...",
        notifications: "Notifications",
        new: "new",
        markAllRead: "Mark all as read",
        noNotifications: "No notifications",
        justNow: "Just now",
        minutesAgo: "minutes ago",
        hoursAgo: "hours ago",
        daysAgo: "days ago",
        student: "Student",
        myProfile: "My Profile",
        settings: "Settings",
        logout: "Logout",
      }
    : {
        openMenu: "Buka menu",
        searchPlaceholder: "Cari sesuatu...",
        notifications: "Notifikasi",
        new: "baru",
        markAllRead: "Tandai semua dibaca",
        noNotifications: "Tidak ada notifikasi",
        justNow: "Baru saja",
        minutesAgo: "menit lalu",
        hoursAgo: "jam lalu",
        daysAgo: "hari lalu",
        student: "Siswa",
        myProfile: "Profil Saya",
        settings: "Pengaturan",
        logout: "Keluar",
      };
});

const initials = computed(() => {
  const name = authStore.user?.name || "";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
});

const formatTime = (dateStr) => {
  if (!dateStr) return "";

  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000 / 60);

  if (diff < 1) return uiText.value.justNow;
  if (diff < 60) return `${diff} ${uiText.value.minutesAgo}`;
  if (diff < 1440) return `${Math.floor(diff / 60)} ${uiText.value.hoursAgo}`;
  return `${Math.floor(diff / 1440)} ${uiText.value.daysAgo}`;
};

const notifIcon = (type) => {
  if (type === "absen_success") return "✅";
  if (type === "absen_warning") return "⚠️";
  return "📢";
};

const toggleNotif = () => {
  notifOpen.value = !notifOpen.value;
  if (dropdownOpen.value) dropdownOpen.value = false;
};

const closeNotif = () => {
  notifOpen.value = false;
};

const handleNotifClick = (n) => {
  notifStore.markRead(n.id);
};

const handleLogout = async () => {
  dropdownOpen.value = false;
  await authStore.logout();
  router.push("/login");
};

const toggleDropdown = () => {
  dropdownOpen.value = !dropdownOpen.value;
  if (notifOpen.value) notifOpen.value = false;
};

const closeDropdown = () => {
  dropdownOpen.value = false;
};

let interval = null;

onMounted(() => {
  notifStore.fetchNotifications();
  interval = setInterval(() => notifStore.fetchNotifications(), 60000);
});

onUnmounted(() => clearInterval(interval));
</script>

<template>
  <header class="nb-root" :data-theme="navbarTheme">
    <button class="nb-hamburger" @click="emit('toggle-sidebar')" :aria-label="uiText.openMenu">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5"
        />
      </svg>
    </button>

    <div class="nb-search-wrap">
      <span class="nb-search-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803z"
          />
        </svg>
      </span>

      <input
        v-model="searchQuery"
        type="text"
        :placeholder="uiText.searchPlaceholder"
        class="nb-search-input"
      />

      <kbd class="nb-search-kbd">⌘K</kbd>
    </div>

    <div class="nb-right">
      <div class="nb-profile-wrap" v-click-outside="closeNotif">
        <button class="nb-icon-btn" @click="toggleNotif" :aria-label="uiText.notifications">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
            />
          </svg>
          <span v-if="notifStore.hasUnread" class="nb-notif-dot" />
        </button>

        <transition name="dropdown">
          <div v-if="notifOpen" class="notif-dropdown">
            <div class="notif-head">
              <span class="notif-head-title">{{ uiText.notifications }}</span>

              <span v-if="notifStore.unreadCount > 0" class="notif-count-badge">
                {{ notifStore.unreadCount }} {{ uiText.new }}
              </span>

              <button
                v-if="notifStore.unreadCount > 0"
                class="notif-read-all"
                @click="notifStore.markAllRead()"
              >
                {{ uiText.markAllRead }}
              </button>
            </div>

            <div class="notif-divider" />

            <div class="notif-list">
              <div v-if="notifStore.notifications.length === 0" class="notif-empty">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                  style="width: 32px; height: 32px; color: #d1d5db"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
                  />
                </svg>
                <p>{{ uiText.noNotifications }}</p>
              </div>

              <div
                v-for="n in notifStore.notifications"
                :key="n.id"
                class="notif-item"
                :class="{ 'notif-unread': !n.read }"
                @click="handleNotifClick(n)"
              >
                <span class="notif-item-icon">{{ notifIcon(n.type) }}</span>
                <div class="notif-item-body">
                  <p class="notif-item-title">{{ n.title }}</p>
                  <p class="notif-item-msg">{{ n.message }}</p>
                  <p class="notif-item-time">{{ formatTime(n.created_at) }}</p>
                </div>
                <span v-if="!n.read" class="notif-unread-dot" />
              </div>
            </div>
          </div>
        </transition>
      </div>

      <div class="nb-divider" />

      <div class="nb-profile-wrap" v-click-outside="closeDropdown">
        <button class="nb-user" @click="toggleDropdown" :class="{ active: dropdownOpen }">
          <div class="nb-avatar">{{ initials }}</div>
          <div class="nb-user-info">
            <span class="nb-user-name">{{ authStore.user?.name || uiText.student }}</span>
            <span class="nb-user-nisn">NISN: {{ authStore.user?.nisn || "—" }}</span>
          </div>
          <svg
            class="nb-chevron"
            :class="{ rotated: dropdownOpen }"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>

        <transition name="dropdown">
          <div v-if="dropdownOpen" class="nb-dropdown">
            <div class="dd-header">
              <div class="dd-avatar">{{ initials }}</div>
              <div class="dd-info">
                <span class="dd-name">{{ authStore.user?.name || uiText.student }}</span>
                <span class="dd-nisn">NISN: {{ authStore.user?.nisn || "—" }}</span>
                <span class="dd-badge">{{ uiText.student }}</span>
              </div>
            </div>

            <div class="dd-divider" />

            <RouterLink to="/profil" class="dd-item" @click="closeDropdown">
              <span class="dd-item-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                  />
                </svg>
              </span>
              {{ uiText.myProfile }}
            </RouterLink>

            <RouterLink to="/pengaturan" class="dd-item" @click="closeDropdown">
              <span class="dd-item-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </span>
              {{ uiText.settings }}
            </RouterLink>

            <div class="dd-divider" />

            <button class="dd-item dd-logout" @click="handleLogout">
              <span class="dd-item-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
                  />
                </svg>
              </span>
              {{ uiText.logout }}
            </button>
          </div>
        </transition>
      </div>
    </div>
  </header>
</template>

<style scoped>
/* Notif Dropdown */
.notif-list {
  max-height: 200px;
  overflow-y: auto;
  scroll-behavior: smooth;
}

/* Opsional — styling scrollbar */
.notif-list::-webkit-scrollbar {
  width: 4px;
}

.notif-list::-webkit-scrollbar-track {
  background: transparent;
}

.notif-list::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 999px;
}

.notif-list::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}
.notif-dropdown {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  width: 320px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  z-index: 100;
  overflow: hidden;
}

.notif-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 16px;
}
.notif-head-title {
  font-weight: 600;
  font-size: 14px;
  flex: 1;
}
.notif-count-badge {
  font-size: 11px;
  background: #eff6ff;
  color: #3b82f6;
  padding: 2px 8px;
  border-radius: 999px;
  font-weight: 500;
}
.notif-read-all {
  font-size: 11px;
  color: #6b7280;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}
.notif-read-all:hover {
  color: #3b82f6;
}
.notif-divider {
  height: 1px;
  background: #f3f4f6;
}

.notif-list {
  max-height: 360px;
  overflow-y: auto;
}
.notif-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 32px 16px;
  color: #9ca3af;
  font-size: 13px;
}

.notif-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.15s;
  position: relative;
}
.notif-item:hover {
  background: #f9fafb;
}
.notif-unread {
  background: #eff6ff;
}
.notif-unread:hover {
  background: #dbeafe;
}

.notif-item-icon {
  font-size: 18px;
  margin-top: 2px;
}
.notif-item-body {
  flex: 1;
}
.notif-item-title {
  font-size: 13px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 2px;
}
.notif-item-msg {
  font-size: 12px;
  color: #6b7280;
  margin: 0 0 4px;
  line-height: 1.4;
}
.notif-item-time {
  font-size: 11px;
  color: #9ca3af;
  margin: 0;
}

.notif-unread-dot {
  width: 8px;
  height: 8px;
  background: #3b82f6;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 4px;
}

.nb-root {
  position: sticky;
  top: 0;
  z-index: 40;
  height: 60px;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 20px;
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  font-family: "Poppins", sans-serif;
}

/* Hamburger */
.nb-hamburger {
  display: none;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 8px;
  color: #6b7280;
  flex-shrink: 0;
  transition:
    background 0.2s,
    color 0.2s;
}
.nb-hamburger:hover {
  background: #f0fdf4;
  color: #16a34a;
}
.nb-hamburger svg {
  width: 20px;
  height: 20px;
}

/* Search */
.nb-search-wrap {
  flex: 1;
  max-width: 420px;
  position: relative;
  display: flex;
  align-items: center;
}
.nb-search-icon {
  position: absolute;
  left: 10px;
  color: #9ca3af;
  display: flex;
  align-items: center;
  pointer-events: none;
}
.nb-search-icon svg {
  width: 15px;
  height: 15px;
}
.nb-search-input {
  width: 100%;
  height: 36px;
  padding: 0 72px 0 34px;
  background: #f9fafb;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  font-size: 13px;
  font-family: "Poppins", sans-serif;
  color: #374151;
  outline: none;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}
.nb-search-input::placeholder {
  color: #d1d5db;
}
.nb-search-input:focus {
  border-color: #16a34a;
  box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1);
  background: #fff;
}
.nb-search-kbd {
  position: absolute;
  right: 10px;
  padding: 2px 6px;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 5px;
  font-size: 10px;
  color: #9ca3af;
  pointer-events: none;
}

/* Right */
.nb-right {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
  flex-shrink: 0;
}
.nb-icon-btn {
  position: relative;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  background: #f9fafb;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.2s;
}
.nb-icon-btn:hover {
  border-color: #16a34a;
  color: #16a34a;
  background: #f0fdf4;
}
.nb-icon-btn svg {
  width: 16px;
  height: 16px;
}
.nb-notif-dot {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 7px;
  height: 7px;
  background: #16a34a;
  border-radius: 50%;
  border: 1.5px solid #fff;
}
.nb-divider {
  width: 1px;
  height: 24px;
  background: #e5e7eb;
}

/* Profile wrap */
.nb-profile-wrap {
  position: relative;
}

/* User button */
.nb-user {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 10px 4px 4px;
  border: 1.5px solid #e5e7eb;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  background: #f9fafb;
}
.nb-user:hover,
.nb-user.active {
  border-color: #16a34a;
  background: #f0fdf4;
}
.nb-avatar {
  width: 32px;
  height: 32px;
  border-radius: 9px;
  background: linear-gradient(135deg, #16a34a, #15803d);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 800;
  color: white;
  flex-shrink: 0;
}
.nb-user-info {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}
.nb-user-name {
  font-size: 12.5px;
  font-weight: 600;
  color: #166534;
  white-space: nowrap;
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
}
.nb-user-nisn {
  font-size: 10.5px;
  color: #9ca3af;
}
.nb-chevron {
  width: 13px;
  height: 13px;
  color: #9ca3af;
  flex-shrink: 0;
  transition: transform 0.25s ease;
}
.nb-chevron.rotated {
  transform: rotate(180deg);
}

/* Dropdown */
.nb-dropdown {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  width: 220px;
  background: white;
  border: 1.5px solid #e5e7eb;
  border-radius: 14px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  z-index: 100;
}

/* Dropdown header */
.dd-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 14px 12px;
  background: #f0fdf4;
}
.dd-avatar {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: linear-gradient(135deg, #16a34a, #15803d);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 800;
  color: white;
  flex-shrink: 0;
}
.dd-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.dd-name {
  font-size: 12.5px;
  font-weight: 700;
  color: #166534;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.dd-nisn {
  font-size: 10.5px;
  color: #9ca3af;
}
.dd-badge {
  font-size: 9.5px;
  font-weight: 600;
  color: #16a34a;
  background: #dcfce7;
  padding: 1px 7px;
  border-radius: 99px;
  width: fit-content;
}

.dd-divider {
  height: 1px;
  background: #f3f4f6;
  margin: 0;
}

/* Dropdown items */
.dd-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  text-decoration: none;
  cursor: pointer;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
  font-family: "Poppins", sans-serif;
  transition:
    background 0.15s,
    color 0.15s;
}
.dd-item:hover {
  background: #f9fafb;
  color: #111827;
}
.dd-item-icon {
  width: 28px;
  height: 28px;
  border-radius: 7px;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.dd-item-icon svg {
  width: 14px;
  height: 14px;
}
.dd-item:hover .dd-item-icon {
  background: #e5e7eb;
}

.dd-logout {
  color: #dc2626;
}
.dd-logout:hover {
  background: #fef2f2;
  color: #b91c1c;
}
.dd-logout .dd-item-icon {
  background: #fef2f2;
}
.dd-logout:hover .dd-item-icon {
  background: #fee2e2;
}

/* Dropdown transition */
.dropdown-enter-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}
.dropdown-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}
.dropdown-enter-from {
  opacity: 0;
  transform: translateY(-8px) scale(0.97);
}
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.98);
}

/* Responsive */
@media (max-width: 768px) {
  .nb-hamburger {
    display: flex;
  }
  .nb-search-kbd {
    display: none;
  }
  .nb-user-info {
    display: none;
  }
  .nb-chevron {
    display: none;
  }
  .nb-user {
    padding: 4px;
    border-radius: 50%;
    border: none;
    background: none;
  }
  .nb-user:hover,
  .nb-user.active {
    background: #f0fdf4;
  }
  .nb-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
  }
  .nb-divider {
    display: none;
  }
  .nb-dropdown {
    right: -8px;
  }
}
@media (max-width: 480px) {
  .nb-root {
    padding: 0 14px;
    gap: 10px;
  }
  .nb-icon-btn {
    display: none;
  }
}

.nb-root[data-theme="dark"] {
  background: #111827;
  border-bottom-color: #243044;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.18);
}

.nb-root[data-theme="dark"] .nb-hamburger {
  color: #cbd5e1;
}

.nb-root[data-theme="dark"] .nb-hamburger:hover {
  background: rgba(34, 197, 94, 0.12);
  color: #22c55e;
}

.nb-root[data-theme="dark"] .nb-search-icon {
  color: #64748b;
}

.nb-root[data-theme="dark"] .nb-search-input {
  background: #1f2937;
  border-color: #243044;
  color: #e5e7eb;
}

.nb-root[data-theme="dark"] .nb-search-input::placeholder {
  color: #64748b;
}

.nb-root[data-theme="dark"] .nb-search-input:focus {
  border-color: #22c55e;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.12);
  background: #111827;
}

.nb-root[data-theme="dark"] .nb-search-kbd,
.nb-root[data-theme="dark"] .nb-icon-btn,
.nb-root[data-theme="dark"] .nb-user {
  background: #1f2937;
  border-color: #243044;
  color: #cbd5e1;
}

.nb-root[data-theme="dark"] .nb-icon-btn:hover,
.nb-root[data-theme="dark"] .nb-user:hover,
.nb-root[data-theme="dark"] .nb-user.active {
  background: rgba(34, 197, 94, 0.12);
  border-color: #22c55e;
  color: #22c55e;
}

.nb-root[data-theme="dark"] .nb-divider {
  background: #243044;
}

.nb-root[data-theme="dark"] .nb-user-name,
.nb-root[data-theme="dark"] .dd-name {
  color: #bbf7d0;
}

.nb-root[data-theme="dark"] .nb-user-nisn,
.nb-root[data-theme="dark"] .nb-chevron,
.nb-root[data-theme="dark"] .dd-nisn {
  color: #94a3b8;
}

.nb-root[data-theme="dark"] .notif-dropdown,
.nb-root[data-theme="dark"] .nb-dropdown {
  background: #111827;
  border-color: #243044;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
}

.nb-root[data-theme="dark"] .notif-head-title,
.nb-root[data-theme="dark"] .notif-item-title {
  color: #e5e7eb;
}

.nb-root[data-theme="dark"] .notif-count-badge,
.nb-root[data-theme="dark"] .dd-badge {
  background: rgba(34, 197, 94, 0.18);
  color: #22c55e;
}

.nb-root[data-theme="dark"] .notif-read-all,
.nb-root[data-theme="dark"] .notif-item-msg,
.nb-root[data-theme="dark"] .notif-item-time,
.nb-root[data-theme="dark"] .notif-empty {
  color: #94a3b8;
}

.nb-root[data-theme="dark"] .notif-divider,
.nb-root[data-theme="dark"] .dd-divider {
  background: #243044;
}

.nb-root[data-theme="dark"] .notif-item:hover,
.nb-root[data-theme="dark"] .dd-item:hover {
  background: #1f2937;
}

.nb-root[data-theme="dark"] .notif-unread {
  background: rgba(34, 197, 94, 0.1);
}

.nb-root[data-theme="dark"] .notif-unread:hover {
  background: rgba(34, 197, 94, 0.16);
}

.nb-root[data-theme="dark"] .dd-header {
  background: rgba(34, 197, 94, 0.12);
}

.nb-root[data-theme="dark"] .dd-item {
  color: #cbd5e1;
}

.nb-root[data-theme="dark"] .dd-item:hover {
  color: #f8fafc;
}

.nb-root[data-theme="dark"] .dd-item-icon {
  background: #1f2937;
}

.nb-root[data-theme="dark"] .dd-item:hover .dd-item-icon {
  background: #243044;
}

.nb-root[data-theme="dark"] .dd-logout {
  color: #f87171;
}

.nb-root[data-theme="dark"] .dd-logout:hover {
  background: rgba(220, 38, 38, 0.12);
  color: #fca5a5;
}

.nb-root[data-theme="dark"] .dd-logout .dd-item-icon {
  background: rgba(220, 38, 38, 0.12);
}

.nb-root[data-theme="dark"] .dd-logout:hover .dd-item-icon {
  background: rgba(220, 38, 38, 0.18);
}

.nb-root[data-theme="dark"] .nb-notif-dot {
  border-color: #111827;
}
</style>
