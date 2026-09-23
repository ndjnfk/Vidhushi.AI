import { apiFetch, API_URL } from "@/lib/api";

export interface VendorBrandingOut {
  display_name: string | null;
  tagline: string | null;
  logo_url: string | null;
  primary_color: string;
  about_text: string | null;
}

export interface StorefrontOut {
  vendor_id: string;
  name: string;
  vendor_type: string;
  bio: string;
  languages: string[];
  specialties: string[];
  experience_years: number;
  rate_per_session: number | null;
  rating: number;
  storefront_slug: string | null;
  custom_domain: string | null;
  branding: VendorBrandingOut;
}

export function getStorefrontBySlug(slug: string): Promise<StorefrontOut> {
  return apiFetch<StorefrontOut>(`/storefront/${slug}`);
}

// Used by middleware — a plain fetch (no browser localStorage access there).
export async function resolveStorefrontByHost(host: string): Promise<StorefrontOut | null> {
  const res = await fetch(`${API_URL}/storefront/resolve?host=${encodeURIComponent(host)}`);
  if (!res.ok) return null;
  return res.json() as Promise<StorefrontOut>;
}
