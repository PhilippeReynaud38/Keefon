/* -*- coding: utf-8 -*-
 * File: lib/effectiveTier.ts
 * Purpose: Lecture FIABLE du plan effectif via la vue `public.user_plans_effective_v`.
 * Notes:
 *  - Ne touche PAS au pipeline des cœurs (stock/règles/cron).
 *  - Retourne des valeurs UI stables: 'free' | 'essential' | 'elite'.
 *  - Avant: pointait `user_plans_effective_geo_v` (obsolète) -> causait des écarts.
 */

import { supabase } from '@/lib/supabaseClient'

export type UiTier = 'free' | 'essential' | 'elite'

function toUiTier(raw: string | null | undefined): UiTier {
  const s = (raw ?? '').trim().toLowerCase()
  if (s === 'elite') return 'elite'
  // Map marketing/tech -> UI: 'essentiel'|'essential'|'premium' => 'essential'
  if (s === 'essentiel' || s === 'essential' || s === 'premium') return 'essential'
  return 'free'
}

/**
 * getEffectiveTier
 * Lit `effective_tier` depuis la vue `user_plans_effective_v` pour l'utilisateur courant.
 * Renvoie 'free' en cas d'absence/erreur (robuste, pas d'exception côté UI).
 */
export async function getEffectiveTier(): Promise<UiTier> {
  const { data: auth } = await supabase.auth.getUser()
  const uid = auth?.user?.id
  if (!uid) return 'free'

  const { data, error } = await supabase
    .from('user_plans_effective_v')      // <-- source de vérité
    .select('effective_tier')            // 'free' | 'essentiel' | 'elite'
    .eq('id', uid)
    .single()

  if (error) {
    // On ne casse rien: valeur par défaut
    return 'free'
  }

  return toUiTier(data?.effective_tier)
}

/** Utilitaire simple pour le gating UI (hors cœurs). */
export function isPremiumLike(tier: UiTier): boolean {
  return tier === 'essential' || tier === 'elite'
}
