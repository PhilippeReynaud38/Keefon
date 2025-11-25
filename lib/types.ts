/**
 * FICHIER : lib/types.ts
 * RÔLE    : Définir les types TypeScript partagés par l’UI (cartes, grilles, pages).
 * CONTEXTE : Vivaya — lecture prioritaire via la vue `public_full_profiles`.
 *
 * POURQUOI :
 * - Éviter la dispersion des définitions de types.
 * - Offrir un contrat unique et stable pour l’affichage des résultats de recherche.
 *
 * NOTE :
 * - Le composant ProfileCard attend ce type (importé depuis "../lib/types").
 * - Le champ `traits` est toujours un tableau de chaînes (0–6). Si la BDD
 *   renvoie un texte/csv, on convertira côté page (pas ici).
 *
 * ENCODAGE : UTF-8
 */

export type ProfileCardDTO = {
  /** Identifiant public du profil (UUID) */
  id: string;

  /** Pseudo affiché (ex. "@alex") */
  username: string;

  /** Âge calculé (côté SQL ou page) */
  age: number;

  /** Ville (issue de `public_full_profiles.ville`) */
  city: string | null;

  /** Code postal si disponible dans la vue */
  postal_code: string | null;

  /** Distance depuis le point de recherche (km), ou null si non calculée */
  distance_km: number | null;

  /** Badge "Certifié" (true/false) */
  certified: boolean;

  /** URL de la photo principale, ou null si aucune */
  main_photo_url: string | null;

  /**
   * Traits principaux du profil.
   * L’UI n’affiche que les 3 premiers, puis “+X autres”.
   * La normalisation (texte -> tableau) sera faite côté page.
   */
  traits: string[];
};
