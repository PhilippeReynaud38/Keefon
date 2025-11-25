// ─────────────────────────────────────────────────────────────────────────────
// File: pages/api/billing/checkout/create.ts
// Rôle : Créer une Session Stripe Checkout en mode « subscription ».
// Notes :
// - Prend en compte le cycle choisi côté UI (mensuel | trimestriel).
// - Active la TVA automatique (si Stripe Tax configuré côté dashboard).
// - Redirige vers /checkout/success et /checkout/cancel (pages déjà présentes).
// - Messages d’erreur explicites pour faciliter le debug.
// Env attendues (TEST ou LIVE selon l’environnement) :
// STRIPE_SECRET_KEY
// STRIPE_PRICE_PREMIUM_MONTHLY
// STRIPE_PRICE_PREMIUM_QUARTERLY
// STRIPE_PRICE_ELITE_MONTHLY
// STRIPE_PRICE_ELITE_QUARTERLY
// NEXT_PUBLIC_SITE_URL (ex: http://localhost:3000)
// ─────────────────────────────────────────────────────────────────────────────
import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from "stripe";

const SECRET = process.env.STRIPE_SECRET_KEY;
if (!SECRET) throw new Error("STRIPE_SECRET_KEY manquant");

// ✅ adapte la version à ce que ton SDK attend
const stripe = new Stripe(SECRET, { apiVersion: "2025-08-27.basil" });

type Plan = 'premium' | 'elite';      // id interne (labels: Essentiel / Élite)
type Cycle = 'monthly' | 'quarterly'; // Mensuelle / Trimestrielle

const PRICES: Record<Plan, Record<Cycle, string | undefined>> = {
  premium: {
    monthly: process.env.STRIPE_PRICE_PREMIUM_MONTHLY,     // price_****
    quarterly: process.env.STRIPE_PRICE_PREMIUM_QUARTERLY, // price_****
  },
  elite: {
    monthly: process.env.STRIPE_PRICE_ELITE_MONTHLY,       // price_****
    quarterly: process.env.STRIPE_PRICE_ELITE_QUARTERLY,   // price_****
  },
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { plan, cycle, email } = req.body as {
      plan: Plan;          // 'premium' | 'elite'
      cycle?: Cycle;       // 'monthly' | 'quarterly' (default: monthly)
      email?: string;      // optionnel
    };

    const usedCycle: Cycle = cycle ?? 'monthly';
    const priceId = plan && PRICES[plan]?.[usedCycle];

    if (!priceId) {
      return res.status(400).json({ error: 'Plan/cycle invalide ou PRICE manquant en .env' });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      automatic_tax: { enabled: true },
      success_url: `${SITE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}/checkout/cancel`,
      customer_email: email, // laissé, Stripe peut aussi collecter l’email côté Checkout
      metadata: { plan, cycle: usedCycle },
    });

    return res.status(200).json({ url: session.url });
  } catch (err: any) {
    console.error('[checkout/create] stripe error:', err);
    return res.status(400).json({ error: err?.message ?? 'Stripe error' });
  }
}
