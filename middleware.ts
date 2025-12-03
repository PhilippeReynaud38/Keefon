// middleware.ts — Keefon
// Rôle :
// - Laisser le site accessible à tout le monde (plus de Basic Auth).
// - Rafraîchir la session Supabase sur les pages utilisateur.
// - Ne JAMAIS bloquer une requête en cas d’erreur.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

export async function middleware(request: NextRequest) {
  // On laisse la requête passer par défaut
  const res = NextResponse.next();

  // On synchronise la session Supabase sans jamais casser la navigation
  try {
    const supabase = createMiddlewareClient({ req: request, res });
    await supabase.auth.getSession();
  } catch (error) {
    console.error("middleware: supabase.auth.getSession() a échoué :", error);
  }

  return res;
}

// Appliqué à toutes les pages sauf les assets/statics & fichiers publics
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.json|icons).*)",
  ],
};
