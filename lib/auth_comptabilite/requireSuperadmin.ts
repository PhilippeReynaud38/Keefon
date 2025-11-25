// lib/auth/requireSuperadmin.ts
// UTF-8
// Vérifie côté client si l'utilisateur courant est superadmin.
// Dépend de la vue admin.users_v (champ is_superadmin: boolean).
// Aucune logique cachée, aucun fallback risqué.

import { supabase } from '@/lib/supabaseClient'; // <-- adapte ce chemin à ton projet

export type SuperadminCheck =
  | { ok: true }
  | { ok: false; reason: 'no-session' | 'query-error' };

export async function requireSuperadmin(): Promise<SuperadminCheck> {
  // 1) Session
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;
  if (!user) return { ok: false, reason: 'no-session' };

  // 2) Vue admin.users_v (id = user.id)
  const { data, error } = await supabase
    .from('admin.users_v')
    .select('is_superadmin')
    .eq('id', user.id)
    .limit(1)
    .single();

  if (error) return { ok: false, reason: 'query-error' };

  return data?.is_superadmin ? { ok: true } : { ok: false, reason: 'no-session' };
}
