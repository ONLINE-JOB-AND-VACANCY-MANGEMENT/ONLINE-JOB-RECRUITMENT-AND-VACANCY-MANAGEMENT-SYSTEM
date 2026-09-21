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
  salary: '',
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
  // Deterministic prefill for CategoryPicker when editing — sourced directly from
  // JobRequisitionResource's department_id/main_category_id fields, so the picker
  // never has to guess the chain by brute-force searching (AASTU-JobPortal-HANDOFF.md §6.3).
  const [initialMainCategoryId, setInitialMainCategoryId] = useState(null)
  const [initialDepartmentId, setInitialDepartmentId] = useState(null)
  const [creatingSkill, setCreatingSkill] = useState(false)
  const [newSkillName, setNewSkillName] = useState('')
  const [submittingSkill, setSubmittingSkill] = useState(false)

  useEffect(() => {
    async function init() {
      const skillRes = await api.get('/skills')
      const skills = Array.isArray(skillRes.data) ? skillRes.data : skillRes.data.data ?? []
      setAllSkills(skills)

      if (isEdit) {
        const reqRes = await api.get(`/requisitions/${id}`)
        const req = reqRes.data.data ?? reqRes.data

        if (req.status !== 'draft') {
          setReadOnly(true)
          toast.info('Only draft requisitions can be edited.')
        }

        setInitialMainCategoryId(req.main_category_id ?? null)
        setInitialDepartmentId(req.department_id ?? null)

        setForm({
          job_title_id: req.job_title_id ?? '',
          job_type: req.job_type ?? 'full_time',
          target_hire_date: req.target_hire_date ? String(req.target_hire_date).substring(0, 10) : '',
          salary: req.salary ?? req.salary_min ?? req.salary_max ?? '',
          justification: req.justification ?? '',
          requirements: req.requirements ?? '',
          skills: (req.skills ?? []).map((s) => skills.find((as) => as.name === s)?.id).filter(Boolean),
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

  async function handleCreateSkill() {
    if (!newSkillName.trim()) return
    setSubmittingSkill(true)
    try {
      const { data } = await api.post('/skills', { name: newSkillName.trim() })
      setAllSkills((previous) => [...previous, data.skill].sort((a, b) => a.name.localeCompare(b.name)))
      setForm((previous) => ({ ...previous, skills: [...previous.skills, data.skill.id] }))
      setNewSkillName('')
      setCreatingSkill(false)
      toast.success('Skill created and selected')
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Could not create skill.')
    } finally {
      setSubmittingSkill(false)
    }
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
          initialMainCategoryId={initialMainCategoryId}
          initialDepartmentId={initialDepartmentId}
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

        <label className="hp-label form-label mt-3">Salary (optional)</label>
        <input type="number" className="form-control" disabled={readOnly} value={form.salary} onChange={update('salary')} />
        {errors.salary && <p className="text-danger small">{errors.salary[0]}</p>}

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
        {!readOnly && (!creatingSkill ? (
          <button type="button" className="btn hp-btn-outline btn-sm mt-2" onClick={() => setCreatingSkill(true)}>
            + Create a new skill
          </button>
        ) : (
          <div className="d-flex gap-2 mt-2">
            <input className="form-control" placeholder="Skill name" value={newSkillName} onChange={(e) => setNewSkillName(e.target.value)} />
            <button type="button" className="btn hp-btn-accent btn-sm" onClick={handleCreateSkill} disabled={submittingSkill}>
              {submittingSkill ? 'Adding…' : 'Add'}
            </button>
            <button type="button" className="btn hp-btn-outline btn-sm" onClick={() => setCreatingSkill(false)}>Cancel</button>
          </div>
        ))}

        {!readOnly && (
          <button className="btn hp-btn-accent w-100 mt-4" disabled={submitting}>
            {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create draft'}
          </button>
        )}
      </form>
    </div>
  )
}
