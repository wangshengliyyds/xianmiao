'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { ArrowLeft, Send, Image as ImageIcon, Flag } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ChatBubble } from '@/components/chat/chat-bubble'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { ReportDialog } from '@/components/common/report-dialog'
import { useMessages, useSendMessage } from '@/lib/hooks/use-conversations'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/lib/hooks/use-auth'
import { doUpload } from '@/lib/hooks/use-upload'
import { toast } from 'sonner'
import type { ConversationWithDetails, MessageWithSender } from '@/types'

export default function ChatDetailPage() {
  const params = useParams()
  const router = useRouter()
  const conversationId = params.id as string

  const [conversation, setConversation] = useState<ConversationWithDetails | null>(null)
  const [messageText, setMessageText] = useState('')
  const [uploading, setUploading] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { data, isLoading } = useMessages(conversationId)

  // 消息加载后刷新未读计数
  useEffect(() => {
    if (data?.data) {
      queryClient.invalidateQueries({ queryKey: ['unread-summary'] })
    }
  }, [data?.data, queryClient])
  const sendMessage = useSendMessage()

  // 获取会话信息
  useEffect(() => {
    const fetchConversation = async () => {
      try {
        const res = await fetch(`/api/conversations/${conversationId}`)
        if (res.ok) {
          const { data } = await res.json()
          setConversation(data)
        }
      } catch {
        toast.error('获取会话信息失败')
      }
    }
    fetchConversation()
  }, [conversationId])

  // 滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [data?.data])

  const handleSend = async () => {
    if (!messageText.trim()) return

    try {
      await sendMessage.mutateAsync({
        conversationId,
        type: 'text',
        content: messageText.trim(),
      })
      setMessageText('')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '发送失败')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('图片大小不能超过 5MB')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setUploading(true)
    try {
      const url = await doUpload(file)
      await sendMessage.mutateAsync({
        conversationId,
        type: 'image',
        content: url,
      })
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '图片发送失败')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const messages = data?.data || []
  const otherUser = conversation?.other_user

  return (
    <div className="flex h-[calc(100vh-120px)] flex-col">
      {/* 头部 */}
      <header className="flex items-center gap-3 border-b bg-background px-4 py-3">
        <button
          onClick={() => router.back()}
          className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5 stroke-[2]" />
        </button>

        <div className="relative h-9 w-9 overflow-hidden rounded-full bg-muted">
          {otherUser?.avatar_url ? (
            <Image
              src={otherUser.avatar_url}
              alt={otherUser.nickname || '用户'}
              fill
              className="object-cover"
              sizes="36px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm font-medium text-muted-foreground">
              {otherUser?.nickname?.[0] || '?'}
            </div>
          )}
        </div>

        <div className="flex-1">
          <h1 className="font-semibold">
            {otherUser?.nickname || '聊天中'}
          </h1>
        </div>

        {otherUser && otherUser.id !== user?.id && (
          <button
            onClick={() => setShowReport(true)}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted"
            title="举报用户"
          >
            <Flag className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </header>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {isLoading ? (
          <LoadingSpinner text="加载消息..." />
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground">
              开始和对方聊天吧
            </p>
          </div>
        ) : (
          <>
            {messages.map((message: MessageWithSender) => (
              <ChatBubble
                key={message.id}
                message={message}
                isMine={message.sender_id === user?.id}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* 输入框 */}
      <div className="sticky bottom-0 border-t bg-background px-4 py-3 safe-bottom">
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || sendMessage.isPending}
          >
            <ImageIcon className="h-5 w-5" />
          </Button>
          <Input
            placeholder="输入消息..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={!messageText.trim() || sendMessage.isPending}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 举报弹窗 */}
      {otherUser && (
        <ReportDialog
          open={showReport}
          onClose={() => setShowReport(false)}
          targetType="user"
          targetId={otherUser.id}
        />
      )}
    </div>
  )
}
