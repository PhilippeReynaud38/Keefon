// -*- coding: utf-8 -*-
// /pages/cgu.tsx — Vivaya
// Conditions Générales d’Utilisation (version courte, à compléter selon besoin)

import Head from "next/head";
import Link from "next/link";

export default function CGU() {
  return (
    <>
      <Head>
        <title>Conditions Générales d’Utilisation — Vivaya</title>
        <meta name="description" content="CGU du service Vivaya." />
      </Head>

      <main className="min-h-screen bg-white/70">
        <div className="max-w-3xl mx-auto px-4 py-10">
          <h1 className="text-2xl font-bold mb-6">Conditions Générales d’Utilisation</h1>

          <div className="space-y-5 text-sm leading-relaxed">
            <section>
              <h2 className="font-semibold">1. Objet</h2>
              <p>
                Les présentes CGU encadrent l’accès et l’usage de <b>Vivaya</b>, un service de mise en relation entre
                personnes majeures, opéré par <b>[Éditeur]</b>.
              </p>
            </section>

            <section>
              <h2 className="font-semibold">2. Inscription et compte</h2>
              <p>
                Inscription réservée aux personnes de <b>18 ans et plus</b>. L’utilisateur fournit des informations
                exactes et conserve ses identifiants confidentiels. Le compte est personnel et non-transférable.
              </p>
            </section>

            <section>
              <h2 className="font-semibold">3. Service proposé</h2>
              <p>
                Création de profil, consultation d’autres profils, échanges, et options payantes (abonnements). Les
                fonctionnalités peuvent évoluer pour améliorer le service.
              </p>
            </section>

            <section>
              <h2 className="font-semibold">4. Comportements interdits</h2>
              <p>
                Contenus illégaux, harcèlement, usurpation d’identité, diffusion de contenus violents ou non consentis,
                spam, escroquerie… En cas de manquement : suspension ou suppression du compte.
              </p>
            </section>

            <section>
              <h2 className="font-semibold">5. Abonnements & paiement</h2>
              <p>
                Options payantes possibles (Essentiel, Premium, Elite, …). Prix TTC. Paiement via <b>[Stripe/…]</b>. Le
                renouvellement (si activé) est résiliable avant l’échéance depuis l’interface.
              </p>
            </section>

            <section>
              <h2 className="font-semibold">6. Contenus et droits</h2>
              <p>
                L’utilisateur reste titulaire de ses contenus et concède à <b>[Éditeur]</b> une licence non exclusive
                pour l’hébergement et l’affichage dans le cadre du service.
              </p>
            </section>

            <section>
              <h2 className="font-semibold">7. Modération</h2>
              <p>
                Vivaya peut retirer contenus et comptes contraires aux CGU ou à la loi, et coopérer avec les autorités.
              </p>
            </section>

            <section>
              <h2 className="font-semibold">8. Données personnelles</h2>
              <p>
                Voir la{" "}
                <Link href="/confidentialite" className="underline">
                  Politique de confidentialité
                </Link>{" "}
                (droits RGPD, finalités, durées, etc.).
              </p>
            </section>

            <section>
              <h2 className="font-semibold">9. Disponibilité</h2>
              <p>
                Vivaya vise une haute disponibilité sans garantie d’absence d’interruptions (maintenance, mises à jour,
                incidents).
              </p>
            </section>

            <section>
              <h2 className="font-semibold">10. Responsabilité</h2>
              <p>
                Vivaya n’est pas responsable des rencontres/échanges entre utilisateurs ni des préjudices indirects.
                Chaque utilisateur est responsable de ses publications et interactions.
              </p>
            </section>

            <section>
              <h2 className="font-semibold">11. Résiliation</h2>
              <p>
                Suppression du compte depuis <i>Paramètres</i>. Vivaya peut résilier en cas de manquement grave ou
                usage frauduleux.
              </p>
            </section>

            <section>
              <h2 className="font-semibold">12. Droit applicable</h2>
              <p>
                Droit français. Tribunaux du ressort du <b>[siège social]</b>, sous réserve de dispositions
                impératives.
              </p>
            </section>

            <p className="text-gray-500">
              Dernière mise à jour : <b>[JJ/MM/AAAA]</b>.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
