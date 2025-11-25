// UTF-8
// components/BackButton.tsx
// -----------------------------------------------------------------------------
// Bouton "Retour" cohérent avec le style Vivaya : couleur yellowGreen,
// angles arrondis, ombre douce, et hover sobre. Réutilisable partout.
// -----------------------------------------------------------------------------

import Link from "next/link";
import React from "react";

type BackButtonProps = {
  href?: string;           // URL de retour (par défaut : historique -1)
  label?: string;          // Texte du bouton (par défaut : "Retour")
  onClickFallback?: () => void; // Fallback au cas où aucun href n'est fourni
};

const BackButton: React.FC<BackButtonProps> = ({
  href,
  label = "Retour",
  onClickFallback,
}) => {
  // Si on a une URL, on utilise <Link>. Sinon, on revient dans l'historique.
  const ButtonEl = (
    <button
      type="button"
      className="px-4 py-2 rounded-xl bg-yellowGreen text-black font-semibold shadow-md hover:opacity-90 transition"
      onClick={() => {
        if (!href) {
          // Sécurité : retour historique si pas d’URL (ex. /profileplus/[id])
          if (typeof window !== "undefined") {
            window.history.back();
          }
          if (onClickFallback) onClickFallback();
        }
      }}
      aria-label="Retour"
    >
      {/* Petite flèche discrète + libellé */}
      ← {label}
    </button>
  );

  return href ? <Link href={href}>{ButtonEl}</Link> : ButtonEl;
};

export default BackButton;
