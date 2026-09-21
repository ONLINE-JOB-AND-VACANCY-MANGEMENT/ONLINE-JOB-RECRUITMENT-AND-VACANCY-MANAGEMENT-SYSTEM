import { Link } from 'react-router-dom'
import StatusPipeline from '../components/StatusPipeline'
import { useEffect, useState } from 'react'
import api from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import logo from '../assets/aastu logo.jpg'

const DEMO_STAGES = [
  { key: 'applied', label: 'Applied' },
  { key: 'shortlisted', label: 'Shortlisted' },
  { key: 'exam_scheduled', label: 'Exam' },
  { key: 'interview_scheduled', label: 'Interview' },
  { key: 'hired', label: 'Hired' },
]

export default function Home() {
  const { user } = useAuth()
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
    <div className="hp-home">
      <header className="hp-home-header">
        <Link to="/" className="hp-home-brand">
          <img src={logo} alt="AASTU logo" />
          <span>AASTU <strong>JobPortal</strong></span>
        </Link>
      </header>
      <div className="hp-home-account-actions">
        {user ? (
          <Link to="/profile" className="hp-profile-icon" aria-label="Open my profile" title="My profile">
            <span aria-hidden="true">👤</span>
          </Link>
        ) : (
          <Link to="/login" className="hp-login-link">Log in</Link>
        )}
      </div>
      <section className="hp-home-welcome">
        <div className="container py-5">
          <div className="hp-home-welcome-content">
            <p className="hp-eyebrow">AASTU online job portal</p>
            <h1 className="hp-h1">Find your next opportunity.<br />Build the future with AASTU.</h1>
            <p className="hp-hero-sub">A trusted space connecting talented people with meaningful work at Addis Ababa Science and Technology University.</p>
            <div className="d-flex flex-wrap gap-3">
              <Link to="/jobs" className="btn hp-btn-accent">Browse jobs</Link>
              <Link to="/register" className="btn hp-btn-outline">Create account</Link>
            </div>
          </div>
          <div className="hp-home-pipeline">
            <p className="hp-label mb-3">A clear path from application to opportunity</p>
            <StatusPipeline stages={DEMO_STAGES} current="interview_scheduled" />
          </div>
        </div>
      </section>

      <section className="hp-home-introduction">
        <div className="container py-5">
          <div className="row align-items-center g-4">
            <div className="col-lg-4">
              <p className="hp-eyebrow">About AASTU</p>
              <h2 className="hp-h2">A decade of learning, innovation, and service.</h2>
            </div>
            <div className="col-lg-8">
              <p className="hp-home-copy"><strong>Welcome to Addis Ababa Science and Technology University's Online Job Portal</strong></p>
              <p className="hp-home-copy"><strong>Ethiopia's Premier Science and Technology Institution</strong></p>
              <p className="hp-home-copy">AASTU is dedicated to advancing knowledge, fostering innovation, and developing skilled graduates who will lead Ethiopia's technological transformation. Our commitment to excellence in research, teaching, and community service makes us a center of academic distinction in Africa. It has been more than a decade since we start educating students across different departments.</p>
              <p className="hp-home-copy mb-0">This is the University's online job portal for recruiting potential workers for the job that will be available in our organization. If you are looking for a job this is the right place.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="hp-home-opportunities">
        <div className="container py-5">
          <div className="hp-home-section-heading">
            <p className="hp-eyebrow">Opportunities</p>
            <h2 className="hp-h2 mb-2">Explore what is happening at AASTU.</h2>
            <p className="hp-muted mb-0">Browse current vacancies, important deadlines, and updates from HR.</p>
          </div>
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
      </section>
    </div>
  )
}
