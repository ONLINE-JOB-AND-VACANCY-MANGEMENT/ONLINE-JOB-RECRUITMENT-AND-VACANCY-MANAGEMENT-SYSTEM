import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import api from '../../services/api'

const STATUS_OPTIONS = [
  ['applied', 'Applied'],
  ['shortlisted', 'Shortlist'],
  ['exam_scheduled', 'Schedule exam'],
  ['interview_scheduled', 'Schedule interview'],
  ['reserved', 'Reserved'],
  ['documentation_requested', 'Document approval'],
  ['rejected', 'Reject'],
  ['hired', 'Hire'],
]

function ScheduleForm({ kind, onSubmit, onCancel, submitting }) {
  const [form, setForm] = useState({ scheduled_at: '', location: '', mode: 'onsite', meeting_link: '' })
  function submit(e) {
    e.preventDefault()
    onSubmit({ ...form, meeting_link: form.mode === 'online' ? form.meeting_link : '' })
  }
  return (
    <form onSubmit={submit} className="p-3 border rounded bg-light">
      <div className="row g-2">
        <div className="col-md-4"><label className="hp-label form-label">Date &amp; time</label><input required type="datetime-local" className="form-control" value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} /></div>
        <div className="col-md-4"><label className="hp-label form-label">Location</label><input className="form-control" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
        <div className="col-md-4"><label className="hp-label form-label">Mode</label><select className="form-select" value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })}><option value="onsite">Onsite</option><option value="online">Online</option>{kind === 'interview' && <option value="phone">Phone</option>}</select></div>
      </div>
      {kind === 'interview' && form.mode === 'online' && <input required type="url" className="form-control mt-2" placeholder="Meeting link" value={form.meeting_link} onChange={(e) => setForm({ ...form, meeting_link: e.target.value })} />}
      <div className="d-flex gap-2 mt-2"><button className="btn hp-btn-accent btn-sm" disabled={submitting}>Save {kind}</button><button type="button" className="btn hp-btn-outline btn-sm" onClick={onCancel}>Cancel</button></div>
    </form>
  )
}

