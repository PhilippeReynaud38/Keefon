import Head from "next/head";
import Link from "next/link";

/**
 * Page article SEO
 * URL: /comparatif/alternative-meetic
 * Objectif: capter les requêtes "alternative à Meetic" sans spam, sans texte caché.
 */

const SEO = {
  title: "Alternative à Meetic : Keefon, rencontre sans swipe",
  description:
    "Vous cherchez une alternative à Meetic ? Découvrez Keefon : une plateforme indépendante de rencontres sans swipe, pensée pour des échanges plus humains et respectueux.",
  canonical: "https://www.keefon.com/comparatif/alternative-meetic",
  ogImage: "https://www.keefon.com/og/alternative-meetic.jpg",
};

export default function AlternativeMeeticPage() {
  const faq = [
    {
      q: "Keefon est-il affilié à Meetic ?",
      a: "Non. Keefon est une plateforme indépendante et ne revendique aucune association avec Meetic.",
    },
    {
      q: "Pourquoi chercher une alternative à Meetic ?",
      a: "Beaucoup de personnes veulent une expérience plus simple, plus calme, et moins centrée sur le “scroll” ou les décisions rapides. L’idée est de favoriser des échanges plus posés.",
    },
    {
      q: "Qu’est-ce que “sans swipe” veut dire ?",
      a: "Au lieu de faire défiler des profils en série, l’approche met l’accent sur la discussion, la découverte et la qualité des échanges.",
    },
    {
      q: "Keefon est-il gratuit ?",
      a: "Keefon propose une période d’ouverture avec chat et échanges gratuits. Les modalités peuvent évoluer : vérifiez toujours la page d’inscription pour les conditions à jour.",
    },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: SEO.title,
        url: SEO.canonical,
        description: SEO.description,
        isPartOf: { "@type": "WebSite", name: "Keefon", url: "https://www.keefon.com" },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Accueil", item: "https://www.keefon.com" },
          { "@type": "ListItem", position: 2, name: "Comparatif", item: "https://www.keefon.com/comparatif/alternative-meetic" },
          { "@type": "ListItem", position: 3, name: "Alternative à Meetic", item: SEO.canonical },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: faq.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };

  return (
    <>
      <Head>
        <title>{SEO.title}</title>
        <meta name="description" content={SEO.description} />
        <link rel="canonical" href={SEO.canonical} />

        {/* Open Graph */}
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="Keefon" />
        <meta property="og:title" content={SEO.title} />
        <meta property="og:description" content={SEO.description} />
        <meta property="og:url" content={SEO.canonical} />
        <meta property="og:image" content={SEO.ogImage} />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={SEO.title} />
        <meta name="twitter:description" content={SEO.description} />
        <meta name="twitter:image" content={SEO.ogImage} />

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </Head>

      <main className="min-h-screen" style={{ background: "linear-gradient(180deg, rgba(184,229,93,0.55) 0%, rgba(160,220,255,0.60) 35%, rgba(232,255,241,0.95) 100%)" }}>
        <article className="mx-auto max-w-3xl px-4 py-10">
          <div className="rounded-3xl border border-slate-200/70 bg-slate-50/60/70 p-6 shadow-sm backdrop-blur sm:p-8">
          <p className="text-xs text-slate-600">
            <Link href="/" className="hover:underline">
              Accueil
            </Link>{" "}
            <span className="opacity-50">/</span>{" "}
            <span className="text-slate-800">Alternative à Meetic</span>
          </p>

          <header className="mt-3">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Alternative à Meetic : une approche sans swipe
            </h1>
            <p className="mt-3 text-base leading-relaxed text-slate-800">
              Si vous cherchez une <strong>alternative à Meetic</strong>, c’est souvent pour une raison simple : vous voulez
              des échanges plus posés, plus clairs, et une expérience moins “bruyante”. Keefon est une plateforme{" "}
              <strong>indépendante</strong> qui met l’accent sur une approche <strong>sans swipe</strong> et sur la qualité
              des conversations.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/presignup"
                className="rounded-full bg-lime-400 px-4 py-2 text-sm font-semibold text-slate-900 shadow hover:brightness-95"
              >
                Créer mon profil
              </Link>
              <Link
                href="/rencontres/france"
                className="rounded-full border border-sky-200/80 bg-white/50 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-sky-50/60"
              >
                Rencontres en France
              </Link>
            </div>

            {/* Offre de lancement (optionnel) */}
            <div className="mt-4 rounded-2xl border border-yellow-300/70 bg-yellow-100/80 p-4">
              <p className="text-sm font-semibold text-slate-900">Offre de lancement</p>
              <p className="mt-1 text-sm text-slate-800">
                Gratuité jusqu’à fin 2026 pour les <strong>2&nbsp;000 premiers inscrits</strong> (selon conditions en vigueur).
              </p>
              <p className="mt-1 text-xs text-slate-600">
                Et quand un abonnement est proposé, il est pensé pour rester <strong>abordable</strong>.
              </p>
            </div>
          </header>



          <section className="mt-8">
            <h2 className="text-lg font-bold text-slate-900">Comparaison rapide</h2>

            <div className="mt-3 rounded-2xl border border-yellow-300/70 bg-yellow-100/80 p-4">
<div className="mt-3 overflow-x-auto rounded-xl border border-yellow-300/60 bg-white/55">
              <table className="w-full text-sm">
                <thead className="bg-yellow-100/50 text-left">
                  <tr>
                    <th className="p-3 font-semibold text-slate-700">Critère</th>
                    <th className="p-3 font-semibold text-slate-700">Keefon</th>
                    <th className="p-3 font-semibold text-slate-700">Services populaires</th>
                  </tr>
                </thead>
                <tbody className="text-slate-800">
                  <tr className="border-t border-slate-100">
                    <td className="p-3">Découverte</td>
                    <td className="p-3">Sans swipe</td>
                    <td className="p-3">Varie selon la plateforme</td>
                  </tr>
                  <tr className="border-t border-slate-100">
                    <td className="p-3">Tempo / pression</td>
                    <td className="p-3">Moins de pression, échanges posés</td>
                    <td className="p-3">Plus “zapping” / décisions rapides</td>
                  </tr>
                  <tr className="border-t border-slate-100">
                    <td className="p-3">Positionnement</td>
                    <td className="p-3">Échanges bienveillants</td>
                    <td className="p-3">Varie selon la plateforme</td>
                  </tr>
                  <tr className="border-t border-slate-100">
                    <td className="p-3">Sans abonnement</td>
                    <td className="p-3">Plus de possibilités de rencontres</td>
                    <td className="p-3">Souvent plus limité</td>
                  </tr>
                  <tr className="border-t border-slate-100">
                    <td className="p-3">Navigation</td>
                    <td className="p-3">Clair, on se repère vite</td>
                    <td className="p-3">Varie selon la plateforme</td>
                  </tr>
                  <tr className="border-t border-slate-100">
                    <td className="p-3">Tarifs (si abonnement)</td>
                    <td className="p-3">Prix stables &amp; accessibles (même prix mensuel sur 1 ou 6 mois)</td>
                    <td className="p-3">Réductions souvent liées à l’engagement</td>
                  </tr>
                  <tr className="border-t border-slate-100">
                    <td className="p-3">Modération</td>
                    <td className="p-3">Simple : signaler, filtrer, gérer</td>
                    <td className="p-3">Varie selon la plateforme</td>
                  </tr>
                  <tr className="border-t border-slate-100">
                    <td className="p-3">Favoris &amp; échanges</td>
                    <td className="p-3">Accès clair : favoris, messages, accroches</td>
                    <td className="p-3">Varie selon la plateforme</td>
                  </tr></tbody>
              </table>
            </div>

            <p className="mt-2 text-xs text-slate-600">
              Note : cette comparaison est volontairement générale (les fonctionnalités exactes évoluent selon les services). Les tarifs et conditions peuvent évoluer : vérifiez toujours les infos affichées sur Keefon.
            </p>
            </div>
          </section>
          <section className="mt-8">
            <h2 className="text-lg font-bold text-slate-900">Pourquoi chercher une alternative à Meetic ?</h2>
            <p className="mt-3 text-slate-800">
              Beaucoup de personnes veulent sortir du “défilé infini” et retrouver un espace plus humain : on prend le temps
              de parler, de se respecter, et de choisir avec plus de sérénité.
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-800">
              <li>
                <strong>Moins de défilement, plus d’échange</strong> : une approche sans swipe qui privilégie la conversation.
              </li>
              <li>
                <strong>Ouvert à tous les âges</strong> : une expérience pensée pour celles et ceux qui veulent du sérieux, du respect,
                et du temps de qualité.
              </li>
              <li>
                <strong>Plateforme française</strong> : un cadre conçu en France, avec une attention particulière à la clarté et à la
                transparence.
              </li>
              <li>
                <strong>Plusieurs options de tri</strong> : vous gardez le contrôle sur ce qui vous intéresse (et ce que vous ne voulez pas).
              </li>
              <li>
                <strong>Outils de signalement / modération</strong> : pour gérer les profils ou comportements qui vous interpellent.
              </li>
            </ul>
            <p className="mt-3 text-sm text-slate-700">
              Et surtout : un environnement plus clair, où l’on se repère facilement (pages, infos, parcours).
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-lg font-bold text-slate-900">Keefon : ce qui change (sans promesse floue)</h2>
            <p className="mt-3 text-slate-800">
              L’objectif n’est pas de “faire mieux que tout le monde” avec des slogans, mais de proposer une alternative
              claire :
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-800">
              <li>
                <strong>Sans swipe</strong> : moins de décisions instantanées, plus de place à l’échange.
              </li>
              <li>
                <strong>Approche bienveillante</strong> : un cadre pensé pour des interactions respectueuses.
              </li>
              <li>
                <strong>Indépendant</strong> : Keefon ne revendique aucune association avec les grandes plateformes.
              </li>
            </ul>
          </section>

          <section className="mt-8">
            <h2 className="text-lg font-bold text-slate-900">Une approche plus ouverte, même sans abonnement</h2>
            <p className="mt-3 text-slate-800">
              Keefon fait attention aux personnes qui ne souhaitent pas payer un abonnement. L’idée, c’est de garder une
              expérience accessible : plusieurs façons de découvrir et d’échanger restent possibles, et pendant la période
              d’ouverture, le chat peut être proposé gratuitement selon les conditions du moment.
            </p>
            <p className="mt-2 text-sm text-slate-700">
              Notre objectif : aider un maximum de personnes à créer de vraies rencontres, sans exclure celles et ceux qui
              n’ont pas envie (ou pas la possibilité) de payer — et avec un site clair, où l’on ne se perd pas.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-lg font-bold text-slate-900">FAQ</h2>
            <div className="mt-3 space-y-3">
              {faq.map((f) => (
                <details key={f.q} className="rounded-xl border border-slate-200 bg-white/60 p-4">
                  <summary className="cursor-pointer select-none font-semibold text-slate-900">{f.q}</summary>
                  <p className="mt-2 text-slate-800">{f.a}</p>
                </details>
              ))}
            </div>
          </section>

          <section className="mt-8 rounded-xl border border-slate-200 bg-white/60 p-4">
            <h2 className="text-sm font-bold text-slate-900">Mention</h2>
            <p className="mt-1 text-xs text-slate-700">
              Alternative aux applications de rencontre (exemples : Meetic, Tinder, Badoo, Bumble). Keefon est indépendant et
              ne revendique aucune association avec ces marques.
            </p>
            <p className="mt-1 text-[11px] text-slate-600">
              Meetic, Tinder, Badoo et Bumble sont des marques appartenant à leurs propriétaires respectifs. Aucune affiliation.
            </p>
          </section>

          <footer className="mt-8 text-xs text-slate-600">
            <p>
              Astuce : pour une recherche locale, essayez{" "}
              <Link href="/rencontres/paris" className="hover:underline">
                Rencontre Paris
              </Link>{" "}
              (ou votre ville) et comparez l’expérience.
            </p>
          </footer>
          </div>
        </article>
      </main>
    </>
  );
}
