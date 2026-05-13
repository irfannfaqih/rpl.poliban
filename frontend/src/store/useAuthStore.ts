import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/api';

interface Prodi {
  id: number;
  kode: string;
  nama: string;
}

interface User {
  id: number;
  nama: string;
  email: string;
  nip: string | null;
  role: 'pemohon' | 'admin_prodi' | 'asesor' | 'pimpinan' | 'super_admin';
  prodi: Prodi | null;
  jabatan: string | null;
  phone: string | null;
  force_change_password: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
  clearAuth: () => void;
}

const ROLE_DASHBOARD_MAP: Record<string, string> = {
  pemohon: '/pemohon/dashboard',
  admin_prodi: '/admin-prodi/dashboard',
  asesor: '/asesor/dashboard',
  pimpinan: '/pimpinan/dashboard',
  super_admin: '/super-admin/gelombang',
};

export const getRoleDashboard = (role: string): string => {
  return ROLE_DASHBOARD_MAP[role] || '/auth/login';
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post('/login', { email, password });
          const { token, user } = data;

          // Store token separately for API interceptor
          localStorage.setItem('auth_token', token);

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
          await api.post('/logout');
        } catch {
          // Ignore error, clear auth anyway
        }
        localStorage.removeItem('auth_token');
        set({ user: null, token: null, isAuthenticated: false });
      },

      fetchMe: async () => {
        try {
          const { data } = await api.get('/me');
          set({ user: data.user, isAuthenticated: true });
        } catch {
          get().clearAuth();
        }
      },

      clearAuth: () => {
        localStorage.removeItem('auth_token');
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
