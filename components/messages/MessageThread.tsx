'use client'
import { useRef, useEffect, useState } from 'react'
import { useMessages } from '@/lib/hooks/useMessages'
import MessageBubble, { HandoffDivider } from './MessageBubble'
import HandoffCard from './HandoffCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getOtherUser } from '@/lib/utils'

interface MessageThreadProps {
  conversationId: string
  currentUserId: string
}

export default function MessageThread({ conversationId, currentUserId }: MessageThreadProps) {
  const { messages, conversation, loading, handleSend } = useMessages(conversationId)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (loading) return <p className="text-sm text-gray-400 text-center py-8">Loading...</p>
  if (!conversation) return <p className="text-sm text-gray-400 text-center py-8">Conversation not found.</p>

  const otherUser = getOtherUser(conversation, currentUserId)
  const canSend = conversation.status === 'human'
  const showHandoffCard = conversation.status === 'handoff_pending'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || sending) return
    setSending(true)
    await handleSend(input.trim())
    setInput('')
    setSending(false)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="border-b pb-3 mb-3">
        <h2 className="font-medium">{otherUser?.display_name ?? 'Unknown'}</h2>
        <p className="text-xs text-gray-400">
          {conversation.status === 'agent' && 'Twins are talking'}
          {conversation.status === 'handoff_pending' && 'Ready for handoff'}
          {conversation.status === 'human' && 'You are in this conversation'}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {messages.map(msg => {
          if (msg.content === '__HANDOFF_DIVIDER__') {
            return <HandoffDivider key={msg.id} />
          }
          return (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwn={msg.sender_id === currentUserId}
            />
          )
        })}

        {showHandoffCard && (
          <HandoffCard
            conversationId={conversationId}
            summary={conversation.summary}
            otherUserName={otherUser?.display_name ?? 'Someone'}
          />
        )}

        <div ref={bottomRef} />
      </div>

      {canSend ? (
        <form onSubmit={handleSubmit} className="flex gap-2 pt-3 border-t">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
            autoFocus
          />
          <Button type="submit" disabled={sending || !input.trim()}>Send</Button>
        </form>
      ) : (
        <p className="text-xs text-center text-gray-400 pt-3 border-t">
          {conversation.status === 'agent'
            ? 'Your twin is managing this conversation.'
            : 'Waiting for handoff acceptance.'}
        </p>
      )}
    </div>
  )
}
