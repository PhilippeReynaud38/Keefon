// File: lib/features.ts
// Encoding: UTF-8
/**
 * ============================================================
 * Rôle :
 *   Drapeaux de fonctionnalités activables sans toucher au code métier.
 *
 * Responsabilités :
 *   - Centraliser l’activation/désactivation des features UI.
 *   - Permettre un rollback instantané (flip d’un booléen).
 *
 * Entrées / Sorties :
 *   Entrées : aucune
 *   Sorties : objets/constantes de configuration
 *
 * Sécurité / RLS :
 *   - Aucun accès DB. Aucun impact RLS.
 *
 * Historique :
 *   2025-09-10 gpt : création initiale
 * ============================================================
 */

export const FEATURES = {
  quickActionsBar: false,      // Barre d’actions rapides en haut des profils
  premiumChatButton: false,    // Bouton "conversation premium"
} as const;
