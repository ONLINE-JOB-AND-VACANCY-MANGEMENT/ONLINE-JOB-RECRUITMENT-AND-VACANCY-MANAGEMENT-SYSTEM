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
    first_name: '',
    middle_name: '',
    last_name: '',
    cgpa: '',
    graduation_university: '',
    worked_company: '',
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
      <form className="hp-auth-card" onSubmit={handleSubmit} style={{ maxWidth: 480 }}>
        <p className="hp-eyebrow">Job seekers only</p>
        <h1 className="hp-h2 mb-4">Create your account</h1>

        <label className="form-label hp-label">Full name</label>
        <input className="form-control mb-3" required value={form.name} onChange={update('name')} />

        <div className="row g-2 mb-1">
          <div className="col-md-4">
            <label className="form-label hp-label">First name</label>
            <input className="form-control" required value={form.first_name} onChange={update('first_name')} />
            {errors.first_name && <p className="text-danger small">{errors.first_name[0]}</p>}
          </div>
          <div className="col-md-4">
            <label className="form-label hp-label">Middle name</label>
            <input className="form-control" required value={form.middle_name} onChange={update('middle_name')} />
            {errors.middle_name && <p className="text-danger small">{errors.middle_name[0]}</p>}
          </div>
          <div className="col-md-4">
            <label className="form-label hp-label">Last name</label>
            <input className="form-control" required value={form.last_name} onChange={update('last_name')} />
            {errors.last_name && <p className="text-danger small">{errors.last_name[0]}</p>}
          </div>
        </div>
        <p className="hp-muted small mb-3">
          Used for official records; "Full name" above is what's shown around the app.
        </p>

        <label className="form-label hp-label">Email</label>
        <input type="email" className="form-control mb-3" required value={form.email} onChange={update('email')} />
        {errors.email && <p className="text-danger small">{errors.email[0]}</p>}

        <label className="form-label hp-label">Phone</label>
        <input className="form-control mb-3" required value={form.phone} onChange={update('phone')} />
        {errors.phone && <p className="text-danger small">{errors.phone[0]}</p>}

        <label className="form-label hp-label">Address (optional)</label>
        <input className="form-control mb-3" value={form.address} onChange={update('address')} />

        <label className="form-label hp-label">Graduation university (optional)</label>
        <input className="form-control mb-3" value={form.graduation_university} onChange={update('graduation_university')} />

        <div className="row g-2 mb-3">
          <div className="col-6">
            <label className="form-label hp-label">CGPA (optional, out of 4.0)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="4"
              className="form-control"
              value={form.cgpa}
              onChange={update('cgpa')}
            />
            {errors.cgpa && <p className="text-danger small">{errors.cgpa[0]}</p>}
          </div>
          <div className="col-6">
            <label className="form-label hp-label">Previously worked at (optional)</label>
            <input className="form-control" value={form.worked_company} onChange={update('worked_company')} />
          </div>
        </div>

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
