/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Configuração correta para Next.js 15.3.4
    // Removido serverComponentsExternalPackages pois não é mais suportado desta forma
    serverActions: true,
  },

  // Configuração de imagens otimizada
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

  // Configuração de headers para CORS e segurança
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
          {
            key: "Access-Control-Allow-Origin",
            value: process.env.NODE_ENV === "development" 
              ? "http://localhost:3000" 
              : "http://164.92.160.176:3000",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET,OPTIONS,PATCH,DELETE,POST,PUT",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
          },
        ],
      },
    ];
  },

  // Configuração de rewrites para API
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL}/api/v1/:path*`,
      },
    ];
  },

  // Configuração do webpack
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Adiciona suporte para SVG
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });

    // Análise de bundle em modo de desenvolvimento
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

  // Configuração do ESLint
  eslint: {
    dirs: ["src"],
  },

  // Configuração do TypeScript
  typescript: {
    ignoreBuildErrors: false,
  },

  // Configuração do compilador
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },

  // Variáveis de ambiente customizadas
  env: {
    CUSTOM_KEY: "mozaia-frontend",
    BUILD_TIME: new Date().toISOString(),
  },

  // Opções de otimização
  poweredByHeader: false,
  reactStrictMode: true,
  swcMinify: true, // Agora é padrão no Next.js 15.3.4
  compress: true,
};

module.exports = nextConfig;
