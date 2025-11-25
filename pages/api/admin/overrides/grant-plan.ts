/* -*- coding: utf-8 -*-
 * Grant plan override by EMAIL — compatible supabase-js v1/v2
 * 1) Résout user_id par email de façon robuste:
 *    - v2: auth.admin.getUserByEmail / listUsers({ email })
 *    - v1: fallback SQL direct sur auth.users (service_role)
 * 2) Appelle ta RPC SQL: admin.grant_plan_override_by_user_id(uuid, text, int, text)
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

type Body = { email?: string; days?: number; region?: string | null; plan?: string }

async function lookupUserIdByEmail(url: string, serviceKey: string, email: string): Promise<string | null> {
  const cli: any = createClient(url, serviceKey)

  // v2 ?
  if (cli.auth && cli.auth.admin) {
    if (typeof cli.auth.admin.getUserByEmail === 'function') {
      const r = await cli.auth.admin.getUserByEmail(email)
      if (!r.error && r.user?.id) return r.user.id
    }
    if (typeof cli.auth.admin.listUsers === 'function') {
      const r = await cli.auth.admin.listUsers({ email })
      const u = r?.data?.users?.find?.((u: any) => u.email?.toLowerCase() === email.toLowerCase())
      if (u?.id) return u.id
    }
  }

  // Fallback universel (service_role requis)
  const r2 = await cli.from('auth.users').select('id,email').eq('email', email).limit(1)
  if (!r2.error && r2.data && r2.data[0]?.id) return r2.data[0].id as string

  return null
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !service) return res.status(500).json({ ok: false, error: 'Server misconfigured (env)' })

  const { email, days, region, plan } = (req.body ?? {}) as Body
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).json({ ok: false, error: 'Email invalide' })
  const nbDays = Number(days)
  if (!Number.isFinite(nbDays) || nbDays <= 0) return res.status(400).json({ ok: false, error: 'days doit être > 0' })
  const normPlan = String(plan ?? 'essentiel').toLowerCase()

  const userId = await lookupUserIdByEmail(url, service, email)
  if (!userId) return res.status(404).json({ ok: false, error: 'user_not_found' })

  // RPC côté schéma admin
  const dbAdmin = createClient(url, service, { db: { schema: 'admin' } })
  const { data, error } = await (dbAdmin as any).rpc('grant_plan_override_by_user_id', {
    p_user_id: userId,
    p_plan   : normPlan,
    p_days   : nbDays,
    p_region : region ?? null,
  })

  if (error) return res.status(500).json({ ok: false, error: `rpc_failed: ${error.message}` })
  return res.status(200).json({ ok: true, granted: true, user_id: userId, raw: data ?? null })
}
