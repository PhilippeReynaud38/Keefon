// supabase/functions/purge-incomplete-signups/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })
}

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url)
    const q = url.searchParams

    // ---- Secrets (avec fallback anciens noms) ----
    const projectUrl =
      (Deno.env.get('PROJECT_URL') ?? Deno.env.get('SUPABASE_URL') ?? '').trim()
    const serviceRole =
      (Deno.env.get('SERVICE_ROLE_KEY') ??
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ??
        '').trim()

    // Mode debug: liste les noms des variables dispos, sans exposer les valeurs
    if (q.get('debug') === '1') {
      const keys = Object.keys(Deno.env.toObject()).sort()
      return json({ ok: true, debug_env_keys: keys })
    }

    if (!projectUrl || !serviceRole) {
      return json(
        {
          ok: false,
          step: 'env',
          error: 'Missing secrets: PROJECT_URL and/or SERVICE_ROLE_KEY',
        },
        500,
      )
    }

    const supabase = createClient(projectUrl, serviceRole, {
      auth: { persistSession: false },
    })

    // Paramètres
    const hours = Number(q.get('hours') ?? '48')
    const commit = q.get('commit') === '1'

    // 1) Lister les comptes incomplets via ta RPC
    const { data, error } = await supabase.rpc('find_incomplete_signups', { hours })
    if (error) {
      return json({
        ok: false,
        step: 'rpc.find_incomplete_signups',
        error: { message: error.message, hint: error.hint },
      }, 500)
    }

    const candidates = Array.isArray(data) ? data : []

    if (!commit) {
      // Dry-run
      return json({
        ok: true,
        mode: 'dry-run',
        hours,
        count: candidates.length,
        candidates,
      })
    }

    // 2) Purge réelle
    const results: Array<{ user_id: string; status?: string; error?: string }> = []

    for (const row of candidates) {
      const userId = (row.user_id ?? row.id ?? '').toString()
      if (!userId) {
        results.push({ user_id: '', error: 'Missing user_id in row' })
        continue
      }
      try {
        const { error: delErr } = await supabase.auth.admin.deleteUser(userId)
        if (delErr) throw delErr
        results.push({ user_id: userId, status: 'deleted' })
      } catch (e: any) {
        results.push({ user_id: userId, error: e?.message ?? 'deleteUser failed' })
      }
    }

    return json({ ok: true, mode: 'commit', hours, results })
  } catch (e: any) {
    return json({ ok: false, step: 'unhandled', error: e?.message ?? 'unknown' }, 500)
  }
})
