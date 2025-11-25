// UTF-8 — pages/admin/certifications.tsx
// -----------------------------------------------------------------------------
// ADMIN — Certifications : file d’attente + actions Valider / Refuser
// - Fond sombre global (cohérent avec AbuseReports).
// - Cartes claires lisibles pour le contenu (dont AdminDebug).
// - Source de vérité via RPC (si dispo), sinon fallback simple.
// - Contrôle d’accès admin via RPC me_is_admin().
// - UI optimiste + refetch + realtime.
// -----------------------------------------------------------------------------

import type { NextPage } from 'next'
import Head from 'next/head'
import { useEffect, useState } from 'react'
import { useSessionContext } from '@supabase/auth-helpers-react'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabaseClient'
import AdminDebug from '../../components/AdminDebug'

type NextPageWithAuth<P = {}> = NextPage<P> & { requireAuth?: boolean }

type CertifiedPhoto = {
  id: string
  user_id: string
  url: string | null
  status: 'pending' | 'approved' | 'rejected' | null
  created_at: string
}

// --- Helpers Storage : normalise la clé/URL vers le bucket `avatars` ----------
function toPublicUrl(storageKey?: string | null): string | null {
  if (!storageKey) return null
  let key = String(storageKey).trim()
  key = key.replace(/^https?:\/\/[^]+?\/storage\/v1\/object\/public\/avatars\//i, '')
  key = key.replace(/^\/+/, '')
  key = key.replace(/^avatars\/avatars\//, 'avatars/')
  const { data } = supabase.storage.from('avatars').getPublicUrl(key)
  return data?.publicUrl ?? null
}
function toStorageKeyForRemove(storageKey?: string | null): string | null {
  if (!storageKey) return null
  let key = String(storageKey).trim()
  key = key.replace(/^https?:\/\/[^]+?\/storage\/v1\/object\/public\/avatars\//i, '')
  key = key.replace(/^\/+/, '')
  key = key.replace(/^avatars\/avatars\//, 'avatars/')
  return key || null
}

// --- Chrome UI : conteneur page + bouton "Retour" ----------------------------
function PageContainer(props: { title: string; children: React.ReactNode; onBack?: () => void }) {
  return (
    <div className="min-h-screen w-full bg-gray-900 text-gray-100">
      <Head>
        <title>{props.title} • Admin</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-4 flex items-center gap-3">
          {props.onBack && (
            <button
              type="button"
              onClick={props.onBack}
              className="inline-flex items-center gap-2 rounded-md border border-gray-600 bg-gray-800 px-3 py-1.5 text-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
              aria-label="Retour à la page précédente"
            >
              <span aria-hidden="true">←</span>
              <span>Retour</span>
            </button>
          )}
          <h1 className="text-2xl font-semibold">{props.title}</h1>
        </div>
        {props.children}
      </main>
    </div>
  )
}

function SoftLoader() {
  return (
    <div className="py-12 text-center text-gray-300">
      <p>Chargement…</p>
    </div>
  )
}

// --- Page --------------------------------------------------------------------
const AdminCertifications: NextPageWithAuth = () => {
  const { isLoading } = useSessionContext()
  const router = useRouter()

  const [photos, setPhotos] = useState<CertifiedPhoto[]>([])
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  // Charge la file d’attente depuis la RPC (préférée). Fallback si RPC absente.
  const fetchPhotos = async () => {
    const rpc = await supabase.rpc('admin_list_cert_queue')
    if (!rpc.error && rpc.data) { setPhotos(rpc.data as CertifiedPhoto[]); return }
    const { data, error } = await supabase
      .from('certified_photos')
      .select('id,user_id,url,status,created_at')
      .neq('status', 'approved')
      .order('created_at', { ascending: false })
    if (error) { console.error('fetchPhotos fallback:', error.message); setPhotos([]); return }
    setPhotos(data ?? [])
  }

  // Vérifie le rôle admin via RPC (évite d’exposer profiles côté client)
  useEffect(() => {
    const run = async () => {
      const { data: au } = await supabase.auth.getUser()
      if (!au?.user) { setIsAdmin(null); return }
      const { data, error } = await supabase.rpc('me_is_admin')
      if (error) { console.warn('me_is_admin:', error.message); setIsAdmin(false); return }
      if (data === true) { setIsAdmin(true); await fetchPhotos() } else setIsAdmin(false)
    }
    if (!isLoading) run()
  }, [isLoading])

  // Realtime : rafraîchit la liste si action effectuée ailleurs
  useEffect(() => {
    if (isAdmin !== true) return
    const ch = supabase
      .channel('admin-cert-queue')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'certified_photos' }, () => fetchPhotos())
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [isAdmin])

  // Actions -------------------------------------------------------------------
  // ✔ Valider
  const approvePhoto = async (photo: CertifiedPhoto) => {
    if (busyId) return
    setBusyId(photo.id)
    setPhotos((curr) => curr.filter((p) => p.id !== photo.id)) // UI optimiste
    const r = await supabase.rpc('approve_cert_photo', { p_photo_id: photo.id })
    if (r.error) {
      // Fallback si la RPC n’existe pas
      const del = await supabase.from('certified_photos').delete().eq('id', photo.id)
      const prof = await supabase.from('profiles').update({ certified_status: 'approved' }).eq('id', photo.user_id)
      if (del.error || prof.error) {
        setPhotos((curr) => [photo, ...curr]) // rollback
        alert('❌ Erreur validation : ' + (r.error?.message || prof.error?.message))
        setBusyId(null); return
      }
    }
    await fetchPhotos()
    setBusyId(null)
  }

  // ✖ Refuser
  const rejectPhoto = async (photo: CertifiedPhoto) => {
    if (busyId) return
    if (!confirm('❌ Refuser et supprimer définitivement cette photo ?')) return
    setBusyId(photo.id)
    setPhotos((curr) => curr.filter((p) => p.id !== photo.id)) // UI optimiste

    const r = await supabase.rpc('reject_cert_photo', { p_photo_id: photo.id })
    if (r.error) {
      const del = await supabase.from('certified_photos').delete().eq('id', photo.id)
      const prof = await supabase.from('profiles').update({ certified_status: 'rejected' }).eq('id', photo.user_id)
      if (del.error || prof.error) {
        setPhotos((curr) => [photo, ...curr])
        alert('❌ Erreur du refus : ' + (del.error?.message || prof.error?.message))
        setBusyId(null); return
      }
    }

    // Supprime le fichier associé si possible
    const key = toStorageKeyForRemove(photo.url)
    if (key) {
      const { error: rmErr } = await supabase.storage.from('avatars').remove([key])
      if (rmErr) console.warn('storage.remove:', rmErr.message)
    }

    await fetchPhotos()
    setBusyId(null)
  }

  // Rendu ---------------------------------------------------------------------
  if (isLoading) {
    return (
      <PageContainer title="Administration — Certifications" onBack={() => router.back()}>
        <SoftLoader />
      </PageContainer>
    )
  }

  if (isAdmin === false) {
    return (
      <PageContainer title="Administration — Certifications" onBack={() => router.back()}>
        <div className="text-center p-8 text-red-300">
          <p className="mb-4">⛔ Accès restreint. Cette page est réservée aux administrateurs.</p>
          {/* AdminDebug lisible dans une carte blanche */}
          <div className="mx-auto w-full max-w-xl rounded border border-gray-200 bg-white text-gray-900 p-4 text-left shadow-sm">
            <AdminDebug />
          </div>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer title="Administration — Certifications" onBack={() => router.back()}>
      {photos.length === 0 ? (
        <p className="text-gray-300">Aucune photo à examiner.</p>
      ) : (
        <div className="space-y-6">
          {photos.map((photo) => {
            const url = toPublicUrl(photo.url)
            const isBusy = busyId === photo.id
            return (
              <div
                key={photo.id}
                className="border border-gray-200 p-4 rounded bg-white text-gray-900 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={url || '/default-avatar.png'}
                    alt="Photo certifiée"
                    className="w-24 h-24 object-cover rounded border"
                  />
                  <div>
                    <p className="font-semibold">ID utilisateur : {photo.user_id}</p>
                    <p className="text-sm text-gray-600">Soumise : {new Date(photo.created_at).toLocaleString()}</p>
                    <p className="text-sm mt-1">
                      Statut (technique) : <span className="font-bold">{photo.status ?? 'pending'}</span>
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => approvePhoto(photo)}
                    disabled={isBusy}
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-60"
                  >
                    ✔ Valider
                  </button>
                  <button
                    onClick={() => rejectPhoto(photo)}
                    disabled={isBusy}
                    className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-60"
                  >
                    ✖ Refuser
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* AdminDebug lisible (carte blanche) */}
      <div className="mt-6 rounded border border-gray-200 bg-white text-gray-900 p-4 shadow-sm">
        <AdminDebug />
      </div>
    </PageContainer>
  )
}

(AdminCertifications as NextPageWithAuth).requireAuth = true
export default AdminCertifications
