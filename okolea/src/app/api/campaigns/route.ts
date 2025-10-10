import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { createCampaignSchema } from '@/lib/validation'
import { rateLimit } from '@/lib/security'

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
  const rl = await rateLimit(ip, 'create-campaign')
  if (rl && !rl.success) return NextResponse.json({ error: 'Rate limited' }, { status: 429 })

  const json = await req.json()
  const parsed = createCampaignSchema.safeParse(json)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const supabaseAdmin = getSupabaseAdmin()
  const { data, error } = await supabaseAdmin
    .from('campaigns')
    .insert({
      ...parsed.data,
      owner_id: null,
      status: 'pending',
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ id: data.id }, { status: 201 })
}

