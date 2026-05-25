import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 })

  try {
    const { data, error } = await supabase
      .from('merchant_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: data || null })
  } catch {
    return NextResponse.json({ error: '操作失败' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 })

  try {
    const body = await req.json()
    if (!body.shop_name?.trim()) {
      return NextResponse.json({ error: '请输入店铺名称' }, { status: 400 })
    }

    // 检查是否已有申请
    const { data: existing } = await supabase
      .from('merchant_profiles')
      .select('id, status')
      .eq('user_id', user.id)
      .single()

    if (existing) {
      if (existing.status === 'approved') {
        return NextResponse.json({ error: '你已经是商家了' }, { status: 400 })
      }
      // 更新已有申请
      const { data, error } = await supabase
        .from('merchant_profiles')
        .update({ shop_name: body.shop_name.trim(), status: 'pending' })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ data })
    }

    // 新申请
    const { data, error } = await supabase
      .from('merchant_profiles')
      .insert({
        user_id: user.id,
        shop_name: body.shop_name.trim(),
        status: 'pending',
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: '操作失败' }, { status: 500 })
  }
}
