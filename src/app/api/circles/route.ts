import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 获取圈子列表
export async function GET() {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('circles')
      .select('*')
      .order('member_count', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: '操作失败' }, { status: 500 })
  }
}

// 创建圈子
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 })

  try {
    const body = await request.json()
    const { name, description, cover_url } = body

    if (!name) return NextResponse.json({ error: '请输入圈子名称' }, { status: 400 })

    const { data, error } = await supabase
      .from('circles')
      .insert({ name, description, cover_url, creator_id: user.id })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // 创建者自动成为成员
    const { error: memberError } = await supabase.from('circle_members').insert({
      circle_id: data.id,
      user_id: user.id,
      role: 'owner',
    })

    if (memberError) {
      // 回滚：删除刚创建的圈子
      await supabase.from('circles').delete().eq('id', data.id)
      return NextResponse.json({ error: '创建圈子失败' }, { status: 500 })
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch {
    return NextResponse.json({ error: '操作失败' }, { status: 500 })
  }
}
