// FILE: src/stores/auth.js
import { defineStore } from "pinia";
import api from "../plugins/axios";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    // Hanya simpan data user di sessionStorage (bukan token)
    // sessionStorage auto clear saat browser ditutup
    user: JSON.parse(sessionStorage.getItem("user")) || null,
  }),

  getters: {
    isLoggedIn: (state) => !!state.user,
    isAdmin: (state) => state.user?.roles?.includes("admin"),
    isGuru: (state) => state.user?.roles?.includes("guru"),
    isSiswa: (state) => state.user?.roles?.includes("siswa"),
    userName: (state) => state.user?.name ?? "",
    userNisn: (state) => state.user?.nisn ?? "",
    userKelas: (state) => state.user?.kelas ?? "",
  },

  actions: {
    async login(nisn, password, remember = false) {
      // 1. Ambil CSRF cookie dulu (WAJIB untuk Sanctum cookie auth)
      await api.get("/sanctum/csrf-cookie");

      // 2. Kirim login — field 'email' diisi NISN (backend handle di AuthController)
      const { data } = await api.post("/api/login", {
        email: nisn, // ← kirim NISN di field email
        password,
        remember,
      });

      // 3. Simpan hanya data user (BUKAN token — token ada di httpOnly cookie)
      this.user = data.user;
      sessionStorage.setItem("user", JSON.stringify(data.user));

      return data;
    },

    async logout() {
      try {
        await api.post("/api/logout");
      } catch (e) {
        // tetap logout meski request gagal
        console.warn("Logout request failed:", e);
      } finally {
        this.user = null;
        sessionStorage.removeItem("user");
      }
    },

    // Panggil saat app load — verifikasi session ke server
    async fetchMe() {
      try {
        const { data } = await api.get("/api/me");
        this.user = data.user;
        sessionStorage.setItem("user", JSON.stringify(data.user));
        return true;
      } catch {
        // Session expired atau cookie tidak valid
        this.user = null;
        sessionStorage.removeItem("user");
        return false;
      }
    },
  },
});
