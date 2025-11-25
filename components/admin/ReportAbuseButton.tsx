// UTF-8 — components/Admin/ReportAbuseButton.tsx
// -----------------------------------------------------------------------------
// Modal "Signaler un abus" contrôlé de l'extérieur (open/onOpenChange).
// AUCUN bouton inline n'est rendu ici pour éviter un 2e bouton parasite.
// Peut stocker un contexte de chat (conversation/message) si fourni.
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type Props = {
  reportedUserId: string
  photoId?: string | null
  // contexte discussion (optionnel)
  conversationId?: string | null
  messageId?: string | null

  open: boolean
  onOpenChange: (v: boolean) => void
}

const CATEGORIES = [
  'Profil faux / usurpation',
  'Harcèlement / menaces',
  'Spam / arnaque',
  'Nudité / contenu explicite',
  'Discours haineux',
  'Comportement inapproprié en discussion',
  'Autre',
] as const

export default function ReportAbuseButton({
  reportedUserId,
  photoId = null,
  conversationId = null,
  messageId = null,
  open,
  onOpenChange,
}: Props) {
  const [category, setCategory] = useState<string>(CATEGORIES[0])
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const minLen = 10

  useEffect(() => {
    if (!reportedUserId && open) onOpenChange(false)
  }, [reportedUserId, open, onOpenChange])

  const submit = async () => {
    if (!reportedUserId) return
    if (!reason || reason.trim().length < minLen) {
      alert(`Merci de décrire le problème (au moins ${minLen} caractères).`)
      return
    }
    setBusy(true)

    const { data: auth, error: authErr } = await supabase.auth.getUser()
    if (authErr || !auth?.user?.id) {
      setBusy(false)
      alert('❌ Tu dois être connecté pour signaler.')
      return
    }

    const { error } = await supabase.from('abuse_reports').insert({
      reporter_id: auth.user.id,          // RLS: == auth.uid()
      reported_user_id: reportedUserId,
      photo_id: photoId ?? null,
      category,
      reason: reason.trim(),
      conversation_id: conversationId ?? null,
      message_id: messageId ?? null,
    })

    setBusy(false)

    if (error) {
      const msg = error.message ?? ''

      // ✅ Cas particulier : doublon (même reporter, même profil, même catégorie)
      if (error.code === '23505' || /abuse_reports_unique_once/i.test(msg)) {
        alert(
          'ℹ️ Tu as déjà envoyé un signalement de ce type pour ce profil. Il est bien pris en compte, merci.'
        )
        onOpenChange(false)
        return
      }

      // Autres erreurs : message générique
      alert('❌ Échec de l’envoi : ' + msg)
      return
    }

    // ✅ Succès : reset + fermeture
    setCategory(CATEGORIES[0])
    setReason('')
    onOpenChange(false)
    alert('✅ Signalement envoyé. Merci !')
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      onClick={() => !busy && onOpenChange(false)}
    >
      <div
        className="w-full max-w-md bg-white rounded-lg shadow p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold mb-3">Signaler un abus</h3>

        <label className="block text-sm font-medium mb-1">Catégorie</label>
        <select
          className="w-full border rounded px-2 py-1 mb-3"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          className="w-full border rounded p-2 text-sm"
          rows={4}
          placeholder="Expliquez ce qui pose problème…"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />

        {/* Rappel contexte discussion si présent */}
        {(conversationId || messageId) && (
          <p className="mt-2 text-xs text-gray-600">
            Contexte discussion joint au signalement.
          </p>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={() => onOpenChange(false)}
            disabled={busy}
            className="px-3 py-1.5 rounded border"
          >
            Annuler
          </button>
          <button
            onClick={submit}
            disabled={busy}
            className="px-3 py-1.5 rounded bg-red-600 text-white disabled:opacity-60"
          >
            {busy ? 'Envoi…' : 'Envoyer'}
          </button>
        </div>
      </div>
    </div>
  )
}
