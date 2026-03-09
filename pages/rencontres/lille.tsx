/**
 * Fichier : pages/rencontres/lille.tsx
 * Module : Pages publiques / SEO — Rencontres sur la zone Lille / métropole lilloise
 *
 * Objectif :
 * - Page vitrine statique SEO “ville”, réellement spécifique à Lille (59) + Métropole Européenne de Lille (MEL)
 * - Même logique que les autres pages /rencontres/* : simple, lisible, maintenable
 * - Ne pas promettre des fonctionnalités inexistantes (pas de claims techniques douteux)
 *
 * Notes :
 * - Les “profils” affichés ici sont fictifs (illustrations) : aucun contenu personnel réel.
 * - Place les images dans : /public/avatars_France/Lille/
 */

import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

/* ===========================  SEO  =========================== */
const CITY = {
  name: "Lille",
  slug: "lille",
  dept: "59",
  departmentName: "Nord",
  region: "Hauts-de-France",
  metro: "métropole lilloise",
};

const SEO = {
  title: `Rencontre ${CITY.name} (${CITY.dept}) | Site de rencontres bienveillantes et gratuit à ${CITY.name}`,
  description:
    "Rencontre à Lille bienveillantes et gratuit  échanges respectueux, sans swipe infini. Une approche plus humaine pour celles et ceux qui veulent du réel.",
  canonical: `https://www.keefon.com/rencontres/${CITY.slug}`,
  siteName: "Keefon",
  ogImage: "https://www.keefon.com/og/rencontres-lille.jpg",
  keywords: [
    "site de rencontre lille",
    "rencontre sans swipe",
    "rencontres bienveillantes",
  ].join(", "),
  breadcrumb: [
    { name: "Accueil", url: "https://www.keefon.com" },
    { name: "Rencontres", url: "https://www.keefon.com/rencontres" },
    { name: "Lille", url: `https://www.keefon.com/rencontres/${CITY.slug}` },
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
           Offre lancement Keefon : gratuité du site jusqu'à fin 2026 pour les 2000 premiers inscrit{" "}

            — chat ouvert
          </span>
          <span className="mt-0.5 block text-[13px] sm:text-[15px] font-semibold opacity-90">
       Aucune carte bancaire demandée, chat et échanges illimités pendant la période d'ouverture — et bien sûr, nous espérons que tu auras trouvé ta moitié bien avant, et que le bonheur t'accompagne.
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
                Offre lancement Keefon : gratuité du site jusqu'à fin 2026 pour les 2000 premiers inscrit
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

/* ===========================  Bandeau “exemples de profils” — Lille  =========================== */
function ProfileTeaserBand() {
  /**
   * ⚠️ Place les images dans : /public/avatars_France/Lille/
   * Noms simples (sans accents, pas d’espaces) :
   * - Lea.png / Maxime.png / Camille.png / Romain.png
   */
  const profiles = [
    {
      pseudo: "Valérie",
      ageVille: "52 ans — Lille",
      badges: ["Essentiel"],
      phrase:
        "Je sors beaucoup au resto et au théâtre, mais je n’aime pas les applis agressives. Ici je peux échanger calmement.",
      avatarSrc: "/avatars_France/Lille/Valérie.png",
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
      avatarSrc: "/avatars_France/Lille/Gaëlle.png",
      avatarAlt:
        "Profil fictif Gaelle_Nuit (jeune femme souriante dans une rue animée le soir)",
    },
    {
      pseudo: "Rémi",
      ageVille: "31 ans — Lille",
      badges: ["Essentiel"],
      phrase:
        "Entre les friteries, les concerts et les potes, j’avais envie d’un endroit plus simple pour faire des rencontres, ici c’est très différent des autres sites.",
      avatarSrc: "/avatars_France/Lille/Rémi.png",
      avatarAlt: "Profil fictif Remi (homme souriant devant un snack lumineux)",
    },
  ];

  return (
    <section className="py-6">
      <div className="container mx-auto max-w-5xl px-4">
        <p className="mt-2 text-[12px] leading-relaxed text-slate-700">
          Profils illustrant des situations typiques à Lille / {CITY.metro}. Rien de personnel n’est affiché, ce sont tous des Profils fictifs.
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

/* ===========================  Petits composants  =========================== */
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
export default function LilleRencontresPage() {
  const faq = [
    {
      q: "Keefon, c’est uniquement Lille centre ?",
      a: "Non. La page “Lille” couvre aussi la métropole lilloise (MEL) : Roubaix, Tourcoing, Villeneuve-d’Ascq, Marcq-en-Barœul, Croix… L’idée : rester cohérent avec les trajets (métro / tram / TER) et les rencontres possibles dans la vraie vie.",
    },
    {
      q: "Est-ce qu’il y a du swipe infini comme sur les applis classiques ?",
      a: "Non. Keefon vise l’échange humain : moins de bruit, moins d’addiction, plus d’intention. Tu n’es pas “poussé” à scroller pendant des heures.",
    },
    {
      q: "Où organiser un premier rendez-vous à Lille, sans pression ?",
      a: "Le plus simple : un lieu public et facile d’accès. Exemple : Grand’Place / Vieux-Lille (café + marche), la Citadelle (balade), ou un musée (Palais des Beaux-Arts / LaM).",
    },
    {
      q: "Est-ce qu’il faut payer pour discuter ?",
      a: "Selon la période, l’accès peut être ouvert. Dans tous les cas, Keefon ne part pas du principe que “payer = exister”. L’objectif reste l’équité et la qualité des échanges.",
    },
    {
      q: "Comment garder une expérience sûre (Lille / métropole) ?",
      a: "Premier rendez-vous en public, prévenir un proche, éviter de donner trop d’infos perso trop tôt, et signaler tout comportement douteux. Le bon sens d’abord.",
    },
    {
      q: "Je suis très occupé : est-ce que ça vaut le coup ?",
      a: "Oui si tu veux éviter de perdre du temps : ici l’approche est plus calme et plus directe. Tu échanges mieux, et tu passes plus vite au réel.",
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
                Rencontres bienveillantes à {CITY.name} et dans la {CITY.metro},  c'est un site de rencontre gratuit
              </h1>

              <p className="mt-3 text-center text-sm leading-relaxed text-slate-900 sm:text-base">
                À {CITY.name}, il y a du monde — mais aussi beaucoup de fatigue, de bruit et de “matching” qui ne mène à rien.
                Keefon est fait pour les gens qui veulent{" "}
                <span className="font-semibold">moins de surconsommation</span>,{" "}
                <span className="font-semibold">plus d’intention</span> et des échanges
                qui se traduisent en rencontres réelles (sans pression inutile).
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

        {/* Pourquoi ça marche bien à Lille */}
        <section className="py-10">
          <div className="container mx-auto max-w-5xl px-4">
            <h2 className="text-xl font-semibold text-menuBtn sm:text-2xl">
              À Lille, le vrai enjeu : du concret, sans bruit
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-900 sm:text-base">
              Lille et sa métropole ont une vie sociale dense (bars, concerts, quartiers vivants),
              mais les applis classiques te poussent souvent à “consommer” des profils.
              Ici, on simplifie : une expérience plus calme, plus lisible, plus humaine.
            </p>

            <div className="mt-6 grid gap-6 md:grid-cols-3">
              <SoftCard title="Moins d’addiction, plus d’intention">
                Pas de scroll infini. Tu viens pour échanger et rencontrer, pas pour passer tes soirées à swiper.
              </SoftCard>
              <SoftCard title="Compatible métro / tram / TER / V’Lille">
                La réalité locale : déplacements rapides si c’est bien choisi, galère si c’est mal pensé. On privilégie le simple.
              </SoftCard>
              <SoftCard title="Respect & limites claires">
                Tu dois pouvoir dire non, poser un cadre, et signaler ce qui ne va pas. Sans débat.
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
              <SoftCard title={`2) Tu indiques ta zone (${CITY.name} / métropole)`}>
                Lille centre, Vieux-Lille, Vauban, Wazemmes… ou la MEL (Roubaix, Tourcoing, Villeneuve-d’Ascq) : l’important, c’est de rester réaliste.
              </SoftCard>
              <SoftCard title="3) Tu échanges, puis tu proposes un rendez-vous public">
                Une rencontre courte, dans un lieu public (café, parc fréquenté, musée). Simple, safe, efficace.
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
              <SoftCard title="Grand’Place + Vieux-Lille (45–60 min)">
                Café, puis petite balade. Le format est parfait : tu peux écourter si besoin, ou prolonger si ça se passe bien.
              </SoftCard>
              <SoftCard title="Citadelle / Vauban (balade facile)">
                Un classique : espace ouvert, fréquenté, agréable. Idéal pour parler naturellement sans bruit.
              </SoftCard>
              <SoftCard title="Musée / expo (Palais des Beaux-Arts ou LaM)">
                Tu as un support de conversation (œuvres, expo), ça évite les blancs, et le cadre reste public.
              </SoftCard>
            </div>

            <div className="mt-6 rounded-2xl bg-white/30 px-4 py-3 text-[11px] text-slate-900 shadow-sm backdrop-blur-[2px]">
              Objectif : lieu public + accès simple + durée courte au début. À Lille, ça marche très bien (tu peux toujours prolonger après).
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
              Lille a plusieurs “vibes”. Le bon cadre rend un rendez-vous plus simple, plus naturel. Voici des ambiances typiques.
            </p>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <SoftCard title="Vieux-Lille (central, charmant)">
                Idéal pour un café + marche. Cadre joli, facile d’accès, beaucoup d’options pour s’adapter au moment.
              </SoftCard>
              <SoftCard title="Wazemmes (vivant, authentique)">
                Parfait si tu veux un date plus “vrai” : marché, petites adresses, ambiance animée.
              </SoftCard>
              <SoftCard title="Vauban / Esquermes (posé, étudiant)">
                Plus calme. Pratique pour se poser et discuter sans être noyé dans le bruit.
              </SoftCard>
              <SoftCard title="Euralille / Lille-Centre (pratique)">
                Bien si vous venez de deux côtés différents de la métropole : transports faciles, points de rendez-vous simples.
              </SoftCard>
              <SoftCard title="Saint-So / Jean-Baptiste Lebas (décontracté)">
                Ambiance cool, sans se prendre au sérieux. Bon pour un premier rendez-vous léger.
              </SoftCard>
              <SoftCard title="Roubaix / Tourcoing (métropole)">
                Si vous êtes côté MEL, rien n’oblige à “tout faire à Lille”. Un point neutre proche d’un transport, et c’est parfait.
              </SoftCard>
            </div>
          </div>
        </section>

        {/* Métropole / logistique */}
        <section className="py-10">
          <div className="container mx-auto max-w-5xl px-4">
            <h2 className="text-xl font-semibold text-menuBtn sm:text-2xl">
              Métropole lilloise : le bon plan, c’est de réduire les trajets
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-900 sm:text-base">
              Lille, c’est “petit” sur une carte, mais les trajets peuvent devenir un tue-l’amour si c’est mal choisi.
              Choisissez un point neutre, accessible, et gardez un format court au début.
            </p>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <SoftCard title="Règle simple : pas de galère logistique">
                Un date qui commence par stress + correspondances + retard = mauvais départ. Point neutre, accès facile pour les deux.
              </SoftCard>
              <SoftCard title="Toujours public, jamais isolé">
                Lieu fréquenté, facile à quitter. C’est basique, mais c’est ce qui protège et ce qui marche.
              </SoftCard>
            </div>

            <div className="mt-6 rounded-2xl bg-white/30 px-4 py-3 text-[11px] text-slate-900 shadow-sm backdrop-blur-[2px]">
              Bonus : Lille est proche de la Belgique (Tournai, Courtrai). Si vous êtes frontaliers, soyez juste clairs sur la distance et la fréquence possible des rencontres.
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

        
        {/* Bloc local Lille : quartiers, rythme et occasions de rencontre (texte unique) */}
        <section className="py-6">
          <div className="mx-auto max-w-5xl px-4">
            <div className="rounded-2xl bg-white/30 px-4 py-4 text-slate-900 shadow-sm backdrop-blur-[2px]">
              <h2 className="text-sm font-semibold text-chatOuter sm:text-base">
                Lille : quartiers, rythme et occasions de rencontre
              </h2>

              <p className="mt-2 text-[11px] leading-relaxed">
                Lille et la MEL sont très “sociales”, mais on peut vite se
                fatiguer des applis bruyantes. Le plus efficace, c’est de rester
                simple : quelques messages utiles, puis un rendez-vous public
                facile à rejoindre (métro, tram, centre).
              </p>

              <h3 className="mt-4 text-xs font-semibold text-chatOuter">
                Des endroits pratiques pour se voir
              </h3>
              <ul className="mt-1 list-disc space-y-1 pl-4 text-[11px] leading-relaxed">
                <li>
                  <strong>Vieux-Lille</strong> : cafés, rues agréables, ambiance
                  idéale pour un premier verre.
                </li>
                <li>
                  <strong>République / Beaux-Arts</strong> : central, simple à
                  trouver, parfait pour une balade courte.
                </li>
                <li>
                  <strong>Wazemmes</strong> : marché, vie de quartier, bonne
                  option “simple &amp; vivante”.
                </li>
                <li>
                  <strong>Vauban / Citadelle</strong> : balade facile, public,
                  pratique pour parler au calme.
                </li>
                <li>
                  <strong>Métropole</strong> (Roubaix, Tourcoing, Villeneuve-d’Ascq…)
                  : choisissez un point “pivot” métro/tram pour rester fluide.
                </li>
              </ul>

              <h3 className="mt-4 text-xs font-semibold text-chatOuter">
                Activités qui rapprochent naturellement
              </h3>
              <p className="mt-1 text-[11px] leading-relaxed">
                Sport, danse, escalade, running à la Citadelle, ateliers,
                associations, sorties culturelles… Ce sont des contextes où tu
                rencontres sans pression, et où la discussion vient naturellement
                (plutôt que “matcher pour matcher”).
              </p>

              <div className="mt-4 space-y-2 text-[11px] leading-relaxed">
                <details className="rounded-xl bg-white/35 px-3 py-2 shadow-sm">
                  <summary className="cursor-pointer font-semibold text-chatOuter">
                    Où proposer un premier rendez-vous simple à Lille ?
                  </summary>
                  <p className="mt-1">
                    Un café Vieux-Lille, ou une balade République → Beaux-Arts :
                    public, central, facile à écourter si besoin.
                  </p>
                </details>

                <details className="rounded-xl bg-white/35 px-3 py-2 shadow-sm">
                  <summary className="cursor-pointer font-semibold text-chatOuter">
                    Et si on vit loin (Roubaix / Tourcoing / Villeneuve) ?
                  </summary>
                  <p className="mt-1">
                    Prenez un point accessible métro/tram (centre, République,
                    Euralille). Le but : se voir sans friction, et pouvoir se
                    revoir facilement.
                  </p>
                </details>

                <details className="rounded-xl bg-white/35 px-3 py-2 shadow-sm">
                  <summary className="cursor-pointer font-semibold text-chatOuter">
                    Comment éviter les échanges qui n’aboutissent jamais ?
                  </summary>
                  <p className="mt-1">
                    Après quelques messages utiles, propose un plan simple (café
                    public). Si ça n’avance jamais, tu passes à autre chose.
                  </p>
                </details>

                <details className="rounded-xl bg-white/35 px-3 py-2 shadow-sm">
                  <summary className="cursor-pointer font-semibold text-chatOuter">
                    Une activité “facile” pour briser la glace ?
                  </summary>
                  <p className="mt-1">
                    Marché de Wazemmes + café, ou balade Citadelle : tu as un
                    cadre, un sujet, et ça enlève la pression.
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
                .
              </p>

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
