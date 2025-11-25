// -*- coding: utf-8 -*-
// -----------------------------------------------------------------------------
// File: lib/supabase-admin.ts
// Project: Vivaya
// Responsibility: Client Supabase côté serveur (service role).
// Notes:
//   - À importer UNIQUEMENT dans du code serveur (API/SSR). Jamais côté client.
//   - Nécessite SUPABASE_SERVICE_ROLE_KEY dans .env.local
// -----------------------------------------------------------------------------

import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL manquant');
if (!serviceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY manquant');

export const supabaseAdmin = createClient(url, serviceKey, {
  auth: { persistSession: false },
});
