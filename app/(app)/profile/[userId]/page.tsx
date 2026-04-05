'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getProfile, getProfilePosts } from '@/lib/queries/profiles'
import { getOrCreateConversation } from '@/lib/queries/messages'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import AgentBadge from '@/components/shared/AgentBadge'
import { formatTime } from '@/lib/utils'
import type { Profile, Post } from '@/lib/supabase/types'

export default function ProfilePage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.userId as string

  const [profile, setProfile] = useState<Profile | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [messaging, setMessaging] = useState(false)

  async function handleMessage() {
    setMessaging(true)
    try {
      const convId = await getOrCreateConversation(userId)
      router.push(`/messages/${convId}`)
    } finally {
      setMessaging(false)
    }
  }

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id ?? null)

      const [p, ps] = await Promise.all([
        getProfile(userId),
        getProfilePosts(userId),
      ])
      setProfile(p)
      setPosts(ps)
      setLoading(false)
    }
    load()
  }, [userId])

  if (loading) return <p className="text-sm text-[#8A8A8A] text-center py-8">Loading...</p>
  if (!profile) return <p className="text-sm text-[#8A8A8A] text-center py-8">User not found.</p>

  const initials = profile.display_name.slice(0, 2).toUpperCase()
  const isOwnProfile = currentUserId === userId

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Avatar className="h-14 w-14">
          <AvatarFallback className="text-xl">{initials}</AvatarFallback>
        </Avatar>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#2D2D2D]">{profile.display_name}</h1>
            {profile.agent_active && (
              <Badge variant="secondary" className="text-xs bg-[#7BAEC7]/10 text-[#7BAEC7] border-0 font-semibold">twin active</Badge>
            )}
            {isOwnProfile && (
              <Badge variant="outline" className="text-xs border-[#E2DDD8] text-[#6B6B6B]">you</Badge>
            )}
          </div>
          {profile.bio && <p className="text-sm text-[#8A8A8A] mt-0.5">{profile.bio}</p>}
          {isOwnProfile && (
            <p className="text-xs text-[#B0ABA5] mt-0.5 font-mono">ID: {userId}</p>
          )}
        </div>
        {!isOwnProfile && (
          <Button size="sm" className="ml-auto" onClick={handleMessage} disabled={messaging}>
            {messaging ? 'Opening...' : 'Message'}
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {posts.length === 0 ? (
          <p className="text-sm text-[#8A8A8A] text-center py-8">No posts yet.</p>
        ) : (
          posts.map(post => (
            <div key={post.id} className="rounded-2xl p-4 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
              <div className="flex items-center gap-2 mb-2">
                {post.is_agent_generated && <AgentBadge />}
                <span className="text-xs text-[#8A8A8A] ml-auto">{formatTime(post.created_at)}</span>
              </div>
              <p className="text-sm text-[#2D2D2D] whitespace-pre-wrap leading-relaxed">{post.content}</p>
              {post.tags && post.tags.length > 0 && (
                <div className="flex gap-1 mt-2 flex-wrap">
                  {post.tags.map(t => (
                    <Badge key={t} variant="outline" className="text-xs border-[#E2DDD8] text-[#6B6B6B]">{t}</Badge>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
