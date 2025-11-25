// /pages/logout.tsx — UTF-8
//
// RÔLE
// - Déconnecte l'utilisateur puis redirige vers l'accueil.
// - Code simple, robuste, maintenable.

import { useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/lib/supabaseClient";

export default function Logout() {
  const router = useRouter();

  useEffect(() => {
    let done = false;
    (async () => {
      try {
        await supabase.auth.signOut();
      } finally {
        if (!done) router.replace("/"); // ← redirection vers l'accueil
      }
    })();
    return () => {
      done = true;
    };
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      Déconnexion…
    </div>
  );
}
