// File: components/billing/CheckoutButtons.tsx
// Purpose: Boutons “Passer Essentiel/Élite” qui lancent Checkout (sandbox).
// Notes: UTF-8. Gestion d'états simple + accessible. // [VL]

import React from 'react';
import { createCheckoutSession } from '@/features/billing/client';
import { TIER_LABEL } from '@/features/billing/tiers';

export function CheckoutButtonPremium() {
  const [loading, setLoading] = React.useState(false);
  const onClick = async () => {
    try {
      setLoading(true);
      const url = await createCheckoutSession('premium');
      window.location.assign(url);
    } catch (e) {
      alert('Impossible de démarrer le paiement (test). Réessaie.');
      // Option: Sentry.captureException(e)
    } finally {
      setLoading(false);
    }
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="px-4 py-2 rounded-xl border hover:opacity-80 focus:outline-none focus:ring"
      aria-busy={loading}
      aria-label={`Passer à ${TIER_LABEL.premium}`}
    >
      {loading ? 'Chargement…' : `Passer ${TIER_LABEL.premium}`}
    </button>
  );
}

export function CheckoutButtonElite() {
  const [loading, setLoading] = React.useState(false);
  const onClick = async () => {
    try {
      setLoading(true);
      const url = await createCheckoutSession('elite');
      window.location.assign(url);
    } catch {
      alert('Impossible de démarrer le paiement (test). Réessaie.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="px-4 py-2 rounded-xl border hover:opacity-80 focus:outline-none focus:ring"
      aria-busy={loading}
      aria-label={`Passer à ${TIER_LABEL.elite}`}
    >
      {loading ? 'Chargement…' : `Passer ${TIER_LABEL.elite}`}
    </button>
  );
}
