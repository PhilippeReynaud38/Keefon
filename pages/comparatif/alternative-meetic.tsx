import Head from "next/head";
import Link from "next/link";

const SEO = {
  title: "Alternative à Meetic : une approche sans swipe | Keefon",
  description:
    "Alternative à Meetic : Keefon propose une approche sans swipe, plus posée et bienveillante, avec une navigation claire et une modération simple.",
  canonical: "https://www.keefon.com/comparatif/alternative-meetic",
  ogImage: "https://www.keefon.com/og/alternative-meetic.jpg",
};

type Row = {
  label: string;
  keefon: string;
  services: string;
};

export default function AlternativeMeeticPage() {
  const rows: Row[] = [
    { label: "Découverte", keefon: "Sans swipe", services: "Varie selon la plateforme" },
    {
      label: "Tempo / pression",
      keefon: "Moins de pression, échanges posés",
      services: 'Plus “zapping” / décisions rapides',
    },
    { label: "Positionnement", keefon: "Échanges bienveillants", services: "Varie selon la plateforme" },
    {
      label: "Sans abonnement",
      keefon: "Plus de possibilités de rencontres",
      services: "Souvent plus limité",
    },
    { label: "Navigation", keefon: "Clair, on se repère vite", services: "Varie selon la plateforme" },
    {
      label: "Tarifs (si abonnement)",
      keefon: "Prix stables & accessibles (même prix mensuel sur 1 ou 6 mois)",
      services: "Réductions souvent liées à l’engagement",
    },
    { label: "Modération", keefon: "Simple : signaler, filtrer, gérer", services: "Varie selon la plateforme" },
    {
      label: "Favoris & échanges",
      keefon: "Accès clair : favoris, messages, accroches",
      services: "Varie selon la plateforme",
    },
  ];

  const faq = [
    {
      q: "Keefon est-il affilié à Meetic ?",
      a: "Non. Keefon est indépendant et ne revendique aucune association avec Meetic (ni avec d’autres plateformes).",
    },
    {
      q: "Pourquoi chercher une alternative à Meetic ?",
      a: "Souvent pour une expérience plus calme, moins basée sur le tri rapide, et avec une navigation plus simple.",
    },
    {
      q: "Qu’est-ce que “sans swipe” veut dire ?",
      a: "Ça veut dire : moins de décisions instantanées, plus de place à l’échange et à la discussion.",
    },
    {
      q: "Keefon est-il gratuit ?",
      a: "Selon la période : il peut y avoir une gratuité d’ouverture (ex. jusqu’à fin 2026 pour les 2 000 premiers inscrits, selon conditions). Ensuite, l’abonnement est pensé pour rester abordable.",
    },
  ];

  return (
    <>
      <Head>
        <title>{SEO.title}</title>
        <meta name="description" content={SEO.description} />
        <link rel="canonical" href={SEO.canonical} />
        <meta property="og:title" content={SEO.title} />
        <meta property="og:description" content={SEO.description} />
        <meta property="og:image" content={SEO.ogImage} />
        <meta property="og:type" content="website" />
      </Head>

      <main className="min-h-screen bg-gradient-to-b from-sky-100 via-cyan-100 to-emerald-100">
        <article className="mx-auto max-w-4xl px-4 py-10">
          <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-6 sm:p-10 shadow-sm">
            {/* Breadcrumb */}
            <nav className="text-xs text-slate-600">
              <Link href="/" className="hover:underline">
                Accueil
              </Link>{" "}
              <span className="opacity-60">/</span>{" "}
              <span className="font-medium text-slate-700">Alternative à Meetic</span>
            </nav>

            {/* Title */}
            <header className="mt-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                Alternative à Meetic : une approche sans swipe
              </h1>
              <p className="mt-3 text-slate-800">
                Si vous cherchez une <strong>alternative à Meetic</strong>, c’est souvent pour une raison simple : vous
                voulez des échanges plus posés, plus clairs, et une expérience moins “bruyante”. Keefon est une plateforme{" "}
                <strong>indépendante</strong> qui met l’accent sur une approche <strong>sans swipe</strong> et sur la qualité
                des conversations.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/signup"
                  className="rounded-full bg-lime-400 px-5 py-2 text-sm font-semibold text-slate-900 shadow-sm hover:bg-lime-300"
                >
                  Créer mon profil
                </Link>
                <Link
                  href="/rencontres/france"
                  className="rounded-full border border-slate-300 bg-white/70 px-5 py-2 text-sm font-semibold text-slate-800 hover:bg-white"
                >
                  Rencontres en France
                </Link>
              </div>
            </header>

            {/* Offer box */}
            <section className="mt-8">
              <div className="rounded-2xl border border-yellow-300/70 bg-yellow-200/60 p-4 sm:p-5">
                <h2 className="text-sm font-bold text-slate-900">Offre de lancement</h2>
                <p className="mt-1 text-slate-800">
                  Gratuité jusqu’à fin 2026 pour les <strong>2 000 premiers inscrits</strong> (selon conditions en vigueur).
                </p>
                <p className="mt-1 text-sm text-slate-700">
                  Et quand un abonnement est proposé, il est pensé pour rester <strong>abordable</strong>.
                </p>
              </div>
            </section>

            {/* Comparison */}
            <section className="mt-8">
              <h2 className="text-xl font-extrabold text-slate-900">Comparaison rapide</h2>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-white/55 p-4">
                <div className="grid grid-cols-2 gap-x-3 sm:gap-x-6 text-[12px] sm:text-[13px] font-semibold text-slate-800">
                  <div>Keefon</div>
                  <div className="text-right">Services populaires</div>
                </div>

                <div className="mt-3 space-y-4">
                  {rows.map((r) => (
                    <div key={r.label}>
                      <div className="flex justify-center">
                        <span className="inline-flex items-center justify-center rounded-full bg-yellow-200/75 border border-yellow-300/70 px-4 py-[2px] text-[9.5px] sm:text-[10px] font-semibold tracking-tight text-slate-900 w-[220px] sm:w-[260px] max-w-[96%] leading-none">
                          {r.label}
                        </span>
                      </div>

                      <div className="mt-1.5 grid grid-cols-2 gap-x-3 sm:gap-x-6 text-[12px] sm:text-[13px] leading-snug">
                        <div className="text-slate-900">{r.keefon}</div>
                        <div className="text-right text-slate-700">{r.services}</div>
                      </div>

                      <div className="mt-2 h-px bg-slate-200/60" />
                    </div>
                  ))}
                </div>

                <p className="mt-2 text-[12px] text-slate-600">
                  Note : comparaison volontairement générale (les fonctionnalités exactes évoluent selon les services).
                </p>
              </div>
            </section>

            {/* Why */}
            <section className="mt-10">
              <h2 className="text-xl font-extrabold text-slate-900">Pourquoi chercher une alternative à Meetic ?</h2>
              <p className="mt-3 text-slate-800">
                Beaucoup de personnes veulent sortir du “défilement” sans fin et retrouver un espace plus humain :
              </p>
              <ul className="mt-3 list-disc pl-5 text-slate-800 space-y-1">
                <li>Moins de défilement, plus d’échange : une approche sans swipe qui privilégie la discussion.</li>
                <li>
                  <strong>Ouvert à tous les âges</strong> : une expérience pensée pour celles et ceux qui veulent du sérieux,
                  du respect, et du temps de qualité.
                </li>
                <li>
                  <strong>Plateforme française</strong> : un cadre conçu en France, avec une attention particulière à la
                  clarté et à la transparence.
                </li>
                <li>
                  <strong>Plusieurs options de tri</strong> : vous gardez le contrôle sur qui vous intéresse (et ce que vous
                  ne voulez pas).
                </li>
                <li>
                  <strong>Outils de signalement / modération</strong> : pour gérer les profils ou comportements qui vous
                  interpellent.
                </li>
                <li>Un environnement plus clair, où l’on se repère facilement (pages, infos, parcours).</li>
              </ul>
            </section>

            {/* What changes */}
            <section className="mt-8">
              <h2 className="text-lg font-bold text-slate-900">Keefon : ce qui change (sans promesse floue)</h2>
              <p className="mt-3 text-slate-800">
                L’objectif n’est pas de “faire mieux que tout le monde” avec des slogans, mais de proposer une alternative
                claire :
              </p>
              <ul className="mt-3 list-disc pl-5 text-slate-800 space-y-1">
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
