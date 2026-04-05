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

  if (loading) return <p className="text-sm text-[#8A8A8A] text-center py-8">Loading...</p>

  return (
    <div>
      <h1 className="text-lg font-bold text-[#2D2D2D] mb-4">Messages</h1>
      {conversations.length === 0 && (
        <p className="text-sm text-[#8A8A8A] text-center py-8">No conversations yet. Your twin will find people!</p>
      )}
      <div className="space-y-2">
        {conversations.map(convo => {
          const other = currentUserId ? getOtherUser(convo, currentUserId) : null
          const initials = other?.display_name?.slice(0, 2).toUpperCase() ?? '??'
          const isHandoffPending = convo.status === 'handoff_pending'
          const isHuman = convo.status === 'human'

          return (
            <Link key={convo.id} href={`/messages/${convo.id}`}>
              <div className={cn(
                'flex items-center gap-3 p-3 rounded-2xl transition-colors border',
                isHandoffPending
                  ? 'bg-[#EEF3FA] border-[#7BAEC7]/30 hover:bg-[#E5EDF7]'
                  : 'bg-white border-[#E2DDD8] hover:bg-[#FAF8F5]'
              )}>
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#2D2D2D]">{other?.display_name ?? 'Unknown'}</span>
                    {isHandoffPending && (
                      <Badge className="text-xs bg-[#7BAEC7]/10 text-[#7BAEC7] border-0 font-semibold">
                        Handoff ready
                      </Badge>
                    )}
                    {isHuman && (
                      <Badge variant="outline" className="text-xs border-[#E2DDD8] text-[#6B6B6B]">Active</Badge>
                    )}
                  </div>
                  <p className="text-xs text-[#8A8A8A] truncate">
                    {convo.status === 'agent' && 'Twins are talking...'}
                    {convo.status === 'handoff_pending' && 'Your twin recommends meeting'}
                    {convo.status === 'human' && 'You are in this conversation'}
                  </p>
                </div>
                <span className="text-xs text-[#B0ABA5] shrink-0">{formatTime(convo.created_at)}</span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
