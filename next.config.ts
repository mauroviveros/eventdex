import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // A logo goes up to 1 MiB (the bucket's limit) plus the form around it.
    serverActions: { bodySizeLimit: "2mb" },
  },
};

export default nextConfig;
