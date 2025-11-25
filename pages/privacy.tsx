// pages/privacy.tsx — UTF-8
import React from "react";
import Link from "next/link";

/**
 * Politique de confidentialité — trame simple RGPD.
 * ⚠️ À personnaliser : base légale, DPO, durée, sous-traitants exacts, région d’hébergement.
 */
export default function Privacy() {
  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-semibold mb-6">Politique de confidentialité</h1>

      <section className="space-y-2 mb-6">
        <p>
          Vivaya respecte ta vie privée. Cette page explique quelles données sont collectées, pourquoi, et tes droits.
        </p>
      </section>

      <section className="space-y-2 mb-6">
        <h2 className="text-xl font-semibold">Données que nous collectons</h2>
        <ul className="list-disc pl-5">
          <li>Données de compte (email, pseudo, date de naissance, préférences).</li>
          <li>Contenus que tu ajoutes (photos, description, messages).</li>
          <li>Données techniques (journal d’accès, IP tronquée, device, cookies essentiels).</li>
        </ul>
      </section>

      <section className="space-y-2 mb-6">
        <h2 className="text-xl font-semibold">Finalités et bases légales</h2>
        <ul className="list-disc pl-5">
          <li>Fournir le service et la mise en relation (exécution du contrat).</li>
          <li>Sécuriser la plateforme et prévenir les abus (intérêt légitime).</li>
          <li>Respecter les obligations légales (conservation minimale de certaines traces).</li>
        </ul>
      </section>

      <section className="space-y-2 mb-6">
        <h2 className="text-xl font-semibold">Durées de conservation</h2>
        <p>Les données sont conservées le temps strictement nécessaire à la finalité, puis supprimées ou anonymisées. Les comptes inactifs sont purgés après {/* TODO: durée */}À compléter.</p>
      </section>

      <section className="space-y-2 mb-6">
        <h2 className="text-xl font-semibold">Partage & sous-traitants</h2>
        <ul className="list-disc pl-5">
          <li>Hébergement et base de données : {/* TODO: Supabase (région) */}À compléter.</li>
          <li>Paiements (si activés) : Stripe (transactions et facturation).</li>
          <li>Nous ne revendons pas tes données.</li>
        </ul>
      </section>

      <section className="space-y-2 mb-6">
        <h2 className="text-xl font-semibold">Tes droits</h2>
        <ul className="list-disc pl-5">
          <li>Accès, rectification, suppression, limitation, opposition, portabilité.</li>
          <li>Exercer tes droits : <a className="underline" href="mailto:privacy@vivaya.example">privacy@vivaya.example</a></li>
          <li>Réclamation : CNIL (cnil.fr) si nécessaire.</li>
        </ul>
      </section>

      <section className="space-y-2 mb-6">
        <h2 className="text-xl font-semibold">Sécurité</h2>
        <p>Nous appliquons des mesures techniques et organisationnelles raisonnables (chiffrement en transit, contrôle d’accès, journaux d’audit).</p>
      </section>

      <p className="text-sm text-gray-500">
        Voir aussi : <Link className="underline" href="/legal">Mentions légales</Link> • <Link className="underline" href="/cookies">Politique cookies</Link> • <Link className="underline" href="/terms">CGU</Link>
      </p>
    </main>
  );
}
