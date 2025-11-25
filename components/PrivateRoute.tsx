// components/PrivateRoute.tsx — UTF-8
// Garde minimaliste et robuste pour PAGES PROTÉGÉES uniquement.
// - Attend la fin du chargement de la session
// - Si pas connecté → /login
// - Si connecté mais inscription incomplète → /presignup
// - Sinon → affiche la page
//
// ⚠️ N'UTILISE PAS ce composant sur des pages publiques (/, /login, ...)

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useSessionContext } from "@supabase/auth-helpers-react";
import { supabase } from "@/lib/supabaseClient";

type Props = { children: React.ReactNode };

export default function PrivateRoute({ children }: Props) {
  const router = useRouter();
  const { session, isLoading } = useSessionContext();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (isLoading) return;                 // 1) attendre la session
    if (!session) {                        // 2) pas connecté -> /login
      router.replace("/login");
      return;
    }

    // 3) connecté : vérifier que l'inscription est complète
    const checkCompleted = async () => {
      const uid = session.user.id;

      // Adapté à Vivaya : presignup + photo principale
      const { data: pre } = await supabase
        .from("presignup_data")
        .select("user_id")
        .eq("user_id", uid)
        .maybeSingle();

      const { data: main } = await supabase
        .from("photos")
        .select("id")
        .eq("user_id", uid)
        .eq("is_main", true)
        .maybeSingle();

      if (!pre || !main) {
        if (router.pathname !== "/presignup") router.replace("/presignup");
        return;
      }

      setReady(true);                      // ok → on peut afficher la page
    };

    checkCompleted();
  }, [isLoading, session, router]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Chargement…
      </div>
    );
  }

  return <>{children}</>;
}
