// -*- coding: utf-8 -*-
// ============================================================================
// Keefon | Page
// Fichier : pages/boutique.tsx
// Objet   : Boutique pour gérer les packs de crédits (cœurs & échos)
//           en s'appuyant sur l'abstraction de paiement (getPaymentProvider).
// ----------------------------------------------------------------------------
// CHANGELOG (2025-11-29):
//   - Ajout d’un bandeau d’avertissement “mode découverte” (paiements désactivés).
// ============================================================================

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { getPaymentProvider } from '@/lib/payments'

type ProductCategory = 'hearts' | 'echos' | 'bundle'

interface Product {
  id: string
  label: string
  description: string
  category: ProductCategory
  hearts: number
  echos: number
  price: number
}

const PRODUCTS: Product[] = [
  { id: 'heart-1', label: '+1 ❤️cœur', description: '', category: 'hearts', hearts: 1, echos: 0, price: 0.99 },
  { id: 'heart-5', label: '+5 ❤️cœurs', description: '', category: 'hearts', hearts: 5, echos: 0, price: 3.90 },
  { id: 'heart-10', label: '+10 ❤️cœurs', description: '', category: 'hearts', hearts: 10, echos: 0, price: 6.99 },

  { id: 'echo-1', label: '+1 📣écho', description: '', category: 'echos', hearts: 0, echos: 1, price: 1.39 },
  { id: 'echo-5', label: '+5 📣échos', description: '', category: 'echos', hearts: 0, echos: 5, price: 5.99 },
  { id: 'echo-10', label: '+10 📣échos', description: '', category: 'echos', hearts: 0, echos: 10, price: 9.99 },

  {
    id: 'bundle-1-1',
    label: '+1 ❤️cœur + 1 📣écho',
    description: 'Petit pack mixte pour tester les deux.',
    category: 'bundle',
    hearts: 1,
    echos: 1,
    price: 2.2,
  },
  {
    id: 'bundle-5-5',
    label: '+5 ❤️cœurs + 5 📣échos',
    description: '',
    category: 'bundle',
    hearts: 5,
    echos: 5,
    price: 9.90,
  },
  {
    id: 'bundle-10-10',
    label: '+10 ❤️cœurs + 10 📣échos',
    description: '',
    category: 'bundle',
    hearts: 10,
    echos: 10,
    price: 17.99,
  },
]

const heartProducts = PRODUCTS.filter((p) => p.category === 'hearts')
const echoProducts = PRODUCTS.filter((p) => p.category === 'echos')
const bundleProducts = PRODUCTS.filter((p) => p.category === 'bundle')

const formatEuro = (n: number) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(n)

type PendingKind = 'hearts' | 'echos' | 'bundle' | null

