import React from 'react'
import { motion } from 'framer-motion'
import { Activity, BrainCircuit, LockKeyhole } from 'lucide-react'
import KidneyModel from '../3D/KidneyModel'

const TRUST_BADGES = [
  { label: 'AI Powered', icon: BrainCircuit },
  { label: 'Explainable AI', icon: Activity },
  { label: 'Secure Assessment', icon: LockKeyhole },
]

export default function MedicalHero({ riskScore = null, healthLabel, confidenceLabel, riskPercent }) {
  return (
    <motion.section
      className="medical-hero"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: 'easeOut' }}
      aria-labelledby="medical-hero-title"
    >
      <div className="medical-hero__copy">
        <div className="medical-hero__brand"><span className="medical-hero__brand-mark"><Activity size={17} /></span> NephroVision AI</div>
        <p className="medical-hero__eyebrow"><span /> Live AI analysis</p>
        <h2 id="medical-hero-title">Intelligent Kidney Risk Assessment</h2>
        <p className="medical-hero__subtitle">AI-powered CKD risk analysis with explainable clinical insights.</p>
        <div className="medical-hero__badges">
          {TRUST_BADGES.map(({ label, icon: Icon }) => (
            <span key={label}><Icon size={14} />{label}</span>
          ))}
        </div>
      </div>

      <div className="medical-hero__visual" aria-label="Animated 3D kidney visualization">
        <div className="medical-hero__scan-ring" />
        <div className="medical-hero__scan-line" />
        <span className="medical-hero__particle medical-hero__particle--one" />
        <span className="medical-hero__particle medical-hero__particle--two" />
        <KidneyModel riskScore={riskScore} height={370} interactive={false} />
        {healthLabel && <div className="medical-hero__callout medical-hero__callout--left"><span>Kidney health</span><strong>{healthLabel}</strong></div>}
        {riskPercent != null && <div className="medical-hero__callout medical-hero__callout--right"><span>CKD risk</span><strong>{riskPercent}%</strong></div>}
        {confidenceLabel && <div className="medical-hero__callout medical-hero__callout--bottom"><span>Model confidence</span><strong>{confidenceLabel}</strong></div>}
      </div>
      <div className="medical-hero__footer"><span>Clinical decision support</span><span>Not a substitute for professional medical advice</span></div>
    </motion.section>
  )
}
