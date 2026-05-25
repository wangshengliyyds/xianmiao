import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ chat_unread: 0, notification_unread: 0 })
  }

  try {
    // 会话未读总数
    const { data: members } = await supabase
      .from('conversation_members')
      .select('unread_count')
      .eq('user_id', user.id)

    const chatUnread = (members || []).reduce((sum, m) => sum + (m.unread_count || 0), 0)

    // 通知未读数
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false)

    return NextResponse.json({
      chat_unread: chatUnread,
      notification_unread: count || 0,
    })
  } catch {
    return NextResponse.json({ chat_unread: 0, notification_unread: 0 })
  }
}
