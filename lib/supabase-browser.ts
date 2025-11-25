// -*- coding: utf-8 -*-
// lib/supabase-browser.ts — Singleton client navigateur (HMR-safe)

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const g = globalThis as unknown as { __sb_vivaya__?: SupabaseClient };

export const supabaseBrowser: SupabaseClient =
  g.__sb_vivaya__ ??
  createClient(supabaseUrl, supabaseKey, {
    auth: {
      storageKey: 'sb-vivaya-auth', // évite collisions entre projets
      persistSession: true,
      autoRefreshToken: true,
    },
  });

if (process.env.NODE_ENV !== 'production') {
  g.__sb_vivaya__ = supabaseBrowser; // survit aux rechargements HMR
}
