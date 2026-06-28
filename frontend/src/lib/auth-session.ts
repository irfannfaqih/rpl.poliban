export const AUTH_TOKEN_KEY = "auth_token";
export const AUTH_STORAGE_KEY = "auth-storage";

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

export const getAuthToken = () => {
  if (typeof window === "undefined") return null;

  return sessionStorage.getItem(AUTH_TOKEN_KEY);
};

export const setAuthToken = (token: string) => {
  if (typeof window === "undefined") return;

  sessionStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_STORAGE_KEY);
};

export const removeAuthToken = () => {
  if (typeof window === "undefined") return;

  sessionStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_STORAGE_KEY);
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
