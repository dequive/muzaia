/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  trailingSlash: true,
  
  images: {
    unoptimized: true,
    domains: [
      'avatars.githubusercontent.com',
    ],
    formats: ['image/avif', 'image/webp'],
  },

  experimental: {
    typedRoutes: true,
  },

  // Headers removed - not compatible with static export
  allowedDevOrigins: ['*', '68f4a38c-dc7e-4477-a5d0-2a575a69b246-00-1wr0h8c4r1ujt.spock.replit.dev'],
}

module.exports = nextConfig