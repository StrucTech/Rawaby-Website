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
};

export default nextConfig; 