// -*- coding: utf-8 -*-
import Link from 'next/link';

export default function CheckoutSuccess() {
  return (
    <main className="mx-auto max-w-lg p-6">
      <h1 className="mb-2 text-2xl font-bold">Paiement terminé ✅</h1>
      <p className="mb-4 text-gray-700">
        Merci ! Ton paiement de test a été accepté par Stripe. (Le déverrouillage du plan
        côté Vivaya sera branché plus tard via webhook.)
      </p>
      <Link href="/abonnement" className="rounded-xl bg-yellowGreen px-4 py-2 font-semibold text-black">
        ← Revenir aux abonnements
      </Link>
    </main>
  );
}
