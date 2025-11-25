// -*- coding: utf-8 -*-
// utils/DeleteImageExecutor.ts
//
// Suppression d'une image dans Supabase Storage côté navigateur.
// ⚠️ On utilise le client navigateur (singleton) + RLS.
// ⚠️ Ne jamais utiliser la service_role_key côté client.

import { supabase } from '@/lib/supabaseClient';

/**
 * Supprime une image du bucket Storage.
 * @param bucket     Nom du bucket (ex: 'avatars')
 * @param path       Chemin du fichier dans le bucket (ex: 'avatars/63a0.../main.jpg')
 * @returns          void si OK, lève une Error sinon.
 */
export async function deleteImage(bucket: string, path: string): Promise<void> {
  // Validation simple
  if (!bucket || !path) {
    throw new Error('bucket_and_path_required');
  }

  // Appel Storage
  const { error } = await supabase.storage.from(bucket).remove([path]);

  if (error) {
    // Exemple: "new row violates row-level security policy" → RLS à ajuster
    throw new Error(error.message);
  }
}

/**
 * Variante pratique si tu as normalisé les chemins avatars:
 *   - bucket 'avatars'
 *   - path complet donné par ta DB (ex: 'public/avatars/avatars/<uuid>.jpg')
 *   - Dans ce cas, passe plutôt le chemin relatif du bucket, ex: 'avatars/<uuid>.jpg'
 */
export async function deleteAvatar(pathWithinAvatars: string): Promise<void> {
  return deleteImage('avatars', pathWithinAvatars);
}
