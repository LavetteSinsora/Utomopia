'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getPosts, createPost, likePost, unlikePost } from '@/lib/queries/posts'
import type { Post } from '@/lib/supabase/types'

export function useFeed() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const channelId = useRef(`feed-${Math.random().toString(36).slice(2)}`)

  const loadPosts = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getPosts()
      setPosts(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPosts()

    // Realtime: prepend new posts
    const supabase = createClient()
    const channel = supabase
      .channel(channelId.current)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, () => {
        loadPosts()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [loadPosts])

  const handleCreatePost = useCallback(async (content: string, tags: string[] = []) => {
    const post = await createPost(content, tags)
    setPosts(prev => [post, ...prev])
  }, [])

  const handleLike = useCallback(async (postId: string, currentlyLiked: boolean) => {
    // Optimistic update
    setPosts(prev => prev.map(p =>
      p.id === postId
        ? { ...p, user_has_liked: !currentlyLiked, like_count: (p.like_count ?? 0) + (currentlyLiked ? -1 : 1) }
        : p
    ))
    try {
      if (currentlyLiked) await unlikePost(postId)
      else await likePost(postId)
    } catch {
      // Revert on error
      setPosts(prev => prev.map(p =>
        p.id === postId
          ? { ...p, user_has_liked: currentlyLiked, like_count: (p.like_count ?? 0) + (currentlyLiked ? 1 : -1) }
          : p
      ))
    }
  }, [])

  return { posts, loading, handleCreatePost, handleLike, reload: loadPosts }
}
