'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMyMerchant, useApplyMerchant } from '@/lib/hooks/use-merchant'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import {
  ChevronLeft, Store, Loader2, Check, Shield,
} from 'lucide-react'

export default function MerchantApplyPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { data: merchant, isLoading } = useMyMerchant()
  const apply = useApplyMerchant()

  const [form, setForm] = useState({
    storeName: '',
    storeDescription: '',
  })

  if (!user) {
    router.push('/login')
    return null
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-lg px-4 py-6">
        <div className="h-32 animate-pulse rounded-xl bg-muted" />
      </div>
    )
  }

  // 已经是商家
  if (merchant) {
    return (
      <div className="mx-auto max-w-lg px-4 py-6">
        <div className="mb-4 flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold">商家中心</h1>
        </div>

        <div className="rounded-xl border bg-card p-6 text-center">
          {merchant.status === 'approved' && (
            <>
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
                <Check className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-semibold">{merchant.store_name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">商家已认证</p>
              <Button className="mt-4" onClick={() => router.push('/merchant/dashboard')}>
                进入商家中心
              </Button>
            </>
          )}
          {merchant.status === 'pending' && (
            <>
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 text-yellow-600">
                <Shield className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-semibold">审核中</h2>
              <p className="mt-1 text-sm text-muted-foreground">您的商家申请正在审核中，请耐心等待</p>
            </>
          )}
          {merchant.status === 'rejected' && (
            <>
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
                <Shield className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-semibold">申请被拒</h2>
              <p className="mt-1 text-sm text-muted-foreground">您的商家申请未通过审核，请修改后重新提交</p>
            </>
          )}
        </div>
      </div>
    )
  }

  const handleSubmit = () => {
    if (!form.storeName.trim()) {
      toast.error('请输入店铺名称')
      return
    }

    apply.mutate(
      { storeName: form.storeName, storeDescription: form.storeDescription || undefined },
      {
        onSuccess: () => toast.success('申请已提交，请等待审核'),
        onError: (err) => toast.error(err.message || '申请失败'),
      }
    )
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => router.back()} className="p-1">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold">申请成为商家</h1>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Store className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-medium">开通商家</h2>
            <p className="text-sm text-muted-foreground">成为闲妙商家，展示更多商品</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">店铺名称 *</label>
            <Input
              placeholder="给你的店铺取个名字"
              value={form.storeName}
              onChange={(e) => setForm({ ...form, storeName: e.target.value })}
              maxLength={20}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">店铺简介（选填）</label>
            <Textarea
              placeholder="简单介绍一下你的店铺"
              value={form.storeDescription}
              onChange={(e) => setForm({ ...form, storeDescription: e.target.value })}
              rows={3}
              maxLength={200}
            />
          </div>

          <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">商家权益</p>
            <ul className="mt-1 list-inside list-disc space-y-0.5">
              <li>专属商家标识，增强买家信任</li>
              <li>支持SKU多规格商品管理</li>
              <li>商家数据看板</li>
              <li>优先展示在搜索结果中</li>
            </ul>
          </div>

          <Button onClick={handleSubmit} className="w-full" disabled={apply.isPending}>
            {apply.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            提交申请
          </Button>
        </div>
      </div>
    </div>
  )
}
