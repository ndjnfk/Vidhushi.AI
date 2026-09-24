import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hide the dev-only "N" badge; it sat on top of the admin logout button.
  devIndicators: false,
};

export default nextConfig;
