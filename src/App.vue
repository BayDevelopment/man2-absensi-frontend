<script setup>
import { useAuthStore } from "./stores/auth";

const auth = useAuthStore();
</script>

<template>
  <div class="app-wrapper">
    <template v-if="!auth.isReady">
      <div class="auth-loading">
        <div class="auth-loading__spinner" />
      </div>
    </template>

    <template v-else>
      <RouterView />
    </template>
  </div>
</template>

<style scoped>
.auth-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
}
.auth-loading__spinner {
  width: 36px;
  height: 36px;
  border: 3px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
