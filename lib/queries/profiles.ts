import { createClient } from '@/lib/supabase/client'
import type { Profile, Post } from '@/lib/supabase/types'

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) return null
  return data
}

export async function getCurrentUser(): Promise<{ user: any; profile: Profile | null }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, profile: null }
  const profile = await getProfile(user.id)
  return { user, profile }
}

export async function updateProfile(updates: Partial<Pick<Profile, 'display_name' | 'bio' | 'avatar_url'>>): Promise<void> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase.from('profiles').update(updates).eq('id', user.id)
  if (error) throw error
}

export async function getProfilePosts(userId: string): Promise<Post[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('posts')
    .select('*, author:profiles!author_id(*), likes(count), comments(count)')
    .eq('author_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map(p => ({
    ...p,
    like_count: p.likes?.[0]?.count ?? 0,
    comment_count: p.comments?.[0]?.count ?? 0,
    user_has_liked: false,
  }))
}
