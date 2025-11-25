/**
 * Fichier : pages/rencontres/bordeaux.tsx
 * Module : Pages publiques / SEO — Rencontres sur la zone Bordeaux et alentours
 * MAJ : 2025-11-18 — Version basée sur marseille.tsx, adaptée à Bordeaux (métropole et océan).
 *
 * Contexte :
 * - Page vitrine dédiée à la zone Bordeaux et alentours (Bordeaux, Mérignac, Pessac, rive droite, océan…).
 * - Même design et même logique que pages/rencontres/france.tsx et marseille.tsx pour rester simple à maintenir.
 * - Pas de promesse de filtres avancés : on parle de “zone Bordeaux / Gironde” de façon large.
 *
 * Dépendances :
 * - next/head, next/image
 * - Tailwind pour les classes utilitaires
 *
 * Données lues :
 * - Aucune (page purement statique, pas de fetch).
 *
 * Effets de bord :
 * - Aucun (uniquement rendu React côté front).
 *
 * Invariants :
 * - Garder la cohérence visuelle avec france.tsx / marseille.tsx (bandeau jaune, carte rappel, structure des sections).
 * - Ne PAS promettre de fonctionnalités de recherche ultra-précises qui n'existent pas encore.
 */

import Head from "next/head";
import Image from "next/image";
import Link from "next/link";

