import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { messageSchema } from '@/lib/validators'
import { sendNotification } from '@/lib/notifications'

// 获取消息列表
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id } = await params

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  try {
    // 验证用户是否是会话成员
    const { data: member } = await supabase
      .from('conversation_members')
      .select('user_id')
      .eq('conversation_id', id)
      .eq('user_id', user.id)
      .single()

    if (!member) {
      return NextResponse.json({ error: '无权访问' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const before = searchParams.get('before') // 用于分页，传最后一条消息的 created_at
    const limit = parseInt(searchParams.get('limit') || '50')

    let query = supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!sender_id(id, nickname, avatar_url)
      `)
      .eq('conversation_id', id)
      .eq('is_withdrawn', false)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (before) {
      query = query.lt('created_at', before)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 标记消息为已读
    if (data && data.length > 0) {
      const messageIds = data.map(m => m.id)
      const readRecords = messageIds.map(messageId => ({
        message_id: messageId,
        user_id: user.id,
      }))

      await supabase
        .from('message_reads')
        .upsert(readRecords, { onConflict: 'message_id,user_id' })

      // 清零未读计数
      await supabase
        .from('conversation_members')
        .update({ unread_count: 0 })
        .eq('conversation_id', id)
        .eq('user_id', user.id)
    }

    return NextResponse.json({
      data: (data || []).reverse(), // 反转，最新的在最后
      has_more: data?.length === limit,
    })
  } catch {
    return NextResponse.json({ error: '操作失败' }, { status: 500 })
  }
}

// 发送消息
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id } = await params

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  try {
    // 验证用户是否是会话成员
    const { data: member } = await supabase
      .from('conversation_members')
      .select('user_id')
      .eq('conversation_id', id)
      .eq('user_id', user.id)
      .single()

    if (!member) {
      return NextResponse.json({ error: '无权发送' }, { status: 403 })
    }

    const body = await request.json()

    // 验证输入
    const result = messageSchema.safeParse({
      ...body,
      conversation_id: id,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      )
    }

    // 创建消息
    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: id,
        sender_id: user.id,
        type: result.data.type,
        content: result.data.content,
        metadata: result.data.metadata,
      })
      .select(`
        *,
        sender:profiles!sender_id(id, nickname, avatar_url)
      `)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 更新会话的最后消息时间
    await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', id)

    // 增加对方的未读计数
    const { data: otherMembers } = await supabase
      .from('conversation_members')
      .select('user_id, unread_count')
      .eq('conversation_id', id)
      .neq('user_id', user.id)

    if (otherMembers) {
      for (const m of otherMembers) {
        try {
          await supabase
            .from('conversation_members')
            .update({ unread_count: (m.unread_count || 0) + 1 })
            .eq('conversation_id', id)
            .eq('user_id', m.user_id)
        } catch {
          // 未读计数更新失败不影响消息发送
        }

        // 生成消息通知（检查用户偏好）
        await sendNotification(supabase, {
          user_id: m.user_id,
          type: 'chat',
          title: '新消息',
          content: result.data.type === 'text'
            ? (result.data.content || '').slice(0, 50)
            : result.data.type === 'image' ? '[图片]' : '[消息]',
          link: `/chat/${id}`,
        })
      }
    }

    return NextResponse.json({ data: message }, { status: 201 })
  } catch {
    return NextResponse.json({ error: '操作失败' }, { status: 500 })
  }
}
