import React from 'react'
import { motion } from 'framer-motion'
import { ClipboardPlus, Eye } from 'lucide-react'
import RiskBadge from './RiskBadge'
import Button from './Button'
import EmptyState from './EmptyState'
import { Users } from 'lucide-react'

export default function PatientTable({ patients, onView, onAssess }) {
  if (!patients.length) {
    return <EmptyState icon={Users} title="No patients found" description="Try a different search, or check back once patients have signed up." />
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-slate-400 border-b border-white/10">
            <th className="py-2">Name</th>
            <th>Email</th>
            <th>Assessments</th>
            <th>Latest Risk</th>
            <th>Latest Stage</th>
            <th>Last Assessment</th>
            <th className="text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {patients.map((p, i) => (
            <motion.tr
              key={p.id}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
              className="border-b border-white/5 hover:bg-white/5 transition-colors"
            >
              <td className="py-3 font-medium">{p.full_name}</td>
              <td className="text-slate-400">{p.email}</td>
              <td>{p.assessment_count}</td>
              <td>{p.latest_probability != null ? `${(p.latest_probability * 100).toFixed(1)}%` : '—'}</td>
              <td><RiskBadge label={p.latest_stage} /></td>
              <td className="text-slate-400">{p.last_assessment_at ? new Date(p.last_assessment_at).toLocaleDateString() : '—'}</td>
              <td className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" className="!px-3 !py-1.5 text-xs" onClick={() => onView(p)}>
                    <Eye size={14} className="inline mr-1" /> Review
                  </Button>
                  <Button className="!px-3 !py-1.5 text-xs whitespace-nowrap" onClick={() => onAssess(p)}>
                    <ClipboardPlus size={14} className="inline mr-1" /> Assess from Reports
                  </Button>
                </div>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
