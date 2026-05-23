'use client'

import { useMutation } from '@tanstack/react-query'

export interface AiAnalysisResult {
  category_guess: string | null
  brand_guess: string | null
  condition_guess: string
  defect_tags: string[]
  suggested_price: number | null
  price_range_low: number | null
  price_range_high: number | null
  title_suggestion: string | null
  description_suggestion: string | null
  risk_flags: string[]
}

export interface AiModerationResult {
  safe: boolean
  reason?: string
  flags?: string[]
  action?: 'block' | 'warn' | 'pass'
}

export interface AiEstimateResult {
  suggested_price: number
  price_range_low: number
  price_range_high: number
  confidence: number
  reason: string
}

// 图片分析 - 识别商品信息
export function useAiAnalyze() {
  return useMutation({
    mutationFn: async (imageUrl: string) => {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl, type: 'product' }),
      })
      if (!res.ok) throw new Error('分析失败')
      const json = await res.json()
      return json.data as AiAnalysisResult
    },
  })
}

// 内容审核
export function useAiModerate() {
  return useMutation({
    mutationFn: async (params: { text: string; type: 'message' | 'product' | 'comment' }) => {
      const res = await fetch('/api/ai/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      })
      if (!res.ok) throw new Error('审核失败')
      return (await res.json()) as AiModerationResult
    },
  })
}

// 商品估价
export function useAiEstimate() {
  return useMutation({
    mutationFn: async (params: {
      title: string
      category?: string
      condition: string
      brand?: string
      originalPrice?: number
    }) => {
      const res = await fetch('/api/ai/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      })
      if (!res.ok) throw new Error('估价失败')
      const json = await res.json()
      return json.data as AiEstimateResult
    },
  })
}
