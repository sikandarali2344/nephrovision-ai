import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts'
import { CheckCircle2, CircleHelp, Loader2 } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import KidneyModel from '../components/3D/KidneyModel'
import GlassCard from '../components/ui/GlassCard'
import RiskGauge from '../components/ui/RiskGauge'
import Button from '../components/ui/Button'
import MedicalDisclaimer from '../components/ui/MedicalDisclaimer'
import ErrorState from '../components/ui/ErrorState'
import { downloadPatientReport } from '../utils/pdfReport'
import api from '../api/client'

const STEPS = [
  {
    title: 'Demographics',
    titleUr: 'Bunyadi maloomat',
    fields: [
      { name: 'Age', label: 'Age', type: 'number', min: 18, max: 100 },
      { name: 'Sex', label: 'Sex', type: 'select', options: ['Male', 'Female'] },
      { name: 'BMI', label: 'BMI', type: 'number', step: 0.1 },
    ],
  },
  {
    title: 'Vitals',
    titleUr: 'Jismani paimaish',
    fields: [
      { name: 'Systolic_BP', label: 'Systolic BP (mmHg)', type: 'number' },
      { name: 'Diastolic_BP', label: 'Diastolic BP (mmHg)', type: 'number' },
      { name: 'Heart_Rate', label: 'Heart Rate (bpm)', type: 'number' },
    ],
  },
  {
    title: 'Kidney & Metabolic Markers',
    titleUr: 'Gurday aur khoon ke test',
    fields: [
      { name: 'eGFR', label: 'eGFR (mL/min/1.73m²)', type: 'number' },
      { name: 'Serum_Creatinine', label: 'Serum Creatinine (mg/dL)', type: 'number', step: 0.01 },
      { name: 'Blood_Urea_Nitrogen', label: 'Blood Urea Nitrogen (mg/dL)', type: 'number' },
      { name: 'Urine_ACR', label: 'Urine ACR (mg/g)', type: 'number' },
      { name: 'Albumin', label: 'Albumin (g/dL)', type: 'number', step: 0.01 },
    ],
  },
  {
    title: 'Glycemic Profile',
    titleUr: 'Blood sugar ke test',
    fields: [
      { name: 'HbA1c', label: 'HbA1c (%)', type: 'number', step: 0.1 },
      { name: 'Fasting_Glucose', label: 'Fasting Glucose (mg/dL)', type: 'number' },
    ],
  },
  {
    title: 'History & Lifestyle',
    titleUr: 'Sehat ki tareekh aur rozmarrah',
    fields: [
      { name: 'Diabetes', label: 'Diabetes', type: 'select', options: ['Yes', 'No'] },
      { name: 'Hypertension', label: 'Hypertension', type: 'select', options: ['Yes', 'No'] },
      { name: 'Cardiovascular_Disease', label: 'Cardiovascular Disease', type: 'select', options: ['Yes', 'No'] },
      { name: 'Family_History', label: 'Family History of CKD', type: 'select', options: ['Yes', 'No'] },
      { name: 'Smoking_Status', label: 'Smoking Status', type: 'select', options: ['Never', 'Former', 'Current'] },
      { name: 'Exercise_Hours_Per_Week', label: 'Exercise (hrs/week)', type: 'number', step: 0.5 },
      { name: 'Sleep_Duration_Hours', label: 'Sleep (hrs/night)', type: 'number', step: 0.5 },
    ],
  },
]

const EMPTY_FORM = Object.fromEntries(STEPS.flatMap((step) => step.fields).map((field) => [field.name, '']))

