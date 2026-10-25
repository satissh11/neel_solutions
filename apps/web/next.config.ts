import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  async rewrites() {
    // Production uses scripts/start.js to mount the API in-process on the same
    // PORT as Next.js. Keep the proxy only for the separate local dev servers.
    if (process.env.NODE_ENV === 'production' && !process.env.API_INTERNAL_URL) return [];
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
