import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getProductImages } from '@/lib/product-images'

// 开发环境专用：修复全平台已有商品的图片
export async function POST() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: '仅开发环境可用' }, { status: 403 })
  }

  const admin = createAdminClient()

  // 查询所有在售商品
  const { data: products, error } = await admin
    .from('products')
    .select('id, title')
    .eq('status', 'active')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!products || products.length === 0) {
    return NextResponse.json({ success: true, fixed: 0, message: '没有需要修复的商品' })
  }

  let fixed = 0
  const errors: string[] = []

  // 批量处理，每批 10 个商品
  const BATCH = 10
  for (let i = 0; i < products.length; i += BATCH) {
    const batch = products.slice(i, i + BATCH)

    for (const product of batch) {
      // 生成匹配图片
      const urls = getProductImages(product.title, 3, product.id.slice(0, 8))

      // 删除旧图片
      await admin.from('product_images').delete().eq('product_id', product.id)

      // 插入新匹配图片
      const imageInserts = urls.map((url, j) => ({
        product_id: product.id,
        url,
        sort_order: j,
        is_cover: j === 0,
      }))

      const { error: insertError } = await admin.from('product_images').insert(imageInserts)
      if (insertError) {
        errors.push(`${product.title}: ${insertError.message}`)
      } else {
        fixed++
      }
    }
  }

  return NextResponse.json({
    success: true,
    fixed,
    total: products.length,
    errors: errors.length > 0 ? errors : undefined,
  })
}
