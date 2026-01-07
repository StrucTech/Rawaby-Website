/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable static page generation for error pages
  output: 'standalone',
  
  // Disable static optimization for all pages
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
};

export default nextConfig; 