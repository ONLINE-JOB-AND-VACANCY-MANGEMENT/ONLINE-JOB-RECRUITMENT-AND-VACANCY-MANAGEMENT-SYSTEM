import { useEffect, useState } from 'react'
import api from '../services/api'
import { toast } from 'react-toastify'

/**
 * Cascading Main Category -> Department -> Job Title picker. Both managers and HR
 * can create a new job title under an existing department (matching backend
 * permissions); creating a new department or main category is HR-only and happens
 * on a separate admin/HR screen, not inline here.
 *
 * Two prefill paths:
 * - `initialMainCategoryId` + `initialDepartmentId`: deterministic prefill. Pass these
 *   when editing something that already has a resolved chain (e.g. a requisition —
 *   JobRequisitionResource now returns both IDs directly). Preferred whenever available.
 * - No initial IDs, just `value` (a job_title_id): the picker starts empty and the
 *   user picks a fresh chain. Used for brand-new records (new requisition, new direct
 *   job post) where there's nothing to prefill.
 *
 * IMPORTANT: nothing in here renders a real <form>. This component is always used
 * inside a parent <form onSubmit={...}>, and nested <form> elements are invalid HTML —
 * browsers don't reliably scope an inner submit to the inner form, so a nested form
 * here previously caused the *outer* form's submit handler to fire instead (or as
 * well), kicking the user out of the page (AASTU-JobPortal-HANDOFF.md §6.2). The
 * inline "create a new job title" affordance below uses a plain <div> and a
 * type="button" handler for exactly this reason — keep it that way.
 */
export default function CategoryPicker({ value, onChange, disabled, initialMainCategoryId, initialDepartmentId }) {
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

  // Deterministic prefill from explicit IDs passed by the parent. No brute-force
  // searching — just fetch the two lists we already know we need.
  useEffect(() => {
    if (!initialMainCategoryId || !initialDepartmentId) return

    setMainCategoryId(String(initialMainCategoryId))
    setDepartmentId(String(initialDepartmentId))

    api
      .get('/departments', { params: { main_category_id: initialMainCategoryId } })
      .then(({ data }) => setDepartments(data))

    api
      .get('/job-titles', { params: { department_id: initialDepartmentId } })
      .then(({ data }) => setJobTitles(data))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMainCategoryId, initialDepartmentId])

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

  async function handleCreateTitle() {
    if (!newTitleName.trim()) return
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
            // Plain <div>, not <form> — see the component-level note above.
            <div className="hp-schedule-form mt-2">
              <label className="hp-label form-label">New job title name</label>
              <div className="d-flex gap-2">
                <input
                  className="form-control"
                  value={newTitleName}
                  onChange={(e) => setNewTitleName(e.target.value)}
                  placeholder="e.g. Junior Software Engineer"
                />
                <button type="button" className="btn hp-btn-accent btn-sm" onClick={handleCreateTitle} disabled={submittingTitle}>
                  {submittingTitle ? 'Adding…' : 'Add'}
                </button>
                <button type="button" className="btn hp-btn-outline btn-sm" onClick={() => setCreatingTitle(false)}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
