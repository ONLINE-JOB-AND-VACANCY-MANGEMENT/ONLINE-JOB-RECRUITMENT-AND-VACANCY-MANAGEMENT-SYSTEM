import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import StatusPipeline from '../../components/StatusPipeline'
import { toast } from 'react-toastify'

const REQ_STAGES = [
  { key: 'draft', label: 'Draft' },
  { key: 'pending_approval', label: 'Pending approval' },
  { key: 'approved', label: 'Approved' },
  { key: 'ready_to_post', label: 'Ready to post' },
]

function RejectForm({ onSubmit, onCancel, submitting }) {
  const [reason, setReason] = useState('')

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit(reason)
      }}
      className="hp-schedule-form mt-3"
    >
      <label className="hp-label form-label">Rejection reason</label>
      <textarea
        className="form-control mb-2"
        rows={3}
        required
        maxLength={1000}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />
      <div className="d-flex gap-2">
        <button type="submit" className="btn hp-btn-reject btn-sm" disabled={submitting}>
          {submitting ? 'Rejecting…' : 'Confirm reject'}
        </button>
        <button type="button" className="btn hp-btn-outline btn-sm" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  )
}

// HR's narrow edit: only the fields directly tied to their role — salary range and
// the application window. Everything else on the requisition belongs to the manager.
function HrFieldsForm({ requisition, onSubmit, onCancel, submitting }) {
  const [salaryMin, setSalaryMin] = useState(requisition.salary_min ?? '')
  const [salaryMax, setSalaryMax] = useState(requisition.salary_max ?? '')
  const [startDate, setStartDate] = useState(requisition.start_date ?? '')
  const [endDate, setEndDate] = useState(requisition.end_date ?? '')

  function handleSubmit(e) {
    e.preventDefault()
    onSubmit({ salary_min: salaryMin, salary_max: salaryMax, start_date: startDate, end_date: endDate })
  }

  return (
    <form onSubmit={handleSubmit} className="hp-schedule-form mt-3">
      <div className="row g-2">
        <div className="col-6 col-md-3">
          <label className="hp-label form-label">Salary min</label>
          <input type="number" className="form-control" value={salaryMin} onChange={(e) => setSalaryMin(e.target.value)} />
        </div>
        <div className="col-6 col-md-3">
          <label className="hp-label form-label">Salary max</label>
          <input type="number" className="form-control" value={salaryMax} onChange={(e) => setSalaryMax(e.target.value)} />
        </div>
        <div className="col-6 col-md-3">
          <label className="hp-label form-label">Start date</label>
          <input type="date" className="form-control" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="col-6 col-md-3">
          <label className="hp-label form-label">End date</label>
          <input type="date" className="form-control" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      </div>
      <div className="d-flex gap-2 mt-3">
        <button type="submit" className="btn hp-btn-accent btn-sm" disabled={submitting}>
          {submitting ? 'Saving…' : 'Save'}
        </button>
        <button type="button" className="btn hp-btn-outline btn-sm" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  )
}

