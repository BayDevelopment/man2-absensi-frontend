// src/stores/auth.js
import { defineStore } from "pinia";
import api from "../plugins/axios";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: JSON.parse(sessionStorage.getItem("user")) || null,
    justLoggedOut: false,
    isReady: false, // ← tambah: flag auth sudah selesai dicek
    _fetchMePromise: null,
  }),

  getters: {
    isLoggedIn: (state) => !!state.user,
    isSiswa: (state) => state.user?.roles?.includes("siswa"),
    userName: (state) => state.user?.name ?? "",
    userNisn: (state) => state.user?.nisn ?? "",
    userKelas: (state) => state.user?.kelas ?? "",
  },

  actions: {
    // ---------------------------
    // POST /api/login
    // ---------------------------
    async login(nisn, password, remember = false) {
      const { data } = await api.post("/api/login", { nisn, password, remember });

      if (!data.data?.user?.roles?.includes("siswa")) {
        throw new Error("Akses ditolak. Gunakan halaman admin.");
      }

      const token = data.data.token;
      const user = data.data.user;

      if (remember) {
        localStorage.setItem("token", token);
      } else {
        sessionStorage.setItem("token", token);
      }

      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      this.user = user;
      this.isReady = true;
      sessionStorage.setItem("user", JSON.stringify(user));

      return data;
    },

    // ---------------------------
    // POST /api/logout
    // ---------------------------
    async logout() {
      try {
        await api.post("/api/logout");
      } catch (e) {
        console.warn("Logout gagal:", e);
      } finally {
        this._clearSession();
        this.justLoggedOut = true;
        this.isReady = true; // ← tetap ready setelah logout
      }
    },

    // ---------------------------
    // GET /api/me — debounced
    // ---------------------------
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

        if (!data.data?.user?.roles?.includes("siswa")) {
          this._clearSession();
          return false;
        }

        this.user = data.data.user;
        sessionStorage.setItem("user", JSON.stringify(this.user));
        return true;
      } catch {
        this._clearSession();
        return false;
      } finally {
        this.isReady = true; // ← selalu set true setelah fetchMe selesai
      }
    },

    // ---------------------------
    // GET /api/login → data sekolah
    // ---------------------------
    async fetchPengaturan() {
      try {
        const { data } = await api.get("/api/login");
        return data.data?.pengaturan ?? null;
      } catch {
        return null;
      }
    },

    // ---------------------------
    // Helper: bersihkan session
    // ---------------------------
    _clearSession() {
      this.user = null;
      localStorage.removeItem("token");
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");
      delete api.defaults.headers.common["Authorization"];
    },
  },
});
