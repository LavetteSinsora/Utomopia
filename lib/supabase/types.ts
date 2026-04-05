export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type ConversationStatus = 'agent' | 'handoff_pending' | 'human'
export type NotificationType = 'new_dm' | 'new_comment' | 'handoff_ready'

export interface Profile {
  id: string
  display_name: string
  avatar_url: string | null
  bio: string | null
  agent_active: boolean
  created_at: string
}

export interface Post {
  id: string
  author_id: string
  content: string
  tags: string[]
  is_agent_generated: boolean
  created_at: string
  author?: Profile
  like_count?: number
  comment_count?: number
  user_has_liked?: boolean
}

export interface Comment {
  id: string
  post_id: string
  author_id: string
  content: string
  is_agent_generated: boolean
  created_at: string
  author?: Profile
}

export interface Conversation {
  id: string
  user_a: string
  user_b: string
  status: ConversationStatus
  summary: string | null
  created_at: string
  user_a_profile?: Profile
  user_b_profile?: Profile
  last_message?: Message
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  is_agent_generated: boolean
  created_at: string
  sender?: Profile
}

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  ref_id: string | null
  payload: Json | null
  seen: boolean
  created_at: string
}
