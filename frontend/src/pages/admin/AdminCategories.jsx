import { useEffect, useState } from 'react'
import api from '../../services/api'
import { toast } from 'react-toastify'

export default function AdminCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [busyId, setBusyId] = useState(null)

  function load() {
    setLoading(true)
    api
      .get('/categories')
      .then(({ data }) => setCategories(Array.isArray(data) ? data : data.data ?? []))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  async function handleCreate(e) {
    e.preventDefault()
    setCreating(true)
    try {
      await api.post('/categories', { name: newName })
      toast.success('Category created')
      setNewName('')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Could not create category.')
    } finally {
      setCreating(false)
    }
  }

  function startEdit(cat) {
    setEditingId(cat.id)
    setEditName(cat.name)
  }

  async function saveEdit(id) {
    setBusyId(id)
    try {
      await api.put(`/categories/${id}`, { name: editName })
      toast.success('Category updated')
      setEditingId(null)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Could not update category.')
    } finally {
      setBusyId(null)
    }
  }

  async function handleDelete(id) {
    setBusyId(id)
    try {
      await api.delete(`/categories/${id}`)
      toast.success('Category deleted')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Could not delete category.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="container py-5">
      <p className="hp-eyebrow">Taxonomy</p>
      <h1 className="hp-h1 mb-4">Manage categories.</h1>

      <form onSubmit={handleCreate} className="d-flex gap-2 mb-4" style={{ maxWidth: 480 }}>
        <input
          className="form-control"
          placeholder="New category name…"
          required
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button className="btn hp-btn-accent" disabled={creating}>
          {creating ? 'Adding…' : 'Add'}
        </button>
      </form>

      {loading && <p className="hp-muted">Loading…</p>}

      <div className="d-flex flex-column gap-2">
        {categories.map((cat) => (
          <div className="hp-card d-flex flex-wrap justify-content-between align-items-center gap-3 py-3" key={cat.id}>
            {editingId === cat.id ? (
              <input
                className="form-control"
                style={{ maxWidth: 300 }}
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            ) : (
              <div>
                <p className="hp-card-title mb-0" style={{ fontSize: '1rem' }}>{cat.name}</p>
                <p className="hp-card-meta mb-0">{cat.jobs_count ?? 0} job{cat.jobs_count === 1 ? '' : 's'}</p>
              </div>
            )}
            <div className="d-flex gap-2">
              {editingId === cat.id ? (
                <>
                  <button className="btn hp-btn-accent btn-sm" disabled={busyId === cat.id} onClick={() => saveEdit(cat.id)}>
                    Save
                  </button>
                  <button className="btn hp-btn-outline btn-sm" onClick={() => setEditingId(null)}>
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button className="btn hp-btn-outline btn-sm" onClick={() => startEdit(cat)}>
                    Rename
                  </button>
                  <button className="btn hp-btn-reject btn-sm" disabled={busyId === cat.id} onClick={() => handleDelete(cat.id)}>
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
