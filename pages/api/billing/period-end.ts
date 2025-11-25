// pages/api/billing/period-end.ts
// Endpoint neutralisé : on n’utilise plus Stripe.
// On garde juste une route compatible qui répond proprement.

import type { NextApiRequest, NextApiResponse } from 'next'

type PeriodEndResponse = {
  current_period_end: number | null
}

/**
 * En attendant un vrai PSP :
 * - on accepte uniquement GET
 * - on renvoie toujours current_period_end: null
 * - aucun appel à Stripe, aucune logique de facturation.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PeriodEndResponse | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  return res.status(200).json({ current_period_end: null })
}
