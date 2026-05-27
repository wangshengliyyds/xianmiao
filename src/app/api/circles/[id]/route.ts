import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 获取圈子详情
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id } = await params

  try {
    const { data, error } = await supabase
      .from('circles')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      return NextResponse.json({ error: '圈子不存在' }, { status: 404 })
    }

    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: '操作失败' }, { status: 500 })
  }
}
