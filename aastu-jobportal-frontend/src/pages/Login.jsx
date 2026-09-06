import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'react-toastify'

const ROLE_HOME = {
  job_seeker: '/jobs',
  manager: '/manager/requisitions',
  employer: '/employer/jobs',
  admin: '/admin/users',
}

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({})

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setErrors({})
    try {
      const user = await login(form)
      const from = location.state?.from
      navigate(from || ROLE_HOME[user.role] || '/jobs')
    } catch (err) {
      const resp = err.response?.data
      setErrors(resp?.errors ?? {})
      toast.error(resp?.message ?? 'Login failed. Check your details.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="hp-auth-page">
      <form className="hp-auth-card" onSubmit={handleSubmit}>
        <p className="hp-eyebrow">Welcome back</p>
        <h1 className="hp-h2 mb-4">Log in to AASTU JobPortal</h1>

        <label className="form-label hp-label">Email</label>
        <input
          type="email"
          className="form-control mb-3"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        {errors.email && <p className="text-danger small">{errors.email[0]}</p>}

        <label className="form-label hp-label">Password</label>
        <input
          type="password"
          className="form-control mb-4"
          required
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />

        <button className="btn hp-btn-accent w-100" disabled={submitting}>
          {submitting ? 'Logging in…' : 'Log in'}
        </button>

        <p className="hp-muted mt-3 mb-0">
          New here? <Link to="/register">Create a job seeker account</Link>
        </p>
      </form>
    </div>
  )
}
