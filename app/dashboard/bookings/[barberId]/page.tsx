import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import DeleteBookingButton from '@/components/dashboard/DeleteBookingButton'
import EditBookingModal from '@/components/dashboard/EditBookingModal'
import RefundBookingButton from '@/components/dashboard/RefundBookingButton'

function formatTime(iso: string) {
  const d = new Date(iso)
  const h = (d.getUTCHours() + 3) % 24  // UTC → Riyadh (UTC+3)
  const m = d.getUTCMinutes().toString().padStart(2, '0')
  const period = h >= 12 ? 'م' : 'ص'
  const hour = h % 12 || 12
  return `${hour}:${m} ${period}`
}

export default async function BarberBookingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ barberId: string }>
  searchParams: Promise<{ date?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/dashboard/login')

  const { barberId } = await params
  const { date } = await searchParams

  // Compute today's date in Riyadh time (UTC+3) — server runs UTC on Vercel
  const riyadhNow = new Date(Date.now() + 3 * 60 * 60 * 1000)
  const todayStr = `${riyadhNow.getUTCFullYear()}-${String(riyadhNow.getUTCMonth() + 1).padStart(2, '0')}-${String(riyadhNow.getUTCDate()).padStart(2, '0')}`
  const dateStr = date ?? todayStr
  const isFiltered = !!date

  // When filtered: show only that day. When not filtered: show next 30 days from today.
  const rangeStart = isFiltered
    ? new Date(`${dateStr}T00:00:00+03:00`).toISOString()
    : new Date(`${todayStr}T00:00:00+03:00`).toISOString()
  const rangeEnd = isFiltered
    ? new Date(`${dateStr}T23:59:59+03:00`).toISOString()
    : new Date(riyadhNow.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()

  const { data: barber } = await supabase
    .from('barbers')
    .select('name')
    .eq('id', barberId)
    .single()

  const { data: raw } = await supabase
    .from('bookings')
    .select('id, starts_at, ends_at, customers(name, phone), services(name_ar, duration_min)')
    .eq('barber_id', barberId)
    .gte('starts_at', rangeStart)
    .lte('starts_at', rangeEnd)
    .order('starts_at', { ascending: true })

  const bookings = (raw ?? []).map((b: any) => ({
    ...b,
    customers: Array.isArray(b.customers) ? (b.customers[0] ?? null) : (b.customers ?? null),
    services:  Array.isArray(b.services)  ? (b.services[0]  ?? null) : (b.services  ?? null),
  }))

  async function deleteBooking(bookingId: string) {
    'use server'
    const supabase = await createClient()
    await supabase.from('bookings').delete().eq('id', bookingId)
    revalidatePath(`/dashboard/bookings/${barberId}`)
  }

  async function rescheduleBooking(bookingId: string, newStartsAt: string, newEndsAt: string) {
    'use server'
    const supabase = await createClient()
    await supabase.from('bookings').update({ starts_at: newStartsAt, ends_at: newEndsAt }).eq('id', bookingId)
    revalidatePath(`/dashboard/bookings/${barberId}`)
  }

  async function refundBooking(bookingId: string) {
    'use server'
    const supabase = await createClient()
    await supabase.from('bookings').update({ payment_status: 'refunded', status: 'cancelled' }).eq('id', bookingId)
    revalidatePath(`/dashboard/bookings/${barberId}`)
  }

  const nowTime = new Date()

  return (
    <div className="p-4 space-y-3 max-w-2xl mx-auto" style={{ backgroundColor: '#1a1a1a', minHeight: '100vh' }}>
      <div className="px-1">
        <h1 className="text-lg font-bold text-white">{barber?.name ?? 'الحلاق'}</h1>
        <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
          {isFiltered ? `حجوزات ${dateStr}` : 'الحجوزات القادمة — 30 يوم'}
        </p>
      </div>
      {bookings.length === 0 ? (
        <div className="rounded-2xl border border-white/10 p-8 text-center" style={{ backgroundColor: '#242424' }}>
          <p className="text-gray-500 text-sm">{isFiltered ? 'لا توجد حجوزات في هذا اليوم' : 'لا توجد حجوزات قادمة'}</p>
        </div>
      ) : (
        bookings.map((b: any) => {
          const isDone = new Date(b.ends_at) < nowTime
          const durationMin = b.services?.duration_min ?? 30
          // Derive booking date in Riyadh time for EditModal
          const bDate = new Date(b.starts_at)
          const bRiyadh = new Date(bDate.getTime() + 3 * 60 * 60 * 1000)
          const bDateStr = `${bRiyadh.getUTCFullYear()}-${String(bRiyadh.getUTCMonth() + 1).padStart(2, '0')}-${String(bRiyadh.getUTCDate()).padStart(2, '0')}`
          return (
            <div key={b.id} className="rounded-2xl border border-white/10 p-4 space-y-2" style={{ backgroundColor: '#242424' }}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-white truncate">{b.customers?.name ?? '—'}</p>
                <div className="flex items-center gap-2 shrink-0">
                  {!isFiltered && (
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{bDateStr}</span>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isDone ? 'bg-green-900/40 text-green-400' : 'bg-yellow-900/40 text-yellow-400'}`}>
                    {isDone ? 'منجز' : 'قيد الانتظار'}
                  </span>
                  <EditBookingModal
                    bookingId={b.id}
                    barberId={barberId}
                    date={bDateStr}
                    durationMin={durationMin}
                    currentStartsAt={b.starts_at}
                    onReschedule={rescheduleBooking}
                  />
                  <RefundBookingButton onRefund={refundBooking.bind(null, b.id)} />
                  <DeleteBookingButton onDelete={deleteBooking.bind(null, b.id)} />
                </div>
              </div>
              <p className="text-xs text-gray-500">{b.customers?.phone ?? '—'}</p>
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-gray-400">{b.services?.name_ar ?? '—'}</p>
                <span className="text-xs text-gray-300">{formatTime(b.starts_at)}</span>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
