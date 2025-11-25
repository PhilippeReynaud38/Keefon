// UTF-8 – Mapping userId ⇄ email
// 📁 lib/userIdMapping.ts
// ✅ Centralise les relations entre user_id (dans photos, etc.) et l'email (dans profiles)

import { supabase } from "@/lib/supabaseClient";

/**
 * 🔄 Renvoie un filtre de requête basé sur user_id
 * @param id - L'identifiant du profil (UUID string)
 * @returns un objet { user_id: id } utilisable dans .eq(...)
 */
export const getUserIdFilter = (id: string): { user_id: string } => {
  return { user_id: id };
};

/**
 * 🧠 Récupère les emails associés à une liste d'user_id
 * @param userIds - tableau de UUID string
 * @returns un objet { user_id: email } pour affichage
 */
export async function getUserEmailsFromIds(userIds: string[]): Promise<Record<string, string>> {
  if (userIds.length === 0) return {};

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email")
    .in("id", userIds);

  if (error) {
    console.error("Erreur lors de la récupération des emails :", error.message);
    return {};
  }

  // Conversion en objet { user_id: email }
  const emailMap: Record<string, string> = {};
  for (const profile of data || []) {
    if (profile.id && profile.email) {
      emailMap[profile.id] = profile.email;
    }
  }

  return emailMap;
}
