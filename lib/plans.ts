// lib/plans.ts
// Objectif: fournir (id,label) du plan courant pour l'utilisateur connecté
// Source de vérité : profiles.subscription_tier
// Invariants : id ∈ {'free','premium','elite'}  → labels FR stables

export type PlanId = 'free' | 'premium' | 'elite';

const PLAN_LABEL: Record<PlanId, string> = {
  free: 'Gratuit',
  premium: 'Essentiel',
  elite: 'Keefon+',
};

export function labelOf(planId: PlanId): string {
  return PLAN_LABEL[planId] ?? 'Gratuit';
}

export async function fetchMyPlan(supabase: any): Promise<{ id: PlanId; label: string }> {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth?.user?.id;
  if (!uid) return { id: 'free', label: PLAN_LABEL.free };

  const { data, error } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('id', uid)
    .single();

  if (error) return { id: 'free', label: PLAN_LABEL.free };

  const id = (data?.subscription_tier ?? 'free') as PlanId;
  return { id, label: PLAN_LABEL[id] };
}
