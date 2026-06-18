import api from "@/lib/api";

export async function getPrivateFileObjectUrl(path: string): Promise<string> {
  const response = await api.get(path, { responseType: "blob" });
  return URL.createObjectURL(response.data);
}

export async function openPrivateFile(path: string): Promise<void> {
  const objectUrl = await getPrivateFileObjectUrl(path);
  const opened = window.open(objectUrl, "_blank", "noopener,noreferrer");

  if (!opened) {
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = "";
    link.click();
  }

  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
}

export const privateDocumentPath = (id: number | string) =>
  `/private-files/dokumen/${id}`;

export const privateArchivePath = (id: number | string) =>
  `/private-files/arsip/${id}`;

export const privateAppealPath = (id: number | string) =>
  `/private-files/sanggah/${id}`;
