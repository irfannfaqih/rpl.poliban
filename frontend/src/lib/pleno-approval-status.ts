export const PLENO_APPROVAL_STATUS = {
  MENUNGGU_KAPRODI: "menunggu_approval_kaprodi",
  MENUNGGU_PIMPINAN: "menunggu_approval_pimpinan",
  DITOLAK_KAPRODI: "ditolak_kaprodi",
  DITOLAK_PIMPINAN: "ditolak_pimpinan",
  APPROVED_FINAL: "approved_final",
} as const;

export type PlenoApprovalStatus =
  (typeof PLENO_APPROVAL_STATUS)[keyof typeof PLENO_APPROVAL_STATUS];

export const PLENO_APPROVAL_STATUS_LABEL: Record<PlenoApprovalStatus, string> = {
  [PLENO_APPROVAL_STATUS.MENUNGGU_KAPRODI]: "Menunggu Kaprodi",
  [PLENO_APPROVAL_STATUS.MENUNGGU_PIMPINAN]: "Menunggu Pimpinan",
  [PLENO_APPROVAL_STATUS.DITOLAK_KAPRODI]: "Ditolak Kaprodi",
  [PLENO_APPROVAL_STATUS.DITOLAK_PIMPINAN]: "Ditolak Pimpinan",
  [PLENO_APPROVAL_STATUS.APPROVED_FINAL]: "Disetujui Final",
};

export const PLENO_APPROVAL_STATUS_OPTIONS = [
  { value: "all", label: "Semua Status" },
  ...Object.entries(PLENO_APPROVAL_STATUS_LABEL).map(([value, label]) => ({
    value,
    label,
  })),
];

export function getPlenoApprovalStatusLabel(status?: string | null) {
  if (!status) return "-";

  return PLENO_APPROVAL_STATUS_LABEL[status as PlenoApprovalStatus] || "Status Tidak Dikenal";
}

export function getPlenoApprovalStatusClass(status?: string | null) {
  if (status === PLENO_APPROVAL_STATUS.APPROVED_FINAL) {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }

  if (status === PLENO_APPROVAL_STATUS.MENUNGGU_PIMPINAN) {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }

  if (
    status === PLENO_APPROVAL_STATUS.DITOLAK_KAPRODI ||
    status === PLENO_APPROVAL_STATUS.DITOLAK_PIMPINAN
  ) {
    return "bg-red-50 text-red-700 border-red-200";
  }

  return "bg-amber-50 text-amber-700 border-amber-200";
}
