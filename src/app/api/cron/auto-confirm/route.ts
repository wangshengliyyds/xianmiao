import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// 自动确认收货定时任务
// 调用方式: GET /api/cron/auto-confirm?secret=YOUR_CRON_SECRET
// 建议每天执行 1-2 次（如 crontab: 0 */12 * * *）
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')

  // 校验密钥，防止未授权调用
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const now = new Date().toISOString()

  try {
    // 查找所有已发货且超过自动确认时间的订单
    const { data: orders, error } = await supabase
      .from('orders')
      .select('id, product_id, buyer_id, seller_id')
      .eq('status', 'shipped')
      .lte('auto_confirm_at', now)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!orders || orders.length === 0) {
      return NextResponse.json({ message: '没有需要自动确认的订单', count: 0 })
    }

    let successCount = 0
    const errors: string[] = []

    for (const order of orders) {
      try {
        // 1. 更新订单状态：shipped → delivered
        const { error: updateError } = await supabase
          .from('orders')
          .update({ status: 'delivered' })
          .eq('id', order.id)
          .eq('status', 'shipped')

        if (updateError) {
          errors.push(`订单 ${order.id}: ${updateError.message}`)
          continue
        }

        // 2. 直接标记为 completed（自动确认相当于买家确认+完成）
        await supabase
          .from('orders')
          .update({ status: 'completed' })
          .eq('id', order.id)
          .eq('status', 'delivered')

        // 3. 更新商品状态为 sold
        if (order.product_id) {
          await supabase
            .from('products')
            .update({ status: 'sold' })
            .eq('id', order.product_id)
        }

        // 4. 记录状态日志
        await supabase.from('order_status_logs').insert([
          {
            order_id: order.id,
            from_status: 'shipped',
            to_status: 'delivered',
            operator_id: null,
            remark: '系统自动确认收货（超时）',
          },
          {
            order_id: order.id,
            from_status: 'delivered',
            to_status: 'completed',
            operator_id: null,
            remark: '系统自动完成',
          },
        ])

        // 5. 通知买卖双方
        await supabase.from('notifications').insert([
          {
            user_id: order.buyer_id,
            type: 'order',
            title: '订单已自动确认收货',
            content: '您的订单已超过确认收货期限，系统已自动确认。',
            link: `/order/${order.id}`,
          },
          {
            user_id: order.seller_id,
            type: 'order',
            title: '订单已完成',
            content: '买家的订单已自动确认收货，交易完成。',
            link: `/order/${order.id}`,
          },
        ])

        successCount++
      } catch (err) {
        errors.push(`订单 ${order.id}: 处理异常`)
      }
    }

    return NextResponse.json({
      message: `处理完成：成功 ${successCount}/${orders.length}`,
      count: successCount,
      total: orders.length,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (err) {
    console.error('[cron/auto-confirm] error:', err)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
