import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'react-toastify'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    phone: '',
    address: '',
    role: 'job_seeker',
  })
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({})

  function update(field) {
    return (e) => setForm({ ...form, [field]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setErrors({})
    try {
      await register(form)
      navigate('/jobs')
    } catch (err) {
      const resp = err.response?.data
      setErrors(resp?.errors ?? {})
      toast.error(resp?.message ?? 'Could not create your account.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="hp-auth-page">
      <form className="hp-auth-card" onSubmit={handleSubmit}>
        <p className="hp-eyebrow">Job seekers only</p>
        <h1 className="hp-h2 mb-4">Create your account</h1>

        <label className="form-label hp-label">Full name</label>
        <input className="form-control mb-3" required value={form.name} onChange={update('name')} />

        <label className="form-label hp-label">Email</label>
        <input type="email" className="form-control mb-3" required value={form.email} onChange={update('email')} />
        {errors.email && <p className="text-danger small">{errors.email[0]}</p>}

        <label className="form-label hp-label">Phone (optional)</label>
        <input className="form-control mb-3" value={form.phone} onChange={update('phone')} />

        <label className="form-label hp-label">Address (optional)</label>
        <input className="form-control mb-3" value={form.address} onChange={update('address')} />

        <label className="form-label hp-label">Password</label>
        <input type="password" className="form-control mb-3" required value={form.password} onChange={update('password')} />
        {errors.password && <p className="text-danger small">{errors.password[0]}</p>}

        <label className="form-label hp-label">Confirm password</label>
        <input
          type="password"
          className="form-control mb-4"
          required
          value={form.password_confirmation}
          onChange={update('password_confirmation')}
        />

        <button className="btn hp-btn-accent w-100" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Create account'}
        </button>

        <p className="hp-muted mt-3 mb-0">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </div>
  )
}
