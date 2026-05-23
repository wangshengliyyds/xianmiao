'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'

export interface Rating {
  id: string
  order_id: string
  rater_id: string
  ratee_id: string
  score: number
  content: string | null
  created_at: string
}

export function useCreateRating() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      orderId: string
      rateeId: string
      score: number
      content?: string
    }) => {
      if (!isSupabaseConfigured()) {
        return {
          id: `mock-rating-${Date.now()}`,
          order_id: params.orderId,
          rater_id: 'mock-user-1',
          ratee_id: params.rateeId,
          score: params.score,
          content: params.content || null,
          created_at: new Date().toISOString(),
        } as Rating
      }

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('请先登录')

      const { data, error } = await supabase
        .from('ratings')
        .insert({
          order_id: params.orderId,
          rater_id: user.id,
          ratee_id: params.rateeId,
          score: params.score,
          content: params.content || null,
        })
        .select()
        .single()

      if (error) throw error

      // 更新用户的信用分
      const { data: ratings } = await supabase
        .from('ratings')
        .select('score')
        .eq('ratee_id', params.rateeId)

      if (ratings && ratings.length > 0) {
        const avgScore = ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length
        const creditScore = Math.round(avgScore * 20)
        await supabase
          .from('profiles')
          .update({ credit_score: creditScore })
          .eq('id', params.rateeId)
      }

      return data as Rating
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}
