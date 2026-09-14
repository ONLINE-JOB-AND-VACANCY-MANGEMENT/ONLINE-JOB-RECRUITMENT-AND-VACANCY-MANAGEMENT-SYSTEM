import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import api from '../services/api'
import { useAuth } from '../contexts/AuthContext'

export default function ChangePassword() {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ password: '', password_confirmation: '' })
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({})

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setErrors({})

    try {
      const { data } = await api.post('/change-password', form)
      await updateUser(data.user)
      toast.success('Password changed successfully.')
      navigate(user.role === 'admin' ? '/admin/users' : '/jobs', { replace: true })
    } catch (err) {
      const response = err.response?.data
      setErrors(response?.errors ?? {})
      toast.error(response?.message ?? 'Could not change your password.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="hp-auth-page">
      <form className="hp-auth-card" onSubmit={handleSubmit}>
        <p className="hp-eyebrow">First login</p>
        <h1 className="hp-h2 mb-3">Change your password</h1>
        <p className="hp-muted mb-4">
          Welcome, {user?.name}. You must replace your temporary password before continuing.
        </p>

        <label className="form-label hp-label">New password</label>
        <input
          type="password"
          className="form-control mb-3"
          required
          minLength="8"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        {errors.password && <p className="text-danger small">{errors.password[0]}</p>}

        <label className="form-label hp-label">Confirm new password</label>
        <input
          type="password"
          className="form-control mb-4"
          required
          minLength="8"
          value={form.password_confirmation}
          onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })}
        />

        <button className="btn hp-btn-accent w-100" disabled={submitting}>
          {submitting ? 'Changing password…' : 'Change password'}
        </button>
      </form>
    </div>
  )
}
