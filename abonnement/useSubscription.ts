// -*- coding: utf-8 -*-
// File: /abonnement/useSubscription.ts
// Project: Vivaya (Keefon)
// Règles: robuste, simple, logique, 100 % UTF-8, zéro bug, commentaires conservés
// Purpose: Fournir le statut d’abonnement de l’utilisateur connecté (free / essential / premium / elite)
// Notes:
//   - Ne dépend plus de user_plans (table incomplète provoquant des 400).
//   - Lecture directe du champ profiles.subscription_tier, plus fiable et RLS-compatible.
//   - Valeur par défaut: "free" si non connecté ou si lecture échoue.

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

// Définition stricte des types autorisés pour cohérence et prévention d’erreurs.
export type SubscriptionTier = "free" | "essential" | "premium" | "elite";

interface UseSubscriptionResult {
  tier: SubscriptionTier;
  loading: boolean;
  error: string | null;
}

/**
 * useSubscription()
 * -----------------------------------------------------------------------------
 * Hook React : retourne le niveau d’abonnement de l’utilisateur courant.
 * Lit `profiles.subscription_tier` via RLS self-read.
 * -----------------------------------------------------------------------------
 */
export default function useSubscription(): UseSubscriptionResult {
  const [tier, setTier] = useState<SubscriptionTier>("free");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchSubscription() {
      try {
        setLoading(true);
        setError(null);

        // 1️⃣ Récupération de l’utilisateur connecté
        const {
          data: { user },
          error: userErr,
        } = await supabase.auth.getUser();

        if (userErr) throw new Error(userErr.message);
        if (!user) {
          // Aucun utilisateur connecté → statut free
          if (!cancelled) setTier("free");
          return;
        }

        // 2️⃣ Lecture du champ subscription_tier dans la table profiles
        const { data, error: selErr } = await supabase
          .from("profiles")
          .select("subscription_tier")
          .eq("id", user.id)
          .limit(1)
          .maybeSingle();

        if (selErr) throw new Error(selErr.message);

        // 3️⃣ Normalisation défensive (valeur manquante ou inattendue → "free")
        const value = (data?.subscription_tier as SubscriptionTier | null) ?? "free";
        const normalized: SubscriptionTier = ["free", "essential", "premium", "elite"].includes(value)
          ? (value as SubscriptionTier)
          : "free";

        if (!cancelled) setTier(normalized);
      } catch (err: any) {
        console.warn("[useSubscription] error:", err.message);
        if (!cancelled) {
          setTier("free");
          setError(err.message ?? "Unknown error");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchSubscription();
    return () => {
      cancelled = true;
    };
  }, []);

  return { tier, loading, error };
}
