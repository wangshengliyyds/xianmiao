import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { isAdminConfigured } from './config'

// 管理员客户端，使用 service_role key，绕过 RLS
// 仅在服务端使用（Route Handler / Server Action / Edge Function）
export function createAdminClient() {
  if (!isAdminConfigured()) {
    throw new Error('Supabase Admin 未配置')
  }
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )
}

export { isAdminConfigured }
