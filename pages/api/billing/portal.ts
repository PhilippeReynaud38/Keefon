import type { NextApiRequest, NextApiResponse } from 'next'

/**
 * /api/billing/portal
 *
 * Endpoint TEMPORAIRE pendant que Stripe est désactivé.
 * ----------------------------------------------------
 * - On ne crée plus de session billingPortal Stripe.
 * - On renvoie simplement une URL de repli vers la page /abonnement,
 *   pour que le frontend ne crashe pas lorsqu’il appelle cette route.
 *
 * Quand un nouveau PSP sera choisi, il faudra :
 *   1. Rebrancher ici la création de session côté PSP,
 *   2. Retourner l’URL réelle du portail de facturation dans { url }.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ url: string } | string>
) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed')
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''

  // Placeholder : on renvoie simplement vers la page abonnement.
  // Le frontend attend un objet { url }, on respecte donc ce contrat.
  return res.status(200).json({
    url: `${baseUrl}/abonnement?billing=disabled`,
  })
}
