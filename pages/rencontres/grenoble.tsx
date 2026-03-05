/**
 * Fichier : pages/rencontres/grenoble.tsx
 * Module : Pages publiques / SEO — Rencontres sur la zone Grenoble / Métropole
 * MAJ : 2025-12-01 — Remplacement next/image → <img> pour les avatars locaux
 *
 * Contexte :
 * - Page vitrine dédiée à la zone Grenoble / Métropole, en plus de la page générale France.
 * - Même design et même logique que les autres pages ville pour rester simple à maintenir.
 * - Pas de promesse de filtres avancés : on parle de “Grenoble et sa métropole” de façon large.
 *
 * Dépendances :
 * - next/head, next/link
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
import Link from "next/link";
import Image from "next/image";

/* ===========================  SEO (mots-clés & libellés)  =========================== */
const SEO = {
  title: " Rencontre à Grenoble | Site gratuit et bienveillant | Keefon",
  description:
    "Rencontres locales à Grenoble, sans swipe ni algorithme opaque. Profils protégés, échanges gratuits pendant la période d’ouverture. Keefon : bienveillance et simplicité.",
    
  canonical: "https://www.keefon.com/rencontres/Grenoble",
  siteName: "Keefon",
  ogImage: "https://www.keefon.com/og/rencontres-grenoble.jpg",
  keywords: [
    // Intent + features (adapté à Grenoble / métropole)

    "site de rencontre Grenoble",
    "rencontres bienveillantes Grenoble",

  ].join(", "),
  breadcrumb: [
    { name: "Accueil", url: "https://www.keefon.com/" },
    { name: "Rencontres", url: "https://www.keefon.com/rencontres" },
    { name: "Grenoble", url: "https://www.keefon.com/rencontres/Grenoble" },
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
           Offre lancement Keefon : gratuité du site jusqu'à fin 2026 pour les 2000 premiers inscrit{" "}

            — chat ouvert à tous
          </span>
          <span className="mt-0.5 block text-[13px] sm:text-[15px] font-semibold opacity-90">
         Aucune carte bancaire demandée, chat et échanges illimités pendant la période d'ouverture — et bien sûr, nous espérons que tu auras trouvé ta moitié bien avant, et que le bonheur t'accompagne.
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
  return <div className="h-[96px] w-full sm:h-[84px]" />;
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
                Offre lancement Keefon : gratuité du site jusqu'à fin 2026 pour les 2000 premiers inscrit
              </p>
              <p className="m-0 mt-1 text-[13px] sm:text-[14px]">
                Tu peux créer ton profil, échanger librement et tester Keefon
                sans carte bancaire. Offre temporaire.
              </p>
            </div>

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
      ageVille: "27 ans — Villard-de-Lans",
      badges: ["Essentiel"],
      phrase:
        "Enfin un site où je ne me sens pas jugée ou pressée. Les échanges sont vrais.",
      avatarSrc: "/avatars_France/Grenoble/Rio.png",
      avatarAlt: "Profil fictif Rio (homme à Grenoble et en montagne)",
      priority: true,
    },
    {
      pseudo: "Simon",
      ageVille: "36 ans — Bernin",
      badges: ["Free"],
      phrase:
        "J’ai rencontré quelqu’un en quelques jours, sans stress. Ça change tout.",
      avatarSrc: "/avatars_France/Grenoble/Simon.png",
      avatarAlt: "Profil fictif Simon_Isere (homme à Grenoble)",
    },
    {
      pseudo: "Sonia",
      ageVille: "52 ans — Uriage",
      badges: ["Essentiel"],
      phrase:
        "Le côté local est génial. On sent que les gens sont là pour discuter, pas pour collectionner des matchs.",
      avatarSrc: "/avatars_France/Grenoble/Sonia.png",
      avatarAlt: "Profil fictif Sonia_Chartreuse (femme proche de Grenoble)",
    },
  ];

  return (
    <section className="section section-profiles-preview py-6">
      <div className="container mx-auto max-w-5xl px-4">
        {/* Mention discrète (bulle jaune pâle) */}
        <div
          className="relative mt-3 inline-block w-fit px-0 py-0 text-[12px] leading-relaxed sm:text-[13px]"
          style={{ color: "#FEFF93" }}
        >
          Profils fictifs inspirés de vraies personnes. Chaque membre décide ce
          qu&apos;il partage et reste protégé par les lois françaises.
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
                  quality={90}
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
                  className="text-5xl font-extrabold leading-none tracking-tight sm:text-6xl"
                  style={{
                    color: "#93ef09ff",
                    textShadow:
                      "0 2px 10px rgba(0,0,0,0.35), 0 6px 22px rgba(0,0,0,0.22)",
                  }}
                >
                  KEEFON
                </span>
              </div>

              {/* Badge prononciation Keefon, optimisé mobile */}
              <div className="mt-2 flex justify-center">
                <p
                  className="inline-block text-center text-[11px] sm:text-xs font-semibold rounded-full px-3 py-1"
                  style={{ backgroundColor: "#93ef09ff" }}
                >
                  <span className="block">Se prononce « qui-phone » 📞</span>
                  <span className="block">Coup de cœur mutuel. ❤️</span>
                </p>
              </div>



              {/* H1 SEO */}
              <h1
                className="text-center text-3xl font-extrabold sm:text-4xl md:text-5xl"
                style={{
                  color: "#cdff58ff",
                  textShadow: "0 2px 6px rgba(0,0,0,0.25)",
                }}
              >
              🏔️  Une nouvelle façon de rencontrer à Grenoble – bienveillance, simplicité et gratuité  🌿
              </h1>

              <p className="mt-3 text-center text-sm leading-relaxed text-slate-900 sm:text-base">
Grenoble est une ville dynamique entre campus, travail et week-ends en montagne. Pourtant, pour rencontrer quelqu’un, beaucoup cherchent simplement de la simplicité et du respect.

Keefon permet d’échanger sans swipe infini ni algorithme opaque, avec des personnes proches de toi.

Pendant la période d’ouverture, la messagerie est gratuite et aucune carte bancaire n’est demandée.
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
                 Je découvre Keefon 
                </a>
                <p className="text-xs text-slate-700">
                  Inscription rapide. Tu restes libre de ce que tu partages.
                </p>
                <p className="mt-2 text-xs text-slate-800 text-center">
                  Déjà membre ?{" "}
                  <a href="/login" className="font-semibold underline">
                    Se connecter
                  </a>
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
              ✨ Comment fonctionne Keefon ?
            </h2>
            <div className="mt-6 grid gap-6 md:grid-cols-3">
              <article className="rounded-2xl border border-sky-200 bg-white/35 px-4 py-4 text-slate-900 shadow-sm backdrop-blur-[1px]">
                <h3 className="mb-2 text-sm font-semibold text-chatOuter sm:text-base">
                  1. Tu crées ton profil en quelques minutes
                </h3>
                <p className="text-sm leading-relaxed">
                  Tu ajoutes une photo, ce que tu recherches, et quelques infos
                  simples pour te présenter. Pas besoin d&apos;un roman pour
                  commencer.
                </p>
              </article>
              <article className="rounded-2xl border border-sky-200 bg-white/35 px-4 py-4 text-slate-900 shadow-sm backdrop-blur-[1px]">
                <h3 className="mb-2 text-sm font-semibold text-chatOuter sm:text-base">
                  2. Tu indiques Grenoble ou ta commune de la métropole
                </h3>
                <p className="text-sm leading-relaxed">
C'est important sinon les autres ne te verront pas.
                </p>
              </article>
              <article className="rounded-2xl border border-sky-200 bg-white/35 px-4 py-4 text-slate-900 shadow-sm backdrop-blur-[1px]">
                <h3 className="mb-2 text-sm font-semibold text-chatOuter sm:text-base">
                  3. Tu échanges à ton rythme
                </h3>
                <p className="text-sm leading-relaxed">
                  Tu discutes via la messagerie, tu vois si le feeling passe,
                  puis tu décides si tu veux aller plus loin dans le réel
                  (balade, rando, verre ou café en ville…).
                </p>
              </article>
            </div>
          </div>
        </section>

{/* Pourquoi Keefon change l’expérience des rencontres */}
<section className="py-10">
  <div className="container mx-auto max-w-5xl px-4">
    <h2 className="text-xl font-semibold text-menuBtn sm:text-2xl">
      💛 Pourquoi Keefon change l’expérience des rencontres
    </h2>

    <div className="mt-6 max-w-3xl rounded-2xl border border-sky-200 bg-white/40 px-4 py-4 text-slate-900 shadow-sm backdrop-blur-[1px]">
      <ul className="space-y-3 text-sm leading-relaxed">
        <li>
          <span className="font-semibold text-chatOuter">Pas de swipe :</span>{" "}
          tu ne consommes pas des visages, tu rencontres des personnes.
        </li>

        <li>
          <span className="font-semibold text-chatOuter">
            Pas d’algorithme opaque :
          </span>{" "}
          tu vois les profils, pas ce que la machine veut te montrer.
        </li>

        <li>
          <span className="font-semibold text-chatOuter">
            Profils certifiés :
          </span>{" "}
          un système simple pour limiter les faux comptes et renforcer la
          confiance.
        </li>

        <li>
          <span className="font-semibold text-chatOuter">
            Anti-harcèlement :
          </span>{" "}
          signalements rapides, modération humaine, tolérance zéro.
        </li>

        <li>
          <span className="font-semibold text-chatOuter">
            Respect des données :
          </span>{" "}
          RGPD, CNIL, aucune revente, aucune publicité intrusive.
        </li>

        <li>
          <span className="font-semibold text-chatOuter">
            Gratuité pendant l’ouverture :
          </span>{" "}
          échanges illimités, sans carte bancaire.
        </li>
      </ul>

      <p className="mt-4 text-sm leading-relaxed">
        Keefon n’est pas un site de consommation rapide. C’est un espace où l’on
        prend le temps de se découvrir, où l’on privilégie la qualité des
        échanges plutôt que la quantité de matchs.
      </p>
    </div>
  </div>
</section>

        {/* Grenoble / Métropole ancrée dans le réel */}
        <section className="py-10">
          <div className="container mx-auto max-w-5xl px-4">
            <h2 className="text-xl font-semibold text-menuBtn sm:text-2xl">
             🌟 Rejoins la communauté grenobloise
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-900 sm:text-base">
Tu peux créer ton profil gratuitement, discuter librement et découvrir une nouvelle façon de rencontrer.
Keefon t’accueille avec bienveillance, simplicité et respect.
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
              <h3 className="mb-1 text-xs font-semibold text-chatOuter">
                Quelques idées de sorties autour de Grenoble
              </h3>
              <ul className="list-disc space-y-1 pl-4">
                <li>
                  Visite du château de Vizille, ou balade avec le petit train de
                  La Mure.
                </li>
                <li>
                  Téléphérique de la Bastille, vue sur la ville puis petite
                  marche sur les sentiers autour du fort.
                </li>
                <li>Visite des Cuves de Sassenage.</li>
                <li>
                  Sortie rando à la demi-journée dans le Vercors, la Chartreuse
                  ou Belledonne quand la météo s&apos;y prête.
                </li>
                <li>
                  Verre ou concert dans un bar du centre. Sortie canyoning
                  l&apos;été, ski l&apos;hiver.
                </li>
              </ul>
              <p className="mt-2">
                Ce ne sont que des exemples : chacun choisit ses lieux de
                rencontre et reste libre de son rythme.
              </p>
            </div>
          </div>
        </section>

        
        {/* Bloc local Grenoble : quartiers, loisirs, mini-FAQ (texte unique) */}
        <section className="py-6">
          <div className="mx-auto max-w-5xl px-4">
            <div className="rounded-2xl bg-white/30 px-4 py-4 text-slate-900 shadow-sm backdrop-blur-[2px]">
              <h2 className="text-sm font-semibold text-chatOuter sm:text-base">
                Grenoble : quartiers, rythme et occasions de rencontre
              </h2>

              <p className="mt-2 text-[11px] leading-relaxed">
                Entre la vallée, les campus et l’accès direct à la montagne,
                Grenoble a un rythme particulier : on peut se voir en ville… puis
                sortir très vite prendre l’air. Le plus simple, c’est de rester
                sur des zones faciles (tram, centre, lieux publics) pour éviter
                les trajets compliqués et garder une rencontre légère.
              </p>

              <h3 className="mt-4 text-xs font-semibold text-chatOuter">
                Des quartiers pratiques pour se voir
              </h3>
              <ul className="mt-1 list-disc space-y-1 pl-4 text-[11px] leading-relaxed">
                <li>
                  <strong>Hyper-centre / Victor Hugo</strong> : terrasses, rues
                  piétonnes, points de rendez-vous évidents.
                </li>
                <li>
                  <strong>Championnet &amp; Caserne de Bonne</strong> : cafés,
                  ambiance détendue, parfait pour un premier verre.
                </li>
                <li>
                  <strong>Europole / Gare</strong> : pratique si l’un de vous
                  bouge beaucoup (TER, tram).
                </li>
                <li>
                  <strong>Île Verte / Parc Paul Mistral</strong> : balade simple,
                  grand espace public, idéal pour discuter au calme.
                </li>
                <li>
                  <strong>Métropole</strong> (Saint-Martin-d’Hères, Échirolles,
                  Meylan, Fontaine…) : ok si vous choisissez un lieu “pivot”
                  accessible en tram/voiture.
                </li>
              </ul>

              <h3 className="mt-4 text-xs font-semibold text-chatOuter">
                Activités qui créent du lien (sans pression)
              </h3>
              <p className="mt-1 text-[11px] leading-relaxed">
                Grenoble se prête bien aux rencontres par activités : rando courte
                (Chartreuse / Vercors), escalade, vélo, ski en saison, mais aussi
                danse, clubs de sport, assos, ateliers (photo, cuisine, langue)
                ou sorties culturelles. Ce sont des contextes où la discussion
                vient naturellement, sans “jeu” ni surconsommation.
              </p>

              <div className="mt-4 space-y-2 text-[11px] leading-relaxed">
                <details className="rounded-xl bg-white/35 px-3 py-2 shadow-sm">
                  <summary className="cursor-pointer font-semibold text-chatOuter">
                    Où proposer un premier rendez-vous simple à Grenoble ?
                  </summary>
                  <p className="mt-1">
                    Un café autour de Victor Hugo / Championnet, ou une balade
                    courte au Jardin de Ville / Parc Paul Mistral : public, facile
                    à rejoindre, et simple à écourter si besoin.
                  </p>
                </details>

                <details className="rounded-xl bg-white/35 px-3 py-2 shadow-sm">
                  <summary className="cursor-pointer font-semibold text-chatOuter">
                    Et si on vit en périphérie ?
                  </summary>
                  <p className="mt-1">
                    Choisissez un point “pivot” accessible (tram, gare, centre)
                    plutôt que de compliquer les trajets. L’objectif : pouvoir se
                    voir souvent, pas une expédition.
                  </p>
                </details>

                <details className="rounded-xl bg-white/35 px-3 py-2 shadow-sm">
                  <summary className="cursor-pointer font-semibold text-chatOuter">
                    Comment rester dans un cadre safe ?
                  </summary>
                  <p className="mt-1">
                    Toujours en public, à une heure raisonnable, et avec un plan
                    simple. Tu gardes la main sur le rythme et tes limites.
                  </p>
                </details>

                <details className="rounded-xl bg-white/35 px-3 py-2 shadow-sm">
                  <summary className="cursor-pointer font-semibold text-chatOuter">
                    Une idée d’activité “facile” pour briser la glace ?
                  </summary>
                  <p className="mt-1">
                    Une expo, un marché, un petit tour à la Bastille (téléphérique
                    + vue) ou une balade courte le long de l’Isère : ça donne un
                    sujet et évite le face-à-face trop formel.
                  </p>
                </details>

<h3 className="mt-6 text-xs font-semibold text-chatOuter">
FAQ Keefon
</h3>

<div className="mt-2 space-y-2 text-[11px] leading-relaxed">

  <details className="rounded-xl bg-white/35 px-3 py-2 shadow-sm">
    <summary className="cursor-pointer font-semibold text-chatOuter">
      Keefon est-il vraiment gratuit à Grenoble ?
    </summary>
    <p className="mt-1">
      Oui, l’accès est gratuit pendant la période d’ouverture : création de profil,
      messagerie et échanges. Aucune carte bancaire n’est demandée.
    </p>
  </details>

  <details className="rounded-xl bg-white/35 px-3 py-2 shadow-sm">
    <summary className="cursor-pointer font-semibold text-chatOuter">
      Comment fonctionne la vérification des profils ?
    </summary>
    <p className="mt-1">
      Chaque profil peut être certifié via un système simple et sécurisé,
      pour limiter les faux comptes et renforcer la confiance.
    </p>
  </details>

  <details className="rounded-xl bg-white/35 px-3 py-2 shadow-sm">
    <summary className="cursor-pointer font-semibold text-chatOuter">
      Keefon utilise-t-il un algorithme de matching ?
    </summary>
    <p className="mt-1">
      Non. Pas d’algorithme opaque ni de swipe infini : tu découvres les profils
      à ton rythme, sans pression.
    </p>
  </details>

  <details className="rounded-xl bg-white/35 px-3 py-2 shadow-sm">
    <summary className="cursor-pointer font-semibold text-chatOuter">
      Keefon est-il adapté aux rencontres sérieuses à Grenoble ?
    </summary>
    <p className="mt-1">
      Oui. Le site encourage les échanges respectueux, la bienveillance et
      les rencontres authentiques.
    </p>
  </details>

  <details className="rounded-xl bg-white/35 px-3 py-2 shadow-sm">
    <summary className="cursor-pointer font-semibold text-chatOuter">
      Mes données sont-elles protégées ?
    </summary>
    <p className="mt-1">
      Oui. Keefon respecte le RGPD, la CNIL et ne revend aucune donnée.
    </p>
  </details>

</div>


              </div>
            </div>
          </div>
        </section>





{/* Liens internes SEO (France + autres villes) */}
        <section className="py-6">
          <div className="mx-auto max-w-5xl px-4">
            <div className="rounded-2xl bg-white/30 px-4 py-3 text-[11px] text-slate-800 shadow-sm backdrop-blur-[2px]">
              <p className="mb-2">
                Tu peux aussi explorer la vue d’ensemble&nbsp;:{" "}
                <Link
                  href="/rencontres/France"
                  className="font-semibold underline-offset-2 hover:underline"
                >
                  rencontres en France
                </Link>
                .
              </p>


            </div>
          </div>
        </section>

        {/* Footer (mentions légales / CGU / confidentialité / cookies) */}
        <footer className="pt-4 pb-10">
          <div className="mx-auto max-w-5xl px-4">
            <p className="mt-2 text-center text-[11px] text-slate-900">
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