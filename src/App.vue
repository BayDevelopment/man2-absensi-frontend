<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import Navbar from "./components/AppNavbar.vue";
import Footer from "./components/AppFooter.vue";

const route = useRoute();

const showLayout = computed(() => !route.meta.hideLayout && route.meta.layout !== "main");
</script>

<template>
  <div class="app-wrapper">
    <Navbar v-if="showLayout" />
    <main class="app-main">
      <RouterView />
    </main>
    <Footer v-if="showLayout" />
  </div>
</template>
