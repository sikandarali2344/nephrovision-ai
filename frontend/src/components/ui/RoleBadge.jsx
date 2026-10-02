import React from 'react'

const STYLES = {
  patient: 'bg-primary/20 text-primary',
  doctor: 'bg-accent/20 text-accent',
  admin: 'bg-purple-500/20 text-purple-400',
}

export default function RoleBadge({ role, className = '' }) {
  const style = STYLES[role] || 'bg-white/10 text-slate-300'
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${style} ${className}`}>
      {role}
    </span>
  )
}
