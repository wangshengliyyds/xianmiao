'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

const refundReasons = ['质量问题', '未收到货', '与描述不符', '其他']

interface RefundDialogProps {
  open: boolean
  onClose: () => void
  orderId: string
  onSuccess: () => void
}

export function RefundDialog({ open, onClose, orderId, onSuccess }: RefundDialogProps) {
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!reason) {
      return
    }
    if (!description.trim()) {
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'refund',
          remark: `${reason}：${description.trim()}`,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || '申请退款失败')
      }
      setReason('')
      setDescription('')
      onSuccess()
      onClose()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '申请退款失败')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-t-2xl bg-background p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-4 text-lg font-semibold">申请退款</h3>

        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium">退款原因</label>
          <div className="flex flex-wrap gap-2">
            {refundReasons.map((r) => (
              <button
                key={r}
                onClick={() => setReason(r)}
                className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                  reason === r
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background hover:bg-muted'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium">
            详细说明 <span className="text-destructive">*</span>
          </label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, 500))}
            placeholder="请描述退款原因..."
            rows={4}
          />
          <p className="mt-1 text-xs text-muted-foreground">{description.length}/500</p>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={submitting}>
            取消
          </Button>
          <Button
            className="flex-1"
            onClick={handleSubmit}
            disabled={!reason || !description.trim() || submitting}
          >
            {submitting ? '提交中...' : '提交申请'}
          </Button>
        </div>
      </div>
    </div>
  )
}
