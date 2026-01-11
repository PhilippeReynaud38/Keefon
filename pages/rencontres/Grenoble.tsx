/**
 * Fichier : pages/rencontres/grenoble.tsx
 * Module : Pages publiques / SEO — Rencontres sur la zone Grenoble / Métropole
 * MAJ : 2025-11-19 — Version basée sur lyon.tsx, adaptée à Grenoble + métropole
 *
 * Contexte :
 * - Page vitrine dédiée à la zone Grenoble / Métropole, en plus de la page générale France.
 * - Même design et même logique que les autres pages ville pour rester simple à maintenir.
 * - Pas de promesse de filtres avancés : on parle de “Grenoble et sa métropole” de façon large.
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
 * - Garder la cohérence visuelle avec les autres pages villes (bandeau jaune, carte rappel, structure).
 * - Ne PAS promettre de fonctionnalités qui n'existent pas encore.
 */

import Head from "next/head";
import Image from "next/image";
import Link from "next/link";

/* ===========================  SEO (mots-clés & libellés)  =========================== */
const SEO = {
  title: "Rencontres bienveillantes à Grenoble et dans la métropole | Keefon",
  description:
    "Keefon Grenoble est une page dédiée aux rencontres bienveillantes à Grenoble et dans sa métropole : échanges respectueux, profils protégés, sans swipe infini. Chat gratuit pendant la période d’ouverture.",
  canonical: "https://keefon.com/rencontres/grenoble",
  siteName: "Keefon",
  ogImage: "https://keefon.com/og/rencontres-grenoble.jpg",
  keywords: [
    // Intent + features (adapté à Grenoble / métropole)
    "rencontre Grenoble",
    "rencontres Grenoble",
    "site de rencontre Grenoble",
    "rencontres bienveillantes Grenoble",
    "rencontre locale Grenoble",
    "rencontre proche de chez moi Grenoble",
    "rencontre Isère",
    "rencontres en Isère",
    "rencontres métropole de Grenoble",
    "chat gratuit Grenoble",
    "chat rencontre gratuit Grenoble",
    "messagerie gratuite Grenoble",
    "profils certifiés",
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
    "dating Grenoble",
    "dating Isère",
    "rencontre adultes consentants",
    "slow dating",
    "dating bienveillant",

    // Villes / zone (SEO, pas promesse de filtres)
    "Grenoble",
    "Échirolles",
    "Saint-Martin-d'Hères",
    "Meylan",
    "Seyssins",
    "Sassenage",
    "Fontaine",
    "Eybens",
    "Gières",
    "La Tronche",

    // Combinaisons courtes utiles
    "rencontre sérieuse Grenoble",
    "rencontre après 30 ans Grenoble",
    "rencontre après 40 ans Grenoble",
    "rencontre après 50 ans Grenoble",
  ].join(", "),
  breadcrumb: [
    { name: "Accueil", url: "https://keefon.com/" },
    { name: "Rencontres", url: "https://keefon.com/rencontres" },
    { name: "Grenoble", url: "https://keefon.com/rencontres/grenoble" },
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
            Aucune carte bancaire demandée. Profites-en dès maintenant.
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

/* ===========================  Bandeau “exemples de profils” — Grenoble / Métropole  =========================== */
function ProfileTeaserBand() {
  /**
   * ⚠️ Fichiers à placer dans : /public/avatars_France/Grenoble/
   * IMPORTANT :
   *  - pas d’accents ni d’espaces dans les noms de fichiers
   *    (Pompon.png, Rio.png, Simon.png, Sonia.png)
   *  - adapter au besoin si tes fichiers ont un autre nom, mais garder ces chemins dans le code.
   */
  const profiles = [
    {
      pseudo: "Pompon",
      ageVille: "45 ans — Grenoble",
      badges: ["Free"],
      phrase:
        "Je suis souvent prise entre boulot, enfants et trajets. Ici je peux souffler un peu et discuter sans pression.",
      avatarSrc: "/avatars_France/Grenoble/Pompon.png",
      avatarAlt: "Profil fictif Pompon_38 (femme à Grenoble)",
      priority: true,
    },
    {
      pseudo: "Rio",
      ageVille: "27 ans Villard-De-Lans",
      badges: ["Essentiel"],
      phrase:
        "Je passe beaucoup de temps dehors, en rando ou en ski. Je voulais un espace simple pour rencontrer des gens qui comprennent ce rythme-là.",
      avatarSrc: "/avatars_France/Grenoble/Rio.png",
      avatarAlt: "Profil fictif Rio (homme à Grenoble et en montagne)",
      priority: true,
    },
    {
      pseudo: "Simon",
      ageVille: "36 ans Bernin",
      badges: ["Free"],
      phrase:
        "Après plusieurs années sur des applis très bruyantes, j’avais besoin de quelque chose de plus calme et lisible.",
      avatarSrc: "/avatars_France/Grenoble/Simon.png",
      avatarAlt: "Profil fictif Simon_Isere (homme à Grenoble)",
    },
    {
      pseudo: "Sonia",
      ageVille: "52 ans Uriage",
      badges: ["Essentiel"],
      phrase:
        "Je ne cherche pas à collectionner les matchs. Je préfère quelques échanges sincères avec des personnes respectueuses.",
      avatarSrc: "/avatars_France/Grenoble/Sonia.png",
      avatarAlt: "Profil fictif Sonia_Chartreuse (femme proche de Grenoble)",
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
          ce qu'il partage et reste protégé par les lois françaises.
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
export default function GrenobleRencontresPage() {
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
        // On réutilise pour l’instant le fond France ; tu pourras le remplacer par un visuel Grenoble plus tard.
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
              {/* KEEFON centré et coloré */}
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
                Rencontres bienveillantes à Grenoble et dans la métropole
              </h1>

              <p className="mt-3 text-center text-sm leading-relaxed text-slate-900 sm:text-base">
                Keefon s'adresse aux personnes qui vivent à Grenoble,
                Saint-Martin-d'Hères, Échirolles et dans les communes autour, et
                qui préfèrent des rencontres plus calmes, sans course aux matchs
                ni swipe infini.
              </p>

              <p className="mt-2 text-center text-xs leading-relaxed text-slate-800 sm:text-[13px]">
                Keefon est pensée et hébergée en France, avec une attention
                particulière portée à la protection de la vie privée (RGPD, CNIL,
                droits de l'individu).
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

        {/* Exemples de profils (Grenoble / Métropole) */}
        <ProfileTeaserBand />

        {/* Comment ça marche ? */}
        <section className="py-10">
          <div className="container mx-auto max-w-5xl px-4">
            <h2 className="text-xl font-semibold text-menuBtn sm:text-2xl">
              Comment ça marche autour de Grenoble ?
            </h2>
            <div className="mt-6 grid gap-6 md:grid-cols-3">
              <article className="rounded-2xl border border-sky-200 bg-white/35 px-4 py-4 text-slate-900 shadow-sm backdrop-blur-[1px]">
                <h3 className="mb-2 text-sm font-semibold text-chatOuter sm:text-base">
                  1. Tu crées ton profil en quelques minutes
                </h3>
                <p className="text-sm leading-relaxed">
                  Tu ajoutes une photo, ce que tu recherches, et quelques infos
                  simples pour te présenter. Pas besoin d'un roman pour
                  commencer.
                </p>
              </article>
              <article className="rounded-2xl border border-sky-200 bg-white/35 px-4 py-4 text-slate-900 shadow-sm backdrop-blur-[1px]">
                <h3 className="mb-2 text-sm font-semibold text-chatOuter sm:text-base">
                  2. Tu indiques Grenoble ou ta commune de la métropole
                </h3>
                <p className="text-sm leading-relaxed">
                  Centre-ville, quartiers proches des campus, vallée du
                  Grésivaudan ou communes voisines : tu situes ta zone sans
                  avoir besoin d'être ultra précis.
                </p>
              </article>
              <article className="rounded-2xl border border-sky-200 bg-white/35 px-4 py-4 text-slate-900 shadow-sm backdrop-blur-[1px]">
                <h3 className="mb-2 text-sm font-semibold text-chatOuter sm:text-base">
                  3. Tu échanges à ton rythme
                </h3>
                <p className="text-sm leading-relaxed">
                  Tu discutes via la messagerie, tu vois si le feeling passe,
                  puis tu décides si tu veux aller plus loin dans le réel
                  (balade, rando, verre en ville…).
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* Pourquoi Keefon est différent ? */}
        <section className="py-10">
          <div className="container mx-auto max-w-5xl px-4">
            <h2 className="text-xl font-semibold text-menuBtn sm:text-2xl">
              Pourquoi Keefon est différent pour Grenoble ?
            </h2>
            <div className="mt-6 max-w-3xl rounded-2xl border border-sky-200 bg-white/40 px-4 py-4 text-slate-900 shadow-sm backdrop-blur-[1px]">
              <p className="mb-2 text-sm font-semibold text-chatOuter sm:text-base">
                Pas de swipe mécanique
              </p>
              <p className="text-sm leading-relaxed">
                L'objectif n'est pas de te faire scroller toute la soirée entre
                deux trams ou deux montées en téléphérique. Tu ouvres quelques
                conversations claires et tu vois si ça colle, sans bruit autour.
              </p>

              <p className="mt-4 mb-2 text-sm font-semibold text-chatOuter sm:text-base">
                Des options pour avancer sans exploser ton budget
              </p>
              <p className="text-sm leading-relaxed">
                Les Échos et Keefon+ créent des opportunités supplémentaires
                pour les profils Free. L'abonnement Essentiel reste
                volontairement raisonnable, pour aller un peu plus loin si tu en
                as envie, sans pression financière.
              </p>
            </div>
          </div>
        </section>

        {/* Grenoble / Métropole ancrée dans le réel */}
        <section className="py-10">
          <div className="container mx-auto max-w-5xl px-4">
            <h2 className="text-xl font-semibold text-menuBtn sm:text-2xl">
              Rencontrer à Grenoble sans se perdre dans la foule
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-900 sm:text-base">
              Grenoble est entourée de montagnes et attire beaucoup de profils
              différents : étudiants, personnes en reconversion, passionnés de
              sport outdoor, familles. Keefon te permet de garder un cadre
              humain, où tu peux croiser des personnes qui partagent ton rythme
              de vie plutôt qu'une liste infinie de profils anonymes.
            </p>
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <article className="rounded-2xl border border-sky-200 bg-white/40 px-4 py-4 text-slate-900 shadow-sm backdrop-blur-[1px]">
                <h3 className="mb-2 text-sm font-semibold text-chatOuter sm:text-base">
                  Grenoble, sa métropole et les vallées autour
                </h3>
                <p className="text-sm leading-relaxed">
                  Que tu sois en centre-ville, sur les campus, vers le Vercors,
                  la Chartreuse ou le Grésivaudan, tu peux ouvrir des échanges
                  avec des personnes qui connaissent ton quotidien.
                </p>
              </article>

              <article className="rounded-2xl border border-sky-200 bg-white/40 px-4 py-4 text-slate-900 shadow-sm backdrop-blur-[1px]">
                <h3 className="mb-2 text-sm font-semibold text-chatOuter sm:text-base">
                  Et le reste de la France si tu te déplaces
                </h3>
                <p className="text-sm leading-relaxed">
                  Si tu bouges souvent pour le travail, les études ou les
                  vacances, tu peux aussi utiliser Keefon dans le reste du pays,
                  avec les mêmes principes de clarté, de respect et de
                  protection des données.
                </p>
              </article>
            </div>
          </div>
        </section>


        {/* Idées de sorties locales (Grenoble) */}
        <section className="py-6">
          <div className="mx-auto max-w-5xl px-4">
            <div className="rounded-2xl bg-white/30 px-4 py-3 text-[11px] text-slate-900 shadow-sm backdrop-blur-[2px]">
              <h2 className="mb-1 text-xs font-semibold text-chatOuter">
                Quelques idées de sorties autour de Grenoble
              </h2>
              <ul className="list-disc space-y-1 pl-4">
                <li>
                  Visite du chateaux de Vizille, le petit train de la Mure.
                </li>
                <li>
                  Téléphérique de la Bastille, vue sur la ville puis
                  petite marche sur les sentiers autour du fort.
                </li>
                <li>
                  Visite des cuves de Sassenage.
                </li>
                <li>
                  Sortie rando à la demi-journée dans le Vercors, la
                  Chartreuse ou Belledonne quand la météo s’y prête.
                </li>
                <li>
                  Verre ou concert dans un bar du centre.
                  Sortie canyonng l'été, le ski hiver.'
                </li>
              </ul>
              <p className="mt-2">
                Ce ne sont que des exemples : chacun choisit ses lieux de
                rencontre et reste libre de son rythme.
              </p>
            </div>
          </div>
        </section>


        {/* Liens internes SEO (France + autres villes) */}
        <section className="py-6">
          <div className="mx-auto max-w-5xl px-4">
            <div className="rounded-2xl bg-white/30 px-4 py-3 text-[11px] text-slate-800 shadow-sm backdrop-blur-[2px]">
              <p className="mb-2">
                Tu peux aussi explorer la vue d’ensemble&nbsp;:
                {" "}
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
                    href="/rencontres/Lyon"
                    className="underline-offset-2 hover:underline"
                  >
                    Rencontres à Lyon
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
                    href="/rencontres/Paris"
                    className="underline-offset-2 hover:underline"
                  >
                    Rencontres à Paris
                  </Link>
                </li>
                <li>
                  <Link
                    href="/rencontres/Nice"
                    className="underline-offset-2 hover:underline"
                  >
                    Rencontres à Nice
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Footer (mentions légales / CGU) */}
        <footer className="pt-4 pb-10">
          <div className="mx-auto max-w-5xl px-4">
            <p className="mt-2 text-[11px] text-center text-slate-900">
              <Link href="/cgu" className="hover:underline">
                Conditions Générales d’Utilisation
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
