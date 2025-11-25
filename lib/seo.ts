// -*- coding: utf-8 -*-
// File: /lib/planEffective.ts
// Purpose: Accès simple au palier EFFECTIF (incluant les offres GEO).
// Vue lue: public.user_plans_effective_geo_v

import { supabase } from '@/lib/supabaseClient'

export type EffectiveTier = 'free' | 'essentiel' | 'elite'

export async function fetchEffectiveTier(userId: string): Promise<EffectiveTier> {
  // On lit UNE ligne pour l’utilisateur
  const { data, error } = await supabase
    .from('user_plans_effective_geo_v')
    .select('effective_tier')
    .eq('id', userId)
    .limit(1)
    .maybeSingle()

  if (error) {
    // En cas de pépin réseau/ACL, on retombe en "free" (comportement prudent).
    console.warn('fetchEffectiveTier:', error.message)
    return 'free'
  }
  return (data?.effective_tier as EffectiveTier) ?? 'free'
}

// Helpers pratiques
export function hasEssentielOrBetter(tier: EffectiveTier) {
  return tier === 'essentiel' || tier === 'elite'
}
export function hasElite(tier: EffectiveTier) {
  return tier === 'elite'
}
