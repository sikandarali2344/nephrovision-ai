import React from 'react'
import { motion } from 'framer-motion'
import { FileText, Eye } from 'lucide-react'
import RiskBadge from './RiskBadge'
import Button from './Button'

export default function AssessmentCard({ record, onView, onDownload, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="glass glass-hover rounded-xl p-4 flex items-center justify-between flex-wrap gap-3"
    >
      <div className="flex items-center gap-4">
        <RiskBadge label={record.ckd_stage} />
        <div>
          <div className="text-sm font-semibold">{(record.ckd_probability * 100).toFixed(1)}% CKD probability</div>
          <div className="text-xs text-slate-400">
            {new Date(record.created_at).toLocaleString()} · {record.model_version || 'model n/a'}
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        {onView && (
          <Button variant="ghost" className="!px-3 !py-2 text-xs" onClick={() => onView(record)}>
            <Eye size={14} className="inline mr-1" /> View
          </Button>
        )}
        {onDownload && (
          <Button variant="ghost" className="!px-3 !py-2 text-xs" onClick={() => onDownload(record)}>
            <FileText size={14} className="inline mr-1" /> Report
          </Button>
        )}
      </div>
    </motion.div>
  )
}
