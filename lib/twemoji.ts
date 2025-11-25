/**
 * lib/twemoji.ts
 * ------------------------------------------------------------
 * Objectif : appliquer Twemoji (remplacer les emojis par des <img> SVG)
 * sans casser le build si la lib 'twemoji' n'est pas installée ou en SSR.
 *
 * Règles Vivaya :
 * - Code robuste : aucun crash si dépendance absente.
 * - Simplicité : fallback silencieux si Twemoji indisponible.
 * - UTF-8, commentaires sobres.
 * Dernière mise à jour : 2025-10-28
 * ------------------------------------------------------------
 */

// Déclare 'require' sans dépendre de @types/node
declare const require: unknown;

type TwemojiModule =
  | {
      parse?: (
        root: HTMLElement,
        opts?: {
          folder?: string;
          ext?: string;
          className?: string;
          base?: string;
          attributes?: () => Record<string, string>;
        }
      ) => void;
    }
  | undefined;

let twemoji: TwemojiModule;

// Chargement optionnel (pas d’erreur si la lib est absente)
try {
  // @ts-ignore – au runtime, si require existe on l’utilise
  twemoji = (typeof require === "function" ? (require as any)("twemoji") : undefined) as TwemojiModule;
} catch {
  twemoji = undefined;
}

export type TwemojiOptions = {
  /** Base CDN twemoji — modifiable si besoin */
  base?: string;
  /** Extension (svg conseillé) */
  ext?: string;
  /** Classe CSS ajoutée aux <img> twemoji */
  className?: string;
};

/**
 * Applique Twemoji sur un élément racine.
 * - No-op côté serveur (SSR) ou si la lib n’est pas dispo.
 * - Ne jette jamais d’exception.
 */
export function applyTwemoji(root: HTMLElement | null, opts: TwemojiOptions = {}): void {
  if (typeof window === "undefined") return; // SSR : no-op
  if (!root) return;
  if (!twemoji || typeof twemoji.parse !== "function") return;

  const {
    base = "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/",
    ext = ".svg",
    className = "twemoji",
  } = opts;

  try {
    twemoji.parse(root, {
      folder: "svg",
      ext,
      className,
      base,
      attributes: () => ({
        draggable: "false",
        role: "img",
        "aria-hidden": "true",
      }),
    });
  } catch {
    // Fail-safe : on ne casse jamais l’UI si Twemoji plante
  }
}

export default applyTwemoji;
