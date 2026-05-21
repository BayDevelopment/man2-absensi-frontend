// src/router/index.js
import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/auth";
import api from "../plugins/axios";

const routes = [
  { path: "/", redirect: "/login" },
  {
    path: "/login",
    component: () => import("../views/pages/LoginView.vue"),
    meta: { requiresGuest: true, hideLayout: true },
  },
  {
    path: "/dashboard",
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
  { path: "/:pathMatch(.*)*", redirect: "/login" },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();

  // ✅ Hanya jalankan init sekali — saat isReady masih false
  if (!auth.isReady) {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");

    if (token) {
      // Inject dulu ke axios sebelum fetchMe
      if (!api.defaults.headers.common["Authorization"]) {
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      }
      await auth.fetchMe(); // isReady di-set true di dalam fetchMe (finally)
    } else {
      auth.isReady = true; // ✅ Tidak ada token → langsung ready
    }
  }

  // Guard: halaman guest (login)
  if (to.meta.requiresGuest) {
    return auth.isLoggedIn ? "/dashboard" : true;
  }

  // Guard: halaman protected
  if (to.meta.requiresAuth) {
    if (!auth.isLoggedIn) {
      return { path: "/login", query: { redirect: to.fullPath } };
    }
    if (!auth.isSiswa) {
      return "/login";
    }
  }

  return true;
});

export default router;
