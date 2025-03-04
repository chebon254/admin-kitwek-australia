import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'kitwek-victoria-files.blr1.digitaloceanspaces.com',
        port: '',
        pathname: '/**',
      }
    ],
  },
};

export default nextConfig;
