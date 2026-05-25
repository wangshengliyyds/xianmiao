import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/api-auth'

const defaultRules = [
  { id: '1', name: '高频发布检测', description: '同一用户短时间内发布过多商品触发警告', enabled: true, threshold: 10 },
  { id: '2', name: '异常价格检测', description: '商品价格显著偏离市场均价时标记', enabled: true, threshold: 80 },
  { id: '3', name: '敏感词过滤', description: '商品标题和描述中的违禁词自动拦截', enabled: true, threshold: 1 },
  { id: '4', name: '重复商品检测', description: '检测同一用户发布的重复或高度相似商品', enabled: false, threshold: 90 },
]

export async function GET() {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  const supabase = await createClient()
  const { data } = await supabase.from('system_settings').select('value').eq('key', 'risk_rules').single()
  return NextResponse.json({ data: data?.value || defaultRules })
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  const supabase = await createClient()
  const body = await request.json()
  const { error } = await supabase
    .from('system_settings')
    .upsert({ key: 'risk_rules', value: body, updated_at: new Date().toISOString() })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, data: body })
}
