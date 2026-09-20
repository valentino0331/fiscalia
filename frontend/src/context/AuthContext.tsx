import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { User } from '@/types'

interface AuthContextValue {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (token: string, user: User) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    const savedToken = localStorage.getItem('hardman_token') || localStorage.getItem('bufete_token')
    const savedUser = localStorage.getItem('hardman_user') || localStorage.getItem('bufete_user')
    if (savedToken && savedUser) {
      try {
        setToken(savedToken)
        setUser(JSON.parse(savedUser))
      } catch {
        localStorage.removeItem('hardman_token')
        localStorage.removeItem('hardman_user')
        localStorage.removeItem('bufete_token')
        localStorage.removeItem('bufete_user')
      }
    }
  }, [])

  const login = (newToken: string, newUser: User) => {
    setToken(newToken)
    setUser(newUser)
    localStorage.setItem('hardman_token', newToken)
    localStorage.setItem('hardman_user', JSON.stringify(newUser))
    localStorage.setItem('bufete_token', newToken)
    localStorage.setItem('bufete_user', JSON.stringify(newUser))
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('hardman_token')
    localStorage.removeItem('hardman_user')
    localStorage.removeItem('bufete_token')
    localStorage.removeItem('bufete_user')
  }

  useEffect(() => {
    const handleUnauthorized = () => {
      logout()
    }
    window.addEventListener('hardman:unauthorized', handleUnauthorized)
    window.addEventListener('bufete:unauthorized', handleUnauthorized)
    return () => {
      window.removeEventListener('hardman:unauthorized', handleUnauthorized)
      window.removeEventListener('bufete:unauthorized', handleUnauthorized)
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token && !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
