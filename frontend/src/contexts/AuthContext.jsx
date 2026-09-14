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
      .catch((err) => {
        const status = err.response?.status

        // Only a genuine 401 ("this token is not valid") means the session is
        // actually dead — that's the one case where logging out is correct.
        if (status === 401) {
          localStorage.removeItem('auth_token')
          localStorage.removeItem('auth_user')
          setUser(null)
          return
        }

        // Any other failure (network error, 500, CORS, timeout) keeps the cached
        // session instead of forcing a logout. This is surfaced as a visible toast,
        // not just a console log — if this keeps happening, screenshot the toast
        // (it includes the exact status/response) so the exact cause can be found
        // instead of guessing further.
        // eslint-disable-next-line no-console
        console.error('Session check on refresh failed (kept existing session):', err)
        toast.error(
          `Session check failed on refresh (status: ${status ?? 'no response / network error'}). ` +
            'Kept your cached login — if actions stop working, this is why. Please report this exact message.',
          { autoClose: false },
        )
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

  async function updateUser(updatedUser) {
    setUser(updatedUser)
    localStorage.setItem('auth_user', JSON.stringify(updatedUser))
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
