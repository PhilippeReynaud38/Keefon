// File: features/billing/client.ts
// Purpose: démarrer Stripe Checkout (Option B) et remonter les erreurs lisibles. // [VL]
export async function createCheckoutSession(plan: 'premium' | 'elite'): Promise<string> {
  const res = await fetch('/api/billing/checkout/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan }),
  });
  const text = await res.text();

  if (!res.ok) {
    try {
      const { error } = JSON.parse(text);
      throw new Error(error || 'checkout failed');
    } catch {
      throw new Error(text || 'checkout failed');
    }
  }

  let data: any = {};
  try { data = JSON.parse(text); } catch { /* ignore */ }

  if (!data?.url) throw new Error('checkout failed: no URL returned');
  return data.url as string;
}
