/**
 * alur.ts — Status alur pendaftaran dan helper navigasi.
 *
 * StatusAlur harus selalu sinkron dengan enum status_alur di DB.
 * Tabel pendaftaran DB enum:
 *   pre_submit | waiting_payment | payment_verified | waiting_verification |
 *   pra_asesmen | asesmen_tahap2 | pleno | finished | ditolak
 */

export type StatusAlur =
  | "pre_submit"
  | "waiting_payment"
  | "payment_verified"
  | "waiting_verification"
  | "pra_asesmen"
  | "asesmen_tahap2"
  | "pleno"
  | "finished"
  | "ditolak"; // ← ditambahkan: status saat pendaftaran ditolak admin

/** Status yang tampilkan full-screen focused mode (tanpa sidebar) */
export const FOCUSED_STATUSES: StatusAlur[] = [
  "pre_submit",
  "waiting_payment",
  "payment_verified",
];

/**
 * Tentukan path redirect berdasarkan status alur pemohon.
 * Dipakai saat pemohon login untuk langsung ke halaman yang sesuai.
 */
export const getRedirectPath = (status: StatusAlur): string => {
  switch (status) {
    case "pre_submit":
      return "/pemohon/borang";
    case "waiting_payment":
      return "/pemohon/bayar";
    case "payment_verified":
      return "/pemohon/borang";
    case "ditolak":
      return "/pemohon/dashboard"; // dashboard akan tampilkan status ditolak
    default:
      return "/pemohon/dashboard";
  }
};

export const isStatusAllowed = (
  currentStatus: StatusAlur,
  allowedStatuses: StatusAlur[],
): boolean => allowedStatuses.includes(currentStatus);

/** Label human-readable untuk setiap status alur */
export const STATUS_LABEL: Record<StatusAlur, string> = {
  pre_submit: "Registrasi",
  waiting_payment: "Menunggu Pembayaran",
  payment_verified: "Pembayaran Terverifikasi",
  waiting_verification: "Menunggu Verifikasi Berkas",
  pra_asesmen: "Pra-Asesmen",
  asesmen_tahap2: "Asesmen Tahap 2",
  pleno: "Sidang Pleno",
  finished: "Selesai",
  ditolak: "Ditolak",
};
