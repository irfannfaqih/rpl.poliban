import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { dataProdi } from '@/data/prodi';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface DokumenTambahan {
  id: string;          // "DOK-1", "DOK-2", etc.
  tipe: string;        // dari dropdown tipe dokumen
  deskripsi: string;   // deskripsi singkat oleh pemohon
  fileName: string;    // nama file yang di-upload
}

interface DokumenWajib {
  Ijazah?: string;
  Transkrip?: string;
}

interface BorangData {
  sectionA: Record<string, string>;
  sectionB: Record<string, unknown[]>;
  sectionC: Record<string, unknown[]>;
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
  data: BorangData;
  activeSection: string;
  lastSaved: Date | null;
  touchedSections: string[];
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

/* ------------------------------------------------------------------ */
/*  Store                                                              */
/* ------------------------------------------------------------------ */

export const useBorangStore = create<BorangState>()(
  persist(
    (set, get) => ({
      data: initialBorangData,
      activeSection: 'sectionA',
      lastSaved: null,
      touchedSections: ['sectionA'],

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

      resetBorang: () => set({ data: initialBorangData, lastSaved: null, touchedSections: ['sectionA'] }),
      
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
            return !!(s.namaLengkap && s.nik?.length === 16 && s.tempatLahir && s.tanggalLahir && s.jenisKelamin && s.noHP && s.alamat && s.emailPribadi && s.pasFoto);
          }

          case 'sectionB': {
            const items = (data.sectionB.items || []) as Record<string, string>[];
            const transkrip = (data.sectionB.transkrip || []) as Record<string, string>[];
            
            if (items.length === 0) return false;
            const itemsValid = items.every((it) => 
              it.jenjang && it.institusi && it.tahunMasuk && it.tahunLulus &&
              it.jenjang.trim() !== "" && it.institusi.trim() !== ""
            );
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
            if (!prodiId) return false;
            const prodi = dataProdi.find(p => p.id === prodiId);
            if (!prodi) return false;
            const allCpmk = prodi.kurikulum.flatMap(mk => mk.cpmk);
            if (allCpmk.length === 0) return true;
            const evaluasi = data.sectionD.evaluasi || {};
            return allCpmk.every(c => !!evaluasi[c.id]?.profisiensi);
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
    }
  )
);
