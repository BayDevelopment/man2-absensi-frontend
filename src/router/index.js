// src/router/index.js
import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/auth";
import { setAuthToken, getToken } from "../plugins/axios";

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
  // Tangkap semua route yang tidak dikenal
  { path: "/:pathMatch(.*)*", redirect: "/login" },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// ─── Navigation Guard ─────────────────────────────────────────────────────────
router.beforeEach(async (to) => {
  const auth = useAuthStore();

  // Inisialisasi auth hanya sekali per sesi (saat isReady masih false)
  if (!auth.isReady) {
    const token = getToken(); // pakai helper, bukan akses storage langsung

    if (token) {
      setAuthToken(token); // pakai helper dari axios.js, tidak duplikasi logika
      await auth.fetchMe(); // isReady di-set true di dalam finally fetchMe
    } else {
      auth.isReady = true; // tidak ada token → langsung tandai ready
    }
  }

  // ── Guard: halaman guest (login) ──────────────────────────────────────────
  if (to.meta.requiresGuest) {
    return auth.isLoggedIn ? "/dashboard" : true;
  }

  // ── Guard: halaman protected ──────────────────────────────────────────────
  if (to.meta.requiresAuth) {
    if (!auth.isLoggedIn) {
      // Simpan tujuan asal agar bisa redirect balik setelah login
      return { path: "/login", query: { redirect: to.fullPath } };
    }

    if (!auth.isSiswa) {
      // User login tapi bukan siswa → tolak dengan pesan jelas
      return { path: "/login", query: { error: "unauthorized" } };
    }
  }

  return true;
});

export default router;
