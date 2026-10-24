import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  async rewrites() {
    const apiOrigin = process.env.API_INTERNAL_URL || 'http://127.0.0.1:5000';
    return [
      {
        source: '/api/:path*',
        destination: `${apiOrigin}/api/:path*`,
      },
      {
        source: '/webhook',
        destination: `${apiOrigin}/webhook`,
      },
    ];
  },
};

export default nextConfig;
