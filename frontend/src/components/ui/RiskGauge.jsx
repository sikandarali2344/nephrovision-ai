import React from 'react'
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts'
import { motion } from 'framer-motion'
import AnimatedCounter from './AnimatedCounter'

function colorFor(pct) {
  if (pct < 30) return '#10B981'
  if (pct < 60) return '#F59E0B'
  return '#EF4444'
}

export default function RiskGauge({ probability = 0, size = 220, label = 'CKD Probability' }) {
  const pct = Math.round(probability * 100)
  const color = colorFor(pct)

  return (
    <div className="flex flex-col items-center" style={{ width: size }}>
      <div style={{ width: size, height: size, position: 'relative' }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            innerRadius="72%" outerRadius="100%"
            data={[{ value: pct, fill: color }]}
            startAngle={90} endAngle={-270}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
            <RadialBar background={{ fill: 'rgba(255,255,255,0.08)' }} dataKey="value" cornerRadius={20} isAnimationActive />
          </RadialBarChart>
        </ResponsiveContainer>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="absolute inset-0 flex flex-col items-center justify-center"
        >
          <span className="font-display text-3xl font-extrabold" style={{ color }}>
            <AnimatedCounter value={pct} suffix="%" />
          </span>
        </motion.div>
      </div>
      <span className="text-slate-400 text-sm mt-1">{label}</span>
    </div>
  )
}
