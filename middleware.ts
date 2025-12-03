// -*- coding: utf-8 -*-
// ============================================================================
// Keefon | Middleware global
// Fichier : /middleware.ts
// Objet   : Laisser passer toutes les requêtes sans mot de passe global.
//           On conserve le middleware comme squelette pour de futures règles.
// Règles  : code simple, pas d’effets de bord, UTF-8.
// ============================================================================

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(_req: NextRequest) {
  // Aucune restriction globale : on laisse tout passer.
  return NextResponse.next();
}

// ⚠ IMPORTANT : pas de "as string[]" ni d’astuces TypeScript ici.
// Next.js lit cette config comme du simple JS.
export const config = {
  matcher: [], // pas de routes ciblées pour l’instant
};
