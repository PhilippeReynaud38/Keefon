import Head from "next/head";
import Link from "next/link";

/**
 * Page article SEO
 * URL: /comparatif/alternative-tinder
 * Objectif : capter les requêtes "alternative à Tinder" sans spam, sans texte caché.
 */

const SEO = {
  title: "Alternative à Tinder : Keefon, une approche sans swipe",
  description:
    "Vous cherchez une alternative à Tinder ? Keefon propose une expérience sans swipe, plus posée et bienveillante, avec une navigation claire et des échanges plus humains.",
  canonical: "https://www.keefon.com/comparatif/alternative-tinder",
  ogImage: "https://www.keefon.com/og/alternative-tinder.jpg",
  keywords: [
    "alternative tinder",
    "alternative à tinder",
    "tinder alternative",
    "site de rencontre sans swipe",
    "rencontre sans swipe",
    "rencontre plus humaine",
    "rencontre bienveillante",
    "rencontre sérieuse",
    "chat rencontre",
    "site de rencontre français",
    "plateforme de rencontre indépendante",
    "keefon",
  ].join(", "),
};

export default function AlternativeTinderPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: "Keefon",
        url: "https://www.keefon.com",
      },
      {
        "@type": "WebPage",
        name: SEO.title,
        url: SEO.canonical,
        description: SEO.description,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Accueil",
            item: "https://www.keefon.com",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Comparatifs",
            item: "https://www.keefon.com/comparatif",
          },
          {
            "@type": "ListItem",
            position: 3,
            name: "Alternative à Tinder",
            item: SEO.canonical,
          },
        ],
      },
    ],
  };

  const comparisons = [
    {
      label: "Découverte",
      leftTitle: "Keefon",
      leftText: "Sans swipe",
      rightTitle: "Services populaires",
      rightText: "Souvent basé sur le swipe / défilement",
    },
    {
      label: "Tempo / pression",
      leftTitle: "Keefon",
      leftText: "Moins de pression, échanges posés",
      rightTitle: "Services populaires",
      rightText: "Plus immédiat (choix rapides)",
    },
    {
      label: "Positionnement",
      leftTitle: "Keefon",
      leftText: "Échanges bienveillants",
      rightTitle: "Services populaires",
      rightText: "Varie selon la plateforme",
    },
    {
      label: "Sans abonnement",
      leftTitle: "Keefon",
      leftText: "Plus de possibilités d'ouverture et d'échanges",
      rightTitle: "Services populaires",
      rightText: "Souvent plus limité",
    },
    {
      label: "Navigation",
      leftTitle: "Keefon",
      leftText: "Clair, on se repère vite",
      rightTitle: "Services populaires",
      rightText: "Varie selon la plateforme",
    },
    {
      label: "Tarifs (si abonnement)",
      leftTitle: "Keefon",
      leftText: "Prix stables & accessibles (même prix mensuel sur 1 ou 6 mois)",
      rightTitle: "Services populaires",
      rightText: "Réductions souvent liées à l'engagement",
    },
    {
      label: "Modération",
      leftTitle: "Keefon",
      leftText: "Simple : signaler, filtrer, gérer",
      rightTitle: "Services populaires",
      rightText: "Varie selon la plateforme",
    },
    {
      label: "Favoris & échanges",
      leftTitle: "Keefon",
      leftText: "Accès clair : favoris, messages, accroches",
      rightTitle: "Services populaires",
      rightText: "Varie selon la plateforme",
    },
  ];

  return (
    <>
      <Head>
        <title>{SEO.title}</title>
        <meta name="description" content={SEO.description} />
        <meta name="keywords" content={SEO.keywords} />
        <link rel="canonical" href={SEO.canonical} />

        <meta property="og:title" content={SEO.title} />
        <meta property="og:description" content={SEO.description} />
        <meta property="og:url" content={SEO.canonical} />
        <meta property="og:image" content={SEO.ogImage} />
        <meta property="og:type" content="article" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={SEO.title} />
        <meta name="twitter:description" content={SEO.description} />
        <meta name="twitter:image" content={SEO.ogImage} />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </Head>

      <main
        className="min-h-screen"
        style={{
          background:
            "linear-gradient(180deg, rgba(210, 245, 255, 0.85) 0%, rgba(216, 255, 220, 0.55) 45%, rgba(200, 235, 255, 0.55) 100%)",
        }}
      >
        <article className="mx-auto max-w-5xl px-4 py-10">
          <div className="rounded-3xl border border-slate-200/60 bg-slate-50/60/70 p-6 shadow-sm backdrop-blur sm:p-8">
            {/* Breadcrumb */}
            <div className="mb-4 text-xs text-slate-600">
              <Link href="/" className="hover:underline">
                Accueil
              </Link>
              <span className="px-2">/</span>
              <span className="text-slate-500">Alternative à Tinder</span>
            </div>

            {/* HERO */}
            <header className="mb-6">
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                Alternative à Tinder : une approche sans swipe
              </h1>
              <p className="mt-3 max-w-3xl text-slate-700">
                Si vous cherchez une <strong>alternative à Tinder</strong>, c'est souvent pour une raison
                simple : vous voulez des échanges plus calmes, plus clairs, et une expérience moins basée
                sur le réflexe du <em>swipe</em>. Keefon est une plateforme <strong>indépendante</strong> qui
                privilégie la conversation, la bienveillance et une navigation facile.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/signup"
                  className="rounded-full bg-lime-400 px-5 py-2 text-sm font-semibold text-slate-900 shadow hover:brightness-95"
                >
                  Créer mon profil
                </Link>
                <Link
                  href="/rencontres/france"
                  className="rounded-full border border-slate-300 bg-white/70 px-5 py-2 text-sm font-semibold text-slate-900 shadow-sm hover:bg-white"
                >
                  Rencontres en France
                </Link>
              </div>

              <div className="mt-5 rounded-2xl border border-yellow-300/70 bg-yellow-50/90 p-4 text-sm text-slate-800">
                <div className="font-semibold">Offre de lancement</div>
                <div className="mt-1">
                  Gratuité jusqu'à fin 2026 pour les <strong>2 000 premiers inscrits</strong> (selon
                  conditions en vigueur). Et quand un abonnement est proposé, il est pensé pour rester
                  <strong> abordable</strong>.
                </div>
              </div>
            </header>

            {/* Comparaison rapide */}
            <section aria-label="Comparaison rapide" className="mt-6">
              <h2 className="text-xl font-bold text-slate-900">Comparaison rapide</h2>
              <p className="mt-2 text-sm text-slate-700">
                Comparaison volontairement générale (les fonctionnalités exactes évoluent selon les
                services).
              </p>

              <div className="mt-4">
                <div className="grid grid-cols-2 text-sm font-semibold text-slate-900">
                  <div>Keefon</div>
                  <div className="text-right">Services populaires</div>
                </div>

                <div className="mt-3 space-y-4">
                  {comparisons.map((c) => (
                    <div key={c.label} className="rounded-2xl bg-white/40 p-3">
                      <div className="flex justify-center">
                        <div className="w-full max-w-md rounded-full border border-yellow-300/70 bg-yellow-100/90 px-3 py-1 text-center text-[12px] font-semibold text-slate-900 shadow-sm">
                          {c.label}
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-slate-800">
                        <div>
                          <div className="font-semibold">{c.leftText}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{c.rightText}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Pourquoi */}
            <section className="mt-8">
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
                Pourquoi chercher une alternative à Tinder ?
              </h2>
              <p className="mt-3 text-slate-700">
                Beaucoup de personnes veulent sortir d'une logique de choix rapides et revenir à quelque
                chose de plus humain.
              </p>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-slate-700">
                <li>
                  Moins de "défilé" : quand on en a marre du swipe, on préfère prendre le temps de parler.
                </li>
                <li>
                  Moins de pression : échanges plus naturels, sans sensation d'urgence permanente.
                </li>
                <li>
                  Plus de clarté : on retrouve facilement ses favoris, ses messages et ses accroches.
                </li>
                <li>
                  Confiance : Keefon est un site français, soumis au droit français (RGPD, CNIL, etc.).
                </li>
              </ul>
            </section>

            {/* Ce qui change */}
            <section className="mt-8">
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
                Keefon : ce qui change (sans promesse floue)
              </h2>
              <p className="mt-3 text-slate-700">
                L'objectif n'est pas de "faire mieux que tout le monde" avec des slogans : c'est de
                proposer une alternative claire, centrée sur la conversation.
              </p>
              <ul className="mt-4 space-y-3 text-slate-700">
                <li>
                  <strong>Sans swipe</strong> : moins de décisions instantanées, plus de place à l'échange.
                </li>
                <li>
                  <strong>Approche bienveillante</strong> : un cadre pensé pour des interactions respectueuses.
                </li>
                <li>
                  <strong>Navigation simple</strong> : pages lisibles, infos faciles d'accès, on ne se perd pas.
                </li>
                <li>
                  <strong>Indépendant</strong> : Keefon ne revendique aucune association avec Tinder.
                </li>
              </ul>
            </section>

            {/* Ouverture / accessibilité */}
            <section className="mt-8">
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
                Une approche plus ouverte, même sans abonnement
              </h2>
              <p className="mt-3 text-slate-700">
                Keefon a été pensé pour rester accessible : si vous ne souhaitez pas payer un abonnement,
                plusieurs possibilités d'ouverture de rencontres restent disponibles. L'idée est simple :
                aider le plus de personnes possible à faire de vraies rencontres, sans se perdre dans une
                interface compliquée.
              </p>
            </section>

            {/* CTA villes discret */}
            <nav
              aria-label="Villes"
              className="mt-10 border-t border-slate-300/40 pt-4 text-[11px] leading-tight text-slate-700/70"
            >
              <div className="flex flex-wrap justify-center gap-x-2 gap-y-1">
                <Link href="/rencontres/paris" className="hover:underline">
                  Paris
                </Link>
                <span className="text-slate-400">·</span>
                <Link href="/rencontres/lyon" className="hover:underline">
                  Lyon
                </Link>
                <span className="text-slate-400">·</span>
                <Link href="/rencontres/marseille" className="hover:underline">
                  Marseille
                </Link>
                <span className="text-slate-400">·</span>
                <Link href="/rencontres/toulouse" className="hover:underline">
                  Toulouse
                </Link>
                <span className="text-slate-400">·</span>
                <Link href="/rencontres/nice" className="hover:underline">
                  Nice
                </Link>
                <span className="text-slate-400">·</span>
                <Link href="/rencontres/nantes" className="hover:underline">
                  Nantes
                </Link>
                <span className="text-slate-400">·</span>
                <Link href="/rencontres/montpellier" className="hover:underline">
                  Montpellier
                </Link>
                <span className="text-slate-400">·</span>
                <Link href="/rencontres/strasbourg" className="hover:underline">
                  Strasbourg
                </Link>
                <span className="text-slate-400">·</span>
                <Link href="/rencontres/rennes" className="hover:underline">
                  Rennes
                </Link>
                <span className="text-slate-400">·</span>
                <Link href="/rencontres/lille" className="hover:underline">
                  Lille
                </Link>
                <span className="text-slate-400">·</span>
                <Link href="/rencontres/bordeaux" className="hover:underline">
                  Bordeaux
                </Link>
                <span className="text-slate-400">·</span>
                <Link href="/rencontres/grenoble" className="hover:underline">
                  Grenoble
                </Link>
                <span className="text-slate-400">·</span>
                <Link href="/rencontres/saint-etienne" className="hover:underline">
                  Saint-Étienne
                </Link>
              </div>
            </nav>

            {/* FAQ */}
            <section className="mt-8">
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">FAQ</h2>

              <details className="mt-4 rounded-2xl border border-slate-200 bg-white/60 p-4">
                <summary className="cursor-pointer font-semibold text-slate-900">
                  Keefon est-il affilié à Tinder ?
                </summary>
                <p className="mt-2 text-slate-700">
                  Non. Keefon est une plateforme indépendante et ne revendique aucune association avec
                  Tinder.
                </p>
              </details>

              <details className="mt-3 rounded-2xl border border-slate-200 bg-white/60 p-4">
                <summary className="cursor-pointer font-semibold text-slate-900">
                  Pourquoi chercher une alternative à Tinder ?
                </summary>
                <p className="mt-2 text-slate-700">
                  Souvent, pour sortir du swipe et privilégier des échanges plus posés, plus respectueux,
                  et une navigation plus simple.
                </p>
              </details>

              <details className="mt-3 rounded-2xl border border-slate-200 bg-white/60 p-4">
                <summary className="cursor-pointer font-semibold text-slate-900">
                  Qu'est-ce que "sans swipe" veut dire ?
                </summary>
                <p className="mt-2 text-slate-700">
                  Cela signifie qu'on limite le "tri" instantané : l'idée est de donner plus de place à la
                  discussion et à la découverte.
                </p>
              </details>

              <details className="mt-3 rounded-2xl border border-slate-200 bg-white/60 p-4">
                <summary className="cursor-pointer font-semibold text-slate-900">Keefon est-il gratuit ?</summary>
                <p className="mt-2 text-slate-700">
                  Oui, une gratuité est proposée (selon conditions). Et si un abonnement existe, il est
                  pensé pour rester abordable.
                </p>
              </details>
            </section>

            <p className="mt-8 text-xs text-slate-600">
              Mention : "Tinder" est une marque de son/ses propriétaires. Cette page est informative.
            </p>
          </div>
        </article>
      </main>
    </>
  );
}
