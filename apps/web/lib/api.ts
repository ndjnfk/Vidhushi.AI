import { getToken } from "@/lib/auth";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export interface BirthDetailsIn {
  name: string;
  birth_date: string; // YYYY-MM-DD
  birth_time: string; // HH:MM:SS
  place_name: string;
  latitude: number;
  longitude: number;
}

export interface PlanetOut {
  planet: string;
  longitude: number;
  sign: string;
  degree_in_sign: number;
  nakshatra: string;
  nakshatra_lord: string;
  pada: number;
  house: number;
  is_retrograde: boolean;
}

export interface ChartOut {
  ascendant_sign: string;
  ascendant_degree: number;
  planets: PlanetOut[];
}

export interface AntardashaOut {
  lord: string;
  start: string;
  end: string;
}

export interface MahadashaOut {
  lord: string;
  start: string;
  end: string;
  antardashas: AntardashaOut[];
}

export interface PanchangOut {
  date: string;
  vara: string;
  tithi: string;
  tithi_paksha: string;
  nakshatra: string;
  yoga: string;
  karana: string;
  sunrise_utc: string;
  sunset_utc: string;
}

export interface KundliOut {
  id: string;
  name: string;
  birth_date: string;
  birth_time: string;
  place_name: string;
  timezone: string;
  d1_chart: ChartOut;
  d9_chart: ChartOut;
  dasha: MahadashaOut[];
  panchang: PanchangOut;
}

export interface KootaOut {
  name: string;
  points: number;
  max_points: number;
  note: string;
}

export interface GunaMilanOut {
  kootas: KootaOut[];
  total_points: number;
  max_points: number;
}

// The message is FastAPI's `detail` (readable, shown to users as-is); the
// status and raw body stay available for callers that need to branch on them.
export class ApiError extends Error {
  constructor(public status: number, public body: string) {
    super(ApiError.readable(status, body));
  }

  get detail(): string {
    return ApiError.readable(this.status, this.body);
  }

  private static readable(status: number, body: string): string {
    try {
      const d = JSON.parse(body)?.detail;
      if (typeof d === "string") return d;
      // 422 validation errors: a list of { msg, loc }.
      if (Array.isArray(d) && typeof d[0]?.msg === "string") return d[0].msg;
    } catch {
      // not JSON
    }
    return body.trim() || `Request failed (${status})`;
  }
}

export function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  return apiRequest<T>(path, options, getToken());
}

// Shared by the site (customer token) and the admin panel (admin token).
export async function apiRequest<T>(path: string, options: RequestInit | undefined, token: string | null): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new ApiError(res.status, body);
  }
  return res.json() as Promise<T>;
}

export function generateKundli(payload: BirthDetailsIn): Promise<KundliOut> {
  return apiFetch<KundliOut>("/kundli/generate", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getKundli(id: string): Promise<KundliOut> {
  return apiFetch<KundliOut>(`/kundli/${id}`);
}

export function computeGunaMilan(
  boy: BirthDetailsIn,
  girl: BirthDetailsIn
): Promise<GunaMilanOut> {
  return apiFetch<GunaMilanOut>("/matching/guna-milan", {
    method: "POST",
    body: JSON.stringify({ boy, girl }),
  });
}

export interface TokenOut {
  access_token: string;
  token_type: string;
}

export function register(email: string, password: string): Promise<TokenOut> {
  return apiFetch<TokenOut>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function login(email: string, password: string): Promise<TokenOut> {
  return apiFetch<TokenOut>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export interface MeOut {
  id: string;
  email: string;
  is_admin: boolean;
}

export function getMe(): Promise<MeOut> {
  return apiFetch<MeOut>("/auth/me");
}


export interface ContactMessageIn {
  name: string;
  email: string;
  phone: string;
  message: string;
  website: string; // honeypot, always empty for real visitors
}

export function sendContactMessage(body: ContactMessageIn): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>("/contact", { method: "POST", body: JSON.stringify(body) });
}
