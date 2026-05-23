export interface Order {
  id: string
  order_no: string
  product_id: string
  buyer_id: string
  seller_id: string
  trade_method: 'offline' | 'escrow'
  sku_id: string | null
  quantity: number
  unit_price: string
  total_amount: string
  shipping_fee: string
  coupon_id: string | null
  discount_amount: string
  pay_amount: string
  commission: string
  status: OrderStatus
  address_snapshot: Record<string, unknown> | null
  logistics_company: string | null
  logistics_no: string | null
  remark: string | null
  auto_confirm_at: string | null
  created_at: string
  updated_at: string
  // 关联
  product?: {
    id: string
    title: string
    price: string
    images?: { url: string; is_cover: boolean }[]
  }
  buyer?: { id: string; nickname: string; avatar_url: string | null }
  seller?: { id: string; nickname: string; avatar_url: string | null }
}

export type OrderStatus =
  | 'pending_pay'
  | 'paid'
  | 'shipped'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'refunding'
  | 'refunded'
  | 'disputed'

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending_pay: '待付款',
  paid: '已付款',
  shipped: '已发货',
  delivered: '已收货',
  completed: '已完成',
  cancelled: '已取消',
  refunding: '退款中',
  refunded: '已退款',
  disputed: '纠纷中',
}
