import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'

export default function EmployerJobs() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  function load() {
    setLoading(true)
    api
      .get('/internal-jobs')
      .then(({ data }) => setJobs(data.data ?? data))
      .catch(() => setError('Could not load jobs right now.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  return (
    <div className="container py-5">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <p className="hp-eyebrow mb-1">HR pipeline</p>
          <h1 className="hp-h1 mb-0">Manage postings.</h1>
        </div>
        <Link to="/employer/jobs/new" className="btn hp-btn-accent">Post a job</Link>
      </div>

      {loading && <p className="hp-muted">Loading jobs…</p>}
      {error && <p className="text-danger">{error}</p>}
      {!loading && !error && jobs.length === 0 && (
        <p className="hp-muted">No job postings yet.</p>
      )}

      <div className="d-flex flex-column gap-3">
        {jobs.map((job) => (
          <div className="hp-card d-flex flex-wrap justify-content-between align-items-center gap-3" key={job.id}>
            <div>
              <h3 className="hp-card-title mb-1">{job.title}</h3>
              <p className="hp-card-meta mb-0">
                {job.department ?? 'General'} · {job.location ?? 'Flexible'} ·{' '}
                <span className="hp-tag">{job.status}</span>
              </p>
            </div>
            <div className="d-flex align-items-center gap-3">
              <span className="hp-muted">{job.applications_count ?? 0} applicant{job.applications_count === 1 ? '' : 's'}</span>
              <Link to={`/employer/jobs/${job.id}/applicants`} className="btn hp-btn-accent btn-sm">
                View applicants
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
