import React, { useEffect, useState } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'

export default function AnimatedCounter({ value, decimals = 0, suffix = '' }) {
  const count = useMotionValue(0)
  const rounded = useTransform(count, (v) => v.toFixed(decimals))
  const [display, setDisplay] = useState('0')

  useEffect(() => {
    const controls = animate(count, value, { duration: 1.2, ease: 'easeOut' })
    const unsub = rounded.on('change', (v) => setDisplay(v))
    return () => { controls.stop(); unsub() }
  }, [value])

  return <motion.span>{display}{suffix}</motion.span>
}
