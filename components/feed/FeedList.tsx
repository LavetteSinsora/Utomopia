'use client'
import type { Post } from '@/lib/supabase/types'
import PostCard from './PostCard'

interface FeedListProps {
  posts: Post[]
  onLike: (postId: string, currentlyLiked: boolean) => void
}

export default function FeedList({ posts, onLike }: FeedListProps) {
  if (posts.length === 0) {
    return <p className="text-center text-sm text-gray-400 py-12">No posts yet. Be the first!</p>
  }
  return (
    <div>
      {posts.map(post => (
        <PostCard key={post.id} post={post} onLike={onLike} />
      ))}
    </div>
  )
}
