'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getNotifications, markNotificationSeen, markAllNotificationsSeen, getUnseenCount } from '@/lib/queries/notifications'
import type { Notification } from '@/lib/supabase/types'

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unseenCount, setUnseenCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const channelId = useRef(`notifications-${Math.random().toString(36).slice(2)}`)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [notifs, count] = await Promise.all([getNotifications(), getUnseenCount()])
      setNotifications(notifs)
      setUnseenCount(count)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()

    const supabase = createClient()
    const channel = supabase
      .channel(channelId.current)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, () => {
        load()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [load])

  const handleMarkSeen = useCallback(async (id: string) => {
    await markNotificationSeen(id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, seen: true } : n))
    setUnseenCount(prev => Math.max(0, prev - 1))
  }, [])

  const handleMarkAllSeen = useCallback(async () => {
    await markAllNotificationsSeen()
    setNotifications(prev => prev.map(n => ({ ...n, seen: true })))
    setUnseenCount(0)
  }, [])

  return { notifications, unseenCount, loading, handleMarkSeen, handleMarkAllSeen, reload: load }
}
