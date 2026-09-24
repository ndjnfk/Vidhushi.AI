"use client";

import { ApiError, apiRequest } from "@/lib/api";

// The admin session is separate from the customer login: its own token,
// stored under its own key, only accepted by the /admin API.
const TOKEN_KEY = "vidushiji_admin_token";

export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAdminToken(token: string) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // ignore
  }
}

export function clearAdminToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

// Fetch with the admin token; an expired/invalid session sends the admin
// back to the login screen.
export async function adminFetch<T>(path: string, options?: RequestInit): Promise<T> {
  try {
    return await apiRequest<T>(path, options, getAdminToken());
  } catch (e) {
    if (e instanceof ApiError && (e.status === 401 || e.status === 403) && typeof window !== "undefined") {
      clearAdminToken();
      window.location.href = `/admin/login?next=${encodeURIComponent(window.location.pathname)}`;
    }
    throw e;
  }
}