export default function EmployerRequisitions() {
  const [requisitions, setRequisitions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [openReject, setOpenReject] = useState(null)
  const [openHrFields, setOpenHrFields] = useState(null)

  function load() {
    setLoading(true)
    api
      .get('/requisitions')
      .then(({ data }) => setRequisitions(data.data ?? data))
      .catch(() => setError('Could not load requisitions.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  async function handleApprove(id) {
    setBusyId(id)
    try {
      await api.post(`/requisitions/${id}/approve`)
      toast.success('Requisition approved')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Could not approve requisition.')
    } finally {
      setBusyId(null)
    }
  }

  async function handleReject(id, reason) {
    setBusyId(id)
    try {
      await api.post(`/requisitions/${id}/reject`, { rejection_reason: reason })
      toast.success('Requisition rejected')
      setOpenReject(null)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Could not reject requisition.')
    } finally {
      setBusyId(null)
    }
  }

  async function handleReadyToPost(id) {
    setBusyId(id)
    try {
      await api.post(`/requisitions/${id}/ready-to-post`)
      toast.success('Marked ready to post')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Could not update requisition.')
    } finally {
      setBusyId(null)
    }
  }

  async function handleHrFieldsSubmit(id, payload) {
    setBusyId(id)
    try {
      await api.patch(`/requisitions/${id}/hr-fields`, payload)
      toast.success('Requisition updated')
      setOpenHrFields(null)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Could not update requisition.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="container py-5">
      <p className="hp-eyebrow">HR approval queue</p>
      <h1 className="hp-h1 mb-4">Review requisitions.</h1>

      {loading && <p className="hp-muted">Loading…</p>}
      {error && <p className="text-danger">{error}</p>}
      {!loading && !error && requisitions.length === 0 && <p className="hp-muted">No requisitions yet.</p>}

      <div className="d-flex flex-column gap-3">
        {requisitions.map((req) => {
          const isBusy = busyId === req.id
          const canEditHrFields = req.status === 'approved' || req.status === 'ready_to_post'
          return (
            <div className="hp-card" key={req.id}>
              <div className="d-flex flex-wrap justify-content-between gap-3 mb-3">
                <div>
                  <h3 className="hp-card-title mb-1">{req.job_title}</h3>
                  <p className="hp-card-meta mb-0">
                    {req.main_category} · {req.department} · Requested by {req.requested_by?.name}
                  </p>
                  {(req.salary_min || req.salary_max) && (
                    <p className="hp-salary mb-0 mt-1">
                      {req.salary_min ?? '—'} – {req.salary_max ?? '—'}
                    </p>
                  )}
                  {(req.start_date || req.end_date) && (
                    <p className="hp-card-meta mb-0">
                      Application window: {req.start_date ?? 'not set'} to {req.end_date ?? 'not set'}
                    </p>
                  )}
                </div>
              </div>

              <p className="hp-body-text mb-3">{req.justification}</p>
              {req.requirements && <p className="hp-body-text mb-3"><strong>Requirements:</strong> {req.requirements}</p>}
              {req.skills?.length > 0 && (
                <div className="hp-card-skills mb-3">
                  {req.skills.map((s) => <span className="hp-tag" key={s}>{s}</span>)}
                </div>
              )}

              <StatusPipeline stages={REQ_STAGES} current={req.status} rejectedKey="rejected" rejectedLabel="Rejected" />

              {req.status === 'rejected' && req.rejection_reason && (
                <p className="hp-muted mt-3 mb-0">Reason: {req.rejection_reason}</p>
              )}

              <div className="d-flex flex-wrap align-items-center gap-2 mt-3">
                {req.status === 'pending_approval' && (
                  <>
                    <button className="btn hp-btn-accent btn-sm" disabled={isBusy} onClick={() => handleApprove(req.id)}>
                      Approve
                    </button>
                    <button
                      className="btn hp-btn-reject btn-sm"
                      disabled={isBusy}
                      onClick={() => setOpenReject(openReject === req.id ? null : req.id)}
                    >
                      Reject
                    </button>
                  </>
                )}
                {canEditHrFields && (
                  <button
                    className="btn hp-btn-outline btn-sm"
                    disabled={isBusy}
                    onClick={() => setOpenHrFields(openHrFields === req.id ? null : req.id)}
                  >
                    Edit salary &amp; dates
                  </button>
                )}
                {req.status === 'approved' && (
                  <button className="btn hp-btn-accent btn-sm" disabled={isBusy} onClick={() => handleReadyToPost(req.id)}>
                    Mark ready to post
                  </button>
                )}
                {req.status === 'ready_to_post' && !req.has_job_posting && (
                  <Link to={`/employer/requisitions/${req.id}/create-job`} className="btn hp-btn-accent btn-sm">
                    Create job posting
                  </Link>
                )}
                {req.has_job_posting && <span className="hp-muted">Job posting already created.</span>}
              </div>

              {openReject === req.id && (
                <RejectForm
                  submitting={isBusy}
                  onCancel={() => setOpenReject(null)}
                  onSubmit={(reason) => handleReject(req.id, reason)}
                />
              )}

              {openHrFields === req.id && (
                <HrFieldsForm
                  requisition={req}
                  submitting={isBusy}
                  onCancel={() => setOpenHrFields(null)}
                  onSubmit={(payload) => handleHrFieldsSubmit(req.id, payload)}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
