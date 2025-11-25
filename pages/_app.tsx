// -*- coding: utf-8 -*-
// ============================================================================
// Vivaya / Keefon — App wrapper (Pages Router)
// Fichier : pages/_app.tsx
// Objet   : Envelopper l'app avec SessionContextProvider en réutilisant
//           le client *unique* défini dans lib/supabaseClient.ts.
//           + Bandeau d'installation de l'icône Keefon (PWA) sur certaines
//             pages de "mon espace".
// Règles  : robuste, simple, logique, 100% UTF-8. Un seul export default.
// Dépendances : @supabase/auth-helpers-react
// ============================================================================

import type { AppProps } from "next/app";
import { SessionContextProvider } from "@supabase/auth-helpers-react";
import { supabase } from "@/lib/supabaseClient"; // ⚠️ on RÉUTILISE le singleton
import "@/styles/globals.css";
import { InstallPrompt } from "@/components/InstallPrompt";

export default function MyApp({ Component, pageProps }: AppProps) {
  const initialSession = (pageProps as any)?.initialSession ?? null;

  return (
    <SessionContextProvider supabaseClient={supabase} initialSession={initialSession}>
      {/* Contenu de la page */}
      <Component {...pageProps} />
      {/* Bandeau "Ajouter l’icône Keefon" sur certaines pages de l'espace membre */}
      <InstallPrompt />
    </SessionContextProvider>
  );
}
