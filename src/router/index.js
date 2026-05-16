// src/router/index.js
import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/auth";
import LoginView from "../views/pages/LoginView.vue";
import AbsensiPage from "../views/pages/AbsensiPage.vue";

const routes = [
  { path: "/login", component: LoginView },
  {
    path: "/absensi",
    component: AbsensiPage,
    meta: { requiresAuth: true },
  },
  {
    path: "/dashboard",
    component: () => import("../views/pages/DashboardView.vue"),
    meta: { requiresAuth: true, roles: ["admin", "guru"] },
  },
  { path: "/:pathMatch(.*)*", redirect: "/login" },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();

  if (!to.meta.requiresAuth) return true;

  // Kalau belum ada user di memory, cek ke server
  if (!auth.user) {
    const valid = await auth.fetchMe();
    if (!valid) return "/login";
  }

  // Cek role kalau route punya requirement
  if (to.meta.roles && !to.meta.roles.some((r) => auth.user?.roles?.includes(r))) {
    return "/absensi"; // redirect ke halaman default
  }

  return true;
});

export default router;
