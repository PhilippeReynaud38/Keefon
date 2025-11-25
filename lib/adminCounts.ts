// -*- coding: utf-8 -*-
// File: lib/admin/adminCounts.ts
// Project: Vivaya (Keefon)
// Règles: robuste, simple, logique, 100 % UTF-8, commentaires conservés
// Purpose: Fournir des compteurs admin. Les compteurs "Photos validées aujourd’hui"
//          et "Photos refusées aujourd’hui" ont été retirés proprement.
// Notes:
//   - Zéro requête inutile pour les photos du jour.
//   - Exports "compat" laissés en place (retour 0) pour éviter de casser les imports existants.
//   - À terme, tu pourras supprimer ces exports "deprecated" si plus personne ne les utilise.

import { supabase } from "@/lib/supabaseClient";

// Type générique que peut consommer le dashboard.
// NE CONTIENT PLUS de champs "photosApprovedToday" / "photosRejectedToday".
export type AdminCounts = {
  totalUsers?: number;
  completedProfiles?: number;
  // autres compteurs utiles conservés ici…
};

// Helper générique (exemples conservés ; adapte si tu as déjà d'autres compteurs réels)
async function countTable(table: string): Promise<number> {
  const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true });
  if (error) {
    console.warn(`[adminCounts] count error on ${table}:`, error.message);
    return 0;
  }
  return count ?? 0;
}

// Compteur principal (sans les deux compteurs photos du jour)
export async function fetchAdminCounts(): Promise<AdminCounts> {
  // ➜ Exemple: conserver d'autres compteurs utiles non liés aux photos du jour
  const [totalUsers /*, completedProfiles*/] = await Promise.all([
    countTable("profiles"),
    // TODO: adapte si tu as un critère "profil complété"
    // countTable("visible_profiles_v")  // exemple si tu avais une vue
  ]);

  return {
    totalUsers,
    // completedProfiles,
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// EXPORTED COMPAT (deprecated) — à retirer plus tard
// Ces fonctions étaient probablement importées quelque part. On les garde
// temporairement pour ne pas casser les écrans, mais elles ne font plus rien.
// ──────────────────────────────────────────────────────────────────────────────

/** @deprecated Retiré — renvoie toujours 0. À supprimer côté appels. */
export async function getPhotosApprovedTodayCount(): Promise<number> {
  return 0;
}

/** @deprecated Retiré — renvoie toujours 0. À supprimer côté appels. */
export async function getPhotosRejectedTodayCount(): Promise<number> {
  return 0;
}
