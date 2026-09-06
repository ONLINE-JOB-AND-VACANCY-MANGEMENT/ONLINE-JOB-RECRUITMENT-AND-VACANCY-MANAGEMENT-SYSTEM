import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../services/api'
import { toast } from 'react-toastify'

const emptyForm = {
  category_id: '',
  department: '',
  job_title: '',
  target_hire_date: '',
  salary_min: '',
  salary_max: '',
  justification: '',
}

export default function RequisitionForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [categories, setCategories] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({})
  const [readOnly, setReadOnly] = useState(false)

  useEffect(() => {
    async function init() {
      const catRes = await api.get('/categories')
      const cats = Array.isArray(catRes.data) ? catRes.data : catRes.data.data ?? []
      setCategories(cats)

      if (isEdit) {
        const reqRes = await api.get(`/requisitions/${id}`)
        const req = reqRes.data.data ?? reqRes.data

        if (req.status !== 'draft') {
          setReadOnly(true)
          toast.info('Only draft requisitions can be edited.')
        }

        const matched = cats.find((c) => c.name === req.category)
        setForm({
          category_id: matched?.id ?? '',
          department: req.department ?? '',
          job_title: req.job_title ?? '',
          target_hire_date: req.target_hire_date ? String(req.target_hire_date).substring(0, 10) : '',
          salary_min: req.salary_min ?? '',
          salary_max: req.salary_max ?? '',
          justification: req.justification ?? '',
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
        <label className="hp-label form-label">Category</label>
        <select
          className="form-select mb-1"
          required
          disabled={readOnly}
          value={form.category_id}
          onChange={update('category_id')}
        >
          <option value="">Select a category…</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        {errors.category_id && <p className="text-danger small">{errors.category_id[0]}</p>}

        <label className="hp-label form-label mt-3">Department</label>
        <input className="form-control mb-1" required disabled={readOnly} value={form.department} onChange={update('department')} />
        {errors.department && <p className="text-danger small">{errors.department[0]}</p>}

        <label className="hp-label form-label mt-3">Job title</label>
        <input className="form-control mb-1" required disabled={readOnly} value={form.job_title} onChange={update('job_title')} />
        {errors.job_title && <p className="text-danger small">{errors.job_title[0]}</p>}

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

        {!readOnly && (
          <button className="btn hp-btn-accent w-100 mt-4" disabled={submitting}>
            {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create draft'}
          </button>
        )}
      </form>
    </div>
  )
}
