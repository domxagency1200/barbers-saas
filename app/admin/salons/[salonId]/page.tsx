import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { revalidatePath } from 'next/cache'

function adminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

function formatDateTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('ar-SA', { dateStyle: 'short', timeStyle: 'short' })
}

export default async function SalonDetailPage({
  params,
}: {
  params: Promise<{ salonId: string }>
}) {
  const { salonId } = await params
  const supabase = await createClient()

  const [
    { data: salon },
    { data: barbers },
    { data: services },
    { data: rawBookings },
  ] = await Promise.all([
    supabase.from('salons').select('id, name, slug, city, plan, is_active, created_at, whatsapp_number').eq('id', salonId).single(),
    supabase.from('barbers').select('id, name').eq('salon_id', salonId).order('name'),
    supabase.from('services').select('id, name_ar, price, duration_min').eq('salon_id', salonId).order('name_ar'),
    supabase.from('bookings').select('id, starts_at, status, customers(name), services(name_ar), barbers(name)').eq('salon_id', salonId).order('starts_at', { ascending: false }).limit(50),
  ])

  if (!salon) notFound()

  const bookings = (rawBookings ?? []).map((b: any) => ({
    ...b,
    customers: Array.isArray(b.customers) ? b.customers[0] : b.customers,
    services: Array.isArray(b.services) ? b.services[0] : b.services,
    barbers: Array.isArray(b.barbers) ? b.barbers[0] : b.barbers,
  }))

  async function toggleActive() {
    'use server'
    const admin = adminClient()
    await admin.from('salons').update({ is_active: !salon!.is_active }).eq('id', salonId)
    revalidatePath(`/admin/salons/${salonId}`)
  }

  const isActive = salon.is_active !== false

  const cell = 'px-4 py-3 text-sm'

  return (
    <div className="min-h-screen p-6 md:p-10 space-y-8" style={{ backgroundColor: '#1a1a1a' }}>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{salon.name}</h1>
          <p className="text-sm text-gray-400 mt-1">{salon.slug} · {salon.city ?? '—'}</p>
        </div>
        <form action={toggleActive}>
          <button
            type="submit"
            className="rounded-xl px-5 py-2.5 text-sm font-bold border"
            style={isActive
              ? { backgroundColor: 'rgba(239,68,68,0.12)', color: '#f87171', borderColor: 'rgba(239,68,68,0.3)' }
              : { backgroundColor: 'rgba(34,197,94,0.12)', color: '#4ade80', borderColor: 'rgba(34,197,94,0.3)' }}
          >
            {isActive ? 'تعليق الصالون' : 'تفعيل الصالون'}
          </button>
        </form>
      </div>

      {/* Salon details */}
      <div className="rounded-2xl border border-white/10 p-5 grid gap-3 sm:grid-cols-2 md:grid-cols-3" style={{ backgroundColor: '#242424' }}>
        {[
          { label: 'الحالة', value: isActive ? 'نشط' : 'معلق', gold: isActive },
          { label: 'الخطة', value: salon.plan ?? 'free', gold: false },
          { label: 'واتساب', value: salon.whatsapp_number ?? '—', gold: false },
          { label: 'المدينة', value: salon.city ?? '—', gold: false },
          { label: 'تاريخ الإنشاء', value: new Date(salon.created_at).toLocaleDateString('ar-SA'), gold: false },
        ].map(item => (
          <div key={item.label}>
            <p className="text-xs text-gray-500 mb-1">{item.label}</p>
            <p className="text-sm font-semibold" style={{ color: item.gold ? '#D4A843' : 'white' }}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* Barbers */}
      <section>
        <h2 className="text-base font-bold text-white mb-3">الحلاقون ({barbers?.length ?? 0})</h2>
        <div className="rounded-2xl border border-white/10 overflow-hidden" style={{ backgroundColor: '#242424' }}>
          {!barbers?.length ? (
            <p className="text-center text-gray-500 text-sm py-8">لا يوجد حلاقون</p>
          ) : (
            <table className="w-full text-sm text-right">
              <thead><tr className="border-b border-white/10 text-gray-400 text-xs">
                <th className="px-4 py-3 font-semibold">الاسم</th>
              </tr></thead>
              <tbody>
                {barbers.map(b => (
                  <tr key={b.id} className="border-b border-white/5">
                    <td className="px-4 py-3 text-white">{b.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Services */}
      <section>
        <h2 className="text-base font-bold text-white mb-3">الخدمات ({services?.length ?? 0})</h2>
        <div className="rounded-2xl border border-white/10 overflow-hidden" style={{ backgroundColor: '#242424' }}>
          {!services?.length ? (
            <p className="text-center text-gray-500 text-sm py-8">لا توجد خدمات</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead><tr className="border-b border-white/10 text-gray-400 text-xs">
                  <th className={cell + ' font-semibold'}>الخدمة</th>
                  <th className={cell + ' font-semibold'}>السعر</th>
                  <th className={cell + ' font-semibold'}>المدة</th>
                </tr></thead>
                <tbody>
                  {services.map(s => (
                    <tr key={s.id} className="border-b border-white/5">
                      <td className={cell + ' text-white'}>{s.name_ar}</td>
                      <td className={cell + ' text-gray-400'}>{s.price} ر.س</td>
                      <td className={cell + ' text-gray-400'}>{s.duration_min} د</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Bookings */}
      <section>
        <h2 className="text-base font-bold text-white mb-3">الحجوزات ({bookings.length})</h2>
        <div className="rounded-2xl border border-white/10 overflow-hidden" style={{ backgroundColor: '#242424' }}>
          {!bookings.length ? (
            <p className="text-center text-gray-500 text-sm py-8">لا توجد حجوزات</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead><tr className="border-b border-white/10 text-gray-400 text-xs">
                  <th className={cell + ' font-semibold'}>العميل</th>
                  <th className={cell + ' font-semibold'}>الحلاق</th>
                  <th className={cell + ' font-semibold'}>الخدمة</th>
                  <th className={cell + ' font-semibold'}>الموعد</th>
                  <th className={cell + ' font-semibold'}>الحالة</th>
                </tr></thead>
                <tbody>
                  {bookings.map((b: any) => {
                    const done = new Date(b.starts_at) < new Date()
                    return (
                      <tr key={b.id} className="border-b border-white/5">
                        <td className={cell + ' text-white'}>{b.customers?.name ?? '—'}</td>
                        <td className={cell + ' text-gray-400'}>{b.barbers?.name ?? '—'}</td>
                        <td className={cell + ' text-gray-400'}>{b.services?.name_ar ?? '—'}</td>
                        <td className={cell + ' text-gray-400'}>{formatDateTime(b.starts_at)}</td>
                        <td className={cell}>
                          <span className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                            style={done
                              ? { backgroundColor: 'rgba(34,197,94,0.12)', color: '#4ade80' }
                              : { backgroundColor: 'rgba(234,179,8,0.12)', color: '#facc15' }}>
                            {done ? 'منجز' : 'قيد الانتظار'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

    </div>
  )
}
