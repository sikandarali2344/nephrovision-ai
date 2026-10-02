import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Activity, ClipboardPlus, FileText, History as HistoryIcon, HeartPulse, Layers3, ShieldCheck } from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import MedicalHero from '../components/dashboard/MedicalHero'
import GlassCard from '../components/ui/GlassCard'
import StatCard from '../components/ui/StatCard'
import RiskGauge from '../components/ui/RiskGauge'
import RiskBadge from '../components/ui/RiskBadge'
import AssessmentCard from '../components/ui/AssessmentCard'
import PageHeader from '../components/ui/PageHeader'
import MedicalDisclaimer from '../components/ui/MedicalDisclaimer'
import Button from '../components/ui/Button'
import LoadingSkeleton from '../components/ui/LoadingSkeleton'
import ErrorState from '../components/ui/ErrorState'
import EmptyState from '../components/ui/EmptyState'
import { downloadPatientReport } from '../utils/pdfReport'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'

const STAGE_ORDER = ['No CKD', 'Stage 1', 'Stage 2', 'Stage 3', 'Stage 4', 'Stage 5']

export default function Dashboard() {
  const { user } = useAuth()
  const [history, setHistory] = useState([])
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

  const latest = history[0]
  const riskScore = latest ? latest.ckd_probability : 0.1

  const trendData = [...history].reverse().map((h, i) => ({
    name: `#${i + 1}`,
    risk: Math.round(h.ckd_probability * 100),
  }))

  const stageCounts = STAGE_ORDER.map((stage) => ({
    stage,
    count: history.filter((h) => h.ckd_stage === stage).length,
  })).filter((s) => s.count > 0)

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <PageHeader
        title={`Welcome back, ${user?.full_name?.split(' ')[0] || 'there'}`}
        subtitle="Here's your kidney health overview."
        action={<Link to="/history"><Button><HistoryIcon size={16} className="inline mr-2" />My Assessments</Button></Link>}
      />

      {!loading && !error && (
        <>
          <MedicalHero
            riskScore={latest?.ckd_probability ?? null}
            healthLabel={latest?.ckd_stage}
            riskPercent={latest ? (latest.ckd_probability * 100).toFixed(1) : null}
          />
          {latest && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 my-7">
              <StatCard icon={HeartPulse} label="CKD Probability" value={latest.ckd_probability * 100} suffix="%" decimals={1} />
              <StatCard icon={Activity} label="Predicted Stage" value={latest.ckd_stage} accent="text-accent" delay={0.05} />
              <StatCard icon={ShieldCheck} label="Kidney Failure Risk" value={latest.kidney_failure_risk} accent="text-primary" delay={0.1} />
              <StatCard icon={Layers3} label="Assessments" value={history.length} accent="text-accent" delay={0.15} />
            </div>
          )}
        </>
      )}

      {loading && <LoadingSkeleton rows={4} />}
      {error && <ErrorState error={error} context="load your dashboard" onRetry={load} />}

      {!loading && !error && history.length === 0 && (
        <GlassCard>
          <EmptyState
            icon={ClipboardPlus}
            title="No assessments yet"
            description="Your doctor can record an assessment after reviewing your reports. Bring your recent blood and urine test results to your appointment."
          />
        </GlassCard>
      )}

      {!loading && !error && history.length > 0 && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <GlassCard className="lg:col-span-1 flex flex-col items-center justify-center">
              <h3 className="font-display font-semibold mb-2 self-start">Latest risk overview</h3>
              <RiskGauge probability={riskScore} size={164} label="CKD Probability" />
              <RiskBadge label={latest.ckd_stage} className="mt-2" />
            </GlassCard>
            <GlassCard className="lg:col-span-2">
              <h3 className="font-display font-semibold mb-2">AI Clinical Insight</h3>
              <p className="text-slate-300 text-sm leading-6">The current assessment indicates that several clinical factors contributed to the predicted risk. Review the detailed explanation before making clinical decisions.</p>
              <span className="inline-flex items-center gap-2 mt-4 text-xs text-primary"><Activity size={14} /> Explainability powered by SHAP</span>
            </GlassCard>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <GlassCard className="lg:col-span-2">
              <h3 className="font-display font-semibold mb-4">Risk Trend Over Time</h3>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff1a" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} unit="%" />
                  <Tooltip contentStyle={{ background: '#0F172A', border: '1px solid #ffffff22' }} />
                  <Line type="monotone" dataKey="risk" stroke="#0EA5E9" strokeWidth={3} dot={{ r: 4 }} isAnimationActive />
                </LineChart>
              </ResponsiveContainer>
            </GlassCard>

            <GlassCard>
              <h3 className="font-display font-semibold mb-4">Quick Access</h3>
              <div className="flex flex-col gap-3">
                <Button variant="ghost" onClick={() => downloadPatientReport(latest)} className="justify-start">
                  <FileText size={16} className="inline mr-2" /> Latest Report (PDF)
                </Button>
                <Link to="/history">
                  <Button variant="ghost" className="w-full justify-start">
                    <HistoryIcon size={16} className="inline mr-2" /> Full History
                  </Button>
                </Link>
              </div>
            </GlassCard>
          </div>

          {stageCounts.length > 0 && (
            <GlassCard className="mb-6">
              <h3 className="font-display font-semibold mb-4">CKD Stage Distribution (Your History)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stageCounts}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff1a" />
                  <XAxis dataKey="stage" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: '#0F172A', border: '1px solid #ffffff22' }} />
                  <Bar dataKey="count" fill="#10B981" radius={[6, 6, 0, 0]} isAnimationActive />
                </BarChart>
              </ResponsiveContainer>
            </GlassCard>
          )}

          <GlassCard tilt={false} className="mb-6">
            <h3 className="font-display font-semibold mb-4">Recent Assessments</h3>
            <div className="space-y-3">
              {history.slice(0, 4).map((h, i) => (
                <AssessmentCard
                  key={h.id} record={h} delay={i * 0.05}
                  onDownload={() => downloadPatientReport(h)}
                />
              ))}
            </div>
          </GlassCard>
        </>
      )}

      <MedicalDisclaimer />
    </div>
  )
}
