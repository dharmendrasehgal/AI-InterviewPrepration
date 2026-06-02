'use client'
import { useEffect } from 'react'
import { useAuthStore } from '@/lib/store/auth'
import { refreshAccessToken } from '@/lib/api/client'

export function AuthInitializer() {
  const { setInitialized } = useAuthStore()
  useEffect(() => {
    refreshAccessToken().finally(() => setInitialized())
  }, [setInitialized])
  return null
}
