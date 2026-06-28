/**
 * useAsesorStore
 *
 * Store ini hanya menyimpan UI state lokal asesor — khususnya
 * draft Form 02 (Pra-Asesmen) yang sedang diisi tapi belum di-save ke server.
 *
 * Data seperti daftar tugas, info pendaftaran, dll TIDAK disimpan di sini.
 * Semua data server diambil langsung via React Query di masing-masing page/component.
 *
 * Sebelumnya store ini punya mockTugasList dan hardcoded asesorInfo —
 * keduanya sudah dihapus agar tidak ada data palsu di production.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// ── Types ──────────────────────────────────────────────────────────────────

/**
 * Draft lokal Form 02 per ID penugasan.
 * Disimpan di sessionStorage agar tidak hilang saat user refresh halaman,
 * tapi otomatis bersih saat tab ditutup.
 */
export interface PraAsesmenDraft {
  langkah1: boolean;
  langkah2: boolean;
  langkah3: boolean;
  langkah4: boolean;
  langkah5: boolean;
  langkah6: boolean;
  langkah7: boolean;
  langkah8: boolean;
  catatanObservasi: string;
  kebutuhanKhusus: string;
  rekomendasi: "lanjut_penuh" | "lanjut_catatan" | "tidak_memenuhi" | null;
  catatanRekomendasi: string;
}

const emptyDraft: PraAsesmenDraft = {
  langkah1: false,
  langkah2: false,
  langkah3: false,
  langkah4: false,
  langkah5: false,
  langkah6: false,
  langkah7: false,
  langkah8: false,
  catatanObservasi: "",
  kebutuhanKhusus: "",
  rekomendasi: null,
  catatanRekomendasi: "",
};

// ── State & Actions ────────────────────────────────────────────────────────

interface AsesorState {
  /** Draft Form 02 per ID penugasan (bukan per pemohon — pakai ID penugasan) */
  praAsesmenDrafts: Record<string, PraAsesmenDraft>;

  updateDraft: (tugasId: string, data: Partial<PraAsesmenDraft>) => void;
  clearDraft: (tugasId: string) => void;
  clearAllDrafts: () => void;
  resetAsesorStore: () => void;
  getDraft: (tugasId: string) => PraAsesmenDraft;
}

// ── Store ──────────────────────────────────────────────────────────────────

export const useAsesorStore = create<AsesorState>()(
  persist(
    (set, get) => ({
      praAsesmenDrafts: {},

      updateDraft: (tugasId, data) =>
        set((state) => ({
          praAsesmenDrafts: {
            ...state.praAsesmenDrafts,
            [tugasId]: {
              ...(state.praAsesmenDrafts[tugasId] ?? emptyDraft),
              ...data,
            },
          },
        })),

      clearDraft: (tugasId) =>
        set((state) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [tugasId]: _removed, ...rest } = state.praAsesmenDrafts;
          return { praAsesmenDrafts: rest };
        }),

      clearAllDrafts: () => set({ praAsesmenDrafts: {} }),

      resetAsesorStore: () => set({ praAsesmenDrafts: {} }),

      getDraft: (tugasId) =>
        get().praAsesmenDrafts[tugasId] ?? { ...emptyDraft },
    }),
    {
      name: "asesor-storage",
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);
