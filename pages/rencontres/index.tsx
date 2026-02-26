// pages/rencontres/index.tsx
import Head from "next/head";
import Link from "next/link";
import { useMemo, useState } from "react";

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
  const [query, setQuery] = useState("");

  const filteredLinks = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return LINKS;
    return LINKS.filter((l) => (l.label + " " + l.desc).toLowerCase().includes(q));
  }, [query]);

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

      <main className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-sky-50">
        <section className="mx-auto max-w-5xl px-4 pt-10 pb-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                  Rencontres en France
                </h1>
                <p className="mt-2 text-sm text-slate-700 sm:text-base">
                  Accès direct à la page France et aux pages des grandes villes. (URLs en minuscules, cohérentes pour Google.)
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Link
                    href="/rencontres/france"
                    className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:brightness-110"
                    aria-label="Aller à la page Rencontres en France"
                    title="Rencontres en France"
                  >
                    Page France
                  </Link>

                  <Link
                    href="/rencontres/gratuit-2026"
                    className="inline-flex items-center rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm hover:brightness-110"
                    aria-label="Voir l'offre gratuit 2026"
                    title="Offre gratuit 2026"
                  >
                    Offre gratuit 2026
                  </Link>

                  <span className="ml-0 inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 sm:ml-2">
                    {filteredLinks.length}/{LINKS.length} liens
                  </span>
                </div>
              </div>

              <div className="w-full sm:w-[320px]">
                <label className="block text-sm font-bold text-slate-900" htmlFor="city-search">
                  Rechercher (ville / mot-clé)
                </label>
                <div className="mt-2 flex items-center gap-2">
                  <input
                    id="city-search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ex: Paris, gratuit, sans abonnement…"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-slate-400"
                  />
                  {query.trim() ? (
                    <button
                      type="button"
                      onClick={() => setQuery("")}
                      className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                      aria-label="Effacer la recherche"
                      title="Effacer"
                    >
                      ✕
                    </button>
                  ) : null}
                </div>

                <p className="mt-2 text-xs text-slate-600">
                  Astuce : tape une ville ou un mot-clé — la liste se filtre instantanément.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 pb-14">
          <ul className="grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {filteredLinks.map((l) => (
              <li
                key={l.href}
                className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-[1px] hover:shadow-md"
              >
                <Link
                  href={l.href}
                  className="block text-base font-extrabold text-slate-900 underline-offset-2 group-hover:underline"
                >
                  {l.label}
                </Link>

                <div className="mt-2 text-sm text-slate-700">{l.desc}</div>

                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">{l.href}</span>
                  <span className="text-xs font-bold text-slate-900">→</span>
                </div>
              </li>
            ))}
          </ul>

          {filteredLinks.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-700 shadow-sm">
              Aucun résultat pour <span className="font-bold text-slate-900">“{query}”</span>. Essaie un autre mot.
            </div>
          ) : null}
        </section>
      </main>
    </>
  );
}
