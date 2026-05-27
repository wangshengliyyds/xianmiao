import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { orderCreateSchema } from '@/lib/validators'

// 获取订单列表
export async function GET(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const role = searchParams.get('role') || 'buyer' // buyer 或 seller
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = Math.min(parseInt(searchParams.get('page_size') || '20') || 20, 100)

  let query = supabase
    .from('orders')
    .select(`
      *,
      product:products(id, title, price, images:product_images(url, is_cover)),
      buyer:profiles!buyer_id(id, nickname, avatar_url),
      seller:profiles!seller_id(id, nickname, avatar_url)
    `, { count: 'exact' })

  // 根据角色筛选
  if (role === 'seller') {
    query = query.eq('seller_id', user.id)
  } else {
    query = query.eq('buyer_id', user.id)
  }

  // 状态筛选
  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  query = query.order('created_at', { ascending: false })

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await query.range(from, to)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    data: data || [],
    total: count || 0,
    page,
    page_size: pageSize,
    has_more: (count || 0) > to + 1,
  })
}

// 创建订单
export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '请求格式错误' }, { status: 400 })
  }

  // 验证输入
  const result = orderCreateSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.errors[0].message },
      { status: 400 }
    )
  }

  // 获取商品信息
  const { data: product } = await supabase
    .from('products')
    .select('*, seller_id')
    .eq('id', result.data.product_id)
    .eq('status', 'active')
    .single()

  if (!product) {
    return NextResponse.json({ error: '商品不存在或已下架' }, { status: 404 })
  }

  if (product.seller_id === user.id) {
    return NextResponse.json({ error: '不能购买自己的商品' }, { status: 400 })
  }

  // 生成订单号
  const orderNo = `XM${crypto.randomUUID().replace(/-/g, '').slice(0, 16).toUpperCase()}`
  const totalAmount = product.price * result.data.quantity

  // 读取运费设置
  let shippingFee = 0
  if (result.data.trade_method === 'escrow') {
    const { data: shippingSetting } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'shipping_fee')
      .single()
    shippingFee = Number(shippingSetting?.value) || 10
  }

  // 检查营销活动折扣
  let discountAmount = 0
  const { data: campaignSettings } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', 'campaigns')
    .single()

  interface Campaign {
    type: string
    enabled: boolean
    value?: number
    end_date?: string
    min_amount?: number
  }

  const campaigns: Campaign[] = (campaignSettings?.value as Campaign[]) || []
  const activeCampaigns = campaigns.filter((c) => c.enabled && new Date(c.end_date || '2099') > new Date())

  for (const campaign of activeCampaigns) {
    // Skip if order amount is below campaign minimum
    if (campaign.min_amount && totalAmount < campaign.min_amount) continue

    if (campaign.type === 'new_user_discount') {
      // 新用户首单优惠：检查是否是首单
      const { count } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('buyer_id', user.id)
        .neq('status', 'cancelled')

      if ((count || 0) === 0 && campaign.value) {
        discountAmount = Math.min(campaign.value, totalAmount)
      }
    } else if (campaign.type === 'promotion' && campaign.value) {
      // 满减活动
      discountAmount = Math.max(discountAmount, campaign.value)
    } else if (campaign.type === 'discount' && campaign.value) {
      // 百分比折扣：value 为折扣百分比，如 10 表示打九折
      const percentDiscount = Math.round(totalAmount * (campaign.value / 100) * 100) / 100
      discountAmount = Math.max(discountAmount, percentDiscount)
    } else if (campaign.type === 'coupon' && campaign.value) {
      // 通用优惠券活动：直接减免指定金额
      discountAmount = Math.max(discountAmount, Math.min(campaign.value, totalAmount))
    }
  }

  // 处理用户指定的优惠券（仅计算折扣，不立即标记使用）
  const couponId = result.data.coupon_id
  if (couponId) {
    const { data: coupon } = await supabase
      .from('user_coupons')
      .select('*')
      .eq('id', couponId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (coupon) {
      const couponDiscount = coupon.value || coupon.discount_value || 0
      if (coupon.coupon_type === 'percentage' || coupon.type === 'percentage') {
        const percentDiscount = Math.round(totalAmount * (couponDiscount / 100) * 100) / 100
        discountAmount = Math.max(discountAmount, percentDiscount)
      } else {
        discountAmount = Math.max(discountAmount, Math.min(couponDiscount, totalAmount))
      }
    }
  }

  // 读取平台提成比例
  let commissionRate = 5 // 默认 5%
  const { data: commissionSetting } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', 'app_settings')
    .maybeSingle()
  if (commissionSetting?.value && typeof commissionSetting.value === 'object' && 'commission_rate' in commissionSetting.value) {
    commissionRate = Number(commissionSetting.value.commission_rate) || 5
  }

  const payAmount = Math.max(0, totalAmount + shippingFee - discountAmount)
  const commission = Math.round(payAmount * commissionRate) / 100

  // 创建订单
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      order_no: orderNo,
      product_id: result.data.product_id,
      buyer_id: user.id,
      seller_id: product.seller_id,
      trade_method: result.data.trade_method,
      sku_id: result.data.sku_id,
      quantity: result.data.quantity,
      unit_price: product.price,
      total_amount: totalAmount,
      shipping_fee: shippingFee,
      pay_amount: payAmount,
      commission,
      discount_amount: discountAmount,
      coupon_id: couponId || null,
      status: 'pending_pay',
      remark: result.data.remark,
      auto_confirm_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select()
    .single()

  if (orderError) {
    return NextResponse.json({ error: orderError.message }, { status: 500 })
  }

  // 更新商品状态为 reserved（仅当仍是 active 时）
  const { data: reserved } = await supabase
    .from('products')
    .update({ status: 'reserved' })
    .eq('id', result.data.product_id)
    .eq('status', 'active')
    .select('id')
    .maybeSingle()
  if (!reserved) {
    // 商品已被其他人下单，回滚订单
    await supabase.from('orders').delete().eq('id', order.id)
    return NextResponse.json({ error: '商品已被其他人抢先下单' }, { status: 409 })
  }

  // 订单创建成功后标记优惠券为已使用
  if (couponId && discountAmount > 0) {
    await supabase
      .from('user_coupons')
      .update({ status: 'used', used_at: new Date().toISOString() })
      .eq('id', couponId)
      .eq('status', 'active')
  }

  return NextResponse.json({ data: order }, { status: 201 })
}
