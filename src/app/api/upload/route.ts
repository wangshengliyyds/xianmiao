import { NextResponse } from 'next/server'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: '请选择文件' }, { status: 400 })
    }

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: '仅支持图片文件' }, { status: 400 })
    }

    // 验证大小
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: '文件不能超过10MB' }, { status: 400 })
    }

    // Supabase 未配置时返回 mock 图片 URL
    if (!isSupabaseConfigured()) {
      // 将文件转为 base64 data URL 供前端预览
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const base64 = buffer.toString('base64')
      const dataUrl = `data:${file.type};base64,${base64}`
      console.log(`[DEV] 文件上传（Mock模式）: ${file.name} (${(file.size / 1024).toFixed(1)}KB)`)
      return NextResponse.json({ url: dataUrl, path: `dev/${file.name}` })
    }

    const supabase = await createClient()

    // 验证登录
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    // 生成唯一文件名
    const ext = file.type.split('/')[1] || 'webp'
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

    // 上传到 Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('products')
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: '上传失败' }, { status: 500 })
    }

    // 获取公开 URL
    const { data: { publicUrl } } = supabase.storage
      .from('products')
      .getPublicUrl(fileName)

    return NextResponse.json({ url: publicUrl, path: fileName })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
