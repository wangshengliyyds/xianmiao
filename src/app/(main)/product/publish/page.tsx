'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, MapPin, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ImageUpload } from '@/components/product/image-upload'
import { BackHeader } from '@/components/common/back-header'
import { PRODUCT_CONDITIONS, TRADE_METHODS } from '@/lib/constants'
import { productPublishSchema } from '@/lib/validators'
import { useCreateProduct } from '@/lib/hooks/use-products'
import { useAuth } from '@/lib/hooks/use-auth'
import { toast } from 'sonner'
import type { ProductCondition, TradeMethod, Category } from '@/types'

export default function PublishPage() {
  const router = useRouter()
  const createProduct = useCreateProduct()
  const { user, loading: authLoading } = useAuth()

  // 权限检查：仅卖家/商家可发布
  const canPublish = user?.role === 'seller' || user?.role === 'merchant' || user?.role === 'admin'

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
  const [city, setCity] = useState('')
  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)
  const [locating, setLocating] = useState(false)

  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => setCategories(data.data || []))
      .catch(() => {})
  }, [])

  const handleLocate = () => {
    if (!navigator.geolocation) {
      toast.error('浏览器不支持定位')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setLat(pos.coords.latitude)
        setLng(pos.coords.longitude)
        // 反向地理编码获取城市名
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json&accept-language=zh-CN`
          )
          if (res.ok) {
            const data = await res.json()
            setCity(data.address?.city || data.address?.state || data.address?.county || '')
          }
        } catch {}
        setLocating(false)
        toast.success('定位成功')
      },
      () => {
        setLocating(false)
        toast.error('定位失败，请检查权限')
      }
    )
  }

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
      city: city || undefined,
      lat: lat ?? undefined,
      lng: lng ?? undefined,
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

    try {
      const result = await createProduct.mutateAsync({
        title,
        description: description || undefined,
        category_id: parseInt(categoryId),
        price: parseFloat(price),
        original_price: originalPrice ? parseFloat(originalPrice) : undefined,
        condition,
        trade_method: tradeMethod,
        images,
        city: city || undefined,
        lat: lat ?? undefined,
        lng: lng ?? undefined,
      })

      toast.success('发布成功')
      router.push(`/product/${result.data.id}`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '发布失败')
    }
  }

  if (authLoading) {
    return (
      <div>
        <BackHeader title="发布商品" />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (!canPublish) {
    return (
      <div>
        <BackHeader title="发布商品" />
        <div className="mx-auto max-w-md px-4 py-20 text-center">
          <Lock className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
          <h2 className="mb-2 text-lg font-semibold">需要卖家权限</h2>
          <p className="mb-6 text-sm text-muted-foreground">您当前是买家身份，发布商品需要先升级为卖家。请在个人中心申请成为卖家。</p>
          <Button onClick={() => router.push('/profile')}>前往个人中心</Button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <BackHeader title="发布商品" />

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
            placeholder="描述一下你的商品，包括新旧程度、使用情况等"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={2000}
            rows={4}
          />
          {errors.description && (
            <p className="mt-1 text-xs text-destructive">{errors.description}</p>
          )}
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
          {errors.category_id && (
            <p className="mt-1 text-xs text-destructive">{errors.category_id}</p>
          )}
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
            {errors.price && (
              <p className="mt-1 text-xs text-destructive">{errors.price}</p>
            )}
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
          <Label className="mb-2 block text-base font-medium">
            商品成色 <span className="text-destructive">*</span>
          </Label>
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
          <Label className="mb-2 block text-base font-medium">
            交易方式 <span className="text-destructive">*</span>
          </Label>
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

        {/* 位置 */}
        <div>
          <Label className="mb-2 block text-base font-medium">商品位置</Label>
          <div className="flex gap-2">
            <Input
              placeholder="所在城市"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="flex-1"
            />
            <Button type="button" variant="outline" onClick={handleLocate} disabled={locating}>
              <MapPin className="h-4 w-4 stroke-[2] mr-1" />
              {locating ? '定位中...' : '定位'}
            </Button>
          </div>
          {lat && lng && (
            <p className="mt-1 text-xs text-muted-foreground">已获取坐标</p>
          )}
        </div>

        {/* 提交按钮 */}
        <Button
          type="submit"
          size="lg"
          disabled={createProduct.isPending}
          className="w-full"
        >
          {createProduct.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              发布中...
            </>
          ) : (
            '发布商品'
          )}
        </Button>
      </form>
    </div>
  )
}
