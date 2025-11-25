// -*- coding: utf-8 -*-
// File: /pages/admin/feature-debug.tsx — Vivaya (legacy désactivé)  
//     FICHIER NEUTRALIS                                     FICHIER NEUTRALIS E                                  FICHIER NEUTRALISE

import Link from "next/link";

export default function FeatureDebug() {
  const pageBg = "#1c1b1a";
  const cardBg = "#f3f1ec";
  const border = "#ded9cf";

  return (
    <div style={{ minHeight: "100vh", backgroundColor: pageBg, padding: 24 }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: 16, backgroundColor: "#2a2928", borderRadius: 12, border: `1px solid ${border}`, color: "#f5f5f5" }}>
        <div style={{ marginBottom: 8, fontSize: 14 }}>
          <Link href="/admin" style={{ textDecoration: "none", color: "#eaeaea" }}>← Retour au tableau de bord Admin</Link>
        </div>
        <h1 style={{ margin: 0, marginBottom: 12 }}>Admin · Feature Debug (désactivé)</h1>
        <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 10, padding: 16, color: "#1c1b1a" }}>
          <h3 style={{ marginTop: 0 }}>Fonctionnalité retirée</h3>
          <p style={{ margin: 0, lineHeight: 1.5 }}>
            Les outils de débogage des overrides/cohortes ont été retirés.
          </p>
        </div>
      </div>
    </div>
  );
}
