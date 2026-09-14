import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'

export default function JobFeed() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [total, setTotal] = useState(0)

  function load(targetPage = 1, targetSearch = search) {
    setLoading(true)
    api
      .get('/jobs', { params: { page: targetPage, search: targetSearch || undefined } })
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
    load(1, search)
  }

  return (
    <div className="container py-5">
      <div className="hp-page-header">
        <p className="hp-eyebrow">Open positions</p>
        <h1 className="hp-h1">Find where you fit next.</h1>
      </div>

      <form onSubmit={handleSearchSubmit} className="d-flex gap-2 mb-4">
        <input
          className="form-control hp-search"
          placeholder="Search by title…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="btn hp-btn-accent" type="submit">Search</button>
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
