export const AUTH_TOKEN_KEY = "auth_token";
export const AUTH_STORAGE_KEY = "auth-storage";
export const CROSS_TAB_SESSION_MESSAGE_KEY = "auth-session-change-message";
export const CROSS_TAB_SESSION_MESSAGE =
  "Sesi berubah di tab lain, halaman dimuat ulang.";

export const WORKFLOW_STORAGE_KEYS = [
  "pendaftaran-storage",
  "borang-storage",
  "asesor-storage",
];

export const clearWorkflowStorage = () => {
  if (typeof window === "undefined") return;

  WORKFLOW_STORAGE_KEYS.forEach((key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
};

export const markCrossTabSessionChanged = () => {
  if (typeof window === "undefined") return;

  sessionStorage.setItem(
    CROSS_TAB_SESSION_MESSAGE_KEY,
    CROSS_TAB_SESSION_MESSAGE,
  );
};
