import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 更新地址
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 })

  try {
    const body = await request.json()

    // 只允许更新安全字段
    const allowedFields = ['name', 'phone', 'province', 'city', 'district', 'detail', 'is_default']
    const updateData: Record<string, unknown> = {}
    for (const key of allowedFields) {
      if (key in body) updateData[key] = body[key]
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: '无可更新字段' }, { status: 400 })
    }

    if (updateData.is_default) {
      await supabase.from('addresses').update({ is_default: false }).eq('user_id', user.id)
    }

    const { data, error } = await supabase
      .from('addresses')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: '操作失败' }, { status: 500 })
  }
}

// 删除地址
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 })

  try {
    const { error } = await supabase.from('addresses').delete().eq('id', id).eq('user_id', user.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: '操作失败' }, { status: 500 })
  }
}
