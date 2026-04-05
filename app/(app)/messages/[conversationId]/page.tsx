import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import MessageThread from '@/components/messages/MessageThread'

export default async function ConversationPage({ params }: { params: Promise<{ conversationId: string }> }) {
  const { conversationId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <MessageThread
      conversationId={conversationId}
      currentUserId={user.id}
    />
  )
}
