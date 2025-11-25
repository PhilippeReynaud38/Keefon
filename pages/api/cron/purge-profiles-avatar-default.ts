// pages/api/cron/purge-profiles-avatar-default.ts
// ------------------------------------------------------------------------------------
// Objet : Tâche CRON (appelée par un job externe) pour purger automatiquement
//         les comptes qui utilisent encore un avatar par défaut, selon la vue d’audit.
//
// Entrée :
//   - Méthode POST
//   - Header X-Cron-Secret: <secret>   (doit matcher CRON_SECRET_AVATAR_PURGE)
// Sortie :
//   - 200 { ok:true, deleted_ids:string[], failed_ids:{id,error}[], scanned:number }
//   - 4xx/5xx { error:string }
//
// Logique :
//   1) Vérifie le secret X-Cron-Secret.
//   2) Utilise le client service role Supabase (backend uniquement).
//   3) Récupère une liste de user_id dans admin.audit_profiles_avatar_par_defaut_v
//      (ex: limit 100 par exécution).
//   4) Pour chaque user_id :
//        - suppression des fichiers avatars contenant l'uid
//        - tentative d'appel admin_delete_account_hard(user_id) si elle existe
//        - suppression auth.admin.deleteUser(user_id)
// ------------------------------------------------------------------------------------

import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const CRON_SECRET = process.env.CRON_SECRET_AVATAR_PURGE || '';

type ApiOk = {
  ok: true;
  deleted_ids: string[];
  failed_ids: { id: string; error: string }[];
  scanned: number;
};

type ApiErr = { error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiOk | ApiErr>
) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  // 1) Vérifier le secret CRON
  const headerSecret =
    (req.headers['x-cron-secret'] as string | undefined) || '';

  if (!CRON_SECRET) {
    console.error(
      '[cron/purge-profiles-avatar-default] CRON_SECRET_AVATAR_PURGE non défini en env'
    );
    res.status(500).json({ error: 'Cron secret not configured' });
    return;
  }

  if (!headerSecret || headerSecret !== CRON_SECRET) {
    console.warn(
      '[cron/purge-profiles-avatar-default] Tentative avec mauvais secret'
    );
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  const admin = createClient(url, service);

  // 2) Récupérer les comptes à purger depuis la vue d’audit (schéma admin)
  const { data: rows, error: fetchErr } = await (admin as any)
    .schema('admin')
    .from('audit_profiles_avatar_par_defaut_v')
    .select('user_id, weeks_since_signup')
    // Exemple : on ne purge que les comptes qui ont au moins 4 semaines
    .gte('weeks_since_signup', 4)
    .limit(100);

  if (fetchErr) {
    console.error(
      '[cron/purge-profiles-avatar-default] fetch error:',
      fetchErr
    );
    res.status(500).json({ error: 'Failed to fetch targets from audit view' });
    return;
  }

  const targets: string[] = (rows || [])
    .map((r: any) => r.user_id)
    .filter((x: any) => typeof x === 'string' && x.length > 0);

  const deletedIds: string[] = [];
  const failedIds: { id: string; error: string }[] = [];

  if (targets.length === 0) {
    res
      .status(200)
      .json({ ok: true, deleted_ids: [], failed_ids: [], scanned: 0 });
    return;
  }

  // 3) Pour chaque utilisateur cible
  for (const uid of targets) {
    try {
      // 3a) Nettoyage Storage (bucket "avatars")
      const bucket = admin.storage.from('avatars');
      let cursor: number = 0;

      try {
        while (true) {
          const { data: page, error: listErr } = await bucket.list('', {
            limit: 1000,
            offset: cursor,
          });

          if (listErr) {
            throw listErr;
          }

          if (!page || page.length === 0) {
            break;
          }

          for (const obj of page) {
            if (!obj?.name) continue;
            if (obj.name.includes(uid)) {
              const { error: remErr } = await bucket.remove([obj.name]);
              if (remErr) {
                console.error(
                  '[cron/purge-profiles-avatar-default] remove error:',
                  remErr.message || remErr
                );
              }
            }
          }

          if (page.length < 1000) {
            break;
          }
          cursor += page.length;
        }
      } catch (e: any) {
        console.error(
          '[cron/purge-profiles-avatar-default] storage cleanup error for',
          uid,
          e?.message || e
        );
        // on continue malgré tout
      }

      // 3b) (Option) Purge SQL si la fonction existe déjà
      try {
        await (admin as any).rpc('admin_delete_account_hard', { user_id: uid });
      } catch (e: any) {
        console.warn(
          '[cron/purge-profiles-avatar-default] admin_delete_account_hard error for',
          uid,
          e?.message || e
        );
      }

      // 3c) Suppression Auth Admin
      try {
        const { error: delAuthErr } = await (admin as any).auth.admin.deleteUser(
          uid
        );
        if (delAuthErr) throw delAuthErr;
      } catch (e: any) {
        console.error(
          '[cron/purge-profiles-avatar-default] auth delete error for',
          uid,
          e?.message || e
        );
        throw e;
      }

      deletedIds.push(uid);
    } catch (e: any) {
      failedIds.push({ id: uid, error: e?.message || String(e) });
    }
  }

  res.status(200).json({
    ok: true,
    deleted_ids: deletedIds,
    failed_ids: failedIds,
    scanned: targets.length,
  });
}
