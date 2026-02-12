/**
 * Fichier : pages/rencontres/Nice.tsx
 * Module : Pages publiques / SEO — Rencontres sur la zone Nice & Côte d’Azur
 * MAJ : 2025-11-19 — Version basée sur Marseille.tsx, adaptée à Nice / Cannes / Côte d’Azur.
 *
 * Contexte :
 * - Page vitrine dédiée à la zone Nice et alentours (Cannes, Antibes, Menton, arrière-pays azuréen…).
 * - Même design et même logique que pages/rencontres/France.tsx, Paris.tsx et Marseille.tsx.
 * - Pas de promesse de filtres ultra-précis : on parle de “zone Nice / Côte d’Azur” de façon large.
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
 * - Garder la cohérence visuelle avec France.tsx / Paris.tsx / Marseille.tsx
 *   (bandeau jaune, carte rappel, structure des sections).
 * - Ne PAS promettre de fonctionnalités de recherche ultra-précises qui n’existent pas encore.
 */

import Head from "next/head";
import Image from "next/image";
import Link from "next/link";

/* ===========================  SEO (mots-clés & libellés)  =========================== */
const SEO = {
  title: "Rencontres à Nice (06) et alentours | Keefon",
  description:
    "Rencontre à Nice et autour (Cagnes-sur-Mer, Saint-Laurent-du-Var, Villefranche, Antibes…) : échanges respectueux, sans swipe toxique. Chat ouvert pendant la période gratuite.",
  canonical: "https://www.keefon.com/rencontres/nice",
  siteName: "Keefon",
  ogImage: "https://www.keefon.com/og/rencontres-Nice.jpg",
  keywords: [
    "rencontre nice",
    "rencontres nice",
    "site de rencontre nice",
    "rencontre nice 06",
    "rencontre alpes-maritimes",
    "rencontres paca",
    "dating nice",
    "rencontre sans swipe",
    "rencontres bienveillantes",
    "chat gratuit nice",
    "messagerie gratuite nice",
    "rencontre sérieuse nice",
    "rencontre nice vieux-nice",
    "rencontre promenade des anglais",
    "rencontre place masséna",
    "rencontre port de nice",
    "rencontre cagnes-sur-mer",
    "rencontre saint-laurent-du-var",
    "rencontre villefranche-sur-mer",
    "rencontre antibes",
    "rencontre cannes",
    "rencontre menton",
    "rencontre après 30 ans nice",
    "rencontre après 40 ans nice",
    "rencontre après 50 ans nice",
  ].join(", "),
  breadcrumb: [
    { name: "Accueil", url: "https://www.keefon.com" },
    { name: "Rencontres", url: "https://www.keefon.com/rencontres" },
    { name: "Nice", url: "https://www.keefon.com/rencontres/nice" },
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

/* ===========================  Bandeau “exemples de profils” — Nice / Côte d’Azur  =========================== */
function ProfileTeaserBand() {
  /**
   * ⚠️ Fichiers à placer dans : /public/avatars_France/Nice/
   * IMPORTANT :
   *  - pas d’accents ni d’espaces dans les noms de fichiers
   *    (Nadou.png, Nico.png, Valou.png, Didier.png par exemple)
   *  - le chemin doit suivre les valeurs avatarSrc ci-dessous.
   *
   * Les visuels sont fictifs, inspirés de personnes réelles, pour illustrer
   * la diversité de la région niçoise et de la Côte d’Azur.
   */
  const profiles = [
    {
      pseudo: "Nadou",
      ageVille: "25 ans — Nice centre",
      badges: ["Free"],
      phrase:
        "Je bosse en ville et je profite dès que je peux du Vieux-Nice et de la Promenade. J'aime beaucoup Keefon, pour sa facilité de rencontrer d'autres personnes.",
      avatarSrc: "/avatars_France/Nice/Nadou.png",
      avatarAlt:
        "Profil fictif Nadou (jeune femme souriante dans une rue de ville méditerranéenne)",
      priority: true,
    },
    {
      pseudo: "Nico",
      ageVille: "31 ans — Nice bord de mer",
      badges: ["Essentiel"],
      phrase:
        "Entre le boulot, le sport et les soirées entre amis, j’ai zéro envie de passer des heures à swiper. Je préfère quelques échanges clairs et respectueux.",
      avatarSrc: "/avatars_France/Nice/Nico.png",
      avatarAlt:
        "Profil fictif Nico (homme souriant au soleil sur une promenade en bord de mer)",
      priority: true,
    },
    {
      pseudo: "Valou",
      ageVille: "50 ans — Cannes",
      badges: ["Free"],
      phrase:
        "Je bouge souvent entre Cannes et les plages autour. Ici, j’aime pouvoir parler simplement sans me sentir jugée, à mon rythme.",
      avatarSrc: "/avatars_France/Nice/Valou.png",
      avatarAlt:
        "Profil fictif Valou (femme souriante sur une plage au coucher de soleil, sac sur l’épaule)",
    },
    {
      pseudo: "Didier",
      ageVille: "54 ans — Antibes",
      badges: ["Essentiel"],
      phrase:
        "Je travaille près du port et je profite des soirs pour souffler. Keefon m’aide à ouvrir des portes sans me perdre dans des centaines de profils.",
      avatarSrc: "/avatars_France/Nice/Didier.png",
      avatarAlt:
        "Profil fictif Didier (homme souriant en costume près d’un port de plaisance)",
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
export default function NiceRencontresPage() {
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
         *  - pour l’instant on réutilise bg-France-ext.png (déjà présent dans /public)
         *  - tu pourras remplacer plus tard par un visuel type “bg-Nice-ext.png”
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
                Rencontres bienveillantes à Nice et sur la Côte d’Azur
              </h1>

              <p className="mt-3 text-center text-sm leading-relaxed text-slate-900 sm:text-base">Une plateforme française pour celles et ceux qui vivent à
                Nice et sur la Côte d’Azur (Cagnes-sur-Mer, Saint-Laurent,
                Villefranche, Antibes…) et qui veulent des rencontres plus
                humaines, sans swipe toxique — avec l’idée de se voir facilement
                (Vieux-Nice, Masséna, Port, Promenade des Anglais…).</p>

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

        {/* Carte rappel période gratuite */}
        <FreeReminderCard />

        {/* Exemples de profils (Nice / Côte d’Azur) */}
        <ProfileTeaserBand />

        {/* Comment ça marche ? */}
        <section className="py-10">
          <div className="container mx-auto max-w-5xl px-4">
            <h2 className="text-xl font-semibold text-menuBtn sm:text-2xl">
              Comment ça marche à Nice&nbsp;?
            </h2>
            <div className="mt-6 grid gap-6 md:grid-cols-3">
              <article className="rounded-2xl border border-sky-200 bg-white/35 px-4 py-4 text-slate-900 shadow-sm backdrop-blur-[1px]">
                <h3 className="mb-2 text-sm font-semibold text-chatOuter sm:text-base">
                  1. Tu crées ton profil
                </h3>
                <h3 className="mb-2 text-sm font-semibold text-chatOuter sm:text-base">
                  2. Tu indiques ta ville.
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
              Pourquoi Keefon est différent sur la Côte d’Azur&nbsp;?
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
                budget, même dans une région où tout coûte souvent plus cher.
              </p>
            </div>
          </div>
        </section>

        {/* Nice & Côte d’Azur ancrées dans le réel */}
        <section className="py-10">
          <div className="container mx-auto max-w-5xl px-4">
            <h2 className="text-xl font-semibold text-menuBtn sm:text-2xl">
              Rencontrer à Nice, sans se perdre dans la masse
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-900 sm:text-base">
              Grandes villes, bord de mer, villages perchés : la région est
              riche en beauté et en monde. Keefon te permet d&apos;ouvrir des
              portes sans te noyer dans une marée de profils anonymes.
            </p>
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <article className="rounded-2xl border border-sky-200 bg-white/40 px-4 py-4 text-slate-900 shadow-sm backdrop-blur-[1px]">
                <h3 className="mb-2 text-sm font-semibold text-chatOuter sm:text-base">
                  Vieux-Nice, Promenade, collines…
                </h3>
                <p className="text-sm leading-relaxed">
                  Que tu vives à Nice, Antibes ou Menton, dans les collines de
                  Cimiez, à Cagnes-sur-Mer ou dans un village de l&apos;arrière-pays,
                  tu peux croiser des personnes qui partagent la même région et
                  la même énergie que toi.
                </p>
              </article>

              <article className="rounded-2xl border border-sky-200 bg-white/40 px-4 py-4 text-slate-900 shadow-sm backdrop-blur-[1px]">
                <h3 className="mb-2 text-sm font-semibold text-chatOuter sm:text-base">
                  Et toute la Côte d’Azur si tu bouges
                </h3>
                <p className="text-sm leading-relaxed">
                  Si tu te déplaces souvent vers Cannes, Antibes, Grasse, Menton
                  ou d&apos;autres villes de la Côte d&apos;Azur, tu peux aussi
                  utiliser Keefon dans ces zones, avec les mêmes principes de
                  respect et de clarté.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="py-10">
          <div className="container mx-auto max-w-5xl px-4">
            <h2 className="text-xl font-semibold text-menuBtn sm:text-2xl">
              Envie de rencontres plus humaines sur la Côte d’Azur&nbsp;?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-900 sm:text-base">
              Keefon s&apos;adresse à celles et ceux qui préfèrent un espace
              plus calme, plus clair, plus respectueux que les applis
              classiques, tout en profitant de la lumière et de la mer entre
              Nice, Cannes, Antibes et les villages autour.
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
                rythme, et voir ensuite jusqu&apos;où tu veux aller.
              </p>
            </div>
          </div>
        </section>

        {/* Idées de sorties locales (Nice & Côte d’Azur) */}
        <section className="py-6">
          <div className="mx-auto max-w-5xl px-4">
            <div className="rounded-2xl bg-white/30 px-4 py-3 text-[11px] text-slate-900 shadow-sm backdrop-blur-[2px]">
              <h2 className="mb-1 text-xs font-semibold text-chatOuter">
                Quelques idées de sorties autour de Nice et sur la Côte d’Azur
              </h2>
              <ul className="list-disc space-y-1 pl-4">
                <li>
                  Balade sur la Promenade des Anglais avec un café ou une glace,
                  en choisissant un point de rendez-vous public facile à
                  retrouver.
                </li>
                <li>
                  Promenade dans le Vieux-Nice et autour du Cours Saleya, pour
                  discuter en marchant et faire une pause en terrasse si le
                  feeling passe.
                </li>
                <li>
                  Montée vers la colline du Château ou un autre point de vue,
                  pour parler au calme tout en profitant de la vue sur la baie.
                </li>
                <li>
                  Sortie à Antibes, Cannes ou Menton (TER, bus ou voiture), avec
                  une balade sur le port, en bord de mer ou dans un quartier
                  animé.
                </li>
                <li>
                  Si vous aimez marcher, petite balade dans un village ou un
                  coin de l&apos;arrière-pays (en restant sur des chemins
                  connus, accessibles et fréquentés) pour garder un cadre
                  simple et sécurisé.
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

        
        {/* Bloc local Nice : quartiers, rythme et occasions de rencontre (texte unique) */}
        <section className="py-6">
          <div className="mx-auto max-w-5xl px-4">
            <div className="rounded-2xl bg-white/30 px-4 py-4 text-slate-900 shadow-sm backdrop-blur-[2px]">
              <h2 className="text-sm font-semibold text-chatOuter sm:text-base">
                Nice : quartiers, rythme et occasions de rencontre
              </h2>

              <p className="mt-2 text-[11px] leading-relaxed">
                À Nice, le cadre aide déjà : mer, lumière, quartiers vivants.
                Le piège, c’est de se disperser entre centre, littoral et villes
                voisines. Le plus simple : un rendez-vous public très clair,
                dans une zone facile, puis on voit si l’envie de se revoir est là.
              </p>

              <h3 className="mt-4 text-xs font-semibold text-chatOuter">
                Des endroits pratiques pour se voir
              </h3>
              <ul className="mt-1 list-disc space-y-1 pl-4 text-[11px] leading-relaxed">
                <li>
                  <strong>Vieux-Nice</strong> : ruelles, terrasses, ambiance vivante
                  pour un premier verre (public, simple).
                </li>
                <li>
                  <strong>Place Masséna</strong> : point de rendez-vous évident,
                  central, facile à retrouver.
                </li>
                <li>
                  <strong>Promenade des Anglais</strong> : balade facile en bord de mer,
                  très fréquentée, sans pression.
                </li>
                <li>
                  <strong>Port / Garibaldi</strong> : cafés, cadre plus posé, parfait
                  pour discuter tranquillement.
                </li>
                <li>
                  <strong>Autour</strong> (Saint-Laurent, Cagnes, Villefranche, Antibes…)
                  : choisissez un point “pivot” simple pour éviter les trajets pénibles.
                </li>
              </ul>

              <h3 className="mt-4 text-xs font-semibold text-chatOuter">
                Activités qui rapprochent naturellement
              </h3>
              <p className="mt-1 text-[11px] leading-relaxed">
                Les meilleures rencontres viennent souvent d’un prétexte réel :
                sport (course, salle, sports de mer), danse, clubs, associations,
                ateliers (photo, cuisine), sorties culturelles. À Nice, une marche
                courte (Colline du Château) ou une expo donne tout de suite un cadre
                simple et évite les échanges “qui tournent en rond”.
              </p>

              <div className="mt-4 space-y-2 text-[11px] leading-relaxed">
                <details className="rounded-xl bg-white/35 px-3 py-2 shadow-sm">
                  <summary className="cursor-pointer font-semibold text-chatOuter">
                    Où proposer un premier rendez-vous simple à Nice ?
                  </summary>
                  <p className="mt-1">
                    Masséna ou Promenade : c’est public, central, et facile à écourter
                    si besoin.
                  </p>
                </details>

                <details className="rounded-xl bg-white/35 px-3 py-2 shadow-sm">
                  <summary className="cursor-pointer font-semibold text-chatOuter">
                    Et si on vit hors centre (Cagnes / Antibes / etc.) ?
                  </summary>
                  <p className="mt-1">
                    Prenez un point “pivot” accessible (centre, gare, tram). Le but :
                    se voir sans friction, et pouvoir se revoir facilement.
                  </p>
                </details>

                <details className="rounded-xl bg-white/35 px-3 py-2 shadow-sm">
                  <summary className="cursor-pointer font-semibold text-chatOuter">
                    Comment rester dans un cadre safe ?
                  </summary>
                  <p className="mt-1">
                    Rendez-vous en public, heure raisonnable, plan simple. Tu gardes la
                    main sur ton rythme et tes limites.
                  </p>
                </details>

                <details className="rounded-xl bg-white/35 px-3 py-2 shadow-sm">
                  <summary className="cursor-pointer font-semibold text-chatOuter">
                    Une idée “facile” pour briser la glace ?
                  </summary>
                  <p className="mt-1">
                    Balade courte bord de mer + café : tu as un cadre, un sujet, et ça
                    enlève la pression.
                  </p>
                </details>
              </div>
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
                .       </p>
            </div>
          </div>
        </section>

        {/* Mention légale / CGU */}
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
