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
    <div className={`border rounded-lg p-4 bg-white ${!notification.seen ? 'border-black' : 'border-gray-200'}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">Your twin found someone worth meeting</p>
          {payload?.summary && (
            <p className="text-sm text-gray-600 mt-1 italic">"{payload.summary}"</p>
          )}
          <p className="text-xs text-gray-400 mt-2">{formatTime(notification.created_at)}</p>
        </div>
        <div className="flex flex-col gap-1 shrink-0">
          {notification.ref_id && (
            <Link href={`/messages/${notification.ref_id}`}>
              <Button variant="outline" size="sm" className="w-full" onClick={() => onMarkSeen(notification.id)}>
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
      className={`border rounded-lg p-4 bg-white cursor-pointer ${!notification.seen ? 'border-gray-400' : 'border-gray-100'}`}
      onClick={() => onMarkSeen(notification.id)}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm">{labels[notification.type] ?? notification.type}</p>
          {notification.ref_id && notification.type === 'new_dm' && (
            <Link href={`/messages/${notification.ref_id}`} className="text-xs text-blue-500 underline">
              Go to message
            </Link>
          )}
        </div>
        <span className="text-xs text-gray-400 shrink-0">{formatTime(notification.created_at)}</span>
      </div>
    </div>
  )
}

export default function NotificationsPage() {
  const { notifications, loading, handleMarkSeen, handleMarkAllSeen } = useNotifications()

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold">Notifications</h1>
        <Button variant="ghost" size="sm" onClick={handleMarkAllSeen} className="text-gray-400">
          Mark all seen
        </Button>
      </div>

      {loading && <p className="text-sm text-gray-400 text-center py-8">Loading...</p>}
      {!loading && notifications.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-8">No notifications yet.</p>
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
