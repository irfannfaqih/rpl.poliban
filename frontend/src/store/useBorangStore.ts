import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface DokumenTambahan {
  id: string;          // "DOK-1", "DOK-2", etc.
  dbId?: string;       // ID database setelah upload berhasil
  tipe: string;        // dari dropdown tipe dokumen
  deskripsi: string;   // deskripsi singkat oleh pemohon
  fileName: string;    // nama file yang di-upload
  url?: string;        // URL untuk mendownload/melihat file
}

export interface DokumenWajib {
  Ijazah?: string;
  IjazahId?: string;
  IjazahUrl?: string;
  Transkrip?: string;
  TranskripId?: string;
  TranskripUrl?: string;
}

interface BorangData {
  sectionA: Record<string, string>;
  sectionB: Record<string, unknown[]>;
  sectionC: Record<string, any>;
  sectionD: {
    evaluasi: Record<string, {
      profisiensi: 1 | 2 | 4 | 5 | null;
      dokumenPendukung: string[]; // array of doc IDs: "Ijazah", "DOK-1", etc.
    }>;
  };
  sectionE: {
    dokumenWajib: DokumenWajib;
    dokumenTambahan: DokumenTambahan[];
  };
}

interface BorangState {
  ownerUserId: number | null;
  ownerPendaftaranId: number | null;
  data: BorangData;
  activeSection: string;
  lastSaved: Date | null;
  touchedSections: string[];
  setOwnerContext: (userId: number | null, pendaftaranId: number | null) => void;
  updateSection: (section: keyof BorangData, values: BorangData[keyof BorangData]) => void;
  setActiveSection: (section: string) => void;
  setSectionTouched: (section: string) => void;
  resetBorang: () => void;
  validateSection: (sectionId: string, prodiId?: string | null) => boolean;
  getAllDokumenList: () => { id: string; label: string }[];
}

/* ------------------------------------------------------------------ */
/*  Initial data                                                       */
/* ------------------------------------------------------------------ */

const initialBorangData: BorangData = {
  sectionA: {
    namaLengkap: '',
    nik: '',
    tempatLahir: '',
    tanggalLahir: '',
    jenisKelamin: '',
    kebangsaan: '',
    noHP: '',
    alamat: '',
    emailPribadi: '',
    pasFoto: '', // Profile Photo
  },
  sectionB: {
    items: [],
    transkrip: [],
    pelatihan: []
  },
  sectionC: {
    instansi: '',
    pekerjaan: '',
    alamatInstansi: '',
    telpInstansi: '',
    golongan: '',
    items: [],
    organisasi: [],
    penghargaan: []
  },
  sectionD: {
    evaluasi: {}
  },
  sectionE: {
    dokumenWajib: {},
    dokumenTambahan: []
  }
};

const freshBorangData = (): BorangData =>
  JSON.parse(JSON.stringify(initialBorangData)) as BorangData;

/* ------------------------------------------------------------------ */
/*  Store                                                              */
/* ------------------------------------------------------------------ */

