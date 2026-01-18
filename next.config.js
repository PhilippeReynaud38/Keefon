// next.config.js — Keefon (LOWERCASE canonical + www)

const isProd = process.env.NODE_ENV === "production";
const enableHsts = process.env.ENABLE_HSTS !== "false";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  trailingSlash: false,

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/**",
      },
    ],
  },

  eslint: { ignoreDuringBuilds: true },

  async redirects() {
    return [
      // Optionnel: forcer www en prod (tu l'as déjà aussi dans Vercel Domains)
      ...(isProd
        ? [
            {
              source: "/:path*",
              has: [{ type: "host", value: "keefon.com" }],
              destination: "https://www.keefon.com/:path*",
              permanent: true,
            },
          ]
        : []),

      // Home → lowercase
      { source: "/", destination: "/rencontres/france", permanent: true },

      // Anciennes URLs en Majuscule → nouvelles en minuscule
      { source: "/rencontres/France", destination: "/rencontres/france", permanent: true },
      { source: "/rencontres/Paris", destination: "/rencontres/paris", permanent: true },
      { source: "/rencontres/Lyon", destination: "/rencontres/lyon", permanent: true },
      { source: "/rencontres/Marseille", destination: "/rencontres/marseille", permanent: true },
      { source: "/rencontres/Toulouse", destination: "/rencontres/toulouse", permanent: true },
      { source: "/rencontres/Nice", destination: "/rencontres/nice", permanent: true },
      { source: "/rencontres/Nantes", destination: "/rencontres/nantes", permanent: true },
      { source: "/rencontres/Montpellier", destination: "/rencontres/montpellier", permanent: true },
      { source: "/rencontres/Strasbourg", destination: "/rencontres/strasbourg", permanent: true },
      { source: "/rencontres/Bordeaux", destination: "/rencontres/bordeaux", permanent: true },
      { source: "/rencontres/Lille", destination: "/rencontres/lille", permanent: true },
      { source: "/rencontres/Rennes", destination: "/rencontres/rennes", permanent: true },
      { source: "/rencontres/Grenoble", destination: "/rencontres/grenoble", permanent: true },
      { source: "/rencontres/Saint-Etienne", destination: "/rencontres/saint-etienne", permanent: true },
    ];
  },

  async headers() {
    if (!isProd || !enableHsts) return [];
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
