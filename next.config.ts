import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 禁用 Turbopack（路径含中文会崩溃）
  experimental: {},
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
};

export default nextConfig;
