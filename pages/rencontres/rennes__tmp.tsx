/**
 * Fichier : pages/rencontres/Rennes.tsx
 * Module : Pages publiques / SEO — Rencontres sur la zone Rennes & Bretagne
 * MAJ : 2025-12-04 — Domaine www.keefon.com + CTA + footer légal harmonisé
 *
 * Contexte :
 * - Page vitrine dédiée à la zone Rennes et alentours (Rennes, Cesson-Sévigné, Saint-Jacques-de-la-Lande,
 *   Bruz, Chantepie, etc.).
 * - Même design et même logique que les autres pages de zone (Paris, Toulouse, Strasbourg…).
 * - Pas de promesse de filtres ultra-précis : on parle de “zone Rennes / Bretagne” de façon large.
 *
 * Dépendances :
 * - next/head, next/link
 * - Tailwind CSS pour les classes utilitaires
 *
 * Données lues :
 * - Aucune (page purement statique).
 *
 * Effets de bord :
 * - Aucun (rendu React uniquement).
 *
 * Invariants :
 * - Garder la cohérence visuelle avec France.tsx / Paris.tsx / Toulouse.tsx.
 * - Ne PAS promettre des fonctionnalités de recherche qui n’existent pas encore.
 */

import Head from "next/head";
import Link from "next/link";

/* ===========================  SEO (Rennes / Bretagne)  =========================== */
const SEO = {
  title: "Rencontres bienveillantes à Rennes et en Bretagne | Keefon",
  description:
    "Keefon Rennes rassemble celles et ceux qui vivent à Rennes et dans les villes autour, et qui cherchent des rencontres plus humaines, sans swipe infini ni algorithmes obscurs. Pendant la période d’ouverture, le chat reste gratuit.",
  canonical: "https://www.keefon.com/rencontres/rennes",
  siteName: "Keefon",
  ogImage: "https://www.keefon.com/og/rencontres-Rennes.jpg",
  keywords: [
    // Intent + fonctionnalités
    "rencontre Rennes",
     "rencontre gratuite Rennes",
    "rencontres Rennes",
    "site de rencontre Rennes",
    "rencontres Ille-et-Vilaine",
    "rencontres Bretagne",
    "rencontre locale Rennes",
    "rencontre proche de chez moi Rennes",
    "chat rencontre Rennes",
    "chat gratuit Rennes",
    "rencontres bienveillantes Rennes",
    "rencontres respectueuses",
    "rencontre après 30 ans Rennes",
    "rencontre après 40 ans Rennes",
    "rencontre après 50 ans Rennes",

    // Villes / zone
    "Rennes",
    "Cesson-Sévigné",
    "Saint-Jacques-de-la-Lande",
    "Bruz",
    "Chantepie",
    "Pacé",
    "Vern-sur-Seiche",
    "Betton",
    "Ille-et-Vilaine",
    "Bretagne",
  ].join(", "),
  breadcrumb: [
    { name: "Accueil", url: "https://www.keefon.com" },
    { name: "Rencontres", url: "https://www.keefon.com/rencontres" },
    {
      name: "Rennes",
      url: "https://www.keefon.com/rencontres/rennes",
    },
  ],
};

/* ===========================  Style & flags  =========================== */
const COLORS = {
  bannerGrad: "linear-gradient(180deg, #FFF273 0%, #FFE44B 100%)",
  paleGreen: "#59FF72",
};
const FREE_MODE = true;

