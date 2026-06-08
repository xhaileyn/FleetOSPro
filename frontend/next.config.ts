import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/',
        destination: '/website/index.html',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
