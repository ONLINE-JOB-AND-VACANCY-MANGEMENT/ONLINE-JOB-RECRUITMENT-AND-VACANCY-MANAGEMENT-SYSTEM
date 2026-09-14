import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'

export default function JobFeed() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const emptyFilters = { search: '', title: '', department: '', company: '', location: '', skill: '', experience: '' }
  const [filters, setFilters] = useState(emptyFilters)
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters)
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [total, setTotal] = useState(0)

  function load(targetPage = 1, targetFilters = appliedFilters) {
    setLoading(true)
    api
      .get('/jobs', { params: { page: targetPage, ...targetFilters } })
      .then(({ data }) => {
        const list = data.data ?? data
        setJobs(list)
        setLastPage(data.meta?.last_page ?? 1)
        setTotal(data.meta?.total ?? list.length)
        setPage(targetPage)
      })
      .catch(() => setError('Could not load open roles right now.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => load(1), []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleSearchSubmit(e) {
    e.preventDefault()
    setAppliedFilters(filters)
    load(1, filters)
  }

  function updateFilter(field) {
    return (e) => setFilters((previous) => ({ ...previous, [field]: e.target.value }))
  }

  function resetFilters() {
    setFilters(emptyFilters)
    setAppliedFilters(emptyFilters)
    load(1, emptyFilters)
  }

  return (
    <div className="container py-5">
      <div className="hp-page-header">
        <p className="hp-eyebrow">Open positions</p>
        <h1 className="hp-h1">Find where you fit next.</h1>
      </div>

      <form onSubmit={handleSearchSubmit} className="hp-card mb-4">
        <input
          className="form-control mb-2"
          placeholder="Search all fields…"
          value={filters.search}
          onChange={updateFilter('search')}
        />
        <div className="row g-2">
          {[
            ['title', 'Title'],
            ['department', 'Department'],
            ['company', 'Company'],
            ['location', 'Location'],
            ['skill', 'Skill'],
          ].map(([field, label]) => (
            <div className="col-sm-6 col-lg" key={field}>
              <input className="form-control" placeholder={label} value={filters[field]} onChange={updateFilter(field)} />
            </div>
          ))}
          <div className="col-sm-6 col-lg">
            <select className="form-select" value={filters.experience} onChange={updateFilter('experience')}>
              <option value="">All experience</option>
              <option value="entry">Entry</option>
              <option value="mid">Mid</option>
              <option value="senior">Senior</option>
              <option value="executive">Executive</option>
            </select>
          </div>
        </div>
        <div className="d-flex gap-2 mt-3">
          <button className="btn hp-btn-accent" type="submit">Search</button>
          <button className="btn hp-btn-outline" type="button" onClick={resetFilters}>Reset</button>
        </div>
      </form>

      {loading && <p className="hp-muted">Loading open roles…</p>}
      {error && <p className="text-danger">{error}</p>}
      {!loading && !error && jobs.length === 0 && (
        <p className="hp-muted">No roles match that search yet — check back soon.</p>
      )}

      {!loading && !error && jobs.length > 0 && (
        <>
          <p className="hp-muted mb-3">{total} open role{total === 1 ? '' : 's'}</p>

          <div className="table-responsive">
            <table className="table align-middle">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Department</th>
                  <th>Location</th>
                  <th>Company</th>
                  <th>Type</th>
                  <th>Skills</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id}>
                    <td className="fw-semibold">{job.title}</td>
                    <td>{job.department ?? 'General'}</td>
                    <td>{job.location ?? 'Flexible'}</td>
                    <td>{job.company ?? 'AASTU'}</td>
                    <td>{job.job_type?.replace('_', ' ')}</td>
                    <td>
                      <div className="hp-card-skills">
                        {(job.skills ?? []).slice(0, 3).map((s) => (
                          <span className="hp-tag" key={s}>{s}</span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <Link to={`/jobs/${job.id}`} className="btn hp-btn-outline btn-sm">View</Link>
                    </td>
                  </tr>
                ))}
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
