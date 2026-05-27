import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  // 获取当前用户角色
  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (fetchError || !profile) {
    return NextResponse.json({ error: '获取用户信息失败' }, { status: 500 })
  }

  if (profile.role !== 'buyer') {
    return NextResponse.json({ error: '当前身份不可升级' }, { status: 400 })
  }

  // 升级为卖家
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ role: 'seller' })
    .eq('id', user.id)

  if (updateError) {
    return NextResponse.json({ error: '升级失败' }, { status: 500 })
  }

  return NextResponse.json({ data: { role: 'seller' } })
}
