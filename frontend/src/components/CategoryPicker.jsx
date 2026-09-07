import { useEffect, useState } from 'react'
import api from '../services/api'
import { toast } from 'react-toastify'

/**
 * Cascading Main Category -> Department -> Job Title picker. Both managers and HR
 * can create a new job title under an existing department (matching backend
 * permissions); creating a new department or main category is HR-only and happens
 * on a separate admin/HR screen, not inline here.
 */
export default function CategoryPicker({ value, onChange, disabled }) {
  const [mainCategories, setMainCategories] = useState([])
  const [departments, setDepartments] = useState([])
  const [jobTitles, setJobTitles] = useState([])

  const [mainCategoryId, setMainCategoryId] = useState('')
  const [departmentId, setDepartmentId] = useState('')

  const [creatingTitle, setCreatingTitle] = useState(false)
  const [newTitleName, setNewTitleName] = useState('')
  const [submittingTitle, setSubmittingTitle] = useState(false)

  useEffect(() => {
    api.get('/main-categories').then(({ data }) => setMainCategories(data))
  }, [])

  // If editing an existing job title (value passed in), walk back up the chain to
  // pre-select main category + department once job titles are known.
  useEffect(() => {
    if (!value || !mainCategories.length) return

    async function resolveChain() {
      // Try every main category's departments until we find the one containing `value`.
      for (const mc of mainCategories) {
        const { data: depts } = await api.get('/departments', { params: { main_category_id: mc.id } })
        for (const dept of depts) {
          const { data: titles } = await api.get('/job-titles', { params: { department_id: dept.id } })
          if (titles.some((t) => t.id === Number(value))) {
            setMainCategoryId(mc.id)
            setDepartmentId(dept.id)
            setDepartments(depts)
            setJobTitles(titles)
            return
          }
        }
      }
    }

    resolveChain()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, mainCategories])

  function handleMainCategoryChange(e) {
    const id = e.target.value
    setMainCategoryId(id)
    setDepartmentId('')
    setJobTitles([])
    onChange('')
    if (!id) {
      setDepartments([])
      return
    }
    api.get('/departments', { params: { main_category_id: id } }).then(({ data }) => setDepartments(data))
  }

  function handleDepartmentChange(e) {
    const id = e.target.value
    setDepartmentId(id)
    onChange('')
    if (!id) {
      setJobTitles([])
      return
    }
    api.get('/job-titles', { params: { department_id: id } }).then(({ data }) => setJobTitles(data))
  }

  async function handleCreateTitle(e) {
    e.preventDefault()
    setSubmittingTitle(true)
    try {
      const { data } = await api.post('/job-titles', { department_id: departmentId, name: newTitleName })
      toast.success('Job title created')
      setJobTitles((prev) => [...prev, data.job_title])
      onChange(String(data.job_title.id))
      setNewTitleName('')
      setCreatingTitle(false)
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Could not create job title.')
    } finally {
      setSubmittingTitle(false)
    }
  }

  return (
    <div>
      <label className="hp-label form-label">Main category</label>
      <select className="form-select mb-3" required disabled={disabled} value={mainCategoryId} onChange={handleMainCategoryChange}>
        <option value="">Select…</option>
        {mainCategories.map((mc) => (
          <option key={mc.id} value={mc.id}>{mc.name}</option>
        ))}
      </select>

      <label className="hp-label form-label">Department</label>
      <select
        className="form-select mb-3"
        required
        disabled={disabled || !mainCategoryId}
        value={departmentId}
        onChange={handleDepartmentChange}
      >
        <option value="">{mainCategoryId ? 'Select…' : 'Choose a main category first'}</option>
        {departments.map((d) => (
          <option key={d.id} value={d.id}>{d.name}</option>
        ))}
      </select>

      <label className="hp-label form-label">Job title</label>
      <select
        className="form-select mb-1"
        required
        disabled={disabled || !departmentId}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{departmentId ? 'Select…' : 'Choose a department first'}</option>
        {jobTitles.map((jt) => (
          <option key={jt.id} value={jt.id}>{jt.name}</option>
        ))}
      </select>

      {departmentId && !disabled && (
        <div className="mt-2">
          {!creatingTitle ? (
            <button type="button" className="btn hp-btn-outline btn-sm" onClick={() => setCreatingTitle(true)}>
              + This job title doesn't exist yet
            </button>
          ) : (
            <form onSubmit={handleCreateTitle} className="hp-schedule-form mt-2">
              <label className="hp-label form-label">New job title name</label>
              <div className="d-flex gap-2">
                <input
                  className="form-control"
                  required
                  value={newTitleName}
                  onChange={(e) => setNewTitleName(e.target.value)}
                  placeholder="e.g. Junior Software Engineer"
                />
                <button className="btn hp-btn-accent btn-sm" disabled={submittingTitle}>
                  {submittingTitle ? 'Adding…' : 'Add'}
                </button>
                <button type="button" className="btn hp-btn-outline btn-sm" onClick={() => setCreatingTitle(false)}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
