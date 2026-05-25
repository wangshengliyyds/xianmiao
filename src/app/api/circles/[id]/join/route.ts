import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 获取圈子成员
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params
  const { data: { user } } = await supabase.auth.getUser()

  try {
    const { data: members } = await supabase
      .from('circle_members')
      .select('user_id, role')
      .eq('circle_id', id)

    // 获取成员资料
    const memberList = (members || []).map((m) => ({
      ...m,
    }))

    // 如果有成员，获取用户信息
    if (memberList.length > 0) {
      const userIds = memberList.map((m) => m.user_id)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, nickname, avatar_url')
        .in('id', userIds)

      const profileMap = new Map((profiles || []).map((p) => [p.id, p]))
      for (const m of memberList) {
        (m as Record<string, unknown>).user = profileMap.get(m.user_id) || null
      }
    }

    const isMember = user ? memberList.some((m) => m.user_id === user.id) : false

    return NextResponse.json({ data: memberList, is_member: isMember })
  } catch {
    return NextResponse.json({ error: '操作失败' }, { status: 500 })
  }
}

// 加入圈子
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 })

  try {
    // 验证圈子是否存在
    const { data: circle } = await supabase
      .from('circles')
      .select('id')
      .eq('id', id)
      .single()

    if (!circle) return NextResponse.json({ error: '圈子不存在' }, { status: 404 })

    // 检查是否已加入
    const { data: existing } = await supabase
      .from('circle_members')
      .select('user_id')
      .eq('circle_id', id)
      .eq('user_id', user.id)
      .single()

    if (existing) return NextResponse.json({ error: '已加入该圈子' }, { status: 400 })

    // 加入圈子
    const { error } = await supabase
      .from('circle_members')
      .insert({ circle_id: id, user_id: user.id })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // 增加成员数
    await supabase.rpc('increment_circle_members', { circle_id: id })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: '操作失败' }, { status: 500 })
  }
}

// 退出圈子
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 })

  try {
    const { error } = await supabase
      .from('circle_members')
      .delete()
      .eq('circle_id', id)
      .eq('user_id', user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await supabase.rpc('decrement_circle_members', { circle_id: id })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: '操作失败' }, { status: 500 })
  }
}
