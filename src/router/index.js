// src/router/index.js
import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/auth";
import { setAuthToken, getToken } from "../plugins/axios";

const routes = [
  { path: "/", redirect: "/login" },
  {
    path: "/login",
    name: "Login",
    component: () => import("../views/pages/LoginView.vue"),
    meta: { requiresGuest: true, hideLayout: true },
  },
  {
    path: "/dashboard",
    name: "Dashboard",
    component: () => import("../views/pages/DashboardView.vue"),
    meta: { requiresAuth: true, layout: "main" },
  },
  {
    path: "/riwayat",
    component: () => import("../views/pages/RiwayatView.vue"),
    meta: { requiresAuth: true, layout: "main" },
  },
  {
    path: "/jadwal",
    component: () => import("../views/pages/JadwalView.vue"),
    meta: { requiresAuth: true, layout: "main" },
  },
  {
    path: "/profil",
    component: () => import("../views/pages/ProfileView.vue"),
    meta: { requiresAuth: true, layout: "main" },
  },
  {
    path: "/pengaturan",
    component: () => import("../views/pages/PengaturanView.vue"),
    meta: { requiresAuth: true, layout: "main" },
  },
  {
    path: "/absensi",
    component: () => import("../views/pages/AbsensiPage.vue"),
    meta: { requiresAuth: true, layout: "main" },
  },
  {
    path: "/verify-otp",
    name: "VerifyOtp",
    component: () => import("@/views/VerifyOtp.vue"),
    meta: { requiresOtp: true, hideLayout: true }, // ← tambah ini
  },
  {
    path: "/:pathMatch(.*)*",
    redirect: "/login",
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();

  // ── Cek OTP DULU sebelum fetchMe ──────────────────────────────────────────
  if (to.meta.requiresOtp) {
    const pendingId = auth.pendingUserId || sessionStorage.getItem("pending_otp_user_id");

    if (!pendingId) {
      return "/login";
    }

    if (!auth.pendingUserId) {
      auth.pendingUserId = Number(pendingId);
      auth.requireOtp = true;
    }

    auth.isReady = true; // ← pastikan tidak masuk blok fetchMe di bawah
    return true;
  }
  // ──────────────────────────────────────────────────────────────────────────

  if (!auth.isReady) {
    const token = getToken();

    if (token) {
      setAuthToken(token);
      await auth.fetchMe();
    } else {
      auth._clearSession(); // aman: bukan halaman OTP
      auth.isReady = true;
    }
  }

  if (to.meta.requiresGuest) {
    if (auth.isLoggedIn && auth.isSiswa) return "/dashboard";
    return true;
  }

  if (to.meta.requiresAuth) {
    if (!auth.isLoggedIn || !auth.isSiswa) {
      auth._clearSession();
      auth.isReady = true;
      return { path: "/login", query: { redirect: to.fullPath } };
    }

    // Kalau masih pending OTP, jangan boleh masuk
    const pendingId = auth.pendingUserId || sessionStorage.getItem("pending_otp_user_id");
    if (pendingId) {
      return "/verify-otp";
    }
  }

  return true;
});

export default router;
