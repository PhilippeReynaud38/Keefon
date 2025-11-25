// pages/cookies.tsx — UTF-8
import React from "react";
import Link from "next/link";

/**
 * Politique cookies — minimaliste.
 * Actuellement : cookies strictement nécessaires au fonctionnement.
 * Si tu ajoutes Analytics plus tard, on ajoutera une bannière de consentement.
 */
export default function CookiesPolicy() {
  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-semibold mb-6">Politique cookies</h1>

      <section className="space-y-2 mb-6">
        <p>
          Vivaya utilise des cookies strictement nécessaires au fonctionnement (session, préférences),
          et aucun cookie publicitaire ou d’analytics sans consentement préalable.
        </p>
      </section>

      <section className="space-y-2 mb-6">
        <h2 className="text-xl font-semibold">Types de cookies utilisés</h2>
        <ul className="list-disc pl-5">
          <li><strong>Essentiels :</strong> connexion, maintien de session, sécurité.</li>
          <li><strong>Préférences :</strong> options d’affichage, langue.</li>
        </ul>
      </section>

      <section className="space-y-2 mb-6">
        <h2 className="text-xl font-semibold">Gestion</h2>
        <p>
          Tu peux configurer ton navigateur pour bloquer certains cookies. Sans cookies essentiels,
          le site peut ne pas fonctionner correctement.
        </p>
      </section>

      <p className="text-sm text-gray-500">
        Voir aussi : <Link className="underline" href="/privacy">Politique de confidentialité</Link> • <Link className="underline" href="/legal">Mentions légales</Link> • <Link className="underline" href="/terms">CGU</Link>
      </p>
    </main>
  );
}
