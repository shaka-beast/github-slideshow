import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { donationInitSchema } from '@/lib/validation'
import { rateLimit } from '@/lib/security'
import { initiateStkPush } from '@/lib/payments/mpesa'

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
  const rl = await rateLimit(ip, 'donate')
  if (rl && !rl.success) return NextResponse.json({ error: 'Rate limited' }, { status: 429 })

  const body = await req.json()
  const parsed = donationInitSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  const { campaignId, amountKes, donorEmail, donorPhone, donorName, isAnonymous, coverFees, method } = parsed.data

  const supabaseAdmin = getSupabaseAdmin()
  const { data: campaign } = await supabaseAdmin.from('campaigns').select('*').eq('id', campaignId).single()
  if (!campaign || campaign.status !== 'approved') return NextResponse.json({ error: 'Campaign not available' }, { status: 400 })

  const { data: donation, error } = await supabaseAdmin.from('donations').insert({
    campaign_id: campaignId,
    donor_email: donorEmail,
    donor_phone: donorPhone,
    donor_name: donorName,
    amount_kes: amountKes,
    method,
    is_anonymous: isAnonymous,
    cover_fees: coverFees,
    status: 'pending',
  }).select('*').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  if (method === 'mpesa') {
    const cb = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/daraja`
    const res = await initiateStkPush({ phone: donorPhone, amountKes, accountRef: donation.id, callbackUrl: cb })
    return NextResponse.json({ status: 'pending', provider: 'mpesa', ref: res.CheckoutRequestID })
  }

  return NextResponse.json({ status: 'pending', message: 'Card flows handled client-side redirect' })
}

