// -*- coding: utf-8 -*-
// components/PlanChip.tsx
// Petit badge qui affiche le plan courant de l'utilisateur,
// en s'appuyant sur lib/plans.ts (profiles.subscription_tier).

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { fetchMyPlan } from '@/lib/plans';

export default function PlanChip() {
  const [label, setLabel] = useState<string>('…');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const plan = await fetchMyPlan(supabase);
        if (!cancelled) {
          setLabel(plan.label);
        }
      } catch {
        if (!cancelled) {
          setLabel('Gratuit');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <span className="px-2 py-1 rounded-full text-xs border">
      {label}
    </span>
  );
}
