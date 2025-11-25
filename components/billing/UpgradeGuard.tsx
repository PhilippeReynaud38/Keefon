// File: components/billing/UpgradeGuard.tsx
// Purpose: Bloquer l’UI si le palier requis n’est pas atteint.
// Notes: UTF-8. Accessible. Aucun gadget. // [VL]

import React from 'react';
import { TierId, TIER_LABEL, normalizeTier, hasTierAtLeast } from '@/features/billing/tiers';

type Props = {
  userTier: string | null | undefined;  // Provient de ton hook existant
  required: TierId;                      // 'premium' ou 'elite'
  children: React.ReactNode;
  onUpgrade?: () => void;                // Ouvre le flux Checkout
};

export default function UpgradeGuard({ userTier, required, children, onUpgrade }: Props) {
  const normalized = normalizeTier(userTier as TierId);

  if (hasTierAtLeast(normalized, required)) return <>{children}</>;

  return (
    <div className="rounded-2xl border p-4 flex items-center gap-3" role="region" aria-label="Fonctionnalité premium verrouillée">
      <div className="text-sm">
        Cette fonctionnalité est disponible avec l’offre <strong>{TIER_LABEL[required]}</strong>.
      </div>
      {onUpgrade && (
        <button
          type="button"
          onClick={onUpgrade}
          className="ml-auto px-3 py-2 rounded-xl border hover:opacity-80 focus:outline-none focus:ring"
          aria-label={`Passer à ${TIER_LABEL[required]}`}
        >
          Upgrade
        </button>
      )}
    </div>
  );
}
