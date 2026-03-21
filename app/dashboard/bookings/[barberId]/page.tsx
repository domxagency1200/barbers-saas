import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

function formatTime(iso: string) {
  const d = new Date(iso)
  const h = d.getHours()
  const m = d.getMinutes().toString().padStart(2, '0')
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

  const now = new Date()
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const dateStr = date ?? todayStr
  const dateObj = new Date(dateStr)

  const dayStart = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 0, 0, 0).toISOString()
  const dayEnd   = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate() + 1, 0, 0, 0).toISOString()

  const { data: barber } = await supabase
    .from('barbers')
    .select('name')
    .eq('id', barberId)
    .single()

  const { data: raw } = await supabase
    .from('bookings')
    .select('id, starts_at, ends_at, customers(name, phone), services(name_ar)')
    .eq('barber_id', barberId)
    .gte('starts_at', dayStart)
    .lt('starts_at', dayEnd)
    .order('starts_at', { ascending: true })

  const bookings = (raw ?? []).map((b: any) => ({
    ...b,
    customers: Array.isArray(b.customers) ? (b.customers[0] ?? null) : (b.customers ?? null),
    services:  Array.isArray(b.services)  ? (b.services[0]  ?? null) : (b.services  ?? null),
  }))

  const nowTime = new Date()

  return (
    <div className="p-4 space-y-3 max-w-2xl mx-auto" style={{ backgroundColor: '#1a1a1a', minHeight: '100vh' }}>
      <h1 className="text-lg font-bold text-white px-1">{barber?.name ?? 'الحلاق'}</h1>
      {bookings.length === 0 ? (
        <div className="rounded-2xl border border-white/10 p-8 text-center" style={{ backgroundColor: '#242424' }}>
          <p className="text-gray-500 text-sm">لا توجد حجوزات اليوم</p>
        </div>
      ) : (
        bookings.map((b: any) => {
          const isDone = new Date(b.ends_at) < nowTime
          return (
            <div key={b.id} className="rounded-2xl border border-white/10 p-4 space-y-2" style={{ backgroundColor: '#242424' }}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-white truncate">{b.customers?.name ?? '—'}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${isDone ? 'bg-green-900/40 text-green-400' : 'bg-yellow-900/40 text-yellow-400'}`}>
                  {isDone ? 'منجز' : 'قيد الانتظار'}
                </span>
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
