// -*- coding: utf-8 -*-
// File: components/admin/OfferEssentielCard.tsx
'use client'

/**
 * VIVAYA — Carte Admin : Offrir Essentiel partielle (sans CB) — MODE EMAIL UNIQUEMENT
 * ----------------------------------------------------------------------------
 * - Supprime définitivement le mode "bulk France" (plus d'appel à /grant-bulk).
 * - Conserve l’unitaire par email via /grant-plan et /revoke-plan.
 * - UTF-8, commentaires conservés, logique minimale.
 *
 * Corrections clés vs version d'origine :
 *  - Cohérence helpers Supabase : use createClientComponentClient (Next.js).
 *  - Entrée email : on ne .trim() qu’au submit (pas à chaque frappe).
 *  - PLAN_ID/labels : rendus paramétrables avec des valeurs par défaut sûres.
 *  - Validation des durées via une constante unique DURATIONS.
 *  - Messages d'erreur plus explicites + parsing JSON sécurisé.
 *
 * NOTE (2025-11-26) :
 *  - Le libellé insiste désormais sur le fait qu’il s’agit d’un ACCÈS PARTIEL /
 *    nominatif, et non d’un abonnement Essentiel complet.
 */

import React from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

type Props = {
  /** Identifiant technique du plan (API) — par défaut "essentiel" */
  planId?: string
  /** Label marketing affiché — par défaut "Essentiel" */
  planLabel?: string
}

type State = {
  email: string
  loading: boolean
  msg: string | null
}

const DURATIONS = [30, 60, 90] as const // unique source of truth pour la validation

// -----------------------------------------------------------------------------
// Utils HTTP (avec cookies + bearer)
// -----------------------------------------------------------------------------
async function callApi(
  supabase: ReturnType<typeof createClientComponentClient>,
  path: string,
  init?: RequestInit
) {
  const { data } = await supabase.auth.getSession()
  const token = data?.session?.access_token

  const headers = new Headers(init?.headers || {})
  headers.set('Content-Type', 'application/json')
  headers.set('Accept', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const resp = await fetch(path, { ...init, headers, credentials: 'include' })
  const contentType = resp.headers.get('content-type') || ''
  const raw = await resp.text()

  // Parse JSON de manière défensive
  let json: any = null
  if (contentType.includes('application/json')) {
    try {
      json = JSON.parse(raw)
    } catch {
      /* ignore */
    }
  }

  if (!resp.ok) {
    const message =
      (json && (json.error || json.message)) ||
      raw ||
      `HTTP ${resp.status}`
    throw new Error(message)
  }
  return json
}

const isLikelyEmail = (v: string) => /\S+@\S+\.\S+/.test(v)

// Champ contrôlé réutilisable
function Field({
  label,
  placeholder,
  value,
  onChange,
  type = 'email',
  disabled = false,
}: {
  label: string
  placeholder: string
  value: string
  onChange: (v: string) => void
  type?: 'text' | 'email'
  disabled?: boolean
}) {
  const style: React.CSSProperties = {
    backgroundColor: '#171717',
    color: '#f5f5f5',
    borderColor: '#404040',
    caretColor: '#f5f5f5',
    opacity: disabled ? 0.6 : 1,
  }
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm text-neutral-400">{label}</span>
      <input
        data-admin="1"
        type={type}
        autoComplete="off"
        spellCheck={false}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="px-3 py-2 rounded border outline-none"
        style={style}
        disabled={disabled}
      />
    </label>
  )
}

