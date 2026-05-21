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

// ✅ Helper: ambil token dari mana pun
function getToken() {
  return localStorage.getItem("token") || sessionStorage.getItem("token");
}

// ✅ Helper: set token ke axios
export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
}

// Auto set pas load
const token = getToken();
if (token) setAuthToken(token);

export default api;
