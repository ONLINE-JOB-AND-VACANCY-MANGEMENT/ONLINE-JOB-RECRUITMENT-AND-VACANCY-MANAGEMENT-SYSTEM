import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { toast } from 'react-toastify'

export default function MyBookmarks() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busyId, setBusyId] = useState(null)

  function load() {
    setLoading(true)
    api
      .get('/bookmarks')
      .then(({ data }) => setJobs(data.data ?? data))
      .catch(() => setError('Could not load your bookmarks.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  async function removeBookmark(jobId) {
    setBusyId(jobId)
    try {
      await api.delete(`/jobs/${jobId}/bookmark`)
      toast.success('Bookmark removed')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Could not remove bookmark.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="container py-5">
      <p className="hp-eyebrow">Saved roles</p>
      <h1 className="hp-h1 mb-4">Your bookmarks.</h1>

      {loading && <p className="hp-muted">Loading…</p>}
      {error && <p className="text-danger">{error}</p>}
      {!loading && !error && jobs.length === 0 && (
        <p className="hp-muted">
          Nothing saved yet. <Link to="/jobs">Browse open roles</Link> and bookmark ones you like.
        </p>
      )}

      <div className="row g-4">
        {jobs.map((job) => (
          <div className="col-md-6 col-lg-4" key={job.id}>
            <div className="hp-card d-flex flex-column h-100">
              <Link to={`/jobs/${job.id}`} className="hp-card-link mb-3">
                <p className="hp-card-category">{job.category ?? 'General'}</p>
                <h3 className="hp-card-title">{job.title}</h3>
                <p className="hp-card-meta">
                  {job.location ?? 'Location flexible'} · {job.job_type?.replace('_', ' ')}
                </p>
              </Link>
              <button
                className="btn hp-btn-reject btn-sm mt-auto"
                disabled={busyId === job.id}
                onClick={() => removeBookmark(job.id)}
              >
                {busyId === job.id ? 'Removing…' : 'Remove bookmark'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
