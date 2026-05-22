// src/plugins/axios.js
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: false,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

// ─── Helper ───────────────────────────────────────────────────────────────────

/** Ambil token dari localStorage atau sessionStorage */
export function getToken() {
  return localStorage.getItem("token") || sessionStorage.getItem("token");
}

/** Set / hapus Authorization header di axios */
export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
}

/** Hapus semua sisa auth (token + header) */
export function clearAuth() {
  localStorage.removeItem("token");
  sessionStorage.removeItem("token");
  setAuthToken(null);
}

// ─── Auto-inject token saat pertama kali load ─────────────────────────────────
const _initialToken = getToken();
if (_initialToken) setAuthToken(_initialToken);

// ─── Response interceptor: handle 401 global ─────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAuth();
      // Hindari redirect loop jika sudah di halaman login
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export default api;
