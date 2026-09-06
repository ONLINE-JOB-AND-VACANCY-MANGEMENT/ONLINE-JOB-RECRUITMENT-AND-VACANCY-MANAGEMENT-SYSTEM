import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import logo from '../assets/aastu-logo.jpg'

function NavItem({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => 'hp-nav-link' + (isActive ? ' hp-nav-link--active' : '')}
    >
      {children}
    </NavLink>
  )
}

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  async function handleLogout() {
    await logout()
    setOpen(false)
    navigate('/')
  }

  const sidebarContent = (
    <>
      <Link to="/" className="hp-sidebar-logo" onClick={() => setOpen(false)}>
        <img src={logo} alt="AASTU logo" />
        <span className="hp-brand">
          AASTU<br /><span className="hp-brand-accent">JobPortal</span>
        </span>
      </Link>

      <nav className="hp-sidebar-nav" onClick={() => setOpen(false)}>
        <NavItem to="/jobs">Browse jobs</NavItem>

        {user?.role === 'job_seeker' && (
          <>
            <p className="hp-sidebar-section-label">Job seeker</p>
            <NavItem to="/my-applications">My applications</NavItem>
            <NavItem to="/bookmarks">Bookmarks</NavItem>
          </>
        )}

        {user?.role === 'manager' && (
          <>
            <p className="hp-sidebar-section-label">Manager</p>
            <NavItem to="/manager/requisitions">My requisitions</NavItem>
          </>
        )}

        {user?.role === 'employer' && (
          <>
            <p className="hp-sidebar-section-label">HR</p>
            <NavItem to="/employer/jobs">Manage jobs</NavItem>
            <NavItem to="/employer/requisitions">Requisitions</NavItem>
          </>
        )}

        {user?.role === 'admin' && (
          <>
            <p className="hp-sidebar-section-label">Admin</p>
            <NavItem to="/admin/users">Staff</NavItem>
          </>
        )}

        {user && (
          <>
            <p className="hp-sidebar-section-label">Account</p>
            <NavItem to="/notifications">Notifications</NavItem>
          </>
        )}
      </nav>

      <div className="hp-sidebar-footer">
        {!user && (
          <>
            <NavItem to="/login">Log in</NavItem>
            <Link to="/register" className="btn hp-btn-accent btn-sm text-center" onClick={() => setOpen(false)}>
              Get started
            </Link>
          </>
        )}
        {user && (
          <>
            <span className="hp-user-chip">{user.name} · {user.role?.replace('_', ' ') ?? 'no role'}</span>
            <button onClick={handleLogout} className="btn btn-sm hp-btn-outline">Log out</button>
          </>
        )}
      </div>
    </>
  )

  return (
    <>
      <div className="hp-mobile-topbar">
        <button className="hp-mobile-toggle" onClick={() => setOpen(true)} aria-label="Open menu">
          ☰
        </button>
        <img src={logo} alt="AASTU logo" />
        <span className="hp-brand">AASTU JobPortal</span>
      </div>

      {open && <div className="hp-sidebar-backdrop" onClick={() => setOpen(false)} />}

      <aside className={'hp-sidebar' + (open ? ' hp-sidebar--open' : '')}>
        {sidebarContent}
      </aside>
    </>
  )
}
