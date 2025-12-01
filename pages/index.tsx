// /pages/index.tsx — UTF-8
//
// Page racine de Keefon.
// 👉 Rôle unique : rediriger proprement vers la page vitrine /rencontres/france.

import { useEffect } from "react";
import { useRouter } from "next/router";

export default function HomeRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirection immédiate vers la page vitrine France
    router.replace("/rencontres/France");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#A8FF3B]">
      <div className="text-center px-4">
        <h1 className="text-3xl md:text-4xl font-extrabold text-pink-600">
          Keefon
        </h1>
        <p className="mt-2 text-sm md:text-base text-gray-800">
          Redirection vers la page d’accueil Keefon France…
        </p>
        <noscript>
          <p className="mt-3 text-sm text-gray-800">
            JavaScript est désactivé. Clique ici&nbsp;:{" "}
            <a href="/rencontres/France" className="underline font-semibold">
              /rencontres/France
            </a>
          </p>
        </noscript>
      </div>
    </div>
  );
}
