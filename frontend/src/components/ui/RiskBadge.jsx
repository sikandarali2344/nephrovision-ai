import React from 'react'

function styleFor(level) {
  const l = (level || '').toLowerCase()
  if (l.includes('no ckd') || l === 'low') return 'bg-accent/20 text-accent'
  if (l === 'moderate' || l.includes('stage 1') || l.includes('stage 2')) return 'bg-yellow-500/20 text-yellow-400'
  return 'bg-danger/20 text-danger'
}

export default function RiskBadge({ label, className = '' }) {
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${styleFor(label)} ${className}`}>
      {label || '—'}
    </span>
  )
}
