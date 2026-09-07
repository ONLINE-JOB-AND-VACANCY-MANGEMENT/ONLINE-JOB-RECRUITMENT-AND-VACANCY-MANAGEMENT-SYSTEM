import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../services/api'
import CategoryPicker from '../../components/CategoryPicker'
import { toast } from 'react-toastify'

const JOB_TYPES = ['full_time', 'part_time', 'contract', 'internship']

const emptyForm = {
  job_title_id: '',
  job_type: 'full_time',
  target_hire_date: '',
  salary_min: '',
  salary_max: '',
  justification: '',
  requirements: '',
  skills: [],
}

export default function RequisitionForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [allSkills, setAllSkills] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({})
  const [readOnly, setReadOnly] = useState(false)

  useEffect(() => {
    async function init() {
      const skillRes = await api.get('/skills')
      setAllSkills(Array.isArray(skillRes.data) ? skillRes.data : skillRes.data.data ?? [])

      if (isEdit) {
        const reqRes = await api.get(`/requisitions/${id}`)
        const req = reqRes.data.data ?? reqRes.data

        if (req.status !== 'draft') {
          setReadOnly(true)
          toast.info('Only draft requisitions can be edited.')
        }

        setForm({
          job_title_id: req.job_title_id ?? '',
          job_type: req.job_type ?? 'full_time',
          target_hire_date: req.target_hire_date ? String(req.target_hire_date).substring(0, 10) : '',
          salary_min: req.salary_min ?? '',
          salary_max: req.salary_max ?? '',
          justification: req.justification ?? '',
          requirements: req.requirements ?? '',
          skills: (req.skills ?? []).map((s) => allSkills.find((as) => as.name === s)?.id).filter(Boolean),
        })
      }
    }

    init()
      .catch(() => toast.error('Could not load requisition data.'))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

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
      if (isEdit) {
        await api.put(`/requisitions/${id}`, form)
        toast.success('Requisition updated')
      } else {
        await api.post('/requisitions', form)
        toast.success('Requisition created as draft')
      }
      navigate('/manager/requisitions')
    } catch (err) {
      const resp = err.response?.data
      setErrors(resp?.errors ?? {})
      toast.error(resp?.message ?? 'Could not save requisition.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="container py-5"><p className="hp-muted">Loading…</p></div>

  return (
    <div className="container py-5" style={{ maxWidth: 640 }}>
      <p className="hp-eyebrow">{isEdit ? 'Edit requisition' : 'New requisition'}</p>
      <h1 className="hp-h2 mb-4">{isEdit ? 'Update your request' : 'Request a new hire'}</h1>

      {readOnly && (
        <p className="text-danger mb-4">This requisition is no longer a draft and can't be edited.</p>
      )}

      <form onSubmit={handleSubmit} className="hp-auth-card" style={{ maxWidth: 'none' }}>
        <CategoryPicker
          value={form.job_title_id}
          onChange={(jobTitleId) => setForm({ ...form, job_title_id: jobTitleId })}
          disabled={readOnly}
        />
        {errors.job_title_id && <p className="text-danger small">{errors.job_title_id[0]}</p>}

        <label className="hp-label form-label mt-3">Job type</label>
        <select className="form-select mb-1" disabled={readOnly} value={form.job_type} onChange={update('job_type')}>
          {JOB_TYPES.map((t) => (
            <option key={t} value={t}>{t.replace('_', ' ')}</option>
          ))}
        </select>

        <label className="hp-label form-label mt-3">Target hire date (optional)</label>
        <input
          type="date"
          className="form-control mb-1"
          disabled={readOnly}
          value={form.target_hire_date}
          onChange={update('target_hire_date')}
        />
        {errors.target_hire_date && <p className="text-danger small">{errors.target_hire_date[0]}</p>}

        <div className="row g-2 mt-2">
          <div className="col-6">
            <label className="hp-label form-label">Salary min (optional)</label>
            <input type="number" className="form-control" disabled={readOnly} value={form.salary_min} onChange={update('salary_min')} />
          </div>
          <div className="col-6">
            <label className="hp-label form-label">Salary max (optional)</label>
            <input type="number" className="form-control" disabled={readOnly} value={form.salary_max} onChange={update('salary_max')} />
          </div>
        </div>
        {errors.salary_max && <p className="text-danger small">{errors.salary_max[0]}</p>}

        <label className="hp-label form-label mt-3">Requirements (optional)</label>
        <textarea
          className="form-control mb-1"
          rows={3}
          disabled={readOnly}
          value={form.requirements}
          onChange={update('requirements')}
        />

        <label className="hp-label form-label mt-3">Justification</label>
        <textarea
          className="form-control mb-1"
          rows={5}
          required
          maxLength={5000}
          disabled={readOnly}
          value={form.justification}
          onChange={update('justification')}
        />
        {errors.justification && <p className="text-danger small">{errors.justification[0]}</p>}

        <label className="hp-label form-label mt-3 d-block">Skills (optional)</label>
        <div className="hp-card-skills mb-1">
          {allSkills.map((skill) => (
            <label key={skill.id} className={`hp-skill-check ${form.skills.includes(skill.id) ? 'hp-skill-check--active' : ''}`}>
              <input
                type="checkbox"
                className="d-none"
                checked={form.skills.includes(skill.id)}
                onChange={() => !readOnly && toggleSkill(skill.id)}
                disabled={readOnly}
              />
              {skill.name}
            </label>
          ))}
        </div>

        {!readOnly && (
          <button className="btn hp-btn-accent w-100 mt-4" disabled={submitting}>
            {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create draft'}
          </button>
        )}
      </form>
    </div>
  )
}
