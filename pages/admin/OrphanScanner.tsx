// UTF-8 — pages/admin/OrphanScanner.tsx
// -----------------------------------------------------------------------------
// Objet : Outil admin pour détecter et supprimer les fichiers orphelins
//          dans le bucket Storage `avatars/avatars/...`.
// Conformité Vivaya : code robuste, simple, logique, très commenté, sans gadgets.
// Ajouts/Modifs (fond sombre) :
//   - Fond de page gris foncé (bg-gray-900) + texte clair (text-gray-100).
//   - Bouton « Retour » et encadrés adaptés au thème sombre.
//   - Messages succès/erreur avec couleurs lisibles sur fond sombre.
// -----------------------------------------------------------------------------

import type { NextPage } from 'next'
import Head from 'next/head'
import { useState } from 'react'
import { useSessionContext } from '@supabase/auth-helpers-react'
import { supabase } from '../../lib/supabaseClient'
import { useRouter } from 'next/router' // ← pour le bouton Retour

type NextPageWithAuth<P = {}> = NextPage<P> & { requireAuth?: boolean }

// ──────────────────────────────────────────────────────────────────────────────
// UI de base sobre (pas de gadgets) + helpers d'affichage
// ──────────────────────────────────────────────────────────────────────────────

function PageContainer(props: { title: string; children: React.ReactNode; onBack?: () => void }) {
  return (
    <div className="min-h-screen w-full bg-gray-900 text-gray-100">
      <Head>
        <title>{props.title} • Admin</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main className="mx-auto max-w-4xl px-4 py-6">
        <div className="mb-4 flex items-center gap-3">
          {props.onBack && (
            <button
              type="button"
              onClick={props.onBack}
              className="inline-flex items-center gap-2 rounded-md border border-gray-600 bg-gray-800 px-3 py-1.5 text-sm text-gray-100 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
              aria-label="Retour à la page précédente"
            >
              <span aria-hidden="true">←</span>
              <span>Retour</span>
            </button>
          )}
          <h1 className="text-2xl font-semibold text-gray-100">{props.title}</h1>
        </div>
        {props.children}
      </main>
    </div>
  )
}

function SoftLoader() {
  return (
    <div className="py-12 text-center">
      <p className="text-gray-300">Chargement…</p>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────────
// Helpers logiques
// ──────────────────────────────────────────────────────────────────────────────
function basenameFromUrl(url: string | null | undefined): string {
  if (!url) return ''
  const clean = String(url).trim()
  const parts = clean.split('/')
  return parts[parts.length - 1] || ''
}

// ──────────────────────────────────────────────────────────────────────────────
/** Page principale */
const OrphanScannerPage: NextPageWithAuth = () => {
  const { isLoading } = useSessionContext()
  const router = useRouter() // ← pour router.back()

  const [orphans, setOrphans] = useState<string[]>([])
  const [deleted, setDeleted] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [msg, setMsg] = useState<string>('')

  const BUCKET = 'avatars'
  const FOLDER = 'avatars'

  // Scanner fichiers
  const scanOrphans = async () => {
    setLoading(true)
    setDeleted([])
    setMsg('')

    const { data: files, error: listErr } = await supabase.storage
      .from(BUCKET)
      .list(FOLDER, { limit: 10000 })

    if (listErr || !files) {
      console.error('Storage list error:', listErr?.message)
      setMsg('❌ Erreur lors du scan du bucket.')
      setLoading(false)
      return
    }

    const fileNames = files
      .filter((f) => f.name !== '.emptyFolderPlaceholder')
      .map((f) => f.name)

    const [{ data: photos, error: photosErr }, { data: certs, error: certsErr }] = await Promise.all([
      supabase.from('photos').select('url'),
      supabase.from('certified_photos').select('url'),
    ])

    if (photosErr || certsErr) {
      console.error('DB select error:', photosErr?.message || certsErr?.message)
      setMsg('❌ Erreur lors de la lecture base (photos/certified_photos).')
      setLoading(false)
      return
    }

    const referenced = new Set<string>()
    ;(photos || []).forEach(({ url }) => {
      const name = basenameFromUrl(url as string)
      if (name) referenced.add(name)
    })
    ;(certs || []).forEach(({ url }) => {
      const name = basenameFromUrl(url as string)
      if (name) referenced.add(name)
    })

    const orphanNames = fileNames.filter((name) => !referenced.has(name))
    const orphanPaths = orphanNames.map((name) => `${FOLDER}/${name}`)

    setOrphans(orphanPaths)
    setLoading(false)
  }

  // Supprimer orphelins
  const deleteOrphans = async () => {
    if (!confirm || orphans.length === 0) return
    setLoading(true)
    setMsg('')

    const { error: delErr } = await supabase.storage.from(BUCKET).remove(orphans)
    if (delErr) {
      console.error('Storage remove error:', delErr.message)
      setMsg('❌ Erreur lors de la suppression Storage.')
    } else {
      setDeleted(orphans)
      setOrphans([])
      setMsg(`${orphans.length} fichier(s) supprimé(s).`)
    }

    setLoading(false)
    setConfirm(false)
  }

  if (isLoading) {
    return (
      <PageContainer title="Administration — OrphanScanner" onBack={() => router.back()}>
        <SoftLoader />
      </PageContainer>
    )
  }

  return (
    <PageContainer title="Administration — OrphanScanner" onBack={() => router.back()}>
      <div className="space-y-3">
        <button
          onClick={scanOrphans}
          disabled={loading}
          className="px-4 py-2 rounded bg-gray-800 text-white hover:bg-gray-700 disabled:opacity-60"
        >
          🔍 Scanner les fichiers
        </button>

        {loading && <p className="text-gray-300">Chargement…</p>}
        {msg && <p className={msg.startsWith('❌') ? 'text-red-300' : 'text-green-300'}>{msg}</p>}

        {!loading && orphans.length > 0 && (
          <div className="mt-2 border border-gray-700 rounded p-3 bg-gray-800 text-gray-100">
            <p className="text-red-300 font-medium">⚠️ {orphans.length} fichier(s) orphelin(s) détecté(s)</p>
            <ul className="list-disc pl-5 mt-2 max-h-64 overflow-auto">
              {orphans.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
            <label className="inline-flex items-center gap-2 mt-3">
              <input
                type="checkbox"
                checked={confirm}
                onChange={(e) => setConfirm(e.target.checked)}
              />
              <span>Je confirme la suppression définitive</span>
            </label>
            <div className="mt-2">
              <button
                onClick={deleteOrphans}
                disabled={!confirm || loading}
                className="px-4 py-2 rounded bg-red-700 hover:bg-red-600 text-white disabled:opacity-60"
              >
                Supprimer tous les fichiers orphelins
              </button>
            </div>
          </div>
        )}

        {!loading && deleted.length > 0 && (
          <div className="mt-2 text-green-300">✅ {deleted.length} fichier(s) supprimé(s)</div>
        )}
      </div>
    </PageContainer>
  )
}

OrphanScannerPage.requireAuth = true
export default OrphanScannerPage
