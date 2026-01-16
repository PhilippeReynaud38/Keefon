// -*- coding: utf-8 -*-
// next.config.js — Keefon (SEO minimum safe)

const isProd = process.env.NODE_ENV === "production";
const enableHsts = process.env.ENABLE_HSTS !== "false";

const NOINDEX = { key: "X-Robots-Tag", value: "noindex, nofollow" };

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/**",
      },
      // { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
    ],
  },

  eslint: {
    ignoreDuringBuilds: true,
  },

  async headers() {
    const rules = [
      // Pages internes : noindex (minimum)
      { source: "/cookies/:path*", headers: [NOINDEX] },
      { source: "/reset-password/:path*", headers: [NOINDEX] },
      { source: "/recherche/:path*", headers: [NOINDEX] },
      { source: "/login/:path*", headers: [NOINDEX] },
      { source: "/signup/:path*", headers: [NOINDEX] },
      { source: "/onboarding/:path*", headers: [NOINDEX] },
      { source: "/settings/:path*", headers: [NOINDEX] },
      { source: "/messages/:path*", headers: [NOINDEX] },
      { source: "/profil/:path*", headers: [NOINDEX] },
      { source: "/admin/:path*", headers: [NOINDEX] },
    ];

    // HSTS seulement en prod
    if (isProd && enableHsts) {
      rules.push({
        source: "/:path*",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      });
    }

    return rules;
  },
};

module.exports = nextConfig;
