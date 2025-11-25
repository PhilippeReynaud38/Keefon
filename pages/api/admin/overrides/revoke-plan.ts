/* -*- coding: utf-8 -*-
 * Revoke plan override by EMAIL — compatible supabase-js v1/v2
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

async function lookupUserIdByEmail(url: string, serviceKey: string, email: string): Promise<string | null> {
  const cli: any = createClient(url, serviceKey)
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
  const r2 = await cli.from('auth.users').select('id,email').eq('email', email).limit(1)
  if (!r2.error && r2.data && r2.data[0]?.id) return r2.data[0].id as string
  return null
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !service) return res.status(500).json({ ok: false, error: 'Server misconfigured (env)' })

  const { email } = (req.body ?? {}) as { email?: string }
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).json({ ok: false, error: 'Email invalide' })

  const userId = await lookupUserIdByEmail(url, service, email)
  if (!userId) return res.status(404).json({ ok: false, error: 'user_not_found' })

  const dbAdmin = createClient(url, service, { db: { schema: 'admin' } })
  const { data, error } = await (dbAdmin as any).rpc('revoke_plan_override_by_user_id', {
    p_user_id: userId,
    p_plan   : null, // révoque tout
  })

  if (error) return res.status(500).json({ ok: false, error: `rpc_failed: ${error.message}` })
  return res.status(200).json({ ok: true, revoked: data ?? null, user_id: userId })
}
