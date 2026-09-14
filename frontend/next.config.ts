import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow images from external domains used in the app
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'flagcdn.com',
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
      },
      {
        protocol: 'https',
        hostname: 'nadybackend.onrender.com',
      },
      {
        protocol: 'https',
        hostname: 'robbytopupv2-backend.onrender.com',
      },
      {
        protocol: 'https',
        hostname: 'daratopup-backend-1.onrender.com',
      },
    ],
    unoptimized: true,
  },

  // Safety net: bake the production API URL in at build time even if env var is missing
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001',
  },

  // Fix turbopack root warning — point to the frontend directory
  turbopack: {
    root: __dirname,
  },

  // Never expose raw typescript source files or source maps in production F12 Sources tab
  productionBrowserSourceMaps: false,

  // Strip console.log statements in production builds to prevent leaking runtime details in F12 Console
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },
};

export default nextConfig;
