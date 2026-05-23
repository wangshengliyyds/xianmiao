'use client'

import { useAdminPendingMerchants, useAdminReviewMerchant } from '@/lib/hooks/use-admin'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { Check, X, Store } from 'lucide-react'

export default function AdminMerchantsPage() {
  const { data: merchants, isLoading } = useAdminPendingMerchants()
  const review = useAdminReviewMerchant()

  const handleReview = (merchantId: string, status: 'approved' | 'rejected') => {
    review.mutate(
      { merchantId, status },
      {
        onSuccess: () => toast.success(status === 'approved' ? '已通过' : '已拒绝'),
        onError: () => toast.error('操作失败'),
      }
    )
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">商家审核</h1>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : merchants && merchants.length > 0 ? (
        <div className="space-y-3">
          {merchants.map((merchant: any) => (
            <div key={merchant.id} className="rounded-xl border bg-card p-4">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                  {merchant.store_name[0]}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{merchant.store_name}</h3>
                  {merchant.store_description && (
                    <p className="mt-0.5 text-sm text-muted-foreground">{merchant.store_description}</p>
                  )}
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    <span>申请人: {merchant.user?.nickname || '未知'}</span>
                    <span>申请时间: {new Date(merchant.created_at).toLocaleDateString('zh-CN')}</span>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button size="sm" variant="outline" className="text-red-500" onClick={() => handleReview(merchant.id, 'rejected')}>
                    <X className="mr-1 h-3 w-3" />
                    拒绝
                  </Button>
                  <Button size="sm" onClick={() => handleReview(merchant.id, 'approved')}>
                    <Check className="mr-1 h-3 w-3" />
                    通过
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center">
          <Check className="mx-auto mb-3 h-12 w-12 text-green-500" />
          <p className="text-sm text-muted-foreground">暂无待审核商家申请</p>
        </div>
      )}
    </div>
  )
}
