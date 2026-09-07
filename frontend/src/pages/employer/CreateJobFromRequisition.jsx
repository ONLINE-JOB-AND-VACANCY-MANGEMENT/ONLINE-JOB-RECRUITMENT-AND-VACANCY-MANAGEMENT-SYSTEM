import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../services/api'
import { toast } from 'react-toastify'

const WORKPLACE_TYPES = ['onsite', 'remote', 'hybrid']
const EXPERIENCE_LEVELS = ['entry', 'mid', 'senior', 'executive']

export default function CreateJobFromRequisition() {
  const { id } = useParams() // requisition id
  const navigate = useNavigate()

  const [requisition, setRequisition] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({})

  const [form, setForm] = useState({
    title: '',
    description: '',
    workplace_type: 'onsite',
    experience_level: 'entry',
    location: '',
  })

  useEffect(() => {
    api
      .get(`/requisitions/${id}`)
      .then(({ data }) => {
        const req = data.data ?? data
        setRequisition(req)
        setForm((prev) => ({ ...prev, title: req.job_title ?? '' }))
      })
      .catch(() => toast.error('Could not load requisition details.'))
      .finally(() => setLoading(false))
  }, [id])

  function update(field) {
    return (e) => setForm({ ...form, [field]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setErrors({})
    try {
      await api.post('/jobs', { ...form, requisition_id: id })
      toast.success('Job posted successfully')
      navigate('/employer/requisitions')
    } catch (err) {
      const resp = err.response?.data
      setErrors(resp?.errors ?? {})
      toast.error(resp?.message ?? 'Could not create job posting.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="container py-5"><p className="hp-muted">Loading…</p></div>
  if (!requisition) return <div className="container py-5"><p>Requisition not found.</p></div>

  return (
    <div className="container py-5" style={{ maxWidth: 640 }}>
      <p className="hp-eyebrow">{requisition.main_category} · {requisition.department}</p>
      <h1 className="hp-h2 mb-3">Post: {requisition.job_title}</h1>

      <div className="hp-card mb-4">
        <p className="hp-card-meta mb-1">
          <strong>Job type:</strong> {requisition.job_type?.replace('_', ' ')}
        </p>
        <p className="hp-card-meta mb-1">
          <strong>Salary:</strong> {requisition.salary_min ?? '—'} – {requisition.salary_max ?? '—'}
        </p>
        <p className="hp-card-meta mb-1">
          <strong>Application window:</strong> {requisition.start_date ?? 'not set'} to {requisition.end_date ?? 'not set'}
        </p>
        {requisition.requirements && (
          <p className="hp-card-meta mb-1"><strong>Requirements:</strong> {requisition.requirements}</p>
        )}
        {requisition.skills?.length > 0 && (
          <div className="hp-card-skills mt-2">
            {requisition.skills.map((s) => <span className="hp-tag" key={s}>{s}</span>)}
          </div>
        )}
        <p className="hp-muted small mt-2 mb-0">
          These were set by the manager and by HR during approval. To change them, go back and
          use "Edit salary &amp; dates" on the requisition before posting.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="hp-auth-card" style={{ maxWidth: 'none' }}>
        <label className="hp-label form-label">Title</label>
        <input className="form-control mb-1" required value={form.title} onChange={update('title')} />
        {errors.title && <p className="text-danger small">{errors.title[0]}</p>}

        <label className="hp-label form-label mt-3">Description</label>
        <textarea className="form-control mb-1" rows={5} required value={form.description} onChange={update('description')} />
        {errors.description && <p className="text-danger small">{errors.description[0]}</p>}

        <label className="hp-label form-label mt-3">Location (optional)</label>
        <input className="form-control mb-1" value={form.location} onChange={update('location')} />

        <div className="row g-2 mt-2">
          <div className="col-md-6">
            <label className="hp-label form-label">Workplace</label>
            <select className="form-select" value={form.workplace_type} onChange={update('workplace_type')}>
              {WORKPLACE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="col-md-6">
            <label className="hp-label form-label">Experience</label>
            <select className="form-select" value={form.experience_level} onChange={update('experience_level')}>
              {EXPERIENCE_LEVELS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <button className="btn hp-btn-accent w-100 mt-4" disabled={submitting}>
          {submitting ? 'Posting…' : 'Post job'}
        </button>
      </form>
    </div>
  )
}
