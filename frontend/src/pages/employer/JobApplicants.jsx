import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../services/api'
import StatusPipeline from '../../components/StatusPipeline'
import { toast } from 'react-toastify'

const STAGES = [
  { key: 'applied', label: 'Applied' },
  { key: 'shortlisted', label: 'Shortlisted' },
  { key: 'exam_scheduled', label: 'Exam' },
  { key: 'interview_scheduled', label: 'Interview' },
  { key: 'hired', label: 'Hired' },
]

function ScheduleForm({ kind, onSubmit, onCancel, submitting }) {
  const [scheduledAt, setScheduledAt] = useState('')
  const [location, setLocation] = useState('')
  const [mode, setMode] = useState('onsite')

  function handleSubmit(e) {
    e.preventDefault()
    onSubmit({ scheduled_at: scheduledAt, location, mode })
  }

  return (
    <form onSubmit={handleSubmit} className="hp-schedule-form mt-3">
      <div className="row g-2">
        <div className="col-md-5">
          <label className="hp-label form-label">Date &amp; time</label>
          <input
            type="datetime-local"
            className="form-control"
            required
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
          />
        </div>
        <div className="col-md-4">
          <label className="hp-label form-label">Location (optional)</label>
          <input className="form-control" value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>
        <div className="col-md-3">
          <label className="hp-label form-label">Mode</label>
          <select className="form-select" value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="onsite">Onsite</option>
            <option value="online">Online</option>
            {kind === 'interview' && <option value="phone">Phone</option>}
          </select>
        </div>
      </div>
      <div className="d-flex gap-2 mt-3">
        <button type="submit" className="btn hp-btn-accent btn-sm" disabled={submitting}>
          {submitting ? 'Saving…' : `Confirm ${kind}`}
        </button>
        <button type="button" className="btn hp-btn-outline btn-sm" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  )
}

export default function JobApplicants() {
  const { id } = useParams()
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [openForm, setOpenForm] = useState({}) // { [applicationId]: 'exam' | 'interview' | null }
  const [busyId, setBusyId] = useState(null)

  function load() {
    setLoading(true)
    api
      .get(`/jobs/${id}/applicants`)
      .then(({ data }) => setApplications(data.data ?? data))
      .catch(() => setError('Could not load applicants for this job.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [id])

  async function updateStatus(applicationId, status) {
    setBusyId(applicationId)
    try {
      await api.patch(`/applications/${applicationId}/status`, { status })
      toast.success('Status updated')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Could not update status.')
    } finally {
      setBusyId(null)
    }
  }

  async function submitSchedule(applicationId, kind, payload) {
    setBusyId(applicationId)
    try {
      await api.post(`/applications/${applicationId}/schedule-${kind}`, payload)
      toast.success(`${kind === 'exam' ? 'Exam' : 'Interview'} scheduled`)
      setOpenForm((prev) => ({ ...prev, [applicationId]: null }))
      load()
    } catch (err) {
      toast.error(err.response?.data?.message ?? `Could not schedule ${kind}.`)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="container py-5">
      <Link to="/employer/jobs" className="hp-nav-link">← All jobs</Link>
      <p className="hp-eyebrow mt-3">Applicants</p>
      <h1 className="hp-h1 mb-4">Review candidates.</h1>

      {loading && <p className="hp-muted">Loading applicants…</p>}
      {error && <p className="text-danger">{error}</p>}
      {!loading && !error && applications.length === 0 && (
        <p className="hp-muted">No one has applied to this role yet.</p>
      )}

      <div className="d-flex flex-column gap-3">
        {applications.map((app) => {
          const isBusy = busyId === app.id
          const activeForm = openForm[app.id]
          return (
            <div className="hp-card" key={app.id}>
              <div className="d-flex flex-wrap justify-content-between gap-3 mb-3">
                <div>
                  <h3 className="hp-card-title mb-1">{app.applicant?.name}</h3>
                  <p className="hp-card-meta mb-0">
                    {app.applicant?.email} {app.applicant?.phone ? `· ${app.applicant.phone}` : ''}
                  </p>
                </div>
                {app.resume && (
                  <a href={app.resume.file_path} target="_blank" rel="noreferrer" className="btn hp-btn-outline btn-sm">
                    View resume
                  </a>
                )}
              </div>

              {app.cover_letter && <p className="hp-body-text mb-3">{app.cover_letter}</p>}

              <StatusPipeline stages={STAGES} current={app.status} rejectedKey="rejected" rejectedLabel="Rejected" />

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

              <div className="d-flex flex-wrap gap-2 mt-3">
                <button
                  className="btn hp-btn-outline btn-sm"
                  disabled={isBusy}
                  onClick={() => updateStatus(app.id, 'shortlisted')}
                >
                  Shortlist
                </button>
                <button
                  className="btn hp-btn-outline btn-sm"
                  disabled={isBusy}
                  onClick={() => setOpenForm((prev) => ({ ...prev, [app.id]: prev[app.id] === 'exam' ? null : 'exam' }))}
                >
                  Schedule exam
                </button>
                <button
                  className="btn hp-btn-outline btn-sm"
                  disabled={isBusy}
                  onClick={() => setOpenForm((prev) => ({ ...prev, [app.id]: prev[app.id] === 'interview' ? null : 'interview' }))}
                >
                  Schedule interview
                </button>
                <button
                  className="btn hp-btn-accent btn-sm"
                  disabled={isBusy}
                  onClick={() => updateStatus(app.id, 'hired')}
                >
                  Hire
                </button>
                <button
                  className="btn btn-sm hp-btn-reject"
                  disabled={isBusy}
                  onClick={() => updateStatus(app.id, 'rejected')}
                >
                  Reject
                </button>
              </div>

              {activeForm && (
                <ScheduleForm
                  kind={activeForm}
                  submitting={isBusy}
                  onCancel={() => setOpenForm((prev) => ({ ...prev, [app.id]: null }))}
                  onSubmit={(payload) => submitSchedule(app.id, activeForm, payload)}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
