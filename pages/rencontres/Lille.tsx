/**
 * Fichier : pages/rencontres/lille.tsx
 * Module : Pages publiques / SEO — Rencontres sur la zone Lille / métropole lilloise
 * MAJ : 2025-11-19 — Version basée sur france.tsx / paris.tsx, adaptée à Lille + métropole.
 *
 * Contexte :
 * - Page vitrine dédiée à la zone Lille / métropole lilloise, en plus de la page générale France.
 * - Même design et même logique que pages/rencontres/france.tsx et paris.tsx pour rester simple à maintenir.
 * - Pas de promesse de filtres avancées : on parle de “zone Lille / métropole lilloise” de façon large.
 *
 * Dépendances :
 * - next/head, next/image, next/link
 * - Tailwind pour les classes utilitaires
 *
 * Données lues :
 * - Aucune (page purement statique, pas de fetch).
 *
 * Effets de bord :
 * - Aucun (uniquement rendu React côté front).
 *
 * Invariants :
 * - Garder la cohérence visuelle avec france.tsx / paris.tsx (bandeau jaune, carte rappel, structure des sections).
 * - Ne PAS promettre de fonctionnalités de recherche ultra-précises qui n'existent pas encore.
 */

import Head from "next/head";
import Image from "next/image";
import Link from "next/link";

