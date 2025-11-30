// -*- coding: utf-8 -*-
// ============================================================================
// Keefon | Page   
// Fichier : pages/abonnement.tsx
// Objet   : Offres, lecture du plan effectif, gestion d'abonnement (sans PSP).
// Règles  : robuste, simple, logique, commentaires conservés, UTF-8.
// ----------------------------------------------------------------------------
// CHANGELOG (2025-10-11): Lecture du plan effectif via vue.
// CHANGELOG (2025-10-29): Compat createCheckoutSession (1 seul argument).
// CHANGELOG (2025-11-04): Copie FR clarifiée + pastilles paleGreen.
// CHANGELOG (2025-11-05):
//   - “Accès offert (partiel)” quand avantages sans abo Stripe réel.
//   - Cacher le bloc “Arrêter mon abonnement” si pas d’abo Stripe.
//   - Cacher “Actif / Déjà actif” si pas d’abo Stripe (override).
//   - ✅ Fix fetch 204: on NE lit pas r.json() sur 204.
// CHANGELOG (2025-11-07):
//   - Suppression de la ligne DEV dans “Essentiel”.
//   - Ajout d’un bullet : mode “discret” possible même si l’abonnement court encore.
// CHANGELOG (2025-11-19):
//   - Déconnexion du front de Stripe (plus de createCheckoutSession/portal).
//   - Passage par l’abstraction lib/payments.ts (getPaymentProvider).
//   - Mode DEV : changement de plan direct, sans paiement, via provider.
// CHANGELOG (2025-11-19-ter):
//   - En-tête : bouton « ← Retour » (historique) + bouton « Tableau de bord → »,
//     avec couleurs ajustées (Retour jaune, Tableau de bord vert).
// CHANGELOG (2025-11-26):
//   - Distinction “plan de base” (profiles.subscription_tier) vs plan effectif
//     (user_plans_effective_v.effective_tier).
//   - Si base = free et effectif ≠ free → badge = “Accès partiel Essentiel / Keefon+”
//     au lieu d’afficher “Essentiel” ou “Keefon+”. Keefon+ reste le 4e état réel.
//   - Affichage explicite : “Accès partiel Essentiel / Keefon+” dans le badge.
// CHANGELOG (2025-11-29):
//   - Ajout d’un bandeau d’avertissement “mode découverte” (paiements désactivés).
// ============================================================================

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabaseClient'
import { getPaymentProvider } from '@/lib/payments'

type UiTier = 'free' | 'essential' | 'elite'
type Billing = 'monthly' | 'quarterly'

const PRICES = {
  essential: { monthly: 9.9, quarterly: 29.7 },
  elite: { monthly: 29.9, quarterly: 89.7 },
} as const

const LIMITS = {
  freeHearts: 1,
  essentialHearts: 4,
  eliteHearts: 4,
  openFreeWeekly: 10,
} as const

const euro = (n: number) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(n)

const labelFromUiTier = (t: UiTier) =>
  t === 'elite' ? 'Keefon+' : t === 'essential' ? 'Essentiel' : 'Gratuit'

const mapEffectiveFromView = (raw: string | null): UiTier => {
  const s = (raw || '').trim().toLowerCase()
  if (s === 'elite' || s === 'keefon+' || s === 'keefonplus') return 'elite'
  if (s === 'essentiel' || s === 'essential' || s === 'premium') return 'essential'
  return 'free'
}

const mapProfileTierFromRaw = (raw: string | null): UiTier => {
  const s = (raw || '').trim().toLowerCase()
  if (s === 'elite' || s === 'keefon+' || s === 'keefonplus') return 'elite'
  if (s === 'essentiel' || s === 'essential' || s === 'premium') return 'essential'
  return 'free'
}

