import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { User, Stethoscope } from 'lucide-react'
import KidneyModel from '../components/3D/KidneyModel'
import Button from '../components/ui/Button'
import { friendlyErrorMessage } from '../components/ui/ErrorState'
import { useAuth } from '../context/AuthContext'

// Admin accounts are never created through public signup - see
// backend/seed_admin.py or the admin-only POST /admin/users endpoint.
const ROLES = [
  { id: 'patient', label: 'Patient', icon: User },
  { id: 'doctor', label: 'Doctor', icon: Stethoscope },
]

function passwordStrength(pw) {
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  return score // 0-4
}

export default function Signup() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('patient')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signup } = useAuth()
  const navigate = useNavigate()

  const strength = useMemo(() => passwordStrength(password), [password])
  const strengthColor = ['bg-danger', 'bg-danger', 'bg-yellow-500', 'bg-yellow-400', 'bg-accent'][strength]
  const strengthLabel = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong'][strength]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const newUser = await signup({ full_name: fullName, email, password, role })
      const home = { patient: '/dashboard', doctor: '/doctor', admin: '/admin' }[newUser.role] || '/dashboard'
      navigate(home)
    } catch (err) {
      setError(friendlyErrorMessage(err, 'create your account'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <div className="hidden md:flex flex-1 items-center justify-center bg-gradient-to-br from-[#0b1224] to-bgdark">
        <KidneyModel riskScore={0.1} height={480} />
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="glass rounded-2xl p-8 w-full max-w-md"
        >
          <h2 className="font-display text-2xl font-bold mb-1">
            {role === 'doctor' ? 'Create your doctor account' : 'Create your account'}
          </h2>
          <p className="text-slate-400 text-sm mb-6">Join NephroVision AI in under a minute</p>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1, x: [0, -6, 6, -4, 4, 0] }} exit={{ opacity: 0 }}
                className="bg-danger/20 border border-danger text-danger text-sm rounded-lg px-4 py-2 mb-4"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-2 gap-3 mb-4">
            {ROLES.map((r) => (
              <motion.button
                type="button" key={r.id} onClick={() => setRole(r.id)}
                whileTap={{ scale: 0.95 }}
                className={`flex flex-col items-center gap-1.5 py-4 rounded-xl border text-sm font-medium transition-colors ${
                  role === r.id ? 'border-primary bg-primary/10 text-primary' : 'border-white/10 text-slate-400'
                }`}
              >
                <r.icon size={22} />
                {r.label}
              </motion.button>
            ))}
          </div>

          <AnimatePresence>
            {role === 'doctor' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 text-xs text-accent bg-accent/10 border border-accent/30 rounded-lg px-3 py-2 mb-4 overflow-hidden"
              >
                <Stethoscope size={14} />
                <span>Doctor account — you'll get access to the Patients panel and AI-assisted risk reviews.</span>
              </motion.div>
            )}
          </AnimatePresence>

          <label className="block mb-4">
            <span className="text-xs uppercase tracking-wide text-slate-400 mb-1 block">Full name</span>
            <input required value={fullName} onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:border-primary outline-none"
              placeholder="Dr. Ayesha Khan" />
          </label>

          <label className="block mb-4">
            <span className="text-xs uppercase tracking-wide text-slate-400 mb-1 block">Email</span>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:border-primary outline-none"
              placeholder="you@hospital.com" />
          </label>

          <label className="block mb-2">
            <span className="text-xs uppercase tracking-wide text-slate-400 mb-1 block">Password</span>
            <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:border-primary outline-none"
              placeholder="At least 8 characters" />
          </label>
          {password && (
            <div className="mb-4">
              <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  animate={{ width: `${(strength / 4) * 100}%` }}
                  className={`h-full ${strengthColor}`}
                />
              </div>
              <span className="text-xs text-slate-400">{strengthLabel}</span>
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full mt-4">
            {loading ? 'Creating account…' : 'Sign Up'}
          </Button>

          <p className="text-sm text-slate-400 text-center mt-6">
            Already have an account? <Link to="/login" className="text-primary font-medium">Log in</Link>
          </p>
        </motion.form>
      </div>
    </div>
  )
}
