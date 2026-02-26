// pages/rencontres/index.tsx
import Head from "next/head";
import Link from "next/link";

const BASE_URL = "https://www.keefon.com";

const LINKS = [
  { href: "/rencontres/france", label: "site de rencontre en France", desc: "Toutes les rencontres en France (par régions et grandes villes)." },
  { href: "/rencontres/paris", label: "meilleur site de rencontre à Paris", desc: "Rencontres à Paris." },
  { href: "/rencontres/lyon", label: "mon ame soeur à Lyon", desc: "Rencontres à Lyon." },
  { href: "/rencontres/marseille", label: "trouver mon ame soeur à Marseille", desc: "Rencontres à Marseille." },
  { href: "/rencontres/toulouse", label: "rencontre 100% gratuit à Toulouse", desc: "Rencontres à Toulouse." },
  { href: "/rencontres/nice", label: "site de rencontre gratuit à Nice", desc: "Rencontres à Nice." },
  { href: "/rencontres/nantes", label: "site de rencontre bienveillante à Nante", desc: "Rencontres à Nantes." },
  { href: "/rencontres/montpellier", label: "site dde rencontre sans abonnement à Montpellier", desc: "Rencontres à Montpellier." },
  { href: "/rencontres/strasbourg", label: "rencontre sans abonnement à Strasbourg", desc: "Rencontres à Strasbourg." },
  { href: "/rencontres/bordeaux", label: "trouver ma moitié à Bordeaux", desc: "Rencontres à Bordeaux." },
  { href: "/rencontres/lille", label: "rencontre sans carte bancaire à Lille", desc: "Rencontres à Lille." },
  { href: "/rencontres/rennes", label: "rencontre prés de chez moi à Rennes", desc: "Rencontres à Rennes." },
  { href: "/rencontres/grenoble", label: "rencontre partout en france et à Grenoble", desc: "Rencontres à Grenoble." },
  { href: "/rencontres/saint-etienne", label: "site de rencontre français à Saint-etienne", desc: "Rencontres à Saint-Étienne." },
  { href: "/rencontres/gratuit-2026", label: "site de rencontre gratuit Français", desc: "site de rencontre 100% gratuit" },
];

export default function RencontresHub() {
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "Rencontres", item: `${BASE_URL}/rencontres` },
    ],
  };

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: LINKS.map((l, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: l.label,
      url: `${BASE_URL}${l.href}`,
    })),
  };

  return (
    <>
      <Head>
        <title>Rencontres en France | Keefon</title>
        <meta
          name="description"
          content="Accédez à la page France et aux pages des principales villes pour trouver des rencontres sur Keefon."
        />
        <link rel="canonical" href={`${BASE_URL}/rencontres`} />

        <meta property="og:url" content={`${BASE_URL}/rencontres`} />
        <meta property="og:title" content="Rencontres en France | Keefon" />
        <meta
          property="og:description"
          content="Page hub : France + principales villes pour vos rencontres sur Keefon."
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
        />
      </Head>

      <main style={{ maxWidth: 980, margin: "0 auto", padding: "24px 16px" }}>
        <h1>Rencontres en France</h1>
        <p>
          Accès direct à la page France et aux pages des grandes villes. (URLs en minuscules, cohérentes pour Google.)
        </p>

        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: "18px 0 0",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 12,
          }}
        >
          {LINKS.map((l) => (
            <li
              key={l.href}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                padding: 14,
              }}
            >
              <Link href={l.href} style={{ fontWeight: 700, textDecoration: "none" }}>
                {l.label}
              </Link>
              <div style={{ opacity: 0.8, marginTop: 6 }}>{l.desc}</div>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
