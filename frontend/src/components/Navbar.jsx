import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  return (
    <nav className="hp-navbar">
      <div className="container d-flex flex-wrap align-items-center justify-content-between gap-3">
        <Link className="hp-brand" to="/">
          Hire<span className="hp-brand-accent">Path</span>
        </Link>
        <div className="d-flex align-items-center flex-wrap gap-3">
          <Link to="/jobs" className="hp-nav-link">Browse jobs</Link>
          {user?.role === 'job_seeker' && (
            <Link to="/my-applications" className="hp-nav-link">My applications</Link>
          )}
          {!user && <Link to="/login" className="hp-nav-link">Log in</Link>}
          {!user && (
            <Link to="/register" className="btn hp-btn-accent btn-sm">Get started</Link>
          )}
          {user && (
            <div className="d-flex align-items-center gap-2">
              <span className="hp-user-chip">{user.name} · {user.role.replace('_', ' ')}</span>
              <button onClick={handleLogout} className="btn btn-sm hp-btn-outline">Log out</button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
