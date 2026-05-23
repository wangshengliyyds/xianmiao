'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useCreateRating } from '@/lib/hooks/use-rating'
import { toast } from 'sonner'
import { Star, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface RatingDialogProps {
  orderId: string
  rateeId: string
  rateeName: string
}

export function RatingDialog({ orderId, rateeId, rateeName }: RatingDialogProps) {
  const [open, setOpen] = useState(false)
  const [score, setScore] = useState(5)
  const [hoverScore, setHoverScore] = useState(0)
  const [content, setContent] = useState('')
  const createRating = useCreateRating()

  const handleSubmit = () => {
    createRating.mutate(
      { orderId, rateeId, score, content: content || undefined },
      {
        onSuccess: () => {
          toast.success('评价成功')
          setOpen(false)
          setScore(5)
          setContent('')
        },
        onError: () => toast.error('评价失败'),
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        评价{rateeName}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>评价{rateeName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* 星级评分 */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  onMouseEnter={() => setHoverScore(s)}
                  onMouseLeave={() => setHoverScore(0)}
                  onClick={() => setScore(s)}
                  className="p-0.5"
                >
                  <Star
                    className={cn(
                      'h-8 w-8 transition-colors',
                      (hoverScore || score) >= s
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted-foreground'
                    )}
                  />
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {['', '很差', '较差', '一般', '较好', '非常好'][hoverScore || score]}
            </p>
          </div>

          {/* 评价内容 */}
          <Textarea
            placeholder="分享你的交易体验（选填）"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[80px] resize-none text-sm"
          />

          <Button onClick={handleSubmit} className="w-full" disabled={createRating.isPending}>
            {createRating.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            提交评价
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
