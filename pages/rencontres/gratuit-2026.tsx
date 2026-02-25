/**
 * Fichier : pages/rencontres/gratuit-2026.tsx
 * Module : Pages publiques / SEO — Offre Gratuit 2026
 * Objectif : cibler "site de rencontre gratuit 2026", "messages gratuits", etc.
 */

import Head from "next/head";
import Link from "next/link";

/* ===========================  SEO (mots-clés & libellés)  =========================== */
const SEO = {
  title: "Site de rencontre gratuit en 2026 | rencontre 100% gratuit | Keefon",
  description:
    "Keefon est un site de rencontre français. Offre 2026 : inscription + messages gratuits pour rencontrer des personnes partout en France, sans swipe toxique. Voir les conditions et la durée de l’offre.",
  canonical: "https://www.keefon.com/rencontres/gratuit-2026",
  siteName: "Keefon",
  ogImage: "https://www.keefon.com/og/gratuit-2026.jpg", // optionnel : mets une image quand tu veux
  keywords: [
    "site de rencontre gratuit",
    "site de rencontre gratuit 2026",
    "rencontre gratuite",
    "rencontre gratuite 2026",
    "messages gratuits",
    "messagerie gratuite",
    "chat gratuit",
    "rencontre en ligne gratuite",
    "site de rencontre en france",
    "site de rencontre français",
    "rencontre sérieuse",
    "rencontres bienveillantes",
    "slow dating",
    "rencontre sans swipe",
    "dating gratuit",
  ].join(", "),
  breadcrumb: [
    { name: "Accueil", url: "https://www.keefon.com" },
    { name: "Rencontres", url: "https://www.keefon.com/rencontres" },
    { name: "Gratuit 2026", url: "https://www.keefon.com/rencontres/gratuit-2026" },
  ],
};

/* ===========================  Style & flags  =========================== */
const COLORS = {
  bannerGrad: "linear-gradient(180deg, #FFF273 0%, #FFE44B 100%)",
  paleGreen: "#59FF72",
};

const OFFER_2026 = true;

