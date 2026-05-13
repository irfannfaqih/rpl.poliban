import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AsesorStatus = 'Belum Dinilai' | 'Sedang Dinilai' | 'Submit Final';

export interface TugasAsesmen {
  id: string; // ID Penugasan
  pemohonId: string;
  namaPemohon: string;
  asalPt: string;
  prodi: string;
  tanggalMasuk: string;
  status: AsesorStatus;
}

// Form 02
export interface PraAsesmenData {
  isSubmitted: boolean;
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
  rekomendasi: 'Lanjut Penuh' | 'Lanjut dengan Catatan' | 'Tidak Memenuhi Syarat' | null;
  catatanRekomendasi: string;
}

interface AsesorState {
  asesorInfo: {
    id: string;
    nama: string;
    nip: string;
    jabatan: string;
  } | null;
  tugasList: TugasAsesmen[];
  
  // Keyed by pemohonId
  praAsesmenData: Record<string, PraAsesmenData>;
  
  // Actions
  setAsesorInfo: (info: AsesorState['asesorInfo']) => void;
  updatePraAsesmen: (pemohonId: string, data: Partial<PraAsesmenData>) => void;
  submitPraAsesmen: (pemohonId: string) => void;
  updateStatusTugas: (pemohonId: string, status: AsesorStatus) => void;
}

const mockTugasList: TugasAsesmen[] = [
  {
    id: "TGS-001",
    pemohonId: "PMH-001",
    namaPemohon: "Pemohon Demo",
    asalPt: "Universitas Contoh",
    prodi: "D4 Sistem Informasi Kota Cerdas",
    tanggalMasuk: "2026-05-01",
    status: "Belum Dinilai"
  },
  {
    id: "TGS-002",
    pemohonId: "PMH-002",
    namaPemohon: "Budi Santoso",
    asalPt: "Politeknik Dummy",
    prodi: "D4 Sistem Informasi Kota Cerdas",
    tanggalMasuk: "2026-05-02",
    status: "Sedang Dinilai"
  }
];

const initialPraAsesmen: PraAsesmenData = {
  isSubmitted: false,
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
  catatanRekomendasi: ""
};

export const useAsesorStore = create<AsesorState>()(
  persist(
    (set, get) => ({
      asesorInfo: {
        id: "ASR-001",
        nama: "Dr. Asesor Satu, M.Kom",
        nip: "198001012005011001",
        jabatan: "Lektor Kepala"
      },
      tugasList: mockTugasList,
      praAsesmenData: {},

      setAsesorInfo: (info) => set({ asesorInfo: info }),
      
      updatePraAsesmen: (pemohonId, data) => 
        set((state) => {
          const current = state.praAsesmenData[pemohonId] || { ...initialPraAsesmen };
          return {
            praAsesmenData: {
              ...state.praAsesmenData,
              [pemohonId]: { ...current, ...data }
            }
          };
        }),

      submitPraAsesmen: (pemohonId) =>
        set((state) => {
          const current = state.praAsesmenData[pemohonId] || { ...initialPraAsesmen };
          
          // Update task status to "Sedang Dinilai" if it was "Belum Dinilai"
          const updatedTugasList = state.tugasList.map(t => 
            t.pemohonId === pemohonId && t.status === "Belum Dinilai"
              ? { ...t, status: "Sedang Dinilai" as AsesorStatus }
              : t
          );

          return {
            praAsesmenData: {
              ...state.praAsesmenData,
              [pemohonId]: { ...current, isSubmitted: true }
            },
            tugasList: updatedTugasList
          };
        }),
        
      updateStatusTugas: (pemohonId, status) => 
        set((state) => ({
          tugasList: state.tugasList.map(t => 
            t.pemohonId === pemohonId ? { ...t, status } : t
          )
        }))
    }),
    {
      name: 'asesor-storage',
    }
  )
);