/* ===========================  SEO (mots-clés & libellés)  =========================== */
const SEO = {
  title: "Rencontres bienveillantes à Bordeaux et autour | Keefon",
  description:
    "Keefon Bordeaux est une page dédiée aux rencontres bienveillantes à Bordeaux et dans les villes autour : échanges vrais, respectueux, sans swipe toxique. Chat gratuit pendant la période d’ouverture.",
  canonical: "https://keefon.com/rencontres/Bordeaux",
  siteName: "Keefon",
  ogImage: "https://keefon.com/og/rencontres-bordeaux.jpg",
  keywords: [
    // Intent + features
    "rencontre Bordeaux",
    "rencontres Bordeaux",
    "site de rencontre Bordeaux",
    "rencontres bienveillantes Bordeaux",
    "rencontre locale Bordeaux",
    "rencontre proche de chez moi Bordeaux",
    "rencontre Gironde",
    "rencontres Nouvelle-Aquitaine",
    "chat gratuit Bordeaux",
    "chat rencontre gratuit Bordeaux",
    "messagerie gratuite Bordeaux",
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
    "dating Bordeaux",
    "dating Gironde",
    "rencontre adultes consentants",
    "slow dating",
    "dating bienveillant",

    // Villes / zone (SEO, pas promesse de filtres)
    "Bordeaux",
    "Mérignac",
    "Pessac",
    "Talence",
    "Bègles",
    "Cenon",
    "Lormont",
    "Bruges",
    "Le Bouscat",
    "Villenave-d'Ornon",

    // Combinaisons courtes utiles
    "rencontre sérieuse Bordeaux",
    "rencontre après 30 ans Bordeaux",
    "rencontre après 40 ans Bordeaux",
    "rencontre après 50 ans Bordeaux",
  ].join(", "),
  breadcrumb: [
    { name: "Accueil", url: "https://keefon.com/" },
    { name: "Rencontres", url: "https://keefon.com/rencontres" },
    { name: "Bordeaux", url: "https://keefon.com/rencontres/bordeaux" },
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

/* ===========================  Bandeau “exemples de profils” — Bordeaux  =========================== */
function ProfileTeaserBand() {
  /**
   * ⚠️ Fichiers à placer dans : /public/avatars_France/Bordeaux/
   * IMPORTANT :
   *  - pas d’accents ni d’espaces dans les noms de fichiers (Simon.png, Monique.png, Nath.png, Riton.png)
   *  - tu peux renommer les images côté disque, le chemin doit suivre ces valeurs.
   */
  const profiles = [
    {
      pseudo: "Simon",
      ageVille: "48 ans — Bordeaux centre",
      badges: ["Free"],
      phrase:
        "Je travaille en centre-ville et je n’ai plus envie de passer mes soirées à swiper. Ici je peux discuter plus calmement.",
      avatarSrc: "/avatars_France/Bordeaux/Simon.png",
      avatarAlt: "Profil fictif Simon_Quais (homme à Bordeaux centre)",
      priority: true,
    },
    {
      pseudo: "Monique",
      ageVille: "56 ans — sud métropole",
      badges: ["Essentiel"],
      phrase:
        "Après quelques années seule, j’avais envie de retrouver un espace bienveillant pour échanger sans me sentir pressée.",
      avatarSrc: "/avatars_France/Bordeaux/Monique.png",
      avatarAlt: "Profil fictif Monique_Gradignan (femme à Bordeaux métropole)",
      priority: true,
    },
    {
      pseudo: "Nath",
      ageVille: "26 ans — Chartrons",
      badges: ["Free"],
      phrase:
        "Entre les cours, le boulot et les sorties sur les quais, je préfère quelques vraies conversations que des centaines de matchs.",
      avatarSrc: "/avatars_France/Bordeaux/Nath.png",
      avatarAlt: "Profil fictif Nath_Bdx (jeune femme à Bordeaux)",
    },
    {
      pseudo: "Riton",
      ageVille: "29 ans — rive droite",
      badges: ["Essentiel"],
      phrase:
        "Je voulais une appli plus simple, où tu peux expliquer ce que tu cherches sans te prendre une pluie de messages lourds.",
      avatarSrc: "/avatars_France/Bordeaux/Riton.png",
      avatarAlt: "Profil fictif Riton_RiveDroite (jeune homme à Bordeaux)",
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
export default function BordeauxRencontresPage() {
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
         *  - tu pourras remplacer plus tard par un visuel type “bg-Bordeaux-ext.png”
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
                Rencontres bienveillantes à Bordeaux et autour
              </h1>

              <p className="mt-3 text-center text-sm leading-relaxed text-slate-900 sm:text-base">
                Une plateforme française pour celles et ceux qui vivent à
                Bordeaux et dans les villes autour (Mérignac, Pessac, rive
                droite, bassin d’Arcachon…) et qui veulent des rencontres plus
                humaines, sans swipe toxique.
              </p>

              <p className="mt-2 text-center text-xs leading-relaxed text-slate-800 sm:text-[13px]">
                Keefon est créée et hébergée en France, dans le cadre des lois
                françaises de protection de la vie privée (RGPD, CNIL, droits
                de l'individu).
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

        {/* Exemples de profils (Bordeaux) */}
        <ProfileTeaserBand />

        {/* Comment ça marche ? */}
        <section className="py-10">
          <div className="container mx-auto max-w-5xl px-4">
            <h2 className="text-xl font-semibold text-menuBtn sm:text-2xl">
              Comment ça marche à Bordeaux&nbsp;?
            </h2>
            <div className="mt-6 grid gap-6 md:grid-cols-3">
              <article className="rounded-2xl border border-sky-200 bg-white/35 px-4 py-4 text-slate-900 shadow-sm backdrop-blur-[1px]">
                <h3 className="mb-2 text-sm font-semibold text-chatOuter sm:text-base">
                  1. Tu crées ton profil
                </h3>
                <h3 className="mb-2 text-sm font-semibold text-chatOuter sm:text-base">
                  2. Tu indiques que tu es sur la zone Bordeaux / Gironde
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
              Pourquoi Keefon est différent à Bordeaux&nbsp;?
            </h2>
            <div className="mt-6 max-w-3xl rounded-2xl border border-sky-200 bg-white/40 px-4 py-4 text-slate-900 shadow-sm backdrop-blur-[1px]">
              <p className="mb-2 text-sm font-semibold text-chatOuter sm:text-base">
                Pas de swipe toxique
              </p>
              <p className="text-sm leading-relaxed">
                Pas de défilement infini pour te garder accroché à l’écran.
                Le but, c'est la rencontre, pas l’addiction. Les comportements
                toxiques sont hors-jeu et peuvent être signalés facilement.
              </p>

              <p className="mt-4 mb-2 text-sm font-semibold text-chatOuter sm:text-base">
                Plus d’opportunités pour tous
              </p>
              <p className="text-sm leading-relaxed">
                Les Échos et Keefon+ créent des ouvertures supplémentaires pour
                les profils Free. L’abonnement Essentiel reste volontairement
                abordable pour aller plus loin sans exploser ton budget.
              </p>
            </div>
          </div>
        </section>

        {/* Bordeaux ancrée dans le réel */}
        <section className="py-10">
          <div className="container mx-auto max-w-5xl px-4">
            <h2 className="text-xl font-semibold text-menuBtn sm:text-2xl">
              Rencontrer à Bordeaux, sans se perdre dans la masse
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-900 sm:text-base">
              Une grande ville, beaucoup de monde, beaucoup de mouvements entre
              centre, rive droite et communes autour. Keefon te permet d’ouvrir
              des portes sans te perdre dans une marée de profils anonymes.
            </p>
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <article className="rounded-2xl border border-sky-200 bg-white/40 px-4 py-4 text-slate-900 shadow-sm backdrop-blur-[1px]">
                <h3 className="mb-2 text-sm font-semibold text-chatOuter sm:text-base">
                  Quais, quartiers, métropole…
                </h3>
                <p className="text-sm leading-relaxed">
                  Que tu vives proche de la place de la Bourse, des Chartrons,
                  de la gare Saint-Jean ou d’une commune voisine, tu peux
                  croiser des personnes qui partagent la même ville et le même
                  quotidien que toi.
                </p>
              </article>

              <article className="rounded-2xl border border-sky-200 bg-white/40 px-4 py-4 text-slate-900 shadow-sm backdrop-blur-[1px]">
                <h3 className="mb-2 text-sm font-semibold text-chatOuter sm:text-base">
                  Et le reste de la côte si tu bouges
                </h3>
                <p className="text-sm leading-relaxed">
                  Si tu te déplaces souvent vers le bassin d’Arcachon, le
                  Médoc ou d’autres villes de Nouvelle-Aquitaine, tu peux aussi
                  utiliser Keefon dans ces zones, avec les mêmes principes de
                  respect et de clarté.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* Idées de sorties locales (Bordeaux & Gironde) */}
        <section className="py-6">
          <div className="mx-auto max-w-5xl px-4">
            <div className="rounded-2xl bg-white/30 px-4 py-3 text-[11px] text-slate-900 shadow-sm backdrop-blur-[2px]">
              <h2 className="mb-1 text-xs font-semibold text-chatOuter">
                Quelques idées de sorties autour de Bordeaux
              </h2>
              <ul className="list-disc space-y-1 pl-4">
                <li>
                  Balade en fin de journée sur les quais de la Garonne, avec un
                  détour par le miroir d’eau et la place de la Bourse.
                </li>
                <li>
                  Verre ou pique-nique au{" "}
                  <span className="whitespace-nowrap">Jardin Public</span> pour
                  discuter au calme en restant en cœur de ville.
                </li>
                <li>
                  Soirée dans un bar à vin ou une cave du centre, pour
                  découvrir quelques bouteilles de la région sans obligation de
                  “grand rendez-vous”.
                </li>
                <li>
                  Promenade dans les rues piétonnes autour de la rue
                  Sainte-Catherine ou des Chartrons, en prenant le temps de
                  s’arrêter dans un café ou une petite adresse que vous aimez
                  bien.
                </li>
                <li>
                  Si vous aimez bouger un peu, journée ou demi-journée au
                  bassin d’Arcachon ou sur la côte, en gardant un point de
                  rencontre simple et public pour que chacun se sente à l’aise.
                </li>
              </ul>
              <p className="mt-2">
                Ce ne sont que des exemples : chacun choisit ses lieux de
                rencontre et reste libre de son rythme et de ses limites.
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
                    href="/rencontres/Nantes"
                    className="underline-offset-2 hover:underline"
                  >
                    Rencontres à Nantes
                  </Link>
                </li>
                <li>
                  <Link
                    href="/rencontres/Toulouse"
                    className="underline-offset-2 hover:underline"
                  >
                    Rencontres à Toulouse
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
                    href="/rencontres/Paris"
                    className="underline-offset-2 hover:underline"
                  >
                    Rencontres à Paris
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
