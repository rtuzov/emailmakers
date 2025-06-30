/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Enable experimental features for better performance
  experimental: {
    optimizeCss: true,
  },
  
  // Server external packages
  serverExternalPackages: ['mjml', 'juice', 'undici'],
  
  // Enable compression
  compress: true,

  // Environment variables
  env: {
    NEXT_TELEMETRY_DISABLED: '1',
  },
};

module.exports = nextConfig;
