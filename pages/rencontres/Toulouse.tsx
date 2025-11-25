/**
 * Fichier : pages/rencontres/Toulouse.tsx
 * Module : Pages publiques / SEO — Rencontres sur la zone Toulouse / aire toulousaine
 * MAJ : 2025-11-19 — Version basée sur france.tsx / paris.tsx / lille.tsx, adaptée à Toulouse.
 *
 * Contexte :
 * - Page vitrine dédiée à la zone Toulouse et à l’aire toulousaine (“ville rose” + proches communes).
 * - Même design et logique que les autres pages de zone pour rester simple à maintenir.
 * - Pas de promesse de filtres ultra précis : on parle de “zone Toulouse / aire toulousaine” de façon large.
 *
 * Dépendances :
 * - next/head, next/image, next/link
 * - Tailwind CSS pour les classes utilitaires.
 *
 * Données lues :
 * - Aucune (page purement statique).
 *
 * Effets de bord :
 * - Aucun (rendu React uniquement).
 *
 * Invariants :
 * - Rester cohérent avec france.tsx / paris.tsx / lille.tsx (bandeau jaune, rappel, structure de sections).
 * - Ne pas sur-promettre de fonctionnalités de recherche qui n’existent pas encore.
 */

import Head from "next/head";
import Image from "next/image";
import Link from "next/link";

