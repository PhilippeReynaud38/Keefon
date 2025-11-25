// -*- coding: utf-8 -*-
// File: components/admin/AdminBasicCounters.tsx
// Project: Vivaya (Keefon)
// Règles: robuste, simple, logique, 100 % UTF-8, commentaires conservés
// Purpose: Ancien bloc "compteurs basiques". Désormais neutralisé pour retirer
//          les compteurs jugés inutiles, SANS casser les imports existants.
// Notes:   Rendu nul, zéro requête, zéro effet de bord.

function AdminBasicCounters() {
  return null; // plus d'UI, plus de fetch
}

// Compat: certains écrans importent le default, d'autres un nommé.
export { AdminBasicCounters };
export default AdminBasicCounters;
