import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hide the dev-only "N" badge; it sat on top of the admin logout button.
  devIndicators: false,
  // One address for the site: www.vidushiji.com sends visitors (and search
  // engines, which were indexing every page twice) to vidushiji.com.
  async redirects() {
    return [{
      source: "/:path*",
      has: [{ type: "host", value: "www.vidushiji.com" }],
      destination: "https://vidushiji.com/:path*",
      permanent: true,
    }];
  },
  // Fixed decorative images in public/ change rarely: let browsers keep them
  // for 30 days instead of re-checking them on every visit.
  async headers() {
    return ["/moons/:file*", "/home/:file*", "/shop/:file*"].map((source) => ({
      source,
      headers: [{ key: "Cache-Control", value: "public, max-age=2592000, stale-while-revalidate=86400" }],
    }));
  },
};

export default nextConfig;
