import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'apexmallstore.co',
      },
      {
        protocol: 'https',
        hostname: 'apexmallstore.top',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/dcehpphbf/image/upload/**',
      },
    ],
  },
};

export default nextConfig;
