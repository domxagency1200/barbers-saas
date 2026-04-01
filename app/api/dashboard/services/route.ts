import { NextRequest, NextResponse } from 'next/server'
import { createClient as serverClient } from '@/lib/supabase/server'
import { createClient as supabaseAdmin } from '@supabase/supabase-js'

function adminClient() {
  return supabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const serviceId = searchParams.get('id')
  if (!serviceId) return NextResponse.json({ error: 'service id required' }, { status: 400 })

  const supabase = await serverClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = adminClient()

  // Verify service belongs to the requesting user's salon
  const { data: member } = await admin
    .from('salon_members')
    .select('salon_id')
    .eq('user_id', user.id)
    .single()

  if (!member?.salon_id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: service } = await admin
    .from('services')
    .select('id')
    .eq('id', serviceId)
    .eq('salon_id', member.salon_id)
    .single()

  if (!service) return NextResponse.json({ error: 'Service not found' }, { status: 404 })

  // Nullify service_id on all bookings to avoid FK constraint
  await admin.from('bookings').update({ service_id: null }).eq('service_id', serviceId)

  const { error } = await admin.from('services').delete().eq('id', serviceId)
  if (error) {
    console.error('[DELETE /api/dashboard/services]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
