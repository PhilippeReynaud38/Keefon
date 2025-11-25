// -*- coding: utf-8 -*-
// lib/supabaseServer.ts — helper pour API routes Next.js
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

export async function getAuthedSupabase(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<{ supabase: SupabaseClient; user: any | null; error?: any }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const bearer = req.headers.authorization;

  if (bearer) {
    const supabase = createClient(url, key, { global: { headers: { Authorization: bearer } } });
    const { data, error } = await supabase.auth.getUser();
    return { supabase, user: data.user ?? null, error };
  }

  // Fallback cookies (si tu synchronises les cookies d’auth côté app)
  const supabase = createPagesServerClient({ req, res });
  const { data, error } = await supabase.auth.getUser();
  return { supabase, user: data.user ?? null, error };
}