export default function AbonnementPage() {
  const router = useRouter()

  const [billing, setBilling] = useState<Billing>('monthly')
  const [effective, setEffective] = useState<UiTier>('free')
  const [baseTier, setBaseTier] = useState<UiTier>('free')
  const [loadingPlan, setLoadingPlan] = useState(true)
  const [pending, setPending] = useState<UiTier | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  type PlanState = { effective: UiTier; base: UiTier }

  const loadPlanState = async (): Promise<PlanState> => {
    const { data: auth } = await supabase.auth.getUser()
    const uid = auth?.user?.id
    if (!uid) {
      setUserId(null)
      return { effective: 'free', base: 'free' }
    }
    setUserId(uid)

    const [effRes, profRes] = await Promise.all([
      supabase
        .from('user_plans_effective_v')
        .select('effective_tier')
        .eq('id', uid)
        .maybeSingle(),
      supabase
        .from('profiles')
        .select('subscription_tier')
        .eq('id', uid)
        .maybeSingle(),
    ])

    let eff: UiTier = 'free'
    let base: UiTier = 'free'

    if (!effRes.error && effRes.data) {
      eff = mapEffectiveFromView((effRes.data as any).effective_tier ?? null)
    }

    if (!profRes.error && profRes.data) {
      base = mapProfileTierFromRaw((profRes.data as any).subscription_tier ?? null)
    }

    if (base === 'free' && eff !== 'free') {
      // Accès offert : on garde base = free pour détecter l'accès partiel en UI
    } else if (base === 'free' && eff === 'free') {
      // tout free
    } else if (base !== 'free') {
      // abo normal, OK
    } else {
      base = eff
    }

    return { effective: eff, base }
  }

  useEffect(() => {
    let on = true
    ;(async () => {
      try {
        const st = await loadPlanState()
        if (!on) return
        setEffective(st.effective)
        setBaseTier(st.base)
      } catch {
        if (on) {
          setEffective('free')
          setBaseTier('free')
        }
      } finally {
        if (on) setLoadingPlan(false)
      }
    })()
    return () => {
      on = false
    }
  }, [])

  const changePlan = async (target: UiTier) => {
    if (target === 'free') return

    if (!userId) {
      alert('Impossible de trouver ton compte. Réessaie après reconnexion.')
      return
    }

    setActionMessage(null)
    setActionError(null)

    try {
      setPending(target)

      const payment = getPaymentProvider()
      const result = await payment.subscribeToPlan({
        userId,
        planId: target,
      })

      if (!result.success) {
        console.error(result.message)
        const msg = result.message || "Impossible de mettre à jour l'abonnement."
        setActionError(msg)
        alert(msg)
        return
      }

      const st = await loadPlanState()
      setEffective(st.effective)
      setBaseTier(st.base)

      if (result.message) {
        setActionMessage(result.message)
        alert(result.message)
      }
    } catch (e) {
      console.error(e)
      const msg = "Impossible de mettre à jour l'abonnement. Réessaie."
      setActionError(msg)
      alert(msg)
    } finally {
      setPending(null)
    }
  }

  const isActive = (t: UiTier) => effective === t
  const isCurrentForUi = (t: UiTier) => isActive(t)

  const hasPartialAccess = !loadingPlan && effective !== 'free' && baseTier === 'free'
  const planBadge = loadingPlan
    ? 'Chargement…'
    : hasPartialAccess
    ? `Accès partiel ${labelFromUiTier(effective)}`
    : labelFromUiTier(effective)

  const hasUnlockedAccess = !loadingPlan && effective !== 'free'

  return (
    <main
      className="min-h-screen bg-cover bg-center px-4 py-8"
      style={{ backgroundImage: `url('/bg-abonnement-ext.png')` }}
    >
      <div className="mx-auto max-w-5xl rounded-2xl bg-white/85 p-6 shadow">
        <div className="mb-5 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Abonnement Keefon</h1>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex items-center gap-1 rounded-lg bg-yellowGreen/90 px-2.5 py-1.5 text-xs font-semibold text-black shadow-sm hover:bg-yellowGreen sm:px-3 sm:py-2 sm:text-sm"
              aria-label="Retour à la page précédente"
            >
              <span aria-hidden>←</span>
              <span>Retour</span>
            </button>

            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1 rounded-lg bg-paleGreen px-2.5 py-1.5 text-xs font-semibold text-black shadow-sm hover:opacity-90 sm:px-3 sm:py-2 sm:text-sm"
              aria-label="Aller au tableau de bord"
            >
              <span className="hidden sm:inline">Tableau de bord</span>
              <span className="sm:hidden">Tableau</span>
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>

        {/* GROS bandeau jaune bien visible */}
        <div className="mb-6 flex items-center gap-3 rounded-2xl border-2 border-yellow-500 bg-yellow-300/95 px-4 py-4 text-sm text-black shadow-md md:py-5 md:text-base">
          <span className="text-2xl" aria-hidden>
            ⚠️
          </span>
          <p>
            <strong>Actuellement en mode découverte :</strong> achats désactivés pour l’instant.
          </p>
        </div>

        <div
          className="mb-4 flex flex-wrap items-center gap-2 text-sm text-gray-800"
          aria-busy={loadingPlan}
        >
          <span>Ton plan actuel :</span>
          <span className="rounded-full bg-paleGreen px-2.5 py-1 text-black">
            {planBadge}
          </span>
          {hasUnlockedAccess && (
            <span className="rounded-full bg-green-100 px-2 py-1 text-green-800">
              Accès débloqués
            </span>
          )}
        </div>

        {(actionMessage || actionError) && (
          <div className="mb-4 text-xs">
            {actionMessage && <p className="text-green-700">{actionMessage}</p>}
            {actionError && <p className="text-red-700">{actionError}</p>}
          </div>
        )}

        <div className="mb-6 flex items-center gap-3">
          <div className="text-sm text-gray-700">Facturation :</div>
          <div className="inline-flex rounded-xl bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => setBilling('monthly')}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
                billing === 'monthly' ? 'bg-white shadow' : 'opacity-70 hover:opacity-100'
              }`}
              aria-pressed={billing === 'monthly'}
            >
              Mensuelle
            </button>
            <button
              type="button"
              onClick={() => setBilling('quarterly')}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
                billing === 'quarterly' ? 'bg-white shadow' : 'opacity-70 hover:opacity-100'
              }`}
              aria-pressed={billing === 'quarterly'}
            >
              Trimestrielle
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <PlanCard
            title="Gratuit"
            tagline="— pour tester l’expérience"
            price="0 €"
            features={[
              'Profil public de base : 5 photos, âge, ville, traits ...',
              "Tu peux matcher et échanger si l’intérêt est mutuel — c’est un Keefon.",
              'Un cœur par mois t’est offert pour signaler ton intérêt ; il t’ouvrira peut-être un Keefon.',
              "Un abonné Keefon+ peut t’ouvrir la porte : s’il t’invite, tu peux lui parler.",
              'Réponds à un écho et la conversation est ouverte : peut-être que ton keef est là.',
            ]}
            ctaLabel={isActive('free') ? 'Plan actuel' : 'Gratuit'}
            disabled
            subtle
            current={isActive('free')}
          />

          <PlanCard
            title="Essentiel"
            tagline="— pour vraiment avancer"
            price={euro(
              billing === 'monthly' ? PRICES.essential.monthly : PRICES.essential.quarterly
            )}
            priceSub={billing === 'monthly' ? 'par mois' : 'par trimestre'}
            features={[
              'Profil enrichi et tu peux poser Jusqu’à 12 photos pour te présenter',
              'Tous tes messages reçus sont visibles',
              'Écris à qui tu veux parmi les abonnés',
              'Conversations illimitées entre abonnés',
              'Filtres de recherche avancés (centres d’intérêt, critères affinés)',
              'Questions d’inspiration pour lancer la discussion naturellement',
              `${LIMITS.essentialHearts} cœurs par mois`,
              "Tu peux te mettre en discret si l’accroche est sérieuse — même si ton abonnement court encore.",
            ]}
            ctaLabel={
              pending === 'essential'
                ? 'Activation…'
                : isCurrentForUi('essential')
                ? 'Déjà actif'
                : 'Passer à Essentiel'
            }
            onClick={() => changePlan('essential')}
            disabled={pending !== null || isCurrentForUi('essential')}
            current={isCurrentForUi('essential')}
          />

          <PlanCard
            title="Keefon+"
            tagline="— liberté totale de contact"
            price={euro(billing === 'monthly' ? PRICES.elite.monthly : PRICES.elite.quarterly)}
            priceSub={billing === 'monthly' ? 'par mois' : 'par trimestre'}
            features={[
              'Inclut tout Essentiel',
              `Ouvre de nouvelles conversations avec des profils non abonnés ( jusqu’à ${LIMITS.openFreeWeekly} par semaine, limité à 40 par mois )`,
              'Illimité avec les abonnés',
              `${LIMITS.eliteHearts} cœurs par mois`,
            ]}
            ctaLabel={
              pending === 'elite'
                ? 'Activation…'
                : isCurrentForUi('elite')
                ? 'Déjà actif'
                : 'Choisir Keefon+'
            }
            onClick={() => changePlan('elite')}
            disabled={pending !== null || isCurrentForUi('elite')}
            current={isCurrentForUi('elite')}
          />
        </div>

        <div className="mt-8 space-y-6">
          <details className="rounded-lg border border-gray-200 bg-white p-4">
            <summary className="cursor-pointer select-none font-semibold">
              Questions fréquentes
            </summary>
            <div className="mt-3 space-y-4 text-sm text-gray-800">
              {/* … (FAQ inchangée) … */}
              <div>
                <p className="font-medium">Comment arrêter mon abonnement&nbsp;?</p>
                <p>
                  La gestion fine de l’abonnement (arrêt, reprise, etc.) arrive avec le système
                  de paiement définitif. En attendant, tu peux toujours repasser en mode Gratuit
                  en nous écrivant à
                  <a className="underline" href="mailto:contact@keefon.com">
                    {' '}
                    contact@keefon.com
                  </a>
                  .
                </p>
              </div>
              <div>
                <p className="font-medium">Le renouvellement est-il automatique&nbsp;?</p>
                <p>
                  Le comportement exact dépendra du prestataire de paiement sélectionné (Stripe
                  ou autre). Les règles seront affichées clairement avant tout engagement payant.
                </p>
              </div>
              <div>
                <p className="font-medium">
                  Puis-je changer de formule ou de fréquence&nbsp;?
                </p>
                <p>
                  Oui, c’est l’objectif : pouvoir monter ou baisser de formule simplement. En
                  mode test, le changement est direct ; en mode réel, un récapitulatif sera
                  affiché avant validation.
                </p>
              </div>
              <div>
                <p className="font-medium">
                  Mon accès «&nbsp;offert&nbsp;» est-il un abonnement&nbsp;?
                </p>
                <p>
                  Non. C’est un accès provisoire débloqué par l’équipe et des limites peuvent
                  s’appliquer. Pour l’offre complète, active Essentiel ou Keefon+ dès que le
                  paiement sera disponible.
                </p>
              </div>
              <div>
                <p className="font-medium">Reçus et factures</p>
                <p>
                  Dès que le paiement sera actif, un reçu ou une facture sera envoyé après
                  chaque règlement. En attendant, pour toute question, écris à
                  <a className="underline" href="mailto:contact@keefon.com">
                    {' '}
                    contact@keefon.com
                  </a>
                  .
                </p>
              </div>
              <div>
                <p className="font-medium">Carte expirée / paiement refusé</p>
                <p>
                  Cette partie dépendra du prestataire de paiement final. Les instructions
                  détaillées seront précisées au moment de l’activation des abonnements payants.
                </p>
              </div>
              <div>
                <p className="font-medium">Supprimer mon compte</p>
                <p>
                  Tu peux demander la suppression depuis les paramètres (quand disponibles){' '}
                  ou tout simplement depuis la page <Link href="/parametres">Parametres</Link>,
                  en cliquant sur « Désinscription ». Tu peux aussi nous écrire à
                  <a className="underline" href="mailto:contact@keefon.com">
                    {' '}
                    contact@keefon.com
                  </a>
                  . La suppression est définitive et irréversible.
                </p>
              </div>
            </div>
          </details>

          <footer className="flex flex-wrap gap-4 text-xs text-gray-600">
            <Link href="/legal" className="underline">
              Mentions légales
            </Link>
          </footer>
        </div>
      </div>
    </main>
  )
}

