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
    .select('id, name, whatsapp_number, city')
    .eq('slug', slug)
    .single()

  if (error || !salon) notFound()

  const [{ data: barbers }, { data: services }] = await Promise.all([
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
  ])

  return (
    <SalonPage
      salon={salon}
      barbers={barbers ?? []}
      services={services ?? []}
      slug={slug}
    />
  )
}
