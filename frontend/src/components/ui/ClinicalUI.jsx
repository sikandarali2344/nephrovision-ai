import React from 'react'
import { Activity, FileSearch } from 'lucide-react'

export function MedicalDisclaimer({ className = '' }) {
  return (
    <p className={`text-xs leading-relaxed text-slate-400 ${className}`}>
      AI-generated risk assessment is for decision support and does not replace professional medical evaluation.
    </p>
  )
}

export function RiskBadge({ risk, probability }) {
  const label = risk || (probability == null ? 'Not assessed' : probability < 0.3 ? 'Low' : probability < 0.6 ? 'Moderate' : 'High')
  const tone = /high/i.test(label)
    ? 'border-rose-400/30 bg-rose-400/10 text-rose-300'
    : /moderate/i.test(label)
      ? 'border-amber-300/30 bg-amber-300/10 text-amber-200'
      : /low|no ckd/i.test(label)
        ? 'border-emerald-300/30 bg-emerald-300/10 text-emerald-200'
        : 'border-white/15 bg-white/5 text-slate-300'
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${tone}`}>{label}</span>
}

export function StatCard({ label, value, detail, icon: Icon = Activity }) {
  return (
    <div className="glass rounded-xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <p className="mt-2 font-display text-3xl font-semibold text-white">{value}</p>
          {detail && <p className="mt-1 text-xs text-slate-500">{detail}</p>}
        </div>
        <span className="rounded-lg border border-primary/20 bg-primary/10 p-2 text-primary"><Icon size={18} /></span>
      </div>
    </div>
  )
}

export function EmptyState({ title, message }) {
  return (
    <div className="flex flex-col items-center py-10 text-center">
      <FileSearch className="mb-3 text-slate-500" size={28} />
      <p className="font-medium text-slate-200">{title}</p>
      <p className="mt-1 max-w-md text-sm text-slate-400">{message}</p>
    </div>
  )
}
