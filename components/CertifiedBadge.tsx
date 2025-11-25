// UTF-8 — components/CertifiedBadge.tsx
// -----------------------------------------------------------------------------
// Badge "✔ certifié" pour un profil utilisateur.
// Règles Vivaya : simple, robuste, lisible, sans gadgets inutiles.
//
// ✅ Source de vérité : profiles.certified_status == 'approved'
// ⛔ Ne dépend PAS de certified_photos.status (peut rester 'pending' selon triggers)
// 🔐 RLS : nécessite une policy qui autorise la lecture du profil public concerné
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

interface CertifiedBadgeProps {
  userId: string
  className?: string
}

export default function CertifiedBadge({ userId, className }: CertifiedBadgeProps) {
  const [isCertified, setIsCertified] = useState(false)

  useEffect(() => {
    if (!userId) return

    let alive = true

    // Lecture initiale (évite l’erreur 406 si aucune ligne)
    const load = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('certified_status')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        console.error('CertifiedBadge / fetch:', error.message)
        return
      }
      if (!alive) return
      setIsCertified(data?.certified_status === 'approved')
    }

    load()

    // Realtime : se met à jour si le statut de certification change
    const ch = supabase
      .channel(`cert-badge-${userId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` },
        (payload) => {
          const next = (payload.new as { certified_status?: string })?.certified_status
          setIsCertified(next === 'approved')
        }
      )
      .subscribe()

    return () => {
      alive = false
      supabase.removeChannel(ch)
    }
  }, [userId])

  // Rien à afficher si non certifié
  if (!isCertified) return null

  // Badge sobre (pas d’SVG inutile)
  return (
    <span
      className={`ml-2 inline-flex items-center text-green-600 text-sm ${className || ''}`}
      title="Profil certifié par l’équipe Vivaya"
    >
      ✔ certifié
    </span>
  )
}
