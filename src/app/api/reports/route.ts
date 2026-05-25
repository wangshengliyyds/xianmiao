import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/api-auth'

// 创建举报
export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  const body = await request.json()
  const { target_type, target_id, reason, description } = body

  if (!target_type || !target_id || !reason) {
    return NextResponse.json({ error: '缺少必要参数' }, { status: 400 })
  }

  const validReasons = ['fraud', 'prohibited', 'spam', 'inappropriate', 'other']
  if (!validReasons.includes(reason)) {
    return NextResponse.json({ error: '无效的举报原因' }, { status: 400 })
  }

  if (!['product', 'user', 'message'].includes(target_type)) {
    return NextResponse.json({ error: '无效的举报类型' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('reports')
    .insert({
      reporter_id: user.id,
      target_type,
      target_id,
      reason,
      description: description || null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

// 获取举报列表（管理员）
export async function GET(request: Request) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  const status = searchParams.get('status')
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = Math.min(parseInt(searchParams.get('page_size') || '20') || 20, 100)
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('reports')
    .select(`
      *,
      reporter:profiles!reporter_id(id, nickname, avatar_url)
    `, { count: 'exact' })

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    data: data || [],
    total: count || 0,
    page,
    page_size: pageSize,
    has_more: (count || 0) > to + 1,
  })
}

// 管理员处理举报
export async function PATCH(request: Request) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  const supabase = await createClient()

  try {
    const body = await request.json()
    const { id, status, resolution } = body

    if (!id || !status) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 })
    }

    const validStatuses = ['reviewing', 'resolved', 'dismissed']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: '无效状态' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {
      status,
      handled_by: auth.user.id,
    }
    if (resolution) updateData.resolution = resolution
    if (status === 'resolved' || status === 'dismissed') {
      updateData.resolved_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('reports')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: '更新失败' }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: '更新失败' }, { status: 500 })
  }
}
