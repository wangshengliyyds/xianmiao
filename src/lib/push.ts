import webpush from 'web-push'

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || ''
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || ''
const vapidSubject = process.env.NEXT_PUBLIC_APP_URL || 'mailto:help@xianmiao.com'

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)
}

interface PushSubscription {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

/**
 * 发送 Web Push 推送通知
 */
export async function sendPush(subscription: PushSubscription, payload: {
  title: string
  body: string
  url?: string
  tag?: string
}) {
  if (!vapidPublicKey || !vapidPrivateKey) return

  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify(payload),
      { TTL: 60 * 60 } // 1小时过期
    )
  } catch (err: unknown) {
    // 410 = 订阅已过期，404 = 订阅不存在
    const statusCode = (err as { statusCode?: number })?.statusCode
    if (statusCode === 410 || statusCode === 404) {
      throw new Error('subscription_expired')
    }
    console.error('[push] 发送失败:', err)
  }
}

/**
 * 获取 VAPID 公钥（供客户端使用）
 */
export function getVapidPublicKey() {
  return vapidPublicKey
}
