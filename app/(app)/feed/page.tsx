'use client'
import { useFeed } from '@/lib/hooks/useFeed'
import PostComposer from '@/components/feed/PostComposer'
import FeedList from '@/components/feed/FeedList'

export default function FeedPage() {
  const { posts, loading, handleCreatePost, handleLike } = useFeed()

  return (
    <div>
      <PostComposer onSubmit={handleCreatePost} />
      {loading ? (
        <p className="text-center text-sm text-gray-400 py-8">Loading feed...</p>
      ) : (
        <FeedList posts={posts} onLike={handleLike} />
      )}
    </div>
  )
}
