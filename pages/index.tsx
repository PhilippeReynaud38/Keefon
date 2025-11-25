// /pages/index.tsx — UTF-8
//
// ✅ Page publique (landing page) — aucune redirection forcée ici
// Règles Vivaya :
// - Code simple et maintenable
// - Commentaires clairs
// - Pas de requireAuth, car cette page doit être visible par tous
//
// Note : La gestion d’accès se fait uniquement sur les pages protégées
// via requireAuth = true (guard léger dans _app.tsx).

import { useSession } from "@supabase/auth-helpers-react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

export default function Home() {
  // 🔐 session = données utilisateur si connecté, sinon null
  const session = useSession();

  // 🔓 Déconnexion manuelle (si déjà connecté)
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <section className="text-center px-4 pt-20 pb-16">
      {/* 🎯 Titre principal */}
      <h1 className="text-5xl sm:text-6xl font-extrabold mb-6 text-pink-600">
        Bienvenue sur <span className="text-yellow-400">Vivaya</span> ❤️
      </h1>

      {/* 📝 Accroche */}
      <p className="max-w-xl mx-auto text-xl text-neutral-700 mb-12">
        Faites des rencontres{" "}
        <span className="font-semibold">fun, sincères et magiques</span>,
        près de chez vous.
      </p>

      {/* 🔘 Boutons d’action */}
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 justify-center">
        {!session ? (
          // 🆕 Utilisateur non connecté → afficher S’inscrire / Se connecter
          <>
            <Link
              href="/signup"
              className="bg-yellow-400 text-white font-semibold rounded px-10 py-4 text-lg shadow hover:bg-paleGreen hover:text-white"
            >
              S’inscrire
            </Link>
            <Link
              href="/login"
              className="bg-paleGreen text-white font-semibold rounded px-10 py-4 text-lg hover:opacity-90"
            >
              Se connecter
            </Link>
          </>
        ) : (
          // ✅ Utilisateur connecté → afficher bouton de déconnexion
          <button
            onClick={handleLogout}
            className="bg-paleGreen text-white font-semibold rounded px-10 py-4 text-lg hover:opacity-90"
          >
            Se déconnecter
          </button>
        )}
      </div>
    </section>
  );
}
