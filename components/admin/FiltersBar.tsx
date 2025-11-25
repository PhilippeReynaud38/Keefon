// -*- coding: utf-8 -*-
// File: components/admin/FiltersBar.tsx
// Purpose: Barre de filtres Admin (Pays + Département/Préfixe + Ville + Genre/Âge/Orientation)
// Rules : robuste, simple, commenté, UTF-8. Ne modifie aucune RPC/SQL.

'use client'

import { useEffect, useMemo, useState } from 'react'
import CityAutocomplete from '@/components/recherche/CityAutocomplete'

export type AgeBin = [number, number]
export type Filters = {
  country?: string | null
  dept?: string | null            // FR : 2 chiffres (ex: "38")
  postal_prefix?: string | null   // autres pays : 1..5 chiffres (optionnel)
  city?: string | null            // nom simple (match sur ville_ci)
  gender?: string[] | null
  age_bins?: AgeBin[] | null
  orientation?: 'hetero' | 'homo' | null
}

export default function FiltersBar({
  value,
  onChange,
  onApply,
  onReset,
}: {
  value?: Filters
  onChange?: (f: Filters) => void
  onApply: (f: Filters) => void
  onReset: () => void
}) {
  const controlled = typeof value !== 'undefined'

  // État local (mode non contrôlé)
  const [country, setCountry] = useState<string>('')   // '' = Tous pays
  const [zone, setZone] = useState<string>('')         // dept(FR) ou préfixe(autres)
  const [city, setCity] = useState<string>('')         // nom simple
  const [gender, setGender] = useState<string[]>([])
  const [ageBins, setAgeBins] = useState<AgeBin[]>([])
  const [orientation, setOrientation] = useState<'hetero' | 'homo' | ''>('')

  // Département déduit d’un CP choisi par l’autocomplete (utilisé si FR & dept vide)
  const [derivedDept, setDerivedDept] = useState<string>('')

  // Synchronisation depuis props si composant contrôlé
  useEffect(() => {
    if (!controlled) return
    const v = value ?? {}

    const ctry = (v.country ?? '') as string
    setCountry(ctry)

    setCity(v.city ?? '')

    // Alimente le champ "zone" suivant le pays
    if (ctry === 'FR') setZone(v.dept ?? '')
    else if (ctry)    setZone(v.postal_prefix ?? '')
    else              setZone(v.postal_prefix ?? v.dept ?? '')

    setGender(Array.isArray(v.gender) ? v.gender : [])
    setAgeBins(Array.isArray(v.age_bins) ? (v.age_bins as AgeBin[]) : [])
    setOrientation(((v.orientation ?? '') as any) || '')
    setDerivedDept('')
  }, [controlled, value])

  // Vue courante des filtres (pour l’UI)
  const current: Filters = useMemo(() => {
    if (controlled) return value ?? {}
    return {
      country: country || null,
      city: city || null,
      gender: gender.length ? gender : null,
      age_bins: ageBins.length ? ageBins : null,
      orientation: (orientation || null) as any,
    }
  }, [controlled, value, country, city, gender, ageBins, orientation])

  // Placeholder dynamique pour la zone (dept/préfixe)
  const placeholder =
    !current.country ? 'Département / Préfixe postal'
    : current.country === 'FR'
      ? 'Département (2 chiffres)'
      : 'Préfixe postal (1 à 5 chiffres)'

  // Valeur affichée dans l’input zone
  const zoneInputValue = controlled
    ? (current.country === 'FR' ? (current.dept ?? '') : (current.postal_prefix ?? ''))
    : zone

  // ——————————————————————
  // Handlers
  // ——————————————————————
  const setCountryBoth = (ctry: string) => {
    if (controlled) {
      onChange?.({ ...(value ?? {}), country: ctry || null, dept: null, postal_prefix: null })
    } else {
      setCountry(ctry)
      setZone('') // reset de la zone si on change de pays
    }
    setDerivedDept('')
  }

  const setZoneBoth = (raw: string) => {
    const ctry = (current.country ?? '') as string
    const cleaned = ctry === 'FR'
      ? raw.replace(/\D/g, '').slice(0, 2) // FR: exactement 2 chiffres
      : raw.replace(/\D/g, '').slice(0, 5) // autre: 1..5 chiffres
    if (controlled) {
      const base: Filters = { ...(value ?? {}) }
      if (ctry === 'FR') {
        base.dept = cleaned || null
        base.postal_prefix = null
      } else {
        base.dept = null
        base.postal_prefix = cleaned || null
      }
      onChange?.(base)
    } else {
      setZone(cleaned)
    }
  }

  const setCityBoth = (val: string) => {
    if (controlled) onChange?.({ ...(value ?? {}), city: val || null })
    else setCity(val)
  }

  const toggleGenderBoth = (g: string) => {
    if (controlled) {
      const prev = Array.isArray(value?.gender) ? (value!.gender as string[]) : []
      const next = prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]
      onChange?.({ ...(value ?? {}), gender: next.length ? next : null })
    } else {
      setGender(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g])
    }
  }

  const toggleBinBoth = (bin: AgeBin) => {
    if (controlled) {
      const prev = Array.isArray(value?.age_bins) ? (value!.age_bins as AgeBin[]) : []
      const on  = prev.find(b => b[0] === bin[0] && b[1] === bin[1])
      const next = on ? prev.filter(b => !(b[0] === bin[0] && b[1] === bin[1])) : [...prev, bin]
      onChange?.({ ...(value ?? {}), age_bins: next.length ? next : null })
    } else {
      setAgeBins(prev => prev.find(b => b[0] === bin[0] && b[1] === bin[1])
        ? prev.filter(b => !(b[0] === bin[0] && b[1] === bin[1]))
        : [...prev, bin])
    }
  }

  const setOrientationBoth = (val: '' | 'hetero' | 'homo') => {
    if (controlled) onChange?.({ ...(value ?? {}), orientation: (val || null) as any })
    else setOrientation(val)
  }

  // Appliquer : construit le payload propre pour le RPC
  const apply = () => {
    const out: Filters = {
      country: current.country || null,
      city: (current.city || '')?.trim() || null,
      gender: current.gender && current.gender.length ? current.gender : null,
      age_bins: current.age_bins && current.age_bins.length ? current.age_bins : null,
      orientation: current.orientation || null, // fixé juste après
      dept: null,
      postal_prefix: null,
    }

    // Zone soumise (ce qui est dans l’input)
    const z = controlled
      ? ((out.country === 'FR') ? (value?.dept ?? '') : (value?.postal_prefix ?? ''))
      : zone
    const zFR  = (z || '').replace(/\D/g, '').slice(0, 2)
    const zAny = (z || '').replace(/\D/g, '').slice(0, 5)

    if (out.country === 'FR') {
      out.dept = zFR || null
      out.postal_prefix = null
      // si l’admin a choisi une ville/CP et que dept est vide, on tente d’injecter celui déduit
      if ((!out.dept || out.dept === '') && derivedDept) out.dept = derivedDept
    } else if (!out.country /* Tous pays */) {
      out.postal_prefix = zAny || null
      // compat descendante : si 2 chiffres, on renseigne aussi dept
      out.dept = /^\d{2}$/.test(zAny) ? zAny : null
    } else {
      // autre pays
      out.dept = null
      out.postal_prefix = zAny || null
    }

    // Orientation sûre : uniquement 'hetero' | 'homo' ; sinon null
    if (out.orientation !== 'hetero' && out.orientation !== 'homo') {
      out.orientation = null
    }

    onApply(out)
  }

  const reset = () => {
    if (controlled) onChange?.({})
    else { setCountry(''); setZone(''); setCity(''); setGender([]); setAgeBins([]); setOrientation('') }
    setDerivedDept('')
    onReset()
  }

  // ——————————————————————
  // UI
  // ——————————————————————
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800 p-3 flex flex-col gap-3">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Pays */}
        <select
          value={(current.country as any) ?? ''}
          onChange={(e) => setCountryBoth(e.target.value)}
          className="border border-gray-600 px-3 py-2 rounded bg-white text-gray-900"
        >
          <option value="">Tous pays</option>
          <option value="FR">France (FR)</option>
        </select>

        {/* Département (FR: 2 chiffres) / Préfixe (autres) */}
        <input
          value={zoneInputValue}
          onChange={(e) => setZoneBoth(e.target.value)}
          className="w-full rounded-md border border-gray-500 bg-white text-gray-900 placeholder-gray-400
                     focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 px-3 py-2"
          placeholder={placeholder}
          inputMode="numeric"
          maxLength={current.country === 'FR' ? 2 : 5}
          aria-label={placeholder}
        />

        {/* Ville — autocomplete ; ne force pas le pays */}
        <div className="text-gray-900">
          <CityAutocomplete
            initialValue={current.city ?? ''}
            onSelect={(ville: string, cp: string) => {
              const dept = (cp || '').replace(/\D/g, '').slice(0, 2)
              setDerivedDept(dept)      // utilisé si FR + dept vide
              setCityBoth(ville)        // valeur filtrante = nom simple
            }}
          />
        </div>

        {/* Orientation */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-300">Orientation :</span>
          <button
            type="button"
            onClick={() => setOrientationBoth((current.orientation ?? '') === 'hetero' ? '' : 'hetero')}
            className={'px-2 py-1 rounded border text-sm ' +
              ((current.orientation ?? '') === 'hetero' ? 'border-blue-500 bg-blue-900/30' : 'border-gray-600 bg-gray-700')}
          >
            hétéro
          </button>
          <button
            type="button"
            onClick={() => setOrientationBoth((current.orientation ?? '') === 'homo' ? '' : 'homo')}
            className={'px-2 py-1 rounded border text-sm ' +
              ((current.orientation ?? '') === 'homo' ? 'border-blue-500 bg-blue-900/30' : 'border-gray-600 bg-gray-700')}
          >
            homo
          </button>
        </div>
      </div>

      {/* Genre + Âge */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-300">Genre :</span>
          {['femme', 'homme', 'autre'].map((g) => {
            const on = Array.isArray(current.gender) && current.gender.includes(g)
            return (
              <button
                key={g}
                type="button"
                onClick={() => toggleGenderBoth(g)}
                className={'px-2 py-1 rounded border text-sm ' +
                  (on ? 'border-green-500 bg-green-900/30' : 'border-gray-600 bg-gray-700')}
              >
                {g}
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-2 flex-wrap md:col-span-3">
          <span className="text-sm text-gray-300">Âge :</span>
          {([[18,24],[25,34],[35,44],[45,54],[55,120]] as AgeBin[]).map((b) => {
            const on = !!(current.age_bins ?? []).find(x => x[0] === b[0] && x[1] === b[1])
            return (
              <button
                key={`${b[0]}-${b[1]}`}
                type="button"
                onClick={() => toggleBinBoth(b)}
                className={'px-2 py-1 rounded border text-sm ' +
                  (on ? 'border-blue-500 bg-blue-900/30' : 'border-gray-600 bg-gray-700')}
              >
                {b[0]}–{b[1]}
              </button>
            )
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={reset}
          className="px-3 py-2 rounded border border-gray-600 bg-gray-700 hover:bg-gray-600"
        >
          Réinitialiser
        </button>
        <button
          type="button"
          onClick={apply}
          className="px-3 py-2 rounded border border-green-600 bg-green-700 hover:bg-green-600"
        >
          Appliquer
        </button>
      </div>
    </div>
  )
}
