/* -*- coding: utf-8 -*-
 * File: hooks/useSubscriberPlan.ts
 * Purpose: Exposer { plan, isSubscriber, loading, error } pour le gating UI (hors cœurs),
 *          en lisant la vue `public.user_plans_effective_v` (même logique que l'offre email).
 * Règles:
 *  - Pas d'usine à gaz, pas d'effets de bord.
 *  - Conserve la même API qu'avant: plan = 'free' | 'premium' | 'elite'
 *    (on mappe 'essentiel' -> 'premium' pour rester 100% compatible).
 */

import { useEffect, useState } from 'react'
import { useSessionContext } from '@supabase/auth-helpers-react'

type Plan = 'free' | 'premium' | 'elite'

export function useSubscriberPlan() {
  const { supabaseClient } = useSessionContext()
  const [plan, setPlan] = useState<Plan>('free')
  const [isSubscriber, setIsSubscriber] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        // 1) Qui est connecté ?
        const { data: auth } = await supabaseClient.auth.getUser()
        const uid = auth?.user?.id
        if (!uid) { if (alive) setPlan('free'); return }

        // 2) Lecture unique dans la vue (source de vérité côté client)
        const { data, error } = await supabaseClient
          .from('user_plans_effective_v')
          .select('effective_tier') // 'free' | 'essentiel' | 'elite'
          .eq('id', uid)
          .single()

        if (!alive) return
        if (error) {
          setError(error.message)
          setPlan('free')
          setIsSubscriber(false)
          return
        }

        // 3) Mapping marketing -> plan technique du hook:
        //    'essentiel' (offert ou payant) == 'premium' côté UI (hors cœurs)
        const raw = String(data?.effective_tier || 'free').toLowerCase()
        const mapped: Plan =
          raw === 'elite' ? 'elite'
          : (raw === 'essentiel' || raw === 'essential' || raw === 'premium') ? 'premium'
          : 'free'

        setPlan(mapped)
        setIsSubscriber(mapped === 'premium' || mapped === 'elite')
      } catch (e: any) {
        if (!alive) return
        setError(e?.message ?? 'unknown')
        setPlan('free')
        setIsSubscriber(false)
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [supabaseClient])

  return { plan, isSubscriber, loading, error }
}
