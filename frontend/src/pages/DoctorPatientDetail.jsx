import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, ClipboardPlus, FileText } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, Cell } from 'recharts'
import GlassCard from '../components/ui/GlassCard'
import PageHeader from '../components/ui/PageHeader'
import RiskGauge from '../components/ui/RiskGauge'
import RiskBadge from '../components/ui/RiskBadge'
import Button from '../components/ui/Button'
import LoadingSkeleton from '../components/ui/LoadingSkeleton'
import ErrorState from '../components/ui/ErrorState'
import EmptyState from '../components/ui/EmptyState'
import MedicalDisclaimer from '../components/ui/MedicalDisclaimer'
import { downloadPatientReport } from '../utils/pdfReport'
import api from '../api/client'

export default function DoctorPatientDetail() {
  const { patientId } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = () => {
    setLoading(true)
    setError(null)
    api.get(`/doctor/patients/${patientId}`)
      .then((res) => setData(res.data))
      .catch(setError)
      .finally(() => setLoading(false))
  }

  useEffect(load, [patientId])

  if (loading) return <div className="max-w-5xl mx-auto px-6 py-10"><LoadingSkeleton rows={4} /></div>
  if (error) return <div className="max-w-5xl mx-auto px-6 py-10"><ErrorState error={error} context="load this patient" onRetry={load} /></div>
  if (!data) return null

  const { patient, predictions } = data
  const latest = predictions[0]
  const trend = [...predictions].reverse().map((p, i) => ({ name: `#${i + 1}`, risk: Math.round(p.ckd_probability * 100) }))

  const downloadPDF = () => latest && downloadPatientReport(latest, patient.full_name)

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <Link to="/doctor/patients" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-primary mb-4">
        <ArrowLeft size={14} /> Back to Patients
      </Link>
      <PageHeader
        title={patient.full_name}
        subtitle={`${patient.email} · Review reports before entering assessment values`}
        action={(
          <div className="flex flex-wrap gap-2">
            <Link to={`/doctor/patients/${patient.id}/assess`}>
              <Button><ClipboardPlus size={16} className="inline mr-2" />Assess from Reports</Button>
            </Link>
            {latest && <Button variant="ghost" onClick={downloadPDF}><FileText size={16} className="inline mr-2" />Download PDF Report</Button>}
          </div>
        )}
      />

      {!latest ? (
        <GlassCard><EmptyState title="No assessments yet" description="Review this patient's blood and urine reports, then use Assess from Reports to record a clinician-led assessment." /></GlassCard>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <GlassCard className="flex justify-center"><RiskGauge probability={latest.ckd_probability} size={180} /></GlassCard>
            <GlassCard>
              <span className="text-slate-400 text-sm">Predicted Stage</span>
              <div className="mt-2"><RiskBadge label={latest.ckd_stage} className="text-sm px-3 py-1.5" /></div>
              <span className="text-slate-400 text-sm block mt-4">Kidney Failure Risk</span>
              <div className="mt-2"><RiskBadge label={latest.kidney_failure_risk} className="text-sm px-3 py-1.5" /></div>
            </GlassCard>
            <GlassCard>
              <span className="text-slate-400 text-sm">Dialysis Flag</span>
              <div className="font-display text-xl font-bold mt-1">{latest.dialysis_required ? 'Yes' : 'No'}</div>
              <span className="text-slate-400 text-sm block mt-4">Model Version</span>
              <div className="font-display text-xl font-bold mt-1">{latest.model_version || '—'}</div>
            </GlassCard>
          </div>

          <GlassCard className="mb-6">
            <h3 className="font-display font-semibold mb-4">Risk Trend</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff1a" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} unit="%" />
                <Tooltip contentStyle={{ background: '#0F172A', border: '1px solid #ffffff22' }} />
                <Line type="monotone" dataKey="risk" stroke="#0EA5E9" strokeWidth={3} dot={{ r: 4 }} isAnimationActive />
              </LineChart>
            </ResponsiveContainer>
          </GlassCard>

          {latest.shap_explanation?.length > 0 && (
            <GlassCard className="mb-6">
              <h3 className="font-display font-semibold mb-4">Why this prediction? (SHAP)</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={latest.shap_explanation.map((f) => ({ ...f, feature: f.feature.replace(/^(num__|cat__)/, '') }))}
                  layout="vertical" margin={{ left: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff1a" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                  <YAxis type="category" dataKey="feature" stroke="#94a3b8" fontSize={11} width={160} />
                  <Tooltip contentStyle={{ background: '#0F172A', border: '1px solid #ffffff22' }} />
                  <Bar dataKey="impact" radius={[0, 6, 6, 0]} isAnimationActive>
                    {latest.shap_explanation.map((f, i) => (
                      <Cell key={i} fill={f.impact >= 0 ? '#EF4444' : '#10B981'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </GlassCard>
          )}
        </>
      )}

      <MedicalDisclaimer />
    </div>
  )
}
