import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import CategoryPicker from '../../components/CategoryPicker'
import { toast } from 'react-toastify'

const JOB_TYPES = ['full_time', 'part_time', 'contract', 'internship']
const WORKPLACE_TYPES = ['onsite', 'remote', 'hybrid']
const EXPERIENCE_LEVELS = ['entry', 'mid', 'senior', 'executive']

const emptyForm = {
  job_title_id: '',
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
}

export default function DirectJobPostForm() {
  const navigate = useNavigate()
  const [allSkills, setAllSkills] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    api.get('/skills').then(({ data }) => setAllSkills(Array.isArray(data) ? data : data.data ?? []))
  }, [])

  function update(field) {
    return (e) => setForm({ ...form, [field]: e.target.value })
  }

  function toggleSkill(skillId) {
    setForm((prev) => ({
      ...prev,
      skills: prev.skills.includes(skillId) ? prev.skills.filter((s) => s !== skillId) : [...prev.skills, skillId],
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setErrors({})
    try {
      await api.post('/jobs', form)
      toast.success('Job posted successfully')
      navigate('/employer/jobs')
    } catch (err) {
      const resp = err.response?.data
      setErrors(resp?.errors ?? {})
      toast.error(resp?.message ?? 'Could not post job.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container py-5" style={{ maxWidth: 720 }}>
      <p className="hp-eyebrow">Post directly</p>
      <h1 className="hp-h1 mb-4">Post a new job.</h1>

      <form onSubmit={handleSubmit} className="hp-auth-card" style={{ maxWidth: 'none' }}>
        <CategoryPicker value={form.job_title_id} onChange={(id) => setForm({ ...form, job_title_id: id })} />
        {errors.job_title_id && <p className="text-danger small">{errors.job_title_id[0]}</p>}

        <label className="hp-label form-label mt-3">Title</label>
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
              {JOB_TYPES.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div className="col-md-4">
            <label className="hp-label form-label">Workplace</label>
            <select className="form-select" value={form.workplace_type} onChange={update('workplace_type')}>
              {WORKPLACE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="col-md-4">
            <label className="hp-label form-label">Experience</label>
            <select className="form-select" value={form.experience_level} onChange={update('experience_level')}>
              {EXPERIENCE_LEVELS.map((t) => <option key={t} value={t}>{t}</option>)}
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
            <label key={skill.id} className={`hp-skill-check ${form.skills.includes(skill.id) ? 'hp-skill-check--active' : ''}`}>
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

        <button className="btn hp-btn-accent w-100 mt-4" disabled={submitting}>
          {submitting ? 'Posting…' : 'Post job'}
        </button>
      </form>
    </div>
  )
}
