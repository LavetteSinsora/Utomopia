import { createClient } from '@/lib/supabase/client'

export async function acceptHandoff(conversationId: string): Promise<void> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Update conversation status to 'human'
  const { error } = await supabase
    .from('conversations')
    .update({ status: 'human' })
    .eq('id', conversationId)

  if (error) throw error

  // Insert the visual divider message
  await supabase.from('messages').insert({
    conversation_id: conversationId,
    sender_id: user.id,
    content: '__HANDOFF_DIVIDER__',
    is_agent_generated: false,
  })

  // Mark the handoff notification as seen
  await supabase
    .from('notifications')
    .update({ seen: true })
    .eq('user_id', user.id)
    .eq('ref_id', conversationId)
    .eq('type', 'handoff_ready')
}
