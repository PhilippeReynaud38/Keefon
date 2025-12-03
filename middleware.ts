// -*- coding: utf-8 -*-
// Fichier : /middleware.ts — Keefon
//
// Objet : Middleware global Next.js. Dans cette version, il ne
//         bloque plus AUCUNE page publique : plus de login/mot
//         de passe “secret” pour voir le site.
//         On garde le fichier comme squelette pour de futures
//         règles ciblées si besoin.
//
// Contexte : Next.js (pages router), déploiement Vercel + domaine
//            https://www.keefon.com.
// Entrée :  NextRequest (requête HTTP entrante).
// Sortie :  NextResponse.next() (laisser passer la requête).
//
// Effets de bord : aucun.
// Invariants :
//   - Le site public est accessible sans authentification globale.
//   - Les robots peuvent crawler toutes les pages hors /api/ et /admin
//     (géré par robots.txt, pas ici).
//
// Dernière mise à jour : 2025-12-03

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(_req: NextRequest) {
  // Aucune restriction globale : on laisse tout passer.
  return NextResponse.next();
}

// Ici, matcher vide => le middleware est théoriquement prêt,
// mais ne sert qu’à appliquer de futures règles ciblées.
// Tu peux aussi supprimer complètement ce fichier si tu préfères.
export const config = {
  matcher: [] as string[],
};



