// lib/openingOffer.ts
// Appelle la fonction SQL public.claim_opening_offer()
// Retourne true si l'utilisateur fait partie des X premiers (2000…),
// false sinon.
// FICHIER POUR OFFRIR GRATUIT2 AUX 2000 PREMIERS INSCRITS J'USQU A FIN 2026
// VOIR FICHIER TEXTE POUR AIDER A COMPRENDRE : nom fichier ==>> " 2000 candidats offre d'ouverture.odt "

import { SupabaseClient } from '@supabase/supabase-js';

export async function claimOpeningOffer(
  supabase: SupabaseClient
): Promise<boolean> {
  const { data, error } = await supabase.rpc('claim_opening_offer');

  if (error) {
    console.error('[openingOffer] claim_opening_offer error', error);
    return false;
  }

  return data === true;
}
