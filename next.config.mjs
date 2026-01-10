/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output for Railway deployment
  output: 'standalone',
  
  experimental: {
    // This helps with Railway deployment
  },
  
  // Skip type checking and linting during build for faster builds
  // (we run these separately in CI)
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },

  // Security Headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://*.supabase.co",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
              "frame-ancestors 'self'",
              "form-action 'self'",
              "base-uri 'self'"
            ].join('; ')
          }
        ]
      }
    ];
  }
};

export default nextConfig; 