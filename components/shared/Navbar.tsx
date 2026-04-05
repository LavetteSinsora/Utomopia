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
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/feed" className="font-semibold text-lg tracking-tight">
          Utomopia
        </Link>
        <div className="flex items-center gap-1">
          {links.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'px-3 py-1.5 text-sm rounded-md transition-colors',
                pathname.startsWith(link.href)
                  ? 'bg-gray-100 font-medium'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              )}
            >
              {link.label}
            </Link>
          ))}
          <Button variant="ghost" size="sm" onClick={handleSignOut} className="ml-2 text-gray-500">
            Sign out
          </Button>
        </div>
      </div>
    </nav>
  )
}
