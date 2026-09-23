import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// Hosts that should always render the default Vidushiji.ai site, never a
// vendor storefront — local dev, the primary production domain, and any
// Vercel-style preview domain.
const PRIMARY_HOST_PATTERNS = [/^localhost(:\d+)?$/, /^127\.0\.0\.1(:\d+)?$/, /\.vercel\.app$/];

export async function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const hostname = host.split(":")[0];

  if (PRIMARY_HOST_PATTERNS.some((p) => p.test(host)) || hostname === (process.env.NEXT_PUBLIC_PRIMARY_HOST ?? "")) {
    return NextResponse.next();
  }

  // Only check custom-domain resolution for the site root — a vendor
  // storefront is a single branded landing page for this MVP, not a full
  // multi-route white-labeled site.
  if (request.nextUrl.pathname !== "/") {
    return NextResponse.next();
  }

  try {
    const res = await fetch(`${API_URL}/storefront/resolve?host=${encodeURIComponent(hostname)}`);
    if (res.ok) {
      const storefront = await res.json();
      if (storefront?.storefront_slug) {
        const url = request.nextUrl.clone();
        url.pathname = `/vendor/${storefront.storefront_slug}`;
        return NextResponse.rewrite(url);
      }
    }
  } catch {
    // Backend unreachable — fall through to the default site rather than break the request.
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/",
};
