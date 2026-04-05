'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { useNotifications } from '@/lib/hooks/useNotifications'
import { cn } from '@/lib/utils'

export default function Navbar({ userId }: { userId: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const { unseenCount } = useNotifications()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const links = [
    { href: '/feed', label: 'Feed' },
    { href: '/messages', label: 'Messages' },
    { href: '/notifications', label: unseenCount > 0 ? `Notifications (${unseenCount})` : 'Notifications' },
    { href: `/profile/${userId}`, label: 'Profile' },
  ]

  return (
    <nav className="bg-white border-b border-[#E2DDD8]">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/feed" className="font-bold text-lg text-[#4A6FA5] tracking-tight">
          Utomopia
        </Link>
        <div className="flex items-center gap-1">
          {links.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'px-3 py-1.5 text-sm rounded-xl transition-colors font-semibold',
                pathname.startsWith(link.href)
                  ? 'bg-[#4A6FA5] text-white'
                  : 'text-[#6B6B6B] hover:text-[#2D2D2D] hover:bg-[#EDE9E3]'
              )}
            >
              {link.label}
            </Link>
          ))}
          <Button variant="ghost" size="sm" onClick={handleSignOut} className="ml-2 text-[#8A8A8A] hover:text-[#2D2D2D] hover:bg-[#EDE9E3] rounded-xl">
            Sign out
          </Button>
        </div>
      </div>
    </nav>
  )
}
