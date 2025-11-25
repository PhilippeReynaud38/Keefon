// -*- coding: utf-8 -*-
// File: components/admin/PlanCountersFiltered.tsx
// Purpose: Compteurs filtrés (Free / Essentiel / Élite) via un APPEL RPC UNIQUE.
// Notes : Mode SÛR. On normalise country/dept/ville|cp et on évite toute logique fragile côté front.
//         Objectif immédiat : faire marcher le filtre DÉPARTEMENT et supprimer les divergences haut/bas.

'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { fetchAdminCounts } from '@/lib/fetchAdminCounts' // /lib/fetchAdminCounts.ts donné plus haut

type TierKey = 'free' | 'essentiel' | 'elite'
type Counts = Record<TierKey, number>

// Le composant accepte "n'importe quel" shape de filtres pour éviter les erreurs de type
export default function PlanCountersFiltered({ filters }: { filters: any }) {
  const [counts, setCounts]   = useState<Counts>({ free: 0, essentiel: 0, elite: 0 })
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError]     = useState<string | null>(null)

  // Normalisation robuste des inputs (on couvre plusieurs noms possibles côté barre de filtres)
  const norm = useMemo(() => {
    const val = (v: any) => (v === undefined || v === null ? null : String(v))
    const clean = (s: string | null) => (s ? s.trim() : null)

    // country : FR / fr / Fr -> 'FR'
    const country =
      (clean(val(filters?.country)) || null)?.toUpperCase() ?? null

    // dept : ne garder que les chiffres (on laisse le RPC trancher FR=2 chiffres, autres=1..5)
    const deptRaw = clean(val(filters?.dept))
    const dept = deptRaw ? deptRaw.replace(/\D/g, '') || null : null

    // cityOrCp : 3e input « Nom de ville ou code postal »
    const cityOrCp =
      clean(val(filters?.cityOrCp)) ??
      clean(val(filters?.city)) ??
      clean(val(filters?.ville)) ??
      null

    // gender : si tableau -> si 1 seul élément on le passe, sinon on laisse NULL (pas d’OR côté RPC)
    let gender: string | null = null
    if (Array.isArray(filters?.gender) && filters.gender.length === 1) {
      gender = String(filters.gender[0])
    } else if (typeof filters?.gender === 'string') {
      gender = clean(filters.gender)
    }

    // orientation : idem (scalar de préférence)
    let orientation: string[] | null = null
    if (Array.isArray(filters?.orientation) && filters.orientation.length === 1) {
      orientation = [String(filters.orientation[0])]
    } else if (typeof filters?.orientation === 'string' && filters.orientation.trim()) {
      orientation = [filters.orientation.trim()]
    } else {
      orientation = null
    }

    // âges : si l’UI renvoie des bins (ex: [[18,24],[25,34]]), on combine en min..max
    // (c’est volontairement simple pour ce mode SÛR ; on pourra étendre à l’OR plus tard côté RPC)
    let ageMin: number | null = null
    let ageMax: number | null = null
    if (Array.isArray(filters?.age_bins) && filters.age_bins.length) {
      const mins = filters.age_bins.map((b: any) => Number(b?.[0])).filter(Number.isFinite)
      const maxs = filters.age_bins.map((b: any) => Number(b?.[1])).filter(Number.isFinite)
      if (mins.length && maxs.length) {
        ageMin = Math.min(...mins)
        ageMax = Math.max(...maxs)
      }
    } else {
      // si jamais tu fournis déjà ageMin/ageMax scalar
      ageMin = Number(filters?.ageMin)
      ageMax = Number(filters?.ageMax)
      if (!Number.isFinite(ageMin)) ageMin = null
      if (!Number.isFinite(ageMax)) ageMax = null
    }

    return { country, dept, cityOrCp, gender, orientation, ageMin, ageMax }
  }, [filters])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    ;(async () => {
      try {
        // Appel unique au RPC —> évite toute divergence haut/bas
        const data = await fetchAdminCounts(supabase, {
          country:     norm.country,
          dept:        norm.dept,
          cityOrCp:    norm.cityOrCp,
          gender:      norm.gender,
          orientation: norm.orientation,
          ageMin:      norm.ageMin,
          ageMax:      norm.ageMax,
        })
        if (!cancelled) {
          setCounts({
            free:      data.free_count ?? 0,
            essentiel: data.essentiel_count ?? 0,
            elite:     data.elite_count ?? 0,
          })
        }
      } catch (e: any) {
        if (!cancelled) {
          console.error('[Admin] PlanCountersFiltered (RPC) →', e?.message || e)
          setError(e?.message || 'Erreur inconnue.')
          setCounts({ free: 0, essentiel: 0, elite: 0 })
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => { cancelled = true }
  }, [norm])

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card title="Free (filtré)"      value={counts.free}      loading={loading} />
      <Card title="Essentiel (filtré)" value={counts.essentiel} loading={loading} />
      <Card title="Élite (filtré)"     value={counts.elite}     loading={loading} />
      {error && (
        <div className="md:col-span-3 text-xs md:text-sm text-red-300 border border-red-700 bg-red-900/20 rounded p-2">
          {error}
        </div>
      )}
    </div>
  )
}

function Card({ title, value, loading }: { title: string; value: number; loading: boolean }) {
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800 p-5">
      <div className="text-gray-300 text-sm mb-1">{title}</div>
      <div className="text-3xl font-semibold">
        {loading ? <span className="text-gray-400">…</span> : value}
      </div>
    </div>
  )
}
