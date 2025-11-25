// -*- coding: utf-8 -*-
// Vivaya — Géolocalisation utilitaire (client)
// Fichier : /lib/geolocation/findNearbyProfiles.ts
// Objet   : fournir des helpers pour calculer une distance « ville+CP → moi »
//           sans exposer de lat/lon d'autres utilisateurs.
// Données : communes_fr(nom_commune, code_postal, lat, lon)
//           user_localisations(user_id, lat, lon)  [self-read uniquement]
//           profiles(id, ville, code_postal)       [fallback si pas de lat/lon]
// Sécurité: aucune policy nouvelle, aucune fonction SECURITY DEFINER.
// Dernière MAJ : 2025-11-02

import { supabase } from "@/lib/supabaseClient";

export type Coords = { lat: number; lon: number } | null;

/** Récupère les coords par (ville, code_postal). Retourne null si introuvable. */
export async function getCoordsByCityZip(
  ville: string | null | undefined,
  codePostal: string | null | undefined
): Promise<Coords> {
  if (!ville || !codePostal) return null;
  const { data, error } = await supabase
    .from("communes_fr")
    .select("lat, lon")
    .eq("nom_commune", ville)
    .eq("code_postal", codePostal)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn("[getCoordsByCityZip]", error.message);
    return null;
  }
  if (!data || data.lat == null || data.lon == null) return null;
  return { lat: Number(data.lat), lon: Number(data.lon) };
}

/** Mes coordonnées :
 *  1) user_localisations (si lat/lon présents)
 *  2) sinon fallback profiles(ville, code_postal) -> communes_fr
 */
export async function getMyCoords(myUserId: string): Promise<Coords> {
  const { data: loc, error: locErr } = await supabase
    .from("user_localisations")
    .select("lat, lon")
    .eq("user_id", myUserId)
    .maybeSingle();

  if (!locErr && loc && loc.lat != null && loc.lon != null) {
    return { lat: Number(loc.lat), lon: Number(loc.lon) };
  }

  const { data: prof, error: profErr } = await supabase
    .from("profiles")
    .select("ville, code_postal")
    .eq("id", myUserId)
    .maybeSingle();

  if (profErr) {
    console.warn("[getMyCoords] fallback profiles:", profErr.message);
    return null;
  }
  return getCoordsByCityZip(prof?.ville ?? null, prof?.code_postal ?? null);
}

/** Haversine (km) */
export function haversineKm(a: Coords, b: Coords): number | null {
  if (!a || !b) return null;
  const R = 6371;
  const d2r = (d: number) => (d * Math.PI) / 180;
  const dLat = d2r(b.lat - a.lat);
  const dLon = d2r(b.lon - a.lon);
  const lat1 = d2r(a.lat);
  const lat2 = d2r(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  const d = R * c;
  return Number.isFinite(d) ? d : null;
}

/** Distance (km) depuis "moi" vers une (ville, CP). */
export async function distanceFromMeToCityZip(
  myUserId: string,
  ville: string | null | undefined,
  codePostal: string | null | undefined
): Promise<number | null> {
  const me = await getMyCoords(myUserId);
  const other = await getCoordsByCityZip(ville ?? null, codePostal ?? null);
  return haversineKm(me, other);
}

/** Enrichit un tableau {peer_user_id, ville, code_postal} avec distanceKm (km). */
export async function withDistances<T extends {
  peer_user_id: string;
  ville?: string | null;
  code_postal?: string | null;
}>(rows: T[], myUserId: string): Promise<(T & { distanceKm: number | null })[]> {
  const me = await getMyCoords(myUserId);
  const memo = new Map<string, Coords>();
  const out: (T & { distanceKm: number | null })[] = [];

  for (const r of rows) {
    const key = `${r.ville ?? ""}|${r.code_postal ?? ""}`;
    let c = memo.get(key);
    if (c === undefined) {
      c = await getCoordsByCityZip(r.ville ?? null, r.code_postal ?? null);
      memo.set(key, c);
    }
    out.push({ ...r, distanceKm: haversineKm(me, c) });
  }
  return out;
}
