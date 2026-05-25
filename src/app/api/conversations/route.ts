import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 获取会话列表
export async function GET() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  try {
    // 获取用户参与的会话
    const { data: members, error: memberError } = await supabase
      .from('conversation_members')
      .select('conversation_id, unread_count')
      .eq('user_id', user.id)
      .order('joined_at', { ascending: false })

    if (memberError) {
      return NextResponse.json({ error: memberError.message }, { status: 500 })
    }

    if (!members || members.length === 0) {
      return NextResponse.json({ data: [] })
    }

    const conversationIds = members.map(m => m.conversation_id)

    // 获取会话详情
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select('*')
      .in('id', conversationIds)
      .order('last_message_at', { ascending: false, nullsFirst: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 获取每个会话的最后一条消息和其他用户信息
    const enrichedConversations = await Promise.all(
      (conversations || []).map(async (conv) => {
        // 获取最后一条消息
        const { data: lastMessage } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        // 获取对方用户信息（私聊）
        let otherUser = null
        if (conv.type === 'private') {
          const { data: otherMember } = await supabase
            .from('conversation_members')
            .select('user_id')
            .eq('conversation_id', conv.id)
            .neq('user_id', user.id)
            .single()

          if (otherMember) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('id, nickname, avatar_url')
              .eq('id', otherMember.user_id)
              .single()
            otherUser = profile
          }
        }

        const memberInfo = members.find(m => m.conversation_id === conv.id)

        return {
          ...conv,
          last_message: lastMessage,
          unread_count: memberInfo?.unread_count || 0,
          other_user: otherUser,
        }
      })
    )

    return NextResponse.json({ data: enrichedConversations })
  } catch {
    return NextResponse.json({ error: '操作失败' }, { status: 500 })
  }
}

// 创建会话
export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { target_user_id, product_id } = body

    if (!target_user_id) {
      return NextResponse.json({ error: '请指定对方用户' }, { status: 400 })
    }

    if (target_user_id === user.id) {
      return NextResponse.json({ error: '不能和自己聊天' }, { status: 400 })
    }

    // 检查是否已存在私聊会话（使用单次 join 查询避免 N+1）
    const { data: existingConv } = await supabase
      .from('conversation_members')
      .select('conversation_id, conversations!inner(type)')
      .eq('user_id', user.id)
      .eq('conversations.type', 'private')
      .in('conversation_id',
        (await supabase
          .from('conversation_members')
          .select('conversation_id')
          .eq('user_id', target_user_id)
        ).data?.map(m => m.conversation_id) || []
      )
      .maybeSingle()

    if (existingConv) {
      return NextResponse.json({
        data: { id: existingConv.conversation_id },
        existed: true,
      })
    }

    // 创建新会话
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .insert({ type: 'private' })
      .select()
      .single()

    if (convError) {
      return NextResponse.json({ error: convError.message }, { status: 500 })
    }

    // 添加成员（使用 upsert 防止并发创建导致重复）
    await supabase.from('conversation_members').upsert([
      { conversation_id: conversation.id, user_id: user.id },
      { conversation_id: conversation.id, user_id: target_user_id },
    ], { onConflict: 'conversation_id,user_id' })

    // 如果关联了商品，发送商品卡片消息
    if (product_id) {
      const { data: product } = await supabase
        .from('products')
        .select('id, title, price, images:product_images(url, is_cover)')
        .eq('id', product_id)
        .single()

      if (product) {
        await supabase.from('messages').insert({
          conversation_id: conversation.id,
          sender_id: user.id,
          type: 'product_card',
          content: product.title,
          metadata: {
            product_id: product.id,
            title: product.title,
            price: product.price,
            image: (product.images as { url: string; is_cover: boolean }[])?.find(i => i.is_cover)?.url,
          },
        })

        await supabase
          .from('conversations')
          .update({ last_message_at: new Date().toISOString() })
          .eq('id', conversation.id)
      }
    }

    return NextResponse.json({ data: conversation }, { status: 201 })
  } catch {
    return NextResponse.json({ error: '操作失败' }, { status: 500 })
  }
}
