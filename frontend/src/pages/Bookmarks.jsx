import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { toast } from 'react-toastify'

export default function Bookmarks() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)

  function load() {
    setLoading(true)
    api
      .get('/bookmarks')
      .then(({ data }) => setJobs(data.data ?? data))
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
      {!loading && jobs.length === 0 && (
        <p className="hp-muted">
          You haven't bookmarked any roles yet. <Link to="/jobs">Browse open roles</Link>.
        </p>
      )}

      <div className="row g-4">
        {jobs.map((job) => (
          <div className="col-md-6 col-lg-4" key={job.id}>
            <div className="hp-card">
              <p className="hp-card-category">{job.category ?? 'General'}</p>
              <Link to={`/jobs/${job.id}`} className="hp-card-title d-block mb-1" style={{ textDecoration: 'none' }}>
                {job.title}
              </Link>
              <p className="hp-card-meta">
                {job.location ?? 'Flexible'} · {job.job_type?.replace('_', ' ')}
              </p>
              <button
                className="btn hp-btn-reject btn-sm"
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
