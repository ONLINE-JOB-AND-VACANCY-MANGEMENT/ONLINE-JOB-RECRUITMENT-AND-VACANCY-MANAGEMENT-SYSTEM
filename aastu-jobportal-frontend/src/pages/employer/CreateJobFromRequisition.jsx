import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../services/api'
import { toast } from 'react-toastify'

const JOB_TYPES = ['full_time', 'part_time', 'contract', 'internship']
const WORKPLACE_TYPES = ['onsite', 'remote', 'hybrid']
const EXPERIENCE_LEVELS = ['entry', 'mid', 'senior', 'executive']

export default function CreateJobFromRequisition() {
  const { id } = useParams() // requisition id
  const navigate = useNavigate()

  const [requisition, setRequisition] = useState(null)
  const [allSkills, setAllSkills] = useState([])
  const [suggestedCount, setSuggestedCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({})

  const [form, setForm] = useState({
    title: '',
    description: '',
    requirements: '',
    salary_min: '',
    salary_max: '',
    location: '',
    job_type: 'full_time',
    workplace_type: 'onsite',
    experience_level: 'entry',
    start_date: '',
    end_date: '',
    skills: [],
  })

  useEffect(() => {
    async function init() {
      const [reqRes, catRes, skillRes] = await Promise.all([
        api.get(`/requisitions/${id}`),
        api.get('/categories'),
        api.get('/skills'),
      ])

      const req = reqRes.data.data ?? reqRes.data
      const cats = Array.isArray(catRes.data) ? catRes.data : catRes.data.data ?? []
      const skills = Array.isArray(skillRes.data) ? skillRes.data : skillRes.data.data ?? []

      setRequisition(req)
      setAllSkills(skills)
      setForm((prev) => ({
        ...prev,
        title: req.job_title ?? '',
        salary_min: req.salary_min ?? '',
        salary_max: req.salary_max ?? '',
      }))

      const matchedCategory = cats.find((c) => c.name === req.category)
      if (matchedCategory) {
        const suggestedRes = await api.get(`/categories/${matchedCategory.id}/skills`)
        const suggestedList = Array.isArray(suggestedRes.data) ? suggestedRes.data : suggestedRes.data.data ?? []
        const ids = suggestedList.map((s) => s.id)
        setSuggestedCount(ids.length)
        setForm((prev) => ({ ...prev, skills: ids }))
      }
    }

    init()
      .catch(() => toast.error('Could not load requisition details.'))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  function update(field) {
    return (e) => setForm({ ...form, [field]: e.target.value })
  }

  function toggleSkill(skillId) {
    setForm((prev) => ({
      ...prev,
      skills: prev.skills.includes(skillId)
        ? prev.skills.filter((s) => s !== skillId)
        : [...prev.skills, skillId],
    }))
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
    <div className="container py-5" style={{ maxWidth: 720 }}>
      <p className="hp-eyebrow">From requisition · {requisition.department}</p>
      <h1 className="hp-h2 mb-4">Post: {requisition.job_title}</h1>

      <form onSubmit={handleSubmit} className="hp-auth-card" style={{ maxWidth: 'none' }}>
        <label className="hp-label form-label">Title</label>
        <input className="form-control mb-1" required value={form.title} onChange={update('title')} />
        {errors.title && <p className="text-danger small">{errors.title[0]}</p>}

        <label className="hp-label form-label mt-3">Description</label>
        <textarea className="form-control mb-1" rows={5} required value={form.description} onChange={update('description')} />
        {errors.description && <p className="text-danger small">{errors.description[0]}</p>}

        <label className="hp-label form-label mt-3">Requirements (optional)</label>
        <textarea className="form-control mb-1" rows={3} value={form.requirements} onChange={update('requirements')} />

        <div className="row g-2 mt-2">
          <div className="col-6">
            <label className="hp-label form-label">Salary min</label>
            <input type="number" className="form-control" value={form.salary_min} onChange={update('salary_min')} />
          </div>
          <div className="col-6">
            <label className="hp-label form-label">Salary max</label>
            <input type="number" className="form-control" value={form.salary_max} onChange={update('salary_max')} />
          </div>
        </div>
        {errors.salary_max && <p className="text-danger small">{errors.salary_max[0]}</p>}

        <label className="hp-label form-label mt-3">Location (optional)</label>
        <input className="form-control mb-1" value={form.location} onChange={update('location')} />

        <div className="row g-2 mt-2">
          <div className="col-md-4">
            <label className="hp-label form-label">Job type</label>
            <select className="form-select" value={form.job_type} onChange={update('job_type')}>
              {JOB_TYPES.map((t) => (
                <option key={t} value={t}>{t.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
          <div className="col-md-4">
            <label className="hp-label form-label">Workplace</label>
            <select className="form-select" value={form.workplace_type} onChange={update('workplace_type')}>
              {WORKPLACE_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="col-md-4">
            <label className="hp-label form-label">Experience</label>
            <select className="form-select" value={form.experience_level} onChange={update('experience_level')}>
              {EXPERIENCE_LEVELS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="row g-2 mt-2">
          <div className="col-6">
            <label className="hp-label form-label">Start date (optional)</label>
            <input type="date" className="form-control" value={form.start_date} onChange={update('start_date')} />
          </div>
          <div className="col-6">
            <label className="hp-label form-label">End date (optional)</label>
            <input type="date" className="form-control" value={form.end_date} onChange={update('end_date')} />
          </div>
        </div>
        {errors.end_date && <p className="text-danger small">{errors.end_date[0]}</p>}

        <label className="hp-label form-label mt-3 d-block">Skills</label>
        <div className="hp-card-skills mb-1">
          {allSkills.map((skill) => (
            <label
              key={skill.id}
              className={`hp-skill-check ${form.skills.includes(skill.id) ? 'hp-skill-check--active' : ''}`}
            >
              <input
                type="checkbox"
                className="d-none"
                checked={form.skills.includes(skill.id)}
                onChange={() => toggleSkill(skill.id)}
              />
              {skill.name}
            </label>
          ))}
        </div>
        {suggestedCount > 0 && (
          <p className="hp-muted small mt-1">Pre-selected based on this category's linked skills.</p>
        )}

        <button className="btn hp-btn-accent w-100 mt-4" disabled={submitting}>
          {submitting ? 'Posting…' : 'Post job'}
        </button>
      </form>
    </div>
  )
}
