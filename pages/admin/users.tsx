// -*- coding: utf-8 -*-
// File: /pages/admin/users.tsx
// Vivaya — Admin (ancienne page Overrides individuels, système retiré)
// -----------------------------------------------------------------------------
// Rôle : interface d’administration pour rechercher un utilisateur.
// Le système d’overrides individuels (user_feature_overrides) a été retiré.
// Cette page reste en place pour consultation et gestion future, mais sans actions.
// -----------------------------------------------------------------------------
// RÈGLES VIVAYA : code robuste, simple, logique ; UTF‑8 ; commentaires sobres ;
// pas d’usine à gaz ; visuel conservé à l’identique.
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../../lib/supabaseClient'
import { useRouter } from 'next/router'

type Profile = { id: string; email: string | null; username: string | null }

export default function AdminUsers() {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Profile[]>([])
  const [banner, setBanner] = useState<{kind:'info'|'error', msg:string}|null>(null)

  // Vérification admin (inchangée)
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      const { data: ok } = await supabase.rpc('is_admin')
      setIsAdmin(!!ok)
    })()
  }, [router])

  // Recherche utilisateurs (inchangée)
  async function search() {
    setBanner(null)
    const q = query.trim()
    if (!q) { setResults([]); return }
    const { data, error } = await supabase
      .from('profiles')
      .select('id,email,username')
      .or(`email.ilike.%${q}%,username.ilike.%${q}%`)
      .limit(20)
    if (error) { console.error(error); setBanner({kind:'error', msg:'Erreur recherche.'}); return }
    setResults(data || [])
  }

  if (isAdmin === false) return <div>Accès refusé.</div>

  // Palette interne (conservée)
  const cardBg  = '#f3f1ec'
  const border  = '#ded9cf'
  const text    = '#1c1b1a'

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#1c1b1a', padding: 24 }}>
      <div style={{ maxWidth: 980, margin: '0 auto', padding: 16, backgroundColor: '#2a2928', borderRadius: 12, border: `1px solid ${border}`, color: text }}>
        {/* Navigation */}
        <div style={{ marginBottom: 8, fontSize: 14 }}>
          <Link href="/admin" style={{ textDecoration: 'none', color: '#eaeaea' }}>← Retour au tableau de bord Admin</Link>
        </div>
        <div style={{ marginBottom: 10, fontSize: 14 }}>
          <span style={{ opacity: .8, marginRight: 8, color: '#eaeaea' }}>Outils rapides :</span>
          <Link href="/admin/plans" style={{ marginRight: 10, color: '#eaeaea' }}>🧭 Plans</Link>
          <Link href="/admin/cohorts" style={{ marginRight: 10, color: '#eaeaea' }}>👥 Cohortes (legacy)</Link>
          <Link href="/admin/active-overrides" style={{ color: '#eaeaea' }}>⚡ Avantages (legacy)</Link>
        </div>

        <h1 style={{ margin: 0, marginBottom: 8, color: '#f5f5f5' }}>Admin · Utilisateurs</h1>

        {/* Explications */}
        <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 10, padding: 12, marginBottom: 16 }}>
          <p style={{ margin: 0, lineHeight: 1.5 }}>
            Cette page permet de rechercher des utilisateurs. <br />
            ⚠️ Le système d’overrides individuels a été <strong>désactivé</strong>.
          </p>
          <p style={{ margin: '6px 0 0 0', fontSize: 13, opacity: 0.85 }}>
            EN: The user feature override system has been retired (legacy mode).
          </p>
        </div>

        {banner && (
          <div style={{
            marginBottom: 12,
            padding: 10,
            borderRadius: 8,
            border: `1px solid ${banner.kind === 'error' ? '#f6b7b7' : '#cfe6c5'}`,
            background: banner.kind === 'error' ? '#fde8e8' : '#eef7ec',
            color: banner.kind === 'error' ? '#a40000' : '#215c2f'
          }}>
            {banner.msg}
          </div>
        )}

        {/* Bloc recherche utilisateur */}
        <div 
          style={{ 
            display: 'flex', 
            flexDirection: 'column',
            gap: 8, 
            background: cardBg, 
            border: `1px solid ${border}`, 
            borderRadius: 10, 
            padding: 10, 
            alignItems: 'center'
          }}
        >
          <input
            placeholder="Rechercher par email ou pseudo"
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '8px 10px', 
              border: `1px solid ${border}`, 
              borderRadius: 8, 
              background: '#fff' 
            }}
          />
          <button
            onClick={search}
            style={{ 
              padding: '8px 16px', 
              borderRadius: 8, 
              border: `1px solid ${border}`, 
              background: '#efece6', 
              cursor: 'pointer', 
              minWidth: 120, 
              textAlign: 'center' 
            }}
          >
            Rechercher
          </button>
        </div>

        {/* Résultats de recherche */}
        {results.length > 0 && (
          <div style={{ marginTop: 12, background: cardBg, border: `1px solid ${border}`, borderRadius: 10, padding: 10 }}>
            <h3 style={{ marginTop: 0 }}>Résultats</h3>
            <ul style={{ paddingLeft: 18, margin: 0 }}>
              {results.map(r => (
                <li key={r.id} style={{ marginBottom: 6 }}>
                  <div
                    style={{ border: `1px solid ${border}`, background: '#fff', borderRadius: 8, padding: '6px 8px' }}
                  >
                    {r.username || '(sans pseudo)'} — {r.email}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Bloc legacy désactivé */}
        <div style={{ marginTop: 20, background: '#f9f6f2', border: `1px solid ${border}`, borderRadius: 10, padding: 14 }}>
          <h3 style={{ marginTop: 0 }}>Fonction “Overrides individuels” retirée</h3>
          <p style={{ margin: 0, lineHeight: 1.5, fontSize: 14 }}>
            Ce module est désormais inactif. Aucun ajout, modification ou suppression d’avantages individuels n’est possible.
          </p>
        </div>
      </div>
    </div>
  )
}

// -----------------------------------------------------------------------------
// FIN fichier /pages/admin/users.tsx (version sans overrides)
// -----------------------------------------------------------------------------
