// src/stores/auth.js
import { defineStore } from "pinia";
import api, { setAuthToken, clearAuthToken, getToken } from "../plugins/axios";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null,
    justLoggedOut: false,
    isReady: false,
    _fetchMePromise: null,
  }),

  getters: {
    isLoggedIn: (state) => !!state.user,
    isSiswa: (state) => state.user?.roles?.includes("siswa"),
    userName: (state) => state.user?.name ?? "",
    userNisn: (state) => state.user?.nisn ?? "",
    userKelas: (state) => state.user?.kelas ?? "",
    token: () => getToken(),
  },

  actions: {
    async login(nisn, password, remember = false) {
      const { data } = await api.post("/api/login", {
        nisn,
        password,
        remember,
      });

      const token = data.data?.token;
      const user = data.data?.user;

      if (!token || !user) {
        throw new Error("Login gagal. Data pengguna tidak valid.");
      }

      if (!user.roles?.includes("siswa")) {
        throw new Error("Akses ditolak. Gunakan halaman admin.");
      }

      if (remember) {
        localStorage.setItem("token", token);
        sessionStorage.removeItem("token");
      } else {
        sessionStorage.setItem("token", token);
        localStorage.removeItem("token");
      }

      setAuthToken(token);

      this.user = user;
      this.justLoggedOut = false;
      this.isReady = true;

      sessionStorage.setItem("user", JSON.stringify(user));

      return data;
    },

    async logout() {
      try {
        if (this.token) {
          await api.post("/api/logout");
        }
      } catch (e) {
        console.warn("Logout gagal:", e);
      } finally {
        this._clearSession();
        this.justLoggedOut = true;
        this.isReady = true;
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
      const token = this.token;

      if (!token) {
        this._clearSession();
        this.isReady = true;
        return false;
      }

      setAuthToken(token);

      try {
        const { data } = await api.get("/api/me");

        const user = data.data?.user;

        if (!user || !user.roles?.includes("siswa")) {
          this._clearSession();
          return false;
        }

        this.user = user;
        sessionStorage.setItem("user", JSON.stringify(user));

        return true;
      } catch (e) {
        this._clearSession();
        return false;
      } finally {
        this.isReady = true;
      }
    },

    async fetchPengaturan() {
      try {
        const { data } = await api.get("/api/login");
        return data.data?.pengaturan ?? null;
      } catch {
        return null;
      }
    },

    _clearSession() {
      this.user = null;
      this.justLoggedOut = false;

      localStorage.removeItem("token");
      sessionStorage.removeItem("token");

      localStorage.removeItem("user");
      sessionStorage.removeItem("user");

      clearAuthToken();
    },
  },
});
