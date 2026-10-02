import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ShieldCheck, Activity, BrainCircuit, FileText } from 'lucide-react'
import KidneyModel from '../components/3D/KidneyModel'
import GlassCard from '../components/ui/GlassCard'
import Button from '../components/ui/Button'

const TAGLINE = 'Predict. Prevent. Protect.'

function useTypewriter(text, speed = 70) {
  const [out, setOut] = useState('')
  useEffect(() => {
    setOut('')
    let i = 0
    const id = setInterval(() => {
      i += 1
      setOut(text.slice(0, i))
      if (i >= text.length) clearInterval(id)
    }, speed)
    return () => clearInterval(id)
  }, [text, speed])
  return out
}

const features = [
  { icon: Activity, title: 'Real-Time Risk Scoring', desc: 'Multi-model ensemble (Random Forest, XGBoost, Logistic baseline) predicts CKD probability, stage, and failure risk instantly.' },
  { icon: BrainCircuit, title: 'Explainable AI', desc: 'SHAP and LIME break down exactly which clinical markers drove each prediction, patient by patient.' },
  { icon: ShieldCheck, title: 'Role-Based Access', desc: 'Separate secured experiences for Patients, Doctors, and Admins, backed by JWT auth and audit logging.' },
  { icon: FileText, title: 'Exportable Reports', desc: 'Every assessment can be exported as a shareable, print-ready PDF for clinical records.' },
]

export default function Landing() {
  const typed = useTypewriter(TAGLINE)

  return (
    <div className="min-h-screen overflow-hidden">
      {/* Hero */}
      <section className="relative flex flex-col md:flex-row items-center justify-between max-w-7xl mx-auto px-6 pt-28 pb-16 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
          className="flex-1"
        >
          <span className="uppercase tracking-widest text-primary text-sm font-semibold">NephroVision AI</span>
          <h1 className="font-display text-4xl md:text-6xl font-extrabold mt-3 mb-6 leading-tight">
            <span className="gradient-text">{typed}</span>
            <span className="animate-pulse">|</span>
          </h1>
          <p className="text-slate-300 max-w-xl mb-8 text-lg">
            A CKD Risk Intelligence Platform that turns 19 clinical, demographic and
            lifestyle markers into an explainable, stage-aware kidney disease risk
            assessment — in seconds.
          </p>
          <div className="flex gap-4">
            <Link to="/signup"><Button>Get Started</Button></Link>
            <Link to="/login"><Button variant="ghost">I already have an account</Button></Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.2 }}
          className="flex-1 w-full"
        >
          <KidneyModel riskScore={0.15} height={420} />
        </motion.div>
      </section>

      {/* Feature cards */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-display text-3xl font-bold text-center mb-12"
        >
          Built for clinical trust, engineered for speed
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <GlassCard className="h-full">
                <f.icon className="text-primary mb-4" size={32} />
                <h3 className="font-display font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-slate-400 text-sm">{f.desc}</p>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <GlassCard>
            <h3 className="font-display text-2xl font-bold mb-3">Ready to assess your first patient?</h3>
            <p className="text-slate-400 mb-6">Sign up as a Doctor or Patient and run a risk assessment in under two minutes.</p>
            <Link to="/signup"><Button>Create Free Account</Button></Link>
          </GlassCard>
        </motion.div>
      </section>
    </div>
  )
}
