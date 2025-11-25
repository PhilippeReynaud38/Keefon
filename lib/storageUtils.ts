// -*- coding: utf-8 -*-
// lib/storageUtils.ts — Vivaya
//
// Objectif : générer une URL publique à partir d’un chemin Storage Supabase.
// Règles Vivaya : code simple, robuste, commentaires sobres, UTF-8, pas d’usine à gaz.
// Dépendance : "@/lib/supabaseClient"
// Invariants :
//  - Accepte null/undefined → retourne null (ne plante pas).
//  - Si l’input est déjà une URL absolue (http/https), on la retourne telle quelle.
//  - Supprime un éventuel "/" initial du chemin avant l’appel Storage.
// Effets de bord : aucun.
// Dernière MAJ : 2025-10-29

import { supabase } from "@/lib/supabaseClient"

/**
 * Retourne l’URL publique pour un fichier du bucket Storage.
 * @param path    Chemin Storage (ex: "users/abc/avatar.jpg") ou URL absolue.
 * @param bucket  Nom du bucket (par défaut "avatars").
 * @returns       URL publique ou null si indisponible.
 */
export function publicUrlFromPath(
  path: string | null | undefined,
  bucket: string = "avatars"
): string | null {
  if (!path) return null
  const trimmed = String(path).trim()
  if (!trimmed) return null

  // Déjà une URL absolue ? On ne touche pas.
  if (/^https?:\/\//i.test(trimmed)) return trimmed

  // Supprimer "/" initial éventuel pour la clé Storage
  const key = trimmed.startsWith("/") ? trimmed.slice(1) : trimmed

  // Supabase v2 : getPublicUrl() retourne { data: { publicUrl } } (pas de "error")
  const { data } = supabase.storage.from(bucket).getPublicUrl(key)
  return data?.publicUrl ?? null
}

// Alias pour rétrocompat éventuelle (si d’autres imports existent déjà)
export const getPublicUrlSafe = publicUrlFromPath
export default publicUrlFromPath
