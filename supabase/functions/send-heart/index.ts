// -*- coding: utf-8 -*-
// supabase/functions/send-heart/index.ts
//
// Edge Function (Deno) — envoie un "coup de cœur" du user authentifié vers une cible.
// ⚠️ On respecte les RLS : on propage le JWT reçu (Authorization: Bearer <token>)
// et on utilise l'ANON KEY (PAS la service_role).
//
// Contrat d’entrée (POST JSON):
//   { "to_user_id": "<uuid>" }
//
// Réponse JSON:
//   200 OK: { "ok": true, "heart_id": "<uuid>" }
//   400/401/403/500 avec { "ok": false, "error": "message" }

import { serve } from "https://deno.land/std@0.177.1/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";

type Json = Record<string, unknown>;

function json(status: number, body: Json, extraHeaders: HeadersInit = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...corsHeaders,
      ...extraHeaders,
    },
  });
}

// CORS minimaliste & sûr
const corsHeaders: HeadersInit = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
  "access-control-allow-methods": "GET, POST, OPTIONS",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // --- Auth obligatoire (JWT) ---
    const auth = req.headers.get("authorization") || "";
    const token = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7) : null;
    if (!token) {
      return json(401, { ok: false, error: "missing_bearer_token" });
    }

    // --- Lecture et validation du body ---
    if (req.method !== "POST") {
      return json(405, { ok: false, error: "method_not_allowed" });
    }

    let payload: { to_user_id?: string } = {};
    try {
      payload = (await req.json()) ?? {};
    } catch {
      return json(400, { ok: false, error: "invalid_json" });
    }

    const to_user_id = (payload.to_user_id || "").trim();
    if (!to_user_id) {
      return json(400, { ok: false, error: "to_user_id_required" });
    }

    // --- Client Supabase configuré RLS (ANON + header Authorization) ---
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? Deno.env.get("NEXT_PUBLIC_SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("NEXT_PUBLIC_SUPABASE_ANON_KEY");
    if (!supabaseUrl || !anonKey) {
      return json(500, { ok: false, error: "missing_supabase_env" });
    }

    const sb = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // --- Variante A: RPC côté DB (si tu as une fonction SQL send_heart(to_user_id uuid)) ---
    // const { data: rpcData, error: rpcError } = await sb.rpc("send_heart", { to_user_id });
    // if (rpcError) return json(400, { ok: false, error: rpcError.message });
    // return json(200, { ok: true, ...rpcData });

    // --- Variante B: Insert direct (respecte RLS: from_user_id = auth.uid() via policy) ---
    const { data: profile, error: meErr } = await sb.auth.getUser();
    if (meErr || !profile?.user?.id) {
      return json(401, { ok: false, error: "unauthorized_user" });
    }
    const from_user_id = profile.user.id;

    // Adapte le nom de table/colonnes à ton schéma (ex: public.hearts)
    const { data, error } = await sb
      .from("hearts")
      .insert({ from_user_id, to_user_id })
      .select("id")
      .single();

    if (error) {
      // Erreurs typiques possibles: violation de contrainte unique (déjà envoyé)
      return json(400, { ok: false, error: error.message });
    }

    return json(200, { ok: true, heart_id: data.id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return json(500, { ok: false, error: msg });
  }
});
