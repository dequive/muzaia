/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  
  // Development optimizations
  swcMinify: true,
  
  // Image optimization
  images: {
    domains: ['localhost', '127.0.0.1', '0.0.0.0'],
    formats: ['image/webp', 'image/avif']
  },
  output: 'standalone',
  

  // Production optimizations
  compress: true,
  poweredByHeader: false,

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ]
  },

  // Performance - swcMinify is now enabled by default in Next.js 15
  images: {
    unoptimized: false,
    formats: ['image/webp', 'image/avif'],
  },

  // Enable experimental features
  experimental: {
    typedRoutes: true,
  },
}

module.exports = nextConfig