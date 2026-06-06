import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Gift images are owner-provided URLs from any host
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
};

export default nextConfig;
