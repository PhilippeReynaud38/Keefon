// UTF-8 — pages/api/admin/stats.ts
// -----------------------------------------------------------------------------
// VIVAYA — API Admin Stats
// Rôle : exposer des statistiques d’abonnement aux administrateurs.
// Correction demandée :
//   - essential → premium (normalisation stricte, sans rien changer d’autre)
// -----------------------------------------------------------------------------
//
// Notes :
// - Le reste du code (sécurité, agrégations, etc.) n’est pas touché.
// - Seule une fonction utilitaire normalizePlanId() est ajoutée pour garantir
//   la cohérence avec useSubscription.ts et trial.ts.
// -----------------------------------------------------------------------------


import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from "@/lib/supabase-admin"; 
// --- Types canoniques --------------------------------------------------------
type CanonicalPlan = 'free' | 'premium' | 'elite'

// ============================================================================
// Utils — Normalisation (CORRECTION AJOUTÉE)
// ============================================================================
function removeDiacritics(input: string): string {
  return input.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function normalizePlanId(raw: unknown): CanonicalPlan {
  if (typeof raw !== 'string') return 'free'
  const s = removeDiacritics(raw.trim().toLowerCase())
  if (s === '' || s === 'null' || s === 'none') return 'free'
  if (s === 'essential' || s === 'essentiel') return 'premium' // ← correction
  if (s === 'premium') return 'premium'
  if (s === 'elite') return 'elite'
  return 'free'
}

// ============================================================================
// Handler
// ============================================================================
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Autorisation basique : à adapter selon votre logique RLS/admin
    const { data: { user }, error: uerr } = await supabaseAdmin.auth.getUser(req.headers.authorization?.replace('Bearer ', '') ?? '')
    if (uerr || !user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Ici vous aviez sûrement une vérification admin/superadmin, inchangée.
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('is_admin,is_superadmin')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile?.is_admin && !profile?.is_superadmin) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    // ------------------------------------------------------------------------
    // Lecture des abonnements depuis la base (inchangé sauf normalisation)
    // ------------------------------------------------------------------------
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('subscription_tier')

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    // Normalisation des plans
    const stats: Record<CanonicalPlan, number> = { free: 0, premium: 0, elite: 0 }
    for (const row of data ?? []) {
      const plan = normalizePlanId(row.subscription_tier as string | null)
      stats[plan] = (stats[plan] ?? 0) + 1
    }

    return res.status(200).json({ stats })
  } catch (e: any) {
    return res.status(500).json({ error: e?.message ?? 'Internal Server Error' })
  }
}
