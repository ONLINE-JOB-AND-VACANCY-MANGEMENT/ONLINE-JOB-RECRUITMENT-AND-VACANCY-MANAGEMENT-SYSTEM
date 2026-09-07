import { useEffect, useState } from 'react'
import api from '../../services/api'
import { toast } from 'react-toastify'

const emptyForm = { name: '', email: '', password: '', password_confirmation: '', role: 'employer', phone: '' }

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({})
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [total, setTotal] = useState(0)

  function load(targetPage = page) {
    setLoading(true)
    api
      .get(`/users?page=${targetPage}`)
      .then(({ data }) => {
        setUsers(data.data ?? data)
        setLastPage(data.meta?.last_page ?? 1)
        setTotal(data.meta?.total ?? (data.data ?? data).length)
        setPage(targetPage)
      })
      .catch(() => setError('Could not load users.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => load(1), [])

  async function toggleActive(user) {
    setBusyId(user.id)
    try {
      await api.patch(`/users/${user.id}/toggle-active`)
      toast.success('User status updated')
      load(page)
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Could not update user.')
    } finally {
      setBusyId(null)
    }
  }

  function update(field) {
    return (e) => setForm({ ...form, [field]: e.target.value })
  }

  async function handleCreateStaff(e) {
    e.preventDefault()
    setSubmitting(true)
    setErrors({})
    try {
      await api.post('/staff', form)
      toast.success('Staff account created')
      setForm(emptyForm)
      setShowForm(false)
      load(1)
    } catch (err) {
      const resp = err.response?.data
      setErrors(resp?.errors ?? {})
      toast.error(resp?.message ?? 'Could not create staff account.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container py-5">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <p className="hp-eyebrow">System administration</p>
          <h1 className="hp-h1 mb-0">Manage users.</h1>
        </div>
        <button className="btn hp-btn-accent" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancel' : 'Create staff account'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreateStaff} className="hp-auth-card mb-4" style={{ maxWidth: 480 }}>
          <label className="hp-label form-label">Full name</label>
          <input className="form-control mb-3" required value={form.name} onChange={update('name')} />

          <label className="hp-label form-label">Email</label>
          <input type="email" className="form-control mb-3" required value={form.email} onChange={update('email')} />
          {errors.email && <p className="text-danger small">{errors.email[0]}</p>}

          <label className="hp-label form-label">Role</label>
          <select className="form-select mb-3" value={form.role} onChange={update('role')}>
            <option value="employer">Employer (HR)</option>
            <option value="manager">Manager</option>
          </select>

          <label className="hp-label form-label">Phone (optional)</label>
          <input className="form-control mb-3" value={form.phone} onChange={update('phone')} />

          <label className="hp-label form-label">Password</label>
          <input type="password" className="form-control mb-3" required value={form.password} onChange={update('password')} />
          {errors.password && <p className="text-danger small">{errors.password[0]}</p>}

          <label className="hp-label form-label">Confirm password</label>
          <input
            type="password"
            className="form-control mb-4"
            required
            value={form.password_confirmation}
            onChange={update('password_confirmation')}
          />

          <button className="btn hp-btn-accent w-100" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create account'}
          </button>
        </form>
      )}

      {loading && <p className="hp-muted">Loading users…</p>}
      {error && <p className="text-danger">{error}</p>}
      {!loading && !error && <p className="hp-muted mb-3">{total} total user{total === 1 ? '' : 's'}</p>}

      <div className="d-flex flex-column gap-2">
        {users.map((u) => (
          <div className="hp-card d-flex flex-wrap justify-content-between align-items-center gap-3 py-3" key={u.id}>
            <div>
              <p className="hp-card-title mb-1" style={{ fontSize: '1rem' }}>{u.name}</p>
              <p className="hp-card-meta mb-0">{u.email} · {u.role?.replace('_', ' ') ?? 'no role'}</p>
            </div>
            <div className="d-flex align-items-center gap-3">
              <span className={`hp-tag ${u.is_active ? '' : 'hp-tag--muted'}`}>
                {u.is_active ? 'Active' : 'Inactive'}
              </span>
              <button className="btn hp-btn-outline btn-sm" disabled={busyId === u.id} onClick={() => toggleActive(u)}>
                {busyId === u.id ? 'Updating…' : u.is_active ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {lastPage > 1 && (
        <div className="d-flex justify-content-center align-items-center gap-3 mt-4">
          <button className="btn hp-btn-outline btn-sm" disabled={page <= 1 || loading} onClick={() => load(page - 1)}>
            ← Previous
          </button>
          <span className="hp-muted">Page {page} of {lastPage}</span>
          <button className="btn hp-btn-outline btn-sm" disabled={page >= lastPage || loading} onClick={() => load(page + 1)}>
            Next →
          </button>
        </div>
      )}
    </div>
  )
}