// -----------------------------------------------------------------------------
// Composant principal — Mode email uniquement
// -----------------------------------------------------------------------------
const OfferEssentielCard: React.FC<Props> = ({
  planId = 'essentiel', // identifiant technique dans l’API
  planLabel = 'Essentiel', // label de base, utilisé dans les textes
}) => {
  const supabase = createClientComponentClient()
  const [s, set] = React.useState<State>({ email: '', loading: false, msg: null })

  function validateBeforeGrant(days: number, email: string): string | null {
    if (!DURATIONS.includes(days as (typeof DURATIONS)[number])) return 'Durée invalide.'
    if (!email) return 'Renseigne un email.'
    if (!isLikelyEmail(email)) return 'Email invalide.'
    return null
  }

  async function grant(days: number) {
    const email = s.email.trim()
    const err = validateBeforeGrant(days, email)
    if (err) return set((v) => ({ ...v, msg: err }))

    set((v) => ({ ...v, loading: true, msg: null }))
    try {
      await callApi(supabase, '/api/admin/overrides/grant-plan', {
        method: 'POST',
        body: JSON.stringify({ email, plan: planId, days }),
      })
      // On insiste bien sur le côté "accès partiel", nominatif.
      set((v) => ({
        ...v,
        msg: `Offert à ${email} : ${days} jours d’accès partiel ${planLabel} ✅`,
      }))
    } catch (e: any) {
      set((v) => ({ ...v, msg: `Erreur : ${e?.message ?? e}` }))
    } finally {
      set((v) => ({ ...v, loading: false }))
    }
  }

  async function revoke() {
    const email = s.email.trim()
    if (!email) return set((v) => ({ ...v, msg: 'Renseigne un email pour révoquer.' }))
    if (!isLikelyEmail(email)) return set((v) => ({ ...v, msg: 'Email invalide.' }))

    set((v) => ({ ...v, loading: true, msg: null }))
    try {
      // Si l’API révoque "quel que soit le plan" quand plan=null, on garde.
      // Sinon, passe plan: planId pour limiter à ce plan.
      const j = await callApi(supabase, '/api/admin/overrides/revoke-plan', {
        method: 'POST',
        body: JSON.stringify({ email, plan: null }),
      })
      const count = (j && (j.revoked ?? j.count ?? 0)) as number
      set((v) => ({ ...v, msg: `Révoqué (${count}) ✅` }))
    } catch (e: any) {
      set((v) => ({ ...v, msg: `Erreur : ${e?.message ?? e}` }))
    } finally {
      set((v) => ({ ...v, loading: false }))
    }
  }

  return (
    <div className="relative z-10 rounded-2xl p-4 md:p-6 shadow border border-neutral-800 bg-neutral-900 text-neutral-100 space-y-4">
      {/* Titre explicite : accès partiel Essentiel, nominatif */}
      <div className="text-lg md:text-xl font-semibold">
        Offrir accès partiel {planLabel} (sans CB)
      </div>

      <Field
        label="Par Email"
        placeholder="ex: utilisateur@exemple.com"
        value={s.email}
        onChange={(v) => set((x) => ({ ...x, email: v }))} // pas de trim ici
        disabled={s.loading}
      />

      <div className="flex flex-wrap gap-2">
        <button
          className="px-3 py-2 rounded bg-neutral-700 hover:bg-neutral-600 disabled:opacity-50"
          disabled={s.loading}
          onClick={() => grant(30)}
        >
          Offrir 1 mois
        </button>
        <button
          className="px-3 py-2 rounded bg-neutral-700 hover:bg-neutral-600 disabled:opacity-50"
          disabled={s.loading}
          onClick={() => grant(60)}
        >
          Offrir 2 mois
        </button>
        <button
          className="px-3 py-2 rounded bg-neutral-700 hover:bg-neutral-600 disabled:opacity-50"
          disabled={s.loading}
          onClick={() => grant(90)}
        >
          Offrir 3 mois
        </button>
        <div className="flex-1" />
        <button
          className="px-3 py-2 rounded bg-red-700 hover:bg-red-600 disabled:opacity-50"
          disabled={s.loading}
          onClick={revoke}
        >
          Révoquer
        </button>
      </div>

      <div className="text-xs text-neutral-500 space-y-1">
        <p>
          Aucun passage par Stripe. Accès partiel {planLabel} via override temporaire
          nominatif (email unitaire).
        </p>
      </div>

      {s.msg && (
        <div className="text-sm text-amber-300 whitespace-pre-wrap">{s.msg}</div>
      )}
    </div>
  )
}

export default OfferEssentielCard
