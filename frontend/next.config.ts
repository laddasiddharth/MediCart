import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        // Assuming your backend will run on port 3001 locally
        destination: 'http://localhost:3001/api/:path*',
      },
    ];
  },
};

export default nextConfig;
