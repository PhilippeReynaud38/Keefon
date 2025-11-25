/**
 * lib/supabaseClient.ts
 * ------------------------------------------------------------
 * Objectif : exposer un client Supabase **singleton** côté client,
 * sans nullable et sans conflit de types avec createPagesBrowserClient.
 *
 * Contexte/Module : Next.js (Pages Router)
 * Dépendances : @supabase/auth-helpers-nextjs, @supabase/supabase-js
 * Accès données : via le client Supabase public (browser)
 * Effets de bord : aucun (hors création paresseuse du client)
 * Invariants :
 *   - Retourne toujours un client non-nullable
 *   - Pas d’état global autre que l’instance mémorisée
 * Dernière mise à jour : 2025-10-28
 * ------------------------------------------------------------
 */

import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs'
import type { SupabaseClient } from '@supabase/supabase-js'

// ⚠️ IMPORTANT : on aligne les types sur `any` pour éviter le mismatch
// avec GenericSchema quand on n'utilise pas un type Database généré.
type AnyClient = SupabaseClient<any>

// Cache interne (rempli au premier appel)
let _client: AnyClient | undefined

/** Retourne l’instance Supabase **unique** (client-side). */
export function getSupabaseClient(): AnyClient {
  if (!_client) {
    // Tip : si tu as un type Database, fais createPagesBrowserClient<Database>()
    _client = createPagesBrowserClient<any>()
  }
  return _client
}

/** Instance prête à l’emploi (non-nullable). */
export const supabase: AnyClient = getSupabaseClient()

export default supabase
// -----------------------------------------------------------------------------
// DEV ONLY — exposer le client Supabase dans la console du navigateur.
// - Ne s'exécute que côté client
// - Ignoré en production
// - N'écrase pas une éventuelle référence déjà fixée par HMR
// -----------------------------------------------------------------------------
if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
  // @ts-ignore: helper de debug volontaire
  window.supabase = window.supabase ?? supabase;
}
