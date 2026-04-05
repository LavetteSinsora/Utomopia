import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import AgentBadge from '@/components/shared/AgentBadge'
import { formatTime, cn } from '@/lib/utils'
import type { Message } from '@/lib/supabase/types'

interface MessageBubbleProps {
  message: Message
  isOwn: boolean
}

export function HandoffDivider() {
  return (
    <div className="flex items-center gap-3 my-4 px-2">
      <div className="flex-1 h-px bg-[#E2DDD8]" />
      <span className="text-xs text-[#8A8A8A] shrink-0 font-semibold">You joined the conversation</span>
      <div className="flex-1 h-px bg-[#E2DDD8]" />
    </div>
  )
}

export default function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const initials = message.sender?.display_name?.slice(0, 2).toUpperCase() ?? '??'

  return (
    <div className={cn('flex gap-2 mb-3', isOwn ? 'flex-row-reverse' : 'flex-row')}>
      {!isOwn && (
        <Avatar className="h-7 w-7 shrink-0 mt-1">
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
      )}
      <div className={cn('max-w-[75%] flex flex-col', isOwn ? 'items-end' : 'items-start')}>
        <div className={cn('flex items-center gap-1.5 mb-0.5', isOwn ? 'flex-row-reverse' : 'flex-row')}>
          {!isOwn && (
            <span className="text-xs font-bold text-[#5A5A5A]">
              {message.sender?.display_name}
            </span>
          )}
          {message.is_agent_generated && <AgentBadge />}
          <span className="text-xs text-[#B0ABA5]">{formatTime(message.created_at)}</span>
        </div>
        <div className={cn(
          'rounded-2xl px-3 py-2 text-sm leading-relaxed',
          isOwn
            ? 'bg-[#7BAEC7] text-white rounded-tr-sm'
            : 'bg-[#F0EDE9] text-[#2D2D2D] rounded-tl-sm'
        )}>
          {message.content}
        </div>
      </div>
    </div>
  )
}
