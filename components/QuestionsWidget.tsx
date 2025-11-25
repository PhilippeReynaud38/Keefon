// components/QuestionsWidget.tsx
// ────────────────────────────────────────────────────────────────────────────────
// Vivaya — Widget de questions aléatoires SANS REMISE
// Objectif : charger une seule fois un pool de questions puis les faire défiler
// sans répétition (file locale), avec persistance localStorage par "scope".
// Entrées :
//   - scope      (string)  file indépendante (ex: peerId, conversationId, "global")
//   - source     (string)  vue/table Supabase (défaut: "conversation_questions_premium")
//   - title      (string)  libellé d’en-tête
//   - limit      (number)  sécurité max de lignes à charger (défaut 1000)
//   - buttonLabel(string)  libellé du bouton (défaut "Inspiration")
//   - cooldownMs (number)  petit délai entre 2 tirages (0 = désactivé)
// Dépendances : lib/supabaseClient (même import que les autres pages/components).
// Données/RLS : lecture simple via Supabase; aucune écriture côté DB.
// Effets de bord : lecture/écriture localStorage (clé namespacée).
// Invariants : aucun setState après unmount ; pas d’effet global.
// Dernière mise à jour : 2025-10-29
// ────────────────────────────────────────────────────────────────────────────────
'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

// Types simples (ASCII seulement)
export type QuestionRow = {
  id?: string
  category: string
  subcategory?: string | null
  tone: string
  question: string
}

export type QuestionsWidgetProps = {
  scope?: string
  source?: string
  title?: string
  limit?: number
  buttonLabel?: string
  cooldownMs?: number
}

// PRNG + mélange sans génériques TS (évite les soucis de parser TSX)
function prng(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shuffleRows(rows: QuestionRow[], seed = Date.now()): QuestionRow[] {
  const rand = prng(seed)
  const a = rows.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    const tmp = a[i]
    a[i] = a[j]
    a[j] = tmp
  }
  return a
}

// Persistence locale (file d’attente par scope)
const lsKey = (scope: string) => `vivaya:questionQueue:${scope}`

function loadQueue(scope: string): QuestionRow[] | null {
  try {
    const raw = localStorage.getItem(lsKey(scope))
    return raw ? (JSON.parse(raw) as QuestionRow[]) : null
  } catch {
    return null
  }
}

function saveQueue(scope: string, queue: QuestionRow[]) {
  try {
    localStorage.setItem(lsKey(scope), JSON.stringify(queue))
  } catch {
    // stockage plein : on ignore, la file reste en mémoire
  }
}

export default function QuestionsWidget({
  scope = 'global',
  source = 'conversation_questions_premium',
  title = 'Questions',
  limit = 1000,
  buttonLabel = 'Inspiration',
  cooldownMs = 0,
}: QuestionsWidgetProps) {
  // State local
  const [all, setAll] = useState<QuestionRow[]>([])
  const [queue, setQueue] = useState<QuestionRow[]>([])
  const [current, setCurrent] = useState<QuestionRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCooling, setIsCooling] = useState(false)

  // Chargement 1x du pool
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        setLoading(true)

        // 1) vue principale
        let { data, error } = await supabase
          .from(source)
          .select('id, category, subcategory, tone, question')
          .limit(limit)

        // 2) fallback auto sur la table simple
        if (error || !data) {
          const res2 = await supabase
            .from('conversation_questions')
            .select('id, category, subcategory, tone, question')
            .limit(limit)
          data = res2.data ?? []
        }

        if (!alive) return
        const pool = (data ?? []) as QuestionRow[]
        setAll(pool)

        const existing = loadQueue(scope)
        const initial = existing && existing.length ? existing : shuffleRows(pool, Date.now())
        setQueue(initial)
        saveQueue(scope, initial)

        if (initial.length > 0) {
          const first = initial[0]
          const rest = initial.slice(1)
          setCurrent(first)
          setQueue(rest)
          saveQueue(scope, rest)
        }

        setError(null)
      } catch (e: any) {
        if (!alive) return
        setError(e?.message ?? 'Erreur inconnue')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [scope, source, limit])

  const ready = useMemo(() => Boolean(current || queue.length), [current, queue.length])

  // Tirage suivant (sans remise) + cooldown optionnel
  const next = () => {
    if (!all.length || isCooling) return

    let effective = queue
    if (effective.length === 0) {
      const reshuffled = shuffleRows(all, Date.now())
      effective = reshuffled
      setQueue(reshuffled)
      saveQueue(scope, reshuffled)
    }

    const n = effective[0]
    const rest = effective.slice(1)
    if (!n) return

    setCurrent(n)
    setQueue(rest)
    saveQueue(scope, rest)

    if (cooldownMs > 0) {
      setIsCooling(true)
      window.setTimeout(() => setIsCooling(false), Math.min(cooldownMs, 10000))
    }
  }

  // Rendu
  return (
    <div className="rounded-2xl border p-3 shadow-sm bg-white/70">
      <div className="mb-2 text-sm font-semibold opacity-70">{title}</div>

      {loading && <div className="text-sm opacity-60">Chargement…</div>}
      {error && <div className="text-sm text-red-600">Erreur : {error}</div>}

      {current && (
        <div className="mb-2">
          <div className="text-xs opacity-60">
            {current.category}
            {current.tone ? ` • ${current.tone}` : ''}
          </div>
          <div className="mt-1 text-base">{current.question}</div>
        </div>
      )}

      <button
        type="button"
        onClick={next}
        disabled={!ready || isCooling}
        className="mt-2 inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
      >
        {buttonLabel}
      </button>

      {cooldownMs > 0 && (
        <div className="mt-1 text-xs opacity-50">
          {isCooling ? '… petite pause' : 'Conseil : prends un instant pour répondre'}
        </div>
      )}
    </div>
  )
}
