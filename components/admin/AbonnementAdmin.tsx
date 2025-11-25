// -*- coding: utf-8 -*-
// File: components/admin/AbonnementAdmin.tsx
// Vivaya — Admin (ancien simulateur d’abonnement, désactivé)
// -----------------------------------------------------------------------------
// Rôle d’origine : permettre aux administrateurs de simuler un abonnement via
// un override 'preview_subscription_tier' stocké dans user_feature_overrides.
// ⚠️ Le système d’overrides ayant été retiré, ce composant est désormais inactif.
// -----------------------------------------------------------------------------
// RÈGLES VIVAYA : code robuste, simple, logique ; UTF‑8 ; commentaires sobres ;
// pas d’usine à gaz ; visuel conservé.
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function AbonnementAdmin() {
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    // Vérification admin (maintenue)
    (async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const { data: ok } = await supabase.rpc('is_admin')
      setIsAdmin(!!ok)
    })()
  }, [])

  if (!isAdmin) return null

  // Palette visuelle (inchangée)
  const cardClass = 'rounded-lg border border-gray-700 bg-gray-800 p-4 text-gray-100'

  return (
    <div className={cardClass}>
      <div className="font-semibold mb-2">🎚️ Simulation abonnement (legacy)</div>
      <p className="text-sm opacity-90 mb-3">
        Ce module de simulation d’abonnement a été <strong>désactivé</strong>.
        <br />
        Aucun changement de plan ou de niveau d’accès n’est effectué ici.
      </p>
      <div className="flex flex-wrap gap-2">
        <button className="px-3 py-2 rounded border bg-gray-700 border-gray-600 opacity-60 cursor-not-allowed">
          Sans abo
        </button>
        <button className="px-3 py-2 rounded border bg-gray-700 border-gray-600 opacity-60 cursor-not-allowed">
          Premium
        </button>
        <button className="px-3 py-2 rounded border bg-gray-700 border-gray-600 opacity-60 cursor-not-allowed">
          Élite
        </button>
        <button className="px-3 py-2 rounded border bg-gray-900 border-gray-700 opacity-60 cursor-not-allowed">
          Désactiver l’aperçu
        </button>
      </div>
      <div className="mt-2 text-xs opacity-70">
        Legacy mode — le simulateur d’abonnement n’est plus actif.
      </div>
    </div>
  )
}

// -----------------------------------------------------------------------------
// FIN fichier components/admin/AbonnementAdmin.tsx (version désactivée)
// -----------------------------------------------------------------------------
