// -*- coding: utf-8 -*-
import Link from 'next/link';

export default function CheckoutCancel() {
  return (
    <main className="mx-auto max-w-lg p-6">
      <h1 className="mb-2 text-2xl font-bold">Paiement annulé ❌</h1>
      <p className="mb-4 text-gray-700">
        Le paiement a été annulé. Tu peux réessayer à tout moment.
      </p>
      <Link href="/abonnement" className="rounded-xl bg-yellowGreen px-4 py-2 font-semibold text-black">
        ← Revenir aux abonnements
      </Link>
    </main>
  );
}
