import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, ClipboardCheck, ChartNoAxesCombined, ArrowRight } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import MedicalHero from '../components/dashboard/MedicalHero'
import GlassCard from '../components/ui/GlassCard'
import StatCard from '../components/ui/StatCard'
import Button from '../components/ui/Button'
import PageHeader from '../components/ui/PageHeader'
import AssessmentCard from '../components/ui/AssessmentCard'
import LoadingSkeleton from '../components/ui/LoadingSkeleton'
import ErrorState from '../components/ui/ErrorState'
import EmptyState from '../components/ui/EmptyState'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'

const RISK_COLORS = { Low: '#10B981', Moderate: '#F59E0B', High: '#EF4444' }

export default function Doctor() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = () => {
    setLoading(true)
    setError(null)
    api.get('/doctor/dashboard')
      .then((res) => setData(res.data))
      .catch(setError)
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const pieData = data
    ? Object.entries(data.risk_distribution).map(([name, value]) => ({ name, value }))
    : []

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <PageHeader
        title={`Welcome, Dr. ${user?.full_name?.split(' ').slice(-1)[0] || ''}`}
        subtitle="Clinical overview of AI-assisted patient risk assessments"
        action={<Link to="/doctor/patients"><Button>View Patients <ArrowRight size={16} className="inline ml-1" /></Button></Link>}
      />

      {!loading && !error && <MedicalHero />}

      {loading && <LoadingSkeleton rows={4} />}
      {error && <ErrorState error={error} context="load the doctor dashboard" onRetry={load} />}

      {data && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 my-7">
            <StatCard icon={Users} label="Total Patients" value={data.total_patients} />
            <StatCard icon={ClipboardCheck} label="Total Assessments" value={data.total_assessments} accent="text-accent" />
            <StatCard icon={ChartNoAxesCombined} label="High-Risk Assessments" value={data.high_risk_assessments} accent="text-danger" delay={0.1} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <GlassCard className="lg:col-span-1">
              <h3 className="font-display font-semibold mb-4">Risk Distribution</h3>
              {data.total_assessments > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} isAnimationActive>
                      {pieData.map((entry) => (
                        <Cell key={entry.name} fill={RISK_COLORS[entry.name]} />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip contentStyle={{ background: '#0F172A', border: '1px solid #ffffff22' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState title="No assessments yet" description="Once patients run assessments, distribution appears here." />
              )}
            </GlassCard>

            <GlassCard className="lg:col-span-2">
              <h3 className="font-display font-semibold mb-4">Recent Patients</h3>
              {data.recent_patients.length ? (
                <div className="space-y-2">
                  {data.recent_patients.map((p) => (
                    <Link
                      key={p.id} to={`/doctor/patients/${p.id}`}
                      className="flex items-center justify-between text-sm py-2 border-b border-white/5 hover:bg-white/5 rounded-lg px-2 transition-colors"
                    >
                      <span className="font-medium">{p.full_name}</span>
                      <span className="text-slate-400">{p.latest_stage || 'No assessment yet'}</span>
                    </Link>
                  ))}
                </div>
              ) : (
                <EmptyState icon={Users} title="No patients yet" />
              )}
            </GlassCard>
          </div>

          <div id="reports" className="scroll-mt-24">
            <GlassCard tilt={false}>
              <h3 className="font-display font-semibold mb-4">Recent Assessments</h3>
              {data.recent_assessments.length ? (
                <div className="space-y-3">
                  {data.recent_assessments.map((a, i) => (
                    <AssessmentCard key={a.id} record={a} delay={i * 0.05} />
                  ))}
                </div>
              ) : (
                <EmptyState icon={ClipboardCheck} title="No assessments yet" />
              )}
            </GlassCard>
          </div>

          <GlassCard tilt={false} className="mt-6">
            <h3 className="font-display font-semibold mb-2">AI Clinical Insight</h3>
            <p className="text-slate-300 text-sm leading-6">Review each patient’s assessment and clinical context before making care decisions. AI-generated risk estimates support, but do not replace, professional judgment.</p>
            <span className="inline-flex items-center gap-2 mt-4 text-xs text-primary"><ChartNoAxesCombined size={14} /> Explainability powered by SHAP</span>
          </GlassCard>
        </>
      )}
    </div>
  )
}
