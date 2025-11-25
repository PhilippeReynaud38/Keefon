// -*- coding: utf-8 -*-
// components/InstallIconButton.tsx
//
// Bouton permanent pour proposer d'ajouter Keefon
// sur l'écran d'accueil (PWA / icône comme une appli).
//
// - Bouton toujours visible sur la page où il est utilisé.
// - Vert (style Keefon) au lieu de noir.
// - Pas de popup alert() : si le navigateur ne gère pas
//   l'installation, on affiche juste une petite phrase
//   sous le bouton.
// - Quand l'app sera une vraie PWA (manifest + SW + HTTPS),
//   le navigateur enverra beforeinstallprompt et le bouton
//   ouvrira la boîte d'installation système.

import React, { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice?: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export const InstallIconButton: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [info, setInfo] = useState<string | null>(null);

  // Détection "app déjà installée" (mode standalone)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkStandalone = () => {
      let standalone = false;

      // Android / desktop PWA
      if (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) {
        standalone = true;
      }

      // iOS Safari (PWA)
      // @ts-ignore
      if ((window.navigator as any).standalone === true) {
        standalone = true;
      }

      setIsInstalled(standalone);
    };

    checkStandalone();

    const mq = window.matchMedia("(display-mode: standalone)");
    const listener = () => checkStandalone();
    mq.addEventListener("change", listener);

    return () => {
      mq.removeEventListener("change", listener);
    };
  }, []);

  // Capture de l'event beforeinstallprompt (Android/Chrome, etc.)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handler = (e: Event) => {
      const ev = e as BeforeInstallPromptEvent;
      // On empêche la popup automatique, on la déclenchera avec notre bouton
      ev.preventDefault();
      setDeferredPrompt(ev);
      // On efface éventuellement un ancien message d'info
      setInfo(null);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleClick = async () => {
    if (isInstalled) {
      return;
    }

    // Cas idéal : le navigateur a envoyé beforeinstallprompt
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        if (deferredPrompt.userChoice) {
          const choice = await deferredPrompt.userChoice;
          if (choice.outcome === "accepted") {
            setIsInstalled(true);
          } else {
            // Refusé : on laisse le bouton dispo, sans message agressif.
          }
        }
      } catch (e) {
        console.error("Install prompt error:", e);
      } finally {
        // Après un prompt, beaucoup de navigateurs "consomment" l'événement
        setDeferredPrompt(null);
      }
      return;
    }

    // Fallback : le navigateur ne propose pas (encore) d'installation automatique.
    // Pas de popup, juste une mention sous le bouton.
    setInfo(
      "L’installation automatique n’est pas disponible sur ce navigateur. Quand Keefon sera installable, ce bouton ouvrira la fenêtre d’ajout."
    );
  };

  if (isInstalled) {
    return (
      <button
        type="button"
        disabled
        className="px-3 py-2 rounded-md text-sm bg-gray-200 text-gray-600 cursor-default"
      >
        Icône Keefon déjà installée
      </button>
    );
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleClick}
        className="px-3 py-2 rounded-md text-sm bg-[#59FF72] text-black hover:bg-[#7CFF90] transition-colors"
      >
        <span className="font-semibold">
          📱 Envie d’un accès rapide ?
        </span>
        <br />
        <span className="text-xs">
          Ajouter l’icône <span className="font-semibold">Keefon</span> sur l’écran d’accueil.
        </span>
      </button>
      {info && (
        <p className="text-[11px] text-gray-600 max-w-xs">
          {info}
        </p>
      )}
    </div>
  );
};
