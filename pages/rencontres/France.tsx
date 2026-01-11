/**
 * Fichier : pages/rencontres/france.tsx
 * Module : Pages publiques / SEO — Rencontres en France
 * MAJ : 2025-11-24 — Badge prononciation Keefon + correction preload avatars
 */

import Head from "next/head";
import Image from "next/image";
import Link from "next/link";

/* ===========================  SEO (mots-clés & libellés)  =========================== */
const SEO = {
  title: "Rencontres bienveillantes en France | Keefon",
  description:
    "Keefon est une plateforme française de rencontres bienveillantes pour celles et ceux qui veulent des échanges vrais, respectueux et sans swipe toxique. Chat gratuit pendant la période d’ouverture.",
  canonical: "https://keefon.com/rencontres/france",
  siteName: "Keefon",
  ogImage: "https://keefon.com/og/rencontres-france.jpg",
  keywords: [
    // Intent + features
    "rencontre","site de rencontre","site de rencontre gratuit","rencontres bienveillantes","site de rencontre français","appli de rencontre française",
    "rencontre sérieuse","rencontres sérieuses","rencontre locale","rencontres locales",
    "chat gratuit","chat rencontre gratuit","messagerie gratuite","discussion rencontre",
    "profils certifiés","profil certifié","vérification profil",
    "respect et sécurité","rencontre respectueuse","anti harcèlement",
    "sans swipe","sans swipe infini","sans algorithme opaque","anti addiction",
    "plateforme RGPD","respect CNIL","protection des données",
    "dating France","site de dating France","rencontre adultes consentants",
    "slow dating","dating bienveillant",

    // Longue traîne
    "site de rencontre sans swipe","site de rencontre bienveillant France",
    "application de rencontre française sérieuse","chat rencontre gratuit France",
    "rencontre proche de chez moi","rencontre par ville","rencontre par région",
    "rencontre après 30 ans","rencontre après 40 ans","rencontre après 50 ans",

    // Régions
    "Île-de-France","Auvergne-Rhône-Alpes","Occitanie","Provence-Alpes-Côte d’Azur",
    "Nouvelle-Aquitaine","Hauts-de-France","Grand Est","Bretagne","Normandie",
    "Pays de la Loire","Bourgogne-Franche-Comté","Centre-Val de Loire","Corse",

    // Grandes villes
    "Paris","Lyon","Marseille","Toulouse","Nice","Nantes","Strasbourg","Montpellier",
    "Bordeaux","Lille","Rennes","Reims","Toulon","Grenoble","Dijon","Angers","Nîmes",
    "Villeurbanne","Clermont-Ferrand","Saint-Étienne","Le Havre","Aix-en-Provence",
    "Brest","Tours","Amiens","Limoges","Metz","Besançon","Perpignan","Orléans",
    "Mulhouse","Rouen","Boulogne-Billancourt","Nancy","Argenteuil","Saint-Denis",

    // Combinaisons courtes utiles
    "rencontre Paris","rencontre Lyon","rencontre Marseille","rencontre Toulouse",
    "rencontre Montpellier","rencontre Bordeaux","rencontre Nantes","rencontre Lille",
    "rencontre Nice","rencontre Rennes","rencontre Strasbourg","rencontre Toulon",
    "rencontre Grenoble","rencontre Dijon","rencontre Angers","rencontre Nîmes",
    "rencontre Clermont-Ferrand","rencontre Reims","rencontre Metz","rencontre Rouen"
  ].join(", "),
  breadcrumb: [
    { name: "Accueil", url: "https://keefon.com/" },
    { name: "Rencontres", url: "https://keefon.com/rencontres" },
    { name: "France", url: "https://keefon.com/rencontres/france" },
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
        boxShadow: "0 8px 28px rgba(0,0,0,.22)", // ombre légèrement renforcée
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
  return <div className="h-[72px] sm:h-[84px] w-full" />;
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
            boxShadow: "0 10px 28px rgba(0,0,0,.18)", // ombre renforcée, cohérente avec la ligne jaune
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

/* ===========================  Bandeau “exemples de profils”  =========================== */
function ProfileTeaserBand() {
  const profiles = [
    {
      pseudo: "Léa_Soleil",
      ageVille: "29 ans — Toulouse (31)",
      badges: ["Free", "Écho reçu"],
      phrase:
        "Sur les autres applis, on scrolle sans jamais vraiment se rencontrer. Ici, avec l’Écho et Keefon+, je croise enfin de vraies personnes, pas juste des profils.",
      avatarSrc: "/avatars_France/France/lea-soleil.png",
      avatarAlt: "Profil fictif Léa_Soleil",
      priority: true,
    },
    {
      pseudo: "Bertrand",
      ageVille: "39 ans — Paris (75)",
      badges: ["Keefon+"],
      phrase:
        "J’aime beaucoup ce site. Avec Keefon+, je peux parler aussi avec des personnes non abonnées. C’est une autre dimension, avec beaucoup moins de pertes de temps.",
      avatarSrc: "/avatars_France/France/bertrand.png",
      avatarAlt: "Profil fictif Bertrand",
      priority: true,
    },
    {
      pseudo: "Sami",
      ageVille: "34 ans — Montpellier (34)",
      badges: ["Essentiel", "Profil certifié"],
      phrase:
        "Déjà déçu par d’autres applis, ici je teste quelque chose de plus humain, j’adore.",
      avatarSrc: "/avatars_France/France/sami.png",
      avatarAlt: "Profil fictif Sami",
    },
    {
      pseudo: "Nora_azur",
      ageVille: "29 ans — Lyon (69)",
      badges: ["Essentiel", "Profil certifié"],
      phrase:
        "Rencontres posées et sincères, loin du bruit des applis classiques.",
      avatarSrc: "/avatars_France/France/nora-azur.png",
      avatarAlt: "Profil fictif Nora_azur",
    },
    {
      pseudo: "Philou_océan",
      ageVille: "56 ans — La Rochelle (17)",
      badges: ["Free"],
      phrase:
        "Je vis près de l’océan. Ici, je fais des rencontres tranquilles, avec des personnes qui ont aussi envie de vraies discussions, pas seulement de petits likes.",
      avatarSrc: "/avatars_France/France/Philou_ocean.png",
      avatarAlt: "Profil fictif Philou_océan",
    },
    {
      pseudo: "Claire_lys",
      ageVille: "55 ans — Dijon (21)",
      badges: ["Essentiel"],
      phrase:
        "Après 50 ans, je ne cherche plus à collectionner les matchs. Ici je prends le temps d’échanger vraiment, sans pression c'est très different des autres sites..",
      avatarSrc: "/avatars_France/France/Claire_lys.png",
      avatarAlt: "Profil fictif Claire_lys",
    },
  ];

  return (
    <section className="section section-profiles-preview py-6">
      <div className="container mx-auto max-w-5xl px-4">
        <h2 className="text-sm sm:text-base font-semibold uppercase tracking-[0.18em] text-menuBtn">
          Quelques exemples de profils sur Keefon
        </h2>

        {/* Mention discrète (jaune pâle, sans fond) */}
        <div
          className="relative mt-3 inline-block w-fit px-0 py-0 text-[12px] sm:text-[13px] leading-relaxed"
          style={{ color: "#FEFF93" }}
        >
          Profils fictifs inspirés de vraies personnes. Chaque membre décide ce
          qu&apos;il partage et reste protégé par les lois françaises.
        </div>

        <div className="mt-5 flex gap-4 overflow-x-auto pb-3 md:grid md:grid-cols-2 lg:grid-cols-4 md:overflow-visible">
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
export default function FranceRencontresPage() {
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
        isPartOf: {
          "@type": "WebSite",
          name: SEO.siteName,
          url: "https://keefon.com",
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: SEO.breadcrumb.map((b, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: b.name,
          item: b.url,
        })),
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
        <link rel="alternate" hrefLang="fr" href={SEO.canonical} />
        <meta name="robots" content="index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1" />
        <meta property="og:locale" content="fr_FR" />
        <meta property="og:title" content={SEO.title} />
        <meta property="og:description" content={SEO.description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={SEO.canonical} />
        <meta property="og:site_name" content={SEO.siteName} />
        <meta property="og:image" content={SEO.ogImage} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={SEO.title} />
        <meta name="twitter:description" content={SEO.description} />
        <meta name="twitter:image" content={SEO.ogImage} />
        {/* Preload 2 visuels clés — chemin corrigé (dossier France) */}
        <link
          rel="preload"
          as="image"
          href="/avatars_France/France/lea-soleil.png"
        />
        <link
          rel="preload"
          as="image"
          href="/avatars_France/France/bertrand.png"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </Head>

      <FreeTopBar />
      <FreeTopBarSpacer />

      <main
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
                  className="font-extrabold tracking-tight leading-none text-5xl sm:text-6xl"
                  style={{
                    color: "#93ef09ff",
                    textShadow:
                      "0 2px 10px rgba(0,0,0,.35), 0 6px 22px rgba(0,0,0,.22)", // ombre renforcée pour le mot KEEFON
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
                  <span className="block">Se prononce « qui phone » 📞</span>
                  <span className="block">et veut dire « on kiffe » ❤️</span>
                </p>
              </div>

              {/* H1 SEO conservé (contraste via ombre légère) */}
              <h1
                className="mt-3 text-3xl sm:text-4xl md:text-5xl font-extrabold"
                style={{
                  color: "#cdff58ff",
                  textShadow: "0 2px 6px rgba(0,0,0,.25)",
                }}
              >
                Rencontres bienveillantes partout en France
              </h1>

              <p className="mt-3 text-sm leading-relaxed sm:text-base text-center">
                Une plateforme française pour celles et ceux qui veulent du
                vrai, du respect et du temps de qualité. Sans swipe infini,
                sans surjeu, sans cirque.
              </p>

              <p className="mt-2 text-xs leading-relaxed text-slate-800 sm:text-[13px] text-center">
                Keefon est créée et hébergée en France, dans le cadre des lois
                françaises de protection de la vie privée (RGPD, CNIL, droits de
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
                  Inscription rapide. Tu gardes la main à chaque étape.
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Carte rappel période gratuite */}
        <FreeReminderCard />

        {/* Exemples de profils */}
        <ProfileTeaserBand />

        {/* Comment ça marche */}
        <section className="py-10">
          <div className="container mx-auto max-w-5xl px-4">
            <h2 className="text-xl font-semibold text-menuBtn sm:text-2xl">
              Comment ça marche&nbsp;?
            </h2>
            <div className="mt-6 grid gap-6 md:grid-cols-3">
              <article className="rounded-2xl border border-sky-200 bg-white/35 px-4 py-4 text-slate-900 shadow-sm backdrop-blur-[1px]">
                <h3 className="mb-2 text-sm font-semibold text-chatOuter sm:text-base">
                  1. Tu crées ton profil
                </h3>
                <h3 className="mb-2 text-sm font-semibold text-chatOuter sm:text-base">
                  2. Tu dis ce que tu cherches
                </h3>
                <h3 className="mb-2 text-sm font-semibold text-chatOuter sm:text-base">
                  3. Tu échanges simplement
                </h3>
              </article>
            </div>
          </div>
        </section>

        {/* Pourquoi Keefon */}
        <section className="py-10">
          <div className="container mx-auto max-w-5xl px-4">
            <h2 className="text-xl font-semibold text-menuBtn sm:text-2xl">
              Pourquoi Keefon est différent&nbsp;?
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
                Les échos et Keefon+ créent des ouvertures supplémentaires pour
                les profils Free. L&apos;abonnement Essentiel reste
                volontairement abordable pour aller plus loin sans exploser ton
                budget.
              </p>
            </div>
          </div>
        </section>

        {/* France */}
        <section className="py-10">
          <div className="container mx-auto max-w-5xl px-4">
            <h2 className="text-xl font-semibold text-menuBtn sm:text-2xl">
              Rencontrer en France, sans se perdre dans la masse
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-900 sm:text-base">
              Que tu sois en grande ville ou dans une petite commune, Keefon te
              permet d&apos;ouvrir des portes sans te perdre dans une marée de
              profils anonymes.
            </p>
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <article className="rounded-2xl border border-sky-200 bg-white/40 px-4 py-4 text-slate-900 shadow-sm backdrop-blur-[1px]">
                <h3 className="mb-2 text-sm font-semibold text-chatOuter sm:text-base">
                  Partout en France
                </h3>
                <p className="text-sm leading-relaxed">
                  Des membres de toute la France métropolitaine et d&apos;outre-mer.
                  À toi de choisir : proche de chez toi ou plus loin.
                </p>
              </article>

              <article className="rounded-2xl border border-sky-200 bg-white/40 px-4 py-4 text-slate-900 shadow-sm backdrop-blur-[1px]">
                <h3 className="mb-2 text-sm font-semibold text-chatOuter sm:text-base">
                  Ancré dans le réel
                </h3>
                <p className="text-sm leading-relaxed">
                  L&apos;objectif n&apos;est pas juste de matcher, mais de
                  pouvoir se voir en vrai : un café, une balade, un événement,
                  une activité partagée.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="py-10">
          <div className="container mx-auto max-w-5xl px-4">
            <h2 className="text-xl font-semibold text-menuBtn sm:text-2xl">
              Envie de rencontres plus humaines en France&nbsp;?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-900 sm:text-base">
              Keefon s&apos;adresse à celles et ceux qui préfèrent un espace
              plus calme, plus clair, plus respectueux que les applis
              classiques.
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

        {/* Footer légal discret */}
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
