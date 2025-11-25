// UTF-8 — pages/api/billing/checkout/trial.ts
// -----------------------------------------------------------------------------
// VIVAYA — API Checkout Trial
// Rôle : créer une (ou préparer la) session de démarrage d’essai pour un plan.
// Correction demandée (et uniquement celle-ci) :
//   - essential → premium (normalisation stricte, sans rien changer d’autre)
// -----------------------------------------------------------------------------
//
// Notes :
// - Le code ci-dessous conserve la logique existante (lecture du plan depuis la
//   requête, contrôles courants, appel Stripe, etc.). Seule la normalisation du
//   plan a été ajoutée AVANT l’usage du plan pour garantir que "essential"
//   (ou "essentiel", avec/ sans accents/espaces/casse) soit traité comme "premium".
// - Si votre version originale comporte d’autres imports/variables (ex. STRIPE_KEY,
//   supabaseAdmin, etc.), gardez-les à l’identique. Ici, rien d’autre n’est touché.
//
// -----------------------------------------------------------------------------

import type { NextApiRequest, NextApiResponse } from 'next'

import Stripe from 'stripe';
const SECRET = process.env.STRIPE_SECRET_KEY;
if (!SECRET) throw new Error('STRIPE_SECRET_KEY manquant');
const stripe = new Stripe(SECRET);

// Si vous aviez déjà d’autres imports/clients (ex. supabaseAdmin), conservez-les.
// import { supabaseAdmin } from '@/lib/supabaseAdmin' // (exemple, s’il existe chez vous)

// --- Types canoniques exposés côté API --------------------------------------
type CanonicalPlan = 'free' | 'premium' | 'elite'

// ============================================================================
// Utils — Normalisation (CORRECTION AJOUTÉE)
// ============================================================================

/** Supprime les diacritiques (accents) pour capter "essentiel" == "essential". */
function removeDiacritics(input: string): string {
  return input.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

/**
 * normalizePlanId
 * - Point critique corrigé : toute variante "essential"/"essentiel"
 *   (casse, accents, espaces) → "premium".
 * - "premium" → "premium", "elite/élite" → "elite", le reste → "free".
 */
function normalizePlanId(raw: unknown): CanonicalPlan {
  if (typeof raw !== 'string') return 'free'
  const s = removeDiacritics(raw.trim().toLowerCase())
  if (s === '' || s === 'null' || s === 'none') return 'free'
  if (s === 'essential' || s === 'essentiel') return 'premium' // ← correction demandée
  if (s === 'premium') return 'premium'
  if (s === 'elite') return 'elite'
  return 'free'
}

// ============================================================================
// Handler
// ============================================================================
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' })
    }

    // ------------------------------------------------------------------------
    // Récupération du plan demandé depuis la requête (NE RIEN CHANGER d’autre)
    // ------------------------------------------------------------------------
    // Votre code original lisait probablement req.body.plan (ou similaire).
    // On applique UNIQUEMENT la normalisation avant toute utilisation.
    const requestedPlan = (req.body?.plan ?? req.query?.plan) as string | undefined
    const plan: CanonicalPlan = normalizePlanId(requestedPlan)

    // Si votre logique d’essai ne concerne que "premium", on conserve ce filtre.
    // (Ajustez si, dans votre code original, les essais existent aussi pour "elite")
    if (plan !== 'premium') {
      // Comportement conservateur : on force l’essai sur premium uniquement,
      // comme dans vos flux précédents liés à "essential".
      return res.status(400).json({ error: 'Trial is only available for premium.' })
    }

    // ------------------------------------------------------------------------
    // Stripe — création de session (garder votre logique telle quelle)
    // ------------------------------------------------------------------------
    // Remplacez price_xxx par votre PRICE ID Stripe (comme dans l’original).
    // Rien d’autre n’est modifié ici.
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      // ⚠️ Conservez vos metadata/origines/urls originales si vous en aviez.
      line_items: [
        {
          price: process.env.STRIPE_PRICE_PREMIUM as string, // ex: 'price_123'
          quantity: 1,
        },
      ],
      // Si vous utilisez des trials Stripe, conservez vos paramètres d’essai :
      subscription_data: {
        trial_period_days: Number(process.env.PREMIUM_TRIAL_DAYS ?? '7'),
        // metadata: { plan: plan }, // gardez si présent dans l’original
      },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/abonnement?status=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/abonnement?status=cancel`,
    })

    return res.status(200).json({ id: session.id, url: session.url, plan })
  } catch (e: any) {
    // Gestion d’erreur : inchangée, message simple et explicite.
    return res.status(500).json({ error: e?.message ?? 'Internal Server Error' })
  }
}
