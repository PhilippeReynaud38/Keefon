// -*- coding: utf-8 -*-
//
// Fichier : lib/maskedAvatars.ts
// Projet  : Vivaya
//
// Objet : Avatars voilés “réalistes” pour les cartes reçues non dévoilées (FREE).
//         → On fournit 20 variantes en data:URI (SVG) pour éviter tout 404.
//         → pickMaskedAvatar(id, used) : choix déterministe + anti-doublon par page.
//
// Note : Quand tu déposeras de “vraies” images dans /public/masked-avatars/ (a01.webp…),
//        on pourra activer l’option USE_LOCAL_ASSETS pour les privilégier.

const USE_LOCAL_ASSETS = false; // passe à true quand les .webp seront présents

// 20 thèmes de couleurs (fond + silhouette) pour varier le rendu.
const THEMES = [
  ["#cfe8ff", "#3b82f6"], ["#ffe4e6", "#e11d48"], ["#e0f2fe", "#0284c7"],
  ["#fef9c3", "#ca8a04"], ["#e9d5ff", "#7c3aed"], ["#dcfce7", "#16a34a"],
  ["#ffedd5", "#ea580c"], ["#f0f9ff", "#0891b2"], ["#fee2e2", "#ef4444"],
  ["#ecfeff", "#06b6d4"], ["#f5f3ff", "#8b5cf6"], ["#faf5ff", "#a855f7"],
  ["#fef2f2", "#f43f5e"], ["#fff7ed", "#f97316"], ["#f0fdf4", "#22c55e"],
  ["#fafaf9", "#64748b"], ["#fefce8", "#eab308"], ["#f1f5f9", "#334155"],
  ["#fff1f2", "#fb7185"], ["#f5f5f4", "#57534e"],
];

// Génère un SVG “portrait flou + vignette + grain”
function svgAvatar(bg: string, fg: string): string {
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='480' height='600' viewBox='0 0 480 600'>
      <defs>
        <filter id='blur'><feGaussianBlur stdDeviation='3'/></filter>
        <filter id='noise'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter>
        <radialGradient id='vignette' cx='50%' cy='45%' r='75%'>
          <stop offset='55%' stop-color='transparent'/><stop offset='100%' stop-color='rgba(0,0,0,0.85)'/>
        </radialGradient>
      </defs>
      <rect width='100%' height='100%' fill='${bg}'/>
      <!-- silhouette : tête + épaules -->
      <g fill='${fg}' filter='url(#blur)' opacity='0.85'>
        <circle cx='240' cy='220' r='80'/>
        <path d='M120,450 Q240,360 360,450 Q360,520 120,520 Z'/>
      </g>
      <!-- voile : assombrissement + vignette -->
      <rect width='100%' height='100%' fill='rgba(0,0,0,0.45)'/>
      <rect width='100%' height='100%' fill='url(#vignette)'/>
      <!-- grain -->
      <rect width='100%' height='100%' filter='url(#noise)' opacity='0.07'/>
    </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Prépare 20 data URIs
const DATA_URIS = THEMES.map(([bg, fg]) => svgAvatar(bg, fg));

// Si un jour tu ajoutes de vrais fichiers : /public/masked-avatars/a01.webp … a20.webp
const LOCAL_PATHS = Array.from({ length: 20 }, (_, i) => {
  const n = String(i + 1).padStart(2, "0");
  return `/masked-avatars/a${n}.webp`;
});

export type MaskedPick = { src: string | null; index: number };

// Hash djb2 stable pour une sélection déterministe par other_user
function djb2(str: string): number {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = (h * 33) ^ str.charCodeAt(i);
  return h >>> 0;
}

/**
 * Choisit un avatar “voilé réaliste”.
 * - id   : other_user
 * - used : indices déjà pris (anti-doublon visuel par page)
 */
export function pickMaskedAvatar(id: string, used?: Set<number>): MaskedPick {
  const N = DATA_URIS.length;
  if (!N) return { src: null, index: -1 };

  let idx = djb2(id) % N;
  if (used) {
    const start = idx;
    let steps = 0;
    while (used.has(idx) && steps < N) {
      idx = (idx + 1) % N;
      steps++;
      if (idx === start) break;
    }
    used.add(idx);
  }

  // Choix de la source selon le mode
  const src = USE_LOCAL_ASSETS ? LOCAL_PATHS[idx] : DATA_URIS[idx];
  return { src, index: idx };
}
