// Supabase 配置状态检查
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || ''

export function isSupabaseConfigured(): boolean {
  return (
    SUPABASE_URL.length > 0 &&
    !SUPABASE_URL.includes('placeholder') &&
    SUPABASE_ANON_KEY.length > 0 &&
    !SUPABASE_ANON_KEY.includes('placeholder')
  )
}

export function isAdminConfigured(): boolean {
  return (
    isSupabaseConfigured() &&
    SUPABASE_SERVICE_KEY.length > 0 &&
    !SUPABASE_SERVICE_KEY.includes('placeholder')
  )
}
