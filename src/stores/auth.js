// src/stores/auth.js
import { defineStore } from "pinia";
import api, { setAuthToken, clearAuthToken, getToken } from "../plugins/axios";
import router from "../router";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null,
    justLoggedOut: false,
    isReady: false,
    _fetchMePromise: null,

    // Two Factor
    requireOtp: false,
    pendingUserId: null,

    // Auto Logout
    _logoutTimer: null,
    _activityListeners: [],
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
    // ── LOGIN ─────────────────────────────────────────────────────────────────
    async login(nisn, password, remember = false) {
      const { data } = await api.post("/api/login", { nisn, password, remember });

      if (data.data?.require_otp) {
        this.requireOtp = true;
        this.pendingUserId = data.data.user_id;
        sessionStorage.setItem("pending_otp_user_id", data.data.user_id);
        return { require_otp: true, user_id: data.data.user_id };
      }

      this._handleLoginSuccess(data.data, remember);
      return data;
    },

    // ── VERIFY OTP ────────────────────────────────────────────────────────────
    async verifyOtp(otp, remember = false) {
      const { data } = await api.post("/api/verify-otp", {
        user_id: this.pendingUserId,
        otp,
      });

      this._clearOtpState();
      this._handleLoginSuccess(data.data, remember);
      return data;
    },

    // ── HANDLE LOGIN SUCCESS (shared) ─────────────────────────────────────────
    _handleLoginSuccess(payload, remember = false) {
      const { token, user, auto_logout } = payload;

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

      if (auto_logout) {
        this._startAutoLogoutTimer();
      }
    },

    // ── AUTO LOGOUT TIMER ─────────────────────────────────────────────────────
    _startAutoLogoutTimer() {
      const TIMEOUT_MS = 30 * 60 * 1000; // 30 menit

      const reset = () => {
        clearTimeout(this._logoutTimer);
        this._logoutTimer = setTimeout(() => {
          this.logout();
          router.push({ name: "Login", query: { reason: "idle" } });
        }, TIMEOUT_MS);
      };

      this._stopAutoLogoutTimer();

      const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
      events.forEach((event) => {
        const handler = () => reset();
        window.addEventListener(event, handler);
        this._activityListeners.push({ event, handler });
      });

      reset();
    },

    _stopAutoLogoutTimer() {
      clearTimeout(this._logoutTimer);
      this._logoutTimer = null;

      this._activityListeners.forEach(({ event, handler }) => {
        window.removeEventListener(event, handler);
      });
      this._activityListeners = [];
    },

    // ── LOGOUT ────────────────────────────────────────────────────────────────
    async logout() {
      this.isReady = false;
      this._stopAutoLogoutTimer();
      this._clearOtpState();

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

    // ── FETCH ME ──────────────────────────────────────────────────────────────
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

    // ── PENGATURAN ────────────────────────────────────────────────────────────
    // Endpoint: GET /api/settings (sesuai routes/api.php → SettingController@index)
    async fetchPengaturan() {
      try {
        const { data } = await api.get("/api/pengaturan"); // ✅ bukan /api/settings
        return data.data?.pengaturan ?? null;
      } catch (e) {
        console.error(
          "[fetchPengaturan] Error:",
          e.response?.status,
          "[fetchPengaturan] Error:",
          e.response?.status,
          e.response?.data ?? e.message,
        );
        return null;
      }
    },

    // ── KEAMANAN (load & save toggle) ─────────────────────────────────────────
    async fetchKeamanan() {
      try {
        const { data } = await api.get("/api/settings");
        return data.data ?? null;
      } catch (e) {
        console.error("[fetchKeamanan] Error:", e.response?.status, e.response?.data ?? e.message);
        return null;
      }
    },

    async saveKeamanan(payload) {
      const { data } = await api.put("/api/settings/keamanan", payload);
      return data;
    },

    // ── CLEAR SESSION ─────────────────────────────────────────────────────────
    _clearSession() {
      this.user = null;
      this.justLoggedOut = false;

      localStorage.removeItem("token");
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");

      clearAuthToken();
    },

    _clearOtpState() {
      this.requireOtp = false;
      this.pendingUserId = null;
      sessionStorage.removeItem("pending_otp_user_id");
    },
  },
});
