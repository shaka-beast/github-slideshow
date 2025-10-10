'use client'
import { useState } from 'react'
import { createCampaignSchema } from '@/lib/validation'

type CampaignForm = {
  title: string; story: string; targetAmountKes: number; payoutMethod: 'mpesa' | 'bank';
  payoutDestination: string; scheduledPayoutDate: string; deadline: string; privacy: 'public' | 'private';
  contactEmail: string; contactPhone: string; coverPhotoUrl?: string
}

export default function NewCampaign() {
  const [form, setForm] = useState<CampaignForm>({
    title: '', story: '', targetAmountKes: 10000, payoutMethod: 'mpesa',
    payoutDestination: '', scheduledPayoutDate: '', deadline: '', privacy: 'public',
    contactEmail: '', contactPhone: ''
  })
  const [loading, setLoading] = useState(false)

  async function submit() {
    try { createCampaignSchema.parse(form) } catch { alert('Fix form'); return }
    setLoading(true)
    const res = await fetch('/api/campaigns', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setLoading(false)
    if (!res.ok) { alert('Failed'); return }
    const { id } = await res.json()
    location.href = `/campaigns/${id}`
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h1 className="text-2xl font-semibold">Create Campaign</h1>
      {Object.entries({
        title: 'Title', story: 'Story', targetAmountKes: 'Target (KES)',
        payoutMethod: 'Payout Method (mpesa/bank)', payoutDestination: 'M-Pesa Number or Bank',
        scheduledPayoutDate: 'Scheduled Payout Date', deadline: 'Deadline',
        privacy: 'Privacy (public/private)', contactEmail: 'Contact Email', contactPhone: 'Contact Phone'
      }).map(([k, label]) => (
        <div key={k}>
          <label className="block text-sm mb-1">{label}</label>
          <input className="w-full border rounded p-2" value={(form as Record<string, string | number>)[k] as string | number} onChange={(e) => setForm(f => ({ ...f, [k]: e.target.value } as CampaignForm))} />
        </div>
      ))}
      <button onClick={submit} className="bg-black text-white rounded px-4 py-2" disabled={loading}>{loading ? 'Saving...' : 'Submit'}</button>
      <p className="text-xs text-gray-500">Campaign will be pending approval.</p>
    </div>
  )
}

