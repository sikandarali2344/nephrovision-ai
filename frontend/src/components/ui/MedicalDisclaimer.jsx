import React from 'react'
import { ShieldAlert } from 'lucide-react'

export default function MedicalDisclaimer({ className = '' }) {
  return (
    <div className={`flex items-start gap-3 text-xs text-slate-400 bg-white/5 border border-white/10 rounded-xl px-4 py-3 ${className}`}>
      <ShieldAlert size={16} className="text-primary shrink-0 mt-0.5" />
      <span>
        AI-generated risk assessment is for decision support and does not replace
        professional medical evaluation.
      </span>
    </div>
  )
}
