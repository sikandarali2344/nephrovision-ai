import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock } from 'lucide-react'
import KidneyModel from '../components/3D/KidneyModel'
import Button from '../components/ui/Button'
import { friendlyErrorMessage } from '../components/ui/ErrorState'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const loggedInUser = await login(email, password)
      const home = { patient: '/dashboard', doctor: '/doctor', admin: '/admin' }[loggedInUser.role] || '/dashboard'
      navigate(home)
    } catch (err) {
      setError(err.response?.status === 401 ? 'Incorrect email or password.' : friendlyErrorMessage(err, 'log in'))
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
          <h2 className="font-display text-2xl font-bold mb-1">Welcome back</h2>
          <p className="text-slate-400 text-sm mb-6">Log in to view your CKD risk dashboard</p>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: [0, -6, 6, -4, 4, 0] }}
                exit={{ opacity: 0 }}
                className="bg-danger/20 border border-danger text-danger text-sm rounded-lg px-4 py-2 mb-4"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <label className="block mb-4">
            <span className="text-xs uppercase tracking-wide text-slate-400 flex items-center gap-1 mb-1">
              <Mail size={14} /> Email
            </span>
            <input
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:border-primary outline-none transition-colors"
              placeholder="you@hospital.com"
            />
          </label>

          <label className="block mb-2">
            <span className="text-xs uppercase tracking-wide text-slate-400 flex items-center gap-1 mb-1">
              <Lock size={14} /> Password
            </span>
            <input
              type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:border-primary outline-none transition-colors"
              placeholder="••••••••"
            />
          </label>

          <Button type="submit" disabled={loading} className="w-full mt-6">
            {loading ? 'Logging in…' : 'Log In'}
          </Button>

          <p className="text-sm text-slate-400 text-center mt-6">
            Don't have an account? <Link to="/signup" className="text-primary font-medium">Sign up</Link>
          </p>
        </motion.form>
      </div>
    </div>
  )
}
