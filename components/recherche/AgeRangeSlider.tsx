// components/recherche/AgeRangeSlider.tsx
// UTF-8 — Barre unique 2 poignées, style propre, sans lib

import React from 'react'

interface AgeRangeSliderProps {
  minAge: number
  maxAge: number
  onChange: (min: number, max: number) => void
}

export default function AgeRangeSlider({ minAge, maxAge, onChange }: AgeRangeSliderProps) {
  // Bornes fixes pour l’âge (garde simple)
  const MIN = 18
  const MAX = 99 // ← élargi de 70 à 99
  const STEP = 1

  // Empêche le croisement (au moins 1 an d’écart)
  const clampMin = (v: number) => Math.min(Math.max(v, MIN), maxAge - STEP)
  const clampMax = (v: number) => Math.max(Math.min(v, MAX), minAge + STEP)

  // Position en %
  const pct = (v: number) => ((v - MIN) / (MAX - MIN)) * 100
  const left = pct(minAge)
  const right = 100 - pct(maxAge)

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <label className="text-sm font-medium text-gray-700">Tranche d’âge</label>
        <div className="text-sm font-semibold tabular-nums text-gray-900">
          {minAge} – {maxAge} ans
        </div>
      </div>

      <div className="relative w-full pt-5">
        {/* Piste grise */}
        <div className="absolute left-0 right-0 top-4 h-2 rounded-full bg-gray-200" />

        {/* Segment sélectionné */}
        <div
          className="absolute top-4 h-2 rounded-full bg-blue-600"
          style={{ left: `${left}%`, right: `${right}%` }}
        />

        {/* Curseur min */}
        <input
          type="range"
          min={MIN}
          max={MAX}
          step={STEP}
          value={minAge}
          onChange={(e) => onChange(clampMin(Number(e.target.value)), maxAge)}
          className="w-full appearance-none bg-transparent pointer-events-none h-8"
          aria-label="Âge minimum"
        />

        {/* Curseur max (superposé) */}
        <input
          type="range"
          min={MIN}
          max={MAX}
          step={STEP}
          value={maxAge}
          onChange={(e) => onChange(minAge, clampMax(Number(e.target.value)))}
          className="w-full appearance-none bg-transparent pointer-events-none -mt-8 h-8"
          aria-label="Âge maximum"
        />

        {/* Styles poignées (Chrome/Edge/Opera + Firefox) */}
        <style jsx>{`
          input[type='range']::-webkit-slider-thumb {
            pointer-events: auto;
            -webkit-appearance: none;
            height: 20px;
            width: 20px;
            margin-top: -9px; /* centre la poignée sur la piste */
            border-radius: 9999px;
            background: white;
            border: 2px solid #2563eb;
            box-shadow: 0 1px 2px rgba(0,0,0,.08);
          }
          input[type='range']:focus::-webkit-slider-thumb {
            outline: 3px solid #bfdbfe; /* focus ring douce */
          }
          input[type='range']::-moz-range-thumb {
            pointer-events: auto;
            height: 20px;
            width: 20px;
            border-radius: 9999px;
            background: white;
            border: 2px solid #2563eb;
            box-shadow: 0 1px 2px rgba(0,0,0,.08);
          }
          input[type='range']:focus::-moz-range-thumb {
            outline: 3px solid #bfdbfe;
          }
          input[type='range']::-webkit-slider-runnable-track {
            height: 2px;
            background: transparent; /* on garde nos pistes custom */
          }
          input[type='range']::-moz-range-track {
            height: 2px;
            background: transparent;
          }
        `}</style>
      </div>
    </div>
  )
}
