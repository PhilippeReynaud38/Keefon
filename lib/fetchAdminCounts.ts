// -*- coding: utf-8 -*-
// File: /lib/fetchAdminCounts.ts
// Purpose: Appel unique au RPC `admin_counts_by_filters_via_view` pour obtenir
//          les 3 compteurs (free/essentiel/elite), avec filtres optionnels.
// Notes:   Utiliser cette même fonction pour les compteurs du haut (sans filtres)
//          et les compteurs filtrés (avec filtres). Une seule source de vérité.

export type Filters = {
  country?: string | null;       // 'FR'
  dept?: string | null;          // '75' / '971' / '060'
  cityOrCp?: string | null;      // 'Nice' / '060' / '06000'
  gender?: string | null;        // 'femme' | 'homme' | 'autre'
  orientation?: string[] | null; // ['hetero'] / ['homo'] / null
  ageMin?: number | null;
  ageMax?: number | null;
};

export type AdminCounts = {
  free_count: number;
  essentiel_count: number;
  elite_count: number;
};

export async function fetchAdminCounts(
  supabase: any,
  f: Filters = {}
): Promise<AdminCounts> {
  const { data, error } = await supabase.rpc('admin_counts_by_filters_via_view', {
    p_country:     f.country ?? null,
    p_dept:        f.dept ?? null,
    p_city_or_cp:  f.cityOrCp ?? null,
    p_gender:      f.gender ?? null,
    p_orientation: f.orientation ?? null,
    p_age_min:     f.ageMin ?? null,
    p_age_max:     f.ageMax ?? null,
  });

  if (error) {
    console.error('[admin_counts_by_filters_via_view] RPC error:', error);
    throw error;
  }

  // Le RPC renvoie toujours une seule ligne
  return (data?.[0] ?? { free_count: 0, essentiel_count: 0, elite_count: 0 }) as AdminCounts;
}
