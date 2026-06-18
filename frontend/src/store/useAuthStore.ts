import api from "@/lib/api";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface Prodi {
  id: number;
  kode: string;
  nama: string;
}

import { getRedirectPath, StatusAlur } from "@/lib/alur";

interface User {
  id: number;
  nama: string;
  email: string;
  nip: string | null;
  role: "pemohon" | "admin_prodi" | "asesor" | "pimpinan" | "super_admin";
  status_alur?: StatusAlur | null;
  prodi: Prodi | null;
  jabatan: string | null;
  phone: string | null;
  photo?: string | null;
  force_change_password: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isImpersonating: boolean;

  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
  clearAuth: () => void;
  clearImpersonate: () => void;
}

const ROLE_DASHBOARD_MAP: Record<string, string> = {
  pemohon: "/pemohon/dashboard",
  admin_prodi: "/admin-prodi/dashboard",
  asesor: "/asesor/dashboard",
  pimpinan: "/pimpinan/dashboard",
  super_admin: "/super-admin/gelombang",
};

export const clearWorkflowStorage = () => {
  if (typeof window === "undefined") return;

  const keys = [
    "pendaftaran-storage",
    "borang-storage",
    "asesor-storage",
  ];

  keys.forEach((key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
};

export const getRoleDashboard = (user: User | null): string => {
  if (!user) return "/auth/login";
  if (user.role === "pemohon" && user.status_alur) {
    return getRedirectPath(user.status_alur);
  }
  return ROLE_DASHBOARD_MAP[user.role] || "/auth/login";
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      isImpersonating: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post("/login", { email, password });
          const { token, user } = data;

          // Clear previous user's persisted stores
          clearWorkflowStorage();

          // Store token separately for API interceptor
          localStorage.setItem("auth_token", token);

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          await api.post("/logout");
        } catch {
          // Ignore error, clear auth anyway
        }
        localStorage.removeItem("auth_token");
        clearWorkflowStorage();
        set({ user: null, token: null, isAuthenticated: false });
      },

      fetchMe: async () => {
        try {
          const { data } = await api.get("/me");
          set({ user: data.user, isAuthenticated: true });
        } catch {
          get().clearAuth();
        }
      },

      updateUser: (userData) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null
        }));
      },

      clearAuth: () => {
        localStorage.removeItem("auth_token");
        clearWorkflowStorage();
        set({ user: null, token: null, isAuthenticated: false });
      },
      clearImpersonate: () => {
        set({ isImpersonating: false });
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
