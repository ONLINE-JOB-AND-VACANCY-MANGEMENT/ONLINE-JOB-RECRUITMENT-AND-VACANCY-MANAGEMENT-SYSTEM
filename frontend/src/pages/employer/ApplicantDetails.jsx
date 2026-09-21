import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../../services/api'
import { toast } from 'react-toastify'

export default function ApplicantDetails() {
  const { id, applicationId } = useParams()
  const [application, setApplication] = useState(null)
  useEffect(() => {
    api.get(`/applications/${applicationId}`)
      .then(({ data }) => setApplication(data.data ?? data))
      .catch((err) => toast.error(err.response?.data?.message ?? 'Could not load applicant details.'))
  }, [applicationId])
  if (!application) return <div className="container py-5"><p className="hp-muted">Loading applicant details…</p></div>
  const applicant = application.applicant ?? {}
  return <div className="container py-5">
    <Link to={`/employer/jobs/${id}/applicants`} className="hp-nav-link">← Applicants</Link>
    <h1 className="hp-h1 mt-3">Applicant {application.applicant_id ?? 'N/A'}</h1>
    <div className="hp-card">
      <p><strong>Job deadline:</strong> {application.job?.end_date ? new Date(application.job.end_date).toLocaleString() : 'N/A'}</p>
      {Object.entries({ 'Full name': applicant.name, Email: applicant.email, Phone: applicant.phone, Address: applicant.address, 'Graduation university': applicant.graduation_university, CGPA: applicant.cgpa, 'Previously worked at': applicant.worked_company, Skills: applicant.skills, Bio: applicant.bio, Status: application.status, 'Exam result': application.exam?.score, 'Interview result': application.interview?.result, 'Semi-point': application.semi_point, 'Final-point': application.final_point }).map(([label, value]) => <p key={label} className="mb-2"><strong>{label}:</strong> {value ?? 'N/A'}</p>)}
      {application.resume?.url && <a className="btn hp-btn-outline" href={application.resume.url} target="_blank" rel="noreferrer">Open resume</a>}
      <h3 className="hp-h3 mt-4">Certificates</h3>
      {applicant.certificates?.length ? applicant.certificates.map((certificate) => <p key={certificate.id} className="mb-2"><strong>{certificate.title}</strong>{certificate.url && <> · <a href={certificate.url} target="_blank" rel="noreferrer">Open certificate</a></>}</p>) : <p className="hp-muted">N/A</p>}
    </div>
  </div>
}
