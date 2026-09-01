import { useEffect, useState } from 'react'
import api from '../../services/api'
import { toast } from 'react-toastify'

export default function AdminSkills() {
  const [skills, setSkills] = useState([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [busyId, setBusyId] = useState(null)

  function load() {
    setLoading(true)
    api
      .get('/skills')
      .then(({ data }) => setSkills(Array.isArray(data) ? data : data.data ?? []))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  async function handleCreate(e) {
    e.preventDefault()
    setCreating(true)
    try {
      await api.post('/skills', { name: newName })
      toast.success('Skill added')
      setNewName('')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Could not add skill.')
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(id) {
    setBusyId(id)
    try {
      await api.delete(`/skills/${id}`)
      toast.success('Skill deleted')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Could not delete skill.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="container py-5">
      <p className="hp-eyebrow">Taxonomy</p>
      <h1 className="hp-h1 mb-4">Manage skills.</h1>

      <form onSubmit={handleCreate} className="d-flex gap-2 mb-4" style={{ maxWidth: 480 }}>
        <input
          className="form-control"
          placeholder="New skill name…"
          required
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button className="btn hp-btn-accent" disabled={creating}>
          {creating ? 'Adding…' : 'Add'}
        </button>
      </form>

      {loading && <p className="hp-muted">Loading…</p>}

      <div className="hp-card-skills">
        {skills.map((skill) => (
          <span key={skill.id} className="hp-skill-pill">
            {skill.name}
            <button
              type="button"
              className="hp-skill-pill-remove"
              disabled={busyId === skill.id}
              onClick={() => handleDelete(skill.id)}
              aria-label={`Delete ${skill.name}`}
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  )
}
