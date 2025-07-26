/** @type {import('next').NextConfig} */
const nextConfig = {
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

  // Allow cross-origin requests from Replit domain
  experimental: {
    typedRoutes: true,
    allowedDevOrigins: ['68f4a38c-dc7e-4477-a5d0-2a575a69b246-00-1wr0h8c4r1ujt.spock.replit.dev'],
  },
}

module.exports = nextConfig