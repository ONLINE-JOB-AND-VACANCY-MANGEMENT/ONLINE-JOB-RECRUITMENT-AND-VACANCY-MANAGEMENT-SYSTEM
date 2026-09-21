import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import api from '../services/api'
import { useAuth } from '../contexts/AuthContext'

export default function Profile() {
  const { user, updateUser } = useAuth()
  const [form, setForm] = useState({ name: '', phone: '', address: '', bio: '', skills: '', certificate_title: '', certificate_url: '', certificate_file: null })
  const [certificates, setCertificates] = useState([])
  const [passwords, setPasswords] = useState({ password: '', password_confirmation: '' })
  const [changingPassword, setChangingPassword] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/me')
      .then(({ data }) => {
        setForm({ name: data.name ?? '', phone: data.phone ?? '', address: data.address ?? '', bio: data.bio ?? '', skills: data.skills ?? '', certificate_title: '', certificate_url: '', certificate_file: null })
        setCertificates(data.certificates ?? [])
      })
      .catch(() => toast.error('Could not load your profile.'))
      .finally(() => setLoading(false))
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = new FormData()
      Object.entries(form).forEach(([key, value]) => {
        if (value !== null && value !== '') payload.append(key, value)
      })
      payload.append('_method', 'PUT')
      const { data } = await api.post('/profile', payload)
      await updateUser(data.user)
      setCertificates(data.user.certificates ?? [])
      setForm((current) => ({ ...current, certificate_title: '', certificate_url: '', certificate_file: null }))
      toast.success('Profile updated')
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Could not update your profile.')
    } finally {
      setSaving(false)
    }

  }

  async function removeCertificate(id) {
    if (!window.confirm('Remove this certificate from your profile?')) return
    try {
      await api.delete(`/profile/certificates/${id}`)
      setCertificates((items) => items.filter((certificate) => certificate.id !== id))
      toast.success('Certificate removed')
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Could not remove certificate.')
    }
  }

  async function changePassword(e) {
    e.preventDefault()
    setChangingPassword(true)
    try {
      const { data } = await api.post('/change-password', passwords)
      await updateUser(data.user)
      setPasswords({ password: '', password_confirmation: '' })
      toast.success('Password updated')
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Could not update password.')
    } finally {
      setChangingPassword(false)
    }
  }

  if (loading) return <div className="container py-5"><p className="hp-muted">Loading profile…</p></div>

  return (
    <div className="container py-5" style={{ maxWidth: 640 }}>
      <p className="hp-eyebrow">{user?.role?.replace('_', ' ')} profile</p>
      <h1 className="hp-h1">Your profile.</h1>
      <p className="hp-muted mb-4">Update the contact information used by the recruitment portal.</p>
      <form className="hp-auth-card" onSubmit={handleSubmit}>
        <label className="hp-label form-label">Name</label>
        <input className="form-control mb-3" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <label className="hp-label form-label">Email</label>
        <input className="form-control mb-3" value={user?.email ?? ''} disabled />
        <label className="hp-label form-label">Phone</label>
        <input className="form-control mb-3" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <label className="hp-label form-label">Address</label>
        <input className="form-control mb-4" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        {user?.role === 'job_seeker' && (
          <>
            <label className="hp-label form-label">Skills (optional)</label>
            <input className="form-control mb-3" placeholder="Separate skills with commas" value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} />
            <label className="hp-label form-label">Short description (optional)</label>
            <textarea className="form-control mb-3" rows="4" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
            <h2 className="hp-h3">Certificates</h2>
            {certificates.map((certificate) => (
              <div className="d-flex justify-content-between align-items-center gap-2 border rounded p-2 mb-2" key={certificate.id}>
                <span>{certificate.title}</span>
                <button type="button" className="btn hp-btn-reject btn-sm" onClick={() => removeCertificate(certificate.id)}>Remove</button>
              </div>
            ))}
            <input className="form-control mb-2" placeholder="Certificate title" value={form.certificate_title} onChange={(e) => setForm({ ...form, certificate_title: e.target.value })} />
            <input type="url" className="form-control mb-2" placeholder="Certificate link (optional)" value={form.certificate_url} onChange={(e) => setForm({ ...form, certificate_url: e.target.value })} />
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="form-control mb-4" onChange={(e) => setForm({ ...form, certificate_file: e.target.files[0] ?? null })} />
          </>
        )}
        <button className="btn hp-btn-accent w-100" disabled={saving}>{saving ? 'Saving…' : 'Save profile'}</button>
      </form>
      <form className="hp-auth-card mt-3" onSubmit={changePassword}>
        <h2 className="hp-h3 mt-0">Change password</h2>
        <input type="password" className="form-control mb-2" required minLength="8" placeholder="New password" value={passwords.password} onChange={(e) => setPasswords({ ...passwords, password: e.target.value })} />
        <input type="password" className="form-control mb-3" required minLength="8" placeholder="Confirm new password" value={passwords.password_confirmation} onChange={(e) => setPasswords({ ...passwords, password_confirmation: e.target.value })} />
        <button className="btn hp-btn-outline w-100" disabled={changingPassword}>{changingPassword ? 'Updating…' : 'Update password'}</button>
      </form>
    </div>
  )
}
