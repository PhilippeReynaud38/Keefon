import React from "react";
import type { NextPageContext } from "next";

/**
 * _error — Gestion simple des erreurs (SSR/CSR).
 * - Message propre pour l'utilisateur.
 * - Détails techniques visibles seulement en dev/console.
 */
function ErrorPage({ statusCode }: { statusCode?: number }) {
  const code = statusCode ?? 0;
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-3xl font-semibold mb-2">
        Une erreur est survenue{code ? ` (code ${code})` : ""}.
      </h1>
      <p className="mb-4">Si le problème persiste, réessaie plus tard.</p>
      <link href="/" className="underline">Revenir à l’accueil</link>
    </main>
  );
}

ErrorPage.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res?.statusCode ?? err?.statusCode ?? 500;
  return { statusCode };
};

export default ErrorPage;
