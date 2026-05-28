// stores/notification.js
import { defineStore } from "pinia";
import api from "../plugins/axios";

const STORAGE_KEY = "notif_read_ids";

// Helper baca/tulis localStorage
const getReadIds = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
};

const saveReadIds = (ids) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
};

export const useNotificationStore = defineStore("notification", {
  state: () => ({
    notifications: [],
    isOpen: false,
  }),

  getters: {
    unreadCount: (state) => state.notifications.filter((n) => !n.read).length,
    hasUnread: (state) => state.notifications.some((n) => !n.read),
  },

  actions: {
    async fetchNotifications() {
      try {
        const { data } = await api.get("/api/notifications");

        // Ambil daftar id yang sudah dibaca dari localStorage
        const readIds = getReadIds();

        // Tandai notif yang sudah pernah dibaca
        this.notifications = data.map((n) => ({
          ...n,
          read: readIds.includes(String(n.id)) ? true : n.read,
        }));
      } catch (err) {
        console.error("Notif error:", err.response?.data || err.message);
      }
    },

    markRead(id) {
      // Update state
      const n = this.notifications.find((n) => n.id === id);
      if (n) n.read = true;

      // Simpan ke localStorage
      const readIds = getReadIds();
      if (!readIds.includes(String(id))) {
        readIds.push(String(id));
        saveReadIds(readIds);
      }
    },

    markAllRead() {
      // Update semua state
      this.notifications.forEach((n) => (n.read = true));

      // Simpan semua id ke localStorage
      const allIds = this.notifications.map((n) => String(n.id));
      const readIds = getReadIds();
      const merged = [...new Set([...readIds, ...allIds])];
      saveReadIds(merged);
    },

    toggle() {
      this.isOpen = !this.isOpen;
    },
    close() {
      this.isOpen = false;
    },
  },
});
