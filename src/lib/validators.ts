import { z } from 'zod'

export const phoneSchema = z.object({
  phone: z.string().regex(/^1[3-9]\d{9}$/, '请输入正确的手机号'),
})

export const smsVerifySchema = z.object({
  phone: z.string().regex(/^1[3-9]\d{9}$/),
  code: z.string().length(6, '验证码为6位数字'),
})

export const profileSchema = z.object({
  nickname: z.string().min(2, '昵称至少2个字符').max(20, '昵称最多20个字符'),
  avatar_url: z.string().url().optional(),
})

export const addressSchema = z.object({
  name: z.string().min(1, '请输入收件人'),
  phone: z.string().regex(/^1[3-9]\d{9}$/, '请输入正确的手机号'),
  province: z.string().min(1, '请选择省份'),
  city: z.string().min(1, '请选择城市'),
  district: z.string().min(1, '请选择区县'),
  detail: z.string().min(5, '请输入详细地址'),
  is_default: z.boolean().default(false),
})

export const productPublishSchema = z.object({
  title: z.string().min(2, '标题至少2个字符').max(50, '标题最多50个字符'),
  description: z.string().max(2000, '描述最多2000字符').optional(),
  category_id: z.number().min(1, '请选择分类'),
  price: z.number().min(0.01, '价格必须大于0'),
  original_price: z.number().min(0).optional(),
  condition: z.enum(['new', 'like_new', 'good', 'fair', 'poor']),
  trade_method: z.enum(['offline', 'escrow', 'both']),
  images: z.array(z.string().url()).min(1, '请至少上传1张图片').max(9, '最多上传9张图片'),
})

export const orderCreateSchema = z.object({
  product_id: z.string().uuid(),
  sku_id: z.string().uuid().optional(),
  quantity: z.number().min(1),
  trade_method: z.enum(['offline', 'escrow']),
  address_id: z.string().uuid().optional(),
  coupon_id: z.string().uuid().optional(),
  remark: z.string().max(200).optional(),
})

export const messageSchema = z.object({
  conversation_id: z.string().uuid(),
  type: z.enum(['text', 'image', 'voice', 'product_card', 'offer']),
  content: z.string().max(5000),
  metadata: z.record(z.unknown()).optional(),
})

export const ratingSchema = z.object({
  order_id: z.string().uuid(),
  score: z.number().min(1).max(5),
  content: z.string().max(500).optional(),
})

export const reportSchema = z.object({
  target_type: z.enum(['product', 'user', 'message']),
  target_id: z.string().uuid(),
  reason: z.enum(['fraud', 'prohibited', 'spam', 'inappropriate', 'other']),
  description: z.string().max(500).optional(),
})
