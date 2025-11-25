// File: pages/checkout/success.tsx
// Purpose: Page de retour “paiement réussi” (sandbox).
// Notes: UTF-8. Accessible. // [VL]

import Link from 'next/link';

export default function CheckoutSuccess() {
  return (
    <main role="main" className="mx-auto max-w-xl p-6">
      <h1 className="text-2xl font-semibold mb-2">Paiement réussi ✅</h1>
      <p className="mb-6">Merci ! Ton achat a été traité en mode test.</p>
      <Link href="/profile" className="underline">Retourner à mon profil</Link>
    </main>
  );
}
