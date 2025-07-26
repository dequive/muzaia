/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  generateEtags: true,

  // Image optimization
  images: {
    domains: ['localhost', '127.0.0.1', '0.0.0.0'],
    formats: ['image/webp', 'image/avif'],
    unoptimized: false,
  },

  output: 'standalone',

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

  // Enable experimental features
  experimental: {
    typedRoutes: true,
    allowedDevOrigins: [
      '68f4a38c-dc7e-4477-a5d0-2a575a69b246-00-1wr0h8c4r1ujt.spock.replit.dev',
      '*.replit.dev'
    ],
  },
}

module.exports = nextConfig