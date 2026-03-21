import { NextRequest, NextResponse } from 'next/server'
import { createClient as serverClient } from '@/lib/supabase/server'
import { createClient as adminSupabase } from '@supabase/supabase-js'

function adminClient() {
  return adminSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(req: NextRequest) {
  const supabase = await serverClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { barber_id, salon_id } = await req.json()
  if (!barber_id || !salon_id) {
    return NextResponse.json({ error: 'barber_id and salon_id required' }, { status: 400 })
  }

  // Verify the requesting user owns this salon
  const { data: member } = await supabase
    .from('salon_members')
    .select('salon_id')
    .eq('user_id', user.id)
    .single()

  if (!member || member.salon_id !== salon_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Fetch working hours for the salon
  const { data: wh } = await supabase
    .from('working_hours')
    .select('open_at, close_at')
    .eq('salon_id', salon_id)
    .single()

  const open = wh?.open_at?.slice(0, 5) ?? '08:00'
  const close = wh?.close_at?.slice(0, 5) ?? '22:00'

  const schedules = [0, 1, 2, 3, 4, 5, 6].map(day => ({
    barber_id,
    day_of_week: day,
    open_at: open,
    close_at: close,
    is_off: false,
  }))

  // Use service role to bypass RLS on barber_schedules
  const { error } = await adminClient().from('barber_schedules').insert(schedules)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