export default function JobApplicants() {
  const { id } = useParams()
  const [applications, setApplications] = useState([])
  const [filters, setFilters] = useState({ status: '', graduation_university: '', cgpa_min: '', semi_point_min: '', final_point_min: '' })
  const [selected, setSelected] = useState([])
  const [bulkStatus, setBulkStatus] = useState('')
  const [examSchedule, setExamSchedule] = useState({ scheduled_at: '', location: '', laws_requirements: '' })
  const [interviewSchedule, setInterviewSchedule] = useState({ scheduled_at: '', mode: 'onsite', location: '', meeting_link: '' })
  const [documentApproval, setDocumentApproval] = useState({ required_documents: '', deadline: '', location: '', announcement: '' })
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)

  function load() {
    setLoading(true)
    api.get(`/jobs/${id}/applicants`, { params: filters })
      .then(({ data }) => setApplications(data.data ?? data))
      .catch((err) => toast.error(err.response?.data?.message ?? 'Could not load applicants.'))
      .finally(() => setLoading(false))
  }
  useEffect(load, [id, filters])

  function toggle(idValue) {
    setSelected((items) => items.includes(idValue) ? items.filter((item) => item !== idValue) : [...items, idValue])
  }
  function toggleAll() { setSelected(selected.length === applications.length ? [] : applications.map((app) => app.id)) }
  async function applyBulkStatus(e) {
    const status = e.target.value
    setBulkStatus(status)
    if (!status || !selected.length) return
    if (status === 'exam_scheduled') {
      return
    }
    if (['interview_scheduled', 'documentation_requested'].includes(status)) return
    if (!window.confirm(`Apply "${status}" to ${selected.length} selected applicant(s)?`)) return
    setBusy(true)
    try {
      await api.patch('/applications/bulk-status', { application_ids: selected, status })
      toast.success('Bulk status updated')
      setSelected([])
      load()
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Could not update selected applicants.')
    } finally {
      setBulkStatus('')
      setBusy(false)
    }
  }
  async function scheduleSelectedExam(e) {
    e.preventDefault()
    if (!window.confirm(`Schedule an exam for ${selected.length} selected applicant(s)?`)) return
    setBusy(true)
    try { await Promise.all(selected.map((applicationId) => api.post(`/applications/${applicationId}/schedule-exam`, examSchedule))); toast.success('Exam scheduled'); setSelected([]); setBulkStatus(''); load() }
    catch (err) { toast.error(err.response?.data?.message ?? 'Could not schedule exams.') } finally { setBusy(false) }
  }
  async function scheduleSelectedInterview(e) {
    e.preventDefault()
    if (!window.confirm(`Schedule an interview for ${selected.length} selected applicant(s)?`)) return
    setBusy(true)
    try { await Promise.all(selected.map((applicationId) => api.post(`/applications/${applicationId}/schedule-interview`, { ...interviewSchedule, meeting_link: interviewSchedule.mode === 'online' ? interviewSchedule.meeting_link : '' }))); toast.success('Interview scheduled'); setSelected([]); setBulkStatus(''); load() }
    catch (err) { toast.error(err.response?.data?.message ?? 'Could not schedule interviews.') } finally { setBusy(false) }
  }
  async function requestSelectedDocuments(e) {
    e.preventDefault()
    if (!window.confirm(`Send document approval instructions to ${selected.length} selected applicant(s)?`)) return
    setBusy(true)
    try { await Promise.all(selected.map((applicationId) => api.post(`/applications/${applicationId}/request-documents`, { required_documents: documentApproval.required_documents.split(',').map((item) => item.trim()).filter(Boolean), deadline: new Date(documentApproval.deadline).toISOString(), location: documentApproval.location, announcement: documentApproval.announcement }))); toast.success('Document approval instructions sent'); setSelected([]); setBulkStatus(''); load() }
    catch (err) { toast.error(err.response?.data?.message ?? 'Could not send document approval instructions.') } finally { setBusy(false) }
  }
  async function exportCsv() {
    try {
      const { data } = await api.get(`/jobs/${id}/applicants/export`, { params: filters, responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([data])); const link = document.createElement('a'); link.href = url; link.download = `applicants-job-${id}.csv`; link.click(); URL.revokeObjectURL(url)
    } catch { toast.error('Could not export applicants.') }
  }
  function downloadTemplate() {
    const blob = new Blob(['applicant_id,exam_result,interview_result\r\n'], { type: 'text/csv' })
    const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'applicant-results-template.csv'; link.click(); URL.revokeObjectURL(url)
  }
  async function importResults(e) {
    const file = e.target.files[0]; if (!file) return
    const form = new FormData(); form.append('file', file)
    try { const { data } = await api.post('/applications/import-results', form); toast.success(data.message); load() }
    catch (err) { toast.error(err.response?.data?.message ?? 'Could not import results.') }
    e.target.value = ''
  }

  return (
    <div className="container py-5">
      <Link to="/employer/jobs" className="hp-nav-link">← All jobs</Link>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mt-3 mb-4">
        <div><p className="hp-eyebrow mb-1">Applicants</p><h1 className="hp-h1 mb-0">Review candidates.</h1></div>
        <div className="d-flex flex-wrap gap-2">
          <button className="btn hp-btn-outline btn-sm" onClick={downloadTemplate}>CSV template</button>
          <label className="btn hp-btn-outline btn-sm mb-0">Import results<input hidden type="file" accept=".csv,.txt" onChange={importResults} /></label>
          <button className="btn hp-btn-outline btn-sm" onClick={exportCsv}>Export filtered CSV</button>
        </div>
      </div>
      <div className="hp-card mb-3">
        <div className="row g-2">
          <div className="col-md-2"><label className="hp-label form-label">Status</label><select className="form-select" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}><option value="">All</option>{['applied', 'shortlisted', 'exam_scheduled', 'interview_scheduled', 'reserved', 'documentation_requested', 'hired', 'rejected'].map((s) => <option key={s} value={s}>{s === 'documentation_requested' ? 'document approval' : s.replaceAll('_', ' ')}</option>)}</select></div>
          <div className="col-md-3"><label className="hp-label form-label">Graduation university</label><input className="form-control" value={filters.graduation_university} onChange={(e) => setFilters({ ...filters, graduation_university: e.target.value })} /></div>
          <div className="col-md-2"><label className="hp-label form-label">Minimum CGPA</label><input type="number" step="0.01" min="0" max="4" className="form-control" value={filters.cgpa_min} onChange={(e) => setFilters({ ...filters, cgpa_min: e.target.value })} /></div>
          <div className="col-md-2"><label className="hp-label form-label">Minimum semi-point</label><input type="number" step="0.01" min="0" max="65" className="form-control" value={filters.semi_point_min} onChange={(e) => setFilters({ ...filters, semi_point_min: e.target.value })} /></div>
          <div className="col-md-2"><label className="hp-label form-label">Minimum final-point</label><input type="number" step="0.01" min="0" max="100" className="form-control" value={filters.final_point_min} onChange={(e) => setFilters({ ...filters, final_point_min: e.target.value })} /></div>
          <div className="col-md-1 d-flex align-items-end"><button className="btn hp-btn-outline btn-sm" onClick={() => setFilters({ status: '', graduation_university: '', cgpa_min: '', semi_point_min: '', final_point_min: '' })}>Clear</button></div>
        </div>
      </div>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <div className="d-flex gap-2 align-items-center"><strong>{selected.length}</strong> selected<select className="form-select form-select-sm" value={bulkStatus} onChange={applyBulkStatus} disabled={busy || !selected.length}><option value="">Bulk status…</option>{STATUS_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
        {loading && <span className="hp-muted">Loading…</span>}
      </div>
      {bulkStatus === 'exam_scheduled' && <form className="hp-card mb-3" onSubmit={scheduleSelectedExam}><h3 className="hp-h3">Exam schedule</h3><div className="row g-2"><div className="col-md-4"><label className="hp-label">Date and time</label><input required type="datetime-local" className="form-control" value={examSchedule.scheduled_at} onChange={(e) => setExamSchedule({ ...examSchedule, scheduled_at: e.target.value })} /></div><div className="col-md-4"><label className="hp-label">Location</label><input required className="form-control" value={examSchedule.location} onChange={(e) => setExamSchedule({ ...examSchedule, location: e.target.value })} /></div><div className="col-md-4"><label className="hp-label">Exam laws and requirements</label><input required className="form-control" value={examSchedule.laws_requirements} onChange={(e) => setExamSchedule({ ...examSchedule, laws_requirements: e.target.value })} /></div></div><button className="btn hp-btn-accent mt-3">Schedule exam</button></form>}
      {bulkStatus === 'interview_scheduled' && <form className="hp-card mb-3" onSubmit={scheduleSelectedInterview}><h3 className="hp-h3">Interview schedule</h3><div className="row g-2"><div className="col-md-4"><label className="hp-label">Date and time</label><input required type="datetime-local" className="form-control" value={interviewSchedule.scheduled_at} onChange={(e) => setInterviewSchedule({ ...interviewSchedule, scheduled_at: e.target.value })} /></div><div className="col-md-4"><label className="hp-label">Interview type</label><select className="form-select" value={interviewSchedule.mode} onChange={(e) => setInterviewSchedule({ ...interviewSchedule, mode: e.target.value })}><option value="onsite">Onsite</option><option value="online">Online</option></select></div><div className="col-md-4"><label className="hp-label">{interviewSchedule.mode === 'online' ? 'Meeting link' : 'Location'}</label><input required type={interviewSchedule.mode === 'online' ? 'url' : 'text'} className="form-control" value={interviewSchedule.mode === 'online' ? interviewSchedule.meeting_link : interviewSchedule.location} onChange={(e) => setInterviewSchedule({ ...interviewSchedule, [interviewSchedule.mode === 'online' ? 'meeting_link' : 'location']: e.target.value })} /></div></div><button className="btn hp-btn-accent mt-3">Schedule interview</button></form>}
      {bulkStatus === 'documentation_requested' && <form className="hp-card mb-3" onSubmit={requestSelectedDocuments}><h3 className="hp-h3">Document approval</h3><div className="row g-2"><div className="col-md-3"><label className="hp-label">Documents to bring</label><input required className="form-control" placeholder="CV, degree, ID" value={documentApproval.required_documents} onChange={(e) => setDocumentApproval({ ...documentApproval, required_documents: e.target.value })} /></div><div className="col-md-3"><label className="hp-label">Deadline</label><input required type="datetime-local" className="form-control" value={documentApproval.deadline} onChange={(e) => setDocumentApproval({ ...documentApproval, deadline: e.target.value })} /></div><div className="col-md-3"><label className="hp-label">Location</label><input required className="form-control" value={documentApproval.location} onChange={(e) => setDocumentApproval({ ...documentApproval, location: e.target.value })} /></div><div className="col-md-3"><label className="hp-label">Announcement</label><input required className="form-control" value={documentApproval.announcement} onChange={(e) => setDocumentApproval({ ...documentApproval, announcement: e.target.value })} /></div></div><button className="btn hp-btn-accent mt-3">Send document approval</button></form>}
      <div className="table-responsive">
        <table className="table table-sm align-middle">
          <thead><tr><th><input type="checkbox" checked={applications.length > 0 && selected.length === applications.length} onChange={toggleAll} /></th><th>Applicant ID</th><th>Full name</th><th>Address</th><th>Graduation university</th><th>CGPA</th><th>Semi-point</th><th>Final-point</th><th>Status control</th><th></th></tr></thead>
          <tbody>
            {!loading && applications.map((app) => (
              <tr key={app.id}>
                <td><input type="checkbox" checked={selected.includes(app.id)} onChange={() => toggle(app.id)} /></td>
                <td>{app.applicant_id ?? 'N/A'}</td><td>{app.applicant?.name ?? 'N/A'}</td><td>{app.applicant?.address ?? 'N/A'}</td><td>{app.applicant?.graduation_university ?? 'N/A'}</td><td>{app.applicant?.cgpa ?? 'N/A'}</td><td>{app.semi_point ?? 'N/A'}</td><td>{app.final_point ?? 'N/A'}</td>
                <td className="text-capitalize">{app.status?.replaceAll('_', ' ') ?? 'N/A'}</td>
                <td><Link className="btn hp-btn-outline btn-sm" to={`/employer/jobs/${id}/applicants/${app.id}`}>View details</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
