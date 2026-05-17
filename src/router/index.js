// src/router/index.js
import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/auth";

const routes = [
  { path: "/", redirect: "/login" },

  {
    path: "/login",
    component: () => import("../views/pages/LoginView.vue"),
    meta: { requiresGuest: true, hideLayout: true }, // ← tambah hideLayout
  },

  {
    path: "/dashboard",
    component: () => import("../views/pages/DashboardView.vue"),
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

  // ← TAMBAH pengecekan token dulu sebelum fetchMe
  const token = localStorage.getItem("token");

  if (token && !auth.user) {
    await auth.fetchMe();
  }

  if (to.meta.requiresGuest) {
    return auth.user ? "/dashboard" : true;
  }

  if (to.meta.requiresAuth) {
    if (!auth.user) {
      return { path: "/login", query: { redirect: to.fullPath } };
    }

    if (!auth.isSiswa) {
      window.location.href = "/login";
      return false;
    }
  }

  return true;
});

export default router;
