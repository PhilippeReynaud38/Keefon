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
 */

import Head from "next/head";
import Link from "next/link";

/* ===========================  SEO (mots-clés & libellés)  =========================== */
const SEO = {
  title: "Rencontres bienveillantes Bordeaux & Gironde | Keefon",
  description:
    "Rencontres bienveillantes sur la zone Bordeaux & Gironde : Bordeaux, Mérignac, Pessac, rive droite, bassin d’Arcachon… Keefon propose une approche plus humaine, loin du swipe toxique.",
  canonical: "https://www.keefon.com/rencontres/bordeaux",
  siteName: "Keefon",
  robots: "index,follow",
  locale: "fr_FR",
  type: "website",
  image: "https://www.keefon.com/og/keefon-rencontres-bordeaux.png",
  keywords: [
    "rencontres Bordeaux",
    "rencontre Bordeaux",
    "rencontres Gironde",
    "rencontre Gironde",
    "rencontre sérieuse Bordeaux",
    "rencontre sérieuse Gironde",
    "rencontre bienveillante Bordeaux",
    "rencontre respectueuse Bordeaux",
    "application de rencontres Bordeaux",
    "slow dating Bordeaux",
    "rencontre locale Bordeaux",
    "rencontre par ville",
    "rencontre bassin d’Arcachon",
    "rencontre Médoc",
    "rencontre rive droite Bordeaux",
    "rencontre après 30 ans Bordeaux",
    "rencontre après 40 ans Bordeaux",
    "rencontre après 50 ans Bordeaux",
    "chat rencontre Bordeaux",
    "chat rencontre Gironde",
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
  ],
  breadcrumb: [
    { name: "Accueil", url: "https://www.keefon.com/" },
    { name: "Rencontres", url: "https://www.keefon.com/rencontres" },
    { name: "Bordeaux & Gironde", url: "https://www.keefon.com/rencontres/bordeaux" },
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
      aria-label="Offre de lancement : Keefon gratuit jusqu’à fin 2026 pour les 300 premiers inscrits"
      className="fixed inset-x-0 top-0 z-[1000] w-full"
      style={{
        background: COLORS.bannerGrad,
        boxShadow: "0 8px 28px rgba(0,0,0,0.22)",
      }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:py-5">
        <p className="m-0 flex-1 text-left font-extrabold leading-snug text-slate-900">
          <span className="block text-[15px] sm:text-[18px]">
            Offre de lancement :{" "}
            <span className="underline decoration-2 underline-offset-2">
              Keefon 100% gratuit jusqu’à fin 2026
            </span>{" "}
            pour les 300 premiers inscrits.
          </span>
          <span className="mt-0.5 block text-[13px] sm:text-[15px] font-semibold opacity-90">
            Aucune carte bancaire demandée. Si tu fais partie des 300 premiers,
            ton accès reste gratuit jusqu’au 31/12/2026.
          </span>
        </p>

        <a
          href="/signup"
          aria-label="Créer un compte et profiter de l’offre gratuite jusqu’à fin 2026 pour les 300 premiers inscrits"
          title="Créer un compte gratuitement (offre 300 premiers inscrits)"
          className="shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold text-slate-900 shadow-md transition hover:translate-y-[1px] hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-slate-900/30 sm:px-5 sm:py-2.5 sm:text-[14px]"
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
                Offre lancement : Keefon 100% gratuit jusqu’à fin 2026 pour les
                300 premiers inscrits.
              </p>
              <p className="m-0 mt-1 text-[13px] sm:text-[14px]">
                Tu peux créer ton profil, échanger librement et tester Keefon
                sans carte bancaire. Si tu fais partie des 300 premiers
                inscrits, ton accès reste gratuit jusqu’au 31/12/2026.
              </p>
            </div>
            <a
              href="/signup"
              aria-label="Profiter de l’offre Keefon gratuit jusqu’à fin 2026 pour les 300 premiers inscrits"
              title="Profiter de l’offre gratuite (300 premiers inscrits)"
              className="rounded-full px-4 py-2 text-[13px] font-semibold text-slate-900 shadow-md transition hover:translate-y-[1px] hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-slate-900/30 sm:px-5 sm:py-2.5 sm:text-[14px]"
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
   *  - pas d’accents ni d’espaces
   *  - format : .png
   *  - poids raisonnable (< 300ko idéalement)
   */
  const profiles = [
    {
      pseudo: "Claire_Bdx",
      ageVille: "30 ans — Bordeaux centre",
      badges: ["Free", "Écho reçu"],
      phrase:
        "Marre des applis où tout va trop vite. Ici, j’ai l’impression de rencontrer des gens qui prennent le temps de parler.",
      avatarSrc: "/avatars_France/Bordeaux/claire-bdx.png",
      avatarAlt: "Profil fictif Claire_Bdx",
      priority: true,
    },
    {
      pseudo: "Mathieu_Ocean",
      ageVille: "36 ans — Pessac",
      badges: ["Free"],
      phrase:
        "Je suis souvent entre Bordeaux et le bassin. Keefon me permet de rencontrer des personnes qui ont le même rythme de vie.",
      avatarSrc: "/avatars_France/Bordeaux/mathieu-ocean.png",
      avatarAlt: "Profil fictif Mathieu_Ocean",
      priority: false,
    },
    {
      pseudo: "Anais_RiveDroite",
      ageVille: "33 ans — rive droite",
      badges: ["Free"],
      phrase:
        "J’avais besoin d’un cadre plus sain, loin du swipe compulsif. Keefon me correspond beaucoup plus.",
      avatarSrc: "/avatars_France/Bordeaux/anais-rivedroite.png",
      avatarAlt: "Profil fictif Anais_RiveDroite",
      priority: false,
    },
    {
      pseudo: "Thomas_Medoc",
      ageVille: "39 ans — Médoc",
      badges: ["Free"],
      phrase:
        "Je vis un peu à l’écart, et ça complique les rencontres. Ici, je peux discuter tranquillement, sans pression.",
      avatarSrc: "/avatars_France/Bordeaux/thomas-medoc.png",
      avatarAlt: "Profil fictif Thomas_Medoc",
      priority: false,
    },
  ];

  return (
    <section className="border-y border-slate-100 bg-slate-50/60 py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4">
        <div className="flex flex-col gap-1">
          <p className="text-[13px] font-semibold uppercase tracking-wide text-slate-500">
            Exemples de profils Keefon (fictifs)
          </p>
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
            Une communauté bienveillante sur la zone Bordeaux & Gironde.
          </h2>
          <p className="max-w-2xl text-[14px] leading-relaxed text-slate-600">
            Voici quelques exemples de profils fictifs, pour te donner une idée
            de l’ambiance Keefon sur Bordeaux, sa métropole et la Gironde.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {profiles.map((profile) => (
            <article
              key={profile.pseudo}
              className="flex flex-col rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm"
            >
              <div className="mb-3 flex items-center gap-3">
                <div className="relative h-12 w-12 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                  <img
                    src={profile.avatarSrc}
                    alt={profile.avatarAlt}
                    loading={profile.priority ? "eager" : "lazy"}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <p className="m-0 text-[14px] font-bold text-slate-900">
                    {profile.pseudo}
                  </p>
                  <p className="m-0 text-[12px] text-slate-600">
                    {profile.ageVille}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {profile.badges.map((badge) => (
                      <span
                        key={badge}
                        className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700"
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <p className="mt-1 text-[13px] leading-relaxed text-slate-700">
                {profile.phrase}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ===========================  Contenu principal — Bordeaux & Gironde  =========================== */
export default function RencontresBordeauxPage() {
  return (
    <>
      <Head>
        <title>{SEO.title}</title>
        <meta name="description" content={SEO.description} />
        <link rel="canonical" href={SEO.canonical} />
        <meta property="og:site_name" content={SEO.siteName} />
        <meta property="og:title" content={SEO.title} />
        <meta property="og:description" content={SEO.description} />
        <meta property="og:url" content={SEO.canonical} />
        <meta property="og:type" content={SEO.type} />
        <meta property="og:image" content={SEO.image} />
        <meta property="og:locale" content={SEO.locale} />
        <meta name="robots" content={SEO.robots} />
        <meta name="keywords" content={SEO.keywords.join(", ")} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebPage",
              name: SEO.title,
              description: SEO.description,
              url: SEO.canonical,
              inLanguage: SEO.locale,
              breadcrumb: {
                "@type": "BreadcrumbList",
                itemListElement: SEO.breadcrumb.map((item, index) => ({
                  "@type": "ListItem",
                  position: index + 1,
                  name: item.name,
                  item: item.url,
                })),
              },
            }),
          }}
        />
      </Head>

      <FreeTopBar />
      <main className="min-h-screen bg-slate-50/60 text-slate-900">
        <FreeTopBarSpacer />

        {/* Hero — Bordeaux & Gironde */}
        <section className="border-b border-slate-100 bg-white/90">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:py-14 lg:flex-row lg:items-center">
            <div className="flex-1 space-y-4">
              <p className="text-[13px] font-semibold uppercase tracking-wide text-emerald-600">
                Rencontres bienveillantes · Bordeaux & Gironde 🍷🌊
              </p>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                Rencontres sérieuses et bienveillantes sur Bordeaux & Gironde.
              </h1>
              <p className="max-w-xl text-[15px] leading-relaxed text-slate-700">
                Keefon propose une approche plus humaine des rencontres, pensée
                pour les habitants de Bordeaux, Mérignac, Pessac, la rive
                droite, le Médoc, le bassin d’Arcachon et plus largement la
                Gironde. Loin du swipe compulsif, l’objectif est de remettre du
                sens dans les échanges.
              </p>

              <ul className="space-y-2 text-[14px] text-slate-700">
                <li className="flex gap-2">
                  <span className="mt-[3px] inline-block h-[6px] w-[6px] rounded-full bg-emerald-500" />
                  <span>
                    <strong>Zone Bordeaux & Gironde</strong> : métropole,
                    villages, littoral, arrière-pays… Chacun sa place.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-[3px] inline-block h-[6px] w-[6px] rounded-full bg-emerald-500" />
                  <span>
                    <strong>Ambiance bienveillante</strong> : une charte de
                    respect claire, des limites posées dès le départ.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-[3px] inline-block h-[6px] w-[6px] rounded-full bg-emerald-500" />
                  <span>
                    <strong>Pas de course aux matchs</strong> : on privilégie
                    des échanges de qualité plutôt que des centaines de profils.
                  </span>
                </li>
              </ul>

              <div className="flex flex-wrap gap-3 pt-2">
                <a
                  href="/signup"
                  className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-5 py-2.5 text-[14px] font-semibold text-white shadow-md transition hover:bg-emerald-600 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                >
                  Créer mon profil gratuit
                </a>
                <Link
                  href="/fonctionnement"
                  className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white/70 px-5 py-2.5 text-[14px] font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300/60"
                >
                  Comprendre comment ça marche
                </Link>
              </div>
            </div>

            <div className="flex-1">
              <div className="relative mx-auto max-w-md rounded-3xl border border-slate-200 bg-slate-900 p-4 text-slate-50 shadow-xl">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div>
                    <p className="m-0 text-[13px] font-semibold uppercase tracking-wide text-emerald-300">
                      Bordeaux · Exemple de discussion
                    </p>
                    <p className="m-0 text-[12px] text-slate-200/80">
                      Illustration d’une conversation entre deux personnes de
                      la région.
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-[11px] font-semibold text-emerald-200">
                    Bêta bienveillante
                  </span>
                </div>

                <div className="space-y-2 rounded-2xl bg-slate-800/80 p-3">
                  <div className="flex gap-2">
                    <div className="mt-1 h-7 w-7 rounded-full bg-slate-600" />
                    <div className="space-y-1">
                      <div className="inline-block max-w-[85%] rounded-2xl bg-slate-700 px-3 py-2 text-[12px]">
                        Salut 🙂 Moi c’est{" "}
                        <span className="font-semibold">Claire, 30 ans</span>,
                        je vis à Bordeaux centre. J’adore flâner aux Chartrons
                        et aller au bassin dès que je peux.
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <div className="space-y-1">
                      <div className="inline-block max-w-[85%] rounded-2xl bg-emerald-500 px-3 py-2 text-[12px] text-slate-900">
                        Enchanté Claire, moi c’est Julien, je suis à Mérignac.
                        Je passe aussi beaucoup de temps sur la côte 🌊
                      </div>
                    </div>
                    <div className="mt-1 h-7 w-7 rounded-full bg-slate-600" />
                  </div>

                  <div className="flex gap-2">
                    <div className="mt-1 h-7 w-7 rounded-full bg-slate-600" />
                    <div className="space-y-1">
                      <div className="inline-block max-w-[85%] rounded-2xl bg-slate-700 px-3 py-2 text-[12px]">
                        Ça te dirait qu’on discute autour d’un café quartier
                        Saint-Michel un de ces jours ?
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <div className="h-9 flex-1 rounded-full bg-slate-800/80" />
                  <button className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/90 text-[18px] font-bold text-slate-900 shadow-md">
                    ➤
                  </button>
                </div>

                <p className="mt-3 text-[11px] text-slate-300/80">
                  Interface illustrée à titre d’exemple. Sur Keefon, l’objectif
                  est de faciliter des échanges sincères, respectueux, ancrés
                  dans la vraie vie bordelaise.
                </p>
              </div>
            </div>
          </div>
        </section>

        <FreeReminderCard />

        {/* Section “Pourquoi une page dédiée à Bordeaux & la Gironde ?” */}
        <section className="border-b border-slate-100 bg-slate-50/80">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:py-14 lg:flex-row">
            <div className="flex-1 space-y-4">
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                Pourquoi une page dédiée à Bordeaux & la Gironde ?
              </h2>
              <p className="max-w-xl text-[15px] leading-relaxed text-slate-700">
                La zone Bordeaux & Gironde a une vraie identité : vie urbaine,
                vignobles, littoral, forêts… Les modes de vie sont variés, et
                les rencontres ne se vivent pas de la même manière qu’ailleurs.
                Keefon veut en tenir compte, tout en gardant un cadre commun à
                toute la France.
              </p>

              <ul className="space-y-2 text-[14px] text-slate-700">
                <li className="flex gap-2">
                  <span className="mt-[3px] inline-block h-[6px] w-[6px] rounded-full bg-slate-400" />
                  <span>
                    <strong>Une vie à cheval entre ville et océan</strong> :
                    beaucoup de bordelais jonglent entre la métropole, le
                    bassin, le Médoc… Keefon s’adapte à ces réalités.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-[3px] inline-block h-[6px] w-[6px] rounded-full bg-slate-400" />
                  <span>
                    <strong>Des rencontres à ton rythme</strong> : que tu sois
                    très actif(ve) en ville ou plutôt tourné(e) vers la nature,
                    tu peux trouver des personnes qui te ressemblent.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-[3px] inline-block h-[6px] w-[6px] rounded-full bg-slate-400" />
                  <span>
                    <strong>Un cadre plus serein</strong> : l’idée est de
                    sortir de la logique “supermarché de profils” qui épuise
                    beaucoup de gens.
                  </span>
                </li>
              </ul>
            </div>

            <div className="flex-1">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-[16px] font-extrabold text-slate-900">
                  Exemples de situations concrètes
                </h3>
                <ul className="mt-3 space-y-2 text-[13px] text-slate-700">
                  <li>
                    • Tu vis à Bordeaux mais passes tes week-ends au Cap Ferret
                    ou sur le bassin.
                  </li>
                  <li>
                    • Tu habites en rive droite ou dans le Médoc et tu as
                    l’impression que “tout se passe” ailleurs.
                  </li>
                  <li>
                    • Tu es installé(e) à Pessac, Mérignac ou Talence, et tu
                    aimerais rencontrer quelqu’un qui partage ton rythme de vie.
                  </li>
                </ul>
                <p className="mt-3 text-[13px] text-slate-600">
                  Keefon ne promet pas de magie, mais un cadre plus posé pour
                  faire des rencontres, en respectant qui tu es et l’endroit où
                  tu vis.
                </p>
              </div>
            </div>
          </div>
        </section>

        <ProfileTeaserBand />

        {/* Section “Comment ça marche ?” */}
        <section className="border-b border-slate-100 bg-white/90">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:py-14 lg:flex-row">
            <div className="flex-1 space-y-4">
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                Comment fonctionne Keefon sur Bordeaux & la Gironde ?
              </h2>
              <p className="max-w-xl text-[15px] leading-relaxed text-slate-700">
                Le fonctionnement reste le même que pour le reste de la France,
                mais avec des suggestions adaptées à ta zone. L’idée est de
                mettre en avant des profils qui ont du sens pour toi, que tu
                sois plutôt urbain(e) ou attiré(e) par le littoral.
              </p>

              <ol className="space-y-2 text-[14px] text-slate-700">
                <li>
                  <strong>1. Tu crées ton profil</strong> : quelques questions
                  sur toi, sur ce que tu recherches et ton environnement de vie.
                </li>
                <li>
                  <strong>2. Tu vois des profils de ta zone</strong> : Bordeaux
                  métropole, Gironde, littoral… en fonction de ce que tu
                  indiques.
                </li>
                <li>
                  <strong>3. Tu échanges dans une messagerie claire</strong> :
                  pas de surcharges ni de fonctionnalités inutiles, juste un
                  espace pour parler.
                </li>
                <li>
                  <strong>4. Tu choisis le rythme</strong> : rien ne t’oblige à
                  répondre dans la minute. Keefon encourage un tempo plus humain.
                </li>
              </ol>
            </div>

            <div className="flex-1">
              <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-900 p-5 text-slate-50 shadow-md">
                <h3 className="text-[16px] font-extrabold">
                  Quelques principes importants
                </h3>
                <ul className="mt-2 space-y-2 text-[13px] text-slate-100/90">
                  <li>
                    • <strong>Bienveillance</strong> : la région est variée,
                    les profils aussi. Le respect est non négociable.
                  </li>
                  <li>
                    • <strong>Authenticité</strong> : pas besoin de surjouer,
                    l’idée est d’être soi-même.
                  </li>
                  <li>
                    • <strong>Protection des données</strong> : Keefon reste
                    dans un cadre RGPD, avec hébergement en Europe.
                  </li>
                  <li>
                    • <strong>Équilibre</strong> : on évite de créer un
                    environnement addictif ; l’appli doit rester un outil, pas
                    une dépendance.
                  </li>
                </ul>
                <p className="mt-3 text-[12px] text-slate-200/80">
                  Keefon est en construction, avec l’ambition d’offrir un
                  espace plus sain aux personnes qui en ont assez des
                  applications classiques.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section “Rejoindre Keefon depuis Bordeaux & la Gironde” */}
        <section className="bg-white/90">
          <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:py-14">
            <div className="grid gap-8 lg:grid-cols-[1.1fr,0.9fr]">
              <div className="space-y-4">
                <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                  Envie de rejoindre Keefon depuis Bordeaux & la Gironde ?
                </h2>
                <p className="max-w-xl text-[15px] leading-relaxed text-slate-700">
                  Si tu te retrouves dans cette vision plus sereine des
                  rencontres, tu peux créer ton profil dès maintenant. Keefon
                  se construit avec les premiers membres, dont une partie
                  vient déjà de Bordeaux et de la région.
                </p>

                <ul className="space-y-2 text-[14px] text-slate-700">
                  <li>
                    • Plateforme française, pensée pour des rencontres plus
                    saines.
                  </li>
                  <li>
                    • Approche locale, avec une attention particulière aux
                    réalités de la zone Bordeaux & Gironde.
                  </li>
                  <li>
                    • Ambiance bienveillante, loin des comportements toxiques.
                  </li>
                </ul>

                <div className="flex flex-wrap gap-3 pt-1">
                  <a
                    href="/signup"
                    className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-5 py-2.5 text-[14px] font-semibold text-white shadow-md transition hover:bg-emerald-600 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  >
                    Créer mon profil gratuit
                  </a>
                  <Link
                    href="/fonctionnement"
                    className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white/70 px-5 py-2.5 text-[14px] font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300/60"
                  >
                    En savoir plus sur Keefon
                  </Link>
                </div>
              </div>

              <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-900 p-5 text-slate-50 shadow-md">
                <h3 className="text-[16px] font-extrabold">
                  Quelques engagements importants
                </h3>
                <ul className="mt-2 space-y-2 text-[13px] text-slate-100/90">
                  <li>• Lutte contre le harcèlement et les comportements toxiques.</li>
                  <li>• Respect de ta vie privée et de tes données.</li>
                  <li>• Possibilité de signaler facilement un comportement inapproprié.</li>
                  <li>• Construction progressive avec les retours de la communauté.</li>
                </ul>
                <p className="mt-3 text-[12px] text-slate-200/80">
                  Keefon n’a pas vocation à être une usine à profils, mais un
                  espace plus humain pour construire des relations durables.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer simplifié */}
        <footer className="border-t border-slate-200 bg-slate-50/90">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-4 py-4 text-[12px] text-slate-600 sm:flex-row">
            <p className="m-0">
              © {new Date().getFullYear()} Keefon — Rencontres bienveillantes
              sur Bordeaux & Gironde.
            </p>
            <p className="m-0 flex flex-wrap items-center gap-2">
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
