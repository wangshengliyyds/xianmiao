import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * 验证当前用户是否为管理员，返回 user 或错误响应
 */
export async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: NextResponse.json({ error: '请先登录' }, { status: 401 }) }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_banned')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return { error: NextResponse.json({ error: '无权访问' }, { status: 403 }) }
  }

  if (profile.is_banned) {
    return { error: NextResponse.json({ error: '账号已被封禁' }, { status: 403 }) }
  }

  return { user, profile }
}

/**
 * 验证当前用户是否登录且未被封禁
 */
export async function requireAuth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: NextResponse.json({ error: '请先登录' }, { status: 401 }) }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_banned')
    .eq('id', user.id)
    .single()

  if (profile?.is_banned) {
    return { error: NextResponse.json({ error: '账号已被封禁' }, { status: 403 }) }
  }

  return { user, profile }
}
