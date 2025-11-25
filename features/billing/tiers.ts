// File: features/billing/tiers.ts
// Purpose: Source de vérité des paliers + helpers d'accès (front-only).
// Notes: UTF-8. Comments preserved. Zéro effet de bord. // [VL]

export type TierId = 'free' | 'premium' | 'elite';

export const TIER_LABEL: Record<TierId, string> = {
  free: 'Gratuit',
  premium: 'Essentiel',
  elite: 'Élite',
};

// Toujours renvoyer un TierId valide
export function normalizeTier(input: string | null | undefined): TierId {
  if (input === 'premium' || input === 'elite' || input === 'free') return input;
  return 'free';
}

// Niveau d'accès minimal
export function hasTierAtLeast(userTier: TierId, required: TierId): boolean {
  const rank: Record<TierId, number> = { free: 0, premium: 1, elite: 2 };
  return rank[normalizeTier(userTier)] >= rank[required];
}

export const isPremium = (t: TierId) => t === 'premium' || t === 'elite';
export const isElite = (t: TierId) => t === 'elite';
