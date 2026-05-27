import type { SupabaseClient } from '@supabase/supabase-js'
import { sendPush } from '@/lib/push'

// 通知类型 → 偏好设置 key 的映射
const TYPE_TO_SETTING: Record<string, string> = {
  order: 'order',
  chat: 'message',
  trade: 'trade',
  system: 'system',
  promotion: 'promotion',
}

/**
 * 根据用户通知偏好发送通知
 * 如果用户关闭了某类通知，则跳过不发
 * 同时尝试发送 Web Push 推送
 */
export async function sendNotification(
  supabase: SupabaseClient,
  params: {
    user_id: string
    type: string
    title: string
    content: string
    link?: string
  }
) {
  const settingKey = TYPE_TO_SETTING[params.type]

  // 如果有对应的偏好设置，检查用户是否开启了
  if (settingKey) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('notification_settings')
      .eq('id', params.user_id)
      .single()

    const settings = profile?.notification_settings as Record<string, boolean> | null
    if (settings && settings[settingKey] === false) {
      return // 用户关闭了此类通知，不发送
    }
  }

  // 写入数据库通知
  const { error: insertError } = await supabase.from('notifications').insert({
    user_id: params.user_id,
    type: params.type,
    title: params.title,
    content: params.content,
    link: params.link,
  })
  if (insertError) {
    console.error('[notifications] 插入失败:', insertError)
  }

  // 发送 Web Push（不阻塞主流程）
  sendPushToUser(supabase, params.user_id, {
    title: params.title,
    body: params.content,
    url: params.link,
    tag: params.type,
  }).catch(() => {})
}

/**
 * 向用户发送 Web Push 推送通知
 */
async function sendPushToUser(
  supabase: SupabaseClient,
  userId: string,
  payload: { title: string; body: string; url?: string; tag?: string }
) {
  const { data: sub } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('user_id', userId)
    .single()

  if (!sub) return

  try {
    await sendPush(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      payload
    )
  } catch (err: unknown) {
    if ((err as Error)?.message === 'subscription_expired') {
      // 订阅已过期，删除
      await supabase.from('push_subscriptions').delete().eq('user_id', userId)
    }
  }
}
