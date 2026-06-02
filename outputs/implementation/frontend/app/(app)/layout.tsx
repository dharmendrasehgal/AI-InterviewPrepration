'use client'

import { useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/auth'
import { Nav } from '@/components/nav'

export default function AppLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const { accessToken, isInitialized } = useAuthStore()

  useEffect(() => {
    if (isInitialized && !accessToken) {
      router.push('/login')
    }
  }, [isInitialized, accessToken, router])

  if (!isInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div
          className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"
          aria-label="Loading"
          role="status"
        />
      </div>
    )
  }

  if (!accessToken) {
    // Redirect in progress — render nothing
    return null
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Nav />
      <main className="flex-1">{children}</main>
    </div>
  )
}
