/**
 * Fichier : pages/rencontres/lyon.tsx
 * Module : Pages publiques / SEO — Rencontres sur la zone Lyon / Métropole
 * MAJ : 2025-11-18 — Version basée sur paris.tsx, adaptée à Lyon + métropole
 *
 * Contexte :
 * - Page vitrine dédiée à la zone Lyon / Métropole, en plus de la page générale France.
 * - Même design et même logique que pages/rencontres/france.tsx pour rester simple à maintenir.
 * - Pas de promesse de filtres avancés : on parle de “Lyon et sa métropole” de façon large.
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
 * - Garder la cohérence visuelle avec france.tsx (bandeau jaune, carte rappel, structure des sections).
 * - Ne PAS promettre de fonctionnalités de recherche ultra-précises qui n’existent pas encore.
 */

import Head from "next/head";
import Image from "next/image";
import Link from "next/link";

/* ===========================  SEO (mots-clés & libellés)  =========================== */
const SEO = {
  title: "Rencontres bienveillantes à Lyon et dans la métropole | Keefon",
  description:
    "Keefon Lyon est une page dédiée aux rencontres bienveillantes à Lyon et dans sa métropole : échanges respectueux, profils vérifiés, sans swipe infini. Chat gratuit pendant la période d’ouverture.",
  canonical: "https://keefon.com/rencontres/Lyon",
  siteName: "Keefon",
  ogImage: "https://keefon.com/og/rencontres-lyon.jpg",
  keywords: [
    // Intent + features (garde le même esprit que France, ciblé Lyon / métropole)
    "rencontre Lyon",
    "rencontres Lyon",
    "rencontres métropole de Lyon",
    "site de rencontre Lyon",
    "site de rencontre métropole lyonnaise",
    "rencontres bienveillantes Lyon",
    "rencontre locale Lyon",
    "rencontres proche de chez moi Lyon",
    "chat gratuit Lyon",
    "chat rencontre gratuit Lyon",
    "messagerie gratuite Lyon",
    "profils certifiés Lyon",
    "profil certifié",
    "vérification profil",
    "respect et sécurité",
    "rencontre respectueuse",
    "anti harcèlement",
    "sans swipe",
    "sans swipe infini",
    "sans algorithme opaque",
    "anti addiction",
    "plateforme RGPD",
    "respect CNIL",
    "protection des données",
    "dating Lyon",
    "dating métropole de Lyon",
    "rencontre adultes consentants Lyon",
    "slow dating Lyon",
    "dating bienveillant Lyon",

    // Villes / zone (SEO, pas promesse de filtres)
    "Villeurbanne",
    "Vénissieux",
    "Bron",
    "Oullins",
    "Tassin-la-Demi-Lune",
    "Écully",
    "Caluire-et-Cuire",
    "Meyzieu",
    "Décines-Charpieu",
    "Saint-Priest",
    "Rillieux-la-Pape",

    // Combinaisons courtes utiles
    "rencontre sérieuse Lyon",
    "rencontre après 30 ans Lyon",
    "rencontre après 40 ans Lyon",
    "rencontre après 50 ans Lyon",
  ].join(", "),
  breadcrumb: [
    { name: "Accueil", url: "https://keefon.com/" },
    { name: "Rencontres", url: "https://keefon.com/rencontres" },
    { name: "Lyon / Métropole", url: "https://keefon.com/rencontres/lyon" },
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

/* ===========================  Bandeau “exemples de profils” — Lyon / Métropole  =========================== */
function ProfileTeaserBand() {
  // ⚠️ À placer dans /public/avatars_France/Lyon/
  // IMPORTANT : pas d’accents ni d’espaces dans les noms de fichiers (CLaire.png, Fabrice.png, Romain.png, Sabine.png).
  const profiles = [
    {
      pseudo: "Claire_69",
      ageVille: "42 ans — Lyon centre",
      badges: ["Free"],
      phrase:
        "Je bosse beaucoup et je n’ai pas envie de perdre mon temps à swiper. Ici je peux discuter tranquille avec des gens qui respectent les limites.",
      avatarSrc: "/avatars_France/Lyon/Claire_69.png",
      avatarAlt: "Profil fictif Claire_69 (femme à Lyon)",
      priority: true,
    },
    {
      pseudo: "Fabrice_Lyon",
      ageVille: "25 ans — Villeurbanne",
      badges: ["Essentiel"],
      phrase:
        "Je voulais une appli moins agressive que les grosses plateformes. Quelques échanges de qualité me suffisent largement.",
      avatarSrc: "/avatars_France/Lyon/Fabrice.png",
      avatarAlt: "Profil fictif Fabrice_Lyon (jeune homme à Lyon)",
      priority: true,
    },
    {
      pseudo: "Romain_Metro",
      ageVille: "47 ans — Métropole de Lyon",
      badges: ["Free"],
      phrase:
        "Séparé depuis peu, j’avance doucement. Keefon m’aide à reprendre confiance sans me sentir jugé ou pressé.",
      avatarSrc: "/avatars_France/Lyon/Romain.png",
      avatarAlt: "Profil fictif Romain_Metro (homme mûr à Lyon)",
    },
    {
      pseudo: "Sabine_Confluence",
      ageVille: "26 ans — Lyon Confluence",
      badges: ["Essentiel"],
      phrase:
        "Je sors pas mal dans Lyon, mais pour rencontrer vraiment quelqu’un, j’avais besoin d’un espace plus posé que les soirées.",
      avatarSrc: "/avatars_France/Lyon/Sabine.png",
      avatarAlt: "Profil fictif Sabine_Confluence (jeune femme à Lyon)",
    },
  ];

  return (
    <section className="section section-profiles-preview py-6">
      <div className="container mx-auto max-w-5xl px-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-menuBtn sm:text-base">
          (zone Lyon / métropole)
        </h2>

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
export default function LyonRencontresPage() {
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
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </Head>

      <FreeTopBar />
      <FreeTopBarSpacer />

      <main
        // Image de fond : pour l’instant on réutilise le fond France existant.
        // Fichier : /public/bg-France-ext.png (déjà utilisé sur la page France).
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
                Rencontres bienveillantes à Lyon et dans la métropole
              </h1>

              <p className="mt-3 text-center text-sm leading-relaxed text-slate-900 sm:text-base">
                Keefon s&apos;adresse aux personnes qui vivent à Lyon,
                Villeurbanne et dans les communes de la métropole, et qui
                préfèrent des rencontres plus calmes, sans course aux matchs ni
                swipe infini.
              </p>

              <p className="mt-2 text-center text-xs leading-relaxed text-slate-800 sm:text-[13px]">
                Keefon est pensée et hébergée en France, avec une attention
                particulière portée à la protection de la vie privée (RGPD,
                CNIL, droits de l&apos;individu).
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
                  Inscription rapide. Tu restes libre de ce que tu partages.
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Carte rappel période gratuite */}
        <FreeReminderCard />

        {/* Exemples de profils (Lyon / Métropole) */}
        <ProfileTeaserBand />

        {/* Comment ça marche ? */}
        <section className="py-10">
          <div className="container mx-auto max-w-5xl px-4">
            <h2 className="text-xl font-semibold text-menuBtn sm:text-2xl">
              Comment ça marche autour de Lyon&nbsp;?
            </h2>
            <div className="mt-6 grid gap-6 md:grid-cols-3">
              <article className="rounded-2xl border border-sky-200 bg-white/35 px-4 py-4 text-slate-900 shadow-sm backdrop-blur-[1px]">
                <h3 className="mb-2 text-sm font-semibold text-chatOuter sm:text-base">
                  1. Tu crées ton profil en quelques minutes
                </h3>
                <p className="text-sm leading-relaxed">
                  Tu ajoutes une photo, ce que tu recherches, et quelques infos
                  simples pour te présenter.
                </p>
              </article>
              <article className="rounded-2xl border border-sky-200 bg-white/35 px-4 py-4 text-slate-900 shadow-sm backdrop-blur-[1px]">
                <h3 className="mb-2 text-sm font-semibold text-chatOuter sm:text-base">
                  2. Tu indiques Lyon ou ta commune de la métropole
                </h3>
                <p className="text-sm leading-relaxed">
                  Centre-ville, rive gauche, Confluence, banlieue ouest… Tu
                  situes simplement ta zone sans avoir besoin d&apos;être ultra
                  précis.
                </p>
              </article>
              <article className="rounded-2xl border border-sky-200 bg-white/35 px-4 py-4 text-slate-900 shadow-sm backdrop-blur-[1px]">
                <h3 className="mb-2 text-sm font-semibold text-chatOuter sm:text-base">
                  3. Tu échanges à ton rythme
                </h3>
                <p className="text-sm leading-relaxed">
                  Tu discutes via la messagerie, tu vois si le feeling passe,
                  puis tu décides si tu veux aller plus loin dans le réel.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* Pourquoi Keefon est différent ? */}
        <section className="py-10">
          <div className="container mx-auto max-w-5xl px-4">
            <h2 className="text-xl font-semibold text-menuBtn sm:text-2xl">
              Pourquoi Keefon est différent pour Lyon&nbsp;?
            </h2>
            <div className="mt-6 max-w-3xl rounded-2xl border border-sky-200 bg-white/40 px-4 py-4 text-slate-900 shadow-sm backdrop-blur-[1px]">
              <p className="mb-2 text-sm font-semibold text-chatOuter sm:text-base">
                Pas de swipe toxique
              </p>
              <p className="text-sm leading-relaxed">
                L&apos;objectif n&apos;est pas de te scotcher à l&apos;écran
                avec des centaines de profils. Tu peux ouvrir des conversations
                claires, poser des limites, signaler les comportements
                irrespectueux et avancer à ton rythme.
              </p>

              <p className="mt-4 mb-2 text-sm font-semibold text-chatOuter sm:text-base">
                Des options pour avancer sans exploser ton budget
              </p>
              <p className="text-sm leading-relaxed">
                Les Échos et Keefon+ créent des opportunités supplémentaires
                pour les profils Free. L&apos;abonnement Essentiel reste
                volontairement raisonnable, pour aller un peu plus loin si tu
                en as envie, sans pression financière.
              </p>
            </div>
          </div>
        </section>

        {/* Lyon / Métropole ancrée dans le réel */}
        <section className="py-10">
          <div className="container mx-auto max-w-5xl px-4">
            <h2 className="text-xl font-semibold text-menuBtn sm:text-2xl">
              Rencontrer à Lyon sans se perdre dans la foule
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-900 sm:text-base">
              Lyon est une grande ville, avec des quartiers très différents.
              Keefon te permet d&apos;ouvrir des portes sans te diluer dans une
              masse anonyme de profils : tu restes dans un cadre humain et
              lisible.
            </p>
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <article className="rounded-2xl border border-sky-200 bg-white/40 px-4 py-4 text-slate-900 shadow-sm backdrop-blur-[1px]">
                <h3 className="mb-2 text-sm font-semibold text-chatOuter sm:text-base">
                  Lyon, Villeurbanne et toute la métropole
                </h3>
                <p className="text-sm leading-relaxed">
                  Que tu sois en Presqu&apos;île, sur les pentes, à
                  Villeurbanne ou dans une commune autour, tu peux croiser des
                  personnes qui partagent le même bassin de vie.
                </p>
              </article>

              <article className="rounded-2xl border border-sky-200 bg-white/40 px-4 py-4 text-slate-900 shadow-sm backdrop-blur-[1px]">
                <h3 className="mb-2 text-sm font-semibold text-chatOuter sm:text-base">
                  Et le reste de la France quand tu bouges
                </h3>
                <p className="text-sm leading-relaxed">
                  Si tu voyages souvent (TGV, déplacements pros, week-ends),
                  tu peux aussi utiliser Keefon dans le reste du pays, avec les
                  mêmes principes de clarté, de respect et de protection des
                  données.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="py-10">
          <div className="container mx-auto max-w-5xl px-4">
            <h2 className="text-xl font-semibold text-menuBtn sm:text-2xl">
              Envie de rencontres plus humaines à Lyon&nbsp;?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-900 sm:text-base">
              Keefon est pensée pour celles et ceux qui veulent profiter de la
              richesse de Lyon sans subir la brutalité de certaines applis
              classiques. Un espace plus calme, plus lisible, plus respectueux,
              ancré dans la réalité locale.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a
                href="/signup"
                aria-label="Créer mon profil gratuitement"
                title="Créer mon profil gratuitement"
                className="inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold text-slate-900 shadow transition transform-gpu hover:-translate-y-[1px] hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-slate-900/30"
                style={{ background: COLORS.paleGreen }}
              >
                Créer mon profil gratuitement
              </a>
              <p className="text-xs text-slate-800">
                Tu peux commencer gratuitement, compléter ton profil à ton
                rythme et décider ensuite de la suite.
              </p>
            </div>
          </div>
        </section>

        {/* Idées de sorties locales (Lyon & métropole) */}
        <section className="py-6">
          <div className="mx-auto max-w-5xl px-4">
            <div className="rounded-2xl bg-white/30 px-4 py-3 text-[11px] text-slate-900 shadow-sm backdrop-blur-[2px]">
              <h2 className="mb-1 text-xs font-semibold text-chatOuter">
                Quelques idées de sorties autour de Lyon
              </h2>
              <ul className="list-disc space-y-1 pl-4">
                <li>
                  Balade dans le Vieux Lyon et sur les quais de Saône, avec un
                  café ou une glace en terrasse pour prendre le temps de
                  discuter.
                </li>
                <li>
                  Promenade au{" "}
                  <span className="whitespace-nowrap">Parc de la Tête d&apos;Or</span>, autour
                  du lac ou dans les allées, pour parler au calme tout en
                  restant en ville.
                </li>
                <li>
                  Découverte d&apos;un bouchon lyonnais ou d&apos;une petite
                  adresse de quartier, si vous avez envie de partager un repas
                  simple dans une ambiance chaleureuse.
                </li>
                <li>
                  Marche dans les pentes de la Croix-Rousse ou sur la
                  Presqu&apos;île, en choisissant un point de rendez-vous
                  public et facile à retrouver pour que chacun se sente en
                  sécurité.
                </li>
                <li>
                  Flânerie à Confluence (quais, centre commercial, cinéma) si
                  vous préférez une sortie plus urbaine, avec la possibilité de
                  faire une pause dans un café ou un espace tranquille.
                </li>
              </ul>
              <p className="mt-2">
                Ce ne sont que des idées : chacun choisit ses lieux de
                rencontre, son rythme et ses limites, en gardant le confort et
                la sécurité comme priorité.
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
                    href="/rencontres/Marseille"
                    className="underline-offset-2 hover:underline"
                  >
                    Rencontres à Marseille
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
                    href="/rencontres/Grenoble"
                    className="underline-offset-2 hover:underline"
                  >
                    Rencontres à Grenoble
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </section>

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
