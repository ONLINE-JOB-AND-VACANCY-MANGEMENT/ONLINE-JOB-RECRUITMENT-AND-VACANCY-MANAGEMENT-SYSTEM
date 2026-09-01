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

export default function EmployerRequisitions() {
  const [requisitions, setRequisitions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [openReject, setOpenReject] = useState(null)

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
          return (
            <div className="hp-card" key={req.id}>
              <div className="d-flex flex-wrap justify-content-between gap-3 mb-3">
                <div>
                  <h3 className="hp-card-title mb-1">{req.job_title}</h3>
                  <p className="hp-card-meta mb-0">
                    {req.department} · {req.category} · Requested by {req.requested_by?.name}
                  </p>
                </div>
              </div>

              <p className="hp-body-text mb-3">{req.justification}</p>

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
            </div>
          )
        })}
      </div>
    </div>
  )
}
