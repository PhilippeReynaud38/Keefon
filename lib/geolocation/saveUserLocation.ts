// lib/geolocation/saveUserLocation.ts
// ✅ Utilise uniquement le code postal
// ✅ Récupère automatiquement la ville correspondante
// ✅ Stocke user_id, code_postal, ville

import { supabase } from "@/lib/supabaseClient";

interface Props {
  user_id: string;
  code_postal: string;
}

export default async function saveUserLocation({ user_id, code_postal }: Props): Promise<boolean> {
  // Recherche la ville correspondant au code postal
  const { data, error } = await supabase
    .from("communes_fr")
    .select("nom_commune")
    .eq("code_postal", code_postal)
    .limit(1)
    .maybeSingle();

  if (error || !data) return false;

  const ville = data.nom_commune;

  // Enregistrement dans user_localisations (upsert = insert ou update)
  const { error: insertError } = await supabase
    .from("user_localisations")
    .upsert(
      {
        user_id,
        code_postal,
        ville,
      },
      { onConflict: "user_id" } // remplace si déjà existant
    );

  return !insertError;
}