/* ===========================  Bandeau fixe (période gratuite)  =========================== */
function FreeTopBar() {
  if (!FREE_MODE) return null;
  return (
    <div
      role="status"
      aria-label="Période gratuite en cours : accès gratuit et chat ouvert à tous"
      className="fixed inset-x-0 top-0 z-[1000] w-full"
      style={{
        background: COLORS.bannerGrad,
        boxShadow: "0 8px 28px rgba(0,0,0,0.22)",
      }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:py-5">
        <p className="m-0 flex-1 text-left font-extrabold leading-snug text-slate-900">
          <span className="block text-[15px] sm:text-[18px]">
            Période gratuite :{" "}
            <span className="underline decoration-2 underline-offset-2">
              accès 100% gratuit
            </span>{" "}
            — chat ouvert à tous
          </span>
          <span className="mt-0.5 block text-[13px] sm:text-[15px] font-semibold opacity-90">
            Aucune carte bancaire demandée. Profite-en dès maintenant.
          </span>
        </p>

        <a
          href="/signup"
          aria-label="Créer un compte gratuitement pendant la période gratuite"
          title="Créer un compte gratuitement"
          className="shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold text-slate-900 shadow transition transform-gpu hover:-translate-y-[1px] hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-slate-900/30 sm:px-5 sm:py-2.5 sm:text-[14px]"
          style={{ background: COLORS.paleGreen }}
        >
          En profiter
        </a>
      </div>
    </div>
  );
}

function FreeTopBarSpacer() {
  if (!FREE_MODE) return null;
  return <div className="h-[72px] w-full sm:h-[84px]" />;
}

/* ===========================  Carte rappel période gratuite  =========================== */
function FreeReminderCard() {
  if (!FREE_MODE) return null;
  return (
    <section className="py-4">
      <div className="mx-auto w-full max-w-5xl px-4">
        <div
          className="rounded-3xl border px-5 py-5 shadow-sm"
          style={{
            borderColor: "#F9E13A",
            background: COLORS.bannerGrad,
            boxShadow: "0 10px 28px rgba(0,0,0,0.18)",
          }}
        >
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="text-slate-900">
              <p className="m-0 text-[15px] font-extrabold sm:text-[18px]">
                Accès 100% gratuit — chat ouvert à tous.
              </p>
              <p className="m-0 mt-1 text-[13px] sm:text-[14px]">
                Tu peux créer ton profil, échanger librement et découvrir Keefon
                sans carte bancaire. Offre à durée limitée.
              </p>
            </div>
            <a
              href="/signup"
              aria-label="Profiter de l’accès 100% gratuit"
              title="Profiter de l’accès 100% gratuit"
              className="rounded-full px-4 py-2 text-[13px] font-semibold text-slate-900 shadow transition transform-gpu hover:-translate-y-[1px] hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-slate-900/30 sm:px-5 sm:py-2.5 sm:text-[14px]"
              style={{ background: COLORS.paleGreen }}
            >
              En profiter
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ===========================  Exemples de profils — Rennes  =========================== */
function ProfileTeaserBand() {
  /**
   * ⚠️ Fichiers à placer dans : /public/avatars_France/Rennes/
   * IMPORTANT :
   *  - pas d’accents ni d’espaces dans les noms de fichiers
   *    (Claire.png, Malo.png, Lea.png, Yvan.png)
   *  - rester cohérent entre ces chemins et les fichiers réels.
   */
  const profiles = [
    {
      pseudo: "Claire",
      ageVille: "32 ans — Rennes centre",
      badges: ["Free"],
      phrase:
        "Je travaille en ville et j’aime les cafés calmes, les balades et les concerts. J’avais besoin d’une appli qui ne me donne pas l’impression d’être un produit.",
      avatarSrc: "/avatars_France/Rennes/Claire.png",
      avatarAlt:
        "Profil fictif Claire (femme souriante dans une rue pavée de centre-ville)",
      priority: true,
    },
    {
      pseudo: "Malo_35",
      ageVille: "35 ans — Rennes",
      badges: ["Essentiel"],
      phrase:
        "Entre le boulot, les trajets et les sorties entre potes, je n’ai pas envie de passer mes soirées à swiper sur des centaines de profils.",
      avatarSrc: "/avatars_France/Rennes/Malo.png",
      avatarAlt:
        "Profil fictif Malo (homme souriant près d’un parc urbain, ciel légèrement gris)",
      priority: true,
    },
    {
      pseudo: "Lea",
      ageVille: "27 ans — proche Rennes",
      badges: ["Free"],
      phrase:
        "Je bouge entre Rennes et les communes autour. J’aime pouvoir discuter tranquillement avant d’envisager une rencontre.",
      avatarSrc: "/avatars_France/Rennes/Lea.png",
      avatarAlt:
        "Profil fictif Lea (jeune femme en manteau, en extérieur dans une ville bretonne)",
    },
    {
      pseudo: "Yvan",
      ageVille: "44 ans — Ille-et-Vilaine",
      badges: ["Essentiel"],
      phrase:
        "Je voulais une plateforme qui ne joue pas avec mes nerfs ou mon temps. Ici, chacun sait pourquoi il est là.",
      avatarSrc: "/avatars_France/Rennes/Yvan.png",
      avatarAlt:
        "Profil fictif Yvan (homme souriant, ambiance sobre, lumière naturelle)",
    },
  ];

  return (
    <section className="section section-profiles-preview py-6">
      <div className="container mx-auto max-w-5xl px-4">
        {/* Mention discrète (bulle jaune pâle) */}
        <div
          className="relative mt-3 inline-block w-fit px-0 py-0 text-[12px] sm:text-[13px] leading-relaxed"
          style={{ color: "#FEFF93" }}
        >
          Profils fictifs inspirés de vraies personnes. Chaque membre décide
          ce qu&apos;il partage et reste protégé par les lois françaises.
        </div>

        <div className="mt-5 flex gap-4 overflow-x-auto pb-3 md:grid md:grid-cols-2 md:overflow-visible lg:grid-cols-4">
          {profiles.map((p) => (
            <article
              key={p.pseudo}
              className="profile-card-preview group relative min-w-[260px] max-w-xs overflow-hidden rounded-3xl shadow-md"
            >
              <div className="relative h-72 w-full">
                <img
                  src={p.avatarSrc}
                  alt={p.avatarAlt}
                  className="h-full w-full object-cover"
                  loading={p.priority ? "eager" : "lazy"}
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 z-10 px-4 pb-4">
                  <div className="text-sm font-semibold text-white drop-shadow">
                    {p.pseudo}
                  </div>
                  <div className="mt-[2px] text-xs text-slate-100 drop-shadow">
                    {p.ageVille}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {p.badges.map((b) => (
                      <span
                        key={b}
                        className="inline-flex items-center rounded-full bg-sky-50/95 px-2 py-[2px] text-[10px] font-semibold text-slate-900 shadow-sm"
                      >
                        {b}
                      </span>
                    ))}
                  </div>
                  <div className="mt-2 rounded-2xl bg-sky-50/95 px-3 py-2 text-[11px] leading-relaxed text-slate-900 shadow-sm">
                    {p.phrase}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ===========================  Page principale  =========================== */
export default function RennesRencontresPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: SEO.siteName,
        url: "https://www.keefon.com",
        potentialAction: {
          "@type": "SearchAction",
          target: "https://www.keefon.com/recherche?q={query}",
          "query-input": "required name=query",
        },
      },
      {
        "@type": "WebPage",
          name: SEO.title,
          url: SEO.canonical,
          description: SEO.description,
          inLanguage: "fr-FR",
          isPartOf: { "@id": "https://www.keefon.com#website" },
      },
    ],
  };

  return (
    <>
      <Head>
        <title>{SEO.title}</title>
        <meta name="description" content={SEO.description} />
        <meta name="keywords" content={SEO.keywords} />
        <link rel="canonical" href={SEO.canonical} />
        <meta property="og:title" content={SEO.title} />
        <meta property="og:description" content={SEO.description} />
        <meta property="og:image" content={SEO.ogImage} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={SEO.siteName} />
        <script
          key="ld-json"
          type="application/ld+json"
          // JSON-LD statique, pas d’injection de données utilisateur
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </Head>

      <FreeTopBar />
      <FreeTopBarSpacer />

      <main
        /**
         * Image de fond :
         *  - Pour l’instant on réutilise bg-France-ext.png, déjà présent dans /public.
         *  - Tu pourras remplacer plus tard par une image plus “Rennes”
         *    (par exemple bg-Rennes-ext.png) en ne changeant QUE backgroundImage.
         */
        className="min-h-screen"
        style={{
          backgroundImage: "url('/bg-France-ext.png')",
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center top",
        }}
      >
        {/* HERO */}
        <header className="py-10">
          <div className="container mx-auto flex justify-center px-4">
            <div className="w-full max-w-3xl rounded-3xl border border-sky-200 bg-sky-50/65 px-6 py-6 text-slate-900 shadow-xl backdrop-blur-[2px]">
              {/* Logo texte KEEFON */}
              <div className="mb-2 flex items-center justify-center">
                <span
                  aria-hidden="true"
                  className="leading-none text-5xl font-extrabold tracking-tight sm:text-6xl"
                  style={{
                    color: "#93ef09ff",
                    textShadow:
                      "0 2px 10px rgba(0,0,0,0.35), 0 6px 22px rgba(0,0,0,0.22)",
                  }}
                >
                  KEEFON
                </span>
              </div>

              {/* H1 SEO */}
              <h1
                className="text-center text-3xl font-extrabold sm:text-4xl md:text-5xl"
                style={{
                  color: "#cdff58ff",
                  textShadow: "0 2px 6px rgba(0,0,0,0.25)",
                }}
              >
                Rencontres bienveillantes à Rennes et autour
              </h1>

              <p className="mt-3 text-center text-sm leading-relaxed text-slate-900 sm:text-base">
                Une plateforme française pour celles et ceux qui vivent à Rennes
                ou dans les communes autour, et qui veulent des rencontres plus
                humaines, loin des applis centrées sur la consommation de
                profils.
              </p>

              <p className="mt-2 text-center text-xs leading-relaxed text-slate-800 sm:text-[13px]">
                Keefon est pensée et hébergée en France, dans le respect des
                lois françaises sur la vie privée (RGPD, CNIL, droits de
                l&apos;individu).
              </p>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                <a
                  href="/signup"
                  aria-label="Je crée mon profil, c'est gratuit"
                  title="Je crée mon profil, c'est gratuit"
                  className="inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold text-slate-900 shadow transition transform-gpu hover:-translate-y-[1px] hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-slate-900/30"
                  style={{ background: COLORS.paleGreen }}
                >
                  Je crée mon profil, c&apos;est gratuit
                </a>
                <p className="text-xs text-slate-700">
                  Inscription rapide. Tu restes libre de ce que tu partages.
                </p>

                <Link
  href="/login"
  aria-label="Déjà inscrit ? Se connecter"
  title="Se connecter"
  className="inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold text-slate-900 shadow transition transform-gpu hover:-translate-y-[1px] hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-slate-900/30"
  style={{
    background: COLORS.bannerGrad,
    border: "1px solid #F9E13A",
  }}
>
  Déjà inscrit ? Se connecter
</Link>
              </div>
            </div>
          </div>
        </header>

        {/* Rappel période gratuite */}
        <FreeReminderCard />

        {/* Exemples de profils (Rennes) */}
        <ProfileTeaserBand />

        {/* Comment ça marche ? */}
        <section className="py-10">
          <div className="container mx-auto max-w-5xl px-4">
            <h2 className="text-xl font-semibold text-menuBtn sm:text-2xl">
              Comment ça marche sur la zone Rennes&nbsp;?
            </h2>
            <div className="mt-6 grid gap-6 md:grid-cols-3">
              <article className="rounded-2xl border border-sky-200 bg-white/35 px-4 py-4 text-slate-900 shadow-sm backdrop-blur-[1px]">
                <h3 className="mb-2 text-sm font-semibold text-chatOuter sm:text-base">
                  1. Tu crées ton profil
                </h3>
                <h3 className="mb-2 text-sm font-semibold text-chatOuter sm:text-base">
                  2. Tu indiques que tu es sur la zone Rennes / Ille-et-Vilaine
                </h3>
                <h3 className="mb-2 text-sm font-semibold text-chatOuter sm:text-base">
                  3. Tu échanges simplement
                </h3>
              </article>
            </div>
          </div>
        </section>

        {/* Pourquoi Keefon est différent ? */}
        <section className="py-10">
          <div className="container mx-auto max-w-5xl px-4">
            <h2 className="text-xl font-semibold text-menuBtn sm:text-2xl">
              Pourquoi Keefon est différent à Rennes&nbsp;?
            </h2>
            <div className="mt-6 max-w-3xl rounded-2xl border border-sky-200 bg-white/40 px-4 py-4 text-slate-900 shadow-sm backdrop-blur-[1px]">
              <p className="mb-2 text-sm font-semibold text-chatOuter sm:text-base">
                Pas de swipe toxique
              </p>
              <p className="text-sm leading-relaxed">
                Pas de défilement infini pour te garder accroché à l&apos;écran.
                Le but, c&apos;est la rencontre, pas l&apos;addiction. Les
                comportements irrespectueux peuvent être signalés et sont
                incompatibles avec l&apos;esprit du site.
              </p>

              <p className="mt-4 mb-2 text-sm font-semibold text-chatOuter sm:text-base">
                Plus d&apos;ouvertures pour tous
              </p>
              <p className="text-sm leading-relaxed">
                Les Échos et Keefon+ ajoutent des opportunités pour les profils
                Free. L&apos;abonnement Essentiel reste volontairement
                raisonnable pour aller plus loin sans exploser ton budget.
              </p>
            </div>
          </div>
        </section>

        {/* Rennes ancrée dans le réel */}
        <section className="py-10">
          <div className="container mx-auto max-w-5xl px-4">
            <h2 className="text-xl font-semibold text-menuBtn sm:text-2xl">
              Rencontrer sur Rennes, sans se perdre dans la masse
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-900 sm:text-base">
              Entre le centre-ville, les quartiers étudiants, les parcs et les
              communes autour, il y a du monde. Keefon t&apos;aide à ouvrir des
              portes sans te noyer dans une liste interminable de profils
              anonymes.
            </p>
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <article className="rounded-2xl border border-sky-200 bg-white/40 px-4 py-4 text-slate-900 shadow-sm backdrop-blur-[1px]">
                <h3 className="mb-2 text-sm font-semibold text-chatOuter sm:text-base">
                  Rennes et les communes voisines
                </h3>
                <p className="text-sm leading-relaxed">
                  Que tu sois en centre-ville, à Villejean, à Cesson-Sévigné,
                  Saint-Jacques-de-la-Lande, Bruz ou plus loin, tu peux croiser
                  des personnes qui vivent sur la même grande zone que toi.
                </p>
              </article>

              <article className="rounded-2xl border border-sky-200 bg-white/40 px-4 py-4 text-slate-900 shadow-sm backdrop-blur-[1px]">
                <h3 className="mb-2 text-sm font-semibold text-chatOuter sm:text-base">
                  Et le reste de la Bretagne quand tu bouges
                </h3>
                <p className="text-sm leading-relaxed">
                  Si tu te déplaces régulièrement vers d&apos;autres villes
                  bretonnes, tu peux aussi utiliser Keefon ailleurs, avec les
                  mêmes règles de clarté et de respect.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="py-10">
          <div className="container mx-auto max-w-5xl px-4">
            <h2 className="text-xl font-semibold text-menuBtn sm:text-2xl">
              Envie de rencontres plus humaines à Rennes&nbsp;?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-900 sm:text-base">
              Keefon s&apos;adresse à celles et ceux qui préfèrent un cadre plus
              calme et plus clair que les applis classiques, tout en restant
              connectés à la vie rennaise.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a
                href="/signup"
                aria-label="Je crée mon profil, c'est gratuit"
                title="Je crée mon profil, c'est gratuit"
                className="inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold text-slate-900 shadow transition transform-gpu hover:-translate-y-[1px] hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-slate-900/30"
                style={{ background: COLORS.paleGreen }}
              >
                Je crée mon profil, c&apos;est gratuit
              </a>
              <p className="text-xs text-slate-800">
                Tu peux tester l&apos;appli gratuitement, voir comment tu te
                sens, puis décider si tu veux aller plus loin.
              </p>
            </div>
          </div>
        </section>

        {/* Idées de sorties locales (Rennes & alentours) */}
        <section className="py-6">
          <div className="mx-auto max-w-5xl px-4">
            <div className="rounded-2xl bg-white/30 px-4 py-3 text-[11px] text-slate-900 shadow-sm backdrop-blur-[2px]">
              <h2 className="mb-1 text-xs font-semibold text-chatOuter">
                Quelques idées de sorties autour de Rennes
              </h2>
              <ul className="list-disc space-y-1 pl-4">
                <li>
                  Balade en centre-ville, autour des places et des rues
                  piétonnes, avec un café en terrasse pour discuter dans un lieu
                  public.
                </li>
                <li>
                  Promenade au parc du Thabor ou dans un autre parc rennais,
                  pour parler un peu plus au calme.
                </li>
                <li>
                  Marche le long des quais ou d&apos;un canal proche, en restant
                  sur des portions fréquentées et bien éclairées.
                </li>
                <li>
                  Si vous êtes en périphérie, petite balade dans le
                  centre-ville d&apos;une commune voisine, avec un café ou un
                  lieu public comme point de repère.
                </li>
              </ul>
              <p className="mt-2">
                Ce ne sont que des idées : chacun choisit ses lieux de
                rencontre, son rythme et ses limites, avec le confort et la
                sécurité en priorité.
              </p>
            </div>
          </div>
        </section>

        {/* Liens internes SEO (France + autres villes) */}
        <section className="py-6">
          <div className="mx-auto max-w-5xl px-4">
            <div className="rounded-2xl bg-white/30 px-4 py-3 text-[11px] text-slate-800 shadow-sm backdrop-blur-[2px]">
              <p className="mb-2">
                Tu peux aussi explorer la vue d&apos;ensemble&nbsp;:{" "}
                <Link
                  href="/rencontres/france"
                  className="font-semibold underline-offset-2 hover:underline"
                >
                  rencontres en France
                </Link>
                .
              </p>
              <p className="mb-1">
                Autres grandes villes où Keefon est présent&nbsp;:
              </p>
              <ul className="flex flex-wrap gap-x-3 gap-y-1">
                <li>
                  <Link
                    href="/rencontres/nantes"
                    className="underline-offset-2 hover:underline"
                  >
                    Rencontres à Nantes
                  </Link>
                </li>
                <li>
                  <Link
                    href="/rencontres/paris"
                    className="underline-offset-2 hover:underline"
                  >
                    Rencontres à Paris
                  </Link>
                </li>
                <li>
                  <Link
                    href="/rencontres/bordeaux"
                    className="underline-offset-2 hover:underline"
                  >
                    Rencontres à Bordeaux
                  </Link>
                </li>
                <li>
                  <Link
                    href="/rencontres/strasbourg"
                    className="underline-offset-2 hover:underline"
                  >
                    Rencontres à Strasbourg
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Footer légal complet */}
        <footer className="pt-4 pb-10">
          <div className="mx-auto max-w-5xl px-4">
            <p className="mt-2 text-[11px] text-center text-slate-900">
              <Link href="/cgu" className="hover:underline">
                Conditions Générales d&apos;Utilisation
              </Link>
              {" · "}
              <Link href="/mentions-legales" className="hover:underline">
                Mentions légales
              </Link>
              {" · "}
              <Link href="/confidentialite" className="hover:underline">
                Politique de confidentialité
              </Link>
              {" · "}
              <Link href="/cookies" className="hover:underline">
                Cookies
              </Link>
            </p>
          </div>
        </footer>
      </main>
    </>
  );
}