const FIELD_HELP = {
  Age: ["Enter the patient's age in completed years.", 'Mareez ki umar poore saalon mein likhein.'],
  Sex: ["Choose the option recorded in the patient's health record.", 'Mareez ke health record mein darj option chunein.'],
  BMI: ["BMI is usually printed on the patient's clinic report. Ask clinic staff if it is not shown.", 'BMI aam tor par mareez ki clinic report par hota hai. Na mile to clinic staff se poochhein.'],
  Systolic_BP: ["Use the top, larger number from the patient's recent blood pressure reading.", 'Mareez ki haal ki blood pressure reading ka upar wala bara number likhein.'],
  Diastolic_BP: ['Use the bottom, smaller number from the same reading.', 'Ussi reading ka neeche wala chhota number likhein.'],
  Heart_Rate: ["Use the patient's pulse or heart rate from a monitor or clinic reading.", 'Machine ya clinic ki reading mein mareez ki nabz ki tadaad likhein.'],
  eGFR: ["Copy eGFR from the patient's kidney blood-test report. Do not estimate it.", 'Mareez ke gurday ke blood-test report se eGFR likhein; andaza na lagayein.'],
  Serum_Creatinine: ["Copy serum creatinine from the patient's blood-test report.", 'Mareez ke blood-test report se serum creatinine likhein.'],
  Blood_Urea_Nitrogen: ["Copy BUN or urea nitrogen from the patient's blood-test report.", 'Mareez ke blood-test report se BUN ya urea nitrogen likhein.'],
  Urine_ACR: ["Copy urine ACR from the patient's urine-test report.", 'Mareez ke urine-test report se ACR likhein.'],
  Albumin: ["Copy albumin from the patient's blood-test report.", 'Mareez ke blood-test report se albumin likhein.'],
  HbA1c: ["Copy HbA1c from the patient's blood-test report. It may be written as A1c.", 'Mareez ke blood-test report se HbA1c ya A1c likhein.'],
  Fasting_Glucose: ["Copy fasting glucose from the patient's fasting blood test, if available.", 'Agar mareez ka test khali pait hua ho to report se glucose likhein.'],
  Diabetes: ['Has a clinician told the patient they have diabetes?', 'Kya doctor ne mareez ko diabetes batayi hai?'],
  Hypertension: ['Has a clinician told the patient they have high blood pressure?', 'Kya doctor ne mareez ko high blood pressure bataya hai?'],
  Cardiovascular_Disease: ['Has a clinician diagnosed the patient with a heart or blood-vessel condition?', 'Kya doctor ne mareez ko dil ya khoon ki naliyon ki bimari batayi hai?'],
  Family_History: ['Has a close family member had chronic kidney disease?', 'Kya mareez ke qareebi khandani fard ko gurday ki lambi muddat wali bimari rahi hai?'],
  Smoking_Status: ["Choose the option that best describes the patient's smoking history.", 'Mareez ki smoking ki aadat ke mutabiq option chunein.'],
  Exercise_Hours_Per_Week: ['Ask the patient about their usual weekly exercise.', 'Mareez se aam haftay ki warzish ke baray mein poochhein.'],
  Sleep_Duration_Hours: ['Ask the patient how many hours they usually sleep each night.', 'Mareez se poochhein ke aam raat mein kitne ghantay sotay hain.'],
}

const STEP_HELP = [
  ["Use the patient's record. Ask them or clinic staff if you need help finding BMI.", 'Mareez ka record dekhein. BMI na mile to mareez ya clinic staff se poochhein.'],
  ["Use a recent blood-pressure reading from the patient's monitor or clinic visit.", 'Mareez ki haal ki blood pressure machine ya clinic ki reading use karein.'],
  ["Use the patient's kidney blood and urine test reports. If they are unavailable, ask a clinician before continuing.", 'Mareez ke gurday ke blood aur urine test ki reports dekhein. Report na ho to doctor se poochhein.'],
  ["Use the patient's blood-test report. Do not enter a guessed value.", 'Mareez ki blood-test report dekhein. Andazay se koi value na likhein.'],
  ['For health conditions, answer Yes only if a clinician has told the patient. Choose Not sure when unknown.', 'Bimari ke liye Yes tab chunein jab doctor ne mareez ko batayi ho. Maloom na ho to Pata nahi chunein.'],
]

const FIELD_LABEL_UR = {
  Age: 'Umar', Sex: 'Jins', BMI: 'BMI (qad aur wazan ka paimaana)',
  Systolic_BP: 'Blood pressure: upar wala number', Diastolic_BP: 'Blood pressure: neeche wala number',
  Heart_Rate: 'Nabz (dil ki dharkan)', eGFR: 'eGFR (gurday ka test)',
  Serum_Creatinine: 'Serum creatinine (blood test)', Blood_Urea_Nitrogen: 'BUN / urea nitrogen (blood test)',
  Urine_ACR: 'Urine ACR (peshab ka test)', Albumin: 'Albumin (blood test)',
  HbA1c: 'HbA1c (blood sugar ka test)', Fasting_Glucose: 'Khali pait blood sugar',
  Diabetes: 'Diabetes', Hypertension: 'High blood pressure',
  Cardiovascular_Disease: 'Dil ya khoon ki naliyon ki bimari', Family_History: 'Khandan mein gurday ki bimari',
  Smoking_Status: 'Smoking ki aadat', Exercise_Hours_Per_Week: 'Haftay mein warzish (ghantay)',
  Sleep_Duration_Hours: 'Raat ki neend (ghantay)',
}

