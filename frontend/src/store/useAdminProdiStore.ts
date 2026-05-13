import { create } from "zustand";

interface AdminProdiInfo {
  nama: string;
  nip: string;
  prodi: string;
  fakultas: string;
}

interface AdminProdiState {
  adminInfo: AdminProdiInfo | null;
  setAdminInfo: (info: AdminProdiInfo) => void;
  clearAdminInfo: () => void;
}

export const useAdminProdiStore = create<AdminProdiState>((set) => ({
  adminInfo: {
    nama: "Budi Santoso, M.Kom.",
    nip: "198001012005011002",
    prodi: "Teknik Informatika (D3)",
    fakultas: "Teknik Elektro",
  }, // Default mock data
  setAdminInfo: (info) => set({ adminInfo: info }),
  clearAdminInfo: () => set({ adminInfo: null }),
}));
