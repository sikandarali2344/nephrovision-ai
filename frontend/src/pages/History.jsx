import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Download, History as HistoryIcon } from 'lucide-react'
import GlassCard from '../components/ui/GlassCard'
import Button from '../components/ui/Button'
import PageHeader from '../components/ui/PageHeader'
import RiskBadge from '../components/ui/RiskBadge'
import LoadingSkeleton from '../components/ui/LoadingSkeleton'
import ErrorState from '../components/ui/ErrorState'
import EmptyState from '../components/ui/EmptyState'
import MedicalDisclaimer from '../components/ui/MedicalDisclaimer'
import { downloadPatientReport } from '../utils/pdfReport'
import api from '../api/client'

export default function History() {
  const [history, setHistory] = useState([])
  const [expanded, setExpanded] = useState(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = () => {
    setLoading(true)
    setError(null)
    api.get('/history')
      .then((res) => setHistory(res.data))
      .catch(setError)
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const filtered = history.filter((h) =>
    (h.ckd_stage || '').toLowerCase().includes(search.toLowerCase()) ||
    (h.kidney_failure_risk || '').toLowerCase().includes(search.toLowerCase())
  )

  const exportCSV = () => {
    const header = ['ID', 'Date', 'CKD Probability', 'Stage', 'Failure Risk', 'Dialysis Required', 'Model Version']
    const rows = filtered.map((h) => [
      h.id, new Date(h.created_at).toLocaleString(), h.ckd_probability, h.ckd_stage,
      h.kidney_failure_risk, h.dialysis_required, h.model_version || '',
    ])
    const csv = [header, ...rows].map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'nephrovision-history.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <PageHeader
        title="Assessment History"
        subtitle="Every CKD risk assessment you've run, most recent first"
        action={
          <div className="flex gap-3">
            <input
              value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Filter by stage or risk…"
              className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm outline-none focus:border-primary"
            />
            <Button variant="ghost" onClick={exportCSV}><Download size={16} className="inline mr-2" />Export CSV</Button>
          </div>
        }
      />

      {loading && <LoadingSkeleton variant="row" rows={5} />}
      {error && <ErrorState error={error} context="load your history" onRetry={load} />}

      {!loading && !error && filtered.length === 0 && (
        <GlassCard>
          <EmptyState icon={HistoryIcon} title="No assessments found" description="Run a risk assessment, or try a different filter." />
        </GlassCard>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="space-y-3 mb-6">
          {filtered.map((h) => (
            <motion.div key={h.id} layout>
              <GlassCard tilt={false}>
                <div
                  className="flex items-center justify-between cursor-pointer flex-wrap gap-2"
                  onClick={() => setExpanded(expanded === h.id ? null : h.id)}
                >
                  <div className="flex items-center gap-3">
                    <RiskBadge label={h.ckd_stage} />
                    <span className="text-slate-400 text-sm">{new Date(h.created_at).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-primary font-semibold">{(h.ckd_probability * 100).toFixed(1)}%</span>
                    <Button
                      variant="ghost" className="!px-3 !py-1.5 text-xs"
                      onClick={(e) => { e.stopPropagation(); downloadPatientReport(h) }}
                    >
                      Download Report
                    </Button>
                    <motion.div animate={{ rotate: expanded === h.id ? 180 : 0 }}>
                      <ChevronDown size={18} />
                    </motion.div>
                  </div>
                </div>
                <AnimatePresence>
                  {expanded === h.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-4 mt-4 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                        <div><span className="text-slate-400 block">Failure Risk</span>{h.kidney_failure_risk}</div>
                        <div><span className="text-slate-400 block">Dialysis Flag</span>{h.dialysis_required ? 'Yes' : 'No'}</div>
                        <div><span className="text-slate-400 block">Model Version</span>{h.model_version || '—'}</div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}

      <MedicalDisclaimer />
    </div>
  )
}
