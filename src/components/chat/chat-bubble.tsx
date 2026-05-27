'use client'

import Image from 'next/image'
import Link from 'next/link'
import { formatPrice } from '@/lib/format'

function formatTime(dateStr: string) {
  const d = new Date(dateStr)
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
}
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

  // 出价消息
  if (message.type === 'offer' && message.metadata) {
    const meta = message.metadata as { amount?: number; product_title?: string }
    return (
      <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-3`}>
        <div className="max-w-[70%]">
          {!isMine && message.sender && (
            <p className="mb-1 text-xs text-muted-foreground">{message.sender.nickname}</p>
          )}
          <div className={`rounded-2xl border-2 border-dashed px-4 py-3 ${isMine ? 'border-primary/40 bg-primary/5' : 'border-orange-400/40 bg-orange-50'}`}>
            <p className="text-xs font-medium text-muted-foreground">💰 出价</p>
            {meta.product_title && <p className="mt-0.5 text-xs text-muted-foreground">商品: {meta.product_title}</p>}
            {meta.amount !== undefined && <p className="mt-1 text-lg font-bold text-primary">¥{meta.amount}</p>}
            {message.content && <p className="mt-1 text-sm">{message.content}</p>}
          </div>
          <p className={`mt-0.5 text-xs text-muted-foreground ${isMine ? 'text-right' : ''}`}>
            {formatTime(message.created_at)}
          </p>
        </div>
      </div>
    )
  }

  // 订单推送消息
  if (message.type === 'order_push' && message.metadata) {
    const meta = message.metadata as { order_no?: string; status?: string; amount?: number }
    return (
      <div className="flex justify-center mb-3">
        <div className="max-w-[80%] rounded-xl border bg-card px-4 py-3">
          <p className="text-xs font-medium text-muted-foreground">📦 订单更新</p>
          {meta.order_no && <p className="mt-1 text-sm">订单号: {meta.order_no}</p>}
          {meta.status && <p className="text-sm">状态: {meta.status}</p>}
          {meta.amount !== undefined && <p className="text-sm font-bold text-primary">¥{meta.amount}</p>}
          {message.content && <p className="mt-1 text-sm text-muted-foreground">{message.content}</p>}
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
          {formatTime(message.created_at)}
        </p>
      </div>
    </div>
  )
}