/* ===========================  SEO (Toulouse / ville rose)  =========================== */
const SEO = {
  title: "Rencontres bienveillantes à Toulouse et dans l’aire toulousaine | Keefon",
  description:
    "Keefon Toulouse rassemble celles et ceux qui vivent dans la ville rose et autour, et qui cherchent des rencontres plus humaines, sans swipe infini ni algorithmes obscurs. Pendant la période d’ouverture, le chat reste gratuit.",
  canonical: "https://keefon.com/rencontres/Toulouse",
  siteName: "Keefon",
  ogImage: "https://keefon.com/og/rencontres-toulouse.jpg",
  keywords: [
    // Intent + fonctionnalités (variante par rapport aux autres pages)
    "rencontre Toulouse",
    "rencontres Toulouse",
    "site de rencontre Toulouse",
    "rencontres aire toulousaine",
    "rencontres Haute-Garonne",
    "rencontre locale Toulouse",
    "rencontre proche de chez moi Toulouse",
    "chat rencontre Toulouse",
    "chat gratuit Toulouse",
    "rencontres bienveillantes Toulouse",
    "rencontres respectueuses",
    "profil certifié",
    "profils certifiés",
    "vérification de profil",
    "anti harcèlement",
    "sans swipe infini",
    "sans algorithme opaque",
    "plateforme RGPD",
    "respect CNIL",
    "protection des données",
    "slow dating",
    "rencontre après 30 ans Toulouse",
    "rencontre après 40 ans Toulouse",
    "rencontre après 50 ans Toulouse",

    // Villes / zone
    "Toulouse",
    "Blagnac",
    "Colomiers",
    "Ramonville",
    "Balma",
    "Cugnaux",
    "Tournefeuille",
    "L’Union",
    "Muret",
  ].join(", "),
  breadcrumb: [
    { name: "Accueil", url: "https://keefon.com/" },
    { name: "Rencontres", url: "https://keefon.com/rencontres" },
    {
      name: "Toulouse / aire toulousaine",
      url: "https://keefon.com/rencontres/Toulouse",
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

/* ===========================  Exemples de profils — Toulouse  =========================== */
function ProfileTeaserBand() {
  /**
   * ⚠️ Fichiers à placer dans : /public/avatars_France/Toulouse/
   * IMPORTANT :
   *  - pas d’accents ni d’espaces dans les noms de fichiers
   *    (Fred.png, Brigitte.png, Paul.png, Miloue.png)
   *  - rester cohérent entre ces chemins et les fichiers réels.
   */
  const profiles = [
    {
      pseudo: "Fred_31",
      ageVille: "30 ans — Toulouse",
      badges: ["Free"],
      phrase:
        "Je partage mon temps entre le boulot et les sorties dans la ville rose. Je préfère quelques échanges de qualité plutôt que des matchs à la chaîne.",
      avatarSrc: "/avatars_France/Toulouse/Fred.png",
      avatarAlt: "Profil fictif Fred_31 (homme à Toulouse, rue en briques roses)",
      priority: true,
    },
    {
      pseudo: "Brigitte",
      ageVille: "47 ans — Toulouse",
      badges: ["Essentiel"],
      phrase:
        "Je n’ai pas envie d’une appli qui me pousse à rester scotchée à l’écran. Ici je peux discuter posément et voir si le courant passe.",
      avatarSrc: "/avatars_France/Toulouse/Brigitte.png",
      avatarAlt: "Profil fictif Brigitte_Tlse (femme à Toulouse, quartier résidentiel)",
      priority: true,
    },
    {
      pseudo: "Paul",
      ageVille: "28 ans — Toulouse",
      badges: ["Free"],
      phrase:
        "Je suis souvent en vadrouille entre le boulot, le sport et les amis. Keefon me permet de rencontrer du monde, j'aime bien ce site.",
      avatarSrc: "/avatars_France/Toulouse/Paul.png",
      avatarAlt:
        "Profil fictif Paul_Garonne (jeune homme devant la Garonne, ambiance ensoleillée)",
    },
    {
      pseudo: "Miloue",
      ageVille: "27 ans — Toulouse et communes autour",
      badges: ["Essentiel"],
      phrase:
        "J’aime quand les échanges restent simples et respectueux. Keefon m’aide à rencontrer des gens qui partagent cette façon de voir les choses.",
      avatarSrc: "/avatars_France/Toulouse/Miloue.png",
      avatarAlt:
        "Profil fictif Milou_VilleRose (jeune femme souriante près d’un pont à Toulouse)",
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

/* ===========================  Page principale  =========================== */
export default function ToulouseRencontresPage() {
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
        /**
         * Image de fond :
         *  - Pour l’instant on réutilise bg-France-ext.png, déjà présent dans /public.
         *  - Tu pourras remplacer plus tard par une image plus “ville rose”
         *    (par exemple bg-Toulouse-ext.png) en ne changeant QUE backgroundImage.
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
                Rencontres bienveillantes à Toulouse et dans la ville rose
              </h1>

              <p className="mt-3 text-center text-sm leading-relaxed text-slate-900 sm:text-base">
                Une plateforme française pour celles et ceux qui vivent à
                Toulouse et dans l&apos;aire toulousaine, et qui veulent des
                rencontres plus humaines, loin des applis centrées sur la
                consommation de profils.
              </p>

              <p className="mt-2 text-center text-xs leading-relaxed text-slate-800 sm:text-[13px]">
                Keefon est pensée et hébergée en France, dans le respect des
                lois françaises sur la vie privée (RGPD, CNIL, droits de
                l&apos;individu).
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
                  Inscription simple. Tu peux compléter ton profil à ton rythme.
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Rappel période gratuite */}
        <FreeReminderCard />

        {/* Exemples de profils (Toulouse) */}
        <ProfileTeaserBand />

        {/* Comment ça marche ? */}
        <section className="py-10">
          <div className="container mx-auto max-w-5xl px-4">
            <h2 className="text-xl font-semibold text-menuBtn sm:text-2xl">
              Comment ça marche sur la zone Toulouse&nbsp;?
            </h2>
            <div className="mt-6 grid gap-6 md:grid-cols-3">
              <article className="rounded-2xl border border-sky-200 bg-white/35 px-4 py-4 text-slate-900 shadow-sm backdrop-blur-[1px]">
                <h3 className="mb-2 text-sm font-semibold text-chatOuter sm:text-base">
                  1. Tu crées ton profil
                </h3>
                <h3 className="mb-2 text-sm font-semibold text-chatOuter sm:text-base">
                  2. Tu indiques que tu es sur la zone Toulouse / aire toulousaine
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
              Pourquoi Keefon est différent à Toulouse&nbsp;?
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
                Free. L&apos;abonnement Essentiel reste volontairement raisonnable
                pour aller plus loin sans exploser ton budget.
              </p>
            </div>
          </div>
        </section>

        {/* Toulouse ancrée dans le réel */}
        <section className="py-10">
          <div className="container mx-auto max-w-5xl px-4">
            <h2 className="text-xl font-semibold text-menuBtn sm:text-2xl">
              Rencontrer sur Toulouse, sans se perdre dans la masse
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-900 sm:text-base">
              Entre la Garonne, les briques roses et les communes autour,
              l&apos;aire toulousaine est vaste. Keefon t&apos;aide à ouvrir des
              portes sans te noyer dans une liste interminable de profils
              anonymes.
            </p>
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <article className="rounded-2xl border border-sky-200 bg-white/40 px-4 py-4 text-slate-900 shadow-sm backdrop-blur-[1px]">
                <h3 className="mb-2 text-sm font-semibold text-chatOuter sm:text-base">
                  Toulouse et les villes voisines
                </h3>
                <p className="text-sm leading-relaxed">
                  Que tu sois en centre-ville, à Blagnac, Colomiers, Balma ou
                  dans une autre commune, tu peux croiser des personnes qui
                  vivent sur la même grande zone que toi.
                </p>
              </article>

              <article className="rounded-2xl border border-sky-200 bg-white/40 px-4 py-4 text-slate-900 shadow-sm backdrop-blur-[1px]">
                <h3 className="mb-2 text-sm font-semibold text-chatOuter sm:text-base">
                  Et le reste de la France quand tu bouges
                </h3>
                <p className="text-sm leading-relaxed">
                  Si tu te déplaces régulièrement (missions pro, week-ends,
                  vacances), tu peux aussi utiliser Keefon dans d&apos;autres
                  régions, avec les mêmes règles de clarté et de respect.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="py-10">
          <div className="container mx-auto max-w-5xl px-4">
            <h2 className="text-xl font-semibold text-menuBtn sm:text-2xl">
              Envie de rencontres plus humaines à Toulouse&nbsp;?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-900 sm:text-base">
              Keefon s&apos;adresse à celles et ceux qui préfèrent un cadre plus
              calme et plus clair que les applis classiques, tout en profitant
              de l&apos;ambiance de la ville rose.
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
                Tu peux tester l&apos;appli gratuitement, voir comment tu te
                sens, puis décider si tu veux aller plus loin.
              </p>
            </div>
          </div>
        </section>

        {/* Idées de sorties locales (Toulouse & aire toulousaine) */}
        <section className="py-6">
          <div className="mx-auto max-w-5xl px-4">
            <div className="rounded-2xl bg-white/30 px-4 py-3 text-[11px] text-slate-900 shadow-sm backdrop-blur-[2px]">
              <h2 className="mb-1 text-xs font-semibold text-chatOuter">
                Quelques idées de sorties autour de Toulouse
              </h2>
              <ul className="list-disc space-y-1 pl-4">
                <li>
                  Balade le long de la Garonne, vers la Daurade ou la Prairie
                  des Filtres, avec un café en terrasse pour discuter dans un
                  lieu public.
                </li>
                <li>
                  Promenade sur la place du Capitole et dans les rues
                  piétonnes, en gardant un point de rendez-vous simple et facile
                  à retrouver.
                </li>
                <li>
                  Sortie dans un parc comme le Jardin des Plantes ou le Jardin
                  Japonais de Compans-Caffarelli, pour parler un peu plus au
                  calme.
                </li>
                <li>
                  Marche tranquille le long du canal du Midi ou d&apos;un autre
                  canal, en restant sur des portions fréquentées et bien
                  éclairées.
                </li>
                <li>
                  Si vous êtes en périphérie, petite balade dans le centre-ville
                  d&apos;une commune voisine (Blagnac, Colomiers, Balma, etc.)
                  avec un café ou un lieu public comme point de repère.
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
                    href="/rencontres/Bordeaux"
                    className="underline-offset-2 hover:underline"
                  >
                    Rencontres à Bordeaux
                  </Link>
                </li>
                <li>
                  <Link
                    href="/rencontres/Montpellier"
                    className="underline-offset-2 hover:underline"
                  >
                    Rencontres à Montpellier
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
