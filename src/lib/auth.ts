import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'

// 获取当前登录用户
export async function getCurrentUser() {
  if (!isSupabaseConfigured()) return null

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    return { ...user, profile }
  } catch {
    return null
  }
}

// 获取当前用户资料（含角色）
export async function getCurrentProfile() {
  if (!isSupabaseConfigured()) return null

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile } = await supabase
      .from('profiles')
      .select('*, merchant_profiles(*)')
      .eq('id', user.id)
      .single()

    return profile
  } catch {
    return null
  }
}
