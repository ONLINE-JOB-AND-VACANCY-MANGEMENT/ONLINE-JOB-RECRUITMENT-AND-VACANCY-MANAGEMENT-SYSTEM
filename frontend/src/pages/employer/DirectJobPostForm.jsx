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
  description: '',
  requirements: '',
  salary: '',
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
  const [selectedJobTitle, setSelectedJobTitle] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({})

  // Inline "create a new skill" affordance (AASTU-JobPortal-HANDOFF.md §6.5) — same
  // pattern as CategoryPicker's inline job-title creation: a plain <div>, never a
  // nested <form>, since this whole block renders inside the page's outer form.
  const [creatingSkill, setCreatingSkill] = useState(false)
  const [newSkillName, setNewSkillName] = useState('')
  const [submittingSkill, setSubmittingSkill] = useState(false)

  useEffect(() => {
    api.get('/skills').then(({ data }) => setAllSkills(Array.isArray(data) ? data : data.data ?? []))
  }, [])

  function update(field) {
    return (e) => {
      const value = e.target.value
      if (field === 'experience_level' && selectedJobTitle) {
        setForm((prev) => ({
          ...prev,
          experience_level: value,
          salary: selectedJobTitle.salary ?? prev.salary,
          description: selectedJobTitle.description ?? prev.description,
          requirements: selectedJobTitle.requirements ?? prev.requirements,
        }))
        return
      }
      setForm({ ...form, [field]: value })
    }
  }

  function handleJobTitleChange(jobTitle) {
    setSelectedJobTitle(jobTitle)
    if (!jobTitle) {
      setForm((prev) => ({ ...prev, description: '', requirements: '', salary: '' }))
      return
    }
    setForm((prev) => ({
      ...prev,
      description: jobTitle.description ?? '',
      requirements: jobTitle.requirements ?? '',
      salary: jobTitle.salary ?? '',
    }))
  }

  function toggleSkill(skillId) {
    setForm((prev) => ({
      ...prev,
      skills: prev.skills.includes(skillId) ? prev.skills.filter((s) => s !== skillId) : [...prev.skills, skillId],
    }))
  }

  async function handleCreateSkill() {
    if (!newSkillName.trim()) return
    setSubmittingSkill(true)
    try {
      const { data } = await api.post('/skills', { name: newSkillName })
      toast.success('Skill created')
      setAllSkills((prev) => [...prev, data.skill])
      setForm((prev) => ({ ...prev, skills: [...prev.skills, data.skill.id] }))
      setNewSkillName('')
      setCreatingSkill(false)
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Could not create skill.')
    } finally {
      setSubmittingSkill(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!window.confirm('Publish this job now? It will become visible to applicants.')) return
    if (form.start_date && form.end_date && form.start_date === form.end_date) {
      setErrors({ end_date: ['End date must be later than the start date.'] })
      toast.error('End date must be different from the start date.')
      return
    }
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
        <CategoryPicker
          value={form.job_title_id}
          onChange={(id) => setForm((prev) => ({ ...prev, job_title_id: id }))}
          onJobTitleChange={handleJobTitleChange}
        />
        {errors.job_title_id && <p className="text-danger small">{errors.job_title_id[0]}</p>}

        <label className="hp-label form-label mt-3">Description</label>
        <textarea className="form-control mb-1" rows={5} value={form.description} onChange={update('description')} />
        {errors.description && <p className="text-danger small">{errors.description[0]}</p>}

        <label className="hp-label form-label mt-3">Requirements (optional)</label>
        <textarea className="form-control mb-1" rows={3} value={form.requirements} onChange={update('requirements')} />

        <label className="hp-label form-label mt-3">Salary</label>
        <input type="number" className="form-control" value={form.salary} readOnly />

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

        <div className="mt-1">
          {!creatingSkill ? (
            <button type="button" className="btn hp-btn-outline btn-sm" onClick={() => setCreatingSkill(true)}>
              + This skill doesn't exist yet
            </button>
          ) : (
            <div className="hp-schedule-form mt-2">
              <label className="hp-label form-label">New skill name</label>
              <div className="d-flex gap-2">
                <input
                  className="form-control"
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                  placeholder="e.g. Figma"
                />
                <button type="button" className="btn hp-btn-accent btn-sm" onClick={handleCreateSkill} disabled={submittingSkill}>
                  {submittingSkill ? 'Adding…' : 'Add'}
                </button>
                <button type="button" className="btn hp-btn-outline btn-sm" onClick={() => setCreatingSkill(false)}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <button className="btn hp-btn-accent w-100 mt-4" disabled={submitting}>
          {submitting ? 'Posting…' : 'Post job'}
        </button>
      </form>
    </div>
  )
}
