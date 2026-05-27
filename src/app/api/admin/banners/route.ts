import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/api-auth'

export async function GET() {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('banners')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: Request) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  const supabase = await createClient()

  try {
    const body = await req.json()

    if (!body.image_url || typeof body.image_url !== 'string') {
      return NextResponse.json({ error: '请提供有效的图片链接' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('banners')
      .insert({
        title: body.title || null,
        image_url: body.image_url,
        link_url: body.link_url || null,
        sort_order: body.sort_order || 0,
        is_active: body.is_active ?? true,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: '请求格式错误' }, { status: 400 })
  }
}

export async function PATCH(req: Request) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  const supabase = await createClient()

  try {
    const body = await req.json()
    const { id, ...updates } = body
    if (!id) return NextResponse.json({ error: '缺少 ID' }, { status: 400 })

    // 只允许更新安全字段
    const allowedFields = ['title', 'image_url', 'link_url', 'sort_order', 'is_active']
    const updateData: Record<string, unknown> = {}
    for (const key of allowedFields) {
      if (key in updates) updateData[key] = updates[key]
    }

    const { data, error } = await supabase
      .from('banners')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data) return NextResponse.json({ error: '未找到该记录' }, { status: 404 })
    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: '请求格式错误' }, { status: 400 })
  }
}

export async function DELETE(req: Request) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  const supabase = await createClient()
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: '缺少 ID' }, { status: 400 })

  const { error } = await supabase.from('banners').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
