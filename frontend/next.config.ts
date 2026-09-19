import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== 'production';

// ─── OWASP A05: Security Misconfiguration — HTTP Security Headers ─────────────
// Applied on every response from Next.js frontend.
// In development: 'unsafe-eval' is allowed because React dev mode requires it
//   for call-stack reconstruction and hot-module replacement.
// In production: 'unsafe-eval' is blocked — React never uses eval() in prod.

function buildCsp(): string {
  const scriptSrc = isDev
    ? // Dev: allow eval() for React HMR / Turbopack / call-stack features
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://apis.google.com"
    : // Production: strict — no eval
      "script-src 'self' 'unsafe-inline' https://accounts.google.com https://apis.google.com";

  const connectSrc = `connect-src 'self' ${
    process.env.NEXT_PUBLIC_API_URL || 'https://nadybackend.onrender.com'
  } https://accounts.google.com${isDev ? ' ws://localhost:* http://localhost:*' : ''}`;

  return [
    "default-src 'self'",
    scriptSrc,
    // Styles: self + inline (Next.js styled-jsx / Tailwind need unsafe-inline)
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    // Images: self + data URIs + all HTTPS (game banners, CDN images)
    "img-src 'self' data: blob: https:",
    // Fonts
    "font-src 'self' https://fonts.gstatic.com",
    // API + WebSocket connections
    connectSrc,
    // Frames: block all (no embeds / OAuth popups use window.open, not iframes)
    "frame-src 'none'",
    // Web workers
    "worker-src 'self' blob:",
    // No plugins or embeds
    "object-src 'none'",
    // Web manifest
    "manifest-src 'self'",
    // Only allow form submissions to self
    "form-action 'self'",
    // Prevent base-tag injection
    "base-uri 'self'",
  ].join('; ');
}

const securityHeaders = [
  // OWASP: Force HTTPS via HSTS (1 year, include subdomains, preload)
  // Note: HSTS is only sent in production — browsers ignore it on localhost
  ...(isDev ? [] : [{
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload',
  }]),
  // OWASP A03: Prevent MIME type sniffing
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  // OWASP: Block clickjacking
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  // OWASP: Limit referrer data leakage
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  // OWASP: Restrict browser features
  {
    key: 'Permissions-Policy',
    value: [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'payment=(self)',
      'usb=()',
      'interest-cohort=()',
    ].join(', '),
  },
  // OWASP A03: Content Security Policy
  {
    key: 'Content-Security-Policy',
    value: buildCsp(),
  },
];

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

  // Safety net: ensure production builds NEVER bake in localhost/127.0.0.1
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL &&
      !process.env.NEXT_PUBLIC_API_URL.includes('localhost') &&
      !process.env.NEXT_PUBLIC_API_URL.includes('127.0.0.1')
        ? process.env.NEXT_PUBLIC_API_URL
        : 'https://nadybackend.onrender.com',
  },

  // Fix turbopack root warning
  turbopack: {
    root: __dirname,
  },

  // Never expose source maps in production F12 Sources tab
  productionBrowserSourceMaps: false,

  // Strip console.log in production (keep error/warn)
  compiler: {
    removeConsole: isDev ? false : { exclude: ['error', 'warn'] },
  },

  // ✅ OWASP A05: Apply security headers to all routes
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },

  async rewrites() {
    const backendUrl =
      process.env.NEXT_PUBLIC_API_URL &&
      !process.env.NEXT_PUBLIC_API_URL.includes('localhost') &&
      !process.env.NEXT_PUBLIC_API_URL.includes('127.0.0.1')
        ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api$/, '')
        : 'http://localhost:5001';
    return [
      {
        source: '/api/v1/game',
        destination: `${backendUrl}/api/v1/game`,
      },
      {
        source: '/api/v1/game/:path*',
        destination: `${backendUrl}/api/v1/game/:path*`,
      },
      {
        source: '/api/v1/game2',
        destination: `${backendUrl}/api/v1/game2`,
      },
      {
        source: '/api/v1/game2/:path*',
        destination: `${backendUrl}/api/v1/game2/:path*`,
      },
      {
        source: '/api/v2/game',
        destination: `${backendUrl}/api/v2/game`,
      },
      {
        source: '/api/v2/game/:path*',
        destination: `${backendUrl}/api/v2/game/:path*`,
      },
      {
        source: '/api/products',
        destination: `${backendUrl}/api/products`,
      },
      {
        source: '/api/products/:path*',
        destination: `${backendUrl}/api/products/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${backendUrl}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