/* ===========================  Bandeau fixe (gratuit 2026)  =========================== */
function Offer2026TopBar() {
  if (!OFFER_2026) return null;

  return (
    <div
      role="status"
      aria-label="Offre 2026 Keefon : inscription et messages gratuits"
      className="fixed inset-x-0 top-0 z-[1000] w-full"
      style={{
        background: COLORS.bannerGrad,
        boxShadow: "0 8px 28px rgba(0,0,0,.22)",
      }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:py-4">
        <p className="m-0 flex-1 text-left font-extrabold leading-snug text-slate-900">
          <span className="block text-[14px] sm:text-[18px]">
            Offre 2026 Keefon :{" "}
            <span className="underline decoration-2 underline-offset-2">
              inscription + messages gratuits
            </span>
          </span>
          <span className="mt-0.5 block text-[11px] sm:text-[14px] font-semibold opacity-90">
            Pas de swipe toxique — des échanges vrais, respectueux, et une plateforme française.
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

function Offer2026TopBarSpacer() {
  if (!OFFER_2026) return null;
  return <div className="h-[88px] sm:h-[84px] w-full" />;
}

/* ===========================  Page  =========================== */
export default function Gratuit2026() {
  return (
    <>
      <Head>
        <title>{SEO.title}</title>
        <meta name="description" content={SEO.description} />
        <meta name="keywords" content={SEO.keywords} />
        <link rel="canonical" href={SEO.canonical} />

        {/* OpenGraph */}
        <meta property="og:title" content={SEO.title} />
        <meta property="og:description" content={SEO.description} />
        <meta property="og:url" content={SEO.canonical} />
        <meta property="og:site_name" content={SEO.siteName} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={SEO.ogImage} />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={SEO.title} />
        <meta name="twitter:description" content={SEO.description} />
        <meta name="twitter:image" content={SEO.ogImage} />

        {/* Breadcrumbs JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: SEO.breadcrumb.map((b, idx) => ({
                "@type": "ListItem",
                position: idx + 1,
                name: b.name,
                item: b.url,
              })),
            }),
          }}
        />
      </Head>

      <Offer2026TopBar />
      <Offer2026TopBarSpacer />

      <main className="min-h-screen bg-[#8FE7FF]">
        {/* HERO */}
        <section className="mx-auto max-w-5xl px-4 pt-10 pb-8">
          <div className="rounded-3xl bg-white/70 p-6 shadow-lg">
            <p className="m-0 inline-flex items-center rounded-full bg-lime-200 px-4 py-2 text-[12px] font-bold text-slate-900">
              Offre 2026 • inscription + messages gratuits
            </p>

            <h1 className="mt-4 text-[30px] sm:text-[44px] font-extrabold leading-tight text-slate-900">
              Site de rencontre gratuit en 2026
            </h1>

            <p className="mt-3 text-[14px] sm:text-[16px] text-slate-800">
              Keefon est un site de rencontre français axé sur des échanges vrais, respectueux et sans swipe toxique.
              En 2026, l’offre inclut <strong>l’inscription + les messages gratuits</strong> (voir conditions ci-dessous).
            </p>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <a
                href="/signup"
                className="rounded-full px-5 py-3 text-center text-[14px] font-bold text-slate-900 shadow transition hover:brightness-95"
                style={{ background: COLORS.paleGreen }}
              >
                Créer mon compte
              </a>

              <Link
                href="/rencontres/france"
                className="rounded-full bg-white px-5 py-3 text-center text-[14px] font-bold text-slate-900 shadow transition hover:brightness-95"
              >
                Voir les rencontres en France
              </Link>
            </div>
          </div>
        </section>

        {/* SECTIONS */}
        <section className="mx-auto max-w-5xl px-4 pb-10">
          <div className="grid gap-5">
            <div className="rounded-3xl bg-white/70 p-6 shadow">
              <h2 className="text-[18px] sm:text-[22px] font-extrabold text-slate-900">
                Ce qui est gratuit en 2026
              </h2>
              <ul className="mt-3 list-disc pl-5 text-slate-800">
                <li><strong>Inscription gratuite</strong> en 2026</li>
                <li><strong>Messages gratuits</strong> en 2026</li>
                <li>Une expérience plus “humaine” : échanges respectueux, profils protégés</li>
              </ul>
              <p className="mt-3 text-[13px] text-slate-700">
                Astuce SEO : ce bloc doit rester clair, court et vrai. Google + utilisateurs adorent quand c’est précis.
              </p>
            </div>

            <div className="rounded-3xl bg-white/70 p-6 shadow">
              <h2 className="text-[18px] sm:text-[22px] font-extrabold text-slate-900">
                Conditions (simple et transparent)
              </h2>
              <p className="mt-3 text-slate-800">
                L’offre “Gratuit 2026” couvre l’inscription et les messages sur la période 2026.
                Si tu veux, tu peux ajouter ici les conditions exactes (dates, limite éventuelle, etc.).
              </p>
              <p className="mt-3 text-slate-800">
                👉 Pour plus de contexte, tu peux aussi consulter la page{" "}
                <Link href="/rencontres/france" className="underline font-bold text-slate-900">
                  Rencontres en France
                </Link>
                .
              </p>
            </div>

            <div className="rounded-3xl bg-white/70 p-6 shadow">
              <h2 className="text-[18px] sm:text-[22px] font-extrabold text-slate-900">
                Rencontres par ville
              </h2>
              <p className="mt-3 text-slate-800">
                Keefon est un site national : tu peux rencontrer des personnes dans ta ville et autour.
                Découvre la page France, puis choisis ta ville.
              </p>
              <div className="mt-4">
                <Link
                  href="/rencontres/france"
                  className="inline-flex rounded-full bg-white px-5 py-3 text-[14px] font-bold text-slate-900 shadow transition hover:brightness-95"
                >
                  Accéder aux pages villes
                </Link>
              </div>
            </div>

            {/* FAQ */}
            <div className="rounded-3xl bg-white/70 p-6 shadow">
              <h2 className="text-[18px] sm:text-[22px] font-extrabold text-slate-900">
                FAQ — Site de rencontre gratuit 2026
              </h2>

              <details className="mt-4 rounded-2xl bg-white/70 p-4">
                <summary className="cursor-pointer font-extrabold text-slate-900">
                  Est-ce vraiment gratuit en 2026 ?
                </summary>
                <p className="mt-2 text-slate-800">
                  Oui : l’offre 2026 couvre l’inscription et les messages, selon les conditions affichées sur cette page.
                </p>
              </details>

              <details className="mt-3 rounded-2xl bg-white/70 p-4">
                <summary className="cursor-pointer font-extrabold text-slate-900">
                  Les messages sont-ils gratuits ?
                </summary>
                <p className="mt-2 text-slate-800">
                  Oui, pendant l’offre 2026 (inscription + messages gratuits).
                </p>
              </details>

              <details className="mt-3 rounded-2xl bg-white/70 p-4">
                <summary className="cursor-pointer font-extrabold text-slate-900">
                  Keefon est-il un site français ?
                </summary>
                <p className="mt-2 text-slate-800">
                  Oui, Keefon est une plateforme française de rencontres bienveillantes.
                </p>
              </details>

              <details className="mt-3 rounded-2xl bg-white/70 p-4">
                <summary className="cursor-pointer font-extrabold text-slate-900">
                  Où trouver les rencontres par ville ?
                </summary>
                <p className="mt-2 text-slate-800">
                  Sur la page{" "}
                  <Link href="/rencontres/france" className="underline font-bold text-slate-900">
                    Rencontres en France
                  </Link>
                  , tu peux accéder aux pages par ville.
                </p>
              </details>
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="mx-auto max-w-5xl px-4 pb-16">
          <div
            className="rounded-3xl p-6 shadow-lg"
            style={{ background: COLORS.bannerGrad }}
          >
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <p className="m-0 text-slate-900">
                <span className="block text-[16px] sm:text-[18px] font-extrabold">
                  Prêt(e) à tester Keefon ?
                </span>
                <span className="block text-[13px] sm:text-[14px] font-semibold opacity-90">
                  Offre 2026 : inscription + messages gratuits.
                </span>
              </p>
              <a
                href="/signup"
                className="rounded-full px-5 py-3 text-[14px] font-bold text-slate-900 shadow transition hover:brightness-95"
                style={{ background: COLORS.paleGreen }}
              >
                Créer un compte
              </a>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}