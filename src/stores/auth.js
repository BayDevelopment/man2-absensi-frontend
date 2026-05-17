// src/stores/auth.js
import { defineStore } from "pinia";
import api from "../plugins/axios";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: JSON.parse(sessionStorage.getItem("user")) || null,
    _fetchMePromise: null,
  }),

  getters: {
    isLoggedIn: (state) => !!state.user,
    isSiswa: (state) => state.user?.roles?.includes("siswa"), // ✅ hanya ini yang perlu
    userName: (state) => state.user?.name ?? "",
    userNisn: (state) => state.user?.nisn ?? "",
    userKelas: (state) => state.user?.kelas ?? "",
  },

  actions: {
    async login(nisn, password) {
      // ← hapus baris csrf-cookie, tidak perlu lagi
      const { data } = await api.post("/api/login", { email: nisn, password });

      if (!data.user?.roles?.includes("siswa")) {
        throw new Error("Akses ditolak. Gunakan halaman admin.");
      }

      // simpan token
      localStorage.setItem("token", data.token);
      api.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;

      this.user = data.user;
      sessionStorage.setItem("user", JSON.stringify(data.user));

      return data;
    },

    async logout() {
      try {
        await api.post("/api/logout");
      } catch (e) {
        console.warn("Logout gagal:", e);
      } finally {
        localStorage.removeItem("token");
        delete api.defaults.headers.common["Authorization"];
        this.user = null;
        sessionStorage.removeItem("user");
      }
    },

    fetchMe() {
      if (!this._fetchMePromise) {
        this._fetchMePromise = this._doFetchMe().finally(() => {
          this._fetchMePromise = null;
        });
      }
      return this._fetchMePromise;
    },

    async _doFetchMe() {
      try {
        const { data } = await api.get("/api/me");

        // ✅ Kalau session valid tapi bukan siswa, anggap tidak login di Vue
        if (!data.user?.roles?.includes("siswa")) {
          this.user = null;
          sessionStorage.removeItem("user");
          return false;
        }

        this.user = data.user;
        sessionStorage.setItem("user", JSON.stringify(data.user));
        return true;
      } catch {
        this.user = null;
        sessionStorage.removeItem("user");
        return false;
      }
    },
  },
});
