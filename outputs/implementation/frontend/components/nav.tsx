'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/auth'
import { authApi } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const CANDIDATE_LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/questions', label: 'Questions' },
  { href: '/mock-session', label: 'AI Practice' },
  { href: '/experts', label: 'Experts' },
  { href: '/playbooks', label: 'Playbooks' },
]

const EXPERT_LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/questions', label: 'Questions' },
  { href: '/account/bookings', label: 'My Sessions' },
]

const ADMIN_LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/questions', label: 'Questions' },
  { href: '/admin/experts', label: 'Expert Approvals' },
]

export function Nav() {
  const pathname = usePathname()
  const router = useRouter()
  const { accessToken, user, logout } = useAuthStore()

  const navLinks =
    user?.role === 'admin' ? ADMIN_LINKS :
    user?.role === 'expert' ? EXPERT_LINKS :
    CANDIDATE_LINKS

  async function handleLogout() {
    try {
      await authApi.logout()
    } catch {
      // silently ignore — we log out locally regardless
    }
    logout()
    router.push('/login')
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center px-4">
        {/* Brand */}
        <Link href="/" className="mr-6 flex items-center font-semibold text-foreground">
          InterviewPrep AI
        </Link>

        {/* Nav links */}
        {accessToken && (
          <nav className="flex flex-1 items-center gap-1" aria-label="Main navigation">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'rounded-md px-3 py-2 text-sm font-medium transition-colors hover:text-foreground',
                  pathname === href || pathname.startsWith(href + '/')
                    ? 'bg-accent text-foreground'
                    : 'text-muted-foreground',
                )}
              >
                {label}
              </Link>
            ))}
          </nav>
        )}

        {/* Right side */}
        <div className="ml-auto flex items-center gap-2">
          {accessToken ? (
            <div className="flex items-center gap-2">
              {user?.role !== 'admin' && (
                <Link href="/account/bookings">
                  <Button variant="ghost" size="sm">My Bookings</Button>
                </Link>
              )}
              {user?.role === 'candidate' && (
                <Link href="/experts/apply">
                  <Button variant="ghost" size="sm">Become Expert</Button>
                </Link>
              )}
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Log out
              </Button>
            </div>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">Sign in</Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Get started</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
