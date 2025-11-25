// -*- coding: utf-8 -*-
/**
 * Vivaya — pages/api/billing/coupons/create-promo.ts
 * Objectif : créer un coupon + un code promo Stripe.
 *
 * Contexte :
 * - Corrige l’erreur TS liée à Stripe apiVersion ("2024-06-20" rejeté).
 * - Utilise l’apiVersion typée attendue par le SDK récent : '2025-08-27.basil'.
 * - Ne modifie rien d’autre dans le projet.
 *
 * Entrée (POST JSON) minimale :
 * {
 *   "code": "VIVAYA-TEST-20",
 *   // Option A (pourcentage)
 *   "percentOff": 20,
 *   // OU Option B (montant fixe)
 *   // "amountOff": 500, "currency": "eur",
 *
 *   // Options :
 *   "duration": "once" | "repeating" | "forever",   // défaut: "once"
 *   "durationInMonths": 3,                           // requis si duration="repeating"
 *   "maxRedemptions": 100,                           // limite d’utilisations du code promo
 *   "expiresAt": 1735689600,                         // timestamp UNIX (secs)
 *   "active": true,                                  // défaut: true
 *   // Restreindre au produit “Essentiel”/“Premium” (id Stripe)
 *   // (sinon, on peut aussi passer explicitement "restrictToProduct")
 *   "restrictToProduct": "prod_XXXX"
 * }
 *
 * Note :
 * - Par défaut, si aucune restriction produit n’est fournie dans le body,
 *   on lira la variable d’env STRIPE_PRODUCT_PREMIUM (si présente) pour
 *   restreindre le coupon à ce produit.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";

// Clés d’environnement
const SECRET = process.env.STRIPE_SECRET_KEY?.trim();
const PRODUCT_PREMIUM_ENV = process.env.STRIPE_PRODUCT_PREMIUM?.trim();

// Instanciation Stripe — version typée requise par le SDK installé
if (!SECRET) {
  throw new Error("STRIPE_SECRET_KEY manquant dans l'environnement.");
}
const stripe = new Stripe(SECRET, { apiVersion: "2025-08-27.basil" });

type Body = {
  code?: string;

  // Option A
  percentOff?: number;

  // Option B
  amountOff?: number;
  currency?: string;

  duration?: "once" | "repeating" | "forever";
  durationInMonths?: number;

  maxRedemptions?: number;
  expiresAt?: number; // UNIX seconds
  active?: boolean;

  restrictToProduct?: string; // si fourni, prioritaire sur STRIPE_PRODUCT_PREMIUM
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const {
      code,
      percentOff,
      amountOff,
      currency,
      duration = "once",
      durationInMonths,
      maxRedemptions,
      expiresAt,
      active = true,
      restrictToProduct,
    } = (req.body ?? {}) as Body;

    // Validation basique
    if (!code || typeof code !== "string" || code.trim().length < 3) {
      return res.status(400).json({ ok: false, error: "Paramètre 'code' invalide." });
    }

    const usePercent = typeof percentOff === "number" && percentOff > 0;
    const useAmount = typeof amountOff === "number" && amountOff > 0 && typeof currency === "string";

    if (!usePercent && !useAmount) {
      return res.status(400).json({
        ok: false,
        error:
          "Fournir soit { percentOff }, soit { amountOff, currency } pour créer le coupon.",
      });
    }

    if (duration === "repeating" && (!durationInMonths || durationInMonths <= 0)) {
      return res.status(400).json({
        ok: false,
        error: "durationInMonths est requis et > 0 quand duration = 'repeating'.",
      });
    }

    // Restriction produit si demandée (priorité au body)
    const productToRestrict = (restrictToProduct || PRODUCT_PREMIUM_ENV)?.trim();
    const applies_to = productToRestrict ? { products: [productToRestrict] } : undefined;

    // 1) Créer le coupon
    const coupon = await stripe.coupons.create({
      ...(usePercent ? { percent_off: percentOff } : { amount_off: amountOff!, currency: currency! }),
      duration,
      ...(duration === "repeating" ? { duration_in_months: durationInMonths! } : {}),
      ...(applies_to ? { applies_to } : {}),
    });

    // 2) Créer le code promotionnel lié au coupon
    const promo = await stripe.promotionCodes.create({
      code: code.trim().toUpperCase(),
      coupon: coupon.id,
      ...(typeof maxRedemptions === "number" ? { max_redemptions: maxRedemptions } : {}),
      ...(typeof expiresAt === "number" ? { expires_at: expiresAt } : {}),
      active,
    });

    return res.status(200).json({
      ok: true,
      coupon: { id: coupon.id, duration: coupon.duration, percent_off: coupon.percent_off, amount_off: coupon.amount_off, currency: coupon.currency, applies_to: coupon.applies_to ?? null },
      promotion_code: { id: promo.id, code: promo.code, active: promo.active, times_redeemed: promo.times_redeemed, max_redemptions: promo.max_redemptions, expires_at: promo.expires_at },
    });
  } catch (err: any) {
    console.error("create-promo error:", err);
    // Message propre orienté front
    const message =
      (err?.raw?.message as string) ||
      (err?.message as string) ||
      "Création du code promo impossible pour le moment.";
    return res.status(500).json({ ok: false, error: message });
  }
}
