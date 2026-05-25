import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/api-auth'

export async function GET(request: Request) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = Math.min(parseInt(searchParams.get('page_size') || '20') || 20, 100)
  const search = searchParams.get('search')
  const from = (page - 1) * pageSize

  let query = supabase
    .from('profiles')
    .select('id, nickname, avatar_url, phone, role, credit_score, is_banned, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (search) {
    const escaped = search.replace(/[%_\\]/g, '\\$&')
    query = query.or(`nickname.ilike.%${escaped}%,phone.ilike.%${escaped}%`)
  }

  const { data, error, count } = await query.range(from, from + pageSize - 1)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data, total: count || 0, page, page_size: pageSize })
}
