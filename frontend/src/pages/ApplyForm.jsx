import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { toast } from 'react-toastify'
import { useAuth } from '../contexts/AuthContext'

export default function ApplyForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [coverLetter, setCoverLetter] = useState('')
  const [resume, setResume] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({})

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setErrors({})

    const formData = new FormData()
    if (coverLetter) formData.append('cover_letter', coverLetter)
    if (resume) formData.append('resume', resume)

    try {
      await api.post(`/jobs/${id}/apply`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      toast.success('Application submitted successfully')
      navigate('/my-applications')
    } catch (err) {
      const resp = err.response?.data
      setErrors(resp?.errors ?? {})
      toast.error(resp?.message ?? 'Could not submit your application.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container py-5" style={{ maxWidth: 640 }}>
      <p className="hp-eyebrow">Applying as {user?.name}</p>
      <h1 className="hp-h2 mb-4">Submit your application</h1>

      <form onSubmit={handleSubmit} className="hp-auth-card" style={{ maxWidth: 'none' }}>
        <label className="form-label hp-label">Cover letter (optional)</label>
        <textarea
          className="form-control mb-1"
          rows={6}
          maxLength={5000}
          value={coverLetter}
          onChange={(e) => setCoverLetter(e.target.value)}
          placeholder="Tell them why you're a fit for this role…"
        />
        {errors.cover_letter && <p className="text-danger small">{errors.cover_letter[0]}</p>}

        <label className="form-label hp-label mt-3">Resume (PDF, DOC, or DOCX — max 5MB)</label>
        <input
          type="file"
          className="form-control mb-1"
          accept=".pdf,.doc,.docx"
          onChange={(e) => setResume(e.target.files[0] ?? null)}
        />
        {errors.resume && <p className="text-danger small">{errors.resume[0]}</p>}
        {errors.resume_id && <p className="text-danger small">{errors.resume_id[0]}</p>}

        <button className="btn hp-btn-accent w-100 mt-4" disabled={submitting}>
          {submitting ? 'Submitting…' : 'Submit application'}
        </button>
      </form>
    </div>
  )
}
