import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const { id } = await params

    // 验证用户是否参与该会话
    const { data: membership } = await supabase
      .from('conversation_members')
      .select('conversation_id, unread_count')
      .eq('conversation_id', id)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json({ error: '会话不存在' }, { status: 404 })
    }

    // 获取会话详情
    const { data: conv, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !conv) {
      return NextResponse.json({ error: '会话不存在' }, { status: 404 })
    }

    // 获取最后一条消息
    const { data: lastMessage } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // 获取对方用户信息（私聊）
    let otherUser = null
    if (conv.type === 'private') {
      const { data: otherMember } = await supabase
        .from('conversation_members')
        .select('user_id')
        .eq('conversation_id', id)
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

    // 获取关联商品
    let product = null
    if (conv.product_id) {
      const { data: p } = await supabase
        .from('products')
        .select('id, title, price, images:product_images(url, is_cover)')
        .eq('id', conv.product_id)
        .single()
      product = p
    }

    return NextResponse.json({
      data: {
        ...conv,
        last_message: lastMessage || null,
        other_user: otherUser,
        product,
        unread_count: membership.unread_count,
      },
    })
  } catch (err) {
    console.error('[conversations/[id]] GET error:', err)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
