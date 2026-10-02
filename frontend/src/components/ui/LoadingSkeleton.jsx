import React from 'react'

export function SkeletonBlock({ className = '' }) {
  return <div className={`animate-pulse bg-white/10 rounded-lg ${className}`} />
}

export default function LoadingSkeleton({ rows = 3, variant = 'card' }) {
  if (variant === 'row') {
    return (
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <SkeletonBlock key={i} className="h-14 w-full" />
        ))}
      </div>
    )
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="glass rounded-2xl p-6 space-y-3">
          <SkeletonBlock className="h-3 w-20" />
          <SkeletonBlock className="h-8 w-16" />
        </div>
      ))}
    </div>
  )
}
