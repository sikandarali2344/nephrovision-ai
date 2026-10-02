import React from 'react'
import { motion } from 'framer-motion'

export default function EmptyState({ icon: Icon, title = 'Nothing here yet', description, action }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="flex flex-col items-center text-center py-14 px-6"
    >
      {Icon && <Icon size={36} className="text-slate-500 mb-3" />}
      <h3 className="font-display font-semibold text-lg mb-1">{title}</h3>
      {description && <p className="text-slate-400 text-sm max-w-sm mb-4">{description}</p>}
      {action}
    </motion.div>
  )
}
