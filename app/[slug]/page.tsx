import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import SalonPage from './SalonPage'

export default async function SlugPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: salon, error } = await supabase
    .from('salons')
    .select('id, name, whatsapp_number, city, is_active, meta')
    .eq('slug', slug)
    .single()

  if (error || !salon) notFound()

  if (salon.is_active === false) {
    return (
      <div style={{ backgroundColor: '#0f0f0f', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1rem', fontFamily: 'sans-serif' }}>هذا الموقع غير متاح حالياً</p>
      </div>
    )
  }

  const [{ data: barbers }, { data: services }, { data: wh }] = await Promise.all([
    supabase
      .from('barbers')
      .select('id, name')
      .eq('salon_id', salon.id)
      .order('name'),
    supabase
      .from('services')
      .select('id, name_ar, price, duration_min')
      .eq('salon_id', salon.id)
      .eq('is_active', true)
      .order('name_ar'),
    supabase
      .from('working_hours')
      .select('open_at, close_at')
      .eq('salon_id', salon.id)
      .single(),
  ])

  const workingHours = wh
    ? `${wh.open_at.slice(0, 5)}–${wh.close_at.slice(0, 5)}`
    : '08:00–22:00'

  return (
    <SalonPage
      salon={{ ...salon, working_hours: workingHours }}
      barbers={barbers ?? []}
      services={services ?? []}
      slug={slug}
    />
  )
}
