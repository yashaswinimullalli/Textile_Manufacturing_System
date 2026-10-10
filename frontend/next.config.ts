import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Allow connecting to the local Express backend during development
  async rewrites() {
    return [];
  },
};

export default nextConfig;
