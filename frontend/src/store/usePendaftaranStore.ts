/**
 * usePendaftaranStore
 *
 * Store minimal yang hanya menyimpan ID pendaftaran aktif.
 * Semua data pendaftaran (status, jadwal, pleno, dll) diambil dari API
 * via React Query di masing-masing page/component.
 *
 * Sebelumnya store ini berisi:
 * - jadwal mock hardcoded dengan nama asesor palsu
 * - submitPendaftaran() yang pakai setTimeout (simulasi)
 * - simulatePayment() yang pakai setTimeout (simulasi)
 * Semua itu sudah dihapus.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface PendaftaranState {
  ownerUserId: number | null;
  /** ID pendaftaran aktif. null = belum punya pendaftaran. */
  pendaftaranId: number | null;
  prodiId: string | null;
  nama: string;
  email: string;

  setOwnerContext: (userId: number | null) => void;
  setPendaftaranId: (id: number | null) => void;
  setProfile: (nama: string, email: string, prodiId: string | null) => void;
  clearPendaftaran: () => void;
}

export const usePendaftaranStore = create<PendaftaranState>()(
  persist(
    (set) => ({
      ownerUserId: null,
      pendaftaranId: null,
      prodiId: null,
      nama: "",
      email: "",

      setOwnerContext: (userId) =>
        set((state) => {
          if (state.ownerUserId === userId) return {};

          return {
            ownerUserId: userId,
            pendaftaranId: null,
            prodiId: null,
            nama: "",
            email: "",
          };
        }),
      setPendaftaranId: (id) => set({ pendaftaranId: id }),
      setProfile: (nama, email, prodiId) => set({ nama, email, prodiId }),
      clearPendaftaran: () => set({
        ownerUserId: null,
        pendaftaranId: null,
        prodiId: null,
        nama: "",
        email: "",
      }),
    }),
    {
      name: "pendaftaran-storage",
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);
