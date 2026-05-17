import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: false, // ← false
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

// Auto set token kalau ada
const token = localStorage.getItem("token");
if (token) {
  api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
}

export default api;
