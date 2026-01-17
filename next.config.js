// -*- coding: utf-8 -*-
// next.config.js — Keefon (SEO minimum safe)
// next.config.js

const isProd = process.env.NODE_ENV === "production";
const enableHsts = process.env.ENABLE_HSTS !== "false";

const NOINDEX = { key: "X-Robots-Tag", value: "noindex, nofollow" };

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co", pathname: "/storage/v1/object/**" },
    ],
  },

  eslint: { ignoreDuringBuilds: true },

  async headers() {
    const rules = [
      { source: "/cookies/:path*", headers: [NOINDEX] },
      { source: "/reset-password/:path*", headers: [NOINDEX] },
      { source: "/forgot-password/:path*", headers: [NOINDEX] },
      { source: "/recherche/:path*", headers: [NOINDEX] },
      { source: "/login/:path*", headers: [NOINDEX] },
      { source: "/signup/:path*", headers: [NOINDEX] },
      { source: "/onboarding/:path*", headers: [NOINDEX] },
      { source: "/settings/:path*", headers: [NOINDEX] },
      { source: "/messages/:path*", headers: [NOINDEX] },
      { source: "/profil/:path*", headers: [NOINDEX] },
      { source: "/admin/:path*", headers: [NOINDEX] },
    ];

    if (isProd && enableHsts) {
      rules.push({
        source: "/:path*",
        headers: [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }],
      });
    }

    return rules;
  }, // <-- IMPORTANT : la virgule ici

  async redirects() {
    return [
      { source: "/", destination: "/rencontres/France", permanent: true },

      // minuscules -> Majuscule (car tes pages sont en Majuscule)
      { source: "/rencontres/france", destination: "/rencontres/France", permanent: true },
      { source: "/rencontres/grenoble", destination: "/rencontres/Grenoble", permanent: true },

      { source: "/rencontres/paris", destination: "/rencontres/Paris", permanent: true },
      { source: "/rencontres/lyon", destination: "/rencontres/Lyon", permanent: true },
      { source: "/rencontres/marseille", destination: "/rencontres/Marseille", permanent: true },
      { source: "/rencontres/toulouse", destination: "/rencontres/Toulouse", permanent: true },
      { source: "/rencontres/nice", destination: "/rencontres/Nice", permanent: true },
      { source: "/rencontres/nantes", destination: "/rencontres/Nantes", permanent: true },
      { source: "/rencontres/montpellier", destination: "/rencontres/Montpellier", permanent: true },
      { source: "/rencontres/strasbourg", destination: "/rencontres/Strasbourg", permanent: true },
      { source: "/rencontres/bordeaux", destination: "/rencontres/Bordeaux", permanent: true },
      { source: "/rencontres/lille", destination: "/rencontres/Lille", permanent: true },
      { source: "/rencontres/rennes", destination: "/rencontres/Rennes", permanent: true },
      { source: "/rencontres/saint-etienne", destination: "/rencontres/Saint-Etienne", permanent: true },
    ];
  },
};

module.exports = nextConfig;

