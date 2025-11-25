// UTF-8 — Quotas "ouverture vers non-abonné" (front-only, safe)
import { supabase } from '@/lib/supabaseClient'
const ENFORCE = process.env.NEXT_PUBLIC_OPEN_FREE_ENFORCE === '1'

export async function getOpenFreeQuota() {
  if (!ENFORCE) return { remaining_week: 9999, remaining_month: 9999 }
  const { data } = await supabase.from('my_open_free_quota_v').select('*').single()
  return (data ?? { remaining_week: 0, remaining_month: 0 }) as {
    remaining_week: number; remaining_month: number
  }
}

export async function tryOpenFree(targetUserId: string) {
  if (!ENFORCE) return { ok: true as const }
  const { data: auth } = await supabase.auth.getUser()
  const uid = auth?.user?.id
  if (!uid) return { ok: false as const, reason: 'auth' }

  const q = await getOpenFreeQuota()
  if (q.remaining_week <= 0)  return { ok: false as const, reason: 'weekly' }
  if (q.remaining_month <= 0) return { ok: false as const, reason: 'monthly' }

  const { error } = await supabase.from('open_free_conv_log').insert({
    opener_user_id: uid, target_user_id: targetUserId,
  })
  if (error) return { ok: false as const, reason: 'insert' }
  return { ok: true as const }
}
