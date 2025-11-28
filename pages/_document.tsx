// -*- coding: utf-8 -*-
// pages/_document.tsx — Keefon
//C'est pour créer le racourcisur les bureaux, lié avec les fichiers public/manifest.json et paramètres et publics/icons 
//
// Objectif :
//  - Déclarer le manifest PWA (public/manifest.json)
//  - Définir les couleurs du thème pour les navigateurs
//  - Définir les icônes de base (favicon / apple-touch)
//
// Règles : fichier simple, aucune logique métier ici.

import Document, { Html, Head, Main, NextScript } from "next/document";

class MyDocument extends Document {
  render() {
    return (
      <Html lang="fr">
        <Head>
          {/* Manifest PWA */}
          <link rel="manifest" href="/manifest.json" />

          {/* Couleur de thème (barre navigateur, Android, etc.) */}
          <meta name="theme-color" content="#59FF72" />

          {/* Icônes de base */}
          <link
            rel="icon"
            type="image/png"
            sizes="192x192"
            href="/icons/keefon-192.png"
          />
          <link
            rel="apple-touch-icon"
            sizes="192x192"
            href="/icons/keefon-192.png"
          />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
