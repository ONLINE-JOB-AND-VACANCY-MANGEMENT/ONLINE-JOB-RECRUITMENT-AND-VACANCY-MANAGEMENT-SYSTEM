import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import StatusPipeline from '../components/StatusPipeline'

const STAGES = [
  { key: 'applied', label: 'Applied' },
  { key: 'shortlisted', label: 'Shortlisted' },
  { key: 'exam_scheduled', label: 'Exam' },
  { key: 'interview_scheduled', label: 'Interview' },
  { key: 'hired', label: 'Hired' },
]

export default function MyApplications() {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get('/my-applications')
      .then(({ data }) => setApplications(data.data ?? data))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="container py-5">
      <p className="hp-eyebrow">Your applications</p>
      <h1 className="hp-h1 mb-4">Track where you stand.</h1>

      {loading && <p className="hp-muted">Loading your applications…</p>}

      {!loading && applications.length === 0 && (
        <p className="hp-muted">
          You haven't applied to anything yet. <Link to="/jobs">Browse open roles</Link>.
        </p>
      )}

      <div className="d-flex flex-column gap-3">
        {applications.map((app) => (
          <div className="hp-card" key={app.id}>
            <h3 className="hp-card-title">{app.job?.title}</h3>
            <p className="hp-card-meta mb-3">
              Applied {app.applied_at ? new Date(app.applied_at).toLocaleDateString() : ''}
            </p>

            <StatusPipeline
              stages={STAGES}
              current={app.status}
              rejectedKey="rejected"
              rejectedLabel="Not selected this time"
            />

            {app.exam && (
              <p className="hp-muted mt-3 mb-0">
                Exam: {new Date(app.exam.scheduled_at).toLocaleString()} · {app.exam.mode}
                {app.exam.location ? ` · ${app.exam.location}` : ''}
              </p>
            )}
            {app.interview && (
              <p className="hp-muted mt-1 mb-0">
                Interview: {new Date(app.interview.scheduled_at).toLocaleString()} · {app.interview.mode}
                {app.interview.location ? ` · ${app.interview.location}` : ''}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
