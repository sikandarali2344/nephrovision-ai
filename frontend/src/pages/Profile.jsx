import React from 'react'
import { useAuth } from '../context/AuthContext'
import GlassCard from '../components/ui/GlassCard'
import { MedicalDisclaimer } from '../components/ui/ClinicalUI'

export default function Profile() {
  const { user } = useAuth()

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-7">
        <p className="text-xs font-semibold uppercase text-primary">Account</p>
        <h1 className="mt-2 font-display text-3xl font-semibold">Profile</h1>
      </div>
      <GlassCard tilt={false}>
        <dl className="divide-y divide-white/10">
          <ProfileRow label="Name" value={user?.full_name} />
          <ProfileRow label="Email" value={user?.email} />
          <ProfileRow label="Account type" value={user?.role} />
          {user?.created_at && <ProfileRow label="Member since" value={new Date(user.created_at).toLocaleDateString()} />}
        </dl>
      </GlassCard>
      <MedicalDisclaimer className="mt-6" />
    </div>
  )
}

function ProfileRow({ label, value }) {
  return (
    <div className="flex flex-wrap justify-between gap-2 py-4">
      <dt className="text-sm text-slate-400">{label}</dt>
      <dd className="text-sm font-medium capitalize text-slate-100">{value || '—'}</dd>
    </div>
  )
}
