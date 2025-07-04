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
  
  // Webpack configuration for MJML with proper error handling
  webpack: (config, { isServer, webpack }) => {
    // Add fallbacks for Node.js modules in client-side code
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        crypto: false,
        buffer: false,
        stream: false,
        util: false,
        url: false,
        querystring: false,
        http: false,
        https: false,
        zlib: false,
      };
    }
    
    if (isServer) {
      // Exclude MJML and related packages from webpack bundling on server
      config.externals = config.externals || [];
      config.externals.push({
        'mjml': 'commonjs mjml',
        'html-minifier': 'commonjs html-minifier',
        'uglify-js': 'commonjs uglify-js',
        'juice': 'commonjs juice',
        'html-validate': 'commonjs html-validate',
        'html-validate/dist/es/cli.js': 'commonjs html-validate/dist/es/cli.js'
      });
    }
    
    // Add proper module resolution
    config.resolve.modules = config.resolve.modules || [];
    config.resolve.modules.push('node_modules');
    
    return config;
  },
};

module.exports = nextConfig;
