import React from 'react'
import { motion } from 'framer-motion'

export default function AnimatedSection({ children, delay = 0, className = '', as = 'div' }) {
  const MotionTag = motion[as] || motion.div
  return (
    <MotionTag
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={className}
    >
      {children}
    </MotionTag>
  )
}
