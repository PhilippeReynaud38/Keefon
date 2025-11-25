/**
 * ============================================================================
 *  Fichier : lib/questions.ts
 *  Projet  : Vivaya
 *  Objet   : Accès aux RPC Supabase pour les “Idées de questions”.
 *
 *  Note :
 *    - La sécurité (abonné / non-abonné) est contrôlée côté SQL via
 *      la fonction `get_premium_questions`. Si l’utilisateur n’est pas abonné,
 *      la RPC renvoie 0 ligne.
 * ============================================================================
 */

import { supabase } from "@/lib/supabaseClient";

// Récupère N questions (aléatoires par défaut) ; `category = null` => toutes catégories.
export async function fetchPremiumQuestions(category: string | null, n = 5) {
  const { data, error } = await supabase.rpc("get_premium_questions", {
    p_category: category,
    p_n: n,
  });
  if (error) throw error;
  return data as { id: string; category: string; tone: string; question: string }[];
}

export async function fetchPremiumCategories(): Promise<string[]> {
  const { data, error } = await supabase.rpc("get_premium_categories");
  if (error) throw error;
  return (data ?? []).map((r: { category: string }) => r.category);
}
