/** @type {import('next').NextConfig} */

const isProd = process.env.NODE_ENV === "production";

// IMPORTANT (Windows / dev): certains environnements matchent les routes sans tenir compte de la casse.
// Donc une règle /rencontres/France -> /rencontres/france peut aussi matcher /rencontres/france
// et provoquer un 308 vers la même URL (boucle infinie).
// => On limite ces règles aux requêtes sur le host PROD (www.keefon.com) et uniquement en PROD.

const legacyCityCasingRedirects = [
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

const nextConfig = {
  reactStrictMode: true,
  trailingSlash: false,

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/**",
      },
    ],
  },

  eslint: { ignoreDuringBuilds: true },

  async redirects() {
    const redirects = [];

    // PROD: forcer www (keefon.com -> www.keefon.com)
    if (isProd) {
      redirects.push({
        source: "/:path*",
        has: [{ type: "host", value: "keefon.com" }],
        destination: "https://www.keefon.com/:path*",
        permanent: true,
      });
    }

    // Home (choisis UNE seule solution)
    // Option A (recommandé): gère la home ici et SUPPRIME le redirect dans pages/index.tsx
    redirects.push({ source: "/", destination: "/rencontres/france", permanent: true });

    // Option B: si tu veux garder pages/index.tsx en redirect,
    // commente la ligne ci-dessus et laisse pages/index.tsx faire le boulot.

    // Redirections de casse (uniquement sur le host PROD, sinon boucle sur localhost Windows)
    if (isProd) {
      redirects.push(
        ...legacyCityCasingRedirects.map((r) => ({
          ...r,
          has: [{ type: "host", value: "www.keefon.com" }],
        }))
      );
    }

    return redirects;
  },
};

module.exports = nextConfig;