type PlanCardProps = {
  title: string
  tagline?: string
  price: string
  priceSub?: string
  features: string[]
  ctaLabel: string
  onClick?: () => void
  disabled?: boolean
  subtle?: boolean
  recommended?: boolean
  current?: boolean
}

function PlanCard({
  title,
  tagline,
  price,
  priceSub,
  features,
  ctaLabel,
  onClick,
  disabled,
  subtle,
  recommended,
  current,
}: PlanCardProps) {
  return (
    <div
      className={[
        'relative flex flex-col rounded-xl border bg-white p-4',
        recommended
          ? 'border-yellowGreen ring-1 ring-yellowGreen/50'
          : subtle
          ? 'border-gray-200'
          : 'border-gray-300',
      ].join(' ')}
    >
      {current && (
        <div className="absolute -top-3 right-4 rounded-full bg-paleGreen px-2 py-0.5 text-xs font-semibold text-black">
          Actif
        </div>
      )}

      <h2 className="mb-1 text-lg font-semibold">{title}</h2>
      {tagline && <p className="mb-3 text-sm text-gray-700">{tagline}</p>}

      <div className="mb-3">
        <div className="text-2xl font-bold">{price}</div>
        {priceSub && <div className="text-xs text-gray-600">{priceSub}</div>}
      </div>

      <ul className="mb-4 ml-4 list-disc space-y-1 text-sm">
        {features.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={ctaLabel}
        className={[
          'mt-auto w-full rounded-xl px-4 py-2 font-semibold shadow transition',
          disabled
            ? 'cursor-not-allowed bg-gray-200 text-gray-500'
            : 'bg-yellowGreen text-black hover:opacity-90',
        ].join(' ')}
      >
        {ctaLabel}
      </button>
    </div>
  )
}
