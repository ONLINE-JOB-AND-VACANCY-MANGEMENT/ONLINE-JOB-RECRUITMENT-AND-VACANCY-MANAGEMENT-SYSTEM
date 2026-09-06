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

export default function ManagerRequisitions() {
  const [requisitions, setRequisitions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busyId, setBusyId] = useState(null)

  function load() {
    setLoading(true)
    api
      .get('/requisitions')
      .then(({ data }) => setRequisitions(data.data ?? data))
      .catch(() => setError('Could not load your requisitions.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  async function handleSubmit(id) {
    setBusyId(id)
    try {
      await api.post(`/requisitions/${id}/submit`)
      toast.success('Requisition submitted for approval')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Could not submit requisition.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="container py-5">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <p className="hp-eyebrow">Your requisitions</p>
          <h1 className="hp-h1 mb-0">Request a hire.</h1>
        </div>
        <Link to="/manager/requisitions/new" className="btn hp-btn-accent">New requisition</Link>
      </div>

      {loading && <p className="hp-muted">Loading…</p>}
      {error && <p className="text-danger">{error}</p>}
      {!loading && !error && requisitions.length === 0 && (
        <p className="hp-muted">You haven't created any requisitions yet.</p>
      )}

      <div className="d-flex flex-column gap-3">
        {requisitions.map((req) => (
          <div className="hp-card" key={req.id}>
            <div className="d-flex flex-wrap justify-content-between gap-3 mb-3">
              <div>
                <h3 className="hp-card-title mb-1">{req.job_title}</h3>
                <p className="hp-card-meta mb-0">{req.department} · {req.category}</p>
              </div>
              {req.status === 'draft' && (
                <div className="d-flex gap-2">
                  <Link to={`/manager/requisitions/${req.id}/edit`} className="btn hp-btn-outline btn-sm">
                    Edit
                  </Link>
                  <button
                    className="btn hp-btn-accent btn-sm"
                    disabled={busyId === req.id}
                    onClick={() => handleSubmit(req.id)}
                  >
                    {busyId === req.id ? 'Submitting…' : 'Submit for approval'}
                  </button>
                </div>
              )}
            </div>

            <StatusPipeline stages={REQ_STAGES} current={req.status} rejectedKey="rejected" rejectedLabel="Rejected" />

            {(req.salary_min || req.salary_max) && (
              <p className="hp-salary mt-3 mb-0">
                {req.salary_min ?? '—'} – {req.salary_max ?? '—'}
              </p>
            )}

            {req.status === 'rejected' && req.rejection_reason && (
              <p className="hp-muted mt-3 mb-0">Reason: {req.rejection_reason}</p>
            )}
            {req.has_job_posting && (
              <p className="hp-muted mt-3 mb-0">A job posting has already been created from this requisition.</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
