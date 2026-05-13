import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type StatusAlur = 'pre_submit' | 'waiting_payment' | 'payment_verified' | 'waiting_verification' | 'pra_asesmen' | 'asesmen_tahap2' | 'pleno' | 'finished';

interface JadwalAsesmen {
  title: string;
  date: string;
  time: string;
  location: string;
  room?: string;
  link?: string;
  assessor: string[];
  notes: string;
}

interface PendaftaranState {
  statusAlur: StatusAlur;
  namaLengkap: string;
  email: string;
  prodiId: string | null;
  nomorPendaftaran: string | null;
  jadwal: JadwalAsesmen | null;
  setStatusAlur: (status: StatusAlur) => void;
  setProfile: (nama: string, email: string, prodiId: string) => void;
  submitPendaftaran: () => Promise<void>;
  simulatePayment: () => Promise<void>;
  setJadwal: (jadwal: JadwalAsesmen | null) => void;
}

export const usePendaftaranStore = create<PendaftaranState>()(
  persist(
    (set) => ({
      statusAlur: 'pre_submit',
      namaLengkap: '',
      email: '',
      prodiId: null,
      nomorPendaftaran: null,
      jadwal: {
        title: "Asesmen Tahap 2 (Wawancara)",
        date: "Sabtu, 28 Oktober 2026",
        time: "13:00 - 15:00 WITA",
        location: "kampus POLIBAN, Gedung Elektro",
        room: "Ruang (H-201)",
        assessor: [
          "Agus Setiyo Budi Nugroho, S.T., M.Kom.",
          "Rahimi Fitri, S.Kom., M.Kom."
        ],
        notes: "Mohon hadir tepat waktu dan membawa dokumen portofolio asli untuk divalidasi oleh Tim Asesor."
      },
      setStatusAlur: (status) => set({ statusAlur: status }),
      setProfile: (nama, email, prodiId) => set({ namaLengkap: nama, email, prodiId }),
      setJadwal: (jadwal) => set({ jadwal }),
      submitPendaftaran: async () => {
        // Simulate API call for final submit
        return new Promise((resolve) => {
          setTimeout(() => {
            set({ statusAlur: 'waiting_verification' });
            resolve();
          }, 1500);
        });
      },
      simulatePayment: async () => {
        // Simulate API call for checking payment webhook
        return new Promise((resolve) => {
          setTimeout(() => {
            set({ statusAlur: 'payment_verified' });
            resolve();
          }, 1000);
        });
      }
    }),
    {
      name: 'pendaftaran-storage',
    }
  )
);
