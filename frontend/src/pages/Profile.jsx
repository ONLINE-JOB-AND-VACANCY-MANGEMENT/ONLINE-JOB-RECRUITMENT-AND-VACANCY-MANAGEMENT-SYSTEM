import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import api from '../services/api'
import { useAuth } from '../contexts/AuthContext'

export default function Profile() {
  const { user, updateUser } = useAuth()
  const [form, setForm] = useState({ name: '', phone: '', address: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/me')
      .then(({ data }) => setForm({ name: data.name ?? '', phone: data.phone ?? '', address: data.address ?? '' }))
      .catch(() => toast.error('Could not load your profile.'))
      .finally(() => setLoading(false))
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const { data } = await api.put('/profile', form)
      await updateUser(data.user)
      toast.success('Profile updated')
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Could not update your profile.')
    } finally {
      setSaving(false)
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
        <button className="btn hp-btn-accent w-100" disabled={saving}>{saving ? 'Saving…' : 'Save profile'}</button>
      </form>
    </div>
  )
}
