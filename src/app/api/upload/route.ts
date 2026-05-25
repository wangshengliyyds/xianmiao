import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: '请选择文件' }, { status: 400 })
    }

    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: '仅支持 JPG/PNG/WebP/GIF 格式' }, { status: 400 })
    }

    // 验证文件大小 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: '文件大小不能超过 5MB' }, { status: 400 })
    }

    // 生成文件路径 — 用 MIME 类型推导扩展名，防止客户端伪造
    const mimeToExt: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' }
    const ext = mimeToExt[file.type] || 'jpg'
    const fileName = `${user.id}/${Date.now()}.${ext}`

    // 上传到 Supabase Storage
    const { data, error } = await supabase.storage
      .from('products')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 获取公开 URL
    const { data: urlData } = supabase.storage
      .from('products')
      .getPublicUrl(data.path)

    return NextResponse.json({
      data: {
        url: urlData.publicUrl,
        path: data.path,
      },
    })
  } catch {
    return NextResponse.json({ error: '操作失败' }, { status: 500 })
  }
}
