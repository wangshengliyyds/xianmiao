'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAuthStore } from '@/stores/auth-store'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import {
  Heart, MessageCircle, Share2, ImagePlus,
  Globe, Loader2,
} from 'lucide-react'
import { formatRelativeTime } from '@/lib/format'
import { cn } from '@/lib/utils'

interface CirclePost {
  id: string
  user: { id: string; nickname: string; avatar_url: string | null }
  content: string
  images: string[]
  likes: number
  comments: number
  isLiked: boolean
  created_at: string
}

const MOCK_POSTS: CirclePost[] = [
  {
    id: '1',
    user: { id: '1', nickname: '闲妙用户', avatar_url: null },
    content: '今天刚入手了一台二手MacBook Pro，成色很好，卖家也很nice！推荐大家来闲妙淘好物~',
    images: [],
    likes: 12,
    comments: 3,
    isLiked: false,
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: '2',
    user: { id: '2', nickname: '数码达人', avatar_url: null },
    content: '分享一个鉴定二手手机的小技巧：先看外观有没有划痕，再检查电池健康度，最后跑个分测试性能。记住，买二手一定要当面验货！',
    images: [],
    likes: 28,
    comments: 7,
    isLiked: true,
    created_at: new Date(Date.now() - 7200000).toISOString(),
  },
]

export default function CirclePage() {
  const router = useRouter()
  const { user, profile } = useAuthStore()
  const [posts, setPosts] = useState<CirclePost[]>(MOCK_POSTS)
  const [showComposer, setShowComposer] = useState(false)
  const [newContent, setNewContent] = useState('')
  const [posting, setPosting] = useState(false)

  const handlePost = () => {
    if (!newContent.trim()) {
      toast.error('请输入内容')
      return
    }
    if (!user) {
      toast.error('请先登录')
      router.push('/login')
      return
    }

    setPosting(true)
    setTimeout(() => {
      const newPost: CirclePost = {
        id: Date.now().toString(),
        user: { id: user.id, nickname: profile?.nickname || '用户', avatar_url: profile?.avatar_url || null },
        content: newContent,
        images: [],
        likes: 0,
        comments: 0,
        isLiked: false,
        created_at: new Date().toISOString(),
      }
      setPosts([newPost, ...posts])
      setNewContent('')
      setShowComposer(false)
      setPosting(false)
      toast.success('发布成功')
    }, 500)
  }

  const handleLike = (postId: string) => {
    setPosts(posts.map((p) => {
      if (p.id === postId) {
        return { ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 }
      }
      return p
    }))
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* 顶部 */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b bg-background px-4 py-3">
        <h1 className="flex items-center gap-1 text-lg font-semibold">
          <Globe className="h-5 w-5 text-primary" />
          妙友圈
        </h1>
        <Button
          size="sm"
          onClick={() => {
            if (!user) {
              toast.error('请先登录')
              router.push('/login')
              return
            }
            setShowComposer(!showComposer)
          }}
        >
          发帖
        </Button>
      </div>

      {/* 发帖框 */}
      {showComposer && (
        <div className="border-b bg-card px-4 py-3">
          <div className="flex gap-3">
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback>{profile?.nickname?.[0] || '用'}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Textarea
                placeholder="分享你的淘好物心得..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                className="min-h-[80px] resize-none border-0 bg-transparent p-0 text-sm focus-visible:ring-0"
              />
              <div className="mt-2 flex items-center justify-between">
                <button className="text-muted-foreground hover:text-foreground">
                  <ImagePlus className="h-5 w-5" />
                </button>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setShowComposer(false)}>取消</Button>
                  <Button size="sm" onClick={handlePost} disabled={posting || !newContent.trim()}>
                    {posting && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                    发布
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 帖子列表 */}
      <div className="divide-y">
        {posts.map((post) => (
          <div key={post.id} className="px-4 py-4">
            <div className="mb-2 flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarImage src={post.user.avatar_url || undefined} />
                <AvatarFallback>{post.user.nickname[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{post.user.nickname}</p>
                <p className="text-xs text-muted-foreground">{formatRelativeTime(post.created_at)}</p>
              </div>
            </div>

            <p className="whitespace-pre-wrap text-sm leading-relaxed">{post.content}</p>

            {post.images.length > 0 && (
              <div className="mt-2 grid grid-cols-3 gap-1">
                {post.images.map((img, i) => (
                  <div key={i} className="relative aspect-square overflow-hidden rounded-lg bg-muted">
                    <Image src={img} alt="" fill className="object-cover" sizes="33vw" />
                  </div>
                ))}
              </div>
            )}

            <div className="mt-3 flex items-center gap-6">
              <button
                onClick={() => handleLike(post.id)}
                className={cn(
                  'flex items-center gap-1 text-sm transition-colors',
                  post.isLiked ? 'text-red-500' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Heart className={cn('h-4 w-4', post.isLiked && 'fill-red-500')} />
                {post.likes > 0 && post.likes}
              </button>
              <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                <MessageCircle className="h-4 w-4" />
                {post.comments > 0 && post.comments}
              </button>
              <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                <Share2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {posts.length === 0 && (
        <div className="py-20 text-center">
          <Globe className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">暂无帖子</p>
          <p className="mt-1 text-xs text-muted-foreground">来发第一帖吧</p>
        </div>
      )}
    </div>
  )
}
