import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import DatePicker from '@/components/dashboard/DatePicker'

interface Booking {
  id: string
  ends_at: string
  barber_id: string | null
}

export default async function BookingsPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/dashboard/login')

  const { data: member } = await supabase
    .from('salon_members')
    .select('salon_id')
    .eq('user_id', user.id)
    .single()

  const salonId = member?.salon_id

  const { date } = await searchParams
  const now = new Date()
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const dateStr = date ?? todayStr
  const dateObj = new Date(dateStr)

  const dayStart = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 0, 0, 0).toISOString()
  const dayEnd   = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate() + 1, 0, 0, 0).toISOString()

  const [{ data: barbersRaw }, { data: bookingsRaw }] = await Promise.all([
    salonId
      ? supabase.from('barbers').select('id, name').eq('salon_id', salonId).order('name')
      : supabase.from('barbers').select('id, name').order('name'),
    salonId
      ? supabase.from('bookings').select('id, ends_at, barber_id').gte('starts_at', dayStart).lt('starts_at', dayEnd).eq('salon_id', salonId)
      : supabase.from('bookings').select('id, ends_at, barber_id').gte('starts_at', dayStart).lt('starts_at', dayEnd),
  ])

  const barbers: { id: string; name: string }[] = barbersRaw ?? []
  const bookings: Booking[] = bookingsRaw ?? []

  const bookingsByBarber: Record<string, Booking[]> = {}
  bookings.forEach(b => {
    const key = b.barber_id ?? ''
    if (!bookingsByBarber[key]) bookingsByBarber[key] = []
    bookingsByBarber[key].push(b)
  })

  const nowTime = new Date()

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto" style={{ backgroundColor: '#1a1a1a', minHeight: '100vh' }}>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-white">حجوزات اليوم — بالحلاق</h1>
        <DatePicker value={dateStr} />
      </div>
      {barbers.length === 0 ? (
        <div className="rounded-2xl border border-white/10 p-8 text-center" style={{ backgroundColor: '#242424' }}>
          <p className="text-gray-500 text-sm">لا يوجد حلاقون</p>
        </div>
      ) : (
        barbers.map(({ id, name }) => {
          const bList = bookingsByBarber[id] ?? []
          const done = bList.filter(b => new Date(b.ends_at) < nowTime).length
          const pending = bList.filter(b => new Date(b.ends_at) >= nowTime).length
          return (
            <Link
              key={id}
              href={`/dashboard/bookings/${id}`}
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
