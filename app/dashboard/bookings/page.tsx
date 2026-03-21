import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

interface Booking {
  id: string
  ends_at: string
  barber_id: string | null
  barbers: { name: string } | null
}

export default async function BookingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/dashboard/login')

  const { data: member } = await supabase
    .from('salon_members')
    .select('salon_id')
    .eq('user_id', user.id)
    .single()

  const salonId = member?.salon_id

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).toISOString()
  const todayEnd   = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0).toISOString()

  let query = supabase
    .from('bookings')
    .select('id, ends_at, barber_id, barbers(name)')
    .gte('starts_at', todayStart)
    .lt('starts_at', todayEnd)

  if (salonId) query = query.eq('salon_id', salonId)

  const { data: raw } = await query

  const bookings: Booking[] = (raw ?? []).map((b: any) => ({
    ...b,
    barbers: Array.isArray(b.barbers) ? (b.barbers[0] ?? null) : (b.barbers ?? null),
  }))

  // Group by barber_id
  const map: Record<string, { name: string; bookings: Booking[] }> = {}
  bookings.forEach(b => {
    const key = b.barber_id ?? 'unknown'
    const name = b.barbers?.name ?? 'غير محدد'
    if (!map[key]) map[key] = { name, bookings: [] }
    map[key].bookings.push(b)
  })
  const groups = Object.entries(map).map(([barberId, { name, bookings: list }]) => ({ barberId, name, bookings: list }))

  const nowTime = new Date()

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto" style={{ backgroundColor: '#1a1a1a', minHeight: '100vh' }}>
      <h1 className="text-lg font-bold text-white px-1">حجوزات اليوم — بالحلاق</h1>
      {groups.length === 0 ? (
        <div className="rounded-2xl border border-white/10 p-8 text-center" style={{ backgroundColor: '#242424' }}>
          <p className="text-gray-500 text-sm">لا توجد حجوزات اليوم</p>
        </div>
      ) : (
        groups.map(({ barberId, name, bookings: bList }) => {
          const done = bList.filter(b => new Date(b.ends_at) < nowTime).length
          const pending = bList.filter(b => new Date(b.ends_at) >= nowTime).length
          return (
            <Link
              key={barberId}
              href={`/dashboard/bookings/${barberId}`}
              className="rounded-2xl border border-white/10 p-4 flex items-center justify-between block"
              style={{ backgroundColor: '#242424' }}
            >
              <p className="font-semibold text-white text-sm">{name}</p>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-900/40 text-green-400">{done} منجز</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-yellow-900/40 text-yellow-400">{pending} قيد الانتظار</span>
              </div>
            </Link>
          )
        })
      )}
    </div>
  )
}
