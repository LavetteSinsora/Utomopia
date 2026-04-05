import { createClient } from '@/lib/supabase/client'
import type { Notification } from '@/lib/supabase/types'

export async function getNotifications(unseenOnly = false): Promise<Notification[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (unseenOnly) query = query.eq('seen', false)

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function markNotificationSeen(notificationId: string): Promise<void> {
  const supabase = createClient()
  await supabase.from('notifications').update({ seen: true }).eq('id', notificationId)
}

export async function markAllNotificationsSeen(): Promise<void> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase.from('notifications').update({ seen: true }).eq('user_id', user.id).eq('seen', false)
}

export async function getUnseenCount(): Promise<number> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0

  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('seen', false)

  return count ?? 0
}
