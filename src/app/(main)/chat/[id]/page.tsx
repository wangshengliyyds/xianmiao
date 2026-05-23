'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  useMessages,
  useMessagesRealtime,
  useSendMessage,
  useMarkConversationRead,
} from '@/lib/hooks/use-chat'
import { useAiModerate } from '@/lib/hooks/use-ai'
import { useAuthStore } from '@/stores/auth-store'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
  ChevronLeft, Send, ImagePlus, Loader2, Package,
} from 'lucide-react'
import { formatPrice, formatRelativeTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Message } from '@/types/chat'

export default function ChatRoomPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuthStore()
  const conversationId = params.id as string

  const { data: messages, isLoading } = useMessages(conversationId)
  useMessagesRealtime(conversationId)
  const sendMessage = useSendMessage()
  const markRead = useMarkConversationRead()
  const moderate = useAiModerate()

  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 标记已读
  useEffect(() => {
    if (conversationId && user) {
      markRead.mutate(conversationId)
    }
  }, [conversationId, user])

  const handleSend = () => {
    if (!input.trim()) return
    const content = input.trim()

    // 内容审核
    moderate.mutate(
      { text: content, type: 'message' },
      {
        onSuccess: (result) => {
          if (!result.safe && result.action === 'block') {
            toast.error(`消息包含违规内容: ${result.reason}`)
            return
          }
          if (!result.safe && result.action === 'warn') {
            toast.warning(`注意: ${result.reason}`)
          }
          // 发送消息
          sendMessage.mutate(
            { conversationId, type: 'text', content },
            {
              onSuccess: () => setInput(''),
              onError: () => toast.error('发送失败'),
            }
          )
        },
        onError: () => {
          // 审核失败也发送
          sendMessage.mutate(
            { conversationId, type: 'text', content },
            {
              onSuccess: () => setInput(''),
              onError: () => toast.error('发送失败'),
            }
          )
        },
      }
    )
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

    // 上传到 Supabase Storage
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()

      if (data.url) {
        sendMessage.mutate(
          { conversationId, type: 'image', content: data.url },
          { onError: () => toast.error('图片发送失败') }
        )
      }
    } catch {
      toast.error('上传失败')
    }

    // 清空 input
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  if (!user) {
    router.push('/login')
    return null
  }

  // 按时间分组消息
  const groupedMessages = messages?.reduce<Array<{ time: string; messages: Message[] }>>(
    (groups, msg) => {
      const time = new Date(msg.created_at).toLocaleDateString('zh-CN', {
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
      const lastGroup = groups[groups.length - 1]
      if (lastGroup && lastGroup.time === time) {
        lastGroup.messages.push(msg)
      } else {
        groups.push({ time, messages: [msg] })
      }
      return groups
    },
    []
  )

  // 获取对方信息
  const otherUser = messages?.find((m) => m.sender_id !== user.id)?.sender

  return (
    <div className="flex h-[100dvh] flex-col mx-auto max-w-2xl">
      {/* 顶部导航 */}
      <div className="flex shrink-0 items-center gap-3 border-b bg-background px-4 py-3">
        <button onClick={() => router.back()} className="p-1">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={otherUser?.avatar_url || undefined} />
            <AvatarFallback>{otherUser?.nickname?.[0] || '聊'}</AvatarFallback>
          </Avatar>
          <h1 className="text-sm font-medium">{otherUser?.nickname || '聊天'}</h1>
        </div>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : groupedMessages && groupedMessages.length > 0 ? (
          <div className="space-y-4">
            {groupedMessages.map((group, gi) => (
              <div key={gi}>
                {/* 时间戳 */}
                <div className="mb-3 text-center">
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {group.time}
                  </span>
                </div>

                {/* 消息气泡 */}
                <div className="space-y-2">
                  {group.messages.map((msg) => {
                    const isMe = msg.sender_id === user.id
                    return (
                      <div
                        key={msg.id}
                        className={cn('flex gap-2', isMe ? 'flex-row-reverse' : '')}
                      >
                        {/* 头像 */}
                        <Avatar className="mt-1 h-8 w-8 shrink-0">
                          <AvatarImage src={msg.sender?.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {msg.sender?.nickname?.[0] || '?'}
                          </AvatarFallback>
                        </Avatar>

                        {/* 消息内容 */}
                        <div className={cn('max-w-[70%]', isMe ? 'items-end' : 'items-start')}>
                          {msg.type === 'text' && (
                            <div
                              className={cn(
                                'rounded-2xl px-3 py-2 text-sm',
                                isMe
                                  ? 'rounded-tr-sm bg-primary text-primary-foreground'
                                  : 'rounded-tl-sm bg-muted'
                              )}
                            >
                              {msg.content}
                            </div>
                          )}

                          {msg.type === 'image' && (
                            <div className="overflow-hidden rounded-2xl">
                              <Image
                                src={msg.content || ''}
                                alt="图片"
                                width={200}
                                height={200}
                                className="max-h-[200px] w-auto object-cover"
                              />
                            </div>
                          )}

                          {msg.type === 'product_card' && msg.metadata && (() => {
                            const meta = msg.metadata as Record<string, string | number>
                            return (
                              <div className="w-60 overflow-hidden rounded-xl border bg-card">
                                {meta.cover_url && (
                                  <Image
                                    src={String(meta.cover_url)}
                                    alt=""
                                    width={240}
                                    height={160}
                                    className="h-32 w-full object-cover"
                                  />
                                )}
                                <div className="p-2">
                                  <p className="line-clamp-1 text-sm font-medium">
                                    {String(meta.title || '')}
                                  </p>
                                  <p className="text-sm font-bold text-primary">
                                    {formatPrice(Number(meta.price || 0))}
                                  </p>
                                </div>
                                <a
                                  href={`/product/${meta.product_id}`}
                                  className="block border-t px-2 py-1.5 text-center text-xs text-primary"
                                >
                                  查看商品
                                </a>
                              </div>
                            )
                          })()}

                          {msg.type === 'offer' && msg.metadata && (() => {
                            const meta = msg.metadata as Record<string, string | number>
                            return (
                              <div className="w-56 rounded-xl border bg-card p-3">
                                <p className="text-xs text-muted-foreground">出价</p>
                                <p className="text-lg font-bold text-primary">
                                  {formatPrice(Number(meta.price || 0))}
                                </p>
                                {meta.status === 'pending' && !isMe && (
                                  <div className="mt-2 flex gap-2">
                                    <Button size="sm" variant="outline" className="flex-1 text-xs">
                                      拒绝
                                    </Button>
                                    <Button size="sm" className="flex-1 text-xs">
                                      接受
                                    </Button>
                                  </div>
                                )}
                                {meta.status !== 'pending' && (
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    {meta.status === 'accepted' ? '已接受' : '已拒绝'}
                                  </p>
                                )}
                              </div>
                            )
                          })()}

                          {msg.type === 'system' && (
                            <div className="text-center text-xs text-muted-foreground">
                              {msg.content}
                            </div>
                          )}

                          {/* 时间 */}
                          {msg.type !== 'system' && (
                            <p className={cn(
                              'mt-0.5 text-[10px] text-muted-foreground',
                              isMe ? 'text-right' : ''
                            )}>
                              {new Date(msg.created_at).toLocaleTimeString('zh-CN', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <Package className="mx-auto mb-2 h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">开始聊天吧</p>
            </div>
          </div>
        )}
      </div>

      {/* 输入栏 */}
      <div className="shrink-0 border-t bg-background px-3 py-2 safe-bottom">
        <div className="flex items-end gap-2">
          {/* 图片上传 */}
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
            className="shrink-0 text-muted-foreground"
          >
            <ImagePlus className="h-5 w-5" />
          </Button>

          {/* 文本输入 */}
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="说点什么..."
            rows={1}
            className="max-h-24 flex-1 resize-none rounded-2xl border bg-muted/50 px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-primary/30"
          />

          {/* 发送按钮 */}
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || sendMessage.isPending || moderate.isPending}
            className="shrink-0"
          >
            {(sendMessage.isPending || moderate.isPending) ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
