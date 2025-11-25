// UTF-8
import { createClient } from '@supabase/supabase-js'

// ⚠️ Si tu es côté serveur avec helpers Next, remplace par ton client serveur.
// Ici, on fait un client “générique” que tu peux aussi adapter.
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export async function getEssentielGlobalFlag(): Promise<boolean> {
  const { data, error } = await supabase.rpc('get_essentiel_offert_global')
  if (error) {
    console.warn('getEssentielGlobalFlag RPC error:', error.message)
    return false
  }
  return !!data
}
