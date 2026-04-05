'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getMessages, sendMessage, getConversation } from '@/lib/queries/messages'
import type { Message, Conversation } from '@/lib/supabase/types'

export function useMessages(conversationId: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [loading, setLoading] = useState(true)
  const msgChannelId = useRef(`messages-${conversationId}-${Math.random().toString(36).slice(2)}`)
  const convoChannelId = useRef(`conversation-${conversationId}-${Math.random().toString(36).slice(2)}`)

  useEffect(() => {
    let cancelled = false
    async function loadAll() {
      setLoading(true)
      try {
        const [msgs, convo] = await Promise.all([
          getMessages(conversationId),
          getConversation(conversationId),
        ])
        if (!cancelled) {
          setMessages(msgs)
          setConversation(convo)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadAll()

    const supabase = createClient()

    const msgChannel = supabase
      .channel(msgChannelId.current)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      }, (payload) => {
        setMessages(prev => {
          const msg = payload.new as Message
          if (prev.find(m => m.id === msg.id)) return prev
          return [...prev, msg]
        })
      })
      .subscribe()

    const convoChannel = supabase
      .channel(convoChannelId.current)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'conversations',
        filter: `id=eq.${conversationId}`
      }, (payload) => {
        setConversation(prev => prev ? { ...prev, ...payload.new } : null)
      })
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(msgChannel)
      supabase.removeChannel(convoChannel)
    }
  }, [conversationId])

  async function handleSend(content: string) {
    const msg = await sendMessage(conversationId, content)
    setMessages(prev => prev.find(m => m.id === msg.id) ? prev : [...prev, msg])
  }

  return { messages, conversation, loading, handleSend }
}
