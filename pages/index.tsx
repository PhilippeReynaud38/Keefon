// /pages/index.tsx — UTF-8
//
// Page racine de Keefon.
// 👉 Rôle unique : rediriger proprement vers la vraie entrée de l’app.
//
// Comportement :
//  - dès que la page charge, on fait router.replace("/login")
//  - si JS est désactivé, on affiche un lien vers /login
//
// ⚠️ On ne touche à rien d’autre dans le projet (manifest, PWA, etc.).
// Le PWA peut garder start_url: "/" : il arrivera ici puis ira sur /login.

import { useEffect } from "react";
import { useRouter } from "next/router";

export default function HomeRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirection immédiate vers la page de connexion
    router.replace("/login");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#A8FF3B]">
      <div className="text-center px-4">
        <h1 className="text-3xl md:text-4xl font-extrabold text-pink-600">
          Keefon
        </h1>
        <p className="mt-2 text-sm md:text-base text-gray-800">
          Redirection vers la page de connexion…
        </p>
        <noscript>
          <p className="mt-3 text-sm text-gray-800">
            JavaScript est désactivé. Clique ici&nbsp;:{" "}
            <a href="/login" className="underline font-semibold">
              /login
            </a>
          </p>
        </noscript>
      </div>
    </div>
  );
}
