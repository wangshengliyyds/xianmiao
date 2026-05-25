'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/use-auth'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { toast } from 'sonner'

export function BuyerGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (loading) return
    if (!user) return // 未登录不拦截
    if (user.role !== 'buyer') {
      toast.error('该功能仅买家可用')
      router.replace('/')
    }
  }, [user, loading, router])

  if (loading) return <LoadingSpinner text="加载中..." />
  if (user && user.role !== 'buyer') return null
  return <>{children}</>
}
