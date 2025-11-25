// UTF-8 — DashboardLayout.tsx — Mise en page Vivaya (mobile + desktop)
// ✅ Aucun z-index bloquant
// ✅ Menus propres, non superposés
// ✅ Design sobre, extensible

import { ReactNode, useState } from "react";
import Link from "next/link";

type DashboardLayoutProps = {
  children: ReactNode;
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-paleGreen">
      {/* ✅ Header / bouton menu */}
      <div className="flex justify-between items-center p-4 bg-white shadow-md">
        <h1 className="text-lg font-bold text-pink-600">Espace Vivaya</h1>
        <button
          onClick={() => setMenuOpen((open) => !open)}
          className="bg-yellow-400 px-3 py-1 rounded text-white font-semibold"
        >
          Menu
        </button>
      </div>

      {/* ✅ Menu latéral mobile (optionnel) */}
      {menuOpen && (
        <nav className="bg-white border-t border-gray-200 shadow-md p-4 space-y-2 sm:hidden z-10 relative">
          <Link href="/profile" className="block text-blue-600">Mon profil</Link>
          <Link href="/dashboard" className="block text-blue-600">Tableau de bord</Link>
          <Link href="/messages" className="block text-blue-600">Messages</Link>
          <Link href="/recherche" className="block text-blue-600">Recherche</Link>
        </nav>
      )}

      {/* ✅ Contenu principal */}
      <main className="p-4 max-w-4xl mx-auto">{children}</main>
    </div>
  );
}
