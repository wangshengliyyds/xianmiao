import { NextResponse } from 'next/server'
import { getVapidPublicKey } from '@/lib/push'

// 获取 VAPID 公钥（客户端订阅时需要）
export async function GET() {
  const key = getVapidPublicKey()
  if (!key) {
    return NextResponse.json({ error: '推送通知未配置' }, { status: 501 })
  }
  return NextResponse.json({ publicKey: key })
}
