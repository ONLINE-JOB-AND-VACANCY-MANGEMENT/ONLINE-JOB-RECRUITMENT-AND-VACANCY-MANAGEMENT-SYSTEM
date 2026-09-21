import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import { toast } from 'react-toastify'

export default function EmployerJobs() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [exportingAll, setExportingAll] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const [catalog, setCatalog] = useState({ categories: [], departments: [], titles: [] })
  const [filters, setFilters] = useState({ main_category_id: '', department_id: '', job_title_id: '' })

  function load(targetPage = 1) {
    setLoading(true)
    api
      .get('/internal-jobs', { params: { page: targetPage, ...filters } })
      .then(({ data }) => {
        const list = data.data ?? data
        setJobs(list)
        setLastPage(data.meta?.last_page ?? 1)
        setTotal(data.meta?.total ?? list.length)
        setPage(targetPage)
      })
      .catch(() => setError('Could not load jobs right now.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  useEffect(() => {
    Promise.all([api.get('/main-categories'), api.get('/departments'), api.get('/job-titles')])
      .then(([categories, departments, titles]) => setCatalog({
        categories: categories.data.data ?? categories.data,
        departments: departments.data.data ?? departments.data,
        titles: titles.data.data ?? titles.data,
      }))
      .catch(() => toast.error('Could not load job filters.'))
  }, [])

  // Whole-portal export — every applicant across every job, in one file, each row
  // carrying its own job title/department/main category.
  async function handleExportAll() {
    setExportingAll(true)
    try {
      const res = await api.get('/applicants/export-all', { params: filters, responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `all-applicants-${Date.now()}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch {
      toast.error('Could not export applicants.')
    } finally {
      setExportingAll(false)
    }
  }

  // Backend already blocks deleting a job that has applicants (409) — this button was
  // simply never wired up in the UI before, even though the endpoint existed.
  async function handleDelete(job) {
    if (!window.confirm(`Delete "${job.title}"? This can't be undone.`)) return
    setBusyId(job.id)
    try {
      await api.delete(`/jobs/${job.id}`)
      toast.success('Job deleted')
      load(page)
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Could not delete job.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="container py-5">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <p className="hp-eyebrow mb-1">HR pipeline</p>
          <h1 className="hp-h1 mb-0">Manage postings.</h1>
        </div>

        <div className="d-flex gap-2">
          <button className="btn hp-btn-outline" onClick={handleExportAll} disabled={exportingAll}>
            {exportingAll ? 'Exporting…' : 'Export all applicants'}
          </button>
          <Link to="/employer/jobs/new" className="btn hp-btn-accent">Post a job</Link>
        </div>
      </div>

      <div className="hp-card mb-4">
        <div className="row g-2 align-items-end">
            <div className="col-md-4">
              <label className="hp-label form-label">Category</label>
              <select className="form-select" value={filters.main_category_id} onChange={(e) => setFilters({ main_category_id: e.target.value, department_id: '', job_title_id: '' })}>
                <option value="">All categories</option>
                {catalog.categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </div>
            <div className="col-md-4">
              <label className="hp-label form-label">Department</label>
              <select className="form-select" value={filters.department_id} onChange={(e) => setFilters({ ...filters, department_id: e.target.value, job_title_id: '' })}>
                <option value="">All departments</option>
                {catalog.departments.filter((item) => !filters.main_category_id || String(item.main_category_id) === String(filters.main_category_id)).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </div>
            <div className="col-md-4">
              <label className="hp-label form-label">Job title</label>
              <select className="form-select" value={filters.job_title_id} onChange={(e) => setFilters({ ...filters, job_title_id: e.target.value })}>
                <option value="">All job titles</option>
                {catalog.titles.filter((item) => (!filters.department_id || String(item.department_id) === String(filters.department_id))).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        {loading && <p className="hp-muted">Loading jobs…</p>}
      {error && <p className="text-danger">{error}</p>}
      {!loading && !error && jobs.length === 0 && (
        <p className="hp-muted">No job postings yet.</p>
      )}

      {!loading && !error && jobs.length > 0 && (
        <>
          <p className="hp-muted mb-3">{total} job{total === 1 ? '' : 's'} total</p>

          <div className="table-responsive">
            <table className="table align-middle">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Department</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Applicants</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => {
                  const hasApplicants = (job.applications_count ?? 0) > 0
                  const isBusy = busyId === job.id
                  return (
                    <tr key={job.id}>
                      <td className="fw-semibold">{job.title}</td>
                      <td>{job.department ?? 'General'}</td>
                      <td>{job.location ?? 'Flexible'}</td>
                      <td><span className="hp-tag">{job.status}</span></td>
                      <td>{job.applications_count ?? 0}</td>
                      <td>
                        <div className="d-flex gap-2 justify-content-end">
                          <Link to={`/employer/jobs/${job.id}/applicants`} className="btn hp-btn-accent btn-sm">
                            View applicants
                          </Link>
                          <button
                            className="btn hp-btn-reject btn-sm"
                            disabled={hasApplicants || isBusy}
                            title={hasApplicants ? 'Cannot delete a job that already has applicants' : 'Delete this job'}
                            onClick={() => handleDelete(job)}
                          >
                            {isBusy ? 'Deleting…' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
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
        </>
      )}
    </div>
  )
}
