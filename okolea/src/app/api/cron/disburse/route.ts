import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'

export const runtime = 'edge'

export async function GET() {
  const now = new Date().toISOString()
  const supabaseAdmin = getSupabaseAdmin()
  const { data: due } = await supabaseAdmin
    .from('campaigns')
    .select('*')
    .lte('scheduled_payout_date', now)
    .eq('status', 'approved')
    .eq('kyc_complete', true)

  const results: Array<{ campaign: string; status: 'success' | 'failed'; error?: string }> = []
  for (const c of due ?? []) {
    const available = c.raised_amount_kes
    if (available <= 0) continue
    const { data: disb } = await supabaseAdmin.from('disbursements').insert({
      campaign_id: c.id,
      amount_kes: available,
      method: c.payout_method,
      destination: c.payout_destination,
      status: 'processing',
    }).select('*').single()

    try {
      // TODO: integrate real payout
      await supabaseAdmin.from('disbursements').update({ status: 'success', provider: 'daraja', provider_ref: 'sandbox' }).eq('id', disb!.id)
      results.push({ campaign: c.id, status: 'success' })
    } catch (e) {
      const message = e instanceof Error ? e.message : 'unknown error'
      await supabaseAdmin.from('disbursements').update({ status: 'failed', attempt_count: (disb!.attempt_count ?? 0) + 1, last_attempt_at: new Date().toISOString() }).eq('id', disb!.id)
      results.push({ campaign: c.id, status: 'failed', error: message })
    }
  }

  return NextResponse.json({ processed: results.length, results })
}

