const TOKEN_KEY = "vidushiji_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // ignore (private browsing / blocked storage)
  }
  window.dispatchEvent(new Event("vidushiji:auth"));
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
  window.dispatchEvent(new Event("vidushiji:auth"));
}

export function isLoggedIn(): boolean {
  return getToken() !== null;
}
