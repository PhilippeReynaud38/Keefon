// UTF-8
// components/SeoHead.tsx
// -----------------------------------------------------------------------------
// Objet : Injecter les balises SEO (title, description, OG/Twitter, canonical).
//
// Contexte/Module : composant réutilisable.
// Dépendances : next/head. Optionnel : "@/lib/seo" si présent.
//
// Invariants :
//  - Pas d’import de type depuis "@/lib/seo" (évite l’erreur).
//  - Si "@/lib/seo" n’expose pas SITE/absoluteUrl/buildTitle/fallbackDescription,
//    on utilise des fallbacks locaux.
//  - Aucune autre modification du projet.
// Dernière mise à jour : 2025-10-30
// -----------------------------------------------------------------------------

import Head from "next/head"

// On importe *tout* le module pour accéder à ce qu’il expose, sans exiger d’exports nommés.
import * as SEO from "@/lib/seo"

// Type local minimal pour décrire les métadonnées attendues (pas d’import de type externe).
type SeoMeta = {
  title?: string
  description?: string
  canonical?: string
  imageAbsUrl?: string
  locale?: string
  noindex?: boolean
}

// Fallbacks robustes si les helpers ne sont pas exportés par "@/lib/seo"
const absoluteUrl: (s?: string) => string =
  (SEO as any)?.absoluteUrl ?? ((s?: string) => s ?? "")

const buildTitle: (parts: string[]) => string =
  (SEO as any)?.buildTitle ?? ((parts: string[]) => parts.filter(Boolean).join(" · "))

const fallbackDescription: (s?: string) => string =
  (SEO as any)?.fallbackDescription ?? ((s?: string) => s || "Découvrez Keefon.")

// SITE optionnel côté lib ; sinon valeurs sûres ici
const DEFAULT_SITE = {
  name: "Keefon",
  defaultLocale: "fr",
  locales: ["fr"],
  twitter: "",
} as const

const SITE: typeof DEFAULT_SITE = (SEO as any)?.SITE ?? DEFAULT_SITE

type Props = {
  meta?: SeoMeta
  children?: React.ReactNode
}

export default function SeoHead({ meta, children }: Props) {
  const title = meta?.title ? buildTitle([meta.title]) : SITE.name
  const description = fallbackDescription(meta?.description)

  const locale = meta?.locale ?? SITE.defaultLocale
  const ogLocale = locale === "en" ? "en_US" : "fr_FR"

  const canonical = absoluteUrl(meta?.canonical) || ""
  const ogImage = absoluteUrl(meta?.imageAbsUrl) || ""

  const locales = Array.isArray((SITE as any).locales) && (SITE as any).locales.length > 0
    ? ((SITE as any).locales as string[])
    : DEFAULT_SITE.locales

  return (
    <Head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />

      <title>{title}</title>
      <meta name="description" content={description} />
      {meta?.noindex && <meta name="robots" content="noindex,nofollow" />}

      {canonical && <link rel="canonical" href={canonical} />}
      {canonical && <link rel="alternate" hrefLang="x-default" href={canonical} />}
      {canonical &&
        locales.map((lng) => (
          <link key={lng} rel="alternate" hrefLang={lng} href={canonical} />
        ))}

      <meta property="og:site_name" content={SITE.name} />
      <meta property="og:type" content="website" />
      <meta property="og:locale" content={ogLocale} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      {canonical && <meta property="og:url" content={canonical} />}
      {ogImage && <meta property="og:image" content={ogImage} />}

      <meta name="twitter:card" content="summary_large_image" />
      {SITE.twitter && <meta name="twitter:site" content={SITE.twitter} />}
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {ogImage && <meta name="twitter:image" content={ogImage} />}

      <link rel="icon" href="/favicon.ico" />

      {children}
    </Head>
  )
}
