'use client'

import { useState } from 'react'
import { CreditCard, Loader2, Wallet, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/format'
import { cn } from '@/lib/utils'

type PaymentMethod = 'alipay' | 'wechat'

interface PaymentDialogProps {
  open: boolean
  onClose: () => void
  orderNo: string
  amount: number
  onConfirm: (method: PaymentMethod) => Promise<void>
}

const methods: { key: PaymentMethod; label: string; icon: typeof Wallet; color: string; bg: string }[] = [
  { key: 'alipay', label: '支付宝', icon: Wallet, color: 'text-[#1677ff]', bg: 'bg-[#1677ff]/10' },
  { key: 'wechat', label: '微信支付', icon: Smartphone, color: 'text-[#07c160]', bg: 'bg-[#07c160]/10' },
]

export function PaymentDialog({ open, onClose, orderNo, amount, onConfirm }: PaymentDialogProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('alipay')
  const [processing, setProcessing] = useState(false)

  if (!open) return null

  const handleConfirm = async () => {
    setProcessing(true)
    try {
      await onConfirm(selectedMethod)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-2xl rounded-t-2xl bg-background p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-1 text-lg font-semibold">确认支付</h3>
        <p className="mb-4 text-sm text-muted-foreground">订单号 {orderNo}</p>

        {/* 金额 */}
        <div className="mb-6 text-center">
          <p className="mb-1 text-sm text-muted-foreground">支付金额</p>
          <span className="text-3xl font-bold text-primary">{formatPrice(amount)}</span>
        </div>

        {/* 支付方式 */}
        <div className="mb-6 space-y-3">
          <p className="text-sm font-medium">选择支付方式</p>
          {methods.map((m) => {
            const Icon = m.icon
            const isSelected = selectedMethod === m.key
            return (
              <button
                key={m.key}
                type="button"
                onClick={() => setSelectedMethod(m.key)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-colors',
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-transparent bg-muted/50 hover:bg-muted'
                )}
              >
                <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', m.bg)}>
                  <Icon className={cn('h-5 w-5', m.color)} />
                </div>
                <span className="flex-1 font-medium">{m.label}</span>
                <div
                  className={cn(
                    'flex h-5 w-5 items-center justify-center rounded-full border-2',
                    isSelected ? 'border-primary' : 'border-muted-foreground/30'
                  )}
                >
                  {isSelected && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
                </div>
              </button>
            )
          })}
        </div>

        {/* 按钮 */}
        <Button className="w-full" size="lg" onClick={handleConfirm} disabled={processing}>
          {processing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              支付处理中...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              确认支付
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
