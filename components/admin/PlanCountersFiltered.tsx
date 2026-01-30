// -*- coding: utf-8 -*-
// File: components/admin/PlanCountersFiltered.tsx
// Purpose: Compteurs filtrés (Free / Essentiel / Élite) via un APPEL RPC UNIQUE.

'use client'

import { useEffect, useMemo, useState } from 'react'
import supabase from '@/lib/supabaseClient'
import { fetchAdminCounts } from '@/lib/fetchAdminCounts'

type TierKey = 'free' | 'essentiel' | 'elite'
type Counts = Record<TierKey, number>

export default function PlanCountersFiltered({ filters }: { filters: any }) {
  const [counts, setCounts] = useState<Counts>({ free: 0, essentiel: 0, elite: 0 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const norm = useMemo(() => {
    const val = (v: any) => (v === undefined || v === null ? null : String(v))
    const clean = (s: string | null) => (s ? s.trim() : null)

    const country = (clean(val(filters?.country)) || null)?.toUpperCase() ?? null

    const deptRaw = clean(val(filters?.dept))
    const dept = deptRaw ? deptRaw.replace(/\D/g, '') || null : null

    const cityOrCp =
      clean(val(filters?.cityOrCp)) ??
      clean(val(filters?.city)) ??
      clean(val(filters?.ville)) ??
      null

    let gender: string | null = null
    if (Array.isArray(filters?.gender) && filters.gender.length === 1) {
      gender = String(filters.gender[0])
    } else if (typeof filters?.gender === 'string') {
      gender = clean(filters.gender)
    }

    let orientation: string[] | null = null
    if (Array.isArray(filters?.orientation) && filters.orientation.length === 1) {
      orientation = [String(filters.orientation[0])]
    } else if (typeof filters?.orientation === 'string' && filters.orientation.trim()) {
      orientation = [filters.orientation.trim()]
    } else {
      orientation = null
    }

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
        const data = await fetchAdminCounts(supabase, {
          country: norm.country,
          dept: norm.dept,
          cityOrCp: norm.cityOrCp,
          gender: norm.gender,
          orientation: norm.orientation,
          ageMin: norm.ageMin,
          ageMax: norm.ageMax,
        })

        if (!cancelled) {
          setCounts({
            free: data?.free_count ?? 0,
            essentiel: data?.essentiel_count ?? 0,
            elite: data?.elite_count ?? 0,
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

    return () => {
      cancelled = true
    }
  }, [norm])

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card title="Free (filtré)" value={counts.free} loading={loading} />
      <Card title="Essentiel (filtré)" value={counts.essentiel} loading={loading} />
      <Card title="Élite (filtré)" value={counts.elite} loading={loading} />
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
      <div className="text-3xl font-semibold">{loading ? <span className="text-gray-400">…</span> : value}</div>
    </div>
  )
}
