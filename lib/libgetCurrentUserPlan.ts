// -*- coding: utf-8 -*-
// File: lib/getCurrentUserPlan.ts
// Project: Vivaya (Keefon) — robustesse, simplicité, logique, 100% UTF-8, commentaires conservés
// Purpose: Récupérer le plan le plus récent d’un utilisateur, avec ordre "fallback"
// Notes: Pas d’usine à gaz ; RLS attend auth.uid() = user_id pour lecture user_plans.

import { supabase } from "@/lib/supabaseClient";

type UserPlanRow = {
  plan_id: string | null;
  // Ajoute ici d’autres colonnes si tu en as besoin (start_at, end_at, etc.)
};

const ORDER_CANDIDATES = [
  "created_at",   // préféré si présent dans la table
  "start_at",     // alternative fréquente
  "inserted_at",  // autre naming courant
  "id",           // dernier filet de sécurité si PK monotone
];

export async function getCurrentUserPlan(userId: string) {
  // On essaie successivement des ordres plausibles.
  for (const col of ORDER_CANDIDATES) {
    const { data, error } = await supabase
      .from("user_plans")
      .select("plan_id")
      .eq("user_id", userId)
      .order(col as keyof UserPlanRow, { ascending: false })
      .limit(1);

    // Si la colonne n'existe pas, PostgREST renvoie 400 -> on tente le suivant
    if (error?.message?.toLowerCase().includes("column") && error.message.includes(col)) {
      continue;
    }

    // Toute autre erreur: on la renvoie (ex: RLS 401/403, réseau)
    if (error) return { planId: null as string | null, error };

    const planId = (data && data[0]?.plan_id) || null;
    return { planId, error: null };
  }

  // Si toutes les colonnes d'ordre ont échoué (peu probable)
  return { planId: null as string | null, error: new Error("No suitable order column found on user_plans") };
}
