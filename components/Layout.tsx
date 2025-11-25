// -*- coding: utf-8 -*-
// components/Layout.tsx — Vivaya
//
// RÔLE
// - Gabarit principal de page.
// - Ajoute un bandeau admin si is_admin = true.
// - Applique un attribut data-page sur <body> pour des styles contextuels.
// - Aucun favicon ici (déclaré UNE SEULE FOIS dans _app.tsx), pour éviter les doublons.
// - Footer affiché uniquement sur une liste blanche de routes (allowlist).
// - [AJOUT 2025-10-12] Vérification client "profil complété ?" et redirection vers /presignup si nécessaire,
//   en évitant tout risque de boucle et SANS requêter la DB dans le middleware.
//
// Règles projet : robustesse, simplicité, UTF-8, pas d’usine à gaz, commentaires conservés.

import { useRouter } from "next/router";
import { ReactNode, useLayoutEffect, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import Footer from "./Footer";

type LayoutProps = {
  children: ReactNode;
};

// Liste blanche des routes où le Footer DOIT apparaître.
const FOOTER_ALLOWLIST: RegExp[] = [
  /^\/$/,                         // Accueil
  /^\/dashboard(\/.*)?$/,         // Tableau de bord
  /^\/recherche$/,                // Recherche
  /^\/profile(\/.*)?$/,           // Profil
  /^\/messages(\/.*)?$/,
  /^\/(messages|likes|mes-likes)(\/.*)?$/,
  /^\/interaction\/mes_coups_de_coeur$/,
  /^\/signup$/,                   // Signup
  /^\/presignup$/,                // Presignup
  /^\/abonnement$/,               // Abonnement
  /^\/parametres$/,               // Paramètres
  /^\/account(\/.*)?$/,           // /account/*
  // Pages légales
  /^\/legal$/, /^\/privacy$/, /^\/cookies$/, /^\/terms$/,
];

// --- Routes sur lesquelles on NE DOIT PAS déclencher la redirection presignup
//     (pour éviter les boucles / permettre l’accès public min. et les flows d’admin/achat)
const PRESIGNUP_BYPASS: RegExp[] = [
  /^\/presignup(\/.*)?$/,
  /^\/signup(\/.*)?$/,
  /^\/login(\/.*)?$/,
  /^\/logout(\/.*)?$/,
  /^\/abonnement(\/.*)?$/,        // ⬅️ ajout : ne jamais bloquer la page offre/achat
  /^\/admin(\/.*)?$/,             // ⬅️ ajout : ne jamais bloquer les outils admin
  /^\/legal$/, /^\/privacy$/, /^\/cookies$/, /^\/terms$/,
];

function shouldShowFooter(pathname: string) {
  return FOOTER_ALLOWLIST.some((rx) => rx.test(pathname));
}

function shouldBypassPresignupGuard(pathname: string) {
  return PRESIGNUP_BYPASS.some((rx) => rx.test(pathname));
}

export default function Layout({ children }: LayoutProps) {
  const router = useRouter();
  const { pathname } = router;

  const isChatPage = pathname.startsWith("/chat/");

  const [isAdmin, setIsAdmin] = useState(false);

  // 🔐 Vérifie si l'utilisateur est admin (is_admin depuis profiles)
  useEffect(() => {
    let cancelled = false;
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      const { data } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single();

      if (!cancelled && data?.is_admin) setIsAdmin(true);
    };
    checkAdmin();
    return () => { cancelled = true; };
  }, []);

  // Applique dynamiquement un attribut au <body> pour le style
  useLayoutEffect(() => {
    if (typeof document !== "undefined") {
      if (isChatPage) {
        document.body.setAttribute("data-page", "chat");
      } else {
        document.body.removeAttribute("data-page");
      }
    }
  }, [isChatPage]);

  // ✅ Garde-fou "profil complété ?" côté client (pas dans le middleware)
  useEffect(() => {
    let cancelled = false;

    const guardPresignup = async () => {
      // Routes en bypass : on ne checke pas ici (évite boucles/interférences)
      if (shouldBypassPresignupGuard(pathname)) {
        return;
      }

      // 1) Session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return; // pages protégées gèreront leur redirection

      // 2) Lecture RLS "propre" : presignup_data de l'utilisateur courant
      const { data, error } = await supabase
        .from("presignup_data")
        .select("username")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        console.warn("[presignup-guard] lecture presignup_data a échoué:", error);
        return;
      }

      const completed = Boolean(data?.username);
      if (!completed && pathname !== "/presignup") {
        router.replace("/presignup");
      }
    };

    guardPresignup();
    return () => { cancelled = true; };
  }, [pathname, router]);

  const showFooter = !isChatPage && shouldShowFooter(pathname);

  return (
    <div className="min-h-screen flex flex-col text-gray-800">
      {/* Lien admin conditionnel si is_admin = true */}
      {isAdmin && (
        <div className="p-2 text-right bg-gray-100 border-b">
          <link href="/admin/roles" className="text-sm text-blue-600 hover:underline">
            ⚙ Gérer les rôles admin
          </link>
        </div>
      )}

      {/* Fond spécial pour la page chat */}
      {isChatPage && (
        <div className="hidden sm:block absolute inset-0 z-0 pointer-events-none">
          <div className="h-full w-full bg-chat-logo bg-center bg-no-repeat bg-cover opacity-90"></div>
        </div>
      )}

      {/* Contenu — on affiche toujours, le guard client redirige si besoin */}
      <main className="flex-1 w-full overflow-y-auto z-10">
        {children}
      </main>

      {/* Footer conditionnel (centralisé) */}
      {showFooter && <Footer />}
    </div>
  );
}
