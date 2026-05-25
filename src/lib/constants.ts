export const APP_NAME = '闲妙'
export const APP_DESCRIPTION = 'AI驱动的同城二手闲置交易平台'
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export const IS_ELECTRON = typeof window !== 'undefined' && (window as any).electronPlatform?.isElectron === true

export const PRODUCT_CONDITIONS = [
  { value: 'new', label: '全新' },
  { value: 'like_new', label: '几乎全新' },
  { value: 'good', label: '成色较好' },
  { value: 'fair', label: '有使用痕迹' },
  { value: 'poor', label: '明显瑕疵' },
] as const

export const TRADE_METHODS = [
  { value: 'offline', label: '仅自提' },
  { value: 'escrow', label: '仅担保' },
  { value: 'both', label: '均可' },
] as const

export const ORDER_STATUS: Record<string, string> = {
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

export const CREDIT_SCORE_DEFAULT = 100
export const AUTO_CONFIRM_DAYS = 7
export const MAX_IMAGES_PER_PRODUCT = 9
export const PRODUCT_EXPIRE_DAYS = 30
