'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useUpdateOrderStatus } from '@/lib/hooks/use-order'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface RefundDialogProps {
  orderId: string
}

const REASONS = [
  { value: 'not_as_described', label: '商品与描述不符' },
  { value: 'quality_issue', label: '商品存在质量问题' },
  { value: 'wrong_item', label: '收到错误商品' },
  { value: 'not_received', label: '未收到商品' },
  { value: 'changed_mind', label: '不想要了' },
  { value: 'other', label: '其他原因' },
]

export function RefundDialog({ orderId }: RefundDialogProps) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const updateStatus = useUpdateOrderStatus()

  const handleSubmit = () => {
    if (!reason) {
      toast.error('请选择退款原因')
      return
    }

    const reasonLabel = REASONS.find((r) => r.value === reason)?.label || reason
    const remark = `${reasonLabel}${description ? `: ${description}` : ''}`

    updateStatus.mutate(
      { orderId, status: 'refunding', remark },
      {
        onSuccess: () => {
          toast.success('退款申请已提交')
          setOpen(false)
          setReason('')
          setDescription('')
        },
        onError: () => toast.error('提交失败'),
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        申请退款
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>申请退款</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* 退款原因 */}
          <div>
            <p className="mb-2 text-sm font-medium">退款原因</p>
            <div className="flex flex-wrap gap-2">
              {REASONS.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setReason(r.value)}
                  className={`rounded-full px-3 py-1 text-xs transition-colors ${
                    reason === r.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* 详细说明 */}
          <div>
            <p className="mb-2 text-sm font-medium">详细说明（选填）</p>
            <Textarea
              placeholder="请描述退款原因..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[80px] resize-none text-sm"
            />
          </div>

          <Button onClick={handleSubmit} className="w-full" disabled={updateStatus.isPending}>
            {updateStatus.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            提交退款申请
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
