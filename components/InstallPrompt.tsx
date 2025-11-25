// -*- coding: utf-8 -*-
// components/InstallPrompt.tsx
//
// Petit bandeau discret pour proposer d'ajouter Keefon
// sur l'écran d'accueil (PWA / icône style appli).
//
// Texte :
//  📲 Envie d’un accès rapide ?
//  Ajouter l’icône Keefon sur l’écran d’accueil.
//  [Ajouter] [Plus tard]
//
// Comportement :
//  - S'affiche uniquement :
//    • si l'utilisateur est connecté
//    • si on est sur certaines pages de "mon espace"
//    • si l'app n'est pas déjà installée (standalone)
//    • si l'utilisateur ne l'a pas déjà masqué ("Plus tard")
//  - Utilise l'événement beforeinstallprompt quand disponible (Android/Chrome).

import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useSessionContext } from "@supabase/auth-helpers-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice?: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const LOCALSTORAGE_KEY = "keefon_install_prompt_hidden";

// Pages où on veut proposer l'icône (à ajuster si besoin)
const ALLOWED_PREFIXES = ["/profile", "/interaction", "/dashboard"];

export const InstallPrompt: React.FC = () => {
  const { session } = useSessionContext();
  const router = useRouter();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  const pathname = router.pathname;

  // Est-ce qu'on est sur une page de "mon espace" ?
  const shouldShowOnPath = ALLOWED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );

  // Ne pas afficher si l'app est déjà installée en mode standalone
  const isStandalone = () => {
    if (typeof window === "undefined") return false;
    // Android / desktop PWA
    if (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) {
      return true;
    }
    // iOS PWA
    // @ts-ignore
    if ((window.navigator as any).standalone === true) {
      return true;
    }
    return false;
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!session) return; // uniquement utilisateur connecté
    if (!shouldShowOnPath) return; // uniquement certaines pages
    if (isStandalone()) return; // déjà installé → inutile

    const hiddenFlag = window.localStorage.getItem(LOCALSTORAGE_KEY);
    if (hiddenFlag === "true") return; // l'utilisateur a déjà cliqué "Plus tard"

    const handler = (e: Event) => {
      const ev = e as BeforeInstallPromptEvent;
      // On empêche le prompt auto, on le déclenchera nous-mêmes
      ev.preventDefault();
      setDeferredPrompt(ev);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, [session, shouldShowOnPath]);

  const handleLater = () => {
    setVisible(false);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LOCALSTORAGE_KEY, "true");
    }
  };

  const handleInstall = async () => {
    if (!deferredPrompt) {
      // Cas où beforeinstallprompt n'est pas dispo (ex: iOS)
      // On cache quand même pour ne pas spammer.
      setVisible(false);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(LOCALSTORAGE_KEY, "true");
      }
      return;
    }

    try {
      await deferredPrompt.prompt?.();
      if (deferredPrompt.userChoice) {
        const choice = await deferredPrompt.userChoice;
        // On ne fait rien de spécial selon accepted/dismissed,
        // on masque dans tous les cas.
        if (choice.outcome === "accepted") {
          // Install acceptée
        } else {
          // Install refusée
        }
      }
    } catch (e) {
      console.error("Install prompt error:", e);
    } finally {
      setVisible(false);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(LOCALSTORAGE_KEY, "true");
      }
      setDeferredPrompt(null);
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[200] px-3 pb-3">
      <div className="mx-auto max-w-md rounded-2xl bg-black text-white shadow-xl px-4 py-3 flex items-center gap-3">
        <div className="flex-1 text-sm leading-snug">
          <div className="font-semibold flex items-center gap-1">
            <span role="img" aria-hidden="true">
              📲
            </span>
            <span>Envie d’un accès rapide ?</span>
          </div>
          <div className="text-xs text-neutral-200 mt-0.5">
            Ajouter l’icône <span className="font-semibold">Keefon</span> sur l’écran d’accueil.
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={handleInstall}
            className="text-xs font-semibold px-3 py-1 rounded-full bg-yellow-400 text-black hover:bg-yellow-300"
          >
            Ajouter
          </button>
          <button
            type="button"
            onClick={handleLater}
            className="text-[11px] px-2 py-1 rounded-full text-neutral-300 hover:text-white"
          >
            Plus tard
          </button>
        </div>
      </div>
    </div>
  );
};
