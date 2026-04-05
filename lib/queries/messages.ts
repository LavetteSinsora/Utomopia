import { createClient } from '@/lib/supabase/client'
import type { Conversation, Message } from '@/lib/supabase/types'

export async function getConversations(): Promise<Conversation[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('conversations')
    .select(`
      *,
      user_a_profile:profiles!user_a(*),
      user_b_profile:profiles!user_b(*)
    `)
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('messages')
    .select('*, sender:profiles!sender_id(*)')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function sendMessage(conversationId: string, content: string): Promise<Message> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, sender_id: user.id, content, is_agent_generated: false })
    .select('*, sender:profiles!sender_id(*)')
    .single()

  if (error) throw error
  return data
}

export async function getOrCreateConversation(otherUserId: string): Promise<string> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const meId = user.id
  const [user_a, user_b] = meId < otherUserId ? [meId, otherUserId] : [otherUserId, meId]

  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('user_a', user_a)
    .eq('user_b', user_b)
    .maybeSingle()

  if (existing) return existing.id

  const { data, error } = await supabase
    .from('conversations')
    .insert({ user_a, user_b, status: 'human' })
    .select('id')
    .single()

  if (error) throw error
  return data.id
}

export async function getConversation(conversationId: string): Promise<Conversation | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('conversations')
    .select(`*, user_a_profile:profiles!user_a(*), user_b_profile:profiles!user_b(*)`)
    .eq('id', conversationId)
    .single()

  if (error) return null
  return data
}
