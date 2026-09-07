import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'

export default function JobFeed() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    api
      .get('/jobs')
      .then(({ data }) => setJobs(data.data ?? data))
      .catch(() => setError('Could not load open roles right now.'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = jobs.filter((j) => j.title?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="container py-5">
      <div className="hp-page-header">
        <p className="hp-eyebrow">Open positions</p>
        <h1 className="hp-h1">Find where you fit next.</h1>
      </div>

      <input
        className="form-control hp-search mb-4"
        placeholder="Search by title…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading && <p className="hp-muted">Loading open roles…</p>}
      {error && <p className="text-danger">{error}</p>}
      {!loading && !error && filtered.length === 0 && (
        <p className="hp-muted">No roles match that search yet — check back soon.</p>
      )}

      <div className="row g-4">
        {filtered.map((job) => (
          <div className="col-md-6 col-lg-4" key={job.id}>
            <Link to={`/jobs/${job.id}`} className="hp-card-link">
              <div className="hp-card">
                <p className="hp-card-category">{job.department ?? 'General'}</p>
                <h3 className="hp-card-title">{job.title}</h3>
                <p className="hp-card-meta">
                  {job.location ?? 'Location flexible'} · {job.job_type?.replace('_', ' ')}
                </p>
                <div className="hp-card-skills">
                  {(job.skills ?? []).slice(0, 3).map((s) => (
                    <span className="hp-tag" key={s}>{s}</span>
                  ))}
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
