// components/ChatLayout.tsx
// Encodage : UTF-8
//
// Rôle : layout générique du chat.
// - Supprime toute logique d’arrière-plan bleu.
// - Affiche l’image /bg-chat-ext.png en plein écran, sur mobile ET desktop.
// - Aucune dépendance à des classes Tailwind personnalisées.
// - Le contenu défile au-dessus du fond (z-index).

import { ReactNode, useLayoutEffect } from "react";

type ChatLayoutProps = {
  children: ReactNode;
};

export default function ChatLayout({ children }: ChatLayoutProps) {
  // (Optionnel) Tag la page pour d'autres styles si nécessaire
  useLayoutEffect(() => {
    if (typeof document !== "undefined") {
      document.body.setAttribute("data-page", "chat");
      return () => document.body.removeAttribute("data-page");
    }
  }, []);

  return (
    <div className="relative min-h-screen w-full">
      {/* ✅ Fond image unique, partout (mobile/desktop) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundImage: "url('/bg-chat-ext.png')",
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          // Si tu veux l’effet parallaxe fixe, dé-commente la ligne suivante :
          // backgroundAttachment: "fixed",
        }}
      />

      {/* Contenu de la page chat au-dessus du fond */}
      <main className="relative z-10 flex min-h-screen flex-col">
        {children}
      </main>
    </div>
  );
}
