import { Link } from 'react-router-dom'
import StatusPipeline from '../components/StatusPipeline'
import { useEffect, useState } from 'react'
import api from '../services/api'

const DEMO_STAGES = [
  { key: 'applied', label: 'Applied' },
  { key: 'shortlisted', label: 'Shortlisted' },
  { key: 'exam_scheduled', label: 'Exam' },
  { key: 'interview_scheduled', label: 'Interview' },
  { key: 'hired', label: 'Hired' },
]

export default function Home() {
  const [jobs, setJobs] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    Promise.all([api.get('/feed/jobs'), api.get('/announcements')])
      .then(([jobsResponse, announcementsResponse]) => {
        setJobs(jobsResponse.data.data ?? [])
        setAnnouncements(announcementsResponse.data ?? [])
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="hp-hero">
      <div className="container py-5">
        <p className="hp-eyebrow">Internal recruitment, made visible</p>
        <h1 className="hp-h1">
          Every hire is a path.
          <br />
          Now you can see it.
        </h1>
        <p className="hp-hero-sub">
          From requisition to offer — track exactly where every role and every candidate stands, at every stage.
        </p>
        <div className="d-flex flex-wrap gap-3 mb-5">
          <Link to="/jobs" className="btn hp-btn-accent">Browse open roles</Link>
          <Link to="/register" className="btn hp-btn-outline">Create an account</Link>
        </div>
        <div className="hp-hero-pipeline-demo">
          <p className="hp-label mb-3">A candidate's path, in one glance</p>
          <StatusPipeline stages={DEMO_STAGES} current="interview_scheduled" />
        </div>
      </div>
      <div className="container pb-5">
        {loading && <div className="hp-card"><p className="hp-muted mb-0">Loading vacancies and notices…</p></div>}
        {error && <div className="hp-card"><p className="hp-muted mb-0">We could not load the latest vacancies right now. Please try again later.</p></div>}
        {!loading && !error && (
          <div className="row g-3">
            <div className="col-lg-8">
              <div className="hp-card">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div><p className="hp-eyebrow mb-1">Opportunities</p><h2 className="hp-h3 mb-0">Recently posted jobs</h2></div>
                  <span className="hp-tag">{jobs.length} active vacancies</span>
                </div>
                {jobs.length === 0 ? <p className="hp-muted mb-0">No active vacancies are available yet.</p> : jobs.slice(0, 4).map((job) => (
                  <Link className="d-block border-top py-2 text-decoration-none" to={`/jobs/${job.id}`} key={job.id}>
                    <strong>{job.title}</strong><br /><span className="hp-muted small">{job.department ?? 'General'} · {job.location ?? 'Location not specified'} · Apply by {job.end_date ?? 'No deadline'}</span>
                  </Link>
                ))}
                {jobs.some((job) => job.end_date) && <p className="hp-muted small mt-3 mb-0">Important deadlines are shown beside each vacancy. Apply early to avoid missing the closing date.</p>}
              </div>
            </div>
            <div className="col-lg-4">
              <div className="hp-card h-100">
                <p className="hp-eyebrow mb-1">HR notices</p><h2 className="hp-h3 mb-3">Announcements</h2>
                {announcements.length === 0 ? <p className="hp-muted mb-0">No announcements at the moment.</p> : announcements.map((notice) => (
                  <div className="border-top py-2" key={notice.id}><strong>{notice.title}</strong><p className="hp-muted small mb-0">{notice.message}</p></div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
