// 📁 lib/getSafePublicUrl.ts
import { supabase } from "@/lib/supabaseClient";

/**
 * Retourne une URL publique Supabase sécurisée à partir d’un chemin,
 * avec nettoyage automatique du préfixe `avatars/` si déjà présent.
 * Retourne `null` si le chemin est invalide.
 */
export function getSafePublicUrl(path: string | null | undefined): string | null {
  if (!path) {
    console.warn("[getSafePublicUrl] ⚠️ path vide ou invalide :", path);
    return null;
  }

  const cleanPath = path.replace(/^avatars\//, "");
  const { data } = supabase.storage.from("avatars").getPublicUrl(cleanPath);

  if (!data?.publicUrl) {
    console.error("[getSafePublicUrl] ❌ URL publique non obtenue :", cleanPath);
    return null;
  }

  console.log("[getSafePublicUrl] ✅ URL Supabase :", data.publicUrl);
  return data.publicUrl;
}
