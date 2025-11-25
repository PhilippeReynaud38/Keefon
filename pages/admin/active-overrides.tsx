// -*- coding: utf-8 -*-
// File: /pages/admin/active-overrides.tsx
// Vivaya — Admin (page legacy)
// -----------------------------------------------------------------------------
// Ancienne page d’affichage des overrides actifs (active_overrides_v).
// Le système d’overrides ayant été retiré, cette page est désormais désactivée.
// On conserve le visuel original (fond sombre, cartes beige/gris) pour cohérence.
// -----------------------------------------------------------------------------
// RÈGLES VIVAYA : code robuste, simple, logique ; UTF‑8 ; commentaires sobres ;
// pas d’usine à gaz ; visuel conservé.
// -----------------------------------------------------------------------------

import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function AdminActiveOverridesPage() {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)

  // Vérification admin (conservée)
  useEffect(() => {
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session) { router.push('/login'); return }
      const { data: ok } = await supabase.rpc('is_admin')
      setIsAdmin(!!ok)
    })()
  }, [router])

  if (isAdmin === false) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#1c1b1a', color: '#f5f5f5', padding: 24 }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <p>Accès refusé.</p>
          <p>
            <Link href="/admin" style={{ color: '#9ad5ff' }}>← Retour au tableau de bord</Link>
          </p>
        </div>
      </div>
    )
  }

  // Palette visuelle (inchangée)
  const pageBg = '#1c1b1a'
  const cardBg = '#f3f1ec'
  const border = '#ded9cf'

  return (
    <div style={{ minHeight: '100vh', backgroundColor: pageBg, padding: 24 }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 16, backgroundColor: '#2a2928', borderRadius: 12, border: `1px solid ${border}`, color: '#f5f5f5' }}>
        <div style={{ marginBottom: 8, fontSize: 14 }}>
          <Link href="/admin" style={{ textDecoration: 'none', color: '#eaeaea' }}>← Retour au tableau de bord Admin</Link>
        </div>

        <h1 style={{ margin: 0, marginBottom: 12 }}>Admin · Avantages actifs (désactivé)</h1>

        <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 10, padding: 16, color: '#1c1b1a' }}>
          <h3 style={{ marginTop: 0 }}>Fonctionnalité retirée</h3>
          <p style={{ margin: 0, lineHeight: 1.5 }}>
            Le système d’<strong>overrides / avantages actifs</strong> a été retiré du projet Vivaya.
            <br />
            Cette page reste en place pour référence visuelle, mais elle n’exécute plus aucune requête SQL.
          </p>
          <p style={{ marginTop: 10, fontSize: 13, opacity: 0.85 }}>
            EN: The active overrides system has been retired. No data is loaded from Supabase.
          </p>
        </div>
      </div>
    </div>
  )
}

// -----------------------------------------------------------------------------
// FIN fichier /pages/admin/active-overrides.tsx (version désactivée)
// -----------------------------------------------------------------------------
