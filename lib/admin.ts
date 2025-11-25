import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function fetchAdminFlags() {
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr) throw authErr
  if (!user) return { is_admin: false, is_superadmin: false }

  const { data, error } = await supabase
    .from('profiles')
    .select('is_admin, is_superadmin')
    .eq('id', user.id)
    .single()

  if (error) throw error
  return data as { is_admin: boolean; is_superadmin: boolean }
}
