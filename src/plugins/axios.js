import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000",
  withCredentials: true, // ← kirim cookie di setiap request
  withXSRFToken: true, // ← kirim CSRF token otomatis
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

export default api;
