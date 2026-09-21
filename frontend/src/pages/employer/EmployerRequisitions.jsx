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

// HR's narrow edit: only the fields directly tied to their role — salary and
// the application window. Everything else on the requisition belongs to the manager.
function HrFieldsForm({ requisition, onSubmit, onCancel, submitting }) {
  const [salary, setSalary] = useState(requisition.salary ?? requisition.salary_min ?? requisition.salary_max ?? '')
  const [startDate, setStartDate] = useState(requisition.start_date ?? '')
  const [endDate, setEndDate] = useState(requisition.end_date ?? '')

  function handleSubmit(e) {
    e.preventDefault()
    if (startDate && endDate && startDate === endDate) {
      toast.error('End date must be different from the start date.')
      return
    }
    onSubmit({ salary, start_date: startDate, end_date: endDate })
  }

  return (
    <form onSubmit={handleSubmit} className="hp-schedule-form mt-3">
      <div className="row g-2">
        <div className="col-12 col-md-3">
          <label className="hp-label form-label">Salary</label>
          <input type="number" className="form-control" value={salary} onChange={(e) => setSalary(e.target.value)} />
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
  const [stats, setStats] = useState({})
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [notice, setNotice] = useState({ title: '', message: '' })
  const [savingNotice, setSavingNotice] = useState(false)

  function load(targetPage = page) {
    setLoading(true)
    api
      .get(`/requisitions?page=${targetPage}`)
      .then(({ data }) => {
        setRequisitions(data.data ?? data)
        setStats(data.stats ?? {})
        setPage(targetPage)
        setLastPage(data.meta?.last_page ?? 1)
      })
      .catch(() => setError('Could not load requisitions.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  async function publishNotice(e) {
    e.preventDefault()
    setSavingNotice(true)
    try {
      await api.post('/announcements', notice)
      setNotice({ title: '', message: '' })
      toast.success('Announcement published')
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Could not publish announcement.')
    } finally {
      setSavingNotice(false)
    }
  }

  async function handleApprove(id) {
    if (!window.confirm('Approve this job requisition?')) return
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
    if (!window.confirm('Reject this job requisition?')) return
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
    if (!window.confirm('Mark this requisition ready to post?')) return
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
      <form className="hp-card mb-4" onSubmit={publishNotice}>
        <h2 className="hp-h3 mt-0">Publish an HR notice</h2>
        <div className="row g-2">
          <div className="col-md-4"><input className="form-control" required maxLength="255" placeholder="Notice title" value={notice.title} onChange={(e) => setNotice({ ...notice, title: e.target.value })} /></div>
          <div className="col-md-6"><input className="form-control" required maxLength="2000" placeholder="Message for the homepage" value={notice.message} onChange={(e) => setNotice({ ...notice, message: e.target.value })} /></div>
          <div className="col-md-2"><button className="btn hp-btn-accent w-100" disabled={savingNotice}>{savingNotice ? 'Publishing…' : 'Publish'}</button></div>
        </div>
      </form>

      <div className="row g-3 mb-4">
        {[
          ['Total', stats.total],
          ['Pending approval', stats.pending_approval],
          ['Approved', stats.approved],
          ['Rejected', stats.rejected],
        ].map(([label, value]) => (
          <div className="col-6 col-lg-3" key={label}>
            <div className="hp-card h-100">
              <p className="hp-card-meta mb-2">{label}</p>
              <p className="hp-h2 mb-0">{value ?? '—'}</p>
            </div>

          </div>
        ))}
      </div>

      {loading && <p className="hp-muted">Loading…</p>}
      {error && <p className="text-danger">{error}</p>}
      {!loading && !error && requisitions.length === 0 && <p className="hp-muted">No requisitions yet.</p>}

      <div className="d-flex flex-column gap-3">
        {requisitions.map((req) => {
          const isBusy = busyId === req.id
          // A job posting doesn't move the requisition off "ready_to_post" once
          // created, so once has_job_posting is true the salary/dates are already
          // live on that public posting — editing them here would silently diverge
          // from what applicants see, so it's locked out from this point on.
          const canEditHrFields = (req.status === 'approved' || req.status === 'ready_to_post') && !req.has_job_posting
          return (
            <div className="hp-card hp-requisition-card" key={req.id}>
              <div className="d-flex flex-wrap justify-content-between gap-2 mb-2">
                <div>
                  <h3 className="hp-card-title mb-1">{req.job_title}</h3>
                  <p className="hp-card-meta mb-0">
                    {req.main_category} · {req.department} · Requested by {req.requested_by?.name}
                  </p>
                  {req.salary && (
                    <p className="hp-salary mb-0 mt-1">
                      Salary: {req.salary}
                    </p>
                  )}
                  {(req.start_date || req.end_date) && (
                    <p className="hp-card-meta mb-0">
                      Application window: {req.start_date ?? 'not set'} to {req.end_date ?? 'not set'}
                    </p>
                  )}
                </div>

              </div>

              <p className="hp-body-text mb-2">{req.justification}</p>
              {req.requirements && <p className="hp-body-text mb-2"><strong>Requirements:</strong> {req.requirements}</p>}
              {req.skills?.length > 0 && (
                <div className="hp-card-skills mb-2">
                  {req.skills.map((s) => <span className="hp-tag" key={s}>{s}</span>)}
                </div>
              )}

              <StatusPipeline stages={REQ_STAGES} current={req.status} rejectedKey="rejected" rejectedLabel="Rejected" />

              {req.status === 'rejected' && req.rejection_reason && (
                <p className="hp-muted mt-2 mb-0">Reason: {req.rejection_reason}</p>
              )}

              <div className="d-flex flex-wrap align-items-center gap-2 mt-2">
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
                {req.has_job_posting && (
                  <span className="hp-muted">
                    A job posting has already been created from this requisition — salary and dates are now locked.
                  </span>
                )}
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

      {!loading && !error && lastPage > 1 && (
        <div className="d-flex justify-content-center align-items-center gap-3 mt-4">
          <button className="btn hp-btn-outline btn-sm" disabled={page <= 1 || loading} onClick={() => load(page - 1)}>← Previous</button>
          <span className="hp-muted">Page {page} of {lastPage}</span>
          <button className="btn hp-btn-outline btn-sm" disabled={page >= lastPage || loading} onClick={() => load(page + 1)}>Next →</button>
        </div>
      )}
    </div>
  )
}
