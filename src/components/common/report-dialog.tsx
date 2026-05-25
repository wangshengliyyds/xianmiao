'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

const reportReasons = [
  { value: 'fraud', label: '欺诈' },
  { value: 'prohibited', label: '违禁品' },
  { value: 'spam', label: '垃圾信息' },
  { value: 'inappropriate', label: '不当内容' },
  { value: 'other', label: '其他' },
]

interface ReportDialogProps {
  open: boolean
  onClose: () => void
  targetType: 'product' | 'user' | 'message'
  targetId: string
}

export function ReportDialog({ open, onClose, targetType, targetId }: ReportDialogProps) {
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async () => {
    if (!reason) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_type: targetType,
          target_id: targetId,
          reason,
          description: description.trim() || undefined,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || '举报失败')
      }
      setSubmitted(true)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '举报失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    setReason('')
    setDescription('')
    setSubmitted(false)
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40" onClick={handleClose}>
      <div className="w-full max-w-2xl rounded-t-2xl bg-background p-6" onClick={(e) => e.stopPropagation()}>
        {submitted ? (
          <div className="flex flex-col items-center py-6">
            <p className="mb-4 text-lg font-semibold">举报已提交</p>
            <p className="mb-4 text-sm text-muted-foreground">我们会尽快处理您的举报</p>
            <Button onClick={handleClose}>确定</Button>
          </div>
        ) : (
          <>
            <h3 className="mb-4 text-lg font-semibold">举报</h3>

            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium">举报原因</label>
              <div className="flex flex-wrap gap-2">
                {reportReasons.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setReason(r.value)}
                    className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                      reason === r.value
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-background hover:bg-muted'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium">补充说明（选填）</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 200))}
                placeholder="请补充说明..."
                rows={3}
              />
              <p className="mt-1 text-xs text-muted-foreground">{description.length}/200</p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={handleClose} disabled={submitting}>
                取消
              </Button>
              <Button
                className="flex-1"
                onClick={handleSubmit}
                disabled={!reason || submitting}
              >
                {submitting ? '提交中...' : '提交举报'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
