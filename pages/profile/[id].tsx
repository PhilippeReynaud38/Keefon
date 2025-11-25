// -*- coding: utf-8 -*-
// =============================================================
// /pages/profile/[id].tsx
// -------------------------------------------------------------
// Objectif :
// 1) Activer la protection par page via `requireAuth = true` (guard léger
//    appliqué dans _app.tsx uniquement si la page l’expose).
// 2) Conserver une logique simple/robuste : fetch séquentiel, erreurs loguées,
//    nettoyage d’effet, pas d’usine à gaz.
// 3) Respect des règles Vivaya : code clair, commentaires conservés, UTF-8.
// -------------------------------------------------------------
// NOTE : On retire toute redirection locale basée sur useSession pour laisser
//        _app.tsx gérer l’accès (déconnecté → /login, inscription incomplète →
//        /presignup, logout → rester sur /).
//        Ici, on se concentre uniquement sur l’affichage du profil.
// =============================================================

import * as React from 'react'
import Head from 'next/head'
import type { NextPage } from 'next'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabaseClient'
// import PhotoGallery from '../../components/PhotoGallery'  A RTIERER ???
import UserAvatar from '../../components/UserAvatar'

// =====================================================================
// Extension de type : on autorise la propriété optionnelle `requireAuth`
// sur la page pour que _app.tsx applique le guard léger *seulement* si vrai.
// (On garde ça local pour éviter tout HOC/boilerplate superflu.)
// =====================================================================
export type NextPageWithAuth<P = {}, IP = P> = NextPage<P, IP> & {
  requireAuth?: boolean
}

// =====================================================================
// Types locaux (adaptés aux champs réellement consommés par la page)
// =====================================================================
interface Profile {
  id: string
  bio?: string
  description?: string
  traits?: string[]
  taille?: number
  religion?: string
  origines?: string
  musique?: string
  animaux?: string
  situation?: string
  souhaite_enfants?: string
  fume?: string
  alcool?: string
}

