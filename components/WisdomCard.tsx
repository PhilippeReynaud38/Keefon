// -*- coding: utf-8 -*-
// components/WisdomCard.tsx — Vivaya
//
// Widget discret "Sagesse du jour".
// - Sélection déterministe par (userId + date) → même citation pour la journée
// - Bouton "×" pour masquer jusqu’à demain (stocké dans localStorage)
// - Zéro dépendance externe ; code simple et robuste

import { useEffect, useMemo, useState } from "react";

type Props = { userId?: string | null };

// Hash très simple et rapide (FNV1a modifié, suffisant ici)
function hashStr(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h + (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24)) >>> 0;
  }
  return h >>> 0;
}

const todayISO = () => new Date().toISOString().slice(0, 10); // YYYY-MM-DD
const HIDE_KEY = "vivaya_wisdom_hide_until"; // stocke la date du jour

const QUOTES: { text: string; author?: string }[] = [
  { text: "Ce que tu cherches te cherche aussi.", author: "Rumi" },
  { text: "Le cœur a ses raisons que la raison ignore.", author: "Pascal" },
  { text: "Deviens qui tu es.", author: "Nietzsche" },
  { text: "Rien ne se perd, tout se transforme.", author: "Lavoisier" },
  { text: "La simplicité est la sophistication suprême.", author: "Leonard de Vinci" },
  { text: "On ne voit bien qu’avec le cœur.", author: "St-Exupéry" },
  { text: "Agis toujours de façon à augmenter la liberté.", author: "Heinz von Foerster" },
  { text: "Le bonheur n’est pas une destination, mais une façon de voyager.", author: "Margaret Lee Runbeck" },
  { text: "Le courage, c’est d’avoir peur mais d’avancer quand même.", author: "J.-P. Sartre" },
  { text: "Qui regarde dehors rêve ; qui regarde dedans s’éveille.", author: "C. G. Jung" },
  { text: "La patience est un arbre dont la racine est amère et les fruits très doux.", author: "Proverbe" },
  { text: "À cœur vaillant, rien d’impossible.", author: "Jacques Cœur" },
  { text: "Ce n’est pas le but qui est précieux, c’est le chemin.", author: "Ursula K. Le Guin" },
  { text: "Le meilleur moment pour planter un arbre était il y a 20 ans. Le second, c’est maintenant.", author: "Proverbe" },
  { text: "Sois le changement que tu veux voir dans le monde.", author: "Gandhi" },
  { text: "La joie est le passage du moindre à un plus grand perfectionnement.", author: "Spinoza" },
  { text: "Rien ne sert de courir ; il faut partir à point.", author: "La Fontaine" },
  { text: "La gratitude transforme ce que nous avons en assez.", author: "Anonyme" },
  { text: "Sous les pavés, la plage.", author: "Slogan" },
  { text: "Le calme est contagieux.", author: "Anonyme" },
];

export default function WisdomCard({ userId }: Props) {
  const [hidden, setHidden] = useState(false);

  // Cache pour aujourd’hui si l’utilisateur a cliqué sur "×"
  useEffect(() => {
    try {
      const v = localStorage.getItem(HIDE_KEY);
      if (v && v === todayISO()) setHidden(true);
    } catch {
      /* no-op */
    }
  }, []);

  const idx = useMemo(() => {
    const seed = `${userId ?? ""}-${todayISO()}`;
    return hashStr(seed) % QUOTES.length;
  }, [userId]);

  if (hidden) return null;

  const q = QUOTES[idx];

  return (
    <div
      className="mx-auto mt-4 w-full max-w-xl rounded-xl bg-white/80 shadow p-3 text-sm text-gray-800"
      role="note"
      aria-label="Sagesse du jour"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="pr-2">
          <p className="italic leading-relaxed">“{q.text}”</p>
          {q.author && <p className="mt-1 text-right">— {q.author}</p>}
        </div>
        <button
          aria-label="Masquer pour aujourd’hui"
          className="shrink-0 rounded-full px-2 text-lg leading-none text-gray-500 hover:text-gray-700"
          onClick={() => {
            try {
              localStorage.setItem(HIDE_KEY, todayISO());
            } catch {
              /* no-op */
            }
            setHidden(true);
          }}
          title="Masquer pour aujourd’hui"
        >
          ×
        </button>
      </div>
    </div>
  );
}
