import React from 'react'
import { motion } from 'framer-motion'

export default function Button({ children, onClick, variant = 'primary', className = '', type = 'button', disabled }) {
  const base = 'px-6 py-3 rounded-xl font-semibold font-display transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
  const variants = {
    primary: 'bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/30',
    ghost: 'glass text-white hover:border-primary',
    danger: 'bg-danger text-white',
  }
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.04 }}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {children}
    </motion.button>
  )
}
