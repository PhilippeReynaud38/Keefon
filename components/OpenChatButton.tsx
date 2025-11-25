// -*- coding: utf-8 -*-
// ============================================================================
// Vivaya — components/OpenChatButton.tsx
// Objet : Bouton "Contacter" qui respecte le quota 10/sem - 25/mois
// Usage : à placer UNIQUEMENT là où l’on initie un 1er contact vers un NON-abonné.
// Effet : si quota OK ➜ log + redirection /chat/[target]; sinon ➜ message clair.
// ============================================================================
import { useState } from 'react'
import { useRouter } from 'next/router'
import { tryOpenFree } from '@/lib/openFree'

type Props = {
  targetUserId: string
  className?: string
  label?: string
}

export default function OpenChatButton({ targetUserId, className, label = 'Contacter' }: Props) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  const handleClick = async () => {
    if (busy) return
    setBusy(true)
    try {
      const res = await tryOpenFree(targetUserId)
      if (!res.ok) {
        if (res.reason === 'auth')      alert('Connecte-toi pour continuer.')
        else if (res.reason === 'weekly')  alert('Limite atteinte : 10 nouvelles conversations cette semaine.')
        else if (res.reason === 'monthly') alert('Limite atteinte : 25 nouvelles conversations ce mois-ci.')
        else                                alert('Ouverture impossible pour le moment.')
        return
      }
      // ✅ OK : on laisse le flux normal (page chat standard)
      router.push(`/chat/${targetUserId}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      className={className ?? 'rounded-xl bg-yellowGreen px-4 py-2 font-semibold text-black hover:opacity-90'}
      aria-label={label}
    >
      {busy ? 'Ouverture…' : label}
    </button>
  )
}
