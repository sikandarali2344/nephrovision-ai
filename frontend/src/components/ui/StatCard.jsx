import React from 'react'
import { motion } from 'framer-motion'
import GlassCard from './GlassCard'
import AnimatedCounter from './AnimatedCounter'

export default function StatCard({ icon: Icon, label, value, suffix = '', decimals = 0, accent = 'text-primary', delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <GlassCard>
        <div className="flex items-center justify-between mb-2">
          <span className="text-slate-400 text-sm">{label}</span>
          {Icon && <Icon size={18} className={accent} />}
        </div>
        <div className={`font-display text-3xl font-bold ${accent}`}>
          {typeof value === 'number' ? (
            <AnimatedCounter value={value} decimals={decimals} suffix={suffix} />
          ) : (
            value ?? '—'
          )}
        </div>
      </GlassCard>
    </motion.div>
  )
}
