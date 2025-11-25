/**
 * =================================================================================================
 * VIVAYA — Admin API
 * File: pages/api/admin/force-delete-user.ts
 * Goal:
 *   Admin-only endpoint to purge remaining files in Supabase Storage for a given user UID.
 *   • DOES NOT touch DB/Auth (no rows, no RPC here) — storage cleanup only.
 *   • Keeps the previous contract:
 *       POST /api/admin/force-delete-user
 *       Headers:  x-admin-secret: <ADMIN_DELETE_SECRET>
 *       Body:     { "user_id": "<uuid>" }
 *       Returns:  { ok: boolean, scanned: string[], removed: string[], errors: string[] }
 *
 * Security:
 *   • Requires x-admin-secret matching process.env.ADMIN_DELETE_SECRET (timing-safe compare).
 *   • Uses the Supabase SERVICE ROLE key on server side (no RLS restrictions for storage).
 *
 * Storage layout (invariant in this project):
 *   • Single bucket: "avatars"
 *   • Files are stored inside the folder "avatars/" within that bucket.
 *   • Filenames start with the UID then a '-' ou '_' (ex: "<uid>_xxxxx.jpg" / "<uid>-yyyyy.jpg").
 *
 * Dependencies (server-only env):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   ADMIN_DELETE_SECRET
 *
 * Notes:
 *   • This is a **micro-patch**: only the scanning/removal logic was tightened to the single bucket/folder.
 *   • No impact on other admin pages/endpoints.
 *
 * Last update: 2025-11-06
 * =================================================================================================
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

/* -------------------------------------------------------------------------------------------------
 * Supabase admin client (server-only)
 * ------------------------------------------------------------------------------------------------- */
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_DELETE_SECRET = process.env.ADMIN_DELETE_SECRET;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  // Fail fast during dev if env is missing (keeps behavior explicit).
  throw new Error(
    '[force-delete-user] Missing env NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY'
  );
}

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
  global: { headers: { 'X-Client-Info': 'vivaya/force-delete-user' } },
});

/* -------------------------------------------------------------------------------------------------
 * Utilities
 * ------------------------------------------------------------------------------------------------- */

/** Minimal UUID v4 check (no external deps). */
function isUuid(v: unknown): v is string {
  return (
    typeof v === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)
  );
}

/** Timing-safe header secret validation. */
function isValidAdminSecret(headerValue?: string | string[]): boolean {
  if (!ADMIN_DELETE_SECRET) return false;
  const provided =
    typeof headerValue === 'string'
      ? headerValue
      : Array.isArray(headerValue)
      ? headerValue[0]
      : '';

  try {
    const a = Buffer.from(provided, 'utf8');
    const b = Buffer.from(ADMIN_DELETE_SECRET, 'utf8');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/* -------------------------------------------------------------------------------------------------
 * Core — scan & remove files for a given UID in: bucket=avatars, folder=avatars/
 * ------------------------------------------------------------------------------------------------- */

type ScanRemoveResult = {
  ok: boolean;
  scanned: string[]; // list of paths detected (relative to bucket)
  removed: string[]; // list of paths actually removed
  errors: string[];  // textual errors (if any)
};

/**
 * Micro-patch: only scan the single known folder "avatars/" in bucket "avatars",
 * filter filenames starting with `${uid}-` or `${uid}_`, then remove them.
 */
async function scanAndRemoveByUid(uid: string): Promise<ScanRemoveResult> {
  const errors: string[] = [];

  // 1) List the "avatars/" folder with a search on the uid to reduce payload.
  const list = await supabaseAdmin.storage
    .from('avatars')
    .list('avatars', { search: uid, limit: 1000 });

  if (list.error) {
    errors.push(`list error: ${list.error.message}`);
    return { ok: false, scanned: [], removed: [], errors };
  }

  // 2) Keep only files whose filename starts with the UID (safety).
  const matches = (list.data ?? [])
    .filter(
      (f) =>
        typeof f.name === 'string' &&
        (f.name.startsWith(`${uid}-`) || f.name.startsWith(`${uid}_`))
    )
    .map((f) => `avatars/${f.name}`); // path relative to the bucket

  // 3) Remove those files (if any) and always reflect them in "removed".
  let removed: string[] = [];
  if (matches.length > 0) {
    const del = await supabaseAdmin.storage.from('avatars').remove(matches);
    if (del.error) {
      errors.push(`remove error: ${del.error.message}`);
    } else {
      // Supabase returns { name } for each successfully removed object
      removed = (del.data ?? []).map((x) => `avatars/${x.name}`);
    }
  }

  return { ok: errors.length === 0, scanned: matches, removed, errors };
}

/* -------------------------------------------------------------------------------------------------
 * HTTP handler
 * ------------------------------------------------------------------------------------------------- */

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only POST is allowed
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Admin secret header
  if (!isValidAdminSecret(req.headers['x-admin-secret'])) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    // Body may come parsed by Next or as a raw string (defensive parse)
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const uid: unknown = body?.user_id;

    if (!isUuid(uid)) {
      return res.status(400).json({ error: 'Invalid or missing user_id (uuid expected)' });
    }

    const result = await scanAndRemoveByUid(uid as string);
    return res.status(200).json(result);
  } catch (err: any) {
    // Never leak internals
    return res.status(500).json({ ok: false, scanned: [], removed: [], errors: ['internal error'] });
  }
}
