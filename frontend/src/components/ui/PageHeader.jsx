import React from 'react'
import { motion } from 'framer-motion'

export default function PageHeader({ title, subtitle, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between flex-wrap gap-4 mb-8"
    >
      <div>
        <h1 className="font-display text-3xl font-bold">{title}</h1>
        {subtitle && <p className="text-slate-400 mt-1">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </motion.div>
  )
}
