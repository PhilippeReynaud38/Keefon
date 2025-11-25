// -*- coding: utf-8 -*-
// File: supabase/functions/purge-incomplete-profiles/index.ts
// Purpose: Purger automatiquement (cron) les profils jamais présinscrits (>48 h).
// Règle: robustesse, simplicité, commentaires, zéro effet de bord autour.
//
// Exécution: service role (RLS bypass). À planifier en cron (toutes les heures).
// Sécurité: on EXCLUT toute entrée admin via la vue admin.incomplete_profiles_older_than_48h_v.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

type Candidate = { id: string; email: string | null; created_at: string };
type Photo = { url: string | null };

function toStorageKey(urlOrPath: string | null | undefined): string | null {
  if (!urlOrPath) return null;
  // Cas 1: URL publique => on retire le prefixe jusqu'à ".../object/public/"
  const m = urlOrPath.match(/\/object\/public\/(.+)$/);
  if (m) return m[1]; // => "avatars/xxx.jpg"
  // Cas 2: déjà un chemin "avatars/xxx.jpg"
  if (/^[^\/]+\/.+$/.test(urlOrPath)) return urlOrPath;
  return null;
}

serve(async (req) => {
  const dry = new URL(req.url).searchParams.get("dry") === "true";

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY   = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  // 1) Lister les candidats (admin schema)
  const admin = sb.schema("admin");
  const { data: candidates, error: listErr } = await admin
    .from("incomplete_profiles_older_than_48h_v")
    .select("id,email,created_at");

  if (listErr) {
    return new Response(JSON.stringify({ ok: false, error: listErr.message }), { status: 500 });
  }

  const results: Array<{ user_id: string; email: string | null; ok: boolean; note?: string }> = [];
  const list = (candidates ?? []) as Candidate[];

  for (const c of list) {
    const uid = c.id;

    try {
      // 2) Récupérer photos pour supprimer fichiers Storage (bucket avatars)
      const { data: photos, error: phErr } = await sb
        .from("photos")
        .select("url")
        .eq("user_id", uid);

      if (phErr) throw new Error(`select photos: ${phErr.message}`);

      const keys = (photos as Photo[]).map(p => toStorageKey(p.url || undefined)).filter(Boolean) as string[];

      if (!dry && keys.length > 0) {
        const { error: rmErr } = await sb.storage.from("avatars").remove(keys);
        if (rmErr) {
          // on loggue mais on continue (ne doit pas bloquer la purge DB/Auth)
          console.warn(`storage remove failed for ${uid}:`, rmErr.message);
        }
      }

      // 3) Purge DB (ordre: enfants -> parent)
      if (!dry) {
        // Enfants connus: photos (le reste dépend de tes FK; on reste minimaliste et robuste)
        const { error: delPhotosErr } = await sb.from("photos").delete().eq("user_id", uid);
        if (delPhotosErr) {
          console.warn(`delete photos failed for ${uid}:`, delPhotosErr.message);
        }

        // Parent: profiles
        const { error: delProfileErr } = await sb.from("profiles").delete().eq("id", uid);
        if (delProfileErr) throw new Error(`delete profile: ${delProfileErr.message}`);

        // 4) Purge Auth (à la fin)
        const { error: authErr } = await sb.auth.admin.deleteUser(uid);
        if (authErr) {
          // Non bloquant: si l’utilisateur auth est déjà parti / inexistant
          console.warn(`auth delete user failed for ${uid}:`, authErr.message);
        }
      }

      results.push({ user_id: uid, email: c.email, ok: true });
      // Audit
      await sb.schema("admin").from("purge_audit").insert({
        user_id: uid,
        email: c.email,
        action: "PURGE_INCOMPLETE_48H" + (dry ? "_DRY" : ""),
        ok: true,
        note: null
      });

    } catch (e: any) {
      const note = String(e?.message ?? e);
      results.push({ user_id: uid, email: c.email, ok: false, note });
      await sb.schema("admin").from("purge_audit").insert({
        user_id: uid,
        email: c.email,
        action: "PURGE_INCOMPLETE_48H" + (dry ? "_DRY" : ""),
        ok: false,
        note
      });
    }
  }

  return new Response(JSON.stringify({ ok: true, dry, count: results.length, results }, null, 2), {
    headers: { "content-type": "application/json; charset=utf-8" },
  });
});
