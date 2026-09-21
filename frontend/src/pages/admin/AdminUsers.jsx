import { useEffect, useState } from 'react'
import api from '../../services/api'
import { toast } from 'react-toastify'

const emptyForm = {
  name: '',
  father_name: '',
  last_name: '',
  email: '',
  password: '',
  password_confirmation: '',
  role: 'employer',
  phone: '',
  department_id: '',
}

function formatAastuEmail(name, fatherName) {
  const normalize = (value) =>
    value
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '.')
      .replace(/[^a-z0-9.]/g, '')
      .replace(/\.{2,}/g, '.')
      .replace(/^\.+|\.+$/g, '')

  const namePart = normalize(name)
  const fatherNamePart = normalize(fatherName)

  return namePart && fatherNamePart ? `${namePart}.${fatherNamePart}@aastu.edu.net` : ''
}

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [departments, setDepartments] = useState([])
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
  const [stats, setStats] = useState({})
  const [filters, setFilters] = useState({ search: '', role: '', status: '' })
  const [appliedFilters, setAppliedFilters] = useState({ search: '', role: '', status: '' })

  function load(targetPage = page, activeFilters = appliedFilters) {
    setLoading(true)
    const params = new URLSearchParams({ page: String(targetPage) })
    Object.entries(activeFilters).forEach(([key, value]) => {
      if (value) params.set(key, value)
    })

    api
      .get(`/users?${params.toString()}`)
      .then(({ data }) => {
        setUsers(data.data ?? data)
        setLastPage(data.meta?.last_page ?? 1)
        setTotal(data.meta?.total ?? (data.data ?? data).length)
        setStats(data.stats ?? {})
        setPage(targetPage)
      })
      .catch(() => setError('Could not load users.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => load(1, {}), []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Departments are only needed for the manager department picker, but cheap
    // enough to load up front so switching the role dropdown is instant.
    api.get('/departments').then(({ data }) => setDepartments(data)).catch(() => {})
  }, [])

  async function toggleActive(user) {
    const action = user.is_active ? 'deactivate' : 'activate'
    if (!window.confirm(`Are you sure you want to ${action} ${user.name}'s account?`)) return
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
    return (e) => {
      const value = e.target.value
      setForm((previous) => {
        const next = { ...previous, [field]: value }

        if (field === 'name' || field === 'father_name') {
          next.email = formatAastuEmail(next.name, next.father_name)
        }

        return next
      })
    }
  }

  function updateFilter(field) {
    return (e) => setFilters((previous) => ({ ...previous, [field]: e.target.value }))
  }

  function applyFilters(e) {
    e.preventDefault()
    setAppliedFilters(filters)
    load(1, filters)
  }

  function resetFilters() {
    const emptyFilters = { search: '', role: '', status: '' }
    setFilters(emptyFilters)
    setAppliedFilters(emptyFilters)
    load(1, emptyFilters)
  }

  async function exportUsers() {
    try {
      const params = new URLSearchParams()
      Object.entries(appliedFilters).forEach(([key, value]) => {
        if (value) params.set(key, value)
      })
      const response = await api.get(`/users/export?${params.toString()}`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }))
      const link = document.createElement('a')
      link.href = url
      link.download = 'users.csv'
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Could not export users.')
    }
  }

  async function handleCreateStaff(e) {
    e.preventDefault()
    if (!window.confirm(`Create this ${form.role === 'employer' ? 'HR' : 'manager'} staff account with the generated AASTU email?`)) return
    setSubmitting(true)
    setErrors({})
    try {
      const { data } = await api.post('/staff', form)
      toast.success(`Staff account created: ${data.user.email}`)
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

      <div className="row g-3 mb-4">
        {[
          ['Total users', stats.total],
          ['Active users', stats.active],
          ['Job seekers', stats.job_seekers],
          ['Employers', stats.employers],
          ['Managers', stats.managers],
        ].map(([label, value]) => (
          <div className="col-sm-6 col-lg" key={label}>
            <div className="hp-card h-100">
              <p className="hp-card-meta mb-2">{label}</p>
              <p className="hp-h2 mb-0">{value ?? '—'}</p>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <form onSubmit={handleCreateStaff} className="hp-auth-card mb-4" style={{ maxWidth: 480 }}>
          <label className="hp-label form-label">Person&apos;s name</label>
          <input className="form-control mb-3" required value={form.name} onChange={update('name')} />

          <label className="hp-label form-label">Father&apos;s name</label>
          <input className="form-control mb-3" required value={form.father_name} onChange={update('father_name')} />
          {errors.father_name && <p className="text-danger small">{errors.father_name[0]}</p>}

          <label className="hp-label form-label">Last name</label>
          <input className="form-control mb-3" required value={form.last_name} onChange={update('last_name')} />
          {errors.last_name && <p className="text-danger small">{errors.last_name[0]}</p>}

          <label className="hp-label form-label">Email</label>
          <input
            type="email"
            className="form-control mb-3"
            required
            readOnly
            value={form.email}
            placeholder="Generated from the name fields"
          />
          <p className="hp-muted small mb-3">AASTU staff email is generated automatically.</p>
          {errors.email && <p className="text-danger small">{errors.email[0]}</p>}

          <label className="hp-label form-label">Role</label>
          <select className="form-select mb-3" value={form.role} onChange={update('role')}>
            <option value="employer">Employer (HR)</option>
            <option value="manager">Manager</option>
          </select>

          {form.role === 'manager' && (
            <>
              <label className="hp-label form-label">Department</label>
              <select className="form-select mb-3" value={form.department_id} onChange={update('department_id')}>
                <option value="">No department yet</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              {errors.department_id && <p className="text-danger small">{errors.department_id[0]}</p>}
            </>
          )}

          <label className="hp-label form-label">Phone</label>
          <input
            type="tel"
            className="form-control mb-3"
            required
            pattern="(?:09\d{8}|07\d{8}|\+2519\d{8}|\+2717\d{8})"
            title="Use 09XXXXXXXX, 07XXXXXXXX, +2519XXXXXXXX, or +2717XXXXXXXX"
            placeholder="09XXXXXXXX or 07XXXXXXXX"
            value={form.phone}
            onChange={update('phone')}
          />
          {errors.phone && <p className="text-danger small">{errors.phone[0]}</p>}

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

      <form onSubmit={applyFilters} className="hp-card mb-4">
        <div className="row g-2 align-items-end">
          <div className="col-lg-5">
            <label className="hp-label form-label">Search users</label>
            <input
              className="form-control"
              placeholder="Name, email, or phone"
              value={filters.search}
              onChange={updateFilter('search')}
            />
          </div>
          <div className="col-sm-6 col-lg-2">
            <label className="hp-label form-label">Role</label>
            <select className="form-select" value={filters.role} onChange={updateFilter('role')}>
              <option value="">All roles</option>
              <option value="job_seeker">Job seeker</option>
              <option value="employer">Employer</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="col-sm-6 col-lg-2">
            <label className="hp-label form-label">Status</label>
            <select className="form-select" value={filters.status} onChange={updateFilter('status')}>
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="col-lg-3 d-flex gap-2">
            <button className="btn hp-btn-accent flex-grow-1">Apply filters</button>
            <button type="button" className="btn hp-btn-outline" onClick={resetFilters}>Reset</button>
          </div>
        </div>
      </form>

      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        {!loading && !error && <p className="hp-muted mb-0">{total} matching user{total === 1 ? '' : 's'}</p>}
        <button type="button" className="btn hp-btn-outline btn-sm ms-auto" onClick={exportUsers}>
          Export CSV
        </button>
      </div>

      {loading && <p className="hp-muted">Loading users…</p>}
      {error && <p className="text-danger">{error}</p>}

      <div className="d-flex flex-column gap-2">
        {users.map((u) => (
          <div className="hp-card d-flex flex-wrap justify-content-between align-items-center gap-3 py-3" key={u.id}>
            <div>
              <p className="hp-card-title mb-1" style={{ fontSize: '1rem' }}>{u.name}</p>
              <p className="hp-card-meta mb-0">
                {u.email} · {u.role?.replace('_', ' ') ?? 'no role'}
                {u.department ? ` · ${u.department}` : ''}
              </p>
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
