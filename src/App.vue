<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useAuthStore } from "./stores/auth"; // ← tambah
import Navbar from "./components/AppNavbar.vue";
import Footer from "./components/AppFooter.vue";

const route = useRoute();
const auth = useAuthStore(); // ← tambah

// Tunggu auth selesai dicek sebelum render layout
const showLayout = computed(
  () =>
    auth.isReady && // ← tambah kondisi ini
    !route.meta.hideLayout &&
    route.meta.layout !== "main",
);
</script>

<template>
  <div class="app-wrapper">
    <!-- Skeleton/spinner selagi auth belum siap -->
    <template v-if="!auth.isReady">
      <div class="auth-loading" />
    </template>

    <template v-else>
      <Navbar v-if="showLayout" />
      <main class="app-main">
        <RouterView />
      </main>
      <Footer v-if="showLayout" />
    </template>
  </div>
</template>
