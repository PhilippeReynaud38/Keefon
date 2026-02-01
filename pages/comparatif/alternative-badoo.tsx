import Head from "next/head";
import Link from "next/link";

/**
 * Page article SEO
 * URL: /comparatif/alternative-badoo
 * Objectif: capter les requêtes "alternative à Badoo" sans spam, sans texte caché.
 */

const SEO = {
  title: "Alternative à Badoo : Keefon, rencontre sans swipe",
  description:
    "Vous cherchez une alternative à Badoo ? Découvrez Keefon : une plateforme indépendante de rencontres sans swipe, pensée pour des échanges plus humains, clairs et respectueux.",
  canonical: "https://www.keefon.com/comparatif/alternative-badoo",
  ogImage: "https://www.keefon.com/og/alternative-badoo.jpg",
};

export default function AlternativeBadooPage() {
  const faq = [
    {
      q: "Keefon est-il affilié à Badoo ?",
      a: "Non. Keefon est indépendant et ne revendique aucune association avec Badoo."
    },
    {
      q: "Keefon fonctionne-t-il partout en France ?",
      a: "Oui : Keefon propose des pages par villes et une navigation pensée pour la recherche locale en France."
    },
    {
      q: "Comment la modération fonctionne ?",
      a: "Vous pouvez signaler, filtrer et gérer les profils/interactions qui vous interpellent. L’objectif : garder un espace respectueux."
    },
    {
      q: "Keefon est-il gratuit ?",
      a: "Oui pendant la période d’ouverture : gratuit jusqu’à fin 2026 pour les 2 000 premiers inscrits (selon conditions)."
    },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: SEO.title,
    description: SEO.description,
    url: SEO.canonical,
    isPartOf: {
      "@type": "WebSite",
      name: "Keefon",
      url: "https://www.keefon.com",
    },
  };

  return (
    <>
      <Head>
        <title>{SEO.title}</title>
        <meta name="description" content={SEO.description} />
        <link rel="canonical" href={SEO.canonical} />

        <meta property="og:type" content="website" />
        <meta property="og:title" content={SEO.title} />
        <meta property="og:description" content={SEO.description} />
        <meta property="og:url" content={SEO.canonical} />
        <meta property="og:image" content={SEO.ogImage} />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={SEO.title} />
        <meta name="twitter:description" content={SEO.description} />
        <meta name="twitter:image" content={SEO.ogImage} />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </Head>

      <main className="min-h-screen bg-gradient-to-b from-sky-100 via-sky-50 to-sky-100">
        <div className="mx-auto max-w-5xl px-4 py-10">
          {/* Breadcrumbs */}
          <nav className="text-[12px] text-slate-600 mb-4">
            <Link href="/" className="hover:underline">
              Accueil
            </Link>
            <span className="mx-1">/</span>
            <span className="text-slate-800">Alternative à Badoo</span>
          </nav>

          {/* HERO */}
          <header className="rounded-3xl border border-sky-200/60 bg-slate-50/60/70 p-6 sm:p-10 shadow-sm">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
              Alternative à Badoo : une approche sans swipe
            </h1>

            <p className="mt-4 text-base sm:text-lg text-slate-700 leading-relaxed max-w-3xl">
              Vous cherchez une alternative à Badoo ? Si vous voulez rencontrer près de chez vous sans vous perdre dans trop d’options, Keefon mise sur une approche sans swipe, plus claire, et centrée sur la qualité des échanges.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-full bg-lime-400 px-5 py-2.5 text-sm font-semibold text-slate-900 shadow-sm hover:brightness-95"
              >
                Créer mon profil
              </Link>

              <Link
                href="/rencontres/france"
                className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white/80 px-5 py-2.5 text-sm font-semibold text-slate-900 hover:bg-white"
              >
                Voir les villes en France
              </Link>
            </div>

            <div className="mt-4 text-[12px] text-slate-600">
              Marques citées à titre d’exemple : Meetic, Tinder, Badoo, Bumble. Keefon est indépendant et ne revendique aucune association avec ces marques.
            </div>
          </header>

          {/* Offre */}
          <section className="mt-8">
            <div className="rounded-2xl border border-[#E7D856] bg-[#F6E97A]/40 p-5 sm:p-6">
              <div className="font-bold text-slate-900">Offre de lancement</div>
              <p className="mt-1 text-sm text-slate-800 leading-relaxed">
                Gratuité jusqu’à fin 2026 pour les <strong>2 000 premiers inscrits</strong> (selon conditions en vigueur).
                <br />
                Et quand un abonnement est proposé, il est pensé pour rester <strong>abordable</strong>.
              </p>
            </div>
          </section>

          {/* Comparatif */}
          <section className="mt-10">
            <h2 className="text-2xl font-extrabold text-slate-900">Comparaison rapide</h2>
            <p className="mt-2 text-sm text-slate-700">
              Une comparaison volontairement générale (les fonctionnalités exactes évoluent selon les services).
            </p>

            <div className="mt-4 rounded-2xl border border-[#E7D856] bg-[#F6E97A]/30 p-4 sm:p-5">
              <div className="grid grid-cols-2 gap-x-4 text-sm font-semibold text-slate-900">
                <div>Badoo ↔ Keefon</div>
                <div className="text-right">Services populaires</div>
              </div>

              <div className="mt-2">
            <div className="py-4 border-t border-slate-200/60">
              <div className="flex justify-center">
                <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-[#F6E97A] text-[12px] font-semibold text-slate-900 border border-[#E7D856] shadow-[0_1px_0_rgba(0,0,0,.04)]">
                  Découverte
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-x-4 text-[13px] leading-relaxed">
                <div className="text-slate-900">Sans swipe</div>
                <div className="text-slate-700 text-right">Varie selon la plateforme</div>
              </div>
            </div>
            <div className="py-4 border-t border-slate-200/60">
              <div className="flex justify-center">
                <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-[#F6E97A] text-[12px] font-semibold text-slate-900 border border-[#E7D856] shadow-[0_1px_0_rgba(0,0,0,.04)]">
                  Tempo / pression
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-x-4 text-[13px] leading-relaxed">
                <div className="text-slate-900">Moins de pression, échanges posés</div>
                <div className="text-slate-700 text-right">Plus “zapping” / décisions rapides</div>
              </div>
            </div>
            <div className="py-4 border-t border-slate-200/60">
              <div className="flex justify-center">
                <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-[#F6E97A] text-[12px] font-semibold text-slate-900 border border-[#E7D856] shadow-[0_1px_0_rgba(0,0,0,.04)]">
                  Positionnement
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-x-4 text-[13px] leading-relaxed">
                <div className="text-slate-900">Échanges bienveillants</div>
                <div className="text-slate-700 text-right">Varie selon la plateforme</div>
              </div>
            </div>
            <div className="py-4 border-t border-slate-200/60">
              <div className="flex justify-center">
                <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-[#F6E97A] text-[12px] font-semibold text-slate-900 border border-[#E7D856] shadow-[0_1px_0_rgba(0,0,0,.04)]">
                  Sans abonnement
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-x-4 text-[13px] leading-relaxed">
                <div className="text-slate-900">Plus de possibilités de rencontres</div>
                <div className="text-slate-700 text-right">Accès parfois plus limité</div>
              </div>
            </div>
            <div className="py-4 border-t border-slate-200/60">
              <div className="flex justify-center">
                <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-[#F6E97A] text-[12px] font-semibold text-slate-900 border border-[#E7D856] shadow-[0_1px_0_rgba(0,0,0,.04)]">
                  Navigation
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-x-4 text-[13px] leading-relaxed">
                <div className="text-slate-900">Très clair (favoris, échanges, infos)</div>
                <div className="text-slate-700 text-right">Varie selon la plateforme</div>
              </div>
            </div>
            <div className="py-4 border-t border-slate-200/60">
              <div className="flex justify-center">
                <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-[#F6E97A] text-[12px] font-semibold text-slate-900 border border-[#E7D856] shadow-[0_1px_0_rgba(0,0,0,.04)]">
                  Tarifs (si abonnement)
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-x-4 text-[13px] leading-relaxed">
                <div className="text-slate-900">Prix stables & accessibles (même prix mensuel sur 1 ou 6 mois)</div>
                <div className="text-slate-700 text-right">Réductions souvent liées à l’engagement</div>
              </div>
            </div>
            <div className="py-4 border-t border-slate-200/60">
              <div className="flex justify-center">
                <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-[#F6E97A] text-[12px] font-semibold text-slate-900 border border-[#E7D856] shadow-[0_1px_0_rgba(0,0,0,.04)]">
                  Modération
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-x-4 text-[13px] leading-relaxed">
                <div className="text-slate-900">Simple : signaler, filtrer, gérer</div>
                <div className="text-slate-700 text-right">Varie selon la plateforme</div>
              </div>
            </div>
            <div className="py-4 border-t border-slate-200/60">
              <div className="flex justify-center">
                <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-[#F6E97A] text-[12px] font-semibold text-slate-900 border border-[#E7D856] shadow-[0_1px_0_rgba(0,0,0,.04)]">
                  Favoris & échanges
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-x-4 text-[13px] leading-relaxed">
                <div className="text-slate-900">Accès clair : favoris, messages, accroches</div>
                <div className="text-slate-700 text-right">Varie selon la plateforme</div>
              </div>
            </div>
              </div>
            </div>
          </section>

          {/* Pourquoi */}
          <section className="mt-10 rounded-3xl border border-sky-200/60 bg-white/70 p-6 sm:p-10">
            <h2 className="text-2xl font-extrabold text-slate-900">
              Pourquoi chercher une alternative à Badoo ?
            </h2>

            <ul className="mt-4 list-disc pl-6 text-slate-700 space-y-2">
              <li>Trop de bruit ou de profils à trier : vous cherchez quelque chose de plus simple et lisible.</li>
              <li>Envie d’échanges plus naturels, sans pression, avec une vraie place pour la discussion.</li>
              <li>Vous voulez un cadre français (site en France) et une meilleure clarté sur la modération.</li>
              <li>Besoin de repères : favoris, messages, accroches… facilement accessibles.</li>
            </ul>

            <div className="mt-6">
              <h3 className="text-xl font-extrabold text-slate-900">
                Keefon : ce qui change (sans promesse floue)
              </h3>

              <ul className="mt-3 space-y-2 text-slate-700">
                <li>
                  <strong>Sans swipe</strong> : moins de décisions instantanées, plus de place à l’échange.
                </li>
                <li>
                  <strong>Approche bienveillante</strong> : un cadre pensé pour des interactions respectueuses.
                </li>
                <li>
                  <strong>Indépendant</strong> : Keefon ne revendique aucune association avec les grandes plateformes.
                </li>
              </ul>
            </div>

            <div className="mt-6">
              <h3 className="text-xl font-extrabold text-slate-900">
                Une approche plus ouverte, même sans abonnement
              </h3>

              <p className="mt-3 text-slate-700 leading-relaxed">
                Keefon fait attention aux personnes qui ne souhaitent pas payer un abonnement tout de suite :
                plusieurs options d’ouverture restent possibles, pour discuter et faire des rencontres sans se perdre.
                La navigation est pensée pour être claire (pages, infos, favoris, échanges), et la modération reste simple
                pour garder une expérience propre.
              </p>
            </div>
          </section>

          {/* FAQ */}
          <section className="mt-10">
            <h2 className="text-2xl font-extrabold text-slate-900">FAQ</h2>

            <div className="mt-4 space-y-3">
              {faq.map((item) => (
                <details
                  key={item.q}
                  className="group rounded-2xl border border-slate-200 bg-white/80 px-5 py-4"
                >
                  <summary className="cursor-pointer list-none font-semibold text-slate-900 flex items-center justify-between">
                    <span>{item.q}</span>
                    <span className="text-slate-500 group-open:rotate-90 transition-transform">›</span>
                  </summary>
                  <p className="mt-3 text-sm text-slate-700 leading-relaxed">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </section>

          {/* Footer note */}
          <section className="mt-10 text-[12px] text-slate-600">
            <p>
              Note : cette page est un contenu éditorial. Les marques citées (ex : Tinder, Bumble, Badoo, Meetic) appartiennent à leurs propriétaires respectifs.
              Keefon est un service indépendant. Les comparaisons sont volontairement générales.
            </p>

            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
              <Link href="/rencontres/france" className="hover:underline">
                Rencontres en France
              </Link>
              <Link href="/cgu" className="hover:underline">
                Conditions Générales d&apos;Utilisation
              </Link>
              <Link href="/mentions-legales" className="hover:underline">
                Mentions légales
              </Link>
              <Link href="/confidentialite" className="hover:underline">
                Politique de confidentialité
              </Link>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
