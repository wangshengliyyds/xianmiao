import { createBrowserClient } from '@supabase/ssr'
import { isSupabaseConfigured } from './config'

export function createClient() {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase 未配置，请在 .env.local 中设置真实的 Supabase 凭证')
  }
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export { isSupabaseConfigured }
