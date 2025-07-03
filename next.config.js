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
    serverComponentsExternalPackages: ['mjml', 'html-minifier', 'uglify-js', 'juice']
  },
  
  // Enable compression
  compress: true,

  // Environment variables
  env: {
    NEXT_TELEMETRY_DISABLED: '1',
  },
  
  // Webpack configuration for MJML
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Exclude MJML and related packages from webpack bundling on server
      config.externals = config.externals || [];
      config.externals.push({
        'mjml': 'commonjs mjml',
        'html-minifier': 'commonjs html-minifier',
        'uglify-js': 'commonjs uglify-js',
        'juice': 'commonjs juice'
      });
    }
    
    return config;
  },
};

module.exports = nextConfig;
