// pages/terms.tsx — UTF-8
import React from "react";
import Link from "next/link";

/**
 * CGU — version courte, claire. À adapter selon tes besoins.
 * Pas un conseil juridique.
 */
export default function Terms() {
  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-semibold mb-6">Conditions générales d’utilisation</h1>

      <section className="space-y-2 mb-6">
        <h2 className="text-xl font-semibold">1. Objet</h2>
        <p>Ces CGU encadrent l’accès et l’usage du service Vivaya.</p>
      </section>

      <section className="space-y-2 mb-6">
        <h2 className="text-xl font-semibold">2. Création et sécurité du compte</h2>
        <ul className="list-disc pl-5">
          <li>Tu dois être majeur(e) et fournir des informations exactes.</li>
          <li>Tu es responsable de la confidentialité de tes identifiants.</li>
        </ul>
      </section>

      <section className="space-y-2 mb-6">
        <h2 className="text-xl font-semibold">3. Contenus et comportement</h2>
        <ul className="list-disc pl-5">
          <li>Respect des lois et des autres utilisateurs.</li>
          <li>Interdits : contenus illégaux, harcèlement, usurpation d’identité, bots/spam, nudité explicite non autorisée, etc.</li>
          <li>Modération : Vivaya peut supprimer ou suspendre des comptes en cas d’abus.</li>
        </ul>
      </section>

      <section className="space-y-2 mb-6">
        <h2 className="text-xl font-semibold">4. Services premium</h2>
        <p>Des fonctionnalités payantes peuvent exister. Les modalités d’abonnement seront précisées avant paiement.</p>
      </section>

      <section className="space-y-2 mb-6">
        <h2 className="text-xl font-semibold">5. Disponibilité et responsabilité</h2>
        <p>Service fourni “en l’état”. Vivaya met tout en œuvre pour assurer la disponibilité mais ne peut garantir l’absence d’interruption.</p>
      </section>

      <section className="space-y-2 mb-6">
        <h2 className="text-xl font-semibold">6. Résiliation</h2>
        <p>Tu peux supprimer ton compte à tout moment. Vivaya peut le résilier en cas de non-respect des CGU.</p>
      </section>

      <section className="space-y-2 mb-6">
        <h2 className="text-xl font-semibold">7. Contact</h2>
        <p>Pour toute question : <a className="underline" href="mailto:contact@vivaya.example">contact@vivaya.example</a></p>
      </section>

      <p className="text-sm text-gray-500">
        Voir aussi : <Link className="underline" href="/legal">Mentions légales</Link> • <Link className="underline" href="/privacy">Politique de confidentialité</Link> • <Link className="underline" href="/cookies">Politique cookies</Link>
      </p>
    </main>
  );
}
