'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Loader2, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ImageUpload } from '@/components/product/image-upload'
import { BackHeader } from '@/components/common/back-header'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { useAuth } from '@/lib/hooks/use-auth'
import { PRODUCT_CONDITIONS, TRADE_METHODS } from '@/lib/constants'
import { productPublishSchema } from '@/lib/validators'
import { toast } from 'sonner'
import type { ProductCondition, TradeMethod, Category, ProductWithImages } from '@/types'

export default function EditProductPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState<string>('')
  const [price, setPrice] = useState('')
  const [originalPrice, setOriginalPrice] = useState('')
  const [condition, setCondition] = useState<ProductCondition>('good')
  const [tradeMethod, setTradeMethod] = useState<TradeMethod>('both')
  const [images, setImages] = useState<string[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productRes, catRes] = await Promise.all([
          fetch(`/api/products/${params.id}`),
          fetch('/api/categories'),
        ])

        if (catRes.ok) {
          const catData = await catRes.json()
          setCategories(catData.data || [])
        }

        if (productRes.ok) {
          const { data } = await productRes.json()
          const product = data as ProductWithImages

          // 验证所有权：仅商品所有者和管理员可编辑
          if (user && product.seller_id !== user.id && user.role !== 'admin') {
            toast.error('无权编辑该商品')
            router.back()
            return
          }

          setTitle(product.title)
          setDescription(product.description || '')
          setCategoryId(product.category_id?.toString() || '')
          setPrice(product.price.toString())
          setOriginalPrice(product.original_price?.toString() || '')
          setCondition(product.condition as ProductCondition)
          setTradeMethod(product.trade_method as TradeMethod)
          setImages((product.images || []).sort((a, b) => a.sort_order - b.sort_order).map((img) => img.url))
        } else {
          toast.error('商品不存在')
          router.back()
        }
      } catch {
        toast.error('加载失败')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [params.id, router])

  const validate = () => {
    const result = productPublishSchema.safeParse({
      title,
      description: description || undefined,
      category_id: parseInt(categoryId),
      price: parseFloat(price),
      original_price: originalPrice ? parseFloat(originalPrice) : undefined,
      condition,
      trade_method: tradeMethod,
      images,
    })

    if (!result.success) {
      const newErrors: Record<string, string> = {}
      result.error.errors.forEach((err: { path: (string | number)[]; message: string }) => {
        const field = err.path[0] as string
        newErrors[field] = err.message
      })
      setErrors(newErrors)
      return false
    }

    setErrors({})
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) {
      toast.error('请检查表单信息')
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/products/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: description || undefined,
          category_id: parseInt(categoryId),
          price: parseFloat(price),
          original_price: originalPrice ? parseFloat(originalPrice) : undefined,
          condition,
          trade_method: tradeMethod,
          images,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || '更新失败')
      }

      toast.success('更新成功')
      router.push(`/product/${params.id}`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '更新失败')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <LoadingSpinner text="加载中..." />
  }

  return (
    <div>
      <BackHeader title="编辑商品" />

      <form onSubmit={handleSubmit} className="mx-auto max-w-2xl px-4 py-6 space-y-6">
        {/* 图片上传 */}
        <div>
          <Label className="mb-2 block text-base font-medium">
            商品图片 <span className="text-destructive">*</span>
          </Label>
          <ImageUpload value={images} onChange={setImages} max={9} />
          {errors.images && (
            <p className="mt-1 text-xs text-destructive">{errors.images}</p>
          )}
        </div>

        {/* 标题 */}
        <div>
          <Label htmlFor="title" className="mb-2 block text-base font-medium">
            标题 <span className="text-destructive">*</span>
          </Label>
          <Input
            id="title"
            placeholder="请输入商品标题"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={50}
          />
          {errors.title && (
            <p className="mt-1 text-xs text-destructive">{errors.title}</p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">{title.length}/50</p>
        </div>

        {/* 描述 */}
        <div>
          <Label htmlFor="description" className="mb-2 block text-base font-medium">
            商品描述
          </Label>
          <Textarea
            id="description"
            placeholder="描述一下你的商品"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={2000}
            rows={4}
          />
        </div>

        {/* 分类 */}
        <div>
          <Label className="mb-2 block text-base font-medium">
            分类 <span className="text-destructive">*</span>
          </Label>
          <Select value={categoryId} onValueChange={(v) => setCategoryId(v || '')}>
            <SelectTrigger>
              <SelectValue placeholder="请选择分类" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id.toString()}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 价格 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="price" className="mb-2 block text-base font-medium">
              售价 <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">¥</span>
              <Input
                id="price"
                type="number"
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                min="0.01"
                step="0.01"
                className="pl-7"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="originalPrice" className="mb-2 block text-base font-medium">
              原价
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">¥</span>
              <Input
                id="originalPrice"
                type="number"
                placeholder="0.00"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                min="0"
                step="0.01"
                className="pl-7"
              />
            </div>
          </div>
        </div>

        {/* 成色 */}
        <div>
          <Label className="mb-2 block text-base font-medium">商品成色</Label>
          <div className="flex flex-wrap gap-2">
            {PRODUCT_CONDITIONS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setCondition(c.value as ProductCondition)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  condition === c.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* 交易方式 */}
        <div>
          <Label className="mb-2 block text-base font-medium">交易方式</Label>
          <div className="flex flex-wrap gap-2">
            {TRADE_METHODS.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setTradeMethod(t.value as TradeMethod)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  tradeMethod === t.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <Button type="submit" size="lg" disabled={saving} className="w-full">
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              保存中...
            </>
          ) : (
            '保存修改'
          )}
        </Button>
      </form>
    </div>
  )
}
