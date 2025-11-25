// -*- coding: utf-8 -*-
// File: /abonnement/plan.ts
// Project: Vivaya (Keefon)
// Règles: robuste, simple, logique, 100 % UTF-8, zéro bug, commentaires conservés
// Purpose: Utilitaires d'abonnement côté client, SANS appel à `user_plans`.
//          Source unique côté client = `profiles.subscription_tier` (self-read).
//
// Notes:
// - `useCurrentPlan()` lit le palier courant (free | essential | premium | elite).
// - Normalisation défensive: valeurs inattendues => "free".
// - Aucun effet de bord ; pas de dépendance à Stripe ici.
// - À brancher dans les pages/composants via: `const { tier } = useCurrentPlan()`.

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export type SubscriptionTier = "free" | "essential" | "premium" | "elite";

/** Libellé lisible depuis le palier. */
export function getPlanLabel(tier: SubscriptionTier): string {
  switch (tier) {
    case "essential":
      return "Essentiel";
    case "premium":
      // Si la base emploie "premium" comme alias d'Essentiel,
      // on garde un libellé cohérent côté UI.
      return "Essentiel";
    case "elite":
      return "Élite";
    default:
      return "Gratuit";
  }
}

/**
 * Hook: useCurrentPlan
 * -----------------------------------------------------------------------------
 * Lit `profiles.subscription_tier` pour l'utilisateur courant (RLS self-read).
 * Fallback "free" si non connecté / non trouvé / RLS trop stricte.
 * -----------------------------------------------------------------------------
 */
export function useCurrentPlan() {
  const [tier, setTier] = useState<SubscriptionTier>("free");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        // 1) Session / user id
        const {
          data: { user },
          error: authErr,
        } = await supabase.auth.getUser();
        if (authErr) throw new Error(authErr.message);

        if (!user) {
          if (!cancelled) setTier("free");
          return;
        }

        // 2) Lecture du palier courant
        const { data, error: selErr } = await supabase
          .from("profiles")
          .select("subscription_tier")
          .eq("id", user.id)
          .limit(1)
          .maybeSingle();

        if (selErr) throw new Error(selErr.message);

        // 3) Normalisation défensive
        const raw = (data?.subscription_tier as SubscriptionTier | null) ?? "free";
        const normalized: SubscriptionTier = ["free", "essential", "premium", "elite"].includes(raw)
          ? raw
          : "free";

        if (!cancelled) setTier(normalized);
      } catch (e: any) {
        console.warn("[useCurrentPlan] error:", e?.message || e);
        if (!cancelled) {
          setTier("free");
          setError(e?.message ?? "Unknown error");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { tier, loading, error };
}
