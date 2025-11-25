/**
 * ============================================================================
 *  FICHIER : lib/images.ts
 *  OBJET   : Fonctions utilitaires pour construire l'URL PUBLIQUE d'une image
 *            stockée dans le bucket Supabase "avatars".
 *
 *  POURQUOI CE FICHIER ?
 *  - Éviter d'avoir la logique d'URL éparpillée dans plusieurs composants.
 *  - Garantir qu'on respecte EXACTEMENT ce que renvoient tes tables/vues.
 *
 *  RÈGLE D'OR (conformément à ta demande) :
 *  --------------------------------------
 *   • Si la BDD/Vue renvoie déjà une **URL absolue** (http/https), on la renvoie
 *     telle quelle. Exemple :
 *     https://.../storage/v1/object/public/avatars/avatars/<fichier>.jpg
 *
 *   • Si la BDD/Vue renvoie un **chemin relatif**, on le colle tel quel derrière
 *     `${BASE}/storage/v1/object/public/` SANS retirer ni ajouter "avatars/".
 *     - Ex: "avatars/<fichier>.jpg"  → BASE/.../public/avatars/<fichier>.jpg
 *     - Ex: "avatars/avatars/<fichier>.jpg" → BASE/.../public/avatars/avatars/<fichier>.jpg
 *
 *  ⚠️ Aucune "normalisation agressive" n'est appliquée (pas de dédoublonnage).
 *
 *  PRÉREQUIS :
 *   - Déclare NEXT_PUBLIC_SUPABASE_URL dans ton .env.local
 *     Exemple : NEXT_PUBLIC_SUPABASE_URL=https://cnjjibjmaeswdxooogvm.supabase.co
 * ============================================================================
 */

const BASE = process.env.NEXT_PUBLIC_SUPABASE_URL; // ex: https://cnjjibjmaeswdxooogvm.supabase.co

if (!BASE) {
  // Petit garde-fou pour éviter des URLs "undefined"
  // (ne jette pas d'erreur au build, mais log si jamais)
  // eslint-disable-next-line no-console
  console.warn(
    "[lib/images] NEXT_PUBLIC_SUPABASE_URL est manquant. " +
      "Ajoute-le dans ton .env.local pour générer des URLs publiques."
  );
}

/**
 * Construit l'URL publique d'une image à partir d'un chemin OU d'une URL complète.
 *
 * @param pathOrUrl  Soit une URL absolue (http/https), soit un chemin relatif
 *                   tel que stocké en base (ex: 'avatars/avatars/<fichier>.jpg').
 * @returns          Une URL publique exploitable dans <img src=...> ou null.
 *
 * COMPORTEMENT :
 *  - Si `pathOrUrl` est vide/null → null.
 *  - Si ça commence par "http" → on retourne tel quel (aucune modif).
 *  - Sinon → on préfixe juste avec `${BASE}/storage/v1/object/public/` + le chemin
 *            (après avoir retiré les / de tête pour éviter '//').
 */
export function publicAvatarUrl(pathOrUrl: string | null): string | null {
  if (!pathOrUrl) return null;
  const raw = pathOrUrl.trim();
  if (!raw) return null;

  // Cas 1 : déjà une URL absolue -> on respecte à 100%
  if (/^https?:\/\//i.test(raw)) return raw;

  // Cas 2 : chemin relatif -> on préfixe simplement par l'URL "public"
  const base = BASE ?? ""; // laisse vide si non défini -> au moins pas "undefined"
  return `${base}/storage/v1/object/public/${raw.replace(/^\/+/, "")}`;
}
