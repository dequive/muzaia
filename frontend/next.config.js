/** @type {import('next').NextConfig} */
const nextConfig = {
  // Mover serverComponentsExternalPackages para o nível raiz (fora de experimental)
  serverComponentsExternalPackages: ["@supabase/supabase-js"],
  
  experimental: {
    // Manter apenas configurações experimentais ainda válidas
    // Vazio por enquanto, pode ser removido se não tiver outras propriedades
  },
  
  images: {
    domains: [
      "avatars.githubusercontent.com",
      "lh3.googleusercontent.com",
      "cdn.mozaia.mz",
      "images.unsplash.com",
    ],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL}/api/v1/:path*`,
      },
    ];
  },
  
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },
  
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Configurações webpack customizadas
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });

    if (process.env.ANALYZE === "true") {
      const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: "static",
          openAnalyzer: false,
        })
      );
    }

    return config;
  },
  
  eslint: {
    dirs: ["src"],
  },
  
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // swcMinify foi movido para o compilador ou removido no Next.js 15+
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
    // swcMinify agora é configurado aqui
    minify: true,
  },
  
  env: {
    CUSTOM_KEY: "mozaia-frontend",
    BUILD_TIME: new Date().toISOString(),
  },
};

module.exports = nextConfig;
