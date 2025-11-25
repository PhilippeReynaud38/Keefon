// -*- coding: utf-8 -*-
// ============================================================================
// Vivaya — Accès "Essentiel"
// Fichier  : lib/useEssentielAccess.ts
// Objet    : Donner un booléen fiable `hasEssentiel` pour *déverrouiller l'UI*,
//            en combinant :
//              1) le palier enregistré sur le profil (profiles.subscription_tier)
//              2) le *flag global* "Essentiel offert" (RPC get_essentiel_offert_global)
//
// Règles   : robuste, simple, logique, 100 % UTF-8, zéro effet de bord.
// Sécurité : lecture uniquement (RLS self-read + RPC lecture).
// ============================================================================

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

// Normalisation de la valeur DB -> booléen "a Essentiel via plan"
function hasEssentielFromTier(raw: string | null | undefined): boolean {
  const s = (raw ?? '').trim().toLowerCase()
  // Historique: "premium" ≈ "essential"
  if (s === 'elite') return true
  if (s === 'essential' || s === 'essentiel' || s === 'premium') return true
  return false
}

// -----------------------------------------------------------------------------
// Hook principal : useEssentielAccess
// -----------------------------------------------------------------------------
export function useEssentielAccess() {
  const [hasEssentiel, setHasEssentiel] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        setLoading(true)
        setError(null)

        // 1) Qui est connecté ?
        const { data: auth } = await supabase.auth.getUser()
        const uid = auth?.user?.id ?? null

        // 2) palier individuel (si connecté)
        let individuel = false
        if (uid) {
          const { data: row, error: selErr } = await supabase
            .from('profiles')
            .select('subscription_tier')
            .eq('id', uid)
            .maybeSingle()

          if (selErr) throw selErr
          individuel = hasEssentielFromTier(row?.subscription_tier)
        }

        // 3) flag global (lecture RPC)
        const { data: flag, error: rpcErr } = await supabase.rpc('get_essentiel_offert_global')
        if (rpcErr) {
          // pas bloquant : on garde uniquement l’individuel
          console.warn('[useEssentielAccess] RPC read error:', rpcErr.message)
        }
        const offertGlobal = Boolean(flag)

        // 4) accès final : OR logique
        //    - Le flag global *n’écrit rien* en base. Il déverrouille juste l’UI.
        const final = offertGlobal || individuel

        if (alive) setHasEssentiel(final)
      } catch (e: any) {
        console.warn('[useEssentielAccess] error:', e?.message || e)
        if (alive) {
          setHasEssentiel(false)
          setError(e?.message ?? 'unknown_error')
        }
      } finally {
        if (alive) setLoading(false)
      }
    })()

    return () => { alive = false }
  }, [])

  return { hasEssentiel, loading, error }
}
