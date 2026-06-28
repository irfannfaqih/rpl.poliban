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

const SESSION_STORAGE_KEYS = [
  AUTH_TOKEN_KEY,
  AUTH_STORAGE_KEY,
  ...WORKFLOW_STORAGE_KEYS,
];

const removeFromBrowserStorage = (key: string) => {
  localStorage.removeItem(key);
  sessionStorage.removeItem(key);
};

export const clearWorkflowStorage = () => {
  if (typeof window === "undefined") return;

  WORKFLOW_STORAGE_KEYS.forEach((key) => {
    removeFromBrowserStorage(key);
  });
};

export const clearBrowserSessionStorage = () => {
  if (typeof window === "undefined") return;

  SESSION_STORAGE_KEYS.forEach((key) => {
    removeFromBrowserStorage(key);
  });
};

export const markCrossTabSessionChanged = () => {
  if (typeof window === "undefined") return;

  sessionStorage.setItem(
    CROSS_TAB_SESSION_MESSAGE_KEY,
    CROSS_TAB_SESSION_MESSAGE,
  );
};
