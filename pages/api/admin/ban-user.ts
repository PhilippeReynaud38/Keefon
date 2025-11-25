// pages/api/admin/ban-user.ts
// Bannissement "dur" : log -> purge DB -> suppression fichiers Storage -> suppression Auth
// Accès : SUPERADMIN uniquement (vérifié via JWT Bearer)

import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE!;

type Json = { ok?: true; error?: string };

export default async function handler(req: NextApiRequest, res: NextApiResponse<Json>) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { userId, reason, keepMessages } =
      (req.body ?? {}) as { userId?: string; reason?: string; keepMessages?: number };
    if (!userId) return res.status(400).json({ error: "userId manquant" });

    // 1) Auth appelant (SUPERADMIN)
    const bearer = req.headers.authorization?.replace(/^Bearer\s+/i, "");
    if (!bearer) return res.status(401).json({ error: "Token manquant" });

    const asUser = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${bearer}` } },
    });

    const { data: uInfo, error: uErr } = await asUser.auth.getUser();
    if (uErr || !uInfo?.user) return res.status(401).json({ error: "Auth invalide" });
    const callerId = uInfo.user.id;

    const { data: callerProfile, error: profErr } = await asUser
      .from("profiles")
      .select("is_superadmin")
      .eq("id", callerId)
      .maybeSingle();
    if (profErr) return res.status(500).json({ error: profErr.message });
    if (!callerProfile?.is_superadmin) return res.status(403).json({ error: "Réservé au superadmin" });

    if (callerId === userId) return res.status(400).json({ error: "Impossible de se bannir soi-même." });

    // Interdit de bannir un autre superadmin
    const { data: targetProfile, error: tgtErr } = await asUser
      .from("profiles")
      .select("is_superadmin, avatar_url")
      .eq("id", userId)
      .maybeSingle();
    if (tgtErr) return res.status(500).json({ error: tgtErr.message });
    if (!targetProfile) return res.status(404).json({ error: "Profil introuvable" });
    if (targetProfile.is_superadmin) return res.status(400).json({ error: "Impossible de bannir un superadmin." });

    // 2) Client admin (service role)
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // utilitaire: URL publique -> {bucket, path}
    const parsePublicUrl = (url?: string | null) => {
      if (!url) return null;
      const m = url.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
      return m ? { bucket: m[1], path: m[2] } : null;
    };

    const removeList: Array<{ bucket: string; path: string }> = [];

    // a) avatar du profil
    const p = parsePublicUrl(targetProfile.avatar_url);
    if (p) removeList.push(p);

    // b) photos / certified_photos référencées
    const collectPics = async (table: "photos" | "certified_photos") => {
      const { data } = await admin.from(table).select("url").eq("user_id", userId);
      for (const row of data ?? []) {
        const parsed = parsePublicUrl(row?.url);
        if (parsed) removeList.push(parsed);
      }
    };
    await collectPics("photos");
    await collectPics("certified_photos");

    // 3) RPC: journal + purges + marquage messages
    const keep = Number.isFinite(keepMessages) ? Math.max(0, Math.floor(keepMessages!)) : 2; // défaut = 2
    {
      const { error } = await admin.rpc("admin_flag_ban", {
        p_user_id: userId,
        p_reason: reason ?? null,
        p_created_by: callerId,   // évite auth.uid() NULL côté SQL
        p_keep_messages: keep,    // <<-- IMPORTANT : combien de messages conserver en "preuve"
      });
      if (error) return res.status(500).json({ error: `admin_flag_ban: ${error.message}` });
    }

    // 4) Suppression Storage (regroupée par bucket)
    try {
      const grouped: Record<string, string[]> = {};
      for (const it of removeList) (grouped[it.bucket] ||= []).push(it.path);
      for (const [bucket, paths] of Object.entries(grouped)) {
        if (paths.length) await admin.storage.from(bucket).remove(paths);
      }
    } catch {
      // on ne bloque pas si certains fichiers manquent
    }

    // 5) Suppression utilisateur Auth
    {
      const { error } = await admin.auth.admin.deleteUser(userId);
      if (error) return res.status(500).json({ error: `auth delete: ${error.message}` });
    }

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message ?? "Erreur serveur" });
  }
}
