// -*- coding: utf-8 -*-
// File: /lib/fetchAdminCounts.ts
// Purpose: Appel unique au RPC `admin_counts_by_filters_via_view` pour obtenir
//          les 3 compteurs (free/essentiel/elite), avec filtres optionnels.
// Notes:   Utiliser cette même fonction pour les compteurs du haut (sans filtres)
//          et les compteurs filtrés (avec filtres). Une seule source de vérité.
import type { SupabaseClient } from '@supabase/supabase-js'

export type Filters = {
  country?: string | null
  dept?: string | null
  cityOrCp?: string | null
  gender?: string | null
  orientation?: string[] | null
  ageMin?: number | null
  ageMax?: number | null
}

export type AdminCountsRow = {
  free_count: number
  essentiel_count: number
  elite_count: number
}

export async function fetchAdminCounts(
  supabase: SupabaseClient,
  f: Filters = {}
): Promise<AdminCountsRow> {
  if (!supabase || typeof (supabase as any).rpc !== 'function') {
    throw new Error(
      'fetchAdminCounts: supabase client invalide (rpc manquante). Vérifie l’import / création du client Supabase.'
    )
  }

  const { data, error } = await supabase.rpc('admin_counts_by_filters_via_view', {
    p_country: f.country ?? null,
    p_dept: f.dept ?? null,
    p_city_or_cp: f.cityOrCp ?? null,
    p_gender: f.gender ?? null,
    p_orientation: f.orientation ?? null,
    p_age_min: f.ageMin ?? null,
    p_age_max: f.ageMax ?? null,
  })

  if (error) throw error

  const row = Array.isArray(data) ? (data[0] as AdminCountsRow | undefined) : (data as any)
  if (!row) return { free_count: 0, essentiel_count: 0, elite_count: 0 }

  return {
    free_count: Number(row.free_count ?? 0),
    essentiel_count: Number(row.essentiel_count ?? 0),
    elite_count: Number(row.elite_count ?? 0),
  }
}
