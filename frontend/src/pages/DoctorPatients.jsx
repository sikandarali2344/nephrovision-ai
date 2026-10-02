import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import GlassCard from '../components/ui/GlassCard'
import PageHeader from '../components/ui/PageHeader'
import PatientTable from '../components/ui/PatientTable'
import LoadingSkeleton from '../components/ui/LoadingSkeleton'
import ErrorState from '../components/ui/ErrorState'
import api from '../api/client'

export default function DoctorPatients() {
  const [patients, setPatients] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const load = (q = '') => {
    setLoading(true)
    setError(null)
    api.get('/doctor/patients', { params: { search: q } })
      .then((res) => setPatients(res.data))
      .catch(setError)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    const id = setTimeout(() => load(search), 300)
    return () => clearTimeout(id)
  }, [search])

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <PageHeader
        title="Patients"
        subtitle="All registered patients and their latest AI risk assessment"
        action={
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email…"
              className="bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
        }
      />

      {loading && <LoadingSkeleton variant="row" rows={5} />}
      {error && <ErrorState error={error} context="load patients" onRetry={() => load(search)} />}

      {!loading && !error && (
        <GlassCard tilt={false}>
          <PatientTable
            patients={patients}
            onView={(p) => navigate(`/doctor/patients/${p.id}`)}
            onAssess={(p) => navigate(`/doctor/patients/${p.id}/assess`)}
          />
        </GlassCard>
      )}
    </div>
  )
}
