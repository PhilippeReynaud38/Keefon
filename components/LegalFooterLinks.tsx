// components/LegalFooterLinks.tsx — UTF-8
import React from "react";
import Link from "next/link";

/**
 * Liens légaux compacts pour le footer.
 * Séparé pour ne pas toucher à ton Footer existant (réutilisable).
 */
export default function LegalFooterLinks() {
  return (
    <nav className="text-sm opacity-80 mt-4 flex flex-wrap gap-3">
      <Link className="underline" href="/legal">Mentions légales</Link>
      <Link className="underline" href="/privacy">Confidentialité</Link>
      <Link className="underline" href="/cookies">Cookies</Link>
      <Link className="underline" href="/terms">CGU</Link>
    </nav>
  );
}
