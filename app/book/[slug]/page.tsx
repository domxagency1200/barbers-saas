import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import BookingFlow from '@/components/booking/BookingFlow'

export default async function BookingPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: salon, error } = await supabase
    .from('salons')
    .select('id, name, services(id, name_ar, name_en, price, duration_min), barbers(id, name)')
    .eq('slug', slug)
    .single()

  if (error || !salon) {
    console.log('error:', error, 'salon:', salon)
    notFound()
  }

  const { name, services, barbers } = salon as any

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{name}</h1>
          <p className="text-sm text-gray-500">Book your appointment below</p>
        </div>
      </div>

      {/* Booking flow */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <BookingFlow
          salonId={salon.id}
          services={services ?? []}
          barbers={barbers ?? []}
        />
      </div>
    </main>
  )
}