const OPTION_LABEL_UR = {
  Male: 'Mard', Female: 'Aurat', Yes: 'Haan', No: 'Nahi', Never: 'Kabhi nahi', Former: 'Pehle', Current: 'Abhi',
}

const ANALYSIS_STEPS = [
  'Validating patient data',
  'Running CKD prediction model',
  'Calculating risk indicators',
  'Generating explanation',
  'Preparing result',
]

export default function Prediction() {
  const { patientId } = useParams()
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [form, setForm] = useState(EMPTY_FORM)
  const [language, setLanguage] = useState('en')
  const [patient, setPatient] = useState(null)
  const [patientLoading, setPatientLoading] = useState(Boolean(patientId))
  const [patientError, setPatientError] = useState(null)
  const [reportsConfirmed, setReportsConfirmed] = useState(false)
  const [reportConfirmationError, setReportConfirmationError] = useState(false)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [analysisStep, setAnalysisStep] = useState(0)
  const [result, setResult] = useState(null)
  const [apiError, setApiError] = useState(null)

  useEffect(() => {
    if (!patientId) return
    setPatientLoading(true)
    setPatientError(null)
    api.get(`/doctor/patients/${patientId}`)
      .then((res) => setPatient(res.data.patient))
      .catch(setPatientError)
      .finally(() => setPatientLoading(false))
  }, [patientId])

  const update = (name, value) => setForm((f) => ({ ...f, [name]: value }))

  const validateStep = () => {
    const fields = STEPS[step].fields
    const newErrors = {}
    fields.forEach((f) => {
      const v = form[f.name]
      if (v === '' || v === null || v === undefined) newErrors[f.name] = true
    })
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const next = () => {
    if (!validateStep()) return
    setDirection(1)
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }
  const back = () => {
    setDirection(-1)
    setStep((s) => Math.max(s - 1, 0))
  }

  const submit = async () => {
    if (!validateStep()) return
    if (!reportsConfirmed) {
      setReportConfirmationError(true)
      return
    }
    setSubmitting(true)
    setApiError(null)
    setAnalysisStep(0)

    // Step the visual analysis loader forward while the real request is in
    // flight - this is purely a UI pacing device, never a substitute for the
    // actual model call below.
    const stepTimer = setInterval(() => {
      setAnalysisStep((s) => Math.min(s + 1, ANALYSIS_STEPS.length - 2))
    }, 550)

    try {
      const payload = { ...form }
      Object.keys(payload).forEach((k) => {
        if (STEPS.flatMap((s) => s.fields).find((f) => f.name === k)?.type === 'number') {
          payload[k] = parseFloat(payload[k])
        }
      })
      const { data } = await api.post(`/doctor/patients/${patientId}/predict`, payload)
      clearInterval(stepTimer)
      setAnalysisStep(ANALYSIS_STEPS.length - 1)
      await new Promise((r) => setTimeout(r, 400))
      setResult(data)
    } catch (err) {
      clearInterval(stepTimer)
      setApiError(err)
    } finally {
      setSubmitting(false)
    }
  }

  if (!patientId) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12">
        <GlassCard tilt={false}>
          <h1 className="font-display text-2xl font-bold mb-2">Choose a patient first</h1>
          <p className="text-slate-400 mb-5">Open a patient record and start the assessment after reviewing their reports.</p>
          <Link to="/doctor/patients"><Button>View Patients</Button></Link>
        </GlassCard>
      </div>
    )
  }

  if (patientLoading) {
    return <div className="max-w-3xl mx-auto px-6 py-12"><GlassCard tilt={false}>Loading patient record…</GlassCard></div>
  }

  if (patientError || !patient) {
    return <div className="max-w-3xl mx-auto px-6 py-12"><ErrorState error={patientError || 'Patient record could not be loaded.'} context="load this patient" /></div>
  }

  if (submitting) {
    return (
      <div className="max-w-lg mx-auto px-6 py-24">
        <GlassCard tilt={false} className="text-center">
          <KidneyModel riskScore={0.3} height={160} interactive={false} />
          <h2 className="font-display text-xl font-bold mt-4 mb-6">Analyzing your data…</h2>
          <div className="space-y-3 text-left max-w-xs mx-auto">
            {ANALYSIS_STEPS.map((label, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0.3 }}
                animate={{ opacity: i <= analysisStep ? 1 : 0.3 }}
                className="flex items-center gap-3 text-sm"
              >
                {i < analysisStep ? (
                  <CheckCircle2 size={18} className="text-accent shrink-0" />
                ) : i === analysisStep ? (
                  <Loader2 size={18} className="text-primary shrink-0 animate-spin" />
                ) : (
                  <div className="w-[18px] h-[18px] rounded-full border border-white/20 shrink-0" />
                )}
                <span className={i <= analysisStep ? 'text-slate-200' : 'text-slate-500'}>{label}</span>
              </motion.div>
            ))}
          </div>
        </GlassCard>
      </div>
    )
  }

  if (result) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-12">
        <motion.div
          initial={{ rotateY: -90, opacity: 0 }}
          animate={{ rotateY: 0, opacity: 1 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          style={{ transformPerspective: 1200 }}
        >
          <GlassCard>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex flex-col items-center">
                <KidneyModel riskScore={result.ckd_probability} height={220} />
                <div className="mt-2">
                  <RiskGauge probability={result.ckd_probability} size={180} />
                </div>
              </div>

              <div>
                <h2 className="font-display text-2xl font-bold mb-4">Assessment Result · {patient.full_name}</h2>
                <div className="space-y-3 mb-6">
                  <Row label="Predicted Stage" value={result.ckd_stage} />
                  <Row label="Kidney Failure Risk" value={result.kidney_failure_risk} />
                  <Row label="Dialysis Flag" value={result.dialysis_required ? 'Yes' : 'No'} />
                  <Row label="Model Used" value={result.model_version} />
                </div>
                <div className="flex gap-3 flex-wrap">
                  <Button onClick={() => downloadPatientReport(result, patient.full_name)}>Download PDF Report</Button>
                  <Button variant="ghost" onClick={() => { setResult(null); setStep(0); setForm(EMPTY_FORM); setReportsConfirmed(false); setReportConfirmationError(false) }}>New Assessment</Button>
                </div>
              </div>
            </div>

            <div className="mt-10">
              <h3 className="font-display font-semibold mb-4">Why this prediction? (SHAP feature impact)</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={result.shap_top_features.map((f) => ({ ...f, feature: f.feature.replace(/^(num__|cat__)/, '') }))}
                  layout="vertical" margin={{ left: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff1a" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                  <YAxis type="category" dataKey="feature" stroke="#94a3b8" fontSize={11} width={160} />
                  <Tooltip contentStyle={{ background: '#0F172A', border: '1px solid #ffffff22' }} />
                  <Bar dataKey="impact" radius={[0, 6, 6, 0]} isAnimationActive>
                    {result.shap_top_features.map((f, i) => (
                      <Cell key={i} fill={f.impact >= 0 ? '#EF4444' : '#10B981'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          <MedicalDisclaimer className="mt-6" />
        </motion.div>
      </div>
    )
  }

  const progress = ((step + 1) / STEPS.length) * 100
  const urdu = language === 'ur'

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="assessment-header">
        <div className="assessment-header__copy">
          <h1 className="font-display text-3xl font-bold mb-2">{urdu ? `Mareez ka jaiza: ${patient.full_name}` : `Assessment for ${patient.full_name}`}</h1>
          <p className="text-slate-400">{urdu ? `Qadam ${step + 1} / ${STEPS.length}: ${STEPS[step].titleUr}` : `Step ${step + 1} of ${STEPS.length}: ${STEPS[step].title}`}</p>
        </div>
        <div className="assessment-header__aside">
          <div className="assessment-language" role="group" aria-label="Assessment language">
            <button type="button" aria-pressed={!urdu} onClick={() => setLanguage('en')}>{'English'}</button>
            <button type="button" aria-pressed={urdu} onClick={() => setLanguage('ur')}>{'Roman Urdu'}</button>
          </div>
          <div className="assessment-header__kidney" aria-hidden="true">
            <KidneyModel height={112} interactive={false} />
          </div>
        </div>
      </div>

      <div className="assessment-note" role="note">
        <CircleHelp size={19} />
        <p><strong>{urdu ? 'Mareez ki reports dekhein; andaza na lagayein.' : 'Use the patient’s reports; do not guess.'}</strong> {urdu ? STEP_HELP[step][1] : STEP_HELP[step][0]}</p>
      </div>

      <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden mb-8">
        <motion.div animate={{ width: `${progress}%` }} className="h-full bg-gradient-to-r from-primary to-accent" />
      </div>

      {apiError && (
        <ErrorState error={apiError} context="complete the risk assessment" onRetry={submit} className="mb-6" />
      )}

      <GlassCard tilt={false}>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            initial={{ x: direction * 60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -direction * 60, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-5"
          >
            {STEPS[step].fields.map((f) => (
              <motion.label
                key={f.name}
                animate={errors[f.name] ? { x: [0, -6, 6, -4, 4, 0] } : {}}
                className="block"
              >
                <span className="text-sm font-medium mb-1 block">{urdu ? FIELD_LABEL_UR[f.name] : f.label}</span>
                <span id={`${f.name}-help`} className="text-xs text-slate-400 leading-relaxed mb-2 block">{FIELD_HELP[f.name][urdu ? 1 : 0]}</span>
                {f.type === 'select' ? (
                  <select
                    value={form[f.name]} onChange={(e) => update(f.name, e.target.value)}
                    aria-describedby={`${f.name}-help`}
                    className={`w-full bg-white/5 border rounded-lg px-4 py-3 outline-none ${errors[f.name] ? 'border-danger' : 'border-white/10 focus:border-primary'}`}
                  >
                    <option value="" disabled>{urdu ? 'Chunein' : 'Choose an answer'}</option>
                    {f.options.map((o) => <option key={o} value={o}>{urdu ? OPTION_LABEL_UR[o] : o}</option>)}
                    <option value="Unknown">{urdu ? 'Pata nahi' : 'Not sure'}</option>
                  </select>
                ) : (
                  <input
                    type="number" step={f.step || 1} min={f.min} max={f.max}
                    value={form[f.name]} onChange={(e) => update(f.name, e.target.value)}
                    aria-describedby={`${f.name}-help`}
                    placeholder={urdu ? 'Yahan value likhein' : 'Enter the value'}
                    className={`w-full bg-white/5 border rounded-lg px-4 py-3 outline-none ${errors[f.name] ? 'border-danger' : 'border-white/10 focus:border-primary'}`}
                  />
                )}
                {errors[f.name] && <span className="mt-1 block text-xs text-danger">{urdu ? 'Aagay barhne ke liye is sawal ka jawab dein.' : 'Answer this question before continuing.'}</span>}
              </motion.label>
            ))}
          </motion.div>
        </AnimatePresence>

        {step === STEPS.length - 1 && (
          <label className="mt-6 flex items-start gap-3 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={reportsConfirmed}
              onChange={(event) => { setReportsConfirmed(event.target.checked); setReportConfirmationError(false) }}
              className="mt-1 accent-sky-500"
            />
            <span>{urdu ? 'Main ne mareez ki reports dekhi hain, test values unhi se li hain, aur baqi jawab mareez se tasdeeq kiye hain.' : "I reviewed the patient's reports, copied test values from them, and confirmed the remaining answers with the patient."}</span>
          </label>
        )}
        {reportConfirmationError && <p role="alert" className="mt-2 text-xs text-danger">{urdu ? 'Jaari rakhne se pehle reports dekhne ki tasdeeq karein.' : 'Confirm report review before running the assessment.'}</p>}

        <div className="flex justify-between mt-8">
          <Button variant="ghost" onClick={back} disabled={step === 0}>{urdu ? 'Wapas' : 'Back'}</Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={next}>{urdu ? 'Agla' : 'Next'}</Button>
          ) : (
            <Button onClick={submit} disabled={submitting}>{urdu ? 'Risk ka jaiza dekhein' : 'Get My Risk Assessment'}</Button>
          )}
        </div>
      </GlassCard>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between border-b border-white/10 pb-2">
      <span className="text-slate-400">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  )
}
