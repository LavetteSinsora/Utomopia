'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import AgentBadge from '@/components/shared/AgentBadge'
import { formatTime } from '@/lib/utils'
import { getComments, createComment } from '@/lib/queries/posts'
import type { Post, Comment } from '@/lib/supabase/types'

interface PostCardProps {
  post: Post
  onLike: (postId: string, currentlyLiked: boolean) => void
}

export default function PostCard({ post, onLike }: PostCardProps) {
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleToggleComments() {
    if (!showComments && comments.length === 0) {
      setLoadingComments(true)
      const data = await getComments(post.id)
      setComments(data)
      setLoadingComments(false)
    }
    setShowComments(prev => !prev)
  }

  async function handleSubmitComment(e: React.FormEvent) {
    e.preventDefault()
    if (!newComment.trim()) return
    setSubmitting(true)
    const comment = await createComment(post.id, newComment.trim())
    setComments(prev => [...prev, comment])
    setNewComment('')
    setSubmitting(false)
  }

  const initials = post.author?.display_name?.slice(0, 2).toUpperCase() ?? '??'

  return (
    <Card className="mb-3">
      <CardContent className="pt-4">
        <div className="flex items-start gap-3">
          <Link href={`/profile/${post.author_id}`}>
            <Avatar className="h-8 w-8 mt-0.5">
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Link href={`/profile/${post.author_id}`} className="text-sm font-bold text-[#2D2D2D] hover:underline">
                {post.author?.display_name ?? 'Unknown'}
              </Link>
              {post.is_agent_generated && <AgentBadge />}
              <span className="text-xs text-[#8A8A8A] ml-auto">{formatTime(post.created_at)}</span>
            </div>

            <p className="text-sm text-[#2D2D2D] whitespace-pre-wrap leading-relaxed">{post.content}</p>

            {post.tags && post.tags.length > 0 && (
              <div className="flex gap-1 mt-2 flex-wrap">
                {post.tags.map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs border-[#E2DDD8] text-[#6B6B6B]">{tag}</Badge>
                ))}
              </div>
            )}

            <div className="flex items-center gap-4 mt-3">
              <button
                onClick={() => onLike(post.id, !!post.user_has_liked)}
                className={`text-sm flex items-center gap-1 transition-colors font-semibold ${post.user_has_liked ? 'text-[#4A6FA5]' : 'text-[#8A8A8A] hover:text-[#4A6FA5]'}`}
              >
                ♡ {post.like_count ?? 0}
              </button>
              <button
                onClick={handleToggleComments}
                className="text-sm text-[#8A8A8A] hover:text-[#4A6FA5] transition-colors font-semibold"
              >
                💬 {post.comment_count ?? 0}
              </button>
            </div>

            {showComments && (
              <div className="mt-3 space-y-2 border-t border-[#E2DDD8] pt-3">
                {loadingComments && <p className="text-xs text-[#8A8A8A]">Loading...</p>}
                {comments.map(c => (
                  <div key={c.id} className="flex gap-2 text-sm">
                    <span className="font-bold text-[#2D2D2D] shrink-0">
                      {c.author?.display_name}
                      {c.is_agent_generated && <span className="ml-1 text-xs text-[#4A6FA5] font-semibold">[AI]</span>}:
                    </span>
                    <span className="text-[#5A5A5A]">{c.content}</span>
                  </div>
                ))}
                <form onSubmit={handleSubmitComment} className="flex gap-2 mt-2">
                  <Input
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    className="text-sm h-8"
                  />
                  <Button type="submit" size="sm" disabled={submitting || !newComment.trim()}>
                    Post
                  </Button>
                </form>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
