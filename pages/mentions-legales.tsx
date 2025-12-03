// -*- coding: utf-8 -*-
// /pages/mentions-legales.tsx — Keefon
// Page Mentions légales (version simple, à adapter si besoin).

import Head from "next/head";
import Link from "next/link";

export default function MentionsLegales() {
  return (
    <>
      <Head>
        <title>Mentions légales | Keefon</title>
        <meta
          name="description"
          content="Mentions légales du site de rencontres Keefon."
        />
        <meta name="robots" content="noindex,nofollow" />
        <link rel="canonical" href="https://www.keefon.com/mentions-legales" />
      </Head>

      <main className="min-h-screen bg-white/70">
        <div className="max-w-3xl mx-auto px-4 py-10">
          <h1 className="text-2xl font-bold mb-6">Mentions légales</h1>

          <div className="space-y-5 text-sm leading-relaxed text-gray-800">
            <section>
              <h2 className="font-semibold">1. Éditeur du site</h2>
              <p>
                Le site <b>Keefon</b> est édité par :
                <br />
                <b>Philippe Reynaud</b>
                <br />
                6 Rue De La Marjoera, 38760 Varces Allières Et Risset
                <br />
                Adresse e-mail :{" "}
                <a
                  href="mailto:contact@keefon.com"
                  className="underline"
                >
                  contact@keefon.com
                </a>
                .
              </p>
              <p className="mt-2 text-xs text-gray-600">
                Keefon est actuellement exploité à titre individuel, en phase
                de test/découverte. Une structure juridique dédiée pourra être
                créée ultérieurement ; les présentes mentions seront alors
                mises à jour.
              </p>
            </section>

            <section>
              <h2 className="font-semibold">2. Hébergeur</h2>
              <p>
                Hébergement applicatif : Vercel Inc., 440 N Barranca Ave #4133,
                Covina, CA 91723, États-Unis.
              </p>
              <p className="mt-1">
                Hébergement des données (base de données) : Supabase, Inc.
                (service d&apos;hébergement de base de données gérée).
              </p>
            </section>

            <section>
              <h2 className="font-semibold">3. Propriété intellectuelle</h2>
              <p>
                Le nom <b>Keefon</b>, le logo, l&apos;interface et les contenus
                textuels/visuels du site sont protégés par la législation
                applicable en matière de propriété intellectuelle. Toute
                reproduction ou réutilisation non autorisée est interdite.
              </p>
            </section>

            <section>
              <h2 className="font-semibold">4. Données personnelles</h2>
              <p>
                Les données collectées via Keefon sont utilisées pour le bon
                fonctionnement du service (création de compte, mise en
                relation, sécurité, modération...). Pour plus d&apos;informations
                sur tes droits et les traitements, consulte la{" "}
                <Link href="/confidentialite" className="underline">
                  Politique de confidentialité
                </Link>
                .
              </p>
            </section>

            <section>
              <h2 className="font-semibold">5. Contact</h2>
              <p>
                Pour toute question concernant le site ou ces mentions légales,
                tu peux écrire à{" "}
                <a
                  href="mailto:contact@keefon.com"
                  className="underline"
                >
                  contact@keefon.com
                </a>
                .
              </p>
            </section>

            <section>
              <h2 className="font-semibold">6. Liens utiles</h2>
              <p className="mt-1 text-xs text-gray-600">
                Voir aussi :{" "}
                <Link href="/cgu" className="underline">
                  Conditions Générales d&apos;Utilisation
                </Link>{" "}
                ·{" "}
                <Link href="/confidentialite" className="underline">
                  Politique de confidentialité
                </Link>{" "}
                ·{" "}
                <Link href="/cookies" className="underline">
                  Politique cookies
                </Link>
                .
              </p>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
