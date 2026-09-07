import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'react-toastify'

export default function JobDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [bookmarking, setBookmarking] = useState(false)

  useEffect(() => {
    api
      .get(`/jobs/${id}`)
      .then(({ data }) => setJob(data.data ?? data))
      .finally(() => setLoading(false))
  }, [id])

  function handleApplyClick() {
    if (!user) {
      navigate('/login', { state: { from: `/jobs/${id}` } })
      return
    }
    if (user.role !== 'job_seeker') {
      toast.info('Only job seeker accounts can apply to roles.')
      return
    }
    navigate(`/jobs/${id}/apply`)
  }

  async function handleToggleBookmark() {
    if (!user) {
      navigate('/login', { state: { from: `/jobs/${id}` } })
      return
    }
    setBookmarking(true)
    try {
      if (job.is_bookmarked) {
        await api.delete(`/jobs/${id}/bookmark`)
        setJob({ ...job, is_bookmarked: false })
      } else {
        await api.post(`/jobs/${id}/bookmark`)
        setJob({ ...job, is_bookmarked: true })
      }
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Could not update bookmark.')
    } finally {
      setBookmarking(false)
    }
  }

  if (loading) return <div className="container py-5"><p className="hp-muted">Loading role…</p></div>
  if (!job) return <div className="container py-5"><p>That role couldn't be found.</p></div>

  return (
    <div className="container py-5">
      <p className="hp-eyebrow">{job.department ?? 'General'}</p>
      <h1 className="hp-h1">{job.title}</h1>
      <p className="hp-card-meta mb-4">
        {job.location ?? 'Flexible'} · {job.job_type?.replace('_', ' ')} · {job.experience_level}
      </p>

      <div className="row">
        <div className="col-lg-8">
          <h2 className="hp-h3">About the role</h2>
          <p className="hp-body-text">{job.description}</p>

          {job.requirements && (
            <>
              <h2 className="hp-h3">What you'll need</h2>
              <p className="hp-body-text">{job.requirements}</p>
            </>
          )}

          <div className="hp-card-skills mb-4">
            {(job.skills ?? []).map((s) => (
              <span className="hp-tag" key={s}>{s}</span>
            ))}
          </div>
        </div>

        <div className="col-lg-4 mt-4 mt-lg-0">
          <div className="hp-side-card">
            {(job.salary_min || job.salary_max) && (
              <p className="hp-salary">{job.salary_min ?? '—'} – {job.salary_max ?? '—'}</p>
            )}
            <button className="btn hp-btn-accent w-100" onClick={handleApplyClick}>
              Apply for this role
            </button>
            <button
              className="btn hp-btn-outline w-100 mt-2"
              onClick={handleToggleBookmark}
              disabled={bookmarking}
            >
              {bookmarking ? 'Saving…' : job.is_bookmarked ? '★ Bookmarked' : '☆ Bookmark this role'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
