'use client'

import { useEffect } from 'react'
import { MessageCircle } from 'lucide-react'
import { ConversationItem } from '@/components/chat/conversation-item'
import { EmptyState } from '@/components/common/empty-state'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { useConversations } from '@/lib/hooks/use-conversations'
import { useChatStore } from '@/stores/chat-store'

export default function ChatListPage() {
  const { data: conversations, isLoading } = useConversations()
  const { setTotalUnread } = useChatStore()

  // 计算总未读数
  useEffect(() => {
    if (conversations) {
      const total = conversations.reduce(
        (sum, conv) => sum + (conv.unread_count || 0),
        0
      )
      setTotalUnread(total)
    }
  }, [conversations, setTotalUnread])

  return (
    <div className="mx-auto max-w-2xl">
      <div className="px-4 py-3">
        <h1 className="text-lg font-semibold">消息</h1>
      </div>

      {isLoading ? (
        <LoadingSpinner text="加载中..." />
      ) : !conversations || conversations.length === 0 ? (
        <EmptyState
          icon={<MessageCircle className="h-8 w-8 stroke-[2] text-muted-foreground/40" />}
          title="暂无消息"
          description="和卖家聊聊，了解更多商品信息"
        />
      ) : (
        <div className="divide-y">
          {conversations.map((conv) => (
            <ConversationItem key={conv.id} conversation={conv} />
          ))}
        </div>
      )}
    </div>
  )
}
