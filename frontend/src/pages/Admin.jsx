import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Activity, BrainCircuit, Database, Trash2, UserX, RefreshCw, ShieldCheck, Users, Server, ScrollText, Search, CheckCircle2, XCircle,
} from 'lucide-react'
import MedicalHero from '../components/dashboard/MedicalHero'
import GlassCard from '../components/ui/GlassCard'
import Button from '../components/ui/Button'
import PageHeader from '../components/ui/PageHeader'
import StatCard from '../components/ui/StatCard'
import RoleBadge from '../components/ui/RoleBadge'
import LoadingSkeleton from '../components/ui/LoadingSkeleton'
import ErrorState from '../components/ui/ErrorState'
import EmptyState from '../components/ui/EmptyState'
import api from '../api/client'

const TABS = [
  { id: 'overview', label: 'Overview', icon: ShieldCheck },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'model', label: 'Model Performance', icon: Server },
  { id: 'logs', label: 'Audit Logs', icon: ScrollText },
]

export default function Admin() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [tab, setTab] = useState(() => searchParams.get('tab') || 'overview')
  const [overview, setOverview] = useState(null)
  const [users, setUsers] = useState([])
  const [performance, setPerformance] = useState(null)
  const [logs, setLogs] = useState([])
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [retraining, setRetraining] = useState(false)
  const [retrainMsg, setRetrainMsg] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadAll = () => {
    setLoading(true)
    setError(null)
    Promise.all([
      api.get('/admin/overview').then((r) => setOverview(r.data)),
      api.get('/admin/users').then((r) => setUsers(r.data)),
      api.get('/admin/model-performance').then((r) => setPerformance(r.data)).catch(() => setPerformance(null)),
      api.get('/admin/audit-logs').then((r) => setLogs(r.data)),
    ])
      .catch(setError)
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadAll() }, [])
  useEffect(() => { setTab(searchParams.get('tab') || 'overview') }, [searchParams])

  const deactivate = async (id) => { await api.patch(`/admin/users/${id}/deactivate`); loadAll() }
  const remove = async (id) => {
    if (!confirm('Delete this user permanently? This cannot be undone.')) return
    await api.delete(`/admin/users/${id}`)
    loadAll()
  }
  const retrain = async () => {
    setRetraining(true)
    setRetrainMsg(null)
    try {
      const { data } = await api.post('/admin/retrain')
      setRetrainMsg(data.returncode === 0
        ? { ok: true, text: 'Model retrained successfully.' }
        : { ok: false, text: 'Retraining finished with errors — check server logs.' })
      loadAll()
    } catch {
      setRetrainMsg({ ok: false, text: 'Retraining failed to start. Is the backend reachable?' })
    } finally {
      setRetraining(false)
    }
  }

  const filteredUsers = users.filter((u) => {
    const matchesSearch = `${u.full_name} ${u.email}`.toLowerCase().includes(search.toLowerCase())
    const matchesRole = roleFilter === 'all' || u.role === roleFilter
    return matchesSearch && matchesRole
  })

  if (loading) return <div className="max-w-6xl mx-auto px-6 py-12"><LoadingSkeleton rows={4} /></div>
  if (error) return <div className="max-w-6xl mx-auto px-6 py-12"><ErrorState error={error} context="load the admin panel" onRetry={loadAll} /></div>

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <PageHeader title="Platform overview" subtitle="Users, model performance, and system activity" />

      <div className="flex gap-2 mb-8 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.id} onClick={() => { setTab(t.id); setSearchParams({ tab: t.id }) }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              tab === t.id ? 'bg-primary/20 text-primary border border-primary/40' : 'text-slate-400 border border-white/10 hover:border-white/20'
            }`}
          >
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && overview && (
        <>
          <MedicalHero />
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 my-7">
            <StatCard icon={Users} label="Total Users" value={overview.total_users} />
            <StatCard icon={Users} label="Patients" value={overview.total_patients} accent="text-accent" />
            <StatCard icon={Users} label="Doctors" value={overview.total_doctors} accent="text-primary" />
            <StatCard icon={ShieldCheck} label="Admins" value={overview.total_admins} accent="text-primary" />
            <StatCard icon={Server} label="Total Assessments" value={overview.total_assessments} accent="text-accent" delay={0.1} />
            <StatCard icon={CheckCircle2} label="Active Users" value={overview.active_users} accent="text-accent" delay={0.15} />
          </div>
          <div id="system-status" className="scroll-mt-24">
            <GlassCard tilt={false}>
              <div className="mb-4">
                <h3 className="font-display font-semibold">System status</h3>
                <p className="text-slate-400 text-sm mt-1">Live service health is not reported by the current API.</p>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  ['API server', Server], ['Database', Database], ['ML model', BrainCircuit], ['Frontend', Activity],
                ].map(([label, Icon]) => (
                  <div key={label} className="system-status-row">
                    <Icon size={17} /><span>{label}</span><strong><i />Not reported</strong>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        </>
      )}

      {tab === 'users' && (
        <GlassCard tilt={false}>
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <h3 className="font-display font-semibold">User Management</h3>
            <div className="flex gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users…"
                  className="bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-sm outline-none focus:border-primary"
                />
              </div>
              <select
                value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary"
              >
                <option value="all">All roles</option>
                <option value="patient">Patient</option>
                <option value="doctor">Doctor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          {filteredUsers.length === 0 ? (
            <EmptyState icon={Users} title="No users match" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-400 border-b border-white/10">
                    <th className="py-2">Name</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-3">{u.full_name}</td>
                      <td className="text-slate-400">{u.email}</td>
                      <td><RoleBadge role={u.role} /></td>
                      <td>
                        {u.is_active ? (
                          <span className="flex items-center gap-1 text-accent text-xs"><CheckCircle2 size={13} /> Active</span>
                        ) : (
                          <span className="flex items-center gap-1 text-slate-500 text-xs"><XCircle size={13} /> Inactive</span>
                        )}
                      </td>
                      <td className="text-slate-400 text-xs">{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</td>
                      <td className="text-right space-x-2">
                        <button onClick={() => deactivate(u.id)} title="Deactivate" className="text-slate-400 hover:text-yellow-400"><UserX size={16} /></button>
                        <button onClick={() => remove(u.id)} title="Delete" className="text-slate-400 hover:text-danger"><Trash2 size={16} /></button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>
      )}

      {tab === 'model' && (
        <div className="space-y-6">
          <GlassCard>
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
              <div>
                <h3 className="font-display font-semibold">
                  Model Performance {performance && `— best: ${performance.best_model}`}
                </h3>
                {performance?.trained_at && (
                  <p className="text-xs text-slate-500 mt-1">Last trained: {new Date(performance.trained_at).toLocaleString()}</p>
                )}
              </div>
              <Button onClick={retrain} disabled={retraining}>
                <RefreshCw size={16} className={`inline mr-2 ${retraining ? 'animate-spin' : ''}`} />
                {retraining ? 'Retraining…' : 'Retrain Model'}
              </Button>
            </div>

            {retrainMsg && (
              <div className={`text-sm rounded-lg px-4 py-2 mb-4 ${retrainMsg.ok ? 'bg-accent/15 text-accent' : 'bg-danger/15 text-danger'}`}>
                {retrainMsg.text}
              </div>
            )}

            {performance ? (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                {Object.entries(performance.all_results?.[performance.best_model] || {}).map(([k, v]) => (
                  typeof v === 'number' && (
                    <div key={k} className="bg-white/5 rounded-lg py-3">
                      <div className="text-2xl font-bold text-primary">{v}</div>
                      <div className="text-xs text-slate-400 uppercase">{k.replace('_', ' ')}</div>
                    </div>
                  )
                ))}
              </div>
            ) : (
              <EmptyState icon={Server} title="No model trained yet" description="Click Retrain Model to train the CKD prediction pipeline." />
            )}
          </GlassCard>
        </div>
      )}

      {tab === 'logs' && (
        <GlassCard tilt={false}>
          <h3 className="font-display font-semibold mb-4">Audit Log</h3>
          {logs.length === 0 ? (
            <EmptyState icon={ScrollText} title="No activity yet" />
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {logs.map((l, i) => (
                <motion.div
                  key={l.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}
                  className="flex items-center justify-between text-sm border-l-2 border-primary pl-3"
                >
                  <span>{l.action} {l.detail ? `— ${l.detail}` : ''} {l.user_id ? `(user #${l.user_id})` : ''}</span>
                  <span className="text-slate-500 text-xs">{new Date(l.created_at).toLocaleString()}</span>
                </motion.div>
              ))}
            </div>
          )}
        </GlassCard>
      )}
    </div>
  )
}
