// 闲妙 Mock 数据层
// 当 Supabase 未配置时，所有 hooks 使用此数据

import type { Product, Category } from '@/types/product'
import type { Order } from '@/types/order'
import type { Conversation, Message, Notification } from '@/types/chat'

// --- 分类 ---
export const MOCK_CATEGORIES: Category[] = [
  { id: 1, name: '手机数码', icon_url: null, parent_id: null, sort_order: 1, ai_keywords: [], is_active: true },
  { id: 2, name: '电脑办公', icon_url: null, parent_id: null, sort_order: 2, ai_keywords: [], is_active: true },
  { id: 3, name: '家用电器', icon_url: null, parent_id: null, sort_order: 3, ai_keywords: [], is_active: true },
  { id: 4, name: '服饰鞋包', icon_url: null, parent_id: null, sort_order: 4, ai_keywords: [], is_active: true },
  { id: 5, name: '美妆个护', icon_url: null, parent_id: null, sort_order: 5, ai_keywords: [], is_active: true },
  { id: 6, name: '图书文具', icon_url: null, parent_id: null, sort_order: 6, ai_keywords: [], is_active: true },
  { id: 7, name: '运动户外', icon_url: null, parent_id: null, sort_order: 7, ai_keywords: [], is_active: true },
  { id: 8, name: '母婴玩具', icon_url: null, parent_id: null, sort_order: 8, ai_keywords: [], is_active: true },
  { id: 9, name: '家居家装', icon_url: null, parent_id: null, sort_order: 9, ai_keywords: [], is_active: true },
  { id: 10, name: '其他', icon_url: null, parent_id: null, sort_order: 10, ai_keywords: [], is_active: true },
]

// --- 商品 ---
const MOCK_SELLER = { id: 'mock-seller-1', nickname: '闲妙用户', avatar_url: null }

const MOCK_IMAGES = [
  { id: 'img-1', product_id: '', url: 'https://picsum.photos/seed/xm1/400/400', sort_order: 0, ai_tags: [], is_cover: true, hash: null, created_at: '' },
  { id: 'img-2', product_id: '', url: 'https://picsum.photos/seed/xm2/400/400', sort_order: 1, ai_tags: [], is_cover: false, hash: null, created_at: '' },
]

export const MOCK_PRODUCTS: Product[] = Array.from({ length: 12 }, (_, i) => ({
  id: `mock-product-${i + 1}`,
  title: [
    '九成新 iPhone 15 Pro 256GB 白色',
    'MacBook Air M3 几乎全新 送保护壳',
    '索尼 WH-1000XM5 降噪耳机',
    '耐克 Air Max 90 42码 仅试穿',
    '戴森 V12 吸尘器 保修期内',
    'Nintendo Switch OLED 动物森友会限定',
    'iPad Pro 11寸 M2芯片 带Apple Pencil',
    '小米手环8 NFC版 全新未拆封',
    '乐高 哈利波特 霍格沃茨城堡',
    'MUJI 无印良品 懒人沙发',
    '佳能 EOS R6 Mark II 微单相机',
    'AirPods Pro 2 USB-C版',
  ][i],
  description: '物品成色良好，功能完全正常。同城交易优先，可小刀。非诚勿扰，谢谢！',
  price: String([4999, 7200, 1580, 399, 2100, 1899, 4500, 199, 2800, 650, 12800, 1299][i]),
  original_price: String([8999, 10999, 2999, 899, 4499, 2599, 6799, 299, 3999, 1299, 18999, 1899][i]),
  condition: ['like_new', 'like_new', 'good', 'like_new', 'good', 'new', 'good', 'new', 'new', 'good', 'good', 'like_new'][i] as Product['condition'],
  category_id: [1, 2, 1, 4, 3, 1, 2, 1, 8, 9, 2, 1][i],
  seller_id: 'mock-seller-1',
  trade_method: ['both', 'escrow', 'offline', 'both', 'escrow', 'both', 'escrow', 'offline', 'both', 'offline', 'escrow', 'both'][i] as Product['trade_method'],
  status: 'active',
  city_id: null,
  lat: null,
  lng: null,
  view_count: Math.floor(Math.random() * 500) + 50,
  fav_count: Math.floor(Math.random() * 50) + 5,
  is_merchant: false,
  ai_generated: false,
  expires_at: null,
  created_at: new Date(Date.now() - i * 3600000).toISOString(),
  updated_at: new Date(Date.now() - i * 3600000).toISOString(),
  images: MOCK_IMAGES.map((img, j) => ({ ...img, product_id: `mock-product-${i + 1}`, url: `https://picsum.photos/seed/xm${i * 2 + j + 1}/400/400` })),
  seller: MOCK_SELLER,
})) as Product[]

// --- 收藏 ---
export const MOCK_FAVORITE_IDS: string[] = ['mock-product-1', 'mock-product-3', 'mock-product-5']

