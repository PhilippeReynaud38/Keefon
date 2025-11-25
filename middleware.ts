// -*- coding: utf-8 -*-
// middleware.ts — Keefon
//
// RÔLE
// - Protéger l’accès au site en ligne via une authentification HTTP Basic,
//   avec les identifiants fournis par les variables d’environnement :
//   SITE_BASIC_AUTH_USER / SITE_BASIC_AUTH_PASS.
// - Attacher/rafraîchir la session Supabase côté Edge.
// - NE FAIT AUCUNE LECTURE DE TABLE (pas de RLS ici), aucune redirection logique.
// - Toute logique "profil complété ?" se fait dans les pages/layouts applicatifs.
//
// Règles projet : robustesse, simplicité, UTF-8, pas d’usine à gaz, commentaires sobres.

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

/**
 * Réponse 401 avec en-tête WWW-Authenticate pour déclencher
 * la popup de login HTTP Basic dans le navigateur.
 */
function unauthorizedResponse(): NextResponse {
  const response = new NextResponse('Authentication required', { status: 401 });
  response.headers.set(
    'WWW-Authenticate',
    'Basic realm="Keefon", charset="UTF-8"',
  );
  return response;
}

/**
 * Vérifie l’en-tête Authorization: Basic ... par rapport
 * aux variables d’environnement SITE_BASIC_AUTH_USER / PASS.
 *
 * - Si les variables ne sont pas définies, on n’active PAS le basic auth
 *   (utile en dev local).
 * - Sinon, on exige un couple (user, pass) exact.
 */
function isAuthorized(req: NextRequest): boolean {
  const expectedUser = process.env.SITE_BASIC_AUTH_USER;
  const expectedPass = process.env.SITE_BASIC_AUTH_PASS;

  // Si les variables ne sont pas configurées, on laisse tout passer.
  // Ça évite de se bloquer en local si on oublie de les mettre.
  if (!expectedUser || !expectedPass) {
    return true;
  }

  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Basic ')) {
    return false;
  }

  const base64Credentials = authHeader.slice('Basic '.length).trim();

  let decoded: string;
  try {
    // atob est disponible dans le runtime Edge (API Web).
    decoded = atob(base64Credentials);
  } catch {
    return false;
  }

  const separatorIndex = decoded.indexOf(':');
  if (separatorIndex === -1) {
    return false;
  }

  const providedUser = decoded.slice(0, separatorIndex);
  const providedPass = decoded.slice(separatorIndex + 1);

  return providedUser === expectedUser && providedPass === expectedPass;
}

export async function middleware(req: NextRequest) {
  // 1) Protection HTTP Basic pour l’accès en ligne.
  if (!isAuthorized(req)) {
    return unauthorizedResponse();
  }

  // 2) Session Supabase comme avant.
  const res = NextResponse.next();

  const supabase = createMiddlewareClient({ req, res });
  await supabase.auth.getSession();

  return res;
}

// Matcher par défaut : tout sauf fichiers statiques classiques.
// (Simple et sûr ; ajuste si besoin dans une passe ultérieure dédiée.)
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'],
};
