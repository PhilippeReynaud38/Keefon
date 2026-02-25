/**
 * Fichier : pages/rencontres/paris.tsx
 * Module : Pages publiques / SEO — Rencontres sur la zone Paris & Île-de-France
 *
 * Objectif :
 * - Page vitrine statique, cohérente avec les autres pages “villes”
 * - Contenu réellement spécifique à Paris (75) + Île-de-France (petite couronne / grande couronne)
 * - Ne pas promettre de fonctionnalités qui n’existent pas
 */

import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

/* ===========================  SEO  =========================== */
const CITY = {
  name: "Paris",
  slug: "paris",
  dept: "75",
  region: "Île-de-France",
};

const SEO = {
  title: `site de rencontre paris | meilleur site de rencontre | Keefon`,
  description:
    "Rencontre à Paris sur Keefon : profils à Paris et en Île-de-France, échanges respectueux, sans swipe toxique. Une approche plus humaine pour ceux qui veulent du réel.",
  canonical: `https://www.keefon.com/rencontres/${CITY.slug}`,
  siteName: "Keefon",
  ogImage: "https://www.keefon.com/og/rencontres-paris.jpg",
  keywords: [
    "rencontre paris",
    "rencontres paris",
    "sortir paris",
    "rencontre ile de france",
    "site de rencontre paris",
    "dating paris",
    "rencontres bienveillantes",
    "rencontre sans swipe",
    "keefon",
  ].join(", "),
  breadcrumb: [
    { name: "Accueil", url: "https://www.keefon.com" },
    { name: "Rencontres", url: "https://www.keefon.com/rencontres" },
    { name: "Paris", url: `https://www.keefon.com/rencontres/${CITY.slug}` },
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
      aria-label="Période gratuite en cours : accès gratuit et chat ouvert"
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
            — chat ouvert
          </span>
          <span className="mt-0.5 block text-[13px] sm:text-[15px] font-semibold opacity-90">
            Aucune carte bancaire demandée. Tu testes, tu vois si ça te va.
          </span>
        </p>

        <a
          href="/signup"
          aria-label="Créer un compte gratuitement"
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

/* ===========================  Carte rappel  =========================== */
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
                Accès 100% gratuit — chat ouvert.
              </p>
              <p className="m-0 mt-1 text-[13px] sm:text-[14px]">
                Tu peux créer ton profil, échanger, tester l’expérience sans carte bancaire.
              </p>
            </div>
            <a
              href="/signup"
              aria-label="Créer un compte gratuitement"
              title="Créer un compte gratuitement"
              className="rounded-full px-4 py-2 text-[13px] font-semibold text-slate-900 shadow transition transform-gpu hover:-translate-y-[1px] hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-slate-900/30 sm:px-5 sm:py-2.5 sm:text-[14px]"
              style={{ background: COLORS.paleGreen }}
            >
              Créer mon profil
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ===========================  Bandeau “exemples de profils” — Paris  =========================== */
function ProfileTeaserBand() {
  /**
   * ⚠️ Images à placer dans : /public/avatars_France/Paris/
   * - Alizee.png / Bilou.png / Anne.png / Eric.png
   *
   * Profils fictifs (illustration).
   */
  const profiles = [
    {
      pseudo: "Alizee",
      ageVille: "29 ans — Paris 11e",
      badges: ["Free"],
      phrase:
        "Entre le boulot et la vie sociale, je n’ai plus envie de swiper. Je préfère discuter avec intention, sans pression.",
      avatarSrc: "/avatars_France/Paris/Alizee.png",
      avatarAlt: "Profil fictif d'une femme à Paris (illustration).",
      priority: true,
    },
    {
      pseudo: "Bilou",
      ageVille: "34 ans — Paris / Petite couronne",
      badges: ["Essentiel"],
      phrase:
        "Je veux rencontrer quelqu’un sans y passer mes soirées. Ici, c’est plus simple : moins de bruit, plus de respect.",
      avatarSrc: "/avatars_France/Paris/Bilou.png",
      avatarAlt: "Profil fictif d'un homme à Paris (illustration).",
      priority: true,
    },
    {
      pseudo: "Anne",
      ageVille: "41 ans — Île-de-France",
      badges: ["Free"],
      phrase:
        "RER, trajets, enfants… j’avance à mon rythme. Je veux une appli qui respecte ça et qui ne pousse pas à la surconsommation.",
      avatarSrc: "/avatars_France/Paris/Anne.png",
      avatarAlt: "Profil fictif d'une femme en Île-de-France (illustration).",
      priority: false,
    },
    {
      pseudo: "Eric",
      ageVille: "48 ans — Paris",
      badges: ["Essentiel"],
      phrase:
        "Je bouge beaucoup. L’important : échanger clairement, se voir dans un lieu public, et garder une vibe simple.",
      avatarSrc: "/avatars_France/Paris/Eric.png",
      avatarAlt: "Profil fictif d'un homme à Paris (illustration).",
      priority: false,
    },
  ];

  return (
    <section className="py-6">
      <div className="container mx-auto max-w-5xl px-4">
        <p className="mt-2 text-[12px] leading-relaxed text-slate-700">
          Profils fictifs : ils illustrent des situations typiques à Paris / {CITY.region}. Rien de personnel n’est affiché.
        </p>

        <div className="mt-5 flex gap-4 overflow-x-auto pb-3 md:grid md:grid-cols-2 md:overflow-visible lg:grid-cols-4">
          {profiles.map((p) => (
            <article
              key={p.pseudo}
              className="group relative min-w-[260px] max-w-xs overflow-hidden rounded-3xl shadow-md"
            >
              <div className="relative h-72 w-full">
                <Image
                  src={p.avatarSrc}
                  alt={p.avatarAlt}
                  fill
                  className="object-cover object-[50%_42%]"
                  sizes="(min-width:1024px)25vw,(min-width:768px)33vw,80vw"
                  priority={Boolean(p.priority)}
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

/* ===========================  Composants  =========================== */
function SoftCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <article className="rounded-2xl border border-sky-200 bg-white/40 px-4 py-4 text-slate-900 shadow-sm backdrop-blur-[1px]">
      <h3 className="mb-2 text-sm font-semibold text-chatOuter sm:text-base">
        {title}
      </h3>
      <div className="text-sm leading-relaxed">{children}</div>
    </article>
  );
}

function CTA() {
  return (
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
      <Link
        href="/login"
        aria-label="Déjà inscrit ? Se connecter"
        title="Se connecter"
        className="inline-flex items-center justify-center rounded-full px-3 py-1 text-[11px] font-semibold text-slate-900 shadow transition transform-gpu hover:-translate-y-[1px] hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-slate-900/30"
        style={{
          background: COLORS.bannerGrad,
          border: "1px solid #F9E13A",
        }}
      >
        Se connecter
      </Link>
      <p className="text-xs text-slate-700">
        Inscription rapide. Tu gardes la main à chaque étape.
      </p>
    </div>
  );
}

/* ===========================  Page  =========================== */
export default function ParisRencontresPage() {
  const faq = [
    {
      q: "Keefon marche-t-il seulement à Paris intra-muros ?",
      a: "Non. La page “Paris” couvre aussi la réalité de la zone : petite couronne (92/93/94) et une partie de l’Île-de-France. Le but, c’est de rester cohérent avec les trajets (métro/RER) et les rencontres possibles dans la vraie vie.",
    },
    {
      q: "Est-ce qu’il y a du swipe infini comme sur les applis classiques ?",
      a: "Non. Keefon vise l’échange humain : moins de bruit, moins d’addiction, plus d’intention. Tu n’es pas “poussé” à scroller pendant des heures.",
    },
    {
      q: "Je suis en petite couronne : où organiser un premier rendez-vous ?",
      a: "Le plus simple : un lieu public et facile d’accès (un café, une place, un parc fréquenté), proche d’un transport. L’idée, c’est de réduire la friction (trajets) et de garder un cadre safe.",
    },
    {
      q: "Est-ce qu’il faut payer pour discuter ?",
      a: "Selon la période, l’accès peut être ouvert. Dans tous les cas, Keefon ne part pas du principe que “payer = exister”. L’objectif reste l’équité et la qualité des échanges.",
    },
    {
      q: "Comment je garde une expérience sûre (Paris / IDF) ?",
      a: "Premier rendez-vous en public, prévenir un proche, éviter de donner trop d’infos perso trop tôt, et signaler tout comportement douteux. Le bon sens d’abord.",
    },
    {
      q: "Je n’ai pas le temps : ça vaut le coup ?",
      a: "Justement. Paris, c’est souvent “agenda chargé + fatigue + trajets”. Une expérience plus calme et plus directe peut t’éviter de perdre ton temps dans des échanges sans intention.",
    },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://www.keefon.com/#website",
        name: SEO.siteName,
        url: "https://www.keefon.com",
        potentialAction: {
          "@type": "SearchAction",
          target: "https://www.keefon.com/recherche?q={search_term_string}",
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: SEO.breadcrumb.map((b, idx) => ({
          "@type": "ListItem",
          position: idx + 1,
          name: b.name,
          item: b.url,
        })),
      },
      {
        "@type": "WebPage",
        name: SEO.title,
        url: SEO.canonical,
        description: SEO.description,
        inLanguage: "fr-FR",
        isPartOf: { "@id": "https://www.keefon.com/#website" },
      },
      {
        "@type": "FAQPage",
        mainEntity: faq.map((x) => ({
          "@type": "Question",
          name: x.q,
          acceptedAnswer: { "@type": "Answer", text: x.a },
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

        <meta property="og:title" content={SEO.title} />
        <meta property="og:description" content={SEO.description} />
        <meta property="og:image" content={SEO.ogImage} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={SEO.siteName} />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={SEO.title} />
        <meta name="twitter:description" content={SEO.description} />
        <meta name="twitter:image" content={SEO.ogImage} />

        <script
          key="ld-json"
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

              <h1
                className="text-center text-3xl font-extrabold sm:text-4xl md:text-5xl"
                style={{
                  color: "#cdff58ff",
                  textShadow: "0 2px 6px rgba(0,0,0,0.25)",
                }}
              >
                Rencontres bienveillantes à {CITY.name} et en {CITY.region}
              </h1>

              <p className="mt-3 text-center text-sm leading-relaxed text-slate-900 sm:text-base">
                À {CITY.name}, tu peux croiser des milliers de profils… et pourtant te sentir seul.
                Keefon est fait pour les gens qui veulent{" "}
                <span className="font-semibold">moins de bruit</span>,{" "}
                <span className="font-semibold">plus d’intention</span> et des échanges
                qui se traduisent en rencontres réelles (sans “shopping humain”).
              </p>

              <p className="mt-2 text-center text-xs leading-relaxed text-slate-800 sm:text-[13px]">
                Plateforme française, pensée dans le cadre des lois françaises de protection de la vie privée (RGPD).
              </p>

              <CTA />
            </div>
          </div>
        </header>

        <FreeReminderCard />
        <ProfileTeaserBand />

        {/* Pourquoi ça marche bien à Paris */}
        <section className="py-10">
          <div className="container mx-auto max-w-5xl px-4">
            <h2 className="text-xl font-semibold text-menuBtn sm:text-2xl">
              À Paris, le vrai problème c’est le bruit — pas le manque de monde
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-900 sm:text-base">
              Entre le rythme, les trajets, et les applis qui poussent à swiper, tu peux vite perdre du temps.
              Ici, on simplifie : une expérience plus calme, plus lisible, plus humaine.
            </p>

            <div className="mt-6 grid gap-6 md:grid-cols-3">
              <SoftCard title="Moins d’addiction, plus d’intention">
                Pas de scroll infini. Tu viens pour échanger et rencontrer, pas pour te faire happer par l’écran.
              </SoftCard>
              <SoftCard title="Compatible “métro / RER / agenda chargé”">
                On pense “réalité parisienne” : trajets, dispo limitées, fatigue. L’idée : aller au plus simple.
              </SoftCard>
              <SoftCard title="Respect & modération">
                Tu dois pouvoir dire non, poser des limites, et signaler ce qui ne va pas. Sans discussion.
              </SoftCard>
            </div>
          </div>
        </section>

        {/* Comment ça marche */}
        <section className="py-10">
          <div className="container mx-auto max-w-5xl px-4">
            <h2 className="text-xl font-semibold text-menuBtn sm:text-2xl">
              Comment ça marche à {CITY.name} ?
            </h2>
            <div className="mt-6 grid gap-6 md:grid-cols-3">
              <SoftCard title="1) Tu crées ton profil">
                Simple, clair, sans te forcer à raconter ta vie. Tu gardes la main sur ce que tu partages.
              </SoftCard>
              <SoftCard title={`2) Tu indiques ta zone (${CITY.name} / IDF)`}>
                Paris intra-muros, petite couronne, ou plus loin : le but c’est que ça reste logique pour se voir.
              </SoftCard>
              <SoftCard title="3) Tu échanges, puis tu proposes un rendez-vous public">
                L’étape la plus saine : une rencontre courte dans un lieu public (café, parc fréquenté, expo).
              </SoftCard>
            </div>
          </div>
        </section>

        {/* Idées de rendez-vous */}
        <section className="py-10">
          <div className="container mx-auto max-w-5xl px-4">
            <h2 className="text-xl font-semibold text-menuBtn sm:text-2xl">
              3 idées de premier rendez-vous à {CITY.name} (simple & safe)
            </h2>

            <div className="mt-6 grid gap-6 md:grid-cols-3">
              <SoftCard title="Café + marche (30–60 min)">
                Pratique : tu peux écourter si le feeling ne passe pas, ou prolonger si c’est fluide.
                Exemple : un café puis une balade dans un quartier vivant.
              </SoftCard>
              <SoftCard title="Parc fréquenté">
                Calme sans être isolé. Parfait pour parler vraiment, sans musique trop forte ni pression.
                (Luxembourg, Buttes-Chaumont, Monceau, Montsouris…)
              </SoftCard>
              <SoftCard title="Expo / musée / lieu culturel">
                Tu as un “support” de conversation, ça évite les blancs, et ça reste public.
                Objectif : un moment léger, pas un date “interrogatoire”.
              </SoftCard>
            </div>

            <div className="mt-6 rounded-2xl bg-white/30 px-4 py-3 text-[11px] text-slate-900 shadow-sm backdrop-blur-[2px]">
              Priorité : lieu public + accès simple + durée courte au début. Paris donne vite l’illusion qu’il faut “faire grand”.
              Non : tu fais simple, tu fais réel.
            </div>
          </div>
        </section>

        {/* Quartiers & ambiances */}
        <section className="py-10">
          <div className="container mx-auto max-w-5xl px-4">
            <h2 className="text-xl font-semibold text-menuBtn sm:text-2xl">
              Quartiers & ambiances : choisis un cadre qui te ressemble
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-900 sm:text-base">
              À {CITY.name}, le “meilleur” endroit n’existe pas. Par contre, le bon cadre peut rendre un rendez-vous plus naturel.
              Voici des ambiances typiques, pour t’inspirer.
            </p>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <SoftCard title="Le Marais (vivant, central)">
                Pratique si vous êtes à l’aise dans un quartier animé et que vous voulez un plan “simple, accessible”.
              </SoftCard>
              <SoftCard title="Canal Saint-Martin (balade + cafés)">
                Bien pour un date fluide : marche + pause. Parfait si vous aimez parler en bougeant.
              </SoftCard>
              <SoftCard title="Montmartre (romantique, mais parfois bondé)">
                Très beau… mais choisis un horaire calme. Idéal si tu veux une vibe “carte postale” sans stress.
              </SoftCard>
              <SoftCard title="Batignolles / 17e (plus posé)">
                Ambiance plus tranquille, souvent plus confortable pour discuter sans sur-stimulation.
              </SoftCard>
              <SoftCard title="Quartier Latin / Saint-Germain (classique)">
                Très “Paris”, avec des options faciles (café, librairie, expo). Bien si vous aimez la culture.
              </SoftCard>
              <SoftCard title="Belleville (authentique, vivant)">
                Si vous aimez les quartiers qui bougent, sans chercher le “date instagrammable”.
              </SoftCard>
            </div>
          </div>
        </section>

        {/* Petite couronne */}
        <section className="py-10">
          <div className="container mx-auto max-w-5xl px-4">
            <h2 className="text-xl font-semibold text-menuBtn sm:text-2xl">
              Petite couronne : le bon plan, c’est de réduire les trajets
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-900 sm:text-base">
              Si tu es en 92 / 93 / 94, ne te piège pas à “tout faire à Paris”.
              Un premier rendez-vous peut très bien se faire près d’une station, dans un centre-ville local,
              ou dans un parc fréquenté proche de chez vous.
            </p>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <SoftCard title="Règle simple : pas de galère logistique">
                Un date qui commence par 45 minutes de transport + stress = mauvais départ.
                Choisissez un point neutre, accessible pour les deux.
              </SoftCard>
              <SoftCard title="Ça doit rester safe, pas isolé">
                Lieu public, fréquenté, et facile à quitter. C’est basique, mais c’est ce qui marche.
              </SoftCard>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-10">
          <div className="container mx-auto max-w-5xl px-4">
            <h2 className="text-xl font-semibold text-menuBtn sm:text-2xl">
              FAQ — Rencontres à {CITY.name}
            </h2>

            <div className="mt-6 space-y-3">
              {faq.map((item) => (
                <details
                  key={item.q}
                  className="rounded-2xl border border-sky-200 bg-white/40 px-4 py-3 text-slate-900 shadow-sm backdrop-blur-[1px]"
                >
                  <summary className="cursor-pointer list-none text-sm font-semibold text-chatOuter sm:text-base">
                    {item.q}
                  </summary>
                  <p className="mt-2 text-sm leading-relaxed">{item.a}</p>
                </details>
              ))}
            </div>

            <CTA />
          </div>
        </section>

        
        {/* Bloc local Paris : quartiers, rythme et occasions de rencontre (texte unique) */}
        <section className="py-6">
          <div className="mx-auto max-w-5xl px-4">
            <div className="rounded-2xl bg-white/30 px-4 py-4 text-slate-900 shadow-sm backdrop-blur-[2px]">
              <h2 className="text-sm font-semibold text-chatOuter sm:text-base">
                Paris : quartiers, rythme et occasions de rencontre
              </h2>

              <p className="mt-2 text-[11px] leading-relaxed">
                À Paris, le vrai défi n’est pas de “trouver du monde”, mais de
                rester simple au milieu du bruit : trop d’options, trop de
                sollicitations. La bonne approche : un échange clair, puis un
                rendez-vous public court, dans une zone facile (métro).
              </p>

              <h3 className="mt-4 text-xs font-semibold text-chatOuter">
                Des endroits pratiques pour se voir
              </h3>
              <ul className="mt-1 list-disc space-y-1 pl-4 text-[11px] leading-relaxed">
                <li>
                  <strong>Canal Saint-Martin</strong> : balade simple, cafés, très
                  fréquenté — idéal pour un premier rendez-vous “léger”.
                </li>
                <li>
                  <strong>Le Marais</strong> : central, facile à rejoindre, beaucoup
                  d’options sans se perdre.
                </li>
                <li>
                  <strong>Bastille</strong> : point de repère évident, pratique si vous
                  bougez beaucoup.
                </li>
                <li>
                  <strong>Montmartre</strong> : cadre agréable, mais privilégiez un
                  lieu précis (sinon on se disperse).
                </li>
                <li>
                  <strong>Grands parcs</strong> (Buttes-Chaumont, Luxembourg…) : option
                  “safe” et public pour discuter au calme.
                </li>
              </ul>

              <h3 className="mt-4 text-xs font-semibold text-chatOuter">
                Activités qui créent du lien (sans pression)
              </h3>
              <p className="mt-1 text-[11px] leading-relaxed">
                Sport, danse, escalade, clubs, assos, ateliers (langues, photo,
                cuisine), expos… À Paris, se rencontrer via une activité fait gagner
                du temps : la discussion vient “en faisant”, et on évite la
                surconsommation de conversations.
              </p>

              <div className="mt-4 space-y-2 text-[11px] leading-relaxed">
                <details className="rounded-xl bg-white/35 px-3 py-2 shadow-sm">
                  <summary className="cursor-pointer font-semibold text-chatOuter">
                    Où proposer un premier rendez-vous simple à Paris ?
                  </summary>
                  <p className="mt-1">
                    Un café près d’un métro évident (Marais/Bastille) ou une balade
                    courte au Canal : public, clair, facile à écourter.
                  </p>
                </details>

                <details className="rounded-xl bg-white/35 px-3 py-2 shadow-sm">
                  <summary className="cursor-pointer font-semibold text-chatOuter">
                    Comment éviter de “se perdre” dans Paris ?
                  </summary>
                  <p className="mt-1">
                    Fixez un quartier et un point de repère précis. Un rendez-vous
                    simple vaut mieux qu’un plan trop ambitieux.
                  </p>
                </details>

                <details className="rounded-xl bg-white/35 px-3 py-2 shadow-sm">
                  <summary className="cursor-pointer font-semibold text-chatOuter">
                    Et si on est en petite couronne ?
                  </summary>
                  <p className="mt-1">
                    Choisissez un point “pivot” (RER/métro) pour limiter les trajets.
                    L’objectif : se voir facilement, et pouvoir se revoir.
                  </p>
                </details>

                <details className="rounded-xl bg-white/35 px-3 py-2 shadow-sm">
                  <summary className="cursor-pointer font-semibold text-chatOuter">
                    Une idée d’activité “facile” pour briser la glace ?
                  </summary>
                  <p className="mt-1">
                    Expo ou balade parc + café : vous avez un sujet, un cadre, et ça
                    enlève la pression du face-à-face.
                  </p>
                </details>
              </div>
            </div>
          </div>
        </section>


{/* Liens internes */}
        <section className="py-6">
          <div className="mx-auto max-w-5xl px-4">
            <div className="rounded-2xl bg-white/30 px-4 py-3 text-[11px] text-slate-800 shadow-sm backdrop-blur-[2px]">
              <p className="mb-2">
                Vue d’ensemble :{" "}
                <Link
                  href="/rencontres/france"
                  className="font-semibold underline-offset-2 hover:underline"
                >
                  rencontres en France
                </Link>
                .         </p>
            </div>
          </div>
        </section>

        {/* Footer légal */}
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
