// fichier : lib/geolocation/findCoordsByCity.ts
// 🔍 Trouve les coordonnées (lat/lon) d’une ville à partir de communes_fr
// ✅ Exporté par défaut pour un import simple
// ✅ Utilisé dans villeformtest.tsx et ProfileForm.tsx
// ✅ Robuste, simple, commenté, UTF-8, sans gadget

import { supabase } from '@/lib/supabaseClient'

export default async function findCoordsByCity(ville: string, code_postal: string): Promise<{ lat: number, lon: number } | null> {
  const { data, error } = await supabase
    .from('communes_fr')
    .select('lat, lon')
    .eq('nom_commune', ville)
    .eq('code_postal', code_postal)
    .maybeSingle()

  if (error || !data) {
    console.warn('⚠️ Coordonnées non trouvées pour :', ville, code_postal)
    return null
  }

  return {
    lat: data.lat,
    lon: data.lon,
  }
}