// =====================================================================
// Utilitaires : calcul d’âge robuste (évite les décalages de mois/jours)
// =====================================================================
function calculateAge(dob: string | null | undefined): number | null {
  if (!dob) return null
  const birth = new Date(dob)
  if (Number.isNaN(birth.getTime())) return null
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

// =====================================================================
// Page : Profil privé (lecture seule de la galerie ici)
// =====================================================================
const PrivateProfile: NextPageWithAuth = () => {
  const router = useRouter()
  const { id } = router.query

  // ----------------------------
  // États UI et données
  // ----------------------------
  const [loading, setLoading] = React.useState(true)
  const [profile, setProfile] = React.useState<Profile | null>(null)
  const [username, setUsername] = React.useState<string | null>(null)
  const [birthday, setBirthday] = React.useState<string | null>(null)
  const [ville, setVille] = React.useState<string | null>(null)
  const [isCertified, setIsCertified] = React.useState(false)

  // ----------------------------
  // Chargement des données
  // ----------------------------
  React.useEffect(() => {
    let active = true // évite setState après unmount

    async function fetchAll(userId: string) {
      try {
        setLoading(true)

        // 1) Profil de base
        const { data: prof, error: eProf } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle()
        if (eProf) console.warn('[profile] load error', eProf)
        if (active) setProfile(prof)

        // 2) Statut certifié (photo certifiée approuvée)
        const { data: certif, error: eCert } = await supabase
          .from('certified_photos')
          .select('id')
          .eq('user_id', userId)
          .eq('status', 'approved')
          .maybeSingle()
        if (eCert) console.warn('[certified_photos] load error', eCert)
        if (active) setIsCertified(!!certif)

        // 3) Données presignup : username + birthday (source de vérité âge)
        const { data: presign, error: ePre } = await supabase
          .from('presignup_data')
          .select('username,birthday')
          .eq('user_id', userId)
          .maybeSingle()
        if (ePre) console.warn('[presignup_data] load error', ePre)
        if (active) {
          setUsername(presign?.username ?? null)
          setBirthday(presign?.birthday ?? null)
        }

        // 4) Localisation (ville)
        const { data: loc, error: eLoc } = await supabase
          .from('user_localisations')
          .select('ville')
          .eq('user_id', userId)
          .maybeSingle()
        if (eLoc) console.warn('[user_localisations] load error', eLoc)
        if (active) setVille(loc?.ville ?? null)
      } catch (err) {
        console.error('[profile/[id]] unexpected error', err)
      } finally {
        if (active) setLoading(false)
      }
    }

    // On attend que `id` soit une string exploitable
    if (typeof id === 'string' && id.length > 0) fetchAll(id)

    return () => {
      active = false
    }
  }, [id])

  const age = calculateAge(birthday)

  // ----------------------------
  // Rendu UI
  // ----------------------------
  if (loading) return <p className="text-center p-4">Chargement du profil…</p>
  if (!profile) return <p className="text-center p-4 text-red-600">Profil introuvable</p>

  return (
    <>
      <Head>
        <title>Mon profil — Vivaya</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <main className="min-h-screen bg-gradient-to-b from-[#e0f7fa] to-[#ccf2f4] px-4 sm:px-6 py-6 relative">
        {/* Bouton retour */}
        <div className="absolute top-4 left-4 z-10">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 rounded-xl bg-yellowGreen text-black font-semibold shadow-md hover:opacity-90 transition"
          >
            ← Retour
          </button>
        </div>

        {/* Menu actions simples (mobile-friendly, sans gadgets) */}
        <div className="absolute top-4 right-4 z-10">
          <div className="relative inline-block">
            <details className="group">
              <summary className="px-4 py-2 rounded-xl bg-yellowGreen text-black font-semibold shadow-md hover:opacity-90 transition cursor-pointer">
                ☰ Menu
              </summary>
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-20">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  🏠 Tableau de bord
                </button>
                <button
                  onClick={() => router.push(`/profileplus/${profile.id}`)}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  👁 Voir mon profil public
                </button>
                <button
                  onClick={() => router.push('/abonnement')}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  💳 Mon abonnement
                </button>
              </div>
            </details>
          </div>
        </div>

        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md p-6 space-y-6">
          {/* Avatar + nom */}
          <div className="text-center">
            <UserAvatar userId={profile.id} />
            <h1 className="text-xl font-bold mt-4">
              {username || 'Utilisateur'}
              {isCertified && (
                // Couleur demandée : "paleGreen" (CSS : palegreen)
                <span style={{ color: 'palegreen' }} className="text-sm font-normal ml-2">
                  ✔ certifié
                </span>
              )}
            </h1>
            {(age !== null || ville) && (
              <p className="text-sm text-gray-600 mt-1">
                {age !== null && `${age} ans`}
                {age !== null && ville ? ' • ' : ''}
                {ville}
              </p>
            )}
          </div>

          {/* Bio (optionnelle) */}
          {profile.bio && (
            <div className="text-center italic text-gray-700">« {profile.bio} »</div>
          )}

          {/* Galerie en lecture seule    AAAAAA  RETIRER ?????????????
          <div>
            <h2 className="text-lg font-semibold mb-2 text-gray-800">📸 Galerie</h2>
            <PhotoGallery userId={profile.id} readonly={true} />
          </div>*/}

          {/* Informations détaillées */}
          <div className="space-y-2 text-sm text-gray-800">
            {profile.description && (
              <p>
                <strong>À propos :</strong> {profile.description}
              </p>
            )}
            {profile.traits?.length ? (
              <p>
                <strong>Traits :</strong> {profile.traits.join(', ')}
              </p>
            ) : null}
            {profile.taille ? (
              <p>
                <strong>Taille :</strong> {profile.taille} cm
              </p>
            ) : null}
            {profile.religion ? (
              <p>
                <strong>Religion :</strong> {profile.religion}
              </p>
            ) : null}
            {profile.origines ? (
              <p>
                <strong>Origines :</strong> {profile.origines}
              </p>
            ) : null}
            {profile.animaux ? (
              <p>
                <strong>Animaux :</strong> {profile.animaux}
              </p>
            ) : null}
            {profile.musique ? (
              <p>
                <strong>Musique :</strong> {profile.musique}
              </p>
            ) : null}
            {profile.situation ? (
              <p>
                <strong>Situation :</strong> {profile.situation}
              </p>
            ) : null}
            {profile.souhaite_enfants ? (
              <p>
                <strong>Souhaite des enfants :</strong> {profile.souhaite_enfants}
              </p>
            ) : null}
            {profile.fume ? (
              <p>
                <strong>Fume :</strong> {profile.fume}
              </p>
            ) : null}
            {profile.alcool ? (
              <p>
                <strong>Alcool :</strong> {profile.alcool}
              </p>
            ) : null}
          </div>
        </div>
      </main>
    </>
  )
}

// =============================================================
// 🔐 Activation du guard par page
// -------------------------------------------------------------
// _app.tsx appliquera la redirection uniquement si ce flag est à true.
// Aucune incidence sur /index, /login, /logout, /presignup (publiques).
// =============================================================
PrivateProfile.requireAuth = true

export default PrivateProfile
