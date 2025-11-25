// UTF-8 — ProfileLayout.tsx — Mise en page profil Vivaya
// ✅ Aucun overlay bloquant, aucun pointer-events
// ✅ Fond fixe décoratif en arrière-plan
// ✅ z-index propre

import { useLayoutEffect } from "react";

type ProfileLayoutProps = {
  children: React.ReactNode;
};

export default function ProfileLayout({ children }: ProfileLayoutProps) {
  useLayoutEffect(() => {
    if (typeof document !== "undefined") {
      document.body.setAttribute("data-page", "profile");
      return () => document.body.removeAttribute("data-page");
    }
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
      {/* ✅ Arrière-plan décoratif sans interaction */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <img
          src="/bg-profile-ext.png"
          alt="Fond Vivaya"
          className="w-full h-full object-cover"
        />
      </div>

      {/* ✅ Contenu profil */}
      <main className="relative z-10">{children}</main>
    </div>
  );
}
