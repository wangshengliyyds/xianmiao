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

export type PaymentChannel = 'alipay' | 'wechat'
export type PaymentStatus = 'pending' | 'success' | 'failed' | 'refunded'

export interface Order {
  id: string
  order_no: string
  product_id: string
  buyer_id: string
  seller_id: string
  trade_method: 'offline' | 'escrow'
  sku_id: string | null
  quantity: number
  unit_price: number
  total_amount: number
  shipping_fee: number
  coupon_id: string | null
  discount_amount: number
  pay_amount: number
  commission: number
  status: OrderStatus
  address_snapshot: Record<string, unknown> | null
  logistics_company: string | null
  logistics_no: string | null
  remark: string | null
  auto_confirm_at: string | null
  created_at: string
  updated_at: string
}

export interface OrderStatusLog {
  id: number
  order_id: string
  from_status: string | null
  to_status: string
  operator_id: string | null
  remark: string | null
  created_at: string
}

export interface Payment {
  id: string
  order_id: string
  payment_no: string | null
  channel: PaymentChannel
  amount: number
  status: PaymentStatus
  paid_at: string | null
  callback_data: Record<string, unknown> | null
  created_at: string
}

export interface Refund {
  id: string
  order_id: string
  payment_id: string | null
  amount: number
  reason: string | null
  status: 'pending' | 'approved' | 'rejected' | 'processing' | 'done'
  evidence_images: string[] | null
  processed_by: string | null
  created_at: string
  completed_at: string | null
}

export interface Dispute {
  id: string
  order_id: string
  reporter_id: string
  type: 'quality' | 'not_received' | 'not_as_described' | 'fraud'
  description: string | null
  evidence: string[] | null
  status: 'open' | 'investigating' | 'resolved' | 'closed'
  resolution: string | null
  resolved_by: string | null
  created_at: string
}

export interface OrderWithDetails extends Order {
  product?: {
    id: string
    title: string
    price: number
    images: { url: string; is_cover: boolean }[]
  }
  buyer?: {
    id: string
    nickname: string
    avatar_url: string | null
  }
  seller?: {
    id: string
    nickname: string
    avatar_url: string | null
  }
}
