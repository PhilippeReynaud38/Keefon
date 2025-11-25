// -*- coding: utf-8 -*-
// Vivaya — utils/tiers.ts
// Objet : normalisation des paliers et libellés FR simples.

export type PlanId = 'free' | 'premium' | 'elite';

const LABELS_FR: Record<PlanId, string> = {
  free: 'Gratuit',
  premium: 'Essentiel',
  elite: 'Keefon+',
};

/**
 * Normalise une valeur de palier (issus BDD, vues, etc.).
 * Retourne toujours 'free' | 'premium' | 'elite' (défaut 'free').
 */
export function normalizeTier(tier: unknown): PlanId {
  const v = String(tier ?? '').toLowerCase();
  if (v === 'premium' || v === 'essentiel') return 'premium';
  if (v === 'elite' || v === 'keefon+' || v === 'keefonplus') return 'elite';
  return 'free';
}

/** Libellé FR du palier. */
export function tierLabelFr(tier: unknown): string {
  return LABELS_FR[normalizeTier(tier)];
}

/** Ordre de tri (free < premium < elite). */
export const TIER_ORDER: PlanId[] = ['free', 'premium', 'elite'];
