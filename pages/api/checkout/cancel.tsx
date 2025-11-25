// File: pages/checkout/cancel.tsx
// Purpose: Page de retour “paiement annulé” (sandbox).
// Notes: UTF-8. // [VL]

import Link from 'next/link';

export default function CheckoutCancel() {
  return (
    <main role="main" className="mx-auto max-w-xl p-6">
      <h1 className="text-2xl font-semibold mb-2">Paiement annulé</h1>
      <p className="mb-6">Tu peux réessayer quand tu veux.</p>
      <Link href="/abonnement" className="underline">Voir les offres</Link>
    </main>
  );
}
