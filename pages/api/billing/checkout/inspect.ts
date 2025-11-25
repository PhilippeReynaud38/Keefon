// File: pages/api/billing/checkout/inspect.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

const stripe = process.env.STRIPE_SECRET_KEY
 ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-08-27.basil' })
  : null;

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  if (!stripe) return res.status(500).json({ error: 'Stripe not configured' });
  const ids = [
    process.env.STRIPE_PRICE_PREMIUM || '(vide)',
    process.env.STRIPE_PRICE_ELITE || '(vide)',
  ];
  const out = [];
  for (const id of ids) {
    if (!id.startsWith('price_')) { out.push({ id, ok: false, reason: 'pas un price_' }); continue; }
    try {
      const p = await stripe.prices.retrieve(id);
      out.push({ id, type: p.type, recurring: p.recurring || null, ok: !!p.recurring });
    } catch (e:any) {
      out.push({ id, ok: false, reason: e?.message || 'inconnue' });
    }
  }
  res.status(200).json(out);
}
