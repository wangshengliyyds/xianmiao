'use client'

import Image from 'next/image'
import Link from 'next/link'
import { formatPrice } from '@/lib/format'
import { SmartImage } from '@/components/ui/smart-image'
import type { MessageWithSender } from '@/types'

interface ChatBubbleProps {
  message: MessageWithSender
  isMine: boolean
}

export function ChatBubble({ message, isMine }: ChatBubbleProps) {
  // 系统消息
  if (message.type === 'system') {
    return (
      <div className="flex justify-center py-2">
        <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
          {message.content}
        </span>
      </div>
    )
  }

  // 商品卡片消息
  if (message.type === 'product_card' && message.metadata) {
    const meta = message.metadata as { title?: string; price?: number; image?: string; product_id?: string }
    return (
      <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-3`}>
        <div className="max-w-[70%]">
          {!isMine && message.sender && (
            <p className="mb-1 text-xs text-muted-foreground">
              {message.sender.nickname}
            </p>
          )}
          <div className="overflow-hidden rounded-xl border bg-card">
            {meta.product_id ? (
              <Link href={`/product/${meta.product_id}`} className="block">
                {meta.image && (
                  <div className="relative h-32 w-48">
                    <SmartImage src={meta.image} alt={meta.title || '商品'} fill className="object-cover" sizes="192px" />
                  </div>
                )}
                <div className="p-2">
                  <p className="line-clamp-1 text-sm font-medium">{meta.title}</p>
                  {meta.price !== undefined && (
                    <p className="text-sm font-bold text-primary">{formatPrice(meta.price)}</p>
                  )}
                </div>
              </Link>
            ) : (
              <>
                {meta.image && (
                  <div className="relative h-32 w-48">
                    <SmartImage src={meta.image} alt={meta.title || '商品'} fill className="object-cover" sizes="192px" />
                  </div>
                )}
                <div className="p-2">
                  <p className="line-clamp-1 text-sm font-medium">{meta.title}</p>
                  {meta.price !== undefined && (
                    <p className="text-sm font-bold text-primary">{formatPrice(meta.price)}</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  // 普通文本消息
  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className="max-w-[70%]">
        {!isMine && message.sender && (
          <p className="mb-1 text-xs text-muted-foreground">
            {message.sender.nickname}
          </p>
        )}
        <div
          className={`rounded-2xl px-4 py-2.5 ${
            isMine
              ? 'bg-primary text-primary-foreground rounded-br-md'
              : 'bg-muted rounded-bl-md'
          }`}
        >
          {message.type === 'text' && (
            <p className="whitespace-pre-wrap break-words text-sm">
              {message.content}
            </p>
          )}
          {message.type === 'image' && message.content && (
            <div className="relative max-w-48 overflow-hidden rounded-lg">
              <Image
                src={message.content}
                alt="图片消息"
                width={200}
                height={200}
                className="object-cover"
              />
            </div>
          )}
          {!['text', 'image'].includes(message.type) && (
            <p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">
              {message.content || `[${message.type}]`}
            </p>
          )}
        </div>
        <p className={`mt-0.5 text-xs text-muted-foreground ${isMine ? 'text-right' : ''}`}>
          {new Date(message.created_at).toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </div>
  )
}
