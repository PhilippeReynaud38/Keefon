// -*- coding: utf-8 -*-
// next.config.js — Vivaya (propre/dev-safe)

const isProd = process.env.NODE_ENV === 'production';
const enableHsts = process.env.ENABLE_HSTS !== 'false';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Autoriser les images distantes (Supabase Storage, etc.)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/**',
      },
      // ajoute d’autres sources si besoin (Unsplash, etc.)
      // { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
    ],
  },

  // ESLint : on laisse le lint actif en dev,
  // mais on n’empêche plus le build en cas de warnings/erreurs.
  eslint: {
    ignoreDuringBuilds: true,
  },

  // En-têtes HTTP (HSTS coupé en dev)
  async headers() {
    if (!isProd || !enableHsts) return [];
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
