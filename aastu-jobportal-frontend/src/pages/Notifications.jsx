import { useEffect, useState } from 'react'
import api from '../services/api'
import { toast } from 'react-toastify'

export default function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [markingAll, setMarkingAll] = useState(false)

  function load() {
    setLoading(true)
    api
      .get('/notifications')
      .then(({ data }) => setNotifications(data.data ?? data))
      .catch(() => setError('Could not load notifications.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  async function markRead(id) {
    setBusyId(id)
    try {
      await api.patch(`/notifications/${id}/read`)
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Could not update notification.')
    } finally {
      setBusyId(null)
    }
  }

  async function markAllRead() {
    setMarkingAll(true)
    try {
      await api.patch('/notifications/read-all')
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      toast.success('All notifications marked as read')
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Could not update notifications.')
    } finally {
      setMarkingAll(false)
    }
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <div className="container py-5">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <p className="hp-eyebrow">Updates</p>
          <h1 className="hp-h1 mb-0">Notifications.</h1>
        </div>
        {unreadCount > 0 && (
          <button className="btn hp-btn-outline btn-sm" onClick={markAllRead} disabled={markingAll}>
            {markingAll ? 'Marking…' : `Mark all read (${unreadCount})`}
          </button>
        )}
      </div>

      {loading && <p className="hp-muted">Loading…</p>}
      {error && <p className="text-danger">{error}</p>}
      {!loading && !error && notifications.length === 0 && (
        <p className="hp-muted">Nothing here yet — you'll see updates on your applications and requisitions as they happen.</p>
      )}

      <div className="d-flex flex-column gap-2">
        {notifications.map((n) => (
          <div
            key={n.id}
            className="hp-card d-flex flex-wrap justify-content-between align-items-center gap-3 py-3"
            style={{ opacity: n.is_read ? 0.6 : 1 }}
          >
            <div>
              <p className="hp-card-title mb-1" style={{ fontSize: '1rem' }}>{n.title}</p>
              <p className="hp-card-meta mb-0">{n.message}</p>
            </div>
            {!n.is_read && (
              <button
                className="btn hp-btn-outline btn-sm"
                disabled={busyId === n.id}
                onClick={() => markRead(n.id)}
              >
                {busyId === n.id ? 'Marking…' : 'Mark read'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