export default function BoutiquePage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [pending, setPending] = useState<PendingKind>(null)
  const [lastMessage, setLastMessage] = useState<string | null>(null)
  const [lastError, setLastError] = useState<string | null>(null)

  const [showHeartsHelp, setShowHeartsHelp] = useState(false)
  const [showEchosHelp, setShowEchosHelp] = useState(false)

  const [selectedHeartId, setSelectedHeartId] = useState<string | null>(heartProducts[0]?.id ?? null)
  const [selectedEchoId, setSelectedEchoId] = useState<string | null>(echoProducts[0]?.id ?? null)
  const [selectedBundleId, setSelectedBundleId] = useState<string | null>(bundleProducts[0]?.id ?? null)

  const selectedHeartProduct =
    heartProducts.find((p) => p.id === selectedHeartId) ?? heartProducts[0] ?? null
  const selectedEchoProduct =
    echoProducts.find((p) => p.id === selectedEchoId) ?? echoProducts[0] ?? null
  const selectedBundleProduct =
    bundleProducts.find((p) => p.id === selectedBundleId) ?? bundleProducts[0] ?? null

  useEffect(() => {
    let on = true
    ;(async () => {
      try {
        const { data } = await supabase.auth.getUser()
        if (!on) return
        setUserId(data?.user?.id ?? null)
      } finally {
        // rien de plus
      }
    })()
    return () => {
      on = false
    }
  }, [])

  const handleBuy = async (product: Product) => {
    if (!userId) {
      alert('Tu dois être connecté pour utiliser la boutique.')
      return
    }

    setLastMessage(null)
    setLastError(null)

    const payment = getPaymentProvider()
    const { category, hearts, echos } = product

    try {
      setPending(category)

      if (category === 'hearts') {
        const result = await payment.purchaseCredits({ userId, type: 'heart', quantity: hearts })
        if (!result.success) {
          const msg = result.message || "Impossible d'ajouter les cœurs. Réessaie."
          setLastError(msg)
          alert(msg)
          return
        }
        const msg = result.message || `+${hearts} cœurs ajoutés (mode test, aucun paiement réel).`
        setLastMessage(msg)
        alert(msg)
        return
      }

      if (category === 'echos') {
        const result = await payment.purchaseCredits({ userId, type: 'echo', quantity: echos })
        if (!result.success) {
          const msg = result.message || "Impossible d'ajouter les échos. Réessaie."
          setLastError(msg)
          alert(msg)
          return
        }
        const msg = result.message || `+${echos} échos ajoutés (mode test, aucun paiement réel).`
        setLastMessage(msg)
        alert(msg)
        return
      }

      if (category === 'bundle') {
        if (hearts > 0) {
          const resHearts = await payment.purchaseCredits({ userId, type: 'heart', quantity: hearts })
          if (!resHearts.success) {
            const msg = resHearts.message || "Impossible d'ajouter les cœurs du pack. Réessaie."
            setLastError(msg)
            alert(msg)
            return
          }
        }
        if (echos > 0) {
          const resEchos = await payment.purchaseCredits({ userId, type: 'echo', quantity: echos })
          if (!resEchos.success) {
            const msg = resEchos.message || "Impossible d'ajouter les échos du pack. Réessaie."
            setLastError(msg)
            alert(msg)
            return
          }
        }
        const msg = `Pack ajouté : +${hearts} cœurs et +${echos} échos (mode test, aucun paiement réel).`
        setLastMessage(msg)
        alert(msg)
      }
    } catch (err) {
      console.error(err)
      const msg = "Une erreur est survenue pendant l'ajout de crédits. Réessaie."
      setLastError(msg)
      alert(msg)
    } finally {
      setPending(null)
    }
  }

  return (
    <main
      className="min-h-screen bg-cover bg-center px-4 py-8"
      style={{ backgroundImage: `url('/bg-boutique-ext.png')` }}
    >
      <div className="mx-auto max-w-5xl p-6">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Boutique Keefon</h1>
            <p className="mt-1 text-sm text-gray-700">
              Packs de cœurs et d’échos pour booster tes rencontres.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/abonnement"
              className="inline-flex items-center gap-1 rounded-lg bg-yellowGreen/90 px-2.5 py-1.5 text-xs font-semibold text-black shadow-sm hover:bg-yellowGreen sm:px-3 sm:py-2 sm:text-sm"
            >
              Gérer mon abonnement
            </Link>

            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1 rounded-lg bg-paleGreen px-2.5 py-1.5 text-xs font-semibold text-black shadow-sm hover:opacity-90 sm:px-3 sm:py-2 sm:text-sm"
            >
              <span className="hidden sm:inline">Tableau de bord</span>
              <span className="sm:hidden">Tableau</span>
              <span aria-hidden>→</span>
            </Link>
          </div>
        </header>

        {/* GROS bandeau jaune bien visible */}
        <div className="mb-6 flex items-center gap-3 rounded-2xl border-2 border-yellow-500 bg-yellow-300/95 px-4 py-4 text-sm text-black shadow-md md:py-5 md:text-base">
          <span className="text-2xl" aria-hidden>
            ⚠️
          </span>
          <p>
            <strong>Actuellement en mode découverte :</strong> achats désactivés pour l’instant.
          </p>
        </div>

        {(lastMessage || lastError) && (
          <section className="mb-4 text-xs">
            {lastMessage && <p className="text-green-700">{lastMessage}</p>}
            {lastError && <p className="text-red-700">{lastError}</p>}
          </section>
        )}

        <section className="space-y-6">
          {/* CŒURS */}
          <div className="overflow-hidden rounded-2xl border border-yellow-200 bg-yellow-50">
            <div className="flex items-center justify-between gap-2 border-b border-yellow-200 px-4 py-2">
              <h2 className="text-lg font-semibold text-gray-900">Packs de cœurs</h2>
              <button
                type="button"
                onClick={() => setShowHeartsHelp((v) => !v)}
                className="inline-flex items-center rounded-full bg-paleGreen px-3 py-1 text-xs font-semibold text-black shadow-sm hover:opacity-90"
              >
                ? Aide
              </button>
            </div>

            <div className="p-4">
              <p className="mb-2 text-sm text-gray-800">
                Les cœurs servent à signaler ton intérêt et à débloquer des contacts. Choisis le pack qui correspond à
                ton rythme.
              </p>
              {showHeartsHelp && (
                <div className="mb-3 rounded-lg border border-yellow-200/70 bg-yellow-50 p-2 text-xs text-gray-800">
                  <p>
                    ❤️ / 🧡 <strong>Keef</strong> : tu peux envoyer un cœur à un profil qui te plaît. S&apos;il te
                    répond avec un autre cœur, alors vous avez un Keef mutuel et la conversation s&apos;ouvre
                    immédiatement, même si vous n&apos;êtes pas abonnés.
                  </p>
                  <p className="mt-1">Un profil non abonné ne voit pas qui envoie les cœurs.</p>
                </div>
              )}

              <div className="mt-3 space-y-3">
                <div className="flex flex-wrap gap-2">
                  {heartProducts.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedHeartId(p.id)}
                      className={[
                        'rounded-full px-3 py-1 text-xs font-semibold shadow-sm',
                        selectedHeartProduct && selectedHeartProduct.id === p.id
                          ? 'bg-paleGreen text-black'
                          : 'bg-white text-gray-800',
                      ].join(' ')}
                    >
                      {p.hearts === 1 ? '1 cœur' : `${p.hearts} cœurs`}
                    </button>
                  ))}
                </div>

                {selectedHeartProduct && (
                  <ProductCard
                    product={selectedHeartProduct}
                    disabled={pending !== null}
                    onBuy={() => handleBuy(selectedHeartProduct)}
                    pending={pending === 'hearts'}
                  />
                )}
              </div>
            </div>
          </div>

          {/* ÉCHOS */}
          <div className="overflow-hidden rounded-2xl border border-sky-200 bg-sky-50">
            <div className="flex items-center justify-between gap-2 border-b border-sky-200 px-4 py-2">
              <h2 className="text-lg font-semibold text-gray-900">Packs d’échos</h2>
              <button
                type="button"
                onClick={() => setShowEchosHelp((v) => !v)}
                className="inline-flex items-center rounded-full bg-paleGreen px-3 py-1 text-xs font-semibold text-black shadow-sm hover:opacity-90"
              >
                ? Aide
              </button>
            </div>

            <div className="p-4">
              <p className="mb-2 text-sm text-gray-800">
                L&apos;écho doit toujours être accompagné d&apos;un cœur, même espacé de plusieurs jours. Au final tu
                auras consommé un écho + un cœur.
              </p>
              {showEchosHelp && (
                <div className="mb-3 rounded-lg border border-sky-200/70 bg-sky-50 p-2 text-xs text-gray-800">
                  <p>
                    📣 <strong>Écho</strong> : tu peux envoyer un écho à un profil, toujours accompagné d&apos;un cœur.
                    Si la personne te renvoie ton écho, la conversation s&apos;ouvre, même si vous n&apos;êtes pas
                    abonnés.
                  </p>
                  <p className="mt-1">
                    Attention : la personne qui reçoit l&apos;écho découvre qui l&apos;a envoyé seulement après avoir
                    répondu et peut décider de couper court à la conversation immédiatement. Si tu envoies un écho à un
                    profil abonné, celui-ci n&apos;est pas consommé.
                  </p>
                </div>
              )}

              <div className="mt-3 space-y-3">
                <div className="flex flex-wrap gap-2">
                  {echoProducts.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedEchoId(p.id)}
                      className={[
                        'rounded-full px-3 py-1 text-xs font-semibold shadow-sm',
                        selectedEchoProduct && selectedEchoProduct.id === p.id
                          ? 'bg-paleGreen text-black'
                          : 'bg-white text-gray-800',
                      ].join(' ')}
                    >
                      {p.echos === 1 ? '1 écho' : `${p.echos} échos`}
                    </button>
                  ))}
                </div>

                {selectedEchoProduct && (
                  <ProductCard
                    product={selectedEchoProduct}
                    disabled={pending !== null}
                    onBuy={() => handleBuy(selectedEchoProduct)}
                    pending={pending === 'echos'}
                  />
                )}
              </div>
            </div>
          </div>

          {/* MIXTES */}
          <div className="overflow-hidden rounded-2xl border border-pink-200 bg-pink-50">
            <div className="flex items-center justify-between gap-2 border-b border-pink-200 px-4 py-2">
              <h2 className="text-lg font-semibold text-gray-900">Packs mixtes (cœurs + échos)</h2>
            </div>

            <div className="p-4">
              <div className="mt-3 space-y-3">
                <div className="flex flex-wrap gap-2">
                  {bundleProducts.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedBundleId(p.id)}
                      className={[
                        'rounded-full px-3 py-1 text-xs font-semibold shadow-sm',
                        selectedBundleProduct && selectedBundleProduct.id === p.id
                          ? 'bg-paleGreen text-black'
                          : 'bg-white text-gray-800',
                      ].join(' ')}
                    >
                      {p.hearts} cœurs + {p.echos} échos
                    </button>
                  ))}
                </div>

                {selectedBundleProduct && (
                  <ProductCard
                    product={selectedBundleProduct}
                    disabled={pending !== null}
                    onBuy={() => handleBuy(selectedBundleProduct)}
                    pending={pending === 'bundle'}
                  />
                )}
              </div>
            </div>
          </div>
        </section>

        <footer className="mt-8 text-xs text-gray-600">
          <p className="mt-2">
            Pour toute question, tu peux nous écrire à{' '}
            <a className="underline" href="mailto:contact@keefon.com">
              contact@keefon.com
            </a>
            .
          </p>
          <p className="mt-2">
            <Link href="/mentions-legales" className="underline">
              Mentions légales
            </Link>
          </p>
        </footer>
      </div>
    </main>
  )
}

type ProductCardProps = {
  product: Product
  disabled: boolean
  pending: boolean
  onBuy: () => void
}

function ProductCard({ product, disabled, pending, onBuy }: ProductCardProps) {
  const { label, description, price } = product
  const hasDescription = description && description.trim().length > 0

  return (
    <div className="flex flex-col rounded-xl border border-black/5 bg-transparent p-3 shadow-sm">
      <h3 className="mb-1 text-sm font-semibold">{label}</h3>

      {hasDescription && <div className="mb-2 text-xs text-gray-800">{description}</div>}

      <div className="mb-3 text-sm font-semibold text-gray-900">{formatEuro(price)} TTC</div>

      <button
        type="button"
        onClick={onBuy}
        disabled={disabled}
        className={[
          'mt-auto rounded-xl px-3 py-1.5 text-xs font-semibold shadow transition',
          disabled ? 'cursor-not-allowed bg-gray-200 text-gray-500' : 'bg-paleGreen text-black hover:opacity-90',
        ].join(' ')}
      >
        {pending ? 'Ajout en cours…' : 'Ajouter ce pack'}
      </button>
    </div>
  )
}
