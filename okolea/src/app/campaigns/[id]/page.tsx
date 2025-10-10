import { getSupabaseAdmin } from '@/lib/supabase/server'

export default async function CampaignDetail({ params }: { params: { id: string } }) {
  const supabaseAdmin = getSupabaseAdmin()
  const { data: c } = await supabaseAdmin.from('campaigns').select('*').eq('id', params.id).single()
  if (!c) return <div>Not found</div>
  const pct = Math.min(100, Math.round((c.raised_amount_kes / c.target_amount_kes) * 100))
  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="md:col-span-2 space-y-4">
        <h1 className="text-3xl font-bold">{c.title}</h1>
        <div className="text-gray-700 whitespace-pre-wrap">{c.story}</div>
        <div className="text-sm text-gray-500">Target: KES {c.target_amount_kes.toLocaleString()} | Raised: KES {c.raised_amount_kes.toLocaleString()} ({pct}%)</div>
      </div>
      <div>
        <DonateWidget campaignId={c.id} />
      </div>
    </div>
  )
}

function DonateWidget({ campaignId }: { campaignId: string }) {
  return (
    <form className="sticky top-4 space-y-3 border rounded p-4" action="/api/donations/initiate" method="post" onSubmit={(e) => {
      e.preventDefault()
      const form = e.target as HTMLFormElement
      const data = Object.fromEntries(new FormData(form).entries())
      fetch('/api/donations/initiate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        campaignId,
        amountKes: Number(data.amountKes),
        method: 'mpesa',
        donorEmail: String(data.donorEmail),
        donorPhone: String(data.donorPhone),
      }) }).then(r => r.ok ? alert('Check your phone for STK push') : alert('Failed'))
    }}>
      <input type="hidden" name="campaignId" value={campaignId} />
      <div>
        <label className="block text-sm mb-1">Amount (KES)</label>
        <input name="amountKes" defaultValue={100} className="w-full border rounded p-2" />
      </div>
      <div>
        <label className="block text-sm mb-1">Phone (07...)</label>
        <input name="donorPhone" className="w-full border rounded p-2" />
      </div>
      <div>
        <label className="block text-sm mb-1">Email</label>
        <input name="donorEmail" className="w-full border rounded p-2" />
      </div>
      <button className="w-full bg-black text-white rounded py-2">Donate Now</button>
    </form>
  )
}