export const useBorangStore = create<BorangState>()(
  persist(
    (set, get) => ({
      ownerUserId: null,
      ownerPendaftaranId: null,
      data: freshBorangData(),
      activeSection: 'sectionA',
      lastSaved: null,
      touchedSections: ['sectionA'],

      setOwnerContext: (userId, pendaftaranId) => {
        const state = get();
        if (
          state.ownerUserId === userId &&
          state.ownerPendaftaranId === pendaftaranId
        ) {
          return;
        }

        set({
          ownerUserId: userId,
          ownerPendaftaranId: pendaftaranId,
          data: freshBorangData(),
          activeSection: 'sectionA',
          lastSaved: null,
          touchedSections: ['sectionA'],
        });
      },

      updateSection: (section, values) =>
        set((state) => ({
          data: { ...state.data, [section]: values },
          lastSaved: new Date()
        })),

      setActiveSection: (section) => {
        const touched = get().touchedSections;
        if (!touched.includes(section)) {
          set({ touchedSections: [...touched, section] });
        }
        set({ activeSection: section });
      },

      setSectionTouched: (section) => {
        const touched = get().touchedSections;
        if (!touched.includes(section)) {
          set({ touchedSections: [...touched, section] });
        }
      },

      resetBorang: () => set({
        ownerUserId: null,
        ownerPendaftaranId: null,
        data: freshBorangData(),
        activeSection: 'sectionA',
        lastSaved: null,
        touchedSections: ['sectionA'],
      }),

      /* ------------------------------------------------------------ */
      /*  Helper: get flat list of all uploaded documents               */
      /* ------------------------------------------------------------ */
      getAllDokumenList: () => {
        const { data } = get();
        const list: { id: string; label: string }[] = [];
        const wajib = data.sectionE.dokumenWajib || {};

        // Ijazah & Transkrip are evidence, KTP & PasFoto are admin (not evidence)
        if (wajib.Ijazah) list.push({ id: 'Ijazah', label: 'Ijazah Terakhir' });
        if (wajib.Transkrip) list.push({ id: 'Transkrip', label: 'Transkrip Nilai' });

        const tambahan = data.sectionE.dokumenTambahan || [];
        tambahan.forEach((dok) => {
          if (dok.fileName) {
            list.push({ id: dok.id, label: `${dok.id} — ${dok.deskripsi || dok.tipe}` });
          }
        });

        return list;
      },

      /* ------------------------------------------------------------ */
      /*  Validation per section                                       */
      /* ------------------------------------------------------------ */
      validateSection: (sectionId, prodiId) => {
        const { data } = get();

        switch (sectionId) {
          case 'sectionA': {
            const s = data.sectionA;
            return !!(s.namaLengkap && s.nik?.length === 16 && s.tempatLahir && s.tanggalLahir && s.jenisKelamin && s.agama && s.kebangsaan && s.noHP && s.alamat && s.emailPribadi && s.pasFoto);
          }

          case 'sectionB': {
            const items = (data.sectionB.items || []) as Record<string, string>[];
            const transkrip = (data.sectionB.transkrip || []) as Record<string, string>[];
            const currentYear = new Date().getFullYear();
            const isValidYear = (value: string) => {
              const year = Number(value);
              return Number.isInteger(year) && year >= 1900 && year <= currentYear;
            };
            const isValidIpk = (value: string) => {
              if (value === undefined || value === null || value.toString().trim() === "") return false;
              const ipk = Number(value);
              return Number.isFinite(ipk) && ipk >= 0 && ipk <= 4;
            };

            if (items.length === 0) return false;
            const itemsValid = items.every((it) => {
              const tahunMasuk = Number(it.tahunMasuk);
              const tahunLulus = Number(it.tahunLulus);
              return !!(
                it.jenjang &&
                it.institusi &&
                it.jenjang.trim() !== "" &&
                it.institusi.trim() !== "" &&
                isValidYear(it.tahunMasuk) &&
                isValidYear(it.tahunLulus) &&
                tahunLulus >= tahunMasuk &&
                isValidIpk(it.ipk)
              );
            });
            if (!itemsValid) return false;

            if (transkrip.length === 0) return false;
            const transkripValid = transkrip.every((t) =>
              t.semester && t.namaMk && t.sks && t.nilaiHuruf && t.nilaiAngka &&
              t.semester.toString().trim() !== "" &&
              t.namaMk.trim() !== "" &&
              t.sks.toString().trim() !== "" &&
              t.nilaiHuruf.trim() !== "" &&
              t.nilaiAngka.toString().trim() !== ""
            );

            return transkripValid;
          }

          case 'sectionC': {
            const items = (data.sectionC.items || []) as Record<string, string>[];
            // Opsional: Jika tidak ada item, dianggap valid
            if (items.length === 0) return true;

            return items.every((it) =>
              it.namaPerusahaan && it.jabatan && it.tahunMulai &&
              it.namaPerusahaan.trim() !== "" && it.jabatan.trim() !== ""
            );
          }

          case 'sectionD': {
            const evaluasi = data.sectionD.evaluasi || {};
            const totalCpmk = (data.sectionD as any).totalCpmk || 0;
            if (totalCpmk === 0) return false;

            const filledCount = Object.values(evaluasi).filter(e => e.profisiensi !== null).length;
            return filledCount >= totalCpmk;
          }

          case 'sectionE': {
            const wajib = data.sectionE.dokumenWajib || {};
            // Semua dokumen wajib (Ijazah & Transkrip) harus terisi
            return !!(wajib.Ijazah && wajib.Transkrip);
          }

          default:
            return false;
        }
      }
    }),
    {
      name: 'borang-storage',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
