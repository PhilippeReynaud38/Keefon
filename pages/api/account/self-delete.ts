// pages/api/account/self-delete.ts
// ------------------------------------------------------------------------------------
// Objet : Self-delete déclenché par l’utilisateur connecté (depuis /parametres).
// Entrée : Authorization: Bearer <access_token> (obligatoire) ; body { user_id } (ignoré côté décision).
// Sortie : 200 { ok:true, removed:{ paths: [...] } } ou 4xx/5xx { error: "..." }.
// Sécurité :
//  - AUCUN secret admin exposé au client.
//  - L’UID provient UNIQUEMENT du token vérifié côté serveur.
// Données :
//  - Bucket unique "avatars" : on supprime tous les objets dont le nom contient l’UID.
//  - Auth Admin : suppression de l’utilisateur.
//  - (Option) RPC SQL admin_delete_account_hard(uuid) si elle est présente.
// Règles Vivaya : code simple, robuste, commenté, UTF-8, zéro gadget.
//
// Dépendances :
//  - process.env.NEXT_PUBLIC_SUPABASE_URL (public)
//  - process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY (public)
//  - process.env.SUPABASE_SERVICE_ROLE_KEY (server-only)
//
// Dernière mise à jour : 2025-11-06
// ------------------------------------------------------------------------------------

import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY!;

type ApiOk = { ok: true, removed: { paths: string[] } };
type ApiErr = { error: string };

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiOk|ApiErr>) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  // 1) Récupérer et vérifier le Bearer token
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice('Bearer '.length).trim() : '';
  if (!token) {
    res.status(401).json({ error: 'Missing auth token' });
    return;
  }

  // Clients Supabase
  const supa = createClient(url, anon);            // pour lire l’utilisateur via le token
  const admin = createClient(url, service);        // service-role pour storage + auth.admin

  // 2) Résoudre l’utilisateur à partir du token
  const { data: userData, error: userErr } = await supa.auth.getUser(token);
  if (userErr || !userData?.user?.id) {
    res.status(401).json({ error: 'Invalid token or user not found' });
    return;
  }
  const uid = userData.user.id;

  // 3) Scanner + supprimer dans le bucket unique "avatars"
  const bucket = admin.storage.from('avatars');
  const removedPaths: string[] = [];

  // Le listing côté Storage est paginé : on itère sur la racine "avatars" (le bucket),
  // et on filtre en local les fichiers qui contiennent l’UID dans le nom.
  let cursor: string | undefined = undefined;
  try {
    do {
      const { data: page, error: listErr } = await bucket.list('', {
        limit: 1000,
        offset: cursor ? Number(cursor) : 0,
        search: undefined, // on récup tout et on filtre
      } as any);
      if (listErr) throw listErr;

      const matches = (page || [])
        .filter((obj) => obj && typeof obj.name === 'string' && obj.name.includes(uid))
        .map((obj) => obj.name!);

      if (matches.length > 0) {
        const { error: delErr } = await bucket.remove(matches);
        if (delErr) throw delErr;
        removedPaths.push(...matches);
      }

      // Pagination simple via offset
      if (!page || page.length < 1000) {
        cursor = undefined;
      } else {
        cursor = String((Number(cursor || 0) + page.length));
      }
    } while (cursor);
  } catch (e: any) {
    // On continue malgré tout : la suppression du compte auth ne doit pas rester bloquée.
    console.error('[self-delete] storage cleanup error:', e?.message || e);
  }

  // 4) (Option) Purge SQL si la fonction existe (wrap best-effort)
  try {
    // Si ta fonction s’appelle autrement ou prend un param différent, adapte ici.
    await admin.rpc('admin_delete_account_hard', { user_id: uid });
  } catch {
    /* silencieux : on ne casse pas le flux si la fonction n’existe pas */
  }

  // 5) Suppression Auth Admin
  try {
    const { error: delAuthErr } = await (admin as any).auth.admin.deleteUser(uid);
    if (delAuthErr) throw delAuthErr;
  } catch (e: any) {
    console.error('[self-delete] auth delete error:', e?.message || e);
    res.status(500).json({ error: 'Failed to delete auth user' });
    return;
  }

  res.status(200).json({ ok: true, removed: { paths: removedPaths } });
}
