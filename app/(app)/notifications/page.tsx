'use client'
import Link from 'next/link'
import { useNotifications } from '@/lib/hooks/useNotifications'
import { useHandoff } from '@/lib/hooks/useHandoff'
import { Button } from '@/components/ui/button'
import { formatTime } from '@/lib/utils'
import type { Notification } from '@/lib/supabase/types'

function HandoffNotification({ notification, onMarkSeen }: {
  notification: Notification
  onMarkSeen: (id: string) => void
}) {
  const { handleAccept, accepting } = useHandoff(notification.ref_id ?? '')
  const payload = notification.payload as { summary?: string } | null

  return (
    <div className={`rounded-2xl p-4 bg-white border ${!notification.seen ? 'border-[#4A6FA5]' : 'border-[#E2DDD8]'}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-[#2D2D2D]">Your twin found someone worth meeting</p>
          {payload?.summary && (
            <p className="text-sm text-[#5A5A5A] mt-1 italic">"{payload.summary}"</p>
          )}
          <p className="text-xs text-[#8A8A8A] mt-2">{formatTime(notification.created_at)}</p>
        </div>
        <div className="flex flex-col gap-1 shrink-0">
          {notification.ref_id && (
            <Link href={`/messages/${notification.ref_id}`}>
              <Button variant="outline" size="sm" className="w-full border-[#E2DDD8] text-[#2D2D2D] hover:bg-[#FAF8F5]" onClick={() => onMarkSeen(notification.id)}>
                See conversation
              </Button>
            </Link>
          )}
          <Button
            size="sm"
            disabled={accepting || !notification.ref_id}
            onClick={async () => {
              await handleAccept()
              onMarkSeen(notification.id)
            }}
          >
            {accepting ? 'Taking over...' : 'Take over'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function SimpleNotification({ notification, onMarkSeen }: {
  notification: Notification
  onMarkSeen: (id: string) => void
}) {
  const labels: Record<string, string> = {
    new_dm: 'New message',
    new_comment: 'New comment on your post',
  }

  return (
    <div
      className={`rounded-2xl p-4 bg-white cursor-pointer border ${!notification.seen ? 'border-[#4A6FA5]/50' : 'border-[#E2DDD8]'}`}
      onClick={() => onMarkSeen(notification.id)}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[#2D2D2D]">{labels[notification.type] ?? notification.type}</p>
          {notification.ref_id && notification.type === 'new_dm' && (
            <Link href={`/messages/${notification.ref_id}`} className="text-xs text-[#4A6FA5] underline">
              Go to message
            </Link>
          )}
        </div>
        <span className="text-xs text-[#8A8A8A] shrink-0">{formatTime(notification.created_at)}</span>
      </div>
    </div>
  )
}

export default function NotificationsPage() {
  const { notifications, loading, handleMarkSeen, handleMarkAllSeen } = useNotifications()

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-[#2D2D2D]">Notifications</h1>
        <Button variant="ghost" size="sm" onClick={handleMarkAllSeen} className="text-[#8A8A8A] hover:text-[#2D2D2D] hover:bg-[#EDE9E3] rounded-xl">
          Mark all seen
        </Button>
      </div>

      {loading && <p className="text-sm text-[#8A8A8A] text-center py-8">Loading...</p>}
      {!loading && notifications.length === 0 && (
        <p className="text-sm text-[#8A8A8A] text-center py-8">No notifications yet.</p>
      )}

      <div className="space-y-2">
        {notifications.map(n =>
          n.type === 'handoff_ready'
            ? <HandoffNotification key={n.id} notification={n} onMarkSeen={handleMarkSeen} />
            : <SimpleNotification key={n.id} notification={n} onMarkSeen={handleMarkSeen} />
        )}
      </div>
    </div>
  )
}
