'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { useCategories } from '@/lib/hooks/use-products'
import { useAiAnalyze, useAiEstimate } from '@/lib/hooks/use-ai'
import type { AiAnalysisResult } from '@/lib/hooks/use-ai'
import { ImageUpload } from '@/components/common/image-upload'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import {
  Loader2, ChevronLeft, Check, Sparkles, Wand2,
} from 'lucide-react'
import { CONDITION_LABELS } from '@/types/product'
import { cn } from '@/lib/utils'

type Step = 'images' | 'info' | 'price' | 'confirm'

const STEPS: { key: Step; label: string }[] = [
  { key: 'images', label: '上传图片' },
  { key: 'info', label: '商品信息' },
  { key: 'price', label: '价格方式' },
  { key: 'confirm', label: '确认发布' },
]

export default function PublishPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { data: categories } = useCategories()
  const aiAnalyze = useAiAnalyze()
  const aiEstimate = useAiEstimate()

  const [currentStep, setCurrentStep] = useState(0)
  const [publishing, setPublishing] = useState(false)
  const [aiResult, setAiResult] = useState<AiAnalysisResult | null>(null)
  const [showAiPanel, setShowAiPanel] = useState(false)

  const [form, setForm] = useState({
    images: [] as string[],
    title: '',
    description: '',
    category_id: 0,
    condition: 'good' as string,
    price: '',
    original_price: '',
    trade_method: 'both' as string,
  })

  const updateForm = (field: string, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const canNext = () => {
    switch (STEPS[currentStep].key) {
      case 'images':
        return form.images.length > 0
      case 'info':
        return form.title.length >= 2 && form.category_id > 0
      case 'price':
        return parseFloat(form.price) > 0
      default:
        return true
    }
  }

  // AI 分析图片
  const handleAiAnalyze = () => {
    if (form.images.length === 0) {
      toast.error('请先上传图片')
      return
    }

    aiAnalyze.mutate(form.images[0], {
      onSuccess: (data) => {
        setAiResult(data)
        setShowAiPanel(true)

        // 自动填充
        if (data.title_suggestion && !form.title) {
          updateForm('title', data.title_suggestion)
        }
        if (data.description_suggestion && !form.description) {
          updateForm('description', data.description_suggestion)
        }
        if (data.condition_guess) {
          updateForm('condition', data.condition_guess)
        }
        if (data.suggested_price && !form.price) {
          updateForm('price', String(data.suggested_price))
        }

        // 尝试匹配分类
        if (data.category_guess && categories) {
          const matched = categories.find(
            (c) => data.category_guess?.includes(c.name) || c.name.includes(data.category_guess || '')
          )
          if (matched && !form.category_id) {
            updateForm('category_id', matched.id)
          }
        }

        toast.success('AI分析完成，已自动填充信息')
      },
      onError: () => toast.error('AI分析失败'),
    })
  }

  // AI 估价
  const handleAiEstimate = () => {
    if (!form.title) {
      toast.error('请先填写商品标题')
      return
    }

    const categoryName = categories?.find((c) => c.id === form.category_id)?.name

    aiEstimate.mutate(
      {
        title: form.title,
        category: categoryName,
        condition: form.condition,
        originalPrice: form.original_price ? parseFloat(form.original_price) : undefined,
      },
      {
        onSuccess: (data) => {
          updateForm('price', String(data.suggested_price))
          toast.success(`AI建议售价 ¥${data.suggested_price}（${data.reason}）`)
        },
        onError: () => toast.error('估价失败'),
      }
    )
  }

  const handlePublish = async () => {
    if (!user) {
      toast.error('请先登录')
      router.push('/login?redirect=/product/publish')
      return
    }

    setPublishing(true)
    try {
      // Mock 模式：直接成功
      if (!isSupabaseConfigured()) {
        toast.success('发布成功！（开发模式）')
        router.push('/')
        return
      }

      const supabase = createClient()

      const { data: product, error } = await supabase
        .from('products')
        .insert({
          seller_id: user.id,
          title: form.title,
          description: form.description || null,
          category_id: form.category_id,
          condition: form.condition,
          price: parseFloat(form.price),
          original_price: form.original_price ? parseFloat(form.original_price) : null,
          trade_method: form.trade_method,
          status: 'active',
          ai_generated: !!aiResult,
        })
        .select()
        .single()

      if (error || !product) {
        toast.error('发布失败')
        return
      }

      // 保存图片
      if (form.images.length > 0) {
        const imageRecords = form.images.map((url, index) => ({
          product_id: product.id,
          url,
          sort_order: index,
          is_cover: index === 0,
          ai_tags: aiResult?.defect_tags || [],
        }))

        await supabase.from('product_images').insert(imageRecords)
      }

      // 保存 AI 分析结果
      if (aiResult) {
        await supabase.from('product_ai_analysis').insert({
          product_id: product.id,
          category_guess: aiResult.category_guess,
          brand_guess: aiResult.brand_guess,
          condition_guess: aiResult.condition_guess,
          defect_tags: aiResult.defect_tags,
          suggested_price: aiResult.suggested_price,
          price_range_low: aiResult.price_range_low,
          price_range_high: aiResult.price_range_high,
          title_suggestion: aiResult.title_suggestion,
          description_suggestion: aiResult.description_suggestion,
          risk_flags: aiResult.risk_flags,
        })
      }

      toast.success('发布成功！')
      router.push(`/product/${product.id}`)
    } catch {
      toast.error('发布失败')
    } finally {
      setPublishing(false)
    }
  }

  const renderStep = () => {
    switch (STEPS[currentStep].key) {
      case 'images':
        return (
          <div>
            <h2 className="mb-2 text-lg font-semibold">上传商品图片</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              第一张将作为封面图，最多上传9张
            </p>
            <ImageUpload
              value={form.images}
              onChange={(urls) => updateForm('images', urls)}
              maxCount={9}
            />

            {/* AI 分析按钮 */}
            {form.images.length > 0 && (
              <div className="mt-4">
                <Button
                  variant="outline"
                  onClick={handleAiAnalyze}
                  disabled={aiAnalyze.isPending}
                  className="w-full border-primary/30 text-primary hover:bg-primary/5"
                >
                  {aiAnalyze.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  AI智能识别（自动填写信息）
                </Button>
              </div>
            )}

            {/* AI 分析结果预览 */}
            {showAiPanel && aiResult && (
              <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
                <h3 className="mb-2 flex items-center gap-1 text-sm font-medium text-primary">
                  <Sparkles className="h-4 w-4" />
                  AI 分析结果
                </h3>
                <div className="space-y-1.5 text-sm">
                  {aiResult.category_guess && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">类别</span>
                      <span>{aiResult.category_guess}</span>
                    </div>
                  )}
                  {aiResult.brand_guess && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">品牌</span>
                      <span>{aiResult.brand_guess}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">成色</span>
                    <span>{CONDITION_LABELS[aiResult.condition_guess] || aiResult.condition_guess}</span>
                  </div>
                  {aiResult.suggested_price && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">建议售价</span>
                      <span className="font-medium text-primary">¥{aiResult.suggested_price}</span>
                    </div>
                  )}
                  {aiResult.defect_tags.length > 0 && (
                    <div>
                      <span className="text-muted-foreground">检测到: </span>
                      {aiResult.defect_tags.map((tag) => (
                        <span key={tag} className="mr-1 rounded bg-yellow-100 px-1.5 py-0.5 text-xs text-yellow-700">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  已自动填充到下方表单，可手动修改
                </p>
              </div>
            )}
          </div>
        )

      case 'info':
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">商品信息</h2>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-sm font-medium">标题</label>
                {aiResult?.title_suggestion && (
                  <button
                    onClick={() => updateForm('title', aiResult.title_suggestion)}
                    className="flex items-center gap-1 text-xs text-primary"
                  >
                    <Wand2 className="h-3 w-3" />
                    AI建议
                  </button>
                )}
              </div>
              <Input
                placeholder="描述一下你的宝贝"
                value={form.title}
                onChange={(e) => updateForm('title', e.target.value)}
                maxLength={50}
              />
              <p className="mt-1 text-xs text-muted-foreground">{form.title.length}/50</p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">分类</label>
              <div className="flex flex-wrap gap-2">
                {categories?.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => updateForm('category_id', cat.id)}
                    className={cn(
                      'rounded-full px-3 py-1.5 text-sm transition-colors',
                      form.category_id === cat.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80'
                    )}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">成色</label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(CONDITION_LABELS).map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => updateForm('condition', value)}
                    className={cn(
                      'rounded-full px-3 py-1.5 text-sm transition-colors',
                      form.condition === value
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-sm font-medium">描述（选填）</label>
                {aiResult?.description_suggestion && (
                  <button
                    onClick={() => updateForm('description', aiResult.description_suggestion)}
                    className="flex items-center gap-1 text-xs text-primary"
                  >
                    <Wand2 className="h-3 w-3" />
                    AI建议
                  </button>
                )}
              </div>
              <Textarea
                placeholder="详细描述商品的状态、瑕疵等"
                value={form.description}
                onChange={(e) => updateForm('description', e.target.value)}
                rows={4}
                maxLength={2000}
              />
            </div>
          </div>
        )

      case 'price':
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">价格与交易方式</h2>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-sm font-medium">售价</label>
                <button
                  onClick={handleAiEstimate}
                  disabled={aiEstimate.isPending || !form.title}
                  className="flex items-center gap-1 text-xs text-primary disabled:opacity-50"
                >
                  {aiEstimate.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Sparkles className="h-3 w-3" />
                  )}
                  AI估价
                </button>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">¥</span>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={form.price}
                  onChange={(e) => updateForm('price', e.target.value)}
                  className="pl-7"
                  min="0.01"
                  step="0.01"
                />
              </div>
              {aiResult?.suggested_price && (
                <p className="mt-1 text-xs text-muted-foreground">
                  AI建议: ¥{aiResult.price_range_low} ~ ¥{aiResult.price_range_high}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">原价（选填）</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">¥</span>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={form.original_price}
                  onChange={(e) => updateForm('original_price', e.target.value)}
                  className="pl-7"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">交易方式</label>
              <div className="flex gap-2">
                {[
                  { value: 'both', label: '均可' },
                  { value: 'offline', label: '仅自提' },
                  { value: 'escrow', label: '仅担保' },
                ].map((m) => (
                  <button
                    key={m.value}
                    onClick={() => updateForm('trade_method', m.value)}
                    className={cn(
                      'flex-1 rounded-lg py-2.5 text-sm font-medium transition-colors',
                      form.trade_method === m.value
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80'
                    )}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )

      case 'confirm':
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">确认发布</h2>

            {/* 预览 */}
            <div className="overflow-hidden rounded-xl border">
              {form.images.length > 0 && (
                <div className="aspect-square bg-muted">
                  <img src={form.images[0]} alt="" className="h-full w-full object-cover" />
                </div>
              )}
              <div className="p-4">
                <h3 className="text-base font-medium">{form.title}</h3>
                <p className="mt-1 text-xl font-bold text-primary">¥{form.price}</p>
                <div className="mt-2 flex gap-2 text-xs text-muted-foreground">
                  <span>{CONDITION_LABELS[form.condition]}</span>
                  <span>·</span>
                  <span>{categories?.find((c) => c.id === form.category_id)?.name}</span>
                </div>
                {form.description && (
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{form.description}</p>
                )}
                {aiResult && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-primary">
                    <Sparkles className="h-3 w-3" />
                    AI辅助发布
                  </div>
                )}
              </div>
            </div>

            <Button className="w-full" size="lg" onClick={handlePublish} disabled={publishing}>
              {publishing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              发布商品
            </Button>
          </div>
        )
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      {/* 步骤指示器 */}
      <div className="mb-6 flex items-center justify-between">
        {STEPS.map((step, index) => (
          <div key={step.key} className="flex items-center">
            <div
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium',
                index <= currentStep
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {index < currentStep ? <Check className="h-3.5 w-3.5" /> : index + 1}
            </div>
            <span className="ml-1.5 hidden text-xs sm:block">{step.label}</span>
            {index < STEPS.length - 1 && (
              <div className={cn('mx-2 h-px w-6 sm:w-10', index < currentStep ? 'bg-primary' : 'bg-muted')} />
            )}
          </div>
        ))}
      </div>

      {/* 步骤内容 */}
      {renderStep()}

      {/* 底部按钮 */}
      {STEPS[currentStep].key !== 'confirm' && (
        <div className="mt-6 flex gap-3">
          {currentStep > 0 && (
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setCurrentStep((s) => s - 1)}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              上一步
            </Button>
          )}
          <Button
            className="flex-1"
            disabled={!canNext()}
            onClick={() => setCurrentStep((s) => s + 1)}
          >
            下一步
          </Button>
        </div>
      )}
    </div>
  )
}
