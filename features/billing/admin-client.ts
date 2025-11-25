// File: features/billing/admin-client.ts
// Purpose: Client admin pour créer un code promo Essentiel offert (1/2/3 mois)
// Notes: UTF-8. Tolère les deux formats de réponse (ancien/nouveau). // [VL]

export type OfferMonths = 1 | 2 | 3;

// Réponse possible (ancien + nouveau schéma)
type ApiOk = {
  code: string;

  // Ancien schéma
  expires_at?: number;
  months?: OfferMonths;

  // Nouveau schéma
  code_expires_at?: number;
  coupon_months?: OfferMonths;

  // Infos optionnelles
  product_restricted?: boolean;
  applied_product_id?: string | null;
};

export type PromoResult = {
  code: string;
  codeExpiresAt: number;     // epoch seconds
  months: OfferMonths;       // 1/2/3
  productRestricted: boolean;
  productId: string | null;
};

export async function createPremiumOffer(months: OfferMonths): Promise<PromoResult> {
  const res = await fetch('/api/billing/coupons/create-promo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan: 'premium', months }),
  });

  const text = await res.text();
  if (!res.ok) {
    try {
      const { error } = JSON.parse(text);
      throw new Error(error || 'create-promo failed');
    } catch {
      throw new Error(text || 'create-promo failed');
    }
  }

  const data = JSON.parse(text) as ApiOk;

  // Normalisation des champs (nouveau >> ancien >> fallback)
  const codeExpiresAt = data.code_expires_at ?? data.expires_at ?? 0;
  const outMonths = (data.coupon_months ?? data.months ?? months) as OfferMonths;

  return {
    code: data.code,
    codeExpiresAt,
    months: outMonths,
    productRestricted: !!data.product_restricted,
    productId: data.applied_product_id ?? null,
  };
}
