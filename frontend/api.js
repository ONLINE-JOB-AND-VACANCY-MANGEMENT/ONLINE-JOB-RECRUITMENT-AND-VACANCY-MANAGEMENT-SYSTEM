import axios from 'axios'
import { toast } from 'react-toastify'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api',
  headers: { Accept: 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      // A 401 from ANY request means Sanctum rejected the current token, so clearing
      // it here is correct behavior in principle. If you're seeing sessions die
      // mid-use rather than just on refresh, THIS is where it's happening — the
      // console line below shows exactly which request triggered it, which is the
      // key piece of information needed to track down the underlying cause.
      // eslint-disable-next-line no-console
      console.error('401 from', err.config?.method?.toUpperCase(), err.config?.url, '— clearing session.', err.response?.data)
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
    }
    return Promise.reject(err)
  },
)

export default api
