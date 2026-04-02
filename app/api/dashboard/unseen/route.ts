import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function getSalonId(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase
    .from('salon_members')
    .select('salon_id')
    .eq('user_id', userId)
    .single()
  return data?.salon_id ?? null
}

// GET — count of unseen bookings for this salon
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ count: 0 })

  const salonId = await getSalonId(supabase, user.id)
  if (!salonId) return NextResponse.json({ count: 0 })

  const { count } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('salon_id', salonId)
    .eq('seen', false)

  return NextResponse.json({ count: count ?? 0 })
}

// POST — mark all unseen bookings as seen
export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false })

  const salonId = await getSalonId(supabase, user.id)
  if (!salonId) return NextResponse.json({ ok: false })

  await supabase
    .from('bookings')
    .update({ seen: true })
    .eq('salon_id', salonId)
    .eq('seen', false)

  return NextResponse.json({ ok: true })
}
