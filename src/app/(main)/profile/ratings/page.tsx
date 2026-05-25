'use client'

import { useEffect, useState } from 'react'
import { Star } from 'lucide-react'
import { BackHeader } from '@/components/common/back-header'
import { EmptyState } from '@/components/common/empty-state'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { formatRelativeTime } from '@/lib/format'
import type { UserRating } from '@/types'

interface RatingWithProfile extends UserRating {
  rater?: { nickname: string; avatar_url: string | null }
}

export default function RatingsPage() {
  const [ratings, setRatings] = useState<RatingWithProfile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/ratings')
      .then((res) => res.ok ? res.json() : { data: [] })
      .then(({ data }) => setRatings(data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <BackHeader title="我的评价" />

      <div className="mx-auto max-w-2xl px-4 py-6">
        {loading ? (
          <LoadingSpinner text="加载中..." />
        ) : ratings.length === 0 ? (
          <EmptyState icon={<Star className="h-8 w-8 stroke-[2] text-muted-foreground/40" />} title="暂无评价" description="完成订单后会收到评价" />
        ) : (
          <div className="space-y-3">
            {ratings.map((rating) => (
              <div key={rating.id} className="rounded-2xl border bg-card p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-medium">{rating.rater?.nickname || '匿名用户'}</span>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 stroke-[2] ${i < rating.score ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}`}
                      />
                    ))}
                  </div>
                </div>
                {rating.content && (
                  <p className="text-sm text-muted-foreground">{rating.content}</p>
                )}
                <p className="mt-2 text-xs text-muted-foreground">{formatRelativeTime(rating.created_at)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
