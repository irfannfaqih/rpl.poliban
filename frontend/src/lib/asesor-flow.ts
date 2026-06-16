export interface AsesorTask {
  id: number;
  status: "belum_dinilai" | "sedang_dinilai" | "submit_final";
  created_at: string;
  pra_asesmen?: {
    is_submitted: boolean;
    rekomendasi: "lanjut_penuh" | "lanjut_catatan" | "tidak_memenuhi" | null;
    submitted_at?: string | null;
  } | null;
  pendaftaran?: {
    id: number;
    nomor_pendaftaran?: string;
    status_alur:
      | "pra_asesmen"
      | "asesmen_tahap2"
      | "pleno"
      | "finished"
      | "ditolak";
    user?: {
      nama?: string;
      instansi?: string | null;
    } | null;
    prodi?: {
      nama?: string;
    } | null;
    riwayat_pendidikan?: {
      institusi?: string;
    }[];
    uji_lanjutan?: {
      fase_tulis?: string | null;
      catatan_asesor?: { is_submitted: boolean }[];
    } | null;
    sk_keputusan?: {
      status?: string | null;
    } | null;
  } | null;
}

export type AsesorTaskStage =
  | "pra_asesmen"
  | "desk_evaluation"
  | "menunggu_asesor"
  | "asesmen_tahap2"
  | "pleno"
  | "selesai"
  | "ditolak";

export interface AsesorTaskAction {
  stage: AsesorTaskStage;
  stageLabel: string;
  actionLabel: string;
  href: string;
  isComplete: boolean;
}

export function resolveAsesorTaskAction(task: AsesorTask): AsesorTaskAction {
  const pendaftaranId = task.pendaftaran?.id;
  const statusAlur = task.pendaftaran?.status_alur;
  const praSubmitted = Boolean(task.pra_asesmen?.is_submitted);
  const praRejected = task.pra_asesmen?.rekomendasi === "tidak_memenuhi";

  if (!praSubmitted) {
    return {
      stage: "pra_asesmen",
      stageLabel: "Pra-Asesmen",
      actionLabel: "Mulai Pra-Asesmen",
      href: `/asesor/pra-asesmen?tugasId=${task.id}`,
      isComplete: false,
    };
  }

  if (praRejected || statusAlur === "ditolak") {
    return {
      stage: "ditolak",
      stageLabel: "Tidak Memenuhi Syarat",
      actionLabel: "Lihat Hasil Pra-Asesmen",
      href: `/asesor/pra-asesmen?tugasId=${task.id}`,
      isComplete: true,
    };
  }

  if (task.status !== "submit_final") {
    return {
      stage: "desk_evaluation",
      stageLabel: "Penilaian Portofolio",
      actionLabel: "Lanjutkan Penilaian",
      href: `/asesor/workspace?tugasId=${task.id}`,
      isComplete: false,
    };
  }

  if (statusAlur === "asesmen_tahap2" && pendaftaranId) {
    const sudahSubmitAt2 =
      task.pendaftaran?.uji_lanjutan?.catatan_asesor?.[0]?.is_submitted ?? false;
    const fase = task.pendaftaran?.uji_lanjutan?.fase_tulis;

    return {
      stage: "asesmen_tahap2",
      stageLabel: sudahSubmitAt2 ? "AT2 Sudah Dinilai" : "Asesmen Tahap 2",
      actionLabel: sudahSubmitAt2
        ? "Lihat Detail AT2"
        : fase === "koreksi"
          ? "Beri Penilaian AT2"
          : "Lanjutkan AT2",
      href: `/asesor/asesmen-tahap-2/form?pendaftaranId=${pendaftaranId}`,
      isComplete: sudahSubmitAt2,
    };
  }

  if (statusAlur === "pleno") {
    return {
      stage: "pleno",
      stageLabel: "Menunggu Sidang Pleno",
      actionLabel: "Lihat Hasil Asesmen",
      href: `/asesor/hasil?tugasId=${task.id}`,
      isComplete: true,
    };
  }

  if (statusAlur === "finished") {
    return {
      stage: "selesai",
      stageLabel: "Selesai",
      actionLabel: "Lihat Hasil Final",
      href: `/asesor/hasil?tugasId=${task.id}`,
      isComplete: true,
    };
  }

  return {
    stage: "menunggu_asesor",
    stageLabel: "Menunggu Asesor Lain",
    actionLabel: "Lihat Penilaian",
    href: `/asesor/workspace?tugasId=${task.id}`,
    isComplete: true,
  };
}
