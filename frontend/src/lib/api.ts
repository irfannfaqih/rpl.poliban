import axios from "axios";
import { toast } from "sonner";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Request interceptor — attach token
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor — handle 401 and 403
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401 = Unauthenticated (token tidak valid/expired) → logout dan redirect ke login
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        if (!window.location.pathname.startsWith("/auth/")) {
          localStorage.removeItem("auth_token");
          localStorage.removeItem("auth-storage");
          window.location.href = "/auth/login?session_expired=1";
        }
      }
    }
    // 403 = Forbidden (sesi valid, tapi akses ditolak) → JANGAN logout.

    // Handle 422 Validation Errors globally
    if (error.response?.status === 422) {
      if (typeof window !== "undefined") {
        const data = error.response.data;
        if (data.errors) {
          const errorMessages = Object.values(data.errors).flat() as string[];
          if (errorMessages.length > 0) {
            toast.error("Validasi Gagal", {
              description: errorMessages.join(", "),
            });
          }
        } else if (data.message) {
          toast.error("Peringatan", { description: data.message });
        } else {
          toast.error("Validasi Gagal", {
            description:
              "Terdapat kesalahan pada input Anda. Silakan periksa kembali.",
          });
        }
      }
    }

    return Promise.reject(error);
  },
);

export default api;
