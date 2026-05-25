'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { formatRelativeTime } from '@/lib/format'
import type { ConversationWithDetails } from '@/types'

interface ConversationItemProps {
  conversation: ConversationWithDetails
}

export function ConversationItem({ conversation }: ConversationItemProps) {
  const otherUser = conversation.other_user
  const lastMessage = conversation.last_message
  const unreadCount = conversation.unread_count || 0

  const getLastMessagePreview = () => {
    if (!lastMessage) return '暂无消息'

    switch (lastMessage.type) {
      case 'text':
        return lastMessage.content
      case 'image':
        return '[图片]'
      case 'product_card':
        return '[商品卡片]'
      case 'offer':
        return '[出价]'
      case 'system':
        return '[系统消息]'
      default:
        return lastMessage.content || '新消息'
    }
  }

  return (
    <Link
      href={`/chat/${conversation.id}`}
      className="flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-muted"
    >
      <div className="relative">
        <div className="relative h-12 w-12 overflow-hidden rounded-full bg-muted">
          {otherUser?.avatar_url ? (
            <Image
              src={otherUser.avatar_url}
              alt={otherUser.nickname || '用户'}
              fill
              className="object-cover"
              sizes="48px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-lg font-medium text-muted-foreground">
              {otherUser?.nickname?.[0] || '?'}
            </div>
          )}
        </div>
        {unreadCount > 0 && (
          <Badge
            className="absolute -right-1 -top-1 h-5 min-w-5 px-1 text-xs"
            variant="destructive"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h3 className="font-medium truncate">
            {otherUser?.nickname || '未知用户'}
          </h3>
          {lastMessage && (
            <span className="ml-2 shrink-0 text-xs text-muted-foreground">
              {formatRelativeTime(lastMessage.created_at)}
            </span>
          )}
        </div>
        <p className={`mt-0.5 truncate text-sm ${unreadCount > 0 ? 'font-medium' : 'text-muted-foreground'}`}>
          {getLastMessagePreview()}
        </p>
      </div>
    </Link>
  )
}
