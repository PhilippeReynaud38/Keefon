// -*- coding: utf-8 -*-
// File: /components/admin/PlanCounters.tsx
// Purpose: Compteurs globaux Free / Essentiel / Élite (NON FILTRÉS) pour l’admin.
// Context: Vivaya — Admin. Règles: robustesse, simplicité, maintenabilité, UTF-8, zéro gadget.
// Source de vérité: lecture EXCLUSIVE de la vue public.visible_profiles_admin_v
//   Colonne utilisée: subscription_tier ('free' | 'essentiel' | 'elite')
// Notes:
//   - On ne touche à AUCUN SQL ici. On aligne juste la source du haut sur la même vue que le bas.
//   - Trois COUNT exacts en parallèle, sans filtres.
//   - Gestion d’erreurs: non bloquante, affiche 0 + message discret.
// Changelog (2025-10-06): Remplace l’ancienne lecture via RPC count_plans_admin() par la vue visible_profiles_admin_v.
// Changelog (2025-11-23): Ne jette plus d’exception sur erreur Supabase pour éviter le crash de la page admin.

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type Counts = { free: number; essentiel: number; elite: number }
const VIEW = 'visible_profiles_admin_v'

export default function PlanCounters() {
  const [counts, setCounts] = useState<Counts>({ free: 0, essentiel: 0, elite: 0 })
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setErrorMsg(null)

    // Compte un tier, en retournant 0 en cas d'erreur (mais sans casser la page).
    const countTier = async (tier: 'free' | 'essentiel' | 'elite'): Promise<number> => {
      const { count, error } = await supabase
        .from(VIEW)
        .select('id', { head: true, count: 'exact' })
        .eq('subscription_tier', tier)

      if (error) {
        console.error('[Admin] PlanCounters countTier error for', tier, error)
        if (!cancelled) {
          // On garde le premier message d’erreur rencontré, sans spammer.
          setErrorMsg(prev => prev ?? (error.message || 'Erreur lors du comptage global.'))
        }
        return 0
      }

      return count ?? 0
    }

    ;(async () => {
      try {
        const [free, essentiel, elite] = await Promise.all([
          countTier('free'),
          countTier('essentiel'),
          countTier('elite'),
        ])
        if (!cancelled) setCounts({ free, essentiel, elite })
      } catch (e: any) {
        // Par sécurité, mais normalement on ne doit plus passer ici.
        console.error('[Admin] PlanCounters (top) unexpected error:', e?.message || e)
        if (!cancelled) {
          setCounts({ free: 0, essentiel: 0, elite: 0 })
          setErrorMsg(e?.message || 'Erreur lors du comptage global.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Card label="Free" value={counts.free} loading={loading} />
      <Card label="Essentiel" value={counts.essentiel} loading={loading} />
      <Card label="Élite" value={counts.elite} loading={loading} />
      {errorMsg && (
        <div className="sm:col-span-3 rounded border border-red-700 bg-red-900/30 text-red-200 p-3 text-sm">
          {errorMsg}
        </div>
      )}
    </div>
  )
}

function Card({ label, value, loading }: { label: string; value: number; loading: boolean }) {
  return (
    <div className="rounded-2xl p-4 bg-neutral-800 shadow border border-neutral-700">
      <div className="text-neutral-300 text-sm">{label}</div>
      <div className="text-4xl font-semibold mt-1">
        {loading ? <span className="text-gray-400">…</span> : value}
      </div>
    </div>
  )
}
