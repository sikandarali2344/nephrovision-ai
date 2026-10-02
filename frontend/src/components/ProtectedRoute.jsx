import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const HOME_BY_ROLE = { patient: '/dashboard', doctor: '/doctor', admin: '/admin' }

export default function ProtectedRoute({ children, requireRole }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />

  if (requireRole) {
    const allowed = Array.isArray(requireRole) ? requireRole : [requireRole]
    if (!allowed.includes(user.role)) {
      // Send them to their own home instead of a dead end.
      return <Navigate to={HOME_BY_ROLE[user.role] || '/dashboard'} replace />
    }
  }
  return children
}
