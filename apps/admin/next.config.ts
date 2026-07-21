import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // El alta de spots sube el avatar (hasta 2MB) vía Server Action.
      bodySizeLimit: "3mb",
    },
  },
  images: {
    remotePatterns: [
      { hostname: "*.googleusercontent.com" },
      { hostname: `${process.env.NEXT_PUBLIC_SUPABASE_URL?.split("/")[2]}` },
    ],
  },
};

export default nextConfig;
