import { create } from 'zustand'

interface User { id: string; role: 'candidate' | 'expert' | 'admin' }

interface AuthState {
  accessToken: string | null
  user: User | null
  isInitialized: boolean
  setAccessToken: (token: string | null) => void
  setUser: (user: User | null) => void
  setInitialized: () => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  isInitialized: false,
  setAccessToken: (token) => set({ accessToken: token }),
  setUser: (user) => set({ user }),
  setInitialized: () => set({ isInitialized: true }),
  logout: () => set({ accessToken: null, user: null }),
}))
