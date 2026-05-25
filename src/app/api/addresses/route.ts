import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { addressSchema } from '@/lib/validators'

// 获取地址列表
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 })

  try {
    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: '操作失败' }, { status: 500 })
  }
}

// 新增地址
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 })

  try {
    const body = await request.json()
    const result = addressSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 })
    }

    // 如果设为默认，先取消其他默认
    if (result.data.is_default) {
      await supabase.from('addresses').update({ is_default: false }).eq('user_id', user.id)
    }

    const { data, error } = await supabase
      .from('addresses')
      .insert({ ...result.data, user_id: user.id })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data }, { status: 201 })
  } catch {
    return NextResponse.json({ error: '操作失败' }, { status: 500 })
  }
}
