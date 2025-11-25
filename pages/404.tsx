import React from "react";
import Link from "next/link";

/**
 * 404 — Page non trouvée (UI minimaliste, accessible).
 */
export default function NotFoundPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-3xl font-semibold mb-2">Page introuvable (404)</h1>
      <p className="mb-4">Désolé, cette page n’existe pas ou n’est plus disponible.</p>
      <Link href="/" className="underline">Revenir à l’accueil</Link>
    </main>
  );
}
