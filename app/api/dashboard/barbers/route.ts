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

export async function POST(req: NextRequest) {
  const supabase = await serverClient()

  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Always resolve salon_id server-side from salon_members
  const { data: member } = await supabase
    .from('salon_members')
    .select('salon_id')
    .eq('user_id', user.id)
    .single()

  if (!member?.salon_id) {
    return NextResponse.json({ error: 'No salon linked to this account' }, { status: 403 })
  }

  const salonId = member.salon_id
  const { name, avatar_url } = await req.json()

  if (!name?.trim()) {
    return NextResponse.json({ error: 'اسم الحلاق مطلوب' }, { status: 400 })
  }

  const admin = adminClient()

  // Insert barber with salon_id always set from server
  const { data: barber, error: barberError } = await admin
    .from('barbers')
    .insert({
      name: name.trim(),
      salon_id: salonId,
      is_available: true,
      ...(avatar_url?.trim() ? { avatar_url: avatar_url.trim() } : {}),
    })
    .select('id, name, avatar_url, is_available')
    .single()

  if (barberError) {
    return NextResponse.json({ error: barberError.message }, { status: 500 })
  }

  // Fetch salon working hours for schedule defaults
  const { data: wh } = await supabase
    .from('working_hours')
    .select('open_at, close_at')
    .eq('salon_id', salonId)
    .single()

  const open = wh?.open_at?.slice(0, 5) ?? '08:00'
  const close = wh?.close_at?.slice(0, 5) ?? '22:00'

  // Insert 7-day default schedule
  await admin.from('barber_schedules').insert(
    [0, 1, 2, 3, 4, 5, 6].map(day => ({
      barber_id: barber.id,
      day_of_week: day,
      open_at: open,
      close_at: close,
      is_off: false,
    }))
  )

  return NextResponse.json({ barber }, { status: 201 })
}
