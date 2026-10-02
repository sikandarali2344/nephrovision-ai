import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Activity, Bell, ChartNoAxesCombined, FileSearch,
  History, LayoutDashboard, LogOut, Menu, Moon, Search, Server, ShieldCheck, Sun,
  ScrollText, UserRound, Users, X,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import RoleBadge from './RoleBadge'

const LINKS_BY_ROLE = {
  patient: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/history', label: 'Assessment History', icon: History },
    { to: '/profile', label: 'Profile', icon: UserRound },
  ],
  doctor: [
    { to: '/doctor', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/doctor/patients', label: 'Patients', icon: Users },
    { to: '/doctor#reports', label: 'Reports', icon: FileSearch },
    { to: '/profile', label: 'Profile', icon: UserRound },
  ],
  admin: [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin?tab=users', label: 'Users', icon: Users },
    { to: '/admin?tab=model', label: 'Model Performance', icon: ChartNoAxesCombined },
    { to: '/admin?tab=logs', label: 'Audit Logs', icon: ScrollText },
    { to: '/admin?tab=overview#system-status', label: 'System Status', icon: Server },
    { to: '/profile', label: 'Profile', icon: UserRound },
  ],
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const { theme, toggle } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const [search, setSearch] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)

  if (!user) {
    return (
      <motion.nav initial={{ y: -24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="public-nav">
        <Link to="/" className="public-nav__brand"><Activity size={19} /> NephroVision AI</Link>
        <Link to="/login" className="public-nav__login">Log in</Link>
      </motion.nav>
    )
  }

  const links = LINKS_BY_ROLE[user.role] || []
  const visibleLinks = links.filter((link) => link.label.toLowerCase().includes(search.trim().toLowerCase()))
  const notificationPath = user.role === 'patient' ? '/history' : user.role === 'doctor' ? '/doctor/patients' : '/admin?tab=logs'
  const initials = user.full_name?.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase() || 'NV'

  const signOut = () => {
    logout()
    navigate('/')
  }

  return (
    <>
      {drawerOpen && <button className="sidebar-backdrop" aria-label="Close navigation" onClick={() => setDrawerOpen(false)} />}
      <aside className={`app-sidebar ${drawerOpen ? 'app-sidebar--open' : ''}`}>
        <Link to={user.role === 'patient' ? '/dashboard' : user.role === 'doctor' ? '/doctor' : '/admin'} className="sidebar-brand">
          <span className="sidebar-brand__mark"><Activity size={19} /></span>
          <span><strong>NephroVision</strong><small>AI clinical platform</small></span>
          <button className="sidebar-close" aria-label="Close navigation" onClick={(event) => { event.preventDefault(); setDrawerOpen(false) }}><X size={18} /></button>
        </Link>

        <div className="sidebar-section-label">Workspace</div>
        <nav className="sidebar-links" aria-label="Main navigation">
          {visibleLinks.length ? visibleLinks.map(({ to, label, icon: Icon }) => {
            const targetPath = to.split(/[?#]/)[0]
            const targetTab = new URLSearchParams(to.split('?')[1]?.split('#')[0] || '').get('tab')
            const isActive = user.role === 'admin'
              ? location.pathname === '/admin'
                && (new URLSearchParams(location.search).get('tab') || 'overview') === (targetTab || 'overview')
                && (label === 'System Status' ? location.hash === '#system-status' : location.hash !== '#system-status')
              : label === 'Reports'
                ? location.pathname === '/doctor' && location.hash === '#reports'
                : location.pathname === targetPath && (targetPath !== '/doctor' || location.hash !== '#reports')
            return (
            <Link key={`${label}-${to}`} to={to} onClick={() => setDrawerOpen(false)} className={`sidebar-link ${isActive ? 'sidebar-link--active' : ''}`}>
              <Icon size={18} strokeWidth={1.8} /><span>{label}</span>
            </Link>
            )
          }) : <p className="sidebar-empty">No matching pages</p>}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-security"><ShieldCheck size={17} /><span>Secure clinical workspace</span></div>
          <button onClick={signOut} className="sidebar-logout"><LogOut size={17} /> Log out</button>
        </div>
      </aside>

      <header className="app-topbar">
        <button className="mobile-menu" aria-label="Open navigation" onClick={() => setDrawerOpen(true)}><Menu size={20} /></button>
        <label className="topbar-search"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find a page" aria-label="Find a page" /></label>
        <div className="topbar-actions">
          <Link to={notificationPath} className="topbar-icon" aria-label="Open updates"><Bell size={18} /></Link>
          <button onClick={toggle} className="topbar-icon" aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <Link to="/profile" className="topbar-user">
            <span className="topbar-avatar">{initials}</span>
            <span className="topbar-user__copy"><strong>{user.full_name}</strong><RoleBadge role={user.role} /></span>
          </Link>
          <button onClick={signOut} className="topbar-signout" aria-label="Log out"><LogOut size={18} /></button>
        </div>
      </header>
    </>
  )
}