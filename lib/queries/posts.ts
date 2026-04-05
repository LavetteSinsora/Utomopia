import { createClient } from '@/lib/supabase/client'
import type { Post, Comment } from '@/lib/supabase/types'

export async function getPosts(limit = 30, offset = 0): Promise<Post[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      author:profiles!author_id(*),
      likes(count),
      comments(count)
    `)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw error

  // Fetch user's own likes to compute user_has_liked
  let likedPostIds = new Set<string>()
  if (user) {
    const { data: likeData } = await supabase
      .from('likes')
      .select('post_id')
      .eq('user_id', user.id)
    likedPostIds = new Set((likeData ?? []).map(l => l.post_id))
  }

  return (data ?? []).map(p => ({
    ...p,
    author: p.author,
    like_count: p.likes?.[0]?.count ?? 0,
    comment_count: p.comments?.[0]?.count ?? 0,
    user_has_liked: likedPostIds.has(p.id),
  }))
}

export async function createPost(content: string, tags: string[] = []): Promise<Post> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('posts')
    .insert({ author_id: user.id, content, tags, is_agent_generated: false })
    .select('*, author:profiles!author_id(*)')
    .single()

  if (error) throw error
  return { ...data, like_count: 0, comment_count: 0, user_has_liked: false }
}

export async function likePost(postId: string): Promise<void> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  await supabase.from('likes').upsert({ post_id: postId, user_id: user.id })
}

export async function unlikePost(postId: string): Promise<void> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', user.id)
}

export async function getComments(postId: string): Promise<Comment[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('comments')
    .select('*, author:profiles!author_id(*)')
    .eq('post_id', postId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function createComment(postId: string, content: string): Promise<Comment> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('comments')
    .insert({ post_id: postId, author_id: user.id, content, is_agent_generated: false })
    .select('*, author:profiles!author_id(*)')
    .single()

  if (error) throw error
  return data
}
