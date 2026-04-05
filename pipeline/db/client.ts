import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let _client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (!_client) {
    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) {
      throw new Error(
        'SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY を pipeline.env に設定してください。'
      )
    }
    _client = createClient(url, key, { auth: { persistSession: false } })
  }
  return _client
}
