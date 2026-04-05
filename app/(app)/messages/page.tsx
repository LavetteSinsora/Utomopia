'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getConversations } from '@/lib/queries/messages'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { getOtherUser, formatTime, cn } from '@/lib/utils'
import type { Conversation } from '@/lib/supabase/types'

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setCurrentUserId(user.id)
      const data = await getConversations()
      setConversations(data)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <p className="text-sm text-gray-400 text-center py-8">Loading...</p>

  return (
    <div>
      <h1 className="text-lg font-semibold mb-4">Messages</h1>
      {conversations.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-8">No conversations yet. Your twin will find people!</p>
      )}
      <div className="space-y-1">
        {conversations.map(convo => {
          const other = currentUserId ? getOtherUser(convo, currentUserId) : null
          const initials = other?.display_name?.slice(0, 2).toUpperCase() ?? '??'
          const isHandoffPending = convo.status === 'handoff_pending'
          const isHuman = convo.status === 'human'

          return (
            <Link key={convo.id} href={`/messages/${convo.id}`}>
              <div className={cn(
                'flex items-center gap-3 p-3 rounded-lg transition-colors border',
                isHandoffPending
                  ? 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100'
                  : 'bg-white border-gray-100 hover:bg-gray-50'
              )}>
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{other?.display_name ?? 'Unknown'}</span>
                    {isHandoffPending && (
                      <Badge className="text-xs bg-yellow-100 text-yellow-800 border-yellow-200">
                        Handoff ready
                      </Badge>
                    )}
                    {isHuman && (
                      <Badge variant="outline" className="text-xs">Active</Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 truncate">
                    {convo.status === 'agent' && 'Twins are talking...'}
                    {convo.status === 'handoff_pending' && 'Your twin recommends meeting'}
                    {convo.status === 'human' && 'You are in this conversation'}
                  </p>
                </div>
                <span className="text-xs text-gray-300 shrink-0">{formatTime(convo.created_at)}</span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
