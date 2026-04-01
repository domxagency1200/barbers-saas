import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateSlots } from '@/lib/availability'

// Service role client — bypasses RLS so public booking page can read schedules
function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const barber_id = searchParams.get('barber_id')
  const date = searchParams.get('date')
  const salon_id = searchParams.get('salon_id')
  const duration = parseInt(searchParams.get('duration') ?? '30', 10)
  const utcOffset = parseInt(searchParams.get('utcOffset') ?? '180', 10) // minutes, default UTC+3 (Saudi)

  if (!barber_id || !date) {
    return NextResponse.json(
      { error: 'barber_id and date are required' },
      { status: 400 }
    )
  }

  const supabase = adminClient()

  // Parse date parts directly to avoid UTC/local timezone mismatch
  const [y, m, d] = date.split('-').map(Number)
  const dayOfWeek = new Date(y, m - 1, d).getDay()

  const { data: schedule, error: scheduleError } = await supabase
    .from('barber_schedules')
    .select('open_at, close_at, is_off')
    .eq('barber_id', barber_id)
    .eq('day_of_week', dayOfWeek)
    .single()

  let openAt: string
  let closeAt: string

  if (scheduleError || !schedule || schedule.is_off) {
    // No explicit schedule — fall back to salon working_hours using salon_id param
    const sid = salon_id ?? null
    if (!sid) return NextResponse.json({ slots: [] })

    const { data: wh } = await supabase
      .from('working_hours')
      .select('open_at, close_at')
      .eq('salon_id', sid)
      .single()

    openAt = wh?.open_at?.slice(0, 5) ?? '08:00'
    closeAt = wh?.close_at?.slice(0, 5) ?? '22:00'
  } else {
    openAt = schedule.open_at.slice(0, 5)
    closeAt = schedule.close_at.slice(0, 5)
  }

  const dayStart = `${date}T00:00:00+00:00`
  const dayEnd = `${date}T23:59:59+00:00`

  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('starts_at, ends_at')
    .eq('barber_id', barber_id)
    .gte('starts_at', dayStart)
    .lte('starts_at', dayEnd)
    .in('status', ['pending', 'confirmed'])

  if (bookingsError) {
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 })
  }

  const allSlots = generateSlots(openAt, closeAt, duration)

  // Convert UTC offset to ms so we can treat slot local times as UTC for comparison
  const offsetMs = utcOffset * 60 * 1000
  const utcMidnight = new Date(`${date}T00:00:00+00:00`).getTime()

  const availableSlots = allSlots.filter((slot) => {
    const [h, m] = slot.split(':').map(Number)
    // Slot is in local time; convert to UTC epoch for comparison
    const slotStartMs = utcMidnight + (h * 60 + m) * 60000 - offsetMs
    const slotEndMs = slotStartMs + duration * 60000

    return !(bookings ?? []).some((b) => {
      const bStart = new Date(b.starts_at).getTime()
      const bEnd = new Date(b.ends_at).getTime()
      return bStart < slotEndMs && bEnd > slotStartMs
    })
  })

  const bookedSlots = allSlots.filter(s => !availableSlots.includes(s))

  return NextResponse.json({ slots: availableSlots, bookedSlots })
}
