// UTF-8 — pages/admin/debug.tsx
// -----------------------------------------------------------------------------
// Objet : Espace Debug Admin (outils de scan/suppression d'entrées orphelines).
// Conformité Vivaya : code robuste, simple, logique, très commenté, sans gadgets.
//
// 🔒 AuthN/AuthZ — Guard léger
// - Cette page déclare : `AdminDebugPage.requireAuth = true`.
// - Le guard dans _app.tsx NE S'APPLIQUE QUE si `Component.requireAuth === true`.
// - Comportement (rappel) :
//     • non connecté  → redirection /login
//     • connecté mais inscription incomplète → redirection /presignup (uniquement pages protégées)
//     • après /logout → rester sur '/'
// - 👉 Ici : aucune redirection dans la page elle-même. On affiche seulement un loader
//   pendant la résolution de la session pour éviter les clignotements.
// -----------------------------------------------------------------------------

import type { NextPage } from 'next'
import Head from 'next/head'
import { useState } from 'react'
import { useSessionContext } from '@supabase/auth-helpers-react'
import { supabase } from '@/lib/supabaseClient'
import Button from '@/components/Button'

// ──────────────────────────────────────────────────────────────────────────────
// Typage Next avec propriété statique requireAuth
// ──────────────────────────────────────────────────────────────────────────────

type NextPageWithAuth<P = {}> = NextPage<P> & { requireAuth?: boolean }

// ──────────────────────────────────────────────────────────────────────────────
// UI de base (sobre, sans gadgets)
// ──────────────────────────────────────────────────────────────────────────────

function PageContainer(props: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-gray-100">
      <Head>
        <title>{props.title} • Admin</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <h1 className="text-2xl font-semibold mb-4">{props.title}</h1>
        {props.children}
      </main>
    </div>
  )
}

function SoftLoader() {
  return (
    <div className="py-12 text-center">
      <p>Chargement…</p>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────────
const AdminDebugPage: NextPageWithAuth = () => {
  const { isLoading } = useSessionContext()

  // Messages d'état simples, visibles sous les boutons
  const [message, setMessage] = useState('')
  const [certifiedMessage, setCertifiedMessage] = useState('')
  const [busy, setBusy] = useState(false) // évite les doubles clics

  // ✅ Nettoyage des entrées de `photos` dont le fichier est absent du bucket `avatars`
  const handleCleanStorage = async () => {
    if (busy) return
    setBusy(true)
    setMessage('')

    // 1) Récupère toutes les lignes de la table photos
    const { data: rows, error } = await supabase.from('photos').select('*')
    if (error) {
      setMessage('❌ Erreur Supabase (photos): ' + error.message)
      setBusy(false)
      return
    }

    // 2) Liste (premier niveau) des fichiers présents dans le bucket `avatars`
    const { data: storageList, error: listErr } = await supabase.storage
      .from('avatars')
      .list('', { limit: 1000 })

    if (listErr) {
      setMessage('❌ Erreur listing Storage: ' + listErr.message)
      setBusy(false)
      return
    }

    const existingNames = (storageList || []).map((f) => f.name)

    // 3) Détecte les lignes dont le fichier n'existe pas dans le bucket
    const missing = (rows || []).filter((p: any) => {
      const name = String(p.url || '').split('/').pop() || ''
      return name && !existingNames.includes(name)
    })

    if (missing.length === 0) {
      setMessage('✅ Aucun fichier manquant détecté.')
      setBusy(false)
      return
    }

    // 4) Supprime les entrées orphelines de la table `photos` (SQL uniquement)
    const idsToDelete = missing.map((p: any) => p.id)
    const { error: deleteError } = await supabase.from('photos').delete().in('id', idsToDelete)

    if (deleteError) {
      setMessage('❌ Échec de suppression (photos): ' + deleteError.message)
      setBusy(false)
      return
    }

    setMessage(`✅ Supprimé : ${idsToDelete.length} entrées dans photos`)
    setBusy(false)
  }

  // ✅ Nettoyage des `certified_photos` dont le fichier est manquant dans `avatars`
  const handleCleanCertifiedPhotos = async () => {
    if (busy) return
    setBusy(true)
    setCertifiedMessage('')

    const { data: rows, error } = await supabase.from('certified_photos').select('*')
    if (error) {
      setCertifiedMessage('❌ Erreur Supabase (certified_photos): ' + error.message)
      setBusy(false)
      return
    }

    const { data: storageList, error: listErr } = await supabase.storage
      .from('avatars')
      .list('', { limit: 1000 })

    if (listErr) {
      setCertifiedMessage('❌ Erreur listing Storage: ' + listErr.message)
      setBusy(false)
      return
    }

    const existingNames = (storageList || []).map((f) => f.name)
    const missing = (rows || []).filter((p: any) => {
      const name = String(p.url || '').split('/').pop() || ''
      return name && !existingNames.includes(name)
    })

    if (missing.length === 0) {
      setCertifiedMessage('✅ Aucun fichier manquant détecté.')
      setBusy(false)
      return
    }

    const idsToDelete = missing.map((p: any) => p.id)
    const { error: deleteError } = await supabase
      .from('certified_photos')
      .delete()
      .in('id', idsToDelete)

    if (deleteError) {
      setCertifiedMessage('❌ Échec de suppression (certified_photos): ' + deleteError.message)
      setBusy(false)
      return
    }

    setCertifiedMessage(`✅ Supprimé : ${idsToDelete.length} entrées dans certified_photos`)
    setBusy(false)
  }

  // Loader doux pendant la résolution de la session (évite le flicker)
  if (isLoading) {
    return (
      <PageContainer title="Administration — Debug">
        <SoftLoader />
      </PageContainer>
    )
  }

  // Rendu normal : le guard a déjà autorisé l'accès à cette page
  return (
    <PageContainer title="Administration — Debug">
      <div className="mb-8 border rounded-md shadow p-4 bg-white">
        <h2 className="font-semibold mb-2">🗂️ Nettoyage des entrées mortes (Storage → photos)</h2>
        {/* ⬇️ fix typage Button: variant accepte 'solid' | 'outline' */}
        <Button variant="solid" onClick={handleCleanStorage} disabled={busy}>
          🔍 Scanner Supabase
        </Button>
        <p className="text-sm text-muted-foreground mt-1">
          Supprime les entrées de <code>photos</code> dont le fichier est absent du bucket <code>avatars</code>.
        </p>
        {message && <p className="mt-2 text-sm text-green-700">{message}</p>}
      </div>

      <div className="mb-8 border rounded-md shadow p-4 bg-white">
        <h2 className="font-semibold mb-2">📄 Nettoyage des entrées mortes (Storage → certified_photos)</h2>
        {/* ⬇️ 'destructive' non supporté par le type → on reste en 'outline' avec une mise en forme rouge */}
        <Button
          variant="outline"
          onClick={handleCleanCertifiedPhotos}
          disabled={busy}
          className="border-red-300 text-red-700 hover:bg-red-50"
        >
          Scanner et supprimer
        </Button>
        <p className="text-sm text-muted-foreground mt-1">
          Supprime les entrées de <code>certified_photos</code> dont le fichier est manquant.
        </p>
        {certifiedMessage && <p className="mt-2 text-sm text-green-700">{certifiedMessage}</p>}
      </div>
    </PageContainer>
  )
}

// Propriété statique lue par le guard léger dans _app.tsx
AdminDebugPage.requireAuth = true

export default AdminDebugPage
