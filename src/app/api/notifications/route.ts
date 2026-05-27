import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 获取通知列表
export async function GET(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = Math.min(parseInt(searchParams.get('page_size') || '20') || 20, 100)

    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (type) {
      query = query.eq('type', type)
    }

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const { data, error, count } = await query.range(from, to)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 获取未读数量
    const { count: unreadCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false)

    return NextResponse.json({
      data: data || [],
      total: count || 0,
      unread_count: unreadCount || 0,
      page,
      page_size: pageSize,
      has_more: (count || 0) > to + 1,
    })
  } catch {
    return NextResponse.json({ error: '操作失败' }, { status: 500 })
  }
}

// 标记通知已读
export async function PATCH(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { ids, mark_all } = body

    if (mark_all) {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false)
    } else if (ids && Array.isArray(ids) && ids.length > 0) {
      const safeIds = ids.slice(0, 100)
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .in('id', safeIds)
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: '操作失败' }, { status: 500 })
  }
}