// --- 订单 ---
export const MOCK_ORDERS: Order[] = [
  {
    id: 'mock-order-1',
    order_no: 'XM20260523ABC123',
    product_id: 'mock-product-2',
    buyer_id: 'mock-user-1',
    seller_id: 'mock-seller-1',
    trade_method: 'escrow',
    sku_id: null,
    quantity: 1,
    unit_price: '7200',
    total_amount: '7200',
    shipping_fee: '0',
    coupon_id: null,
    discount_amount: '0',
    pay_amount: '7200',
    commission: '72',
    status: 'completed',
    address_snapshot: null,
    logistics_company: null,
    logistics_no: null,
    remark: null,
    auto_confirm_at: new Date(Date.now() + 4 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    product: { id: 'mock-product-2', title: MOCK_PRODUCTS[1].title, price: MOCK_PRODUCTS[1].price, images: [{ url: MOCK_IMAGES[0].url, is_cover: true }] },
    buyer: { id: 'mock-user-1', nickname: '我自己', avatar_url: null },
    seller: MOCK_SELLER,
  },
  {
    id: 'mock-order-2',
    order_no: 'XM20260522DEF456',
    product_id: 'mock-product-4',
    buyer_id: 'mock-user-1',
    seller_id: 'mock-seller-2',
    trade_method: 'offline',
    sku_id: null,
    quantity: 1,
    unit_price: '399',
    total_amount: '399',
    shipping_fee: '0',
    coupon_id: null,
    discount_amount: '0',
    pay_amount: '399',
    commission: '4',
    status: 'pending_pay',
    address_snapshot: null,
    logistics_company: null,
    logistics_no: null,
    remark: '请尽快发货',
    auto_confirm_at: null,
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    product: { id: 'mock-product-4', title: MOCK_PRODUCTS[3].title, price: MOCK_PRODUCTS[3].price, images: [{ url: MOCK_IMAGES[0].url, is_cover: true }] },
    buyer: { id: 'mock-user-1', nickname: '我自己', avatar_url: null },
    seller: { id: 'mock-seller-2', nickname: '球鞋达人', avatar_url: null },
  },
] as Order[]

// --- 聊天 ---
export const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: 'mock-conv-1',
    type: 'private',
    title: null,
    avatar_url: null,
    last_message_at: new Date(Date.now() - 3600000).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    unread_count: 2,
    last_message: {
      id: 'mock-msg-3',
      type: 'text',
      content: '好的，那就明天下午3点地铁站见！',
      sender_id: 'mock-seller-1',
      created_at: new Date(Date.now() - 3600000).toISOString(),
      sender: { nickname: '闲妙用户', avatar_url: null },
    },
  },
  {
    id: 'mock-conv-2',
    type: 'private',
    title: null,
    avatar_url: null,
    last_message_at: new Date(Date.now() - 7200000).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    unread_count: 0,
    last_message: {
      id: 'mock-msg-6',
      type: 'text',
      content: '收到，谢谢！',
      sender_id: 'mock-user-1',
      created_at: new Date(Date.now() - 7200000).toISOString(),
      sender: { nickname: '我自己', avatar_url: null },
    },
  },
] as Conversation[]

export const MOCK_MESSAGES: Message[] = [
  { id: 'mock-msg-1', conversation_id: 'mock-conv-1', sender_id: 'mock-user-1', type: 'text', content: '你好，请问这个还能便宜点吗？', metadata: null, is_withdrawn: false, created_at: new Date(Date.now() - 86400000).toISOString(), sender: { nickname: '我自己', avatar_url: null } },
  { id: 'mock-msg-2', conversation_id: 'mock-conv-1', sender_id: 'mock-seller-1', type: 'text', content: '可以小刀，你出个价？', metadata: null, is_withdrawn: false, created_at: new Date(Date.now() - 82800000).toISOString(), sender: { nickname: '闲妙用户', avatar_url: null } },
  { id: 'mock-msg-3', conversation_id: 'mock-conv-1', sender_id: 'mock-user-1', type: 'text', content: '4500可以吗？当面交易', metadata: null, is_withdrawn: false, created_at: new Date(Date.now() - 79200000).toISOString(), sender: { nickname: '我自己', avatar_url: null } },
  { id: 'mock-msg-4', conversation_id: 'mock-conv-1', sender_id: 'mock-seller-1', type: 'text', content: '好的，那就明天下午3点地铁站见！', metadata: null, is_withdrawn: false, created_at: new Date(Date.now() - 3600000).toISOString(), sender: { nickname: '闲妙用户', avatar_url: null } },
] as Message[]

// --- 通知 ---
export const MOCK_NOTIFICATIONS: Notification[] = [
  { id: 'mock-noti-1', user_id: 'mock-user-1', type: 'order', title: '订单已完成', body: '您的订单 XM20260523ABC123 已完成，感谢使用闲妙！', is_read: false, data: null, created_at: new Date(Date.now() - 3600000).toISOString() },
  { id: 'mock-noti-2', user_id: 'mock-user-1', type: 'system', title: '欢迎来到闲妙', body: '闲妙是一个AI驱动的二手闲置交易平台，祝你交易愉快！', is_read: false, data: null, created_at: new Date(Date.now() - 86400000).toISOString() },
  { id: 'mock-noti-3', user_id: 'mock-user-1', type: 'promotion', title: '收藏商品降价', body: '你收藏的「索尼耳机」已降价200元', is_read: true, data: null, created_at: new Date(Date.now() - 172800000).toISOString() },
] as Notification[]

// --- 地址 ---
export const MOCK_ADDRESSES = [
  {
    id: 'mock-addr-1',
    user_id: 'mock-user-1',
    name: '张三',
    phone: '13800138000',
    province: '北京市',
    city: '北京市',
    district: '朝阳区',
    detail: '建国路88号SOHO现代城A座1203',
    is_default: true,
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
  },
]

// --- 统计 ---
export const MOCK_ADMIN_STATS = {
  totalUsers: 1256,
  totalProducts: 5893,
  totalOrders: 3421,
  totalMerchants: 89,
  todayNewUsers: 23,
  todayNewOrders: 47,
  totalRevenue: 289650,
}

export const MOCK_MERCHANT_STATS = {
  pending_pay: 3,
  paid: 5,
  shipped: 8,
  completed: 42,
  cancelled: 2,
  totalRevenue: 56800,
}
