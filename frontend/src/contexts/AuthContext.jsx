import { createContext, useContext, useEffect, useState } from 'react'
import api from '../services/api'
import { toast } from 'react-toastify'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('auth_user')
      if (!stored) return null
      const parsed = JSON.parse(stored)
      // Guard against stale/malformed cached entries (e.g. missing role)
      // from an older app version or a backend response shape change.
      if (!parsed || typeof parsed !== 'object' || !parsed.role) {
        localStorage.removeItem('auth_user')
        localStorage.removeItem('auth_token')
        return null
      }
      return parsed
    } catch {
      localStorage.removeItem('auth_user')
      localStorage.removeItem('auth_token')
      return null
    }
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      setLoading(false)
      return
    }
    api
      .get('/me')
      .then(({ data }) => {
        setUser(data)
        localStorage.setItem('auth_user', JSON.stringify(data))
      })
      .catch(() => {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  async function login(credentials) {
    const { data } = await api.post('/login', credentials)
    localStorage.setItem('auth_token', data.token)
    localStorage.setItem('auth_user', JSON.stringify(data.user))
    setUser(data.user)
    toast.success(data.message || 'Logged in')
    return data.user
  }

  async function register(payload) {
    const { data } = await api.post('/register', payload)
    localStorage.setItem('auth_token', data.token)
    localStorage.setItem('auth_user', JSON.stringify(data.user))
    setUser(data.user)
    toast.success(data.message || 'Registration successful')
    return data.user
  }

  async function logout() {
    try {
      await api.post('/logout')
    } catch {
      // token may already be invalid; clear local state regardless
    }
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