/* ===========================  SEO (mots-clés & libellés)  =========================== */
const SEO = {
  title: "Rencontres bienveillantes à Lille et dans la métropole | Keefon",
  description:
    "Keefon Lille est la porte d’entrée pour des rencontres bienveillantes à Lille et dans la métropole lilloise : échanges simples, respectueux, sans swipe infini. Pendant la période d’ouverture, le chat reste gratuit.",
  canonical: "https://keefon.com/rencontres/Lille",
  siteName: "Keefon",
  ogImage: "https://keefon.com/og/rencontres-lille.jpg",
  keywords: [
    // Intent + fonctionnalités (variante par rapport à Paris / France)
    "rencontre Lille",
    "rencontres Lille",
    "site de rencontre Lille",
    "rencontres métropole lilloise",
    "rencontre locale Lille",
    "rencontre proche de chez moi Lille",
    "rencontres Hauts-de-France",
    "chat gratuit Lille",
    "chat rencontre gratuit Lille",
    "messagerie de rencontre Lille",
    "rencontres bienveillantes Lille",
    "rencontres respectueuses",
    "profils certifiés",
    "profil certifié",
    "vérification de profil",
    "respect et sécurité",
    "anti harcèlement",
    "sans swipe infini",
    "sans algorithme opaque",
    "anti addiction",
    "plateforme RGPD",
    "respect CNIL",
    "protection des données",
    "dating Lille",
    "dating Hauts-de-France",
    "slow dating",
    "dating bienveillant",
    "rencontre adultes consentants",

    // Villes / zone (SEO, pas promesse de filtres pointus)
    "Lille",
    "Roubaix",
    "Tourcoing",
    "Villeneuve-d'Ascq",
    "Marcq-en-Barœul",
    "La Madeleine",
    "Lambersart",
    "Mons-en-Barœul",
    "Hellemmes",
    "Lomme",

    // Combinaisons courtes utiles
    "rencontre sérieuse Lille",
    "rencontre après 30 ans Lille",
    "rencontre après 40 ans Lille",
    "rencontre après 50 ans Lille",
  ].join(", "),
  breadcrumb: [
    { name: "Accueil", url: "https://keefon.com/" },
    { name: "Rencontres", url: "https://keefon.com/rencontres" },
    { name: "Lille / métropole", url: "https://keefon.com/rencontres/lille" },
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

/* ===========================  Carte rappel (même fond que le bandeau)  =========================== */
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
                Tu peux créer ton profil, échanger librement et tester Keefon
                sans carte bancaire. Offre temporaire.
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

/* ===========================  Bandeau “exemples de profils” — Lille / métropole  =========================== */
function ProfileTeaserBand() {
  /**
   * ⚠️ Fichiers à placer dans : /public/avatars_France/Lille/
   * IMPORTANT :
   *  - pas d’accents ni d’espaces dans les noms de fichiers
   *    (Valerie.png, Armand.png, Gaelle.png, Remi.png)
   *  - la casse peut être adaptée, l’important est de rester cohérent avec les chemins ci-dessous.
   */
  const profiles = [
    {
      pseudo: "Valérie",
      ageVille: "52 ans — Lille",
      badges: ["Essentiel"],
      phrase:
        "Je sors beaucoup au resto et au théâtre, mais je n’aime pas les applis agressives. Ici je peux échanger calmement.",
      avatarSrc: "/avatars_France/Lille/Valerie.png",
      avatarAlt:
        "Profil fictif Valerie_Lille (femme à Lille en fin de journée)",
      priority: true,
    },
    {
      pseudo: "Armand_59",
      ageVille: "36 ans — Lille",
      badges: ["Free"],
      phrase:
        "Je bouge pas mal pour le boulot autour de Lille. Je préfère quelques rencontres claires plutôt qu’une liste de profils sans fin.",
      avatarSrc: "/avatars_France/Lille/Armand.png",
      avatarAlt: "Profil fictif Armand_59 (profil d’homme à Lille)",
      priority: true,
    },
    {
      pseudo: "Gaëlle",
      ageVille: "29 ans — Lille",
      badges: ["Free"],
      phrase:
        "Je travaille souvent en horaires décalés. Keefon me permet de discuter à mon rythme, sans me sentir pressée ou jugée.",
      avatarSrc: "/avatars_France/Lille/Gaelle.png",
      avatarAlt:
        "Profil fictif Gaelle_Nuit (jeune femme souriante dans une rue animée le soir)",
    },
    {
      pseudo: "Rémi",
      ageVille: "31 ans — Lille",
      badges: ["Essentiel"],
      phrase:
        "Entre les friteries, les concerts et les potes, j’avais envie d’un endroit plus simple pour faire des rencontres, ici c’est très différent des autres sites.",
      avatarSrc: "/avatars_France/Lille/Remi.png",
      avatarAlt: "Profil fictif Remi (homme souriant devant un snack lumineux)",
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
                <Image
                  src={p.avatarSrc}
                  alt={p.avatarAlt}
                  fill
                  className="object-cover"
                  sizes="(min-width:1024px)25vw,(min-width:768px)33vw,80vw"
                  priority={Boolean((p as any).priority)}
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

/* ===========================  Page  =========================== */
export default function LilleRencontresPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: SEO.siteName,
        url: "https://keefon.com",
        potentialAction: {
          "@type": "SearchAction",
          target: "https://keefon.com/recherche?q={query}",
          "query-input": "required name=query",
        },
      },
      {
        "@type": "WebPage",
        name: SEO.title,
        url: SEO.canonical,
        description: SEO.description,
        inLanguage: "fr-FR",
        isPartOf: { "@id": "https://keefon.com#website" },
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
         *  - pour l’instant on réutilise bg-France-ext.png (déjà présent dans /public)
         *  - tu pourras remplacer plus tard par un visuel spécifique (par ex. bg-Lille-ext.png)
         *    en ne changeant QUE la valeur de backgroundImage.
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
              {/* KEEFON centré et coloré (visuel) */}
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
                Rencontres bienveillantes à Lille et dans la métropole
              </h1>

              <p className="mt-3 text-center text-sm leading-relaxed text-slate-900 sm:text-base">
                Une plateforme française pour celles et ceux qui vivent à Lille
                et dans la métropole lilloise, et qui veulent des rencontres
                plus humaines, sans swipe toxique ni course aux matchs.
              </p>

              <p className="mt-2 text-center text-xs leading-relaxed text-slate-800 sm:text-[13px]">
                Keefon est créée et hébergée en France, dans le cadre des lois
                françaises de protection de la vie privée (RGPD, CNIL, droits
                de l&apos;individu).
              </p>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                <a
                  href="/signup"
                  aria-label="Créer mon profil gratuitement"
                  title="Créer mon profil gratuitement"
                  className="inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold text-slate-900 shadow transition transform-gpu hover:-translate-y-[1px] hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-slate-900/30"
                  style={{ background: COLORS.paleGreen }}
                >
                  Créer mon profil gratuitement
                </a>
                <p className="text-xs text-slate-700">
                  Inscription rapide. Tu gardes la main à chaque étape.
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Carte rappel période gratuite */}
        <FreeReminderCard />

        {/* Exemples de profils (Lille / métropole) */}
        <ProfileTeaserBand />

        {/* Comment ça marche ? */}
        <section className="py-10">
          <div className="container mx-auto max-w-5xl px-4">
            <h2 className="text-xl font-semibold text-menuBtn sm:text-2xl">
              Comment ça marche sur la métropole lilloise&nbsp;?
            </h2>
            <div className="mt-6 grid gap-6 md:grid-cols-3">
              <article className="rounded-2xl border border-sky-200 bg-white/35 px-4 py-4 text-slate-900 shadow-sm backdrop-blur-[1px]">
                <h3 className="mb-2 text-sm font-semibold text-chatOuter sm:text-base">
                  1. Tu crées ton profil
                </h3>
                <h3 className="mb-2 text-sm font-semibold text-chatOuter sm:text-base">
                  2. Tu indiques que tu es sur la zone Lille / métropole
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
              Pourquoi Keefon est différent à Lille&nbsp;?
            </h2>
            <div className="mt-6 max-w-3xl rounded-2xl border border-sky-200 bg-white/40 px-4 py-4 text-slate-900 shadow-sm backdrop-blur-[1px]">
              <p className="mb-2 text-sm font-semibold text-chatOuter sm:text-base">
                Pas de swipe toxique
              </p>
              <p className="text-sm leading-relaxed">
                Pas de défilement infini pour te garder accroché à l&apos;écran.
                Le but, c&apos;est la rencontre, pas l&apos;addiction. Les
                comportements toxiques sont hors-jeu et peuvent être signalés
                facilement.
              </p>

              <p className="mt-4 mb-2 text-sm font-semibold text-chatOuter sm:text-base">
                Plus d&apos;opportunités pour tous
              </p>
              <p className="text-sm leading-relaxed">
                Les Échos et Keefon+ créent des ouvertures supplémentaires pour
                les profils Free. L&apos;abonnement Essentiel reste
                volontairement abordable pour aller plus loin sans exploser ton
                budget.
              </p>
            </div>
          </div>
        </section>

        {/* Lille / métropole ancrée dans le réel */}
        <section className="py-10">
          <div className="container mx-auto max-w-5xl px-4">
            <h2 className="text-xl font-semibold text-menuBtn sm:text-2xl">
              Rencontrer à Lille, sans se perdre dans la masse
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-900 sm:text-base">
              La métropole lilloise est dense et très vivante. Keefon te permet
              d&apos;ouvrir des portes sans te perdre dans une marée de profils
              anonymes.
            </p>
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <article className="rounded-2xl border border-sky-200 bg-white/40 px-4 py-4 text-slate-900 shadow-sm backdrop-blur-[1px]">
                <h3 className="mb-2 text-sm font-semibold text-chatOuter sm:text-base">
                  Lille et les villes autour
                </h3>
                <p className="text-sm leading-relaxed">
                  Que tu sois en plein centre, à Villeneuve-d&apos;Ascq, Roubaix
                  ou dans une autre commune, tu peux croiser des personnes qui
                  vivent sur la même grande zone que toi.
                </p>
              </article>

              <article className="rounded-2xl border border-sky-200 bg-white/40 px-4 py-4 text-slate-900 shadow-sm backdrop-blur-[1px]">
                <h3 className="mb-2 text-sm font-semibold text-chatOuter sm:text-base">
                  Et le reste de la France si tu bouges
                </h3>
                <p className="text-sm leading-relaxed">
                  Si tu te déplaces souvent (travail, week-ends, vacances), tu
                  peux aussi utiliser Keefon dans le reste de la France, avec
                  les mêmes principes de respect et de clarté.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* Idées de sorties locales (Lille & métropole) */}
        <section className="py-6">
          <div className="mx-auto max-w-5xl px-4">
            <div className="rounded-2xl bg-white/30 px-4 py-3 text-[11px] text-slate-900 shadow-sm backdrop-blur-[2px]">
              <h2 className="mb-1 text-xs font-semibold text-chatOuter">
                Quelques idées de sorties autour de Lille
              </h2>
              <ul className="list-disc space-y-1 pl-4">
                <li>
                  Balade sur la Grand&apos;Place et dans le Vieux-Lille, avec un
                  café ou un chocolat chaud en terrasse pour prendre le temps de
                  discuter.
                </li>
                <li>
                  Promenade au parc de la Citadelle ou autour du quai du Wault,
                  pour parler au calme tout en restant en ville.
                </li>
                <li>
                  Découverte d&apos;un estaminet typique pour partager un repas
                  simple dans une ambiance chaleureuse et détendue.
                </li>
                <li>
                  Marché de Wazemmes ou sortie dans un quartier animé, en
                  choisissant un point de rendez-vous public et facile à
                  retrouver.
                </li>
                <li>
                  Exposition ou événement culturel à la Gare Saint-Sauveur ou
                  dans un musée de la métropole, si vous préférez une sortie
                  plus posée.
                </li>
              </ul>
              <p className="mt-2">
                Ce ne sont que des idées : chacun choisit ses lieux de
                rencontre, son rythme et ses limites.
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
                  href="/rencontres/France"
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
                    href="/rencontres/Paris"
                    className="underline-offset-2 hover:underline"
                  >
                    Rencontres à Paris
                  </Link>
                </li>
                <li>
                  <Link
                    href="/rencontres/Lyon"
                    className="underline-offset-2 hover:underline"
                  >
                    Rencontres à Lyon
                  </Link>
                </li>
                <li>
                  <Link
                    href="/rencontres/Bordeaux"
                    className="underline-offset-2 hover:underline"
                  >
                    Rencontres à Bordeaux
                  </Link>
                </li>
                <li>
                  <Link
                    href="/rencontres/Strasbourg"
                    className="underline-offset-2 hover:underline"
                  >
                    Rencontres à Strasbourg
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Footer / mentions légales */}
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
            </p>
          </div>
        </footer>
      </main>
    </>
  );
}
