// -*- coding: utf-8 -*-
// components/TraitsSelector.tsx — Vivaya
//
// Sélecteur de traits (max 6) — grille responsive sans chevauchement.
// Mobile étroit: 2 colonnes (texte compact). >= sm: 3 colonnes.
// Règles: code simple, robuste, commentaires sobres, UTF-8.

import React from "react";

// Props du composant
interface TraitsSelectorProps {
  traits: string[];                     // Traits sélectionnés
  onChange: (traits: string[]) => void; // Callback sur mise à jour
}

// Liste complète (version inclusive masculin/féminin)
const allTraits = [
  "attentionné(e)", "calme", "empathique",
  "expansif(ve)", "fier(e)", "tendre", "sensible", "superstitieux(se)",
  "fonceur(se)", "aventureux(se)", "solitaire",
  "nerveux(se)", "inquiet(e)",
  "possessif(ve)", "jovial(e)", "sociable",
  "timide", "gentillesse",
  "exigeant(e)", "généreux(se)", "bavard(e)",
  "jaloux(se)", "réservé(e)", "spontané(e)",
  "entrepreneur(e)", "rêveur(se)",
  "romantique", "terre-à-terre",
  "intelligent(e)", "créatif(ve)",
  "artiste", "associatif(ve)", "hyperactif(ve)",
  "curieux(se)", "sensoriel(le)",
  "émotif(ve)", "réconfortant(e)", "poétique",
  "esprit de famlle", "protecteur(trice)", "leader", "médiateur(trice)",
  "solidaire",
  "drôle", "matheux(se)", "littéraire",
  "indépendant(e)", "engagé(e)",
];

// Composant principal
const TraitsSelector: React.FC<TraitsSelectorProps> = ({ traits, onChange }) => {
  // Toggle d'un trait (limite stricte 5)
  const handleCheckboxChange = (trait: string) => {
    const next = new Set(traits);
    next.has(trait) ? next.delete(trait) : next.add(trait);
    onChange(Array.from(next).slice(0, 5));
  };

  return (
    <div className="bg-white bg-opacity-70 p-4 rounded-xl shadow-md">
      {/* Titre */}
      <p className="font-semibold mb-2 text-paleGreen">
        Ce qui te caractérise le plus
      </p>

      {/* Grille responsive : 2 colonnes en mobile étroit, 3 colonnes >= sm */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-2">
        {allTraits.map((trait) => (
          <label
            key={trait}
            className="flex items-start gap-2 min-w-0"
          >
            <input
              type="checkbox"
              checked={traits.includes(trait)}
              onChange={() => handleCheckboxChange(trait)}
              disabled={!traits.includes(trait) && traits.length >= 6}
              className="form-checkbox mt-0.5 h-4 w-4 shrink-0"
            />
            <span className="text-xs sm:text-sm leading-tight break-words whitespace-normal select-none">
              {trait}
            </span>
          </label>
        ))}
      </div>

      {/* Sélection actuelle */}
      <p className="text-sm mt-2 text-blue-700">
        Traits sélectionnés : {traits.join(", ")}
      </p>
    </div>
  );
};

export default TraitsSelector;
