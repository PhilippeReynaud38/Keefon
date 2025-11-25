// -*- coding: utf-8 -*-
// components/Footer.tsx
//
// Footer légal minimal pour KEEFON.
// Affiche uniquement des liens discrets vers :
//  - Conditions Générales d'Utilisation
//  - Mentions légales
//
// Utilisé sur toutes les pages (sauf chat) pour respecter l'accès facile
// aux infos légales, sans casser le design.

import React from "react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full text-center text-xs text-gray-700 mt-4 mb-2">
      <Link href="/cgu" className="hover:underline">
        Conditions Générales d&apos;Utilisation
      </Link>
      {" · "}
      <Link href="/mentions-legales" className="hover:underline">
        Mentions légales
      </Link>
    </footer>
  );
}
