import { createClient } from '@/lib/supabase/server'

export default async function AdminPage() {
  const supabase = await createClient()

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString()

  const [
    { count: salonCount },
    { count: todayBookings },
    { data: monthlyBookings },
  ] = await Promise.all([
    supabase.from('salons').select('*', { count: 'exact', head: true }),
    supabase.from('bookings').select('*', { count: 'exact', head: true }).gte('starts_at', todayStart).lt('starts_at', todayEnd),
    supabase.from('bookings').select('services(price)').gte('starts_at', monthStart).lt('starts_at', monthEnd),
  ])

  const monthlyRevenue = (monthlyBookings ?? []).reduce((sum, b: any) => {
    const price = Array.isArray(b.services) ? (b.services[0]?.price ?? 0) : (b.services?.price ?? 0)
    return sum + price
  }, 0)

  const stats = [
    { label: 'إجمالي الصالونات', value: salonCount ?? 0, suffix: '' },
    { label: 'حجوزات اليوم', value: todayBookings ?? 0, suffix: '' },
    { label: 'إيرادات الشهر', value: monthlyRevenue.toLocaleString('ar-SA'), suffix: ' ر.س' },
  ]

  return (
    <div className="min-h-screen p-6 md:p-10" style={{ backgroundColor: '#1a1a1a' }}>
      <h1 className="text-2xl font-bold text-white mb-8">لوحة تحكم المشرف</h1>
      <div className="grid gap-5 sm:grid-cols-3">
        {stats.map(s => (
          <div key={s.label} className="rounded-2xl border border-white/10 p-6 space-y-2" style={{ backgroundColor: '#242424' }}>
            <p className="text-sm text-gray-400">{s.label}</p>
            <p className="text-3xl font-extrabold" style={{ color: '#D4A843' }}>
              {s.value}{s.suffix}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
