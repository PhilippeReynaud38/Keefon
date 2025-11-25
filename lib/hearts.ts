// -*- coding: utf-8 -*-
// lib/hearts.ts — Helpers de lecture du stock de cœurs (Vivaya)
// -----------------------------------------------------------------------------
// Source de vérité UNIQUE : VUE SDV `public_user_heart_stock` (RLS-friendly).
// Colonne : `total_left`.
// Ces helpers sont partagés entre pages/composants pour éviter toute divergence.
// -----------------------------------------------------------------------------

import { supabase } from "@/lib/supabaseClient";

/** Stock total_left pour un user donné. */
export async function readHeartStockTotalLeft(userId: string): Promise<number> {
  if (!userId) return 0;

  const { data, error } = await supabase
    .from("public_user_heart_stock")
    .select("total_left")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.warn("[hearts.readHeartStockTotalLeft] read error:", error.message);
    return 0;
  }

  const n = (data as any)?.total_left;
  return typeof n === "number" ? n : 0;
}

/** Stock total_left pour l’utilisateur connecté (auth.uid()). */
export async function readMyHeartStockTotalLeft(): Promise<number> {
  const { data: auth } = await supabase.auth.getUser();
  const me = auth?.user?.id;
  if (!me) return 0;
  return readHeartStockTotalLeft(me);
}
