// -*- coding: utf-8 -*-
// File: pages/api/admin/overrides/active-count.ts
// -----------------------------------------------------------------------------
// VIVAYA — GET /api/admin/overrides/active-count
//
// Objectif : NE PLUS RENVOYER 410 (Gone).
// - Si un token est présent et que la RPC `overrides_active_count` existe → on l'utilise.
// - Sinon → on renvoie { ok: true, count: 0 } en **200** (fallback silencieux).
//
// Règles Vivaya : code simple, robuste, commenté, UTF-8, pas d’usine à gaz.
// -----------------------------------------------------------------------------

import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

type ApiOk = { ok: true; count: number }
type ApiErr = { ok: false; error: string }

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiOk | ApiErr>
) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate')
  res.setHeader('Content-Type', 'application/json; charset=utf-8')

  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '')

  // Si la config Supabase n'est pas dispo → fallback 0 en 200
  if (!url || !anonKey) {
    return res.status(200).json({ ok: true, count: 0 })
  }

  try {
    const supabase = createClient(url, anonKey, {
      global: { headers: token ? { Authorization: `Bearer ${token}` } : {} },
    })

    // Tente la RPC SECURITY DEFINER (si elle n'existe pas, on gère plus bas)
    const { data, error } = await supabase.rpc('overrides_active_count')

    if (error) {
      // On journalise côté serveur, mais on reste **200** côté client
      console.warn('[active-count] RPC error:', error.message)
      return res.status(200).json({ ok: true, count: 0 })
    }

    const count = typeof data === 'number' ? data : 0
    return res.status(200).json({ ok: true, count })
  } catch (e: any) {
    console.warn('[active-count] handler error:', e?.message || e)
    return res.status(200).json({ ok: true, count: 0 })
  }
}
