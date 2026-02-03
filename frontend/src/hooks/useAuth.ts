import { create } from 'zustand'
import { authApi } from '../services/api'

interface AuthState {
  isAuthenticated: boolean
  checkAuth: () => void
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

export const useAuth = create<AuthState>((set) => ({
  isAuthenticated: authApi.isAuthenticated(),

  checkAuth: () => {
    set({ isAuthenticated: authApi.isAuthenticated() })
  },

  login: async (email: string, password: string) => {
    await authApi.login(email, password)
    set({ isAuthenticated: true })
  },

  logout: () => {
    authApi.logout()
    set({ isAuthenticated: false })
  },
}))
