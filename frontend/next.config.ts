import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    optimizePackageImports: ['@mui/material', '@mui/x-date-pickers-pro'],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
