<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import Navbar from "./components/AppNavbar.vue";
import Footer from "./components/AppFooter.vue";

const route = useRoute();

// Route yang TIDAK tampilkan navbar & footer
const hiddenLayoutRoutes = ["/login", "/register", "/lupa-password"];

const showLayout = computed(() => {
  return !hiddenLayoutRoutes.includes(route.path);
});
</script>

<template>
  <div class="app-wrapper">
    <!-- Navbar hanya tampil kalau bukan halaman login -->
    <Navbar v-if="showLayout" />

    <!-- Main content -->
    <main class="app-main" :class="{ 'no-layout': !showLayout }">
      <RouterView />
    </main>

    <!-- Footer hanya tampil kalau bukan halaman login -->
    <Footer v-if="showLayout" />
  </div>
</template>

<style>
/* Global reset */
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  background: #071207;
  color: #e8f0e8;
  min-height: 100vh;
  font-family: "Plus Jakarta Sans", sans-serif;
}

.app-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-main {
  flex: 1;
  /* Kalau ada navbar (58px) beri padding atas supaya konten tidak tertutup */
}

/* Kalau halaman login — full screen tanpa padding */
.app-main.no-layout {
  padding-top: 0;
}
</style>
