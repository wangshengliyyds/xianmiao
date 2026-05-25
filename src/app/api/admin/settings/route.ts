import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/api-auth'

const defaultSettings = {
  site_name: '闲妙',
  site_description: 'AI驱动的二手闲置交易平台',
  commission_rate: 5,
  max_images_per_product: 9,
  order_timeout_hours: 72,
  enable_registration: true,
  enable_ai_review: true,
}

export async function GET() {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  const supabase = await createClient()

  // 尝试从数据库读取设置，不存在则返回默认值
  const { data } = await supabase
    .from('system_settings')
    .select('*')
    .eq('key', 'app_settings')
    .single()

  return NextResponse.json({
    data: data?.value || defaultSettings,
  })
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  const supabase = await createClient()

  try {
    const body = await request.json()

    // 尝试更新设置
    const { error } = await supabase
      .from('system_settings')
      .upsert({ key: 'app_settings', value: body, updated_at: new Date().toISOString() })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true, data: body })
  } catch {
    return NextResponse.json({ error: '请求格式错误' }, { status: 400 })
  }
}
