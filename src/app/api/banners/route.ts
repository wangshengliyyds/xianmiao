import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const supabase = process.env.NODE_ENV === 'development'
    ? createAdminClient()
    : await createClient()

  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('banners')
    .select('*')
    .eq('is_active', true)
    .or(`start_at.is.null,start_at.lte.${now}`)
    .or(`end_at.is.null,end_at.gte.${now}`)
    .order('sort_order', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}
