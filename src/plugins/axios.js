// src/plugins/axios.js
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "",
  headers: {
    Accept: "application/json",
  },
});

export function getToken() {
  return sessionStorage.getItem("token");
}

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }
}

export function clearAuthToken() {
  delete api.defaults.headers.common["Authorization"];
}

// ✅ INI YANG PERLU DITAMBAH — token dibaca fresh setiap request
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isVerifyOtp = error.config?.url?.includes("/verify-otp");

    if (error.response?.status === 401) {
      const isOtpPending = sessionStorage.getItem("pending_otp_user_id");
      const isVerifyOtpPage = window.location.pathname === "/verify-otp";

      if (isOtpPending || isVerifyOtpPage || isVerifyOtp) {
        return Promise.reject(error); // ← diam-diam reject, tidak redirect
      }

      localStorage.removeItem("token");
      sessionStorage.removeItem("token");
      localStorage.removeItem("user");
      sessionStorage.removeItem("user");
      clearAuthToken();

      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export default api;
