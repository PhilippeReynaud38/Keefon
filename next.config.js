// next.config.js — Keefon (SEO/Index clean + www canonical)

const isProd = process.env.NODE_ENV === "production";
const enableHsts = process.env.ENABLE_HSTS !== "false";

const PRIMARY_HOST = "www.keefon.com";
const APEX_HOST = "keefon.com";

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
    ],
  },

  eslint: {
    ignoreDuringBuilds: true,
  },

  // ✅ Force keefon.com -> www.keefon.com (fallback)
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: APEX_HOST }],
        destination: `https://${PRIMARY_HOST}/:path*`,
        permanent: true,
      },
    ];
  },

  // ✅ Noindex pages internes + HSTS en prod
  async headers() {
    const rules = [
      // Noindex pages “internes” (polluent Google)
      {
        source: "/recherche",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        source: "/recherche/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        source: "/reset-password",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        source: "/reset-password/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        source: "/login",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        source: "/signup",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        source: "/cookies",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },

      // HSTS seulement en prod
      ...(isProd && enableHsts
        ? [
            {
              source: "/:path*",
              headers: [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=63072000; includeSubDomains; preload",
                },
              ],
            },
          ]
        : []),
    ];

    return rules;
  },
};

module.exports = nextConfig;
