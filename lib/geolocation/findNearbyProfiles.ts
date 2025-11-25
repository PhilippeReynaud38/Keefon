// UTF-8 - Vivaya Project
// Rôle : Trouver les coordonnées d'une ville française depuis la table `communes_fr`
// Correction : suggère uniquement les villes DÉBUTANT par la saisie (ex: "Fontaine" ➜ "Fontaine-le-Comte", etc.)

import { supabase } from "@/lib/supabaseClient";

/**
 * Requête Supabase pour retrouver les coordonnées d’une ville
 * @param cityName Nom partiel tapé par l’utilisateur
 * @returns Liste des villes commençant par ce nom (10 max)
 */
export async function findCoordsByCity(cityName: string) {
  if (!cityName || cityName.length < 2) return [];

  const { data, error } = await supabase
    .from("communes_fr")
    .select("nom_commune, code_postal, lat, lon")
    .ilike("nom_commune", `${cityName}%`) // ➜ commence par
    .order("nom_commune", { ascending: true })
    .limit(10);

  if (error) {
    console.error("Erreur lors de la recherche de ville :", error.message);
    return [];
  }

  return data || [];
}
