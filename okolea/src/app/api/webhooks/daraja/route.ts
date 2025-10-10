import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin()
  const raw = await req.text()
  const event = JSON.parse(raw)
  const stk = event?.Body?.stkCallback
  if (!stk) return NextResponse.json({ ok: true })

  const resultCode = stk.ResultCode
  const items: Array<{ Name: string; Value?: string | number }> = stk.CallbackMetadata?.Item ?? []
  const amount = Number(items.find((i) => i.Name === 'Amount')?.Value ?? 0)
  const receipt = items.find((i) => i.Name === 'MpesaReceiptNumber')?.Value as string | undefined
  const ref = stk.CheckoutRequestID
  const accountRef = stk.MerchantRequestID

  const idempKey = `daraja:${ref}`
  const { data: exists } = await supabaseAdmin.from('webhook_events').select('id').eq('id', idempKey).maybeSingle()
  if (!exists) {
    await supabaseAdmin.from('webhook_events').insert({ id: idempKey, provider: 'daraja' })

    const { data: donation } = await supabaseAdmin.from('donations').select('*').eq('id', accountRef).single()
    if (donation && resultCode === 0) {
      await supabaseAdmin.from('donations').update({ status: 'confirmed', provider_ref: receipt }).eq('id', donation.id)
      await supabaseAdmin.rpc('increment_campaign_raised', { cid: donation.campaign_id, delta: amount })
      await supabaseAdmin.from('ledger').insert({
        donation_id: donation.id,
        event: 'payment_confirmed',
        provider: 'daraja',
        provider_event_id: ref,
        amount_kes: amount,
      })
    }
  }

  return NextResponse.json({ ok: true })
}

