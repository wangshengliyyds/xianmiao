import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/api-auth'

const defaultCampaigns = [
  { id: '1', name: '新用户首单优惠', type: '折扣', status: 'active', start_date: '2026-05-01', end_date: '2026-06-01' },
  { id: '2', name: '数码品类日', type: '满减', status: 'scheduled', start_date: '2026-06-15', end_date: '2026-06-20' },
  { id: '3', name: '春季清仓', type: '促销', status: 'ended', start_date: '2026-03-01', end_date: '2026-03-31' },
]

export async function GET() {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  const supabase = await createClient()

  const { data } = await supabase.from('system_settings').select('value').eq('key', 'campaigns').single()
  return NextResponse.json({ data: data?.value || defaultCampaigns })
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  const supabase = await createClient()

  try {
    const body = await request.json()
    const { error } = await supabase
      .from('system_settings')
      .upsert({ key: 'campaigns', value: body, updated_at: new Date().toISOString() })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, data: body })
  } catch {
    return NextResponse.json({ error: '请求格式错误' }, { status: 400 })
  }
}
