'use client'

import { useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface SmartImageProps {
  src: string
  alt: string
  fill?: boolean
  width?: number
  height?: number
  className?: string
  sizes?: string
  priority?: boolean
}

/**
 * 智能图片组件：data URI 用 <img>，其他用 Next.js <Image>
 * 解决 SVG data URI 无法通过 Next.js 图片优化代理的问题
 */
export function SmartImage({ src, alt, fill, width, height, className, sizes, priority }: SmartImageProps) {
  const isDataUri = src.startsWith('data:')
  const [failed, setFailed] = useState(false)

  if (isDataUri) {
    if (failed) {
      return (
        <div className={cn('flex items-center justify-center bg-muted text-muted-foreground text-xs', fill ? 'absolute inset-0' : '', className)}>
          加载失败
        </div>
      )
    }

    if (fill) {
      return (
        <img
          src={src}
          alt={alt}
          className={cn('absolute inset-0 h-full w-full', className)}
          loading={priority ? 'eager' : 'lazy'}
          onError={() => setFailed(true)}
        />
      )
    }
    return (
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        loading={priority ? 'eager' : 'lazy'}
        onError={() => setFailed(true)}
      />
    )
  }

  if (failed) {
    return (
      <div className={cn('flex items-center justify-center bg-muted text-muted-foreground text-xs', fill ? 'absolute inset-0' : '', className)}>
        加载失败
      </div>
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      className={className}
      sizes={sizes}
      priority={priority}
      onError={() => setFailed(true)}
    />
  )
}
