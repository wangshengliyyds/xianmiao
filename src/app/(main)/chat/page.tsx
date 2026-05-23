'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { useConversations } from '@/lib/hooks/use-chat'
import { useAuthStore } from '@/stores/auth-store'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { MessageCircle, ChevronLeft } from 'lucide-react'
import { formatRelativeTime } from '@/lib/format'

export default function ChatListPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { data: conversations, isLoading } = useConversations()

  if (!user) {
    router.push('/login')
    return null
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* 顶部导航 */}
      <div className="sticky top-0 z-40 flex items-center gap-3 border-b bg-background px-4 py-3">
        <h1 className="text-lg font-semibold">消息</h1>
        <span className="text-sm text-muted-foreground">
          {conversations?.length ? `(${conversations.length})` : ''}
        </span>
      </div>

      {/* 会话列表 */}
      <div>
        {isLoading ? (
          <div className="divide-y">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-40" />
                </div>
                <Skeleton className="h-3 w-10" />
              </div>
            ))}
          </div>
        ) : conversations && conversations.length > 0 ? (
          <div className="divide-y">
            {conversations.map((conv) => {
              const lastMsg = conv.last_message
              const otherMember = conv.members?.find((m) => m.user_id !== user.id)
              const displayName = conv.title || otherMember?.profile?.nickname || '未知用户'
              const avatarUrl = conv.avatar_url || otherMember?.profile?.avatar_url
              const hasUnread = (conv.unread_count || 0) > 0

              return (
                <Link
                  key={conv.id}
                  href={`/chat/${conv.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
                >
                  {/* 头像 */}
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={avatarUrl || undefined} />
                      <AvatarFallback>{displayName[0] || '聊'}</AvatarFallback>
                    </Avatar>
                    {hasUnread && (
                      <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium text-white">
                        {(conv.unread_count || 0) > 99 ? '99+' : conv.unread_count}
                      </span>
                    )}
                  </div>

                  {/* 信息 */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${hasUnread ? 'font-semibold' : 'font-medium'}`}>
                        {displayName}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {conv.last_message_at ? formatRelativeTime(conv.last_message_at) : ''}
                      </span>
                    </div>
                    <p className={`mt-0.5 truncate text-sm ${hasUnread ? 'font-medium' : 'text-muted-foreground'}`}>
                      {lastMsg
                        ? lastMsg.type === 'text'
                          ? lastMsg.content
                          : lastMsg.type === 'image'
                          ? '[图片]'
                          : lastMsg.type === 'product_card'
                          ? '[商品卡片]'
                          : lastMsg.type === 'offer'
                          ? '[出价]'
                          : '[消息]'
                        : '暂无消息'}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="py-20 text-center">
            <MessageCircle className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">暂无消息</p>
            <p className="mt-1 text-xs text-muted-foreground">
              去商品详情页联系卖家开始聊天吧
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
