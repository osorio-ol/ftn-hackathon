const TOKEN_KEY = "cavaltec.auth.token";
const EXPIRES_KEY = "cavaltec.auth.expiresAt";

let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

export function triggerUnauthorized() {
  onUnauthorized?.();
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  const token = window.localStorage.getItem(TOKEN_KEY);
  const expiresAt = window.localStorage.getItem(EXPIRES_KEY);
  if (!token || !expiresAt) return null;
  if (Date.now() > Number(expiresAt)) {
    clearStoredToken();
    return null;
  }
  return token;
}

export function storeToken(token: string, expiresIn: number) {
  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(EXPIRES_KEY, String(Date.now() + expiresIn * 1000));
}

export function clearStoredToken() {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(EXPIRES_KEY);
}
