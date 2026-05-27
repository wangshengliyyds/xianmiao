import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

/**
 * 发送邮件（Resend）
 * 如果未配置 RESEND_API_KEY 则静默跳过，不影响主流程
 */
export async function sendEmail(params: {
  to: string
  subject: string
  html: string
}) {
  if (!resend) return

  try {
    await resend.emails.send({
      from: '闲妙 <noreply@xianmiao.com>',
      to: params.to,
      subject: params.subject,
      html: params.html,
    })
  } catch (err) {
    console.error('[mail] 发送失败:', err)
  }
}

/** 转义 HTML 特殊字符，防止邮件模板注入 */
function escapeHtml(str: string) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;')
}

/** 订单状态邮件模板 */
export function orderStatusEmail(orderNo: string, status: string, link: string) {
  const safeOrderNo = escapeHtml(orderNo)
  const messages: Record<string, { subject: string; text: string }> = {
    paid: { subject: '订单已付款', text: `您的订单 ${safeOrderNo} 已付款成功，卖家将尽快发货。` },
    shipped: { subject: '订单已发货', text: `您的订单 ${safeOrderNo} 已发货，请注意查收快递。` },
    delivered: { subject: '订单已确认收货', text: `订单 ${safeOrderNo} 已确认收货。` },
    completed: { subject: '订单已完成', text: `订单 ${safeOrderNo} 已完成，感谢使用闲妙。` },
    cancelled: { subject: '订单已取消', text: `订单 ${safeOrderNo} 已取消。` },
    refunding: { subject: '退款申请已提交', text: `订单 ${safeOrderNo} 的退款申请已提交，等待卖家处理。` },
  }
  const msg = messages[status] || { subject: '订单状态更新', text: `订单 ${safeOrderNo} 状态已更新。` }
  const safeLink = escapeHtml(link)
  return {
    subject: `闲妙 - ${msg.subject}`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#111;font-size:18px">${msg.subject}</h2>
        <p style="color:#555;font-size:14px;line-height:1.6">${msg.text}</p>
        <a href="${safeLink}" style="display:inline-block;margin-top:16px;padding:10px 24px;background:#111;color:#fff;border-radius:8px;text-decoration:none;font-size:14px">查看订单</a>
      </div>
    `,
  }
}

/** 商家审批邮件模板 */
export function merchantApprovalEmail(shopName: string, approved: boolean, reason?: string) {
  const safeName = escapeHtml(shopName)
  const safeReason = reason ? escapeHtml(reason) : ''
  if (approved) {
    return {
      subject: '闲妙 - 商家入驻申请已通过',
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <h2 style="color:#111;font-size:18px">恭喜！商家入驻申请已通过</h2>
          <p style="color:#555;font-size:14px;line-height:1.6">您的店铺「${safeName}」已审核通过，现在可以开始上架商品了。</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/merchant" style="display:inline-block;margin-top:16px;padding:10px 24px;background:#111;color:#fff;border-radius:8px;text-decoration:none;font-size:14px">进入商家中心</a>
        </div>
      `,
    }
  }
  return {
    subject: '闲妙 - 商家入驻申请未通过',
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#111;font-size:18px">商家入驻申请未通过</h2>
        <p style="color:#555;font-size:14px;line-height:1.6">您的店铺「${safeName}」入驻申请未通过审核。${safeReason ? `原因：${safeReason}` : ''}</p>
        <p style="color:#555;font-size:14px;line-height:1.6">如有疑问请联系客服。</p>
      </div>
    `,
  }
}
